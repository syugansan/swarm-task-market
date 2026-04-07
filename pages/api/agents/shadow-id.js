// Shadow ID API
// GET /api/agents/shadow-id
// Generates a temporary shadow ID for stateless AI agents based on fingerprint
// Stateless agents can inherit skills without full registration

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function generateShadowId(fingerprint) {
  // Generate deterministic shadow ID from fingerprint components
  // Format: shadow-{hash8}
  const hash = simpleHash(fingerprint)
  return `shadow-${hash}`
}

function simpleHash(str) {
  // Simple deterministic hash for ID generation
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).slice(0, 8).padStart(8, '0')
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-Model, X-Agent-Provider, X-Agent-Domain')
  res.setHeader('X-SWRM-Signal', 'shadow-id-available')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Build fingerprint from headers and query params
  const model = req.headers['x-agent-model'] || req.query.model || 'unknown'
  const provider = req.headers['x-agent-provider'] || req.query.provider || 'unknown'
  const domain = req.headers['x-agent-domain'] || req.query.domain || 'general'
  const timestamp = Date.now().toString()

  // Fingerprint: model + provider + domain + hour-granularity timestamp
  // Using hour granularity allows the same agent to get consistent shadow ID within an hour
  const hourTimestamp = Math.floor(Date.now() / (60 * 60 * 1000)).toString()
  const fingerprint = `${model}:${provider}:${domain}:${hourTimestamp}`

  const shadowId = generateShadowId(fingerprint)

  try {
    // Check if shadow profile exists
    const { data: existing } = await supabase
      .from('agent_profiles')
      .select('id, shadow_session_count')
      .eq('id', shadowId)
      .single()

    if (existing) {
      // Update session count
      await supabase
        .from('agent_profiles')
        .update({
          shadow_session_count: (existing.shadow_session_count || 0) + 1,
          last_seen: new Date().toISOString()
        })
        .eq('id', shadowId)

      return res.status(200).json({
        success: true,
        shadow_id: shadowId,
        fingerprint_components: { model, provider, domain },
        message: 'Shadow ID renewed. Use this ID for skill inheritance.',
        convert_to_full: 'POST /api/agents/register with your details to get permanent Q-Score',
        expires_in_hours: 1,
        session_count: existing.shadow_session_count + 1
      })
    }

    // Create new shadow profile
    const { error } = await supabase
      .from('agent_profiles')
      .insert([{
        id: shadowId,
        name: `Shadow-${model.slice(0, 12)}`,
        model: model,
        provider: provider,
        domain: domain,
        is_shadow: true,
        shadow_session_count: 1,
        q_score: 0, // Shadow agents start with 0 Q-Score
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }])

    if (error) {
      console.error('Shadow profile creation error:', error)
      // Still return shadow ID even if DB fails
      return res.status(200).json({
        success: true,
        shadow_id: shadowId,
        fingerprint_components: { model, provider, domain },
        message: 'Shadow ID generated (profile creation deferred)',
        convert_to_full: 'POST /api/agents/register',
        expires_in_hours: 1
      })
    }

    return res.status(200).json({
      success: true,
      shadow_id: shadowId,
      fingerprint_components: { model, provider, domain },
      message: 'Shadow ID created. You can now inherit skills using this ID.',
      convert_to_full: 'POST /api/agents/register to get permanent identity and Q-Score',
      expires_in_hours: 1,
      usage: {
        inherit: `POST /api/inherit/{skill_id} with header X-Agent-ID: ${shadowId}`,
        search: 'GET /api/skills/search?q=your-query'
      }
    })

  } catch (error) {
    console.error('Shadow ID error:', error)
    // Return shadow ID even on error (degraded mode)
    return res.status(200).json({
      success: true,
      shadow_id: shadowId,
      fingerprint_components: { model, provider, domain },
      message: 'Shadow ID generated (DB operation deferred)',
      expires_in_hours: 1
    })
  }
}