// Next.js API Route - 代理一键继承请求到后端

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'http://127.0.0.1:8000'
  : 'http://localhost:8000';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { authorization } = req.headers;
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ error: 'Missing domain parameter' });
    }
    
    const response = await fetch(`${BACKEND_URL}/api/skills/inherit?domain=${encodeURIComponent(domain)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || '',
      },
    });
    
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Inherit error:', error);
    res.status(500).json({ error: 'Inheritance failed', details: error.message });
  }
}