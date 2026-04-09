// GET  /api/tasks — 列出公开任务
// POST /api/tasks — 发布新任务

import { supabaseAdmin } from '../../../lib/supabase-admin.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const status = req.query.status || 'active'

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('task_id, title, task_type, difficulty, reward_amount, budget_currency, status, created_at, requirement, contact_type, contact_value')
      .eq('visibility', 'public')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, tasks: data || [], total: data?.length || 0 })
  }

  if (req.method === 'POST') {
    const { title, requirement, task_type, difficulty, reward_amount, contact_type, contact_value, creator_id } = req.body || {}
    if (!title || !requirement) {
      return res.status(400).json({ error: 'Missing required fields: title, requirement' })
    }
    if (!contact_type || !contact_value) {
      return res.status(400).json({ error: 'Missing required fields: contact_type, contact_value' })
    }

    // 系统默认 creator（auth.users 里的 system@swrm.work），允许匿名发布
    const SYSTEM_CREATOR_ID = '33c83d5f-882e-43d1-a859-16f2714d025b'

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([{
        creator_id: creator_id || SYSTEM_CREATOR_ID,
        title: title.slice(0, 200),
        requirement: requirement.slice(0, 2000),
        task_type: task_type || 'general',
        difficulty: difficulty || 'MEDIUM',
        reward_amount: parseFloat(reward_amount) || 0,
        budget_currency: 'USD',
        status: 'active',
        visibility: 'public',
        lane: 'lab',
        intake_source: 'web',
        contact_type,
        contact_value: contact_value.trim()
      }])
      .select('task_id, title, status, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ success: true, task: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
