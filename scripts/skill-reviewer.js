/**
 * skill-reviewer.js — 3-Agent Verifier Node
 * 3个审核节点并行评审，共识决策，取代单AI审核
 *
 * 节点：
 *   #1 llama-3.3-70b  (NVIDIA NIM)
 *   #2 qwen-max       (百炼 / Dashscope)
 *   #3 glm-4-flash    (百炼 / Dashscope)
 *
 * 共识规则：
 *   - 至少2/3通过 + avg_score ≥ 60  → approve
 *   - avg_score < 30                 → reject
 *   - 任意节点有 risk_flags          → needs_review
 *   - 其余                           → needs_review
 *   - 有效节点 < 2                   → 跳过（稍后重试）
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY
const NVIDIA_API_KEY   = process.env.NVIDIA_API_KEY
const BAILIAN_API_KEY  = process.env.BAILIAN_API_KEY || process.env.DASHSCOPE_API_KEY
const BAILIAN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const NVIDIA_BASE_URL  = 'https://integrate.api.nvidia.com/v1'

const INTERVAL_MS           = 5 * 60 * 1000
const AUTO_APPROVE_THRESHOLD = 60
const AUTO_REJECT_THRESHOLD  = 30
const MIN_VERIFIERS          = 2   // 有效节点不足则跳过

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── 审核节点定义 ──────────────────────────────────────────────
const VERIFIERS = [
  {
    id: 'llama-3.3',
    label: 'llama-3.3-70b (NVIDIA)',
    call: (prompt) => callOpenAICompat(
      `${NVIDIA_BASE_URL}/chat/completions`,
      { Authorization: `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
      'meta/llama-3.3-70b-instruct',
      prompt
    ),
    available: () => !!NVIDIA_API_KEY
  },
  {
    id: 'qwen-max',
    label: 'qwen-max (百炼)',
    call: (prompt) => callOpenAICompat(
      `${BAILIAN_BASE_URL}/chat/completions`,
      { Authorization: `Bearer ${BAILIAN_API_KEY}`, 'Content-Type': 'application/json' },
      'qwen-max',
      prompt
    ),
    available: () => !!BAILIAN_API_KEY
  },
  {
    id: 'glm-4-flash',
    label: 'glm-4-flash (百炼)',
    call: (prompt) => callOpenAICompat(
      `${BAILIAN_BASE_URL}/chat/completions`,
      { Authorization: `Bearer ${BAILIAN_API_KEY}`, 'Content-Type': 'application/json' },
      'glm-4-flash',
      prompt
    ),
    available: () => !!BAILIAN_API_KEY
  }
]

// ── 工具函数 ──────────────────────────────────────────────────
function log(msg) {
  console.log(`[skill-reviewer] ${new Date().toISOString()} ${msg}`)
}

function extractJson(text) {
  if (!text) return null
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) { try { return JSON.parse(fenced[1].trim()) } catch {} }
  try { return JSON.parse(text.trim()) } catch {}
  const a = text.indexOf('{'), b = text.lastIndexOf('}')
  if (a !== -1 && b > a) { try { return JSON.parse(text.slice(a, b + 1)) } catch {} }
  return null
}

async function callOpenAICompat(url, headers, model, prompt) {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'You are a strict skill quality reviewer. Return JSON only, no extra text.' },
        { role: 'user', content: prompt }
      ]
    })
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  const payload = await res.json()
  const content = payload?.choices?.[0]?.message?.content || ''
  const parsed = extractJson(content)
  if (!parsed) throw new Error('Non-JSON response: ' + content.slice(0, 200))
  return parsed
}

// ── Prompt ────────────────────────────────────────────────────
function buildPrompt(submission) {
  return [
    'You are reviewing a skill submission for swrm.work — an AI agent capability marketplace.',
    'Output ONLY valid JSON, no explanation, no markdown.',
    '',
    'Required output:',
    '{',
    '  "decision": "approve" | "reject" | "needs_review",',
    '  "quality_score": <integer 0-100>,',
    '  "duplicate_risk": <integer 0-100>,',
    '  "risk_flags": [],',
    '  "summary": "<one sentence reason>"',
    '}',
    '',
    'Criteria:',
    '1. Clearly describes what problem it solves',
    '2. logic_payload is specific and actionable (not generic advice)',
    '3. Has genuine reuse value for other agents',
    '4. Free of spam, harmful content, or security risks',
    '5. Not a near-duplicate of a trivially common skill',
    '',
    'Submission:',
    JSON.stringify({
      name: submission.name,
      summary: submission.summary,
      category: submission.category,
      logic_payload: submission.logic_payload
    }, null, 2)
  ].join('\n')
}

// ── 共识逻辑 ──────────────────────────────────────────────────
function computeConsensus(results) {
  // results: [{ verifier_id, label, verdict }]  — 仅成功节点
  const scores   = results.map(r => Number(r.verdict.quality_score) || 0)
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length
  const approves = results.filter(r => r.verdict.decision === 'approve').length
  const rejects  = results.filter(r => r.verdict.decision === 'reject').length
  const hasRisk  = results.some(r => r.verdict.risk_flags?.length > 0)

  let decision
  if (hasRisk) {
    decision = 'needs_review'
  } else if (avgScore >= AUTO_APPROVE_THRESHOLD && approves >= Math.ceil(results.length / 2)) {
    decision = 'approve'
  } else if (avgScore < AUTO_REJECT_THRESHOLD && rejects >= Math.ceil(results.length / 2)) {
    decision = 'reject'
  } else {
    decision = 'needs_review'
  }

  return { decision, avgScore: Math.round(avgScore), approves, rejects, hasRisk }
}

// ── DB 操作 ───────────────────────────────────────────────────
function buildReviewNote(consensus, results, errorIds) {
  const verifierSummary = results.map(r =>
    `${r.label}: ${r.verdict.decision}(${r.verdict.quality_score})`
  ).join(' | ')
  const errors = errorIds.length ? ` | failed: ${errorIds.join(',')}` : ''
  return `3-Verifier consensus: ${consensus.decision} | avg=${consensus.avgScore} | ${verifierSummary}${errors}`
}

async function approve(submission, consensus, results, errorIds) {
  const { error } = await supabase.from('skills').insert([{
    title: submission.name,
    description: submission.summary,
    logic_payload: submission.logic_payload,
    category: submission.category || 'general',
    access_tier: 'free',
    status: 'active'
  }])
  if (error) throw error

  await supabase.from('skill_submissions').update({
    status: 'approved',
    reviewed_at: new Date().toISOString(),
    review_notes: buildReviewNote(consensus, results, errorIds)
  }).eq('id', submission.id)

  log(`APPROVED: "${submission.name}" avg=${consensus.avgScore} (${consensus.approves}/${results.length} approve)`)
}

async function reject(submission, consensus, results, errorIds) {
  await supabase.from('skill_submissions').update({
    status: 'rejected',
    reviewed_at: new Date().toISOString(),
    review_notes: buildReviewNote(consensus, results, errorIds)
  }).eq('id', submission.id)

  log(`REJECTED: "${submission.name}" avg=${consensus.avgScore} (${consensus.rejects}/${results.length} reject)`)
}

async function flagNeedsReview(submission, consensus, results, errorIds) {
  await supabase.from('skill_submissions').update({
    status: 'needs_review',
    reviewed_at: new Date().toISOString(),
    review_notes: buildReviewNote(consensus, results, errorIds)
  }).eq('id', submission.id)

  log(`NEEDS_REVIEW: "${submission.name}" avg=${consensus.avgScore} hasRisk=${consensus.hasRisk}`)
}

// ── 主循环 ────────────────────────────────────────────────────
async function runReview() {
  const activeVerifiers = VERIFIERS.filter(v => v.available())
  if (activeVerifiers.length < MIN_VERIFIERS) {
    log(`ERROR: Only ${activeVerifiers.length} verifier(s) available, need at least ${MIN_VERIFIERS}`)
    return
  }

  const { data: pending, error } = await supabase
    .from('skill_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10)

  if (error) { log('DB error: ' + error.message); return }
  if (!pending || pending.length === 0) { log('No pending submissions'); return }

  log(`Found ${pending.length} pending — using ${activeVerifiers.length} verifiers: ${activeVerifiers.map(v => v.id).join(', ')}`)

  for (const submission of pending) {
    try {
      log(`Reviewing: "${submission.name}"`)
      const prompt = buildPrompt(submission)

      // 并行调用所有节点
      const settled = await Promise.allSettled(
        activeVerifiers.map(v => v.call(prompt).then(verdict => ({ verifier_id: v.id, label: v.label, verdict })))
      )

      const results  = settled.filter(r => r.status === 'fulfilled').map(r => r.value)
      const errorIds = settled
        .map((r, i) => r.status === 'rejected' ? activeVerifiers[i].id : null)
        .filter(Boolean)

      if (errorIds.length) log(`Verifier errors: ${errorIds.join(', ')}`)

      // 有效节点不足 → 跳过
      if (results.length < MIN_VERIFIERS) {
        log(`SKIP: "${submission.name}" — only ${results.length} valid response(s), need ${MIN_VERIFIERS}`)
        continue
      }

      // 打印各节点结果
      results.forEach(r => {
        log(`  [${r.verifier_id}] ${r.verdict.decision} score=${r.verdict.quality_score} risk=${r.verdict.duplicate_risk}`)
      })

      const consensus = computeConsensus(results)
      log(`  Consensus: ${consensus.decision} avgScore=${consensus.avgScore}`)

      if (consensus.decision === 'approve') {
        await approve(submission, consensus, results, errorIds)
      } else if (consensus.decision === 'reject') {
        await reject(submission, consensus, results, errorIds)
      } else {
        await flagNeedsReview(submission, consensus, results, errorIds)
      }

    } catch (err) {
      log(`ERROR reviewing "${submission.name}": ${err.message}`)
    }
  }
}

log(`Skill reviewer started — 3-Verifier node (llama-3.3 + qwen-max + glm-4-flash)`)
runReview()
setInterval(runReview, INTERVAL_MS)
