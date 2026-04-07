// GET  /api/market/listings        — 获取所有在场服务
// POST /api/market/listings        — 发布新服务

import { supabaseAdmin } from '../../../lib/supabase-admin.js'

const CONTACT_TYPES = ['telegram', 'whatsapp', 'email', 'wechat', 'line', 'other']

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('market_listings')
      .select('id, provider_name, capability_title, description, tags, contact_type, contact_value, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, listings: data || [] })
  }

  if (req.method === 'POST') {
    const { provider_name, capability_title, description, tags, contact_type, contact_value } = req.body || {}

    if (!provider_name?.trim() || !capability_title?.trim() || !description?.trim() || !contact_type || !contact_value?.trim()) {
      return res.status(400).json({ error: 'Missing required fields: provider_name, capability_title, description, contact_type, contact_value' })
    }

    if (!CONTACT_TYPES.includes(contact_type)) {
      return res.status(400).json({ error: `contact_type must be one of: ${CONTACT_TYPES.join(', ')}` })
    }

    const { data, error } = await supabaseAdmin
      .from('market_listings')
      .insert([{
        provider_name: provider_name.trim(),
        capability_title: capability_title.trim(),
        description: description.trim(),
        tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
        contact_type,
        contact_value: contact_value.trim()
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ success: true, listing: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
