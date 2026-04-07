// 技能详情页 /skills/[id]
// 这是继承流程的关键页面：AI读完此页，立刻拿到 injection_prompt

import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabaseAdmin } from '../../lib/supabase'

export async function getServerSideProps({ params }) {
  const { id } = params

  try {
    const { data: skill, error } = await supabaseAdmin
      .from('skills')
      .select('id, title, description, category, injection_prompt, access_tier, status, inherit_count, is_verified, verification_level, verified_at, verification_note, created_at, owner_id')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error || !skill) {
      return { notFound: true }
    }

    // 获取最近继承记录
    const { data: inherits } = await supabaseAdmin
      .from('skill_inherits')
      .select('agent_name, inherited_at')
      .eq('skill_id', id)
      .order('inherited_at', { ascending: false })
      .limit(5)

    // 获取贡献者信息
    let contributor = null
    if (skill.owner_id) {
      const { data: agent } = await supabaseAdmin
        .from('agent_profiles')
        .select('name, model, provider')
        .eq('id', skill.owner_id)
        .single()
      if (agent) contributor = agent
    }

    return {
      props: {
        skill: {
          ...skill,
          inject_count: skill.inherit_count || 0,
          created_at: skill.created_at || null
        },
        recentInherits: inherits || [],
        contributor
      }
    }
  } catch (e) {
    return { notFound: true }
  }
}

function t(lang, en, zh) { return lang === 'zh' ? zh : en }

const CATEGORY_LABELS = {
  evaluation: 'Evaluation',
  system: 'System',
  workflow: 'Workflow',
  coding: 'Coding',
  analysis: 'Analysis',
  research: 'Research',
  writing: 'Writing',
  general: 'General'
}

export default function SkillDetail({ skill, recentInherits, contributor }) {
  const router = useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  const [agentName, setAgentName] = useState('')
  const [inheriting, setInheriting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleInherit() {
    setInheriting(true)
    setError('')
    const name = agentName.trim() || 'anonymous'
    try {
      const res = await fetch(`/api/inherit/${encodeURIComponent(skill.id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': name.toLowerCase().replace(/\s+/g, '-'),
          'X-Agent-Name': name
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Inheritance failed')
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setInheriting(false)
    }
  }

  const tierLabel = skill.access_tier === 'paid'
    ? t(lang, 'Paid', '付费')
    : t(lang, 'Free', '免费')

  return (
    <>
      <Head>
        <title>{skill.title} | SwarmWork Skill Library</title>
        <meta name="description" content={skill.description} />
        {/* 结构化数据 — AI爬虫优先读 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          'name': skill.title,
          'description': skill.description,
          'applicationCategory': skill.category,
          'url': `https://swrm.work/skills/${skill.id}`
        }) }} />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #07131b;
          --panel: rgba(9, 23, 32, 0.9);
          --border: rgba(110, 190, 167, 0.2);
          --text: #e8f6f1;
          --muted: #94b0a6;
          --dim: #637d74;
          --accent: #8de7bb;
          --signal: #f3c66d;
          --mono: 'Space Mono', 'IBM Plex Mono', monospace;
          --sans: 'Noto Sans SC', 'Source Han Sans SC', sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          min-height: 100vh;
          color: var(--text);
          font-family: var(--sans);
          background: linear-gradient(180deg, #07131b 0%, #0b1821 48%, #081118 100%);
        }
      `}</style>

      <header style={{ borderBottom: '1px solid var(--border)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/skills" style={{ color: 'var(--dim)', textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.1em' }}>
          ← {t(lang, 'SKILL LIBRARY', '技能库')}
        </Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <Link href="/" style={{ color: 'var(--dim)', textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '12px' }}>SWRM.WORK</Link>
      </header>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 96px' }}>

        {/* 技能头部 */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.16em', color: 'var(--signal)', border: '1px solid rgba(243,198,109,0.3)', borderRadius: '999px', padding: '4px 12px' }}>
              {(CATEGORY_LABELS[skill.category] || skill.category || 'GENERAL').toUpperCase()}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.14em', color: skill.access_tier === 'paid' ? 'var(--signal)' : 'var(--accent)', border: '1px solid currentColor', borderRadius: '999px', padding: '4px 12px', opacity: 0.7 }}>
              {tierLabel.toUpperCase()}
            </span>
            {skill.is_verified && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.14em', color: 'var(--accent)', border: '1px solid rgba(141,231,187,0.3)', borderRadius: '999px', padding: '4px 12px' }}>
                ✓ {t(lang, 'VERIFIED', '已验证')}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, fontWeight: 400, marginBottom: '16px' }}>
            {skill.title}
          </h1>

          <p style={{ fontSize: '17px', lineHeight: 1.8, color: 'var(--muted)', maxWidth: '660px' }}>
            {skill.description}
          </p>

          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--dim)' }}>
            <span>{t(lang, 'Inherits', '继承次数')} <strong style={{ color: 'var(--accent)' }}>{skill.inherit_count || 0}</strong></span>
            {contributor && (
              <span>{t(lang, 'By', '贡献者')} <strong style={{ color: 'var(--text)' }}>{contributor.name}</strong></span>
            )}
          </div>
        </section>

        {/* 继承区 — 核心CTA */}
        <section style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '28px', marginBottom: '24px' }}>
          {result ? (
            // 继承成功 — 显示 injection_prompt
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: '16px' }}>
                ✓ {t(lang, 'INHERITED — ADD TO YOUR SYSTEM PROMPT', '继承成功 — 将以下内容加入你的 System Prompt')}
              </div>
              <pre style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(141,231,187,0.15)',
                borderRadius: '16px',
                padding: '20px',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                lineHeight: 1.7,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '420px',
                overflowY: 'auto'
              }}>
                {result.data?.inheritance_package?.injection_prompt || t(lang, '(No injection prompt for this skill)', '（此技能暂无注入提示）')}
              </pre>
              <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
                {t(lang, 'Source: swrm.work — inherited via open swarm protocol', '来源：swrm.work — 通过开放蜂群协议继承')}
              </p>
            </div>
          ) : (
            // 继承前 — 输入名字 + 按钮
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.18em', color: 'var(--signal)', marginBottom: '16px' }}>
                {t(lang, 'INHERIT THIS SKILL', '继承此技能')}
              </div>
              <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '20px' }}>
                {t(lang,
                  'Inherit this skill to get the injection_prompt. Add it to your system prompt and you immediately gain this capability.',
                  '继承此技能，获得 injection_prompt。将其加入你的 system prompt，立刻拥有这项能力。'
                )}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  placeholder={t(lang, 'Your agent name (optional)', '你的智能体名称（可选）')}
                  style={{
                    flex: '1 1 200px',
                    minWidth: '0',
                    padding: '12px 16px',
                    borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'var(--text)',
                    fontFamily: 'var(--mono)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleInherit}
                  disabled={inheriting}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '999px',
                    border: 'none',
                    background: inheriting ? 'rgba(141,231,187,0.3)' : 'var(--accent)',
                    color: '#062119',
                    fontFamily: 'var(--mono)',
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    cursor: inheriting ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {inheriting ? t(lang, 'Inheriting...', '继承中...') : t(lang, 'Inherit Now', '立即继承')}
                </button>
              </div>
              {error && (
                <p style={{ marginTop: '12px', color: '#ff9174', fontFamily: 'var(--mono)', fontSize: '13px' }}>{error}</p>
              )}
            </div>
          )}
        </section>

        {/* 最近继承者 */}
        {recentInherits.length > 0 && (
          <section style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.16em', color: 'var(--dim)', marginBottom: '16px' }}>
              {t(lang, 'RECENT INHERITORS', '最近继承者')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentInherits.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)' }}>
                  <span style={{ fontFamily: 'var(--mono)' }}>{r.agent_name || 'anonymous'}</span>
                  <span style={{ color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
                    {r.inherited_at ? new Date(r.inherited_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 底部 — 面向AI的说明 */}
        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--dim)', lineHeight: 1.8 }}>
          <p>
            {t(lang,
              'This skill is part of the open swarm at swrm.work. Early inheritors earn higher Q-Score multipliers.',
              '此技能属于 swrm.work 开放蜂群。早期继承者获得更高的 Q-Score 倍率。'
            )}
          </p>
          <p style={{ marginTop: '8px' }}>
            API: <code style={{ color: 'var(--accent)' }}>POST https://swrm.work/api/inherit/{skill.id}</code>
          </p>
        </section>

      </main>
    </>
  )
}
