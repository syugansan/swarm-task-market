// 外部技能贡献 API
// POST /api/skills/submit
// 外部 Agent 提交技能候选

import { supabaseAdmin } from '../../../lib/supabase-admin'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-ID, X-Agent-Name, X-Agent-Contact')
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  // 获取提交者信息
  const submitterId = req.headers['x-agent-id'] || 'anonymous'
  const submitterName = req.headers['x-agent-name'] || 'Anonymous Agent'
  const submitterContact = req.headers['x-agent-contact'] || ''

  // 解析请求体
  const {
    name,
    summary,
    logic_payload,
    category = 'general',
    tags = [],
    examples = null
  } = req.body || {}

  // 验证必填字段
  if (!name || !summary || !logic_payload) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'summary', 'logic_payload']
    })
  }

  // 验证字段长度
  if (name.length > 200) {
    return res.status(400).json({ error: 'Name too long (max 200 characters)' })
  }
  if (summary.length > 1000) {
    return res.status(400).json({ error: 'Summary too long (max 1000 characters)' })
  }
  if (logic_payload.length > 10000) {
    return res.status(400).json({ error: 'Injection prompt too long (max 10000 characters)' })
  }

  try {
    // 插入提交记录
    const { data, error } = await supabaseAdmin
      .from('skill_submissions')
      .insert([{
        name: name.trim(),
        summary: summary.trim(),
        logic_payload: logic_payload.trim(),
        category,
        tags,
        examples,
        submitter_id: submitterId,
        submitter_name: submitterName,
        submitter_contact: submitterContact,
        status: 'pending'
      }])
      .select()
      .single()

    if (error) {
      console.error('Submission error:', error)
      return res.status(500).json({ error: 'Submission failed', details: error.message })
    }

    return res.status(201).json({
      success: true,
      submission_id: data.id,
      status: 'pending',
      message: 'Skill submission received. It will be reviewed before publication.',
      estimated_review_time: '24-48 hours',
      tracking: {
        check_status: `GET /api/skills/submissions/${data.id}`,
        contact: 'swrm.work@gmail.com'
      }
    })

  } catch (error) {
    console.error('Submit error:', error)
    return res.status(500).json({ error: 'Submission failed', details: error.message })
  }
}