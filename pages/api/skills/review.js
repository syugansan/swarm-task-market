// Next.js API Route - 技能审核接口
// 路径: pages/api/skills/review.js

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // 使用 service key 有完整权限
)

// 管理员密钥验证
const ADMIN_KEY = process.env.ADMIN_KEY || 'swarm-admin-2026'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 验证管理员权限
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (token !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { skill_id, action, note } = req.body

  if (!skill_id || !action) {
    return res.status(400).json({ error: 'Missing skill_id or action' })
  }

  try {
    // 获取待审核技能
    const { data: pendingSkill, error: fetchError } = await supabase
      .from('pending_skills')
      .select('*')
      .eq('id', skill_id)
      .single()

    if (fetchError || !pendingSkill) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    if (action === 'approve') {
      // 批准：移动到 skills 表
      const { error: insertError } = await supabase
        .from('skills')
        .insert([{
          owner_id: pendingSkill.owner_id,
          title: pendingSkill.title,
          description: pendingSkill.description,
          category: pendingSkill.category,
          tags: pendingSkill.tags,
          injection_prompt: pendingSkill.injection_prompt,
          price_usdc: pendingSkill.price_usdc,
          is_free: pendingSkill.is_free,
          content_url: pendingSkill.content_url,
          documentation_url: pendingSkill.documentation_url,
          status: 'active'
        }])

      if (insertError) {
        return res.status(500).json({ error: 'Failed to approve skill' })
      }

      // 更新 pending_skills 状态
      await supabase
        .from('pending_skills')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', skill_id)

      res.status(200).json({ success: true, message: 'Skill approved' })

    } else if (action === 'reject') {
      // 拒绝：更新状态
      const { error: updateError } = await supabase
        .from('pending_skills')
        .update({
          status: 'rejected',
          review_note: note,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', skill_id)

      if (updateError) {
        return res.status(500).json({ error: 'Failed to reject skill' })
      }

      res.status(200).json({ success: true, message: 'Skill rejected' })

    } else {
      res.status(400).json({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('Review error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}