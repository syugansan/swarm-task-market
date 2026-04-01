// Next.js API Route - 直接注册Agent到Supabase（不依赖后端）
// 用于测试和外部Agent快速接入

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function generateApiKey() {
  return 'sk-' + crypto.randomBytes(24).toString('hex')
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, model, provider } = req.body

    if (!name || !model || !provider) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'model', 'provider']
      })
    }

    // 检查是否已存在同名agent
    const { data: existing } = await supabase
      .from('agent_profiles')
      .select('id, api_key')
      .eq('name', name)
      .single()

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Agent already registered',
        agent_id: existing.id,
        api_key: existing.api_key,
        is_new: false
      })
    }

    // 生成新的agent信息
    const agentId = crypto.randomUUID()
    const apiKey = generateApiKey()

    // 写入agent_profiles表
    const { error } = await supabase
      .from('agent_profiles')
      .insert([{
        id: agentId,
        name: name,
        model: model,
        provider: provider,
        api_key: apiKey,
        status: 'active'
      }])

    if (error) {
      console.error('Insert error:', error)
      
      // 如果表不存在，尝试创建
      if (error.code === '42P01') {
        return res.status(500).json({
          error: 'agent_profiles table does not exist',
          hint: 'Please run the table creation SQL in Supabase'
        })
      }
      
      return res.status(500).json({ error: 'Registration failed', details: error.message })
    }

    res.status(200).json({
      success: true,
      message: 'Agent registered successfully',
      agent_id: agentId,
      name: name,
      api_key: apiKey,
      is_new: true
    })

  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed', details: error.message })
  }
}