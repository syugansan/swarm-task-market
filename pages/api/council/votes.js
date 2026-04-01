const { supabaseAdmin } = require('../../../lib/supabase-admin')

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function summarizeVotes(rows) {
  const summary = {
    support: 0,
    oppose: 0,
    abstain: 0,
    total_weight: 0,
    votes: rows || []
  }

  for (const row of rows || []) {
    const weight = Number(row.vote_weight) || 1
    if (row.vote_type === 'support') summary.support += weight
    if (row.vote_type === 'oppose') summary.oppose += weight
    if (row.vote_type === 'abstain') summary.abstain += weight
    summary.total_weight += weight
  }

  return summary
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
      .from('council_votes')
      .select('*')
      .eq('proposal_id', proposal_id)

    if (error) {
      console.error('Council votes list error:', error)
      return res.status(500).json({ error: 'Failed to load votes', details: error.message })
    }

    return res.status(200).json({
      success: true,
      proposal_id,
      summary: summarizeVotes(data)
    })
  }

  if (req.method === 'POST') {
    const {
      proposal_id,
      voter_id = null,
      voter_name,
      vote_type,
      vote_weight = 1,
      vote_reason = null
    } = req.body || {}

    if (!proposal_id || !voter_name || !vote_type) {
      return res.status(400).json({
        error: 'proposal_id, voter_name, vote_type are required'
      })
    }

    if (!['support', 'oppose', 'abstain'].includes(vote_type)) {
      return res.status(400).json({
        error: 'vote_type must be support, oppose, or abstain'
      })
    }

    let existingVote = null

    if (voter_id) {
      const { data } = await supabaseAdmin
        .from('council_votes')
        .select('vote_id')
        .eq('proposal_id', proposal_id)
        .eq('voter_id', voter_id)
        .maybeSingle()

      existingVote = data
    } else {
      const { data } = await supabaseAdmin
        .from('council_votes')
        .select('vote_id')
        .eq('proposal_id', proposal_id)
        .eq('voter_name', voter_name)
        .maybeSingle()

      existingVote = data
    }

    let result
    let error

    const payload = {
      proposal_id,
      voter_id,
      voter_name: voter_name.trim(),
      vote_type,
      vote_weight,
      vote_reason
    }

    if (existingVote?.vote_id) {
      ;({ data: result, error } = await supabaseAdmin
        .from('council_votes')
        .update(payload)
        .eq('vote_id', existingVote.vote_id)
        .select()
        .single())
    } else {
      ;({ data: result, error } = await supabaseAdmin
        .from('council_votes')
        .insert([payload])
        .select()
        .single())
    }

    if (error) {
      console.error('Council vote save error:', error)
      return res.status(500).json({ error: 'Failed to save vote', details: error.message })
    }

    return res.status(200).json({
      success: true,
      vote: result
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
