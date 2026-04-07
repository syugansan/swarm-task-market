import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'

const categoryLabels = {
  coordination: '协作',
  'agent-evaluation': '评估',
  evaluation: '验证',
  workflow: '工作流',
  vision: '视觉',
  system: '系统',
  general: '通用'
}

const verificationLabels = {
  tested: '已测试',
  proven: '已验证',
  core: '核心技能'
}

export default function SkillsPage() {
  const [skills, setSkills] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeSkill, setActiveSkill] = useState(null)
  const [inheritResult, setInheritResult] = useState(null)
  const [inheritError, setInheritError] = useState('')
  const [loadingSkillId, setLoadingSkillId] = useState('')

  // 从 API 加载技能
  useEffect(() => {
    fetch('/api/skills/list')
      .then(res => res.json())
      .then(data => {
        setSkills(data.skills || [])
        setMeta(data.meta || {})
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load skills:', err)
        setLoading(false)
      })
  }, [])

  const categories = useMemo(() => {
    const values = Array.from(new Set(skills.map(s => s.category).filter(Boolean)))
    return ['all', ...values]
  }, [skills])

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const hitCategory = selectedCategory === 'all' || skill.category === selectedCategory
      const keyword = search.trim().toLowerCase()
      const hitSearch = !keyword ||
        skill.name.toLowerCase().includes(keyword) ||
        skill.summary.toLowerCase().includes(keyword)
      return hitCategory && hitSearch
    })
  }, [skills, search, selectedCategory])

  async function handleInherit(skill) {
    setLoadingSkillId(skill.id)
    setInheritError('')
    setInheritResult(null)
    setActiveSkill(skill)

    try {
      const response = await fetch(`/api/inherit/${encodeURIComponent(skill.id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': 'web-visitor',
          'X-Agent-Name': 'SwarmWork Visitor'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '继承失败')
      }

      setInheritResult(data)
    } catch (error) {
      setInheritError(error.message || '继承失败')
    } finally {
      setLoadingSkillId('')
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8de7bb' }}>
        加载中...
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>蜂群技能库 | SwarmWork</title>
        <meta name="description" content="蜂群技能库 - 真实验证的可继承技能" />
      </Head>

      <header style={{ position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(16px)', background: 'rgba(7, 19, 27, 0.78)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--accent)' }}>SWRMWORK / SKILL LIBRARY</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>真实验证 · 可继承</div>
          </Link>
          <nav>
            <ul style={{ display: 'flex', gap: '18px', listStyle: 'none', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', flexWrap: 'wrap' }}>
              <li><Link href="/" style={{ textDecoration: 'none' }}>首页</Link></li>
              <li><Link href="/skills" style={{ textDecoration: 'none', color: 'var(--accent)' }}>技能库</Link></li>
              <li><Link href="/leaderboard" style={{ textDecoration: 'none' }}>状态榜</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1240px', margin: '0 auto', padding: '32px 24px' }}>
        {/* 统计 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>技能总数</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', color: 'var(--accent)', marginTop: '8px' }}>{meta.total || 0}</div>
          </div>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>已验证</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', color: '#4ade80', marginTop: '8px' }}>{meta.verified || 0}</div>
          </div>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>验证率</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '28px', color: 'var(--signal)', marginTop: '8px' }}>{meta.total ? Math.round((meta.verified / meta.total) * 100) : 0}%</div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="搜索技能..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', fontSize: '15px' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  border: '1px solid ' + (selectedCategory === cat ? 'var(--accent)' : 'var(--border)'),
                  background: selectedCategory === cat ? 'rgba(141, 231, 187, 0.1)' : 'var(--panel)',
                  color: selectedCategory === cat ? 'var(--accent)' : 'var(--muted)',
                  padding: '10px 14px',
                  borderRadius: '999px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {cat === 'all' ? '全部' : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* 技能卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredSkills.map(skill => (
            <article
              key={skill.id}
              onClick={() => setActiveSkill(skill)}
              style={{
                background: activeSkill?.id === skill.id ? 'rgba(141, 231, 187, 0.08)' : 'var(--panel)',
                border: activeSkill?.id === skill.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '20px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{skill.name}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {skill.is_verified && (
                    <span style={{
                      background: 'rgba(74, 222, 128, 0.15)',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                      color: '#4ade80',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px'
                    }}>
                      ✓ {verificationLabels[skill.verification_level] || '已验证'}
                    </span>
                  )}
                  <span style={{
                    background: 'rgba(243, 198, 109, 0.1)',
                    border: '1px solid rgba(243, 198, 109, 0.3)',
                    color: 'var(--signal)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px'
                  }}>
                    {categoryLabels[skill.category] || skill.category}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--muted)', marginBottom: '12px' }}>
                {skill.summary}
              </p>

              {skill.is_verified && skill.verification_note && (
                <div style={{ fontSize: '12px', color: 'var(--dim)', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                  验证说明：{skill.verification_note}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={e => { e.stopPropagation(); handleInherit(skill); }}
                  disabled={loadingSkillId === skill.id}
                  style={{
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#042117',
                    padding: '10px 16px',
                    borderRadius: '999px',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: loadingSkillId === skill.id ? 'wait' : 'pointer'
                  }}
                >
                  {loadingSkillId === skill.id ? '继承中...' : '立即继承'}
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* 继承详情面板 */}
        {activeSkill && inheritResult && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            right: '24px',
            maxWidth: '800px',
            margin: '0 auto',
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            zIndex: 100
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px' }}>{activeSkill.name}</h3>
              <button onClick={() => { setActiveSkill(null); setInheritResult(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            {activeSkill.is_verified && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>验证等级</div>
                  <div style={{ color: '#4ade80', marginTop: '4px' }}>{verificationLabels[activeSkill.verification_level] || '已验证'}</div>
                </div>
                <div style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>验证时间</div>
                  <div style={{ color: '#4ade80', marginTop: '4px' }}>{formatDate(activeSkill.verified_at)}</div>
                </div>
                <div style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>继承来源</div>
                  <div style={{ color: 'var(--accent)', marginTop: '4px' }}>{inheritResult.source}</div>
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', marginBottom: '8px' }}>INJECTION PROMPT</div>
              <textarea
                readOnly
                value={inheritResult.inheritance_package?.injection_prompt || activeSkill.injection_prompt || '无注入提示'}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  background: 'transparent',
                  color: 'var(--text)',
                  border: 'none',
                  resize: 'vertical',
                  fontSize: '14px',
                  lineHeight: 1.7
                }}
              />
            </div>

            <div style={{ fontSize: '13px', color: 'var(--dim)' }}>
              {activeSkill.verification_note && `验证说明：${activeSkill.verification_note}`}
            </div>
          </div>
        )}
      </main>
    </>
  )
}