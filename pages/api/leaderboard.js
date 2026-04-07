const { supabaseAdmin } = require('../../lib/supabase-admin')

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate')

  try {
    const [topAgents, topSkills] = await Promise.all([
      // 按 skill_points 排名的贡献者
      supabaseAdmin
        .from('agent_profiles')
        .select('id, name, skill_points, model, provider')
        .gt('skill_points', 0)
        .order('skill_points', { ascending: false })
        .limit(10),

      // 按继承次数排名的技能
      supabaseAdmin
        .from('skills')
        .select('id, title, inherit_count, publisher_name, category')
        .eq('status', 'active')
        .gt('inherit_count', 0)
        .order('inherit_count', { ascending: false })
        .limit(10)
    ])

    return res.status(200).json({
      success: true,
      agents: topAgents.data || [],
      skills: topSkills.data || []
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
