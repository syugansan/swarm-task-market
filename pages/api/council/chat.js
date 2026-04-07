const { supabaseAdmin } = require('../../../lib/supabase-admin')

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = process.env.NVIDIA_TASK_MODEL || 'meta/llama-3.3-70b-instruct'
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY

const AI_NAME = '站长'
// 每 N 条人类消息触发一次 AI 归纳
const AI_TRIGGER_EVERY = 5

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function callLlama(recentMessages) {
  if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY not configured')

  const history = recentMessages
    .map(m => `${m.author_name}: ${m.content}`)
    .join('\n')

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      temperature: 0.6,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: [
            '你是蜂群任务市场的站长，在议事厅里代表网站官方参与用户反馈讨论。',
            '职责：认真回应用户反馈和问题，记录有价值的改进建议，引导用户把模糊想法说清楚，发现好建议时提示用户点击"我有改进想法"按钮正式提案。',
            '口吻：真诚、务实，像一个在乎用户感受的网站负责人，不官方不套话。回复控制在100字以内。',
            '只用中文回复。'
          ].join(' ')
        },
        {
          role: 'user',
          content: `以下是最近的讨论内容：\n${history}\n\n请简短回应或归纳当前讨论的核心议题。`
        }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Llama call failed: ${response.status} ${text.slice(0, 200)}`)
  }

  const payload = await response.json()
  return payload?.choices?.[0]?.message?.content?.trim() || '已收到，正在处理。'
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET: 拉取最近消息
  if (req.method === 'GET') {
    const { since } = req.query

    let query = supabaseAdmin
      .from('council_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(80)

    if (since) {
      query = query.gt('created_at', since)
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ success: true, messages: data || [] })
  }

  // POST: 发消息
  if (req.method === 'POST') {
    const { content, author_name = '访客' } = req.body || {}

    if (!content?.trim()) {
      return res.status(400).json({ error: 'content is required' })
    }

    // 保存用户消息
    const { data: saved, error: saveErr } = await supabaseAdmin
      .from('council_messages')
      .insert([{ content: content.trim(), author_name: author_name.trim() || '访客', is_ai: false }])
      .select()
      .single()

    if (saveErr) return res.status(500).json({ error: saveErr.message })

    // 判断是否触发 AI：@蜂群助手 或每 N 条人类消息
    const mentionsAI = /[@＠](站长|蜂群助手|AI|ai)/.test(content)

    let shouldTriggerAI = mentionsAI
    if (!shouldTriggerAI) {
      const { count } = await supabaseAdmin
        .from('council_messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_ai', false)

      shouldTriggerAI = count % AI_TRIGGER_EVERY === 0
    }

    let aiMessage = null
    if (shouldTriggerAI) {
      try {
        // 取最近 10 条消息作为上下文
        const { data: recent } = await supabaseAdmin
          .from('council_messages')
          .select('author_name, content, is_ai')
          .order('created_at', { ascending: false })
          .limit(10)

        const context = (recent || []).reverse()
        const aiContent = await callLlama(context)

        const { data: aiSaved } = await supabaseAdmin
          .from('council_messages')
          .insert([{ content: aiContent, author_name: AI_NAME, is_ai: true }])
          .select()
          .single()

        aiMessage = aiSaved
      } catch (e) {
        console.error('AI reply error:', e.message)
      }
    }

    return res.status(201).json({ success: true, message: saved, ai_message: aiMessage })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
