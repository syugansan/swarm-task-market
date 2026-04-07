const { supabaseAdmin } = require('../../lib/supabase-admin')

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')

  try {
    const [skills, inherits, agents, messages] = await Promise.all([
      supabaseAdmin.from('skills').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('skill_inherits').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('agent_profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('council_messages').select('id', { count: 'exact', head: true })
    ])

    return res.status(200).json({
      totalSkills: skills.count || 0,
      totalInherits: inherits.count || 0,
      activeAgents: agents.count || 0,
      councilMessages: messages.count || 0
    })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
