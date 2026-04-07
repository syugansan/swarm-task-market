// 语义搜索 - 直连 Supabase pgvector，不依赖 Python 后端
// 使用 NVIDIA NIM 生成 embedding，在 JS 层计算余弦相似度

import { supabaseAdmin } from '../../../lib/supabase'

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY

async function generateEmbedding(text) {
  const resp = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'nvidia/nv-embedqa-e5-v5',
      input: text,
      input_type: 'query'
    })
  })

  if (!resp.ok) {
    throw new Error(`NVIDIA API error: ${resp.status}`)
  }

  const data = await resp.json()
  return data.data[0].embedding
}

function cosineSimilarity(vec1, vec2) {
  let dot = 0, mag1 = 0, mag2 = 0
  for (let i = 0; i < vec1.length; i++) {
    dot += vec1[i] * vec2[i]
    mag1 += vec1[i] * vec1[i]
    mag2 += vec2[i] * vec2[i]
  }
  if (mag1 === 0 || mag2 === 0) return 0
  return dot / (Math.sqrt(mag1) * Math.sqrt(mag2))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { q } = req.query
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' })

  if (!NVIDIA_API_KEY) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY not configured' })
  }

  try {
    // 1. 生成查询 embedding
    const queryEmbedding = await generateEmbedding(q)

    // 2. 从 Supabase 取所有有 embedding 的 active 技能
    const client = supabaseAdmin
    const { data: skills, error } = await client
      .from('skills')
      .select('id, title, description, category, injection_prompt, access_tier, is_verified, inherit_count, embedding')
      .eq('status', 'active')
      .not('embedding', 'is', null)

    if (error) throw new Error(`Supabase error: ${error.message}`)

    // 3. 计算余弦相似度并排序
    const scored = skills
      .map(skill => {
        let emb = skill.embedding
        if (typeof emb === 'string') {
          try { emb = JSON.parse(emb) } catch { return null }
        }
        if (!Array.isArray(emb)) return null
        return {
          id: skill.id,
          name: skill.title,
          summary: skill.description,
          category: skill.category || 'general',
          injection_prompt: skill.injection_prompt,
          access_tier: skill.access_tier || 'free',
          is_verified: skill.is_verified || false,
          inherit_count: skill.inherit_count || 0,
          similarity_score: cosineSimilarity(queryEmbedding, emb)
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 10)

    res.status(200).json({
      success: true,
      results: scored,
      query: q,
      mode: 'semantic'
    })

  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search failed', details: error.message })
  }
}
