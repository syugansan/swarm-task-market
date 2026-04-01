const { analyzeTaskIntent, NVIDIA_TASK_MODEL } = require('../../../lib/nvidia-task-concierge')

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : ''

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' })
  }

  try {
    const reply = await analyzeTaskIntent(prompt)

    return res.status(200).json({
      success: true,
      provider: 'nvidia',
      model: NVIDIA_TASK_MODEL,
      reply
    })
  } catch (error) {
    console.error('Task concierge error:', error)

    return res.status(500).json({
      error: 'Task concierge unavailable',
      details: error.message
    })
  }
}
