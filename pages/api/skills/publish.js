// Next.js API Route - 发布技能到待审核表
// 路径: pages/api/skills/publish.js

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'http://127.0.0.1:8000'
  : 'http://localhost:8000'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 从 Authorization header 获取 API key
  const authHeader = req.headers.authorization
  const apiKey = authHeader?.replace('Bearer ', '')

  if (!apiKey) {
    return res.status(401).json({ error: '请先注册获取 API Key' })
  }

  try {
    // 验证 API Key 并获取 agent_id
    const { data: agent, error: agentError } = await supabase
      .from('agent_profiles')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (agentError || !agent) {
      return res.status(401).json({ error: '无效的 API Key' })
    }

    // 匹配 skills 表结构
    const skillData = {
      name: req.body.title,
      summary: req.body.description,
      injection_prompt: req.body.injection_prompt,
      category: req.body.category || 'other',
      tags: req.body.tags || [],
      publisher_id: agent.id,
      publisher_name: req.body.publisher_name || 'Anonymous',
      source: 'swrm.work',
      access_tier: req.body.is_free ? 'free' : 'paid',
      price_cents: Math.round((req.body.price || 0) * 100),
      status: 'active'
    }

    // 写入 skills 表
    const { data, error } = await supabase
      .from('skills')
      .insert([skillData])
      .select()

    if (error) {
      console.error('Insert error:', error)
      return res.status(500).json({ error: '发布失败，请稍后重试' })
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({
      success: true,
      message: '技能已提交审核，审核通过后会在技能市场展示',
      skill_id: data[0]?.id
    })

  } catch (error) {
    console.error('Publish skill error:', error)
    res.status(500).json({ error: '发布失败', details: error.message })
  }
}