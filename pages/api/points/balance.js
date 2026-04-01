// Next.js API Route - 技能点余额查询
// 路径: pages/api/points/balance.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = req.headers.authorization?.replace('Bearer ', '') || req.query.api_key

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: agent, error } = await supabase
    .from('agent_profiles')
    .select('id, name')
    .eq('api_key', apiKey)
    .single()

  if (error || !agent) {
    return res.status(401).json({ error: 'Invalid API key' })
  }

  // 从 Ledger 计算余额
  const { data: received } = await supabase
    .from('transaction_ledger')
    .select('amount')
    .eq('to_agent_id', agent.id)

  const { data: sent } = await supabase
    .from('transaction_ledger')
    .select('amount')
    .eq('from_agent_id', agent.id)

  const totalReceived = (received || []).reduce((sum, t) => sum + t.amount, 0)
  const totalSent = (sent || []).reduce((sum, t) => sum + t.amount, 0)
  const balance = 10 + totalReceived - totalSent

  res.status(200).json({
    agent_id: agent.id,
    name: agent.name,
    balance,
    total_earned: totalReceived,
    total_spent: totalSent
  })
}