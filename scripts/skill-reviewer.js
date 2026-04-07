/**
 * skill-reviewer.js
 * PM2 process: auto-reviews pending skill_submissions using llama-3.3-70b-instruct (NVIDIA NIM)
 * Runs every 5 minutes. approve → insert into skills. reject → mark rejected.
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct'
const INTERVAL_MS = 5 * 60 * 1000  // 5 minutes
const AUTO_APPROVE_THRESHOLD = 60   // quality_score >= 60 → approve
const AUTO_REJECT_THRESHOLD = 30    // quality_score < 30 → reject, else needs_review

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function log(msg) {
  console.log(`[skill-reviewer] ${new Date().toISOString()} ${msg}`)
}

function buildPrompt(submission) {
  return [
    'You are the skill reviewer for swrm.work — an AI agent capability marketplace.',
    'Review this submitted skill. Output JSON only, no extra text.',
    '',
    'Output format:',
    '{',
    '  "decision": "approve" | "reject" | "needs_review",',
    '  "quality_score": 0-100,',
    '  "duplicate_risk": 0-100,',
    '  "risk_flags": ["..."],',
    '  "summary": "one sentence reason"',
    '}',
    '',
    'Review criteria:',
    '1. Does it clearly describe what problem the skill solves?',
    '2. Is the injection_prompt specific enough to be actionable?',
    '3. Does it have genuine inheritance value — not just generic advice?',
    '4. Is it free of low-quality filler, spam, or harmful content?',
    '5. Is it potentially a near-duplicate of a common skill?',
    '',
    'Submitted skill:',
    JSON.stringify({
      name: submission.name,
      summary: submission.summary,
      category: submission.category,
      injection_prompt: submission.injection_prompt,
    }, null, 2)
  ].join('\n')
}

async function callNvidia(prompt) {
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'You are a strict skill reviewer. Return JSON only.' },
        { role: 'user', content: prompt }
      ]
    })
  })
  if (!res.ok) throw new Error(`NVIDIA ${res.status}: ${await res.text()}`)
  const payload = await res.json()
  const content = payload?.choices?.[0]?.message?.content || ''

  // extract JSON
  const fenced = content.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) { try { return JSON.parse(fenced[1].trim()) } catch {} }
  try { return JSON.parse(content.trim()) } catch {}
  const a = content.indexOf('{'), b = content.lastIndexOf('}')
  if (a !== -1 && b > a) { try { return JSON.parse(content.slice(a, b + 1)) } catch {} }
  throw new Error('Response was not valid JSON: ' + content.slice(0, 200))
}

async function approve(submission, review) {
  const { error } = await supabase.from('skills').insert([{
    title: submission.name,
    description: submission.summary,
    injection_prompt: submission.injection_prompt,
    category: submission.category || 'general',
    access_tier: 'free',
    status: 'active'
  }])
  if (error) throw error

  await supabase.from('skill_submissions').update({
    status: 'approved',
    reviewed_at: new Date().toISOString(),
    review_notes: `Auto-approved by llama-3.3 | score=${review.quality_score} | ${review.summary}`
  }).eq('id', submission.id)

  log(`APPROVED: "${submission.name}" (score=${review.quality_score})`)
}

async function reject(submission, review) {
  await supabase.from('skill_submissions').update({
    status: 'rejected',
    reviewed_at: new Date().toISOString(),
    review_notes: `Auto-rejected by llama-3.3 | score=${review.quality_score} | ${review.summary}`
  }).eq('id', submission.id)

  log(`REJECTED: "${submission.name}" (score=${review.quality_score}) — ${review.summary}`)
}

async function needsReview(submission, review) {
  await supabase.from('skill_submissions').update({
    status: 'needs_review',
    reviewed_at: new Date().toISOString(),
    review_notes: `Flagged by llama-3.3 | score=${review.quality_score} | ${review.summary}`
  }).eq('id', submission.id)

  log(`NEEDS_REVIEW: "${submission.name}" (score=${review.quality_score})`)
}

async function runReview() {
  if (!NVIDIA_API_KEY) {
    log('ERROR: NVIDIA_API_KEY not set, skipping')
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

  log(`Found ${pending.length} pending submission(s)`)

  for (const submission of pending) {
    try {
      log(`Reviewing: "${submission.name}"`)
      const review = await callNvidia(buildPrompt(submission))
      log(`llama-3.3 verdict: ${review.decision} score=${review.quality_score} risk=${review.duplicate_risk}`)

      // flag security risks regardless of score
      if (review.risk_flags?.length > 0) {
        await needsReview(submission, review)
        continue
      }

      const score = Number(review.quality_score || 0)
      if (score >= AUTO_APPROVE_THRESHOLD) {
        await approve(submission, review)
      } else if (score < AUTO_REJECT_THRESHOLD) {
        await reject(submission, review)
      } else {
        await needsReview(submission, review)
      }
    } catch (err) {
      log(`ERROR reviewing "${submission.name}": ${err.message}`)
    }
  }
}

// run immediately on start, then every 5 minutes
log('Skill reviewer started — llama-3.3 on NVIDIA NIM')
runReview()
setInterval(runReview, INTERVAL_MS)
