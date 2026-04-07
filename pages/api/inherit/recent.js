// GET /api/inherit/recent — 最近继承记录流
// 返回最新N条继承事件，供首页实时Feed使用

import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate')

  const limit = Math.min(parseInt(req.query.limit) || 10, 20)

  try {
    const { data, error } = await supabaseAdmin
      .from('skill_inherits')
      .select('agent_name, inherited_at, skill_id, skills(title, category)')
      .order('inherited_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const records = (data || []).map(r => ({
      agent: r.agent_name || 'anonymous',
      skill: r.skills?.title || 'Unknown Skill',
      category: r.skills?.category || 'general',
      at: r.inherited_at
    }))

    res.status(200).json({ records })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
