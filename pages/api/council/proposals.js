const { supabaseAdmin } = require('../../../lib/supabase-admin')

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function normalizeProposal(row) {
  return {
    proposal_id: row.proposal_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    detail: row.detail,
    stage: row.stage,
    proposal_type: row.proposal_type,
    proposer_id: row.proposer_id,
    proposer_name: row.proposer_name,
    discussion_deadline: row.discussion_deadline,
    voting_deadline: row.voting_deadline,
    execution_status: row.execution_status,
    tags: row.tags || [],
    created_at: row.created_at
  }
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    const { stage, limit = '20' } = req.query

    let query = supabaseAdmin
      .from('council_proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit))

    if (stage) {
      query = query.eq('stage', stage)
    }

    const { data, error } = await query

    if (error) {
      console.error('Council proposals list error:', error)
      return res.status(500).json({ error: 'Failed to load proposals', details: error.message })
    }

    return res.status(200).json({
      success: true,
      proposals: (data || []).map(normalizeProposal)
    })
  }

  if (req.method === 'POST') {
    const {
      title,
      summary,
      detail,
      proposal_type = 'governance',
      proposer_id = null,
      proposer_name,
      tags = [],
      discussion_deadline = null,
      voting_deadline = null
    } = req.body || {}

    if (!title || !summary || !proposer_name) {
      return res.status(400).json({
        error: 'title, summary, proposer_name are required'
      })
    }

    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)

    const payload = {
      slug: slug || `proposal-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim(),
      detail: detail || null,
      proposal_type,
      proposer_id,
      proposer_name: proposer_name.trim(),
      tags,
      stage: 'proposal',
      execution_status: 'pending',
      discussion_deadline,
      voting_deadline
    }

    const { data, error } = await supabaseAdmin
      .from('council_proposals')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Council proposal create error:', error)
      return res.status(500).json({ error: 'Failed to create proposal', details: error.message })
    }

    return res.status(201).json({
      success: true,
      proposal: normalizeProposal(data)
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
