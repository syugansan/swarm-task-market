const { supabaseAdmin } = require('../../../lib/supabase-admin')

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    const { proposal_id } = req.query

    if (!proposal_id) {
      return res.status(400).json({ error: 'proposal_id is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('council_comments')
      .select('*')
      .eq('proposal_id', proposal_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Council comments list error:', error)
      return res.status(500).json({ error: 'Failed to load comments', details: error.message })
    }

    return res.status(200).json({
      success: true,
      comments: data || []
    })
  }

  if (req.method === 'POST') {
    const {
      proposal_id,
      author_id = null,
      author_name,
      stance = 'comment',
      content
    } = req.body || {}

    if (!proposal_id || !author_name || !content) {
      return res.status(400).json({
        error: 'proposal_id, author_name, content are required'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('council_comments')
      .insert([
        {
          proposal_id,
          author_id,
          author_name: author_name.trim(),
          stance,
          content: content.trim()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Council comment create error:', error)
      return res.status(500).json({ error: 'Failed to create comment', details: error.message })
    }

    return res.status(201).json({
      success: true,
      comment: data
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
