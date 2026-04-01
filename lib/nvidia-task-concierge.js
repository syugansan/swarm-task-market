const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
const NVIDIA_TASK_MODEL = process.env.NVIDIA_TASK_MODEL || 'meta/llama-3.3-70b-instruct'
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

function buildPrompt(taskText) {
  return [
    '你是 SwarmWork 的任务接待员 Moly。',
    '你的职责是把用户的任务意图翻译成蜂群调度建议。',
    '你不是闲聊助手，不处理与任务、需求、预算、时限、交付、协作相关性弱的内容。',
    '请只输出 JSON，不要输出解释，不要使用 Markdown。',
    '',
    '输出格式：',
    '{',
    '  "verdict": "string",',
    '  "summary": "string",',
    '  "lane": "string",',
    '  "force": "string",',
    '  "route": "A -> B -> C",',
    '  "path": "X -> Y -> Z",',
    '  "complexity": 0-100,',
    '  "profit": "string",',
    '  "note": "string"',
    '}',
    '',
    '要求：',
    '1. 口吻像冷静、专业的蜂群接待员，不要浮夸。',
    '2. 优先把任务归类到：网站改造、内容增长、市场套利、数据研究、自动化运营、通用协作之一。',
    '3. force 要写成人能读懂的话，例如“建议调用 3-5 个节点”。',
    '4. route 要给蜂王链路，path 要给技能路径。',
    '5. 如果需求模糊，允许建议继续澄清，但仍要给一个临时通道。',
    '6. 如果输入是“你好”“在吗”这类无任务信息内容，verdict 只允许简短引导用户描述任务，不要延展闲聊。',
    '7. summary 和 note 必须聚焦任务输入补充，不要输出业务无关内容。',
    '',
    '用户任务：',
    taskText || '未提供具体任务'
  ].join('\n')
}

async function analyzeTaskIntent(taskText) {
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
      model: NVIDIA_TASK_MODEL,
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: 'You are Moly, a task concierge for a swarm-based agent marketplace. Return JSON only.'
        },
        {
          role: 'user',
          content: buildPrompt(taskText)
        }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`NVIDIA task request failed: ${response.status} ${text}`)
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content || ''
  const parsed = extractJsonBlock(content)

  if (!parsed) {
    throw new Error('NVIDIA task response was not valid JSON')
  }

  return {
    model: NVIDIA_TASK_MODEL,
    verdict: parsed.verdict || '可以先澄清后再进入调度。',
    summary: parsed.summary || '',
    lane: parsed.lane || '通用协作',
    force: parsed.force || '建议调用 2-3 个节点',
    route: parsed.route || '接待蜂王 -> 通用大蜂王 -> 领域小蜂王',
    path: parsed.path || '需求澄清 -> 粗拆任务 -> 细拆执行',
    complexity: Number(parsed.complexity ?? 50),
    profit: parsed.profit || '待评估',
    note: parsed.note || parsed.summary || ''
  }
}

module.exports = {
  analyzeTaskIntent,
  NVIDIA_TASK_MODEL
}
