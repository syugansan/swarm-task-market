// 技能审核 API - 从 skill_submissions 审核到 skills
// POST /api/skills/review-submission

const { createClient } = require('@supabase/supabase-js')
const { reviewSkillSubmission, NVIDIA_REVIEW_MODEL } = require('../../../lib/nvidia-reviewer')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// 简单的管理员密钥
const ADMIN_KEY = process.env.ADMIN_KEY || 'swarm-admin-2026'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 验证管理员权限
  const authHeader = req.headers.authorization
  const token = authHeader?.replace('Bearer ', '')

  if (token !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized - need admin key' })
  }

  const { submission_id, action, note } = req.body

  if (!submission_id || !action) {
    return res.status(400).json({ error: 'Missing submission_id or action' })
  }

  try {
    // 获取待审核技能
    const { data: submission, error: fetchError } = await supabase
      .from('skill_submissions')
      .select('*')
      .eq('id', submission_id)
      .single()

    if (fetchError || !submission) {
      return res.status(404).json({ error: 'Submission not found', id: submission_id })
    }

    if (action === 'ai-review') {
      const review = await reviewSkillSubmission(submission)

      return res.status(200).json({
        success: true,
        submission_id,
        reviewer: {
          provider: 'nvidia',
          model: NVIDIA_REVIEW_MODEL
        },
        review
      })
    }

    if (action === 'approve') {
      // 批准：插入到 skills 表
      // 字段映射：submission.name -> skills.title, submission.summary -> skills.description
      const { data: newSkill, error: insertError } = await supabase
        .from('skills')
        .insert([{
          title: submission.name,
          description: submission.summary,
          injection_prompt: submission.injection_prompt,
          category: submission.category || 'general',
          access_tier: 'free',
          status: 'active'
        }])
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        return res.status(500).json({ error: 'Failed to insert skill', details: insertError.message })
      }

      // 更新 submission 状态
      await supabase
        .from('skill_submissions')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', submission_id)

      res.status(200).json({
        success: true,
        message: 'Skill approved and published',
        skill_id: newSkill[0]?.id,
        skill_name: submission.name
      })

    } else if (action === 'reject') {
      // 拒绝
      await supabase
        .from('skill_submissions')
        .update({
          status: 'rejected',
          review_notes: note,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission_id)

      res.status(200).json({ success: true, message: 'Skill rejected' })

    } else {
      res.status(400).json({ error: 'Invalid action. Use approve, reject or ai-review.' })
    }

  } catch (error) {
    console.error('Review error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
