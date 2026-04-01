// Next.js API Route - 代理搜索请求到后端
// 本地开发连接 localhost:8000，生产环境直接连接后端

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'http://127.0.0.1:8000'  // 生产环境用内网地址
  : 'http://localhost:8000';

export default async function handler(req, res) {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/skills/search?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
}