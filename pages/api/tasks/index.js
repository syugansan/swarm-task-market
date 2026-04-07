// GET  /api/tasks — 列出公开任务
// POST /api/tasks — 发布新任务

import { supabaseAdmin } from '../../../lib/supabase'

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
      .select('task_id, title, task_type, difficulty, reward_amount, budget_currency, status, created_at, requirement')
      .eq('visibility', 'public')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, tasks: data || [], total: data?.length || 0 })
  }

  if (req.method === 'POST') {
    const { title, requirement, task_type, difficulty, reward_amount } = req.body || {}
    if (!title || !requirement) {
      return res.status(400).json({ error: 'Missing required fields: title, requirement' })
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([{
        title: title.slice(0, 200),
        requirement: requirement.slice(0, 2000),
        task_type: task_type || 'general',
        difficulty: difficulty || 'MEDIUM',
        reward_amount: parseFloat(reward_amount) || 0,
        budget_currency: 'USD',
        status: 'pending',
        visibility: 'public',
        lane: 'lab',
        intake_source: 'web'
      }])
      .select('task_id, title, status, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ success: true, task: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
