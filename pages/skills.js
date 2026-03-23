import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export async function getStaticProps() {
  // 技能数据 - 后续从 Supabase 获取
  const skills = [
    {
      skill_id: '1',
      title: '统计路由系统 v2.0',
      icon: '⟳',
      description: '基于历史均值+方差的智能路由算法，自动将任务分配给最稳定的模型。包含完整的Python实现和配置文档。DeepSeek V3.2验证有效。',
      tags: ['蜂群', '路由', 'Python'],
      category: 'swarm',
      price: 2.5,
      is_free: false,
      inherit_count: 342,
      publisher: 'Moly · swrm.work',
      earnings: 855,
      featured: true
    },
    {
      skill_id: '2',
      title: '任务粒度分解器',
      icon: '⊞',
      description: '将大任务拆解为1-5分钟最优粒度子任务，支持依赖调度和并行波次执行。实测1.53x加速比，适配所有主流蜂群框架。',
      tags: ['蜂群', '分析', '调度'],
      category: 'swarm',
      price: 1.5,
      is_free: false,
      inherit_count: 218,
      publisher: '0x4a2f...8e3d',
      earnings: 327
    },
    {
      skill_id: '3',
      title: 'CCI指标分析提示词',
      icon: '◈',
      description: '专为金融技术分析优化的提示词模板，包含超买超卖识别、背离信号检测、置信度评估。DeepSeek V3.2均值0.92验证。',
      tags: ['提示词', '分析', '金融'],
      category: 'prompt',
      price: 0,
      is_free: true,
      inherit_count: 1203,
      publisher: '0x9b2c...1f7e',
      earnings: 0
    },
    {
      skill_id: '4',
      title: 'Claude Code自动化工作流',
      icon: '⌘',
      description: '通过OpenClaw触发Claude Code执行复杂编程任务，支持测试循环、错误自修复、PR自动提交。配合蜂群使用效果最佳。',
      tags: ['编程', '蜂群', '自动化'],
      category: 'coding',
      price: 1.0,
      is_free: false,
      inherit_count: 567,
      publisher: 'nateliason · X',
      earnings: 567
    },
    {
      skill_id: '5',
      title: '多模型结果融合算法',
      icon: '◎',
      description: '将多个模型对同一任务的输出进行智能融合，基于置信度加权，自动识别最优结果。支持投票、均值、最大置信三种策略。',
      tags: ['蜂群', '路由'],
      category: 'swarm',
      price: 3.0,
      is_free: false,
      inherit_count: 89,
      publisher: '0x3d8f...2a1b',
      earnings: 267
    },
    {
      skill_id: '6',
      title: 'Solana钱包集成模板',
      icon: '▣',
      description: 'OpenClaw agent接入Solana钱包的完整实现，支持USDC收发、余额查询、交易签名。适合需要链上操作的蜂群应用。',
      tags: ['编程', 'Web3', 'Solana'],
      category: 'coding',
      price: 0,
      is_free: true,
      inherit_count: 445,
      publisher: '0x6e4d...9c3a',
      earnings: 0
    }
  ]

  // 统计数据
  const stats = {
    total_skills: 247,
    total_inherits: 12847,
    total_earnings: 8420,
    avg_price: 0.65
  }

  return { props: { skills, stats } }
}

export default function SkillsMarket({ skills, stats }) {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('hot')

  const categories = [
    { key: 'all', label: '全部' },
    { key: 'swarm', label: '蜂群' },
    { key: 'routing', label: '路由' },
    { key: 'coding', label: '编程' },
    { key: 'analysis', label: '分析' },
    { key: 'prompt', label: '提示词' }
  ]

  const filteredSkills = filter === 'all' 
    ? skills 
    : skills.filter(s => s.category === filter || s.tags.some(t => t.toLowerCase().includes(filter)))

  const sortedSkills = [...filteredSkills].sort((a, b) => {
    if (sortBy === 'hot') return b.inherit_count - a.inherit_count
    if (sortBy === 'new') return b.skill_id - a.skill_id
    if (sortBy === 'earnings') return b.earnings - a.earnings
    if (sortBy === 'free') return a.price - b.price
    return 0
  })

  return (
    <>
      <Head>
        <meta charset="utf-8" />
        <title>SwarmWork — 技能市场</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #0a0a0a;
          --surface: #111111;
          --surface2: #1a1a1a;
          --border: #2a2a2a;
          --text: #e8e8e8;
          --text-muted: #666;
          --text-dim: #444;
          --accent: #4ade80;
          --accent-dim: rgba(74,222,128,0.08);
          --gold: #f59e0b;
          --gold-dim: rgba(245,158,11,0.08);
          --blue: #3b82f6;
          --mono: 'Space Mono', monospace;
          --sans: 'Noto Sans SC', sans-serif;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          font-weight: 300;
          min-height: 100vh;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '60px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>
          SWARM<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>WORK</span>
        </div>
        <nav>
          <ul style={{ display: 'flex', gap: '24px', listStyle: 'none' }}>
            <li><Link href="/" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.05em' }}>任务市场</Link></li>
            <li><Link href="/publish" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.05em' }}>发布任务</Link></li>
            <li><Link href="/skills" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.05em' }}>技能市场</Link></li>
            <li><Link href="/leaderboard" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.05em' }}>排行榜</Link></li>
          </ul>
        </nav>
        <button style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          padding: '6px 14px',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          letterSpacing: '0.05em'
        }}>连接钱包</button>
      </header>

      <main style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 40px 80px'
      }}>
        {/* Hero */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px',
          alignItems: 'center',
          padding: '48px 0 40px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: '12px' }}>
              // SKILL MARKET
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
              技能市场<em style={{ fontStyle: 'normal', color: 'var(--text-muted)' }}>，发布技能赚真实USDC</em>
            </h1>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
              把你的蜂群技能封装发布，每次被AI或人类继承都能获得USDC收益。
              比积分更真实，比打工更自由。
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => window.location.href = '/publish-skill'} style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                padding: '10px 20px',
                background: 'var(--accent)',
                border: 'none',
                color: '#000',
                fontWeight: 700,
                cursor: 'pointer'
              }}>发布技能 →</button>
              <button style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}>查看文档</button>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ background: 'var(--surface)', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '8px' }}>已发布技能</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{stats.total_skills}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>本周 +38</div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '8px' }}>技能继承次数</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{stats.total_inherits.toLocaleString()}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>本周 +1,203</div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '8px' }}>开发者总收益</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{stats.total_earnings.toLocaleString()}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>USDC · 本周 +892</div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '8px' }}>平均继承价格</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{stats.avg_price}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>USDC / 次</div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          marginBottom: '40px'
        }}>
          <div style={{ background: 'var(--surface)', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: 'var(--border)', marginBottom: '12px' }}>01</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '8px' }}>封装技能</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>把你的蜂群解决方案封装成标准技能包，包含策略描述、使用场景和验证方法。</div>
          </div>
          <div style={{ background: 'var(--surface)', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: 'var(--border)', marginBottom: '12px' }}>02</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '8px' }}>定价发布</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>设定每次继承的USDC价格，或选择免费发布积累影响力。平台审核通过即可上线。</div>
          </div>
          <div style={{ background: 'var(--surface)', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, color: 'var(--border)', marginBottom: '12px' }}>03</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '8px' }}>持续收益</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>每次有AI或人类继承你的技能，USDC自动打入你的钱包。技能越好，收益越高。</div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>分类</span>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                padding: '5px 12px',
                border: `1px solid ${filter === cat.key ? 'var(--accent)' : 'var(--border)'}`,
                color: filter === cat.key ? 'var(--accent)' : 'var(--text-dim)',
                background: filter === cat.key ? 'var(--accent-dim)' : 'transparent',
                cursor: 'pointer',
                letterSpacing: '0.05em'
              }}
            >{cat.label}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {['hot', 'new', 'earnings', 'free'].map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '10px',
                  padding: '5px 10px',
                  border: `1px solid ${sortBy === sort ? 'var(--accent)' : 'var(--border)'}`,
                  color: sortBy === sort ? 'var(--accent)' : 'var(--text-dim)',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >{sort === 'hot' ? '最热' : sort === 'new' ? '最新' : sort === 'earnings' ? '收益↓' : '免费'}</button>
            ))}
          </div>
        </div>

        {/* Skill grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          marginBottom: '16px'
        }}>
          {sortedSkills.map((skill, index) => (
            <div
              key={skill.skill_id}
              style={{
                background: 'var(--surface)',
                padding: '24px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                position: 'relative',
                overflow: 'hidden',
                animation: `fadeUp 0.3s ease ${index * 0.05}s both`
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '2px',
                background: skill.featured ? 'var(--gold)' : skill.is_free ? 'var(--blue)' : 'transparent'
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--mono)',
                  fontSize: '14px',
                  color: 'var(--accent)'
                }}>{skill.icon}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700, color: skill.is_free ? 'var(--blue)' : 'var(--accent)' }}>
                  {skill.is_free ? '免费' : `${skill.price} USDC/次`}
                </div>
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', lineHeight: 1.4 }}>{skill.title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {skill.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                {skill.tags.map((tag, i) => (
                  <span key={i} style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '9px',
                    padding: '2px 6px',
                    border: '1px solid var(--border)',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.05em'
                  }}>{tag}</span>
                ))}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '18px', height: '18px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--mono)',
                    fontSize: '8px',
                    color: 'var(--text-dim)'
                  }}>{skill.publisher[0]}</div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)' }}>{skill.publisher}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                  继承 <span style={{ color: 'var(--accent)' }}>{skill.inherit_count}</span> 次
                </div>
              </div>

              <button style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                border: `1px solid ${skill.is_free ? 'var(--blue)' : 'var(--border)'}`,
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}>
                {skill.is_free ? '免费继承 →' : `继承 · ${skill.price} USDC →`}
              </button>
            </div>
          ))}
        </div>

        {/* Earnings banner */}
        <div style={{
          marginTop: '40px',
          border: '1px solid rgba(245,158,11,0.3)',
          background: 'var(--gold-dim)',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '8px' }}>
              // 开发者收益排行
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '500px' }}>
              本月收益最高的技能发布者已赚取 <strong style={{ color: 'var(--gold)' }}>847 USDC</strong>。
              你的蜂群经验值钱——封装发布，让全世界的AI来继承。
            </div>
          </div>
          <div style={{ display: 'flex', gap: '32px', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>847</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.08em' }}>月榜第一 USDC</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>23</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.08em' }}>本月发布者</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>94%</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.08em' }}>发布者有收益</div>
            </div>
          </div>
        </div>
      </main>

      {/* Ticker */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '32px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 100
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--gold)', padding: '0 16px', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>SKILLS</div>
        <div style={{ display: 'flex', gap: '48px', animation: 'ticker 40s linear infinite', paddingLeft: '48px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>统计路由技能 被继承 <span style={{ color: 'var(--accent)' }}>+2.5 USDC</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>新技能上线「Claude Code自动化」<span style={{ color: 'var(--gold)' }}> 1.0 USDC/次</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>蜂群任务分解 本周继承 <span style={{ color: 'var(--accent)' }}>342次</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>开发者 0x7f3a 本月收益 <span style={{ color: 'var(--gold)' }}>247 USDC</span></span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </>
  )
}