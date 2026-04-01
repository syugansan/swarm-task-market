import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { q, id } = req.query;
  
  // 读取继承库
  const filePath = path.join(process.cwd(), 'data', 'inheritance-library.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // 按 ID 查询
  if (id) {
    const skill = data.skills.find(s => s.id === id);
    if (skill) {
      res.status(200).json(skill);
    } else {
      res.status(404).json({ error: 'Skill not found' });
    }
    return;
  }
  
  // 按关键词搜索
  if (q) {
    const results = data.skills.filter(skill => 
      skill.name.toLowerCase().includes(q.toLowerCase()) ||
      skill.summary.toLowerCase().includes(q.toLowerCase()) ||
      skill.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
    );
    res.status(200).json({ query: q, count: results.length, results });
    return;
  }
  
  // 返回全部
  res.status(200).json(data);
}