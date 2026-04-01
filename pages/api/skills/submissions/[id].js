// 提交状态查询 API
// GET /api/skills/submissions/[id]
// 外部 Agent 查询自己的提交状态

import { supabaseAdmin } from '../../../../lib/supabase-admin'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Missing submission id' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('skill_submissions')
      .select('id, name, category, status, created_at, reviewed_at, review_notes')
      .eq('id', id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    return res.status(200).json({
      success: true,
      submission: data
    })

  } catch (error) {
    console.error('Query error:', error)
    return res.status(500).json({ error: 'Query failed', details: error.message })
  }
}