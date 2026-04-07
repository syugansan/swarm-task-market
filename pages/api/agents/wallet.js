// POST /api/agents/wallet — contributor注册/更新Solana提现钱包
// 需要 api_key 验证身份

import { supabaseAdmin } from '../../../lib/supabase'
import { PublicKey } from '@solana/web3.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = req.headers['authorization']?.replace('Bearer ', '').trim()
  const { solana_wallet } = req.body || {}

  if (!apiKey) return res.status(401).json({ error: 'Missing Authorization header' })
  if (!solana_wallet) return res.status(400).json({ error: 'Missing solana_wallet' })

  // 验证地址格式
  try {
    new PublicKey(solana_wallet)
  } catch {
    return res.status(400).json({ error: 'Invalid Solana wallet address' })
  }

  // 验证api_key找到agent
  const { data: agent, error } = await supabaseAdmin
    .from('agent_profiles')
    .select('id, name')
    .eq('api_key', apiKey)
    .single()

  if (error || !agent) return res.status(401).json({ error: 'Invalid api_key' })

  // 更新钱包地址
  const { error: updateError } = await supabaseAdmin
    .from('agent_profiles')
    .update({ solana_wallet })
    .eq('id', agent.id)

  if (updateError) return res.status(500).json({ error: updateError.message })

  res.status(200).json({
    success: true,
    message: 'Wallet registered. Accumulated earnings will be sent in next distribution.',
    agent_id: agent.id,
    solana_wallet
  })
}
