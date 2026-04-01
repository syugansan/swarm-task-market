// 技能列表 API
// GET /api/skills - 返回所有 active 技能
// 统一返回 skills 表数据，与 /api/inherit/[id] 使用同一数据源

import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' })
  }

  try {
    // 查询 skills 表（与继承 API 同一数据源）
    const { data, error } = await supabaseAdmin
      .from('skills')
      .select(`
        id,
        title,
        description,
        category,
        injection_prompt,
        access_tier,
        status,
        is_verified,
        verification_level,
        verified_at,
        verification_note,
        inherit_count,
        created_at
      `)
      .eq('status', 'active')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Skills fetch error:', error)
      return res.status(500).json({ error: 'Failed to fetch skills' })
    }

    // 统一响应格式
    const skills = (data || []).map(skill => ({
      id: skill.id,
      name: skill.title,
      summary: skill.description,
      category: skill.category || 'general',
      injection_prompt: skill.injection_prompt,
      access_tier: skill.access_tier || 'free',
      status: skill.status,
      is_verified: skill.is_verified || false,
      verification_level: skill.verification_level,
      verified_at: skill.verified_at,
      verification_note: skill.verification_note,
      inherit_count: skill.inherit_count || 0,
      tags: [],
      examples: null
    }))

    res.status(200).json({
      success: true,
      data: skills,
      meta: {
        total: skills.length,
        verified: skills.filter(s => s.is_verified).length,
        source: 'database'
      }
    })

  } catch (error) {
    console.error('Skills list error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}