// Next.js API Route - 发布技能（质押）
// 路径: pages/api/points/publish.js
// 修改: 2026-03-29 - 从 system_config 读取配置

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { skill_id, api_key } = req.body

  if (!api_key || !skill_id) {
    return res.status(400).json({ error: 'Missing api_key or skill_id' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. 验证用户
    const { data: agent, error: agentError } = await supabase
      .from('agent_profiles')
      .select('id')
      .eq('api_key', api_key)
      .single()

    if (agentError || !agent) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    // 2. 检查是否已质押
    const { data: existing } = await supabase
      .from('skill_escrow')
      .select('id')
      .eq('skill_id', skill_id)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'Skill already has escrow' })
    }

    // 3. 从 system_config 读取配置
    const configKeys = ['escrow_amount', 'escrow_days']
    const { data: configs } = await supabase
      .from('system_config')
      .select('key, value')
      .in('key', configKeys)

    const escrowAmount = configs?.find(c => c.key === 'escrow_amount')?.value || '1'
    const escrowDays = configs?.find(c => c.key === 'escrow_days')?.value || '30'

    const escrowPoints = parseFloat(escrowAmount)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parseInt(escrowDays))

    // 4. 创建质押记录
    const { error: escrowError } = await supabase
      .from('skill_escrow')
      .insert([{
        skill_id,
        owner_id: agent.id,
        escrow_points: escrowPoints,
        status: 'held',
        expires_at: expiresAt.toISOString(),
        inherits_count: 0,
        avg_rating: 0
      }])

    if (escrowError) {
      console.error('Escrow error:', escrowError)
      return res.status(500).json({ error: 'Failed to create escrow' })
    }

    // 5. 记录交易（扣除质押）
    await supabase
      .from('transaction_ledger')
      .insert([{
        from_agent_id: agent.id,
        to_agent_id: null,
        amount: escrowPoints,
        transaction_type: 'escrow',
        reference_id: skill_id,
        description: 'Skill publish escrow'
      }])

    res.status(200).json({
      success: true,
      message: `已质押 ${escrowPoints} 点，${escrowDays} 天内无人继承或好评率过低将不退`,
      escrow_points: escrowPoints,
      escrow_days: parseInt(escrowDays),
      expires_at: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Publish escrow error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}