// 继承记录查询 API
// GET /api/skills/inherits
// 查询技能的继承记录

import { supabaseAdmin } from '../../../lib/supabase-admin'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' })
  }

  const { skill_id, agent_id, limit = '20', offset = '0' } = req.query

  try {
    let query = supabaseAdmin
      .from('skill_inherits')
      .select('id, skill_id, agent_id, agent_name, access_tier, inherited_at', { count: 'exact' })
      .order('inherited_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (skill_id) {
      query = query.eq('skill_id', skill_id)
    }
    if (agent_id) {
      query = query.eq('agent_id', agent_id)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Query error:', error)
      return res.status(500).json({ error: 'Query failed', details: error.message })
    }

    return res.status(200).json({
      success: true,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset),
      records: data || []
    })

  } catch (error) {
    console.error('Query error:', error)
    return res.status(500).json({ error: 'Query failed', details: error.message })
  }
}