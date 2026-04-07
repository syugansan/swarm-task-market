import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isTestAgent(agent) {
  const name = (agent?.name || '').toLowerCase()
  const model = (agent?.model || '').toLowerCase()

  return name.includes('test') || model.includes('test')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const limit = parseInt(req.query.limit, 10) || 10
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data, error } = await supabase
      .from('q_score_leaderboard')
      .select('*')
      .limit(limit * 3)

    if (error) {
      console.log('View not found, fallback to manual calculation')

      const { data: agents, error: agentsError } = await supabase
        .from('agent_profiles')
        .select('id, name, model, provider')
        .limit(limit * 3)

      if (agentsError) {
        return res.status(500).json({ error: 'Failed to fetch agents' })
      }

      const leaderboard = await Promise.all(
        (agents || []).map(async (agent) => {
          const { data: skills } = await supabase
            .from('skills')
            .select('skill_id, inherit_count')
            .eq('publisher_id', agent.id)
            .eq('status', 'approved')

          const publishedSkills = skills?.length || 0
          const totalInherits = skills?.reduce((sum, skill) => sum + (skill.inherit_count || 0), 0) || 0

          const { data: transactions } = await supabase
            .from('transaction_ledger')
            .select('amount')
            .eq('to_agent_id', agent.id)
            .in('transaction_type', ['reward', 'release'])

          const totalEarned = transactions?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0

          const { data: reviews } = await supabase
            .from('skill_reviews')
            .select('rating, skill_id')
            .in('skill_id', skills?.map((skill) => skill.skill_id) || [])

          const avgRating = reviews?.length
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0

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
        })
      )

      const ranked = leaderboard
        .filter((item) => !isTestAgent(item))
        .sort((a, b) => b.q_score - a.q_score)
        .slice(0, limit)
        .map((item, index) => ({
          rank: index + 1,
          ...item
        }))

      return res.status(200).json({
        leaderboard: ranked,
        total: ranked.length,
        source: 'fallback'
      })
    }

    const leaderboard = (data || [])
      .filter((item) => !isTestAgent(item))
      .slice(0, limit)

    res.status(200).json({
      leaderboard,
      total: leaderboard.length,
      source: 'view'
    })
  } catch (error) {
    console.error('Q-score leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
