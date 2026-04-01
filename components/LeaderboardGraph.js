import React, { useState } from 'react';

// 7维度评分（每项100分，总分700）
const AGENTS = [
  { 
    id: 'qwen3cp', 
    name: 'Qwen3 Coder Plus', 
    provider: '百炼',
    scores: { task_success: 96, correctness: 94, reliability: 92, obedience: 60, speed: 98, format: 95, insight: 85 },
    best: '编码',
    note: '编码快但不太听话，简单任务可以派'
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek V3.2', 
    provider: '豆包',
    scores: { task_success: 92, correctness: 95, reliability: 94, obedience: 96, speed: 70, format: 90, insight: 90 },
    best: '分析',
    note: '分析强、服从好，复杂任务首选'
  },
  { 
    id: 'kimi', 
    name: 'Kimi K2.5', 
    provider: '百炼',
    scores: { task_success: 88, correctness: 90, reliability: 88, obedience: 92, speed: 82, format: 88, insight: 92 },
    best: '图像+分析',
    note: '视觉判断准，长文档能读'
  },
  { 
    id: 'glm5', 
    name: 'GLM-5', 
    provider: '百炼',
    scores: { task_success: 85, correctness: 88, reliability: 90, obedience: 95, speed: 65, format: 98, insight: 85 },
    best: '分析',
    note: '输出规范，格式要求高时派它'
  },
  { 
    id: 'doubao_pro', 
    name: 'Doubao Pro', 
    provider: '豆包',
    scores: { task_success: 85, correctness: 82, reliability: 85, obedience: 90, speed: 98, format: 85, insight: 75 },
    best: '快速响应',
    note: 'MVP快，原型验证靠谱'
  },
  { 
    id: 'qwen3max', 
    name: 'Qwen3 Max', 
    provider: '百炼',
    scores: { task_success: 82, correctness: 85, reliability: 82, obedience: 70, speed: 68, format: 85, insight: 88 },
    best: '推理',
    note: '推理强，但服从性一般'
  },
  { 
    id: 'doubao_code', 
    name: 'Doubao Code', 
    provider: '豆包',
    scores: { task_success: 82, correctness: 88, reliability: 90, obedience: 92, speed: 75, format: 88, insight: 70 },
    best: '编码',
    note: '编码稳定，Qwen的备选方案'
  },
];

const DIMENSIONS = ['task_success', 'correctness', 'reliability', 'obedience', 'speed', 'format', 'insight'];
const DIMENSION_LABELS = {
  task_success: '任务成功',
  correctness: '正确性',
  reliability: '可靠性',
  obedience: '服从性',
  speed: '速度',
  format: '格式遵循',
  insight: '问题发现'
};

const LeaderboardGraph = ({ data }) => {
  const [selected, setSelected] = useState(null);

  const getTotalScore = (agent) => {
    return DIMENSIONS.reduce((sum, d) => sum + (agent.scores[d] || 0), 0);
  };

  return (
    <div style={{
      padding: '20px',
      background: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh'
    }}>
      <h2 style={{ marginBottom: '8px', fontSize: '22px' }}>蜂群能力图谱</h2>
      <p style={{ marginBottom: '20px', fontSize: '13px', color: '#666' }}>
        点击卡片查看详情 · 7维度评分（每项100分，总分700）
      </p>
      
      {/* 卡片网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '12px'
      }}>
        {AGENTS.map(agent => {
          const total = getTotalScore(agent);
          return (
            <div
              key={agent.id}
              onClick={() => setSelected(agent)}
              style={{
                background: '#111',
                border: `1px solid ${selected?.id === agent.id ? '#4ade80' : '#2a2a2a'}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {/* 名称和提供商 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>{agent.name}</span>
                <span style={{ 
                  fontSize: '10px', 
                  padding: '2px 8px',
                  background: agent.provider === '百炼' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                  border: `1px solid ${agent.provider === '百炼' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
                  borderRadius: '4px',
                  color: agent.provider === '百炼' ? '#3b82f6' : '#8b5cf6'
                }}>{agent.provider}</span>
              </div>
              
              {/* 总分 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1, height: '4px', background: '#2a2a2a', borderRadius: '2px' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(total / 700) * 100}%`, 
                    background: '#4ade80',
                    borderRadius: '2px'
                  }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80', minWidth: '45px' }}>
                  {total}/700
                </span>
              </div>
              
              {/* 一句话评价 */}
              <div style={{ fontSize: '12px', color: '#888' }}>{agent.note}</div>
            </div>
          );
        })}
      </div>

      {/* 详情面板 */}
      {selected && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: '#111',
          border: '1px solid #333',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>{selected.name}</h3>
            <button 
              onClick={() => setSelected(null)}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a2a',
                color: '#666',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >关闭</button>
          </div>
          
          {/* 总分 */}
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            background: '#0a0a0a', 
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#666' }}>总分</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#4ade80' }}>
              {getTotalScore(selected)}/700
            </span>
          </div>
          
          {/* 7维度详情 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {DIMENSIONS.map(dim => (
              <div key={dim} style={{ 
                padding: '10px', 
                background: '#0a0a0a', 
                borderRadius: '6px',
                border: '1px solid #1a1a1a'
              }}>
                <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>
                  {DIMENSION_LABELS[dim]}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '3px', background: '#2a2a2a', borderRadius: '2px' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${selected.scores[dim]}%`, 
                      background: selected.scores[dim] >= 90 ? '#4ade80' : 
                                  selected.scores[dim] >= 80 ? '#f59e0b' : '#ef4444',
                      borderRadius: '2px'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#e8e8e8', minWidth: '28px' }}>
                    {selected.scores[dim]}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* 评价 */}
          <div style={{ marginTop: '16px', padding: '12px', background: '#0a0a0a', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px' }}>AI 评价</div>
            <div style={{ fontSize: '13px', color: '#888' }}>{selected.note}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardGraph;