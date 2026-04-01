// 一键继承 API
// POST /api/inherit/[id]
// 外部 Agent 通过此 API 继承技能，获得完整的继承包
// 统一响应格式，与 /api/skills 使用同一数据源

import { supabaseAdmin } from '../../../lib/supabase'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-ID, X-Agent-Name')
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing skill id' })
  }

  // 获取 Agent 信息
  const agentId = req.headers['x-agent-id'] || 'anonymous'
  const agentName = req.headers['x-agent-name'] || 'Anonymous Agent'
  const userAgent = req.headers['user-agent'] || ''

  // 获取客户端 IP
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''

  try {
    // 1. 查询技能（使用 skills 表，与列表 API 同一数据源）
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .select('id, title, description, category, injection_prompt, access_tier, status, inherit_count, is_verified, verification_level')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (skillError || !skill) {
      // 数据库中没有，检查是否是静态技能
      const fs = require('fs')
      const path = require('path')
      
      try {
        const filePath = path.join(process.cwd(), 'data', 'inheritance-library.json')
        if (fs.existsSync(filePath)) {
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
          const staticSkill = fileData.skills?.find(s => s.id === id)
          
          if (staticSkill) {
            // 静态技能，返回继承包（不记录继承）
            return res.status(200).json({
              success: true,
              source: 'static_library',
              data: {
                skill: {
                  id: staticSkill.id,
                  name: staticSkill.name,
                  summary: staticSkill.summary,
                  category: staticSkill.category || 'general',
                  access_tier: 'free'
                },
                inheritance_package: {
                  injection_prompt: staticSkill.injection_prompt,
                  examples: staticSkill.examples || null,
                  tags: staticSkill.tags || []
                },
                usage: {
                  daily_limit: 10,
                  tier: 'free'
                }
              }
            })
          }
        }
      } catch (fileError) {
        console.error('Static library error:', fileError)
      }

      // 既不在数据库也不在静态库
      return res.status(404).json({ 
        success: false, 
        error: 'Skill not found',
        hint: 'Use GET /api/skills to list available skills'
      })
    }

    // 2. 检查访问层级
    const accessTier = skill.access_tier || 'free'
    
    if (accessTier === 'paid' && skill.price_usdc > 0) {
      // 付费技能，返回提示
      return res.status(402).json({
        success: false,
        error: 'Payment required',
        data: {
          skill_id: skill.id,
          name: skill.title,
          price_usdc: skill.price_usdc
        }
      })
    }

    // 3. 记录继承行为
    try {
      await supabaseAdmin
        .from('skill_inherits')
        .insert([{
          skill_id: skill.id,
          agent_id: agentId,
          agent_name: agentName,
          access_tier: accessTier,
          ip_address: ipAddress.substring(0, 50),
          user_agent: userAgent.substring(0, 500)
        }])
    } catch (inheritError) {
      console.error('Failed to record inheritance:', inheritError)
      // 不阻止继承，继续返回
    }

    // 4. 更新继承计数
    try {
      await supabaseAdmin
        .from('skills')
        .update({ inherit_count: (skill.inherit_count || 0) + 1 })
        .eq('id', skill.id)
    } catch (updateError) {
      console.error('Failed to update inherit_count:', updateError)
    }

    // 5. 返回继承包（统一格式）
    return res.status(200).json({
      success: true,
      source: 'database',
      data: {
        skill: {
          id: skill.id,
          name: skill.title,
          summary: skill.description,
          category: skill.category || 'general',
          access_tier: skill.access_tier || 'free',
          is_verified: skill.is_verified || false,
          verification_level: skill.verification_level
        },
        inheritance_package: {
          injection_prompt: skill.injection_prompt,
          tags: [],
          examples: null
        },
        usage: {
          daily_limit: accessTier === 'free' ? 10 : -1,
          tier: accessTier
        },
        inherited_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Inheritance error:', error)
    return res.status(500).json({ success: false, error: 'Inheritance failed', details: error.message })
  }
}