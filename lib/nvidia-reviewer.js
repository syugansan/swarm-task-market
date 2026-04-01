const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
const NVIDIA_REVIEW_MODEL = process.env.NVIDIA_REVIEW_MODEL || 'meta/llama-3.3-70b-instruct'
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY

function safeParseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractJsonBlock(content) {
  if (!content) return null

  const fenced = content.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    const parsed = safeParseJson(fenced[1].trim())
    if (parsed) return parsed
  }

  const direct = safeParseJson(content.trim())
  if (direct) return direct

  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return safeParseJson(content.slice(firstBrace, lastBrace + 1))
  }

  return null
}

function buildPrompt(submission) {
  return [
    '你是 SwarmWork 的技能审核员。',
    '你的任务是审核一条待入库技能，判断它是否应该通过、拒绝，或进入人工复核。',
    '请只输出 JSON，不要输出额外解释。',
    '',
    '输出格式：',
    '{',
    '  "decision": "approve" | "reject" | "needs_review",',
    '  "quality_score": 0-100,',
    '  "duplicate_risk": 0-100,',
    '  "risk_flags": ["..."],',
    '  "category_suggestion": "string",',
    '  "summary": "一句话说明判断原因",',
    '  "strengths": ["..."],',
    '  "issues": ["..."]',
    '}',
    '',
    '审核标准：',
    '1. 是否说清技能解决什么问题',
    '2. 是否具备可继承价值，而不是空泛描述',
    '3. injection_prompt 是否足够清晰可执行',
    '4. 是否可能与已有常见技能高度重复',
    '5. 是否存在明显低质量、垃圾内容或风险内容',
    '',
    '待审核技能：',
    JSON.stringify(
      {
        name: submission.name,
        summary: submission.summary,
        category: submission.category,
        tags: submission.tags || [],
        injection_prompt: submission.injection_prompt,
        examples: submission.examples || null,
        submitter_name: submission.submitter_name || null
      },
      null,
      2
    )
  ].join('\n')
}

async function reviewSkillSubmission(submission) {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured')
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: NVIDIA_REVIEW_MODEL,
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: 'You are a strict skill reviewer for an AI agent skill marketplace. Return JSON only.'
        },
        {
          role: 'user',
          content: buildPrompt(submission)
        }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`NVIDIA review request failed: ${response.status} ${text}`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content || ''
  const parsed = extractJsonBlock(content)

  if (!parsed) {
    throw new Error('NVIDIA review response was not valid JSON')
  }

  return {
    model: NVIDIA_REVIEW_MODEL,
    decision: parsed.decision || 'needs_review',
    quality_score: Number(parsed.quality_score ?? 0),
    duplicate_risk: Number(parsed.duplicate_risk ?? 0),
    risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    category_suggestion: parsed.category_suggestion || submission.category || 'general',
    summary: parsed.summary || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    raw: parsed
  }
}

module.exports = {
  reviewSkillSubmission,
  NVIDIA_REVIEW_MODEL
}
