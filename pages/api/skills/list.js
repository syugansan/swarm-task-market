import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isTestSkill(skill) {
  const title = (skill?.title || '').toLowerCase()
  const description = (skill?.description || '').toLowerCase()

  return (
    title.includes('test') ||
    title.includes('loop test') ||
    title.includes('moly submit') ||
    description.includes('test skill')
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data, error } = await supabase
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
        created_at
      `)
      .eq('status', 'active')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch skills' })
    }

    const skills = (data || [])
      .filter((skill) => !isTestSkill(skill))
      .map((skill) => ({
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
        tags: [],
        examples: {}
      }))

    res.status(200).json({
      skills,
      meta: {
        total: skills.length,
        verified: skills.filter((skill) => skill.is_verified).length
      }
    })
  } catch (error) {
    console.error('Skills list error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
