// POST /api/market/orders  — 创建托管订单
// GET  /api/market/orders?listing_id=xxx  — 查询订单（admin）

import { supabaseAdmin } from '../../../lib/supabase-admin.js'

const PLATFORM_WALLET = '4sJUjgB65HYez9AHFrv9d3CuyaMyZP3kaFhnSaLds6bp'
const VALID_CURRENCIES = ['USDC', 'USD']

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    const {
      listing_id,
      provider_name,
      capability_title,
      buyer_name,
      buyer_contact_type,
      buyer_contact_value,
      requirement,
      amount,
      currency = 'USDC'
    } = req.body || {}

    if (!listing_id || !buyer_name || !buyer_contact_type || !buyer_contact_value || !requirement || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    if (!VALID_CURRENCIES.includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' })
    }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' })
    }

    const { data, error } = await supabaseAdmin
      .from('market_orders')
      .insert([{
        listing_id,
        provider_name,
        capability_title,
        buyer_name: buyer_name.trim(),
        buyer_contact_type,
        buyer_contact_value: buyer_contact_value.trim(),
        requirement: requirement.trim(),
        amount: parsedAmount,
        currency,
        status: 'pending_payment'
      }])
      .select('id, amount, currency, status, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({
      success: true,
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      payment_instruction: {
        send_to: PLATFORM_WALLET,
        amount: parsedAmount,
        currency,
        memo: `ORDER:${data.id.slice(0, 8)}`,
        note: currency === 'USDC'
          ? `请将 ${parsedAmount} USDC 转至平台钱包，备注订单号，转账后联系平台确认。`
          : `请将 ${parsedAmount} USD 转至平台，联系 postmaster@swrm.work 确认订单。`
      }
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
