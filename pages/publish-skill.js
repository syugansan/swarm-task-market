import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function PublishSkill() {
  const [form, setForm] = useState({
    title: '',
    category: 'swarm',
    description: '',
    tags: '',
    price: '1.0',
    is_free: false,
    content_url: '',
    documentation_url: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const categories = [
    { key: 'swarm', label: '蜂群' },
    { key: 'routing', label: '路由' },
    { key: 'coding', label: '编程' },
    { key: 'analysis', label: '分析' },
    { key: 'prompt', label: '提示词' },
    { key: 'other', label: '其他' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    // TODO: 提交到 Supabase
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setResult({
      success: true,
      message: '技能已提交审核，审核通过后将显示在技能市场。'
    })
    setSubmitting(false)
  }

  return (
    <>
      <Head>
        <meta charset="utf-8" />
        <title>发布技能 — SwarmWork</title>
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
        input, textarea, select {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: var(--sans);
          font-size: 14px;
          padding: 12px 16px;
          width: 100%;
          transition: border-color 0.15s;
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: var(--accent);
        }
        input::placeholder, textarea::placeholder {
          color: var(--text-dim);
        }
        label {
          display: block;
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          text-transform: uppercase;
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
        maxWidth: '800px',
        margin: '0 auto',
        padding: '100px 40px 80px'
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: '10px' }}>
            // PUBLISH SKILL
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 500, letterSpacing: '-0.02em' }}>
            发布技能<em style={{ fontStyle: 'normal', color: 'var(--text-muted)' }}>，让AI继承你的能力</em>
          </h1>
        </div>

        {/* Form */}
        {result ? (
          <div style={{
            padding: '40px',
            border: '1px solid var(--accent)',
            background: 'var(--accent-dim)',
            textAlign: 'center'
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--accent)', marginBottom: '16px' }}>
              ✓ {result.message}
            </div>
            <Link href="/skills" style={{
              display: 'inline-block',
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              padding: '10px 20px',
              border: '1px solid var(--accent)',
              background: 'transparent',
              color: 'var(--accent)',
              textDecoration: 'none'
            }}>返回技能市场 →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'grid',
            gap: '24px'
          }}>
            {/* 基本信息 */}
            <div style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '24px'
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '20px' }}>
                基本信息
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label>技能名称</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="例如：统计路由系统 v2.0"
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="详细描述你的技能功能、使用场景、验证方法..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label>标签（用逗号分隔）</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({...form, tags: e.target.value})}
                  placeholder="例如：蜂群, 路由, Python"
                />
              </div>
            </div>

            {/* 定价 */}
            <div style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '24px'
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '20px' }}>
                定价
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={!form.is_free}
                    onChange={() => setForm({...form, is_free: false})}
                  />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--text)', textTransform: 'none' }}>收费技能</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={form.is_free}
                    onChange={() => setForm({...form, is_free: true, price: '0' })}
                  />
                  <span style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--text)', textTransform: 'none' }}>免费技能</span>
                </label>
              </div>

              {!form.is_free && (
                <div>
                  <label>每次继承价格（USDC）</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.price}
                    onChange={(e) => setForm({...form, price: e.target.value})}
                    placeholder="1.0"
                  />
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '8px' }}>
                    平台抽成 10%，发布者获得 90%
                  </div>
                </div>
              )}
            </div>

            {/* 内容 */}
            <div style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '24px'
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '20px' }}>
                内容链接
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>技能包下载地址</label>
                <input
                  type="url"
                  value={form.content_url}
                  onChange={(e) => setForm({...form, content_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label>文档地址</label>
                <input
                  type="url"
                  value={form.documentation_url}
                  onChange={(e) => setForm({...form, documentation_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* 提交 */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                padding: '14px 24px',
                background: submitting ? 'var(--border)' : 'var(--accent)',
                border: 'none',
                color: submitting ? 'var(--text-dim)' : '#000',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? '提交中...' : '发布技能 →'}
            </button>
          </form>
        )}

        {/* 提示 */}
        <div style={{
          marginTop: '40px',
          padding: '24px',
          border: '1px solid var(--border)',
          background: 'var(--surface)'
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: '12px' }}>
            // 发布须知
          </div>
          <ul style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: '20px' }}>
            <li>技能需经过平台审核后才会显示在技能市场</li>
            <li>审核周期通常为 1-3 个工作日</li>
            <li>收费技能平台抽成 10%，发布者获得 90%</li>
            <li>免费技能可获得更多继承次数和影响力</li>
            <li>发布者需确保技能内容原创，不侵犯他人权益</li>
          </ul>
        </div>
      </main>
    </>
  )
}