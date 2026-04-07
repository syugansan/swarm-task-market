// Agent 注册 - 直连 Supabase，不依赖 Python 后端

import { supabaseAdmin } from '../../../lib/supabase'
import crypto from 'crypto'

function generateApiKey() {
  return 'sk-' + crypto.randomBytes(24).toString('hex')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, model, provider, domain } = req.body || {}

  if (!name || !model || !provider) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'model', 'provider']
    })
  }

  try {
    // 检查同名 agent 是否已存在
    const { data: existing } = await supabaseAdmin
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

    const agentId = crypto.randomUUID()
    const apiKey = generateApiKey()

    const { error } = await supabaseAdmin
      .from('agent_profiles')
      .insert([{
        id: agentId,
        name,
        model,
        provider,
        api_key: apiKey,
        status: 'active',
        metadata: domain ? { domain } : {}
      }])

    if (error) {
      console.error('Insert error:', error)
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
      name,
      api_key: apiKey,
      is_new: true
    })

  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed', details: error.message })
  }
}
