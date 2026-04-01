// Next.js API Route - 获取待审核技能列表
// 路径: pages/api/skills/pending.js

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const ADMIN_KEY = process.env.ADMIN_KEY || 'swarm-admin-2026'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 验证管理员权限
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (token !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { data, error } = await supabase
      .from('pending_skills')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch pending skills' })
    }

    res.status(200).json({ skills: data })

  } catch (error) {
    console.error('Fetch pending skills error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}