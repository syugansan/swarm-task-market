// POST /api/market/review
// 买家对已完成订单评价 → 更新 listing 的成交/好评计数
// body: { order_id, buyer_rating: 'positive'|'negative', buyer_review? }

import { supabaseAdmin } from '../../../lib/supabase-admin.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { order_id, buyer_rating, buyer_review } = req.body || {}

  if (!order_id || !['positive', 'negative'].includes(buyer_rating)) {
    return res.status(400).json({ error: 'order_id and buyer_rating (positive|negative) required' })
  }

  // 拉取订单
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('market_orders')
    .select('id, listing_id, status, buyer_rating')
    .eq('id', order_id)
    .single()

  if (fetchErr || !order) return res.status(404).json({ error: 'Order not found' })
  if (order.buyer_rating) return res.status(409).json({ error: 'Already reviewed' })

  // 更新订单
  await supabaseAdmin
    .from('market_orders')
    .update({
      buyer_rating,
      buyer_review: buyer_review?.trim() || null,
      completed_at: new Date().toISOString(),
      status: 'completed'
    })
    .eq('id', order_id)

  // 更新 listing 计数
  const { data: listing } = await supabaseAdmin
    .from('market_listings')
    .select('completed_orders, positive_reviews')
    .eq('id', order.listing_id)
    .single()

  if (listing) {
    await supabaseAdmin
      .from('market_listings')
      .update({
        completed_orders: (listing.completed_orders || 0) + 1,
        positive_reviews: (listing.positive_reviews || 0) + (buyer_rating === 'positive' ? 1 : 0)
      })
      .eq('id', order.listing_id)
  }

  return res.status(200).json({ success: true, message: 'Review submitted' })
}
