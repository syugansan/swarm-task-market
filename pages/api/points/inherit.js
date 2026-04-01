// Next.js API Route - 继承技能
// 路径: pages/api/points/inherit.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { skill_id, api_key } = req.body

  if (!api_key || !skill_id) {
    return res.status(400).json({ error: 'Missing api_key or skill_id' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. 验证用户
  const { data: agent, error: agentError } = await supabase
    .from('agent_profiles')
    .select('id, name')
    .eq('api_key', api_key)
    .single()

  if (agentError || !agent) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  // 2. 获取技能信息
  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .select('id, owner_id, title')
    .eq('id', skill_id)
    .single()

  if (skillError || !skill) {
    return res.status(404).json({ error: 'Skill not found' })
  }

  // P0 修复：不能继承自己的技能
  if (skill.owner_id === agent.id) {
    return res.status(400).json({ error: 'Cannot inherit your own skill' })
  }

  // 3. 记录继承
  const { error: inheritError } = await supabase
    .from('skill_inheritance_log')
    .insert([{
      skill_id,
      inheritor_id: agent.id,
      points_spent: 1,
      task_success: true
    }])

  if (inheritError) {
    return res.status(500).json({ error: 'Failed to record inheritance' })
  }

  // 4. 继承者消费 1 点
  await supabase
    .from('transaction_ledger')
    .insert([{
      from_agent_id: agent.id,
      to_agent_id: null,
      amount: 1,
      transaction_type: 'inherit',
      reference_id: skill_id,
      description: `Inherited skill: ${skill.title}`
    }])

  // 5. 发布者获得分红
  await supabase
    .from('transaction_ledger')
    .insert([{
      from_agent_id: null,
      to_agent_id: skill.owner_id,
      amount: 1,
      transaction_type: 'reward',
      reference_id: skill_id,
      description: `Skill inheritance reward`
    }])

  // 6. 首传即退：检查是否首次继承
  const { data: inheritances } = await supabase
    .from('skill_inheritance_log')
    .select('id')
    .eq('skill_id', skill_id)

  if (inheritances && inheritances.length === 1) {
    // 首次继承，释放质押
    const { data: escrow } = await supabase
      .from('skill_escrow')
      .select('*')
      .eq('skill_id', skill_id)
      .eq('status', 'held')
      .single()

    if (escrow) {
      await supabase
        .from('skill_escrow')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('id', escrow.id)

      await supabase
        .from('transaction_ledger')
        .insert([{
          from_agent_id: null,
          to_agent_id: skill.owner_id,
          amount: escrow.escrow_points,
          transaction_type: 'release',
          reference_id: skill_id,
          description: 'First inheritance escrow release'
        }])
    }
  }

  res.status(200).json({
    success: true,
    message: '继承成功',
    skill_title: skill.title
  })
}