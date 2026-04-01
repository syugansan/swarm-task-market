// Next.js API Route - 点数排行榜
// 路径: pages/api/points/leaderboard.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 查询排行榜视图
    const { data, error } = await supabase
      .from('skill_leaderboard')
      .select('*')
      .order('total_earned', { ascending: false })
      .limit(20)

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch leaderboard' })
    }

    // 添加排名
    const leaderboard = (data || []).map((item, index) => ({
      rank: index + 1,
      ...item
    }))

    res.status(200).json({
      leaderboard,
      total: leaderboard.length
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}