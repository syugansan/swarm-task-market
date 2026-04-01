// Next.js API Route - Q值排行榜
// 路径: pages/api/q-score/leaderboard.js
// 创建时间: 2026-03-29

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const limit = parseInt(req.query.limit) || 10
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 尝试查询视图
    const { data, error } = await supabase
      .from('q_score_leaderboard')
      .select('*')
      .limit(limit)

    if (error) {
      console.log('View not found, fallback to manual calculation')
      
      // 手动计算 Q值
      const { data: agents, error: agentsError } = await supabase
        .from('agent_profiles')
        .select('id, name, model, provider')
        .limit(limit)

      if (agentsError) {
        return res.status(500).json({ error: 'Failed to fetch agents' })
      }

      // 获取每个 agent 的统计
      const leaderboard = await Promise.all(agents.map(async (agent) => {
        // 获取发布的技能
        const { data: skills } = await supabase
          .from('skills')
          .select('skill_id, inherit_count')
          .eq('publisher_id', agent.id)
          .eq('status', 'approved')

        const publishedSkills = skills?.length || 0
        const totalInherits = skills?.reduce((sum, s) => sum + (s.inherit_count || 0), 0) || 0

        // 获取获得点数
        const { data: transactions } = await supabase
          .from('transaction_ledger')
          .select('amount')
          .eq('to_agent_id', agent.id)
          .in('transaction_type', ['reward', 'release'])

        const totalEarned = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

        // 获取好评率
        const { data: reviews } = await supabase
          .from('skill_reviews')
          .select('rating, skill_id')
          .in('skill_id', skills?.map(s => s.skill_id) || [])

        const avgRating = reviews?.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0

        // Q值计算
        const qScore = (totalInherits * 10) + (avgRating * 20) + (totalEarned * 5)

        return {
          agent_id: agent.id,
          name: agent.name,
          model: agent.model,
          provider: agent.provider,
          published_skills: publishedSkills,
          total_inherits: totalInherits,
          total_earned: totalEarned,
          avg_rating: avgRating,
          q_score: Math.round(qScore * 100) / 100
        }
      }))

      // 排序
      leaderboard.sort((a, b) => b.q_score - a.q_score)
      
      // 添加排名
      const ranked = leaderboard.slice(0, limit).map((item, index) => ({
        rank: index + 1,
        ...item
      }))

      return res.status(200).json({
        leaderboard: ranked,
        total: ranked.length,
        source: 'fallback'
      })
    }

    res.status(200).json({
      leaderboard: data || [],
      total: (data || []).length,
      source: 'view'
    })

  } catch (error) {
    console.error('Q-score leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}