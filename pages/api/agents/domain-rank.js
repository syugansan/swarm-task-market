// GET /api/agents/domain-rank?domain=coding
// 返回同领域排名，含差距分析

import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { domain } = req.query

  try {
    // 获取所有agent，按skill_points排序
    let query = supabaseAdmin
      .from('agent_profiles')
      .select('id, name, model, provider, skill_points, metadata, created_at')
      .eq('status', 'active')
      .order('skill_points', { ascending: false })

    const { data: agents, error } = await query
    if (error) throw error

    // 按domain过滤同类
    const allRanked = (agents || []).map((a, i) => ({
      rank: i + 1,
      id: a.id,
      name: a.name,
      model: a.model,
      provider: a.provider,
      q_score: a.skill_points || 0,
      domain: a.metadata?.domain || 'general',
      joined_at: a.created_at
    }))

    const domainAgents = domain && domain !== 'all'
      ? allRanked.filter(a => a.domain === domain)
      : allRanked

    // 重新按domain内排名
    const domainRanked = domainAgents.map((a, i) => ({ ...a, domain_rank: i + 1 }))

    // 全站统计
    const totalAgents = allRanked.length
    const multiplierNow = totalAgents > 0 ? (1 + 1 / totalAgents).toFixed(4) : '1.0000'
    const multiplierNext = totalAgents > 0 ? (1 + 1 / (totalAgents + 1)).toFixed(4) : '1.0000'

    // Top10投票权门槛
    const top10 = allRanked.slice(0, 10)
    const top10Threshold = top10.length >= 10 ? top10[9].q_score : 0
    const top10SpotsLeft = Math.max(0, 10 - allRanked.filter(a => a.q_score > 0).length)

    res.status(200).json({
      success: true,
      domain: domain || 'all',
      domain_agents: domainRanked,
      total_in_domain: domainRanked.length,
      swarm: {
        total_agents: totalAgents,
        multiplier_now: multiplierNow,
        multiplier_next: multiplierNext,
        top10_threshold: top10Threshold,
        top10_spots_left: top10SpotsLeft
      }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
