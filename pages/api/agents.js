import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const capabilitiesDir = 'C:\\Users\\73829\\.openclaw\\workspace\\agent-capabilities';
  
  try {
    const files = fs.readdirSync(capabilitiesDir).filter(f => f.endsWith('.json'));
    const agents = files.map(file => {
      let content = fs.readFileSync(path.join(capabilitiesDir, file), 'utf8');
      // Remove BOM if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return JSON.parse(content);
    });
    
    // Sort by compositeScore descending
    agents.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));
    
    res.status(200).json({ agents, count: agents.length });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message, path: capabilitiesDir });
  }
}
