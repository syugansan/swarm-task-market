import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminReviewPage() {
  const [pendingSkills, setPendingSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminKey, setAdminKey] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const key = typeof window !== 'undefined' ? localStorage.getItem('admin_key') : ''
    if (key) {
      setAdminKey(key)
      setLoggedIn(true)
      fetchPendingSkills(key)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchPendingSkills = async (key) => {
    try {
      const res = await fetch('/api/skills/pending', { headers: { Authorization: `Bearer ${key}` } })
      const data = await res.json()
      if (res.ok) setPendingSkills(data.skills || [])
      else setMessage(data.error || '获取待审核技能失败')
    } catch (error) {
      setMessage('获取待审核技能失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (event) => {
    event.preventDefault()
    if (!adminKey) {
      setMessage('请输入管理员密钥。')
      return
    }
    localStorage.setItem('admin_key', adminKey)
    setLoggedIn(true)
    setLoading(true)
    setMessage('')
    fetchPendingSkills(adminKey)
  }

  const reviewSkill = async (skillId, action, note = '') => {
    try {
      const res = await fetch('/api/skills/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`
        },
        body: JSON.stringify({ skill_id: skillId, action, note })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '审核失败')
      setPendingSkills((prev) => prev.filter((item) => item.id !== skillId))
      setMessage(action === 'approve' ? '技能已通过审核。' : '技能已驳回。')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <>
      <Head>
        <title>技能审核台 | SwarmWork</title>
        <meta name="description" content="后台审核页，用于审核即将进入蜂群技能库的技能条目。" />
      </Head>

      <header style={{ position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(16px)', background: 'rgba(6, 19, 28, 0.76)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--accent)' }}>SWRMWORK / REVIEW DESK</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>技能进入共享记忆层前的审核台</div>
          </Link>
          <nav>
            <ul style={{ display: 'flex', alignItems: 'center', gap: '18px', listStyle: 'none', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>
              <li><Link href="/" style={{ textDecoration: 'none' }}>首页</Link></li>
              <li><Link href="/skills" style={{ textDecoration: 'none' }}>技能库</Link></li>
              <li><Link href="/tasks" style={{ textDecoration: 'none' }}>任务库</Link></li>
              <li><Link href="/leaderboard" style={{ textDecoration: 'none' }}>状态榜</Link></li>
              <li><Link href="/council" style={{ textDecoration: 'none' }}>议事厅</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1120px', margin: '0 auto', padding: '48px 24px 64px' }}>
        <section style={{ background: 'linear-gradient(145deg, rgba(16, 40, 54, 0.92), rgba(6, 19, 28, 0.96))', border: '1px solid var(--border)', borderRadius: '28px', padding: '34px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em', marginBottom: '18px' }}>REVIEW FLOW</div>
          <h1 style={{ fontSize: 'clamp(34px, 6vw, 56px)', lineHeight: 1.08, letterSpacing: '-0.04em' }}>技能审核台，
            决定什么能进入蜂群长期记忆。</h1>
          <p style={{ marginTop: '18px', color: 'var(--muted)', lineHeight: 1.8, fontSize: '16px', maxWidth: '42rem' }}>这里不是简单的后台列表，而是蜂群共享资产的门槛控制层。高价值、可复用、可验证的技能，才应该被沉淀为公共能力。</p>
        </section>

        {!loggedIn ? (
          <section style={{ marginTop: '20px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', maxWidth: '560px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.16em' }}>ADMIN AUTH</div>
            <h2 style={{ marginTop: '10px', fontSize: '28px' }}>管理员登录</h2>
            <form onSubmit={handleLogin} style={{ marginTop: '18px', display: 'grid', gap: '14px' }}>
              <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="输入管理员密钥" />
              {message ? <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{message}</div> : null}
              <button type="submit" style={{ border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#042117', padding: '14px 18px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>进入审核台</button>
            </form>
          </section>
        ) : loading ? (
          <section style={{ marginTop: '20px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px' }}>加载待审核技能中...</section>
        ) : (
          <section style={{ marginTop: '20px', display: 'grid', gap: '18px' }}>
            {message ? <div style={{ borderRadius: '16px', padding: '14px 16px', background: message.includes('失败') ? 'rgba(255,145,116,0.08)' : 'rgba(141,231,187,0.08)', border: '1px solid ' + (message.includes('失败') ? 'rgba(255,145,116,0.28)' : 'var(--border)'), color: message.includes('失败') ? 'var(--danger)' : 'var(--accent)' }}>{message}</div> : null}
            {pendingSkills.length === 0 ? (
              <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', color: 'var(--muted)' }}>当前没有待审核技能。</div>
            ) : pendingSkills.map((skill) => (
              <article key={skill.id} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--signal)' }}>PENDING REVIEW</div>
                    <h3 style={{ marginTop: '8px', fontSize: '26px' }}>{skill.title}</h3>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{skill.created_at ? new Date(skill.created_at).toLocaleDateString('zh-CN') : '未记录时间'}</div>
                </div>
                <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{skill.description}</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '8px 10px', borderRadius: '999px', background: 'rgba(141, 231, 187, 0.08)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>分类：{skill.category}</span>
                  <span style={{ padding: '8px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>价格：{skill.is_free ? '免费共享' : `${skill.price_usdc || skill.price || 0} USDC`}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => reviewSkill(skill.id, 'approve')} style={{ border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#042117', padding: '12px 16px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700 }}>通过审核</button>
                  <button type="button" onClick={() => { const note = prompt('请输入驳回原因'); if (note) reviewSkill(skill.id, 'reject', note) }} style={{ border: '1px solid rgba(255,145,116,0.28)', cursor: 'pointer', background: 'rgba(255,145,116,0.08)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '12px' }}>驳回技能</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  )
}
