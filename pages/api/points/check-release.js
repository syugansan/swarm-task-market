// Next.js API Route - 检查质押状态
// 路径: pages/api/points/check-release.js
// 创建时间: 2026-03-29

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const skill_id = req.method === 'GET' ? req.query.skill_id : req.body.skill_id

  if (!skill_id) {
    return res.status(400).json({ error: 'Missing skill_id' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 调用 Supabase 函数检查质押状态
    const { data, error } = await supabase.rpc('check_skill_escrow_status', {
      p_skill_id: skill_id
    })

    if (error) {
      // 如果函数不存在，手动查询
      console.log('Function not found, fallback to manual query')
      
      // 获取质押信息
      const { data: escrow, error: escrowError } = await supabase
        .from('skill_escrow')
        .select('*')
        .eq('skill_id', skill_id)
        .single()

      if (escrowError || !escrow) {
        return res.status(404).json({ error: 'No escrow found for this skill' })
      }

      // 获取配置
      const { data: configs } = await supabase
        .from('system_config')
        .select('key, value')
        .in('key', ['min_inherits_for_release', 'min_rating_for_release', 'release_on_first_inherit'])

      const minInherits = configs?.find(c => c.key === 'min_inherits_for_release')?.value || '1'
      const minRating = configs?.find(c => c.key === 'min_rating_for_release')?.value || '3.5'
      const releaseOnFirst = configs?.find(c => c.key === 'release_on_first_inherit')?.value || 'true'

      // 判断是否可释放
      let canRelease = false
      let reason = ''

      if (escrow.status !== 'held') {
        reason = escrow.status
      } else if (releaseOnFirst === 'true' && escrow.inherits_count >= 1) {
        canRelease = true
        reason = 'first_inherit'
      } else if (escrow.inherits_count >= parseInt(minInherits) && escrow.avg_rating >= parseFloat(minRating)) {
        canRelease = true
        reason = 'quality_passed'
      } else if (new Date(escrow.expires_at) < new Date() && escrow.inherits_count === 0) {
        canRelease = false
        reason = 'expired_no_inherit'
      } else if (new Date(escrow.expires_at) < new Date() && escrow.avg_rating < parseFloat(minRating)) {
        canRelease = false
        reason = 'low_rating'
      } else {
        reason = 'pending'
      }

      return res.status(200).json({
        skill_id,
        escrow_id: escrow.id,
        status: escrow.status,
        escrow_points: escrow.escrow_points,
        inherits_count: escrow.inherits_count,
        avg_rating: escrow.avg_rating,
        expires_at: escrow.expires_at,
        config: {
          min_inherits: parseInt(minInherits),
          min_rating: parseFloat(minRating),
          release_on_first: releaseOnFirst === 'true'
        },
        can_release: canRelease,
        reason
      })
    }

    res.status(200).json(data)

  } catch (error) {
    console.error('Check release error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}