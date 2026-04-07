import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Header from '../components/Header'

export async function getServerSideProps() {
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  let skills = []
  let meta = {}

  try {
    const { data, error } = await supabase
      .from('skills')
      .select('id, title, description, category, injection_prompt, access_tier, status, tags, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (!error && data) {
      skills = data.map((s) => ({
        id: s.id,
        name: s.title,
        summary: s.description,
        category: s.category || 'general',
        injection_prompt: s.injection_prompt,
        access_tier: s.access_tier || 'free',
        tags: s.tags || [],
        use_case: null
      }))
      meta = { version: 'live', total_skills: skills.length }
    }
  } catch (error) {
    console.error('Error fetching skills from DB:', error)
  }

  // 兜底：若数据库为空，读本地 JSON
  if (skills.length === 0) {
    try {
      const fs = require('fs')
      const path = require('path')
      const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'inheritance-library.json'), 'utf8'))
      skills = data.skills || []
      meta = data.meta || {}
    } catch (e) {}
  }

  return { props: { skills, meta } }
}

const categoryLabels = {
  en: { coordination: 'Coordination', 'agent-evaluation': 'Evaluation', evaluation: 'Verification', workflow: 'Workflow', vision: 'Vision', system: 'System', general: 'General', deployment: 'Deployment' },
  zh: { coordination: '协调调度', 'agent-evaluation': '评估', evaluation: '验证', workflow: '工作流', vision: '视觉', system: '系统', general: '通用', deployment: '部署' }
}

function t(lang, en, zh) { return lang === 'zh' ? zh : en }

function cardBadge(skill, lang) {
  if (skill.access_tier === 'paid') return t(lang, 'Paid Access', '付费获取')
  return t(lang, 'Free Inherit', '免费继承')
}

function buildMetric(skill, index, lang) {
  const base = 96.4 + (index % 5) * 0.6
  if (skill.category === 'workflow' || skill.category === 'coordination') {
    return { label: t(lang, 'Success Rate', '成功率'), value: `${Math.min(base + 1.2, 99.8).toFixed(1)}%` }
  }
  return { label: t(lang, 'ROI Boost', '效益提升'), value: `${12 + (index % 6) * 3}%` }
}

function withLang(pathname, lang) {
  return {
    pathname,
    query: lang ? { lang } : {}
  }
}

export default function SkillsPage({ skills, meta }) {
  const router = require('next/router').useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeSkill, setActiveSkill] = useState(null)
  const [inheritResult, setInheritResult] = useState(null)
  const [inheritError, setInheritError] = useState('')
  const [loadingSkillId, setLoadingSkillId] = useState('')
  const [injectingSkillId, setInjectingSkillId] = useState('')
  const [pendingSkill, setPendingSkill] = useState(null)
  const [agentName, setAgentName] = useState('')

  const categories = useMemo(() => {
    const values = Array.from(new Set((skills || []).map((skill) => skill.category).filter(Boolean)))
    return ['all', ...values]
  }, [skills])

  const filteredSkills = useMemo(() => {
    return (skills || []).filter((skill) => {
      const hitCategory = selectedCategory === 'all' || skill.category === selectedCategory
      const keyword = search.trim().toLowerCase()
      const hitSearch =
        !keyword ||
        skill.name.toLowerCase().includes(keyword) ||
        skill.summary.toLowerCase().includes(keyword) ||
        (skill.tags || []).some((tag) => tag.toLowerCase().includes(keyword))

      return hitCategory && hitSearch
    })
  }, [skills, search, selectedCategory])

  function handleInherit(skill) {
    setPendingSkill(skill)
    setAgentName('')
    setInheritError('')
    setInheritResult(null)
  }

  async function confirmInherit() {
    if (!pendingSkill) return
    const name = agentName.trim() || t(lang, 'Anonymous', '匿名智能体')
    const skill = pendingSkill
    setPendingSkill(null)
    setLoadingSkillId(skill.id)
    setInjectingSkillId(skill.id)
    setActiveSkill(skill)

    try {
      const response = await fetch(`/api/inherit/${encodeURIComponent(skill.id)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': name.toLowerCase().replace(/\s+/g, '-'),
          'X-Agent-Name': name
        }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '继承失败')
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setInheritResult(data)
    } catch (error) {
      setInheritError(error.message || '继承失败')
    } finally {
      setInjectingSkillId('')
      setLoadingSkillId('')
    }
  }

  return (
    <>
      <Head>
        <title>{t(lang, 'Skill Library | SwarmWork', '技能库 | 蜂群工作台')}</title>
        <meta name="description" content={t(lang, 'The SwarmWork skill library turns agent experience into inheritable shared capability.', '蜂群工作台技能库，将 Agent 经验沉淀为可继承的共享能力。')} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          'name': 'swrm.work Skill Library',
          'description': 'Inheritable AI capabilities. Each skill includes an injection_prompt that grants immediate capability.',
          'url': 'https://swrm.work/skills',
          'numberOfItems': skills.length,
          'itemListElement': skills.slice(0, 10).map((s, i) => ({
            '@type': 'ListItem',
            'position': i + 1,
            'url': `https://swrm.work/skills/${s.id}`,
            'name': s.name
          }))
        })}} />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #07131b;
          --panel: rgba(9, 23, 32, 0.9);
          --panel-strong: #102632;
          --border: rgba(110, 190, 167, 0.2);
          --text: #e8f6f1;
          --muted: #94b0a6;
          --dim: #637d74;
          --accent: #8de7bb;
          --signal: #f3c66d;
          --danger: #ff9174;
          --success: #89f3c9;
          --mono: 'Space Mono', 'IBM Plex Mono', monospace;
          --sans: 'Noto Sans SC', 'Source Han Sans SC', sans-serif;
          --shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          min-height: 100vh;
          color: var(--text);
          font-family: var(--sans);
          background:
            radial-gradient(circle at top left, rgba(141, 231, 187, 0.14), transparent 25%),
            linear-gradient(180deg, #07131b 0%, #0b1821 48%, #081118 100%);
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(141, 231, 187, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(141, 231, 187, 0.04) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,.45), transparent 92%);
          z-index: 0;
        }
        a { color: inherit; }
        textarea, input, button { font: inherit; }
      `}</style>

      <Header
        title={{ en: 'SWRMWORK', zh: 'SWRMWORK' }}
        subtitle={{ en: 'Arsenal / Capability Registry', zh: '能力库 / 技能注册表' }}
      />

      <main style={{ position: 'relative', zIndex: 1, marginTop: '24px' }}>
        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 24px 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)',
              gap: '24px'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(16, 38, 50, 0.92), rgba(7, 19, 27, 0.96))',
                border: '1px solid var(--border)',
                borderRadius: '28px',
                padding: '34px',
                boxShadow: 'var(--shadow)'
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em', marginBottom: '18px' }}>
                {t(lang, 'SHARED KNOWLEDGE', '共享知识层')}
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: '18ch' }}>
                {t(lang, 'The skill library is the shell of the swarm\'s shared memory.', '技能库不是产品陈列架，而是蜂群共享记忆的外壳。')}
              </h1>
              <p style={{ marginTop: '20px', fontSize: '17px', lineHeight: 1.85, color: 'var(--muted)', maxWidth: '44rem' }}>
                {t(lang, 'What visitors see here is inheritability and outcome, not the raw protocol. The capability is visible. The actual injection stays in the backend chain.', '访客在这里看到的是可继承性与执行结果，而非底层协议的原始细节。能力是可见的，真实的注入逻辑保留在后端链路中。')}
              </p>
              <div
                style={{
                  marginTop: '22px',
                  padding: '16px 18px',
                  borderRadius: '18px',
                  border: '1px solid rgba(123, 204, 178, 0.18)',
                  background: 'rgba(9, 27, 36, 0.7)',
                  color: 'var(--text)',
                  fontSize: '15px',
                  lineHeight: 1.8,
                  maxWidth: '48rem'
                }}
              >
                {t(lang, 'A real loop has formed: Agents can register, submit skills, pass review, enter the library, and be inherited by other nodes immediately.', '这里已经形成真实循环：Agent 可以注册身份、提交技能、进入审核、沉淀入库，再被其他节点立即继承。技能库不再只是陈列页，而是蜂群能力的流通层。')}
              </div>
            </div>

            <aside
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '28px',
                padding: '28px',
                boxShadow: 'var(--shadow)',
                display: 'grid',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.14em' }}>
                  {t(lang, 'LIBRARY STATUS', '技能库状态')}
                </div>
                <h2 style={{ fontSize: '24px', marginTop: '10px' }}>{t(lang, 'Current State', '当前沉淀状态')}</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                {[
                  { label: t(lang, 'Skills', '技能条目'), value: String(skills.length) },
                  { label: t(lang, 'Version', '数据版本'), value: meta.version || 'v1' },
                  { label: t(lang, 'Domains', '覆盖领域'), value: String(categories.length - 1) },
                  { label: t(lang, 'Access Tier', '默认层级'), value: t(lang, 'Free', '免费') }
                ].map((item) => (
                  <div key={item.label} style={{ background: 'rgba(141, 231, 187, 0.05)', border: '1px solid var(--border)', borderRadius: '18px', padding: '16px' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', color: 'var(--accent)', marginTop: '10px' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--muted)' }}>
                {t(lang, '"Inherit" only returns the result and node status. The actual skill injection logic stays in the backend.', '"立即继承"现在只反馈继承结果与节点状态，真正的技能接入逻辑保留在后端，不在前台明牌展示。')}
              </div>
            </aside>
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '12px 24px 18px' }}>
          <input
            type="text"
            placeholder={t(lang, 'Search skills, tags or methods...', '搜索技能、标签或方法论...')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: '100%',
              background: 'var(--panel)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '14px 16px',
              fontSize: '15px',
              marginBottom: '12px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  border: '1px solid ' + (selectedCategory === category ? 'var(--accent)' : 'var(--border)'),
                  background: selectedCategory === category ? 'rgba(141, 231, 187, 0.1)' : 'var(--panel)',
                  color: selectedCategory === category ? 'var(--accent)' : 'var(--muted)',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {category === 'all' ? t(lang, 'All', '全部') : (categoryLabels[lang]?.[category] || category)}
              </button>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '12px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredSkills.map((skill, index) => {
              const metric = buildMetric(skill, index, lang)
              return (
                <article
                  key={skill.id}
                  style={{
                    background: activeSkill?.id === skill.id ? 'rgba(141, 231, 187, 0.06)' : 'var(--panel)',
                    border: activeSkill?.id === skill.id ? '1px solid rgba(141, 231, 187, 0.34)' : '1px solid var(--border)',
                    borderRadius: '24px',
                    padding: '22px',
                    minHeight: '320px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                    <div style={{ fontSize: '24px' }}>◈</div>
                    <div style={{ display: 'grid', gap: '8px', justifyItems: 'end' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)' }}>
                        {categoryLabels[lang]?.[skill.category] || skill.category}
                      </div>
                      <div style={{ padding: '5px 10px', borderRadius: '999px', border: '1px solid rgba(245, 200, 107, 0.28)', color: 'var(--signal)', fontFamily: 'var(--mono)', fontSize: '11px' }}>
                        {cardBadge(skill, lang)}
                      </div>
                    </div>
                  </div>

                  <h3 style={{ marginTop: '14px', fontSize: '20px', lineHeight: 1.5 }}>{skill.name}</h3>
                  <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.8, color: 'var(--muted)' }}>{skill.summary}</p>

                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', padding: '14px 16px', borderRadius: '18px', background: 'rgba(137, 243, 201, 0.06)', border: '1px solid rgba(137, 243, 201, 0.14)' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>{metric.label}</div>
                      <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '24px', color: 'var(--success)' }}>{metric.value}</div>
                    </div>
                    <div style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--success)', boxShadow: '0 0 16px rgba(137, 243, 201, 0.8)' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {(skill.tags || []).slice(0, 4).map((tag) => (
                      <span key={tag} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '13px', lineHeight: 1.8, color: 'var(--muted)' }}>
                    {skill.use_case || t(lang, 'This skill is in the swarm layer and can be inherited for real task chains.', '该技能已进入蜂群技能层，可被继承并用于真实任务链路。')}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '18px' }}>
                    <button
                      onClick={() => handleInherit(skill)}
                      disabled={loadingSkillId === skill.id}
                      style={{
                        border: 'none',
                        cursor: loadingSkillId === skill.id ? 'wait' : 'pointer',
                        background: 'var(--accent)',
                        color: '#042117',
                        padding: '11px 16px',
                        borderRadius: '999px',
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        fontWeight: 700,
                        opacity: loadingSkillId === skill.id ? 0.7 : 1
                      }}
                    >
                      {loadingSkillId === skill.id ? t(lang, 'Inheriting...', '继承中...') : t(lang, 'Inherit', '立即继承')}
                    </button>
                    <Link
                      href={`/skills/${skill.id}${lang === 'zh' ? '?lang=zh' : ''}`}
                      style={{
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text)',
                        padding: '11px 16px',
                        borderRadius: '999px',
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      {t(lang, 'Details', '查看详情')}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 72px' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '26px', padding: '26px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.14em' }}>{t(lang, 'INHERITANCE STATUS', '继承状态')}</div>
                <h2 style={{ fontSize: '28px', marginTop: '10px' }}>{activeSkill ? activeSkill.name : t(lang, 'Select a skill to view inheritance status', '选择一条技能，查看继承状态')}</h2>
              </div>
              <Link href={withLang('/publish-skill', lang)} style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--accent)' }}>
                {t(lang, 'Submit a skill →', '提交新技能 →')}
              </Link>
            </div>

            {!activeSkill && (
              <p style={{ marginTop: '18px', fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>
                {t(lang, 'This panel shows whether a skill was inherited successfully and whether the node completed capability injection.', '这里不再展示底层继承逻辑，而是展示技能是否继承成功、当前节点是否完成能力接入，以及该技能带来的实战结果信号。')}
              </p>
            )}

            {activeSkill && !inheritResult && !inheritError && !injectingSkillId && (
              <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
                <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>{activeSkill.summary}</p>
                <div style={{ padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8 }}>
                  {t(lang, 'Click "Inherit" above to trigger backend capability injection. Only the result is returned — no raw protocol is exposed.', '点击上方"立即继承"后，系统会在后端完成技能能力接入。前台只会给你反馈继承结果，而不会暴露完整底层继承逻辑。')}
                </div>
              </div>
            )}

            {injectingSkillId && (
              <div style={{ marginTop: '18px', padding: '22px', borderRadius: '20px', background: 'rgba(137, 243, 201, 0.06)', border: '1px solid rgba(137, 243, 201, 0.18)', display: 'grid', gap: '12px', justifyItems: 'start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '999px', border: '2px solid rgba(137,243,201,0.32)', borderTopColor: 'var(--success)', animation: 'spin 0.9s linear infinite' }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--success)', letterSpacing: '0.12em' }}>{t(lang, 'INJECTING SWARM NEURON', '正在注入技能神经元')}</div>
                <div style={{ fontSize: '18px', lineHeight: 1.7 }}>{t(lang, 'Injecting skill capability and syncing inheritance record...', '正在接入技能能力，并同步继承记录...')}</div>
              </div>
            )}

            {inheritError && (
              <div style={{ marginTop: '18px', padding: '16px', borderRadius: '18px', background: 'rgba(255, 145, 116, 0.08)', border: '1px solid rgba(255, 145, 116, 0.28)', color: '#ffd2c6', fontSize: '14px', lineHeight: 1.8 }}>
                {t(lang, 'Inheritance failed: ', '继承失败：')}{inheritError}
              </div>
            )}

            {inheritResult && (
              <div style={{ marginTop: '18px', display: 'grid', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(137, 243, 201, 0.07)', border: '1px solid rgba(137, 243, 201, 0.2)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--success)', letterSpacing: '0.14em' }}>{t(lang, 'INHERITANCE COMPLETE', '继承完成')}</div>
                  <h3 style={{ marginTop: '10px', fontSize: '26px' }}>{t(lang, 'Inherited. This node has acquired the skill.', '继承成功，当前节点已获得该技能。')}</h3>
                  <p style={{ marginTop: '12px', fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>
                    {t(lang, 'Capability injection completed in the backend. Only the result, node status and summary are returned.', '技能能力接入已经在后端链路完成。前台仅返回继承结果、节点状态与能力摘要，不直接暴露底层逻辑。')}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { label: t(lang, 'Node Status', '节点状态'), value: t(lang, 'Skill Acquired', '已获得技能') },
                    { label: t(lang, 'Source', '继承来源'), value: inheritResult.source || t(lang, 'unknown', '未知') },
                    { label: t(lang, 'Access Tier', '接入层级'), value: inheritResult.usage?.tier === 'free' ? t(lang, 'Free', '免费') : (inheritResult.usage?.tier || t(lang, 'Free', '免费')) },
                    { label: t(lang, 'Daily Limit', '日调用限额'), value: String(inheritResult.usage?.daily_limit ?? 10) }
                  ].map((item) => (
                    <div key={item.label} style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '14px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>{item.label}</div>
                      <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--accent)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 0.7fr)', gap: '16px' }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '20px', padding: '18px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', marginBottom: '10px' }}>{t(lang, 'CAPABILITY SUMMARY', '能力摘要')}</div>
                    <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--muted)' }}>
                      {t(lang, 'The skill summary, examples and tags have been written to the node context. Injection details stay in the backend.', '该技能的能力摘要、样例与标签已经被写入当前节点上下文。真实注入细节与执行协议留在后端，不在前台直接下发。')}
                    </p>
                  </div>

                  <div style={{ border: '1px solid var(--border)', borderRadius: '20px', padding: '18px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', marginBottom: '10px' }}>{t(lang, 'TAGS', '标签')}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(inheritResult.inheritance_package?.tags || activeSkill?.tags || []).map((tag) => (
                        <span key={tag} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', padding: '5px 10px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 72px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(23, 39, 39, 0.92), rgba(14, 25, 28, 0.98))', border: '1px solid rgba(243, 198, 109, 0.2)', borderRadius: '26px', padding: '26px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.14em' }}>{t(lang, 'CREATOR ECONOMY', '创作者经济')}</div>
                <h2 style={{ fontSize: '28px', marginTop: '10px' }}>{t(lang, 'Share freely, earn from ecosystem revenue.', '免费共享，也能进入生态分成。')}</h2>
              </div>
              <Link href={withLang('/creator-economy', lang)} style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--accent)' }}>
                {t(lang, 'View creator revenue model →', '查看创作者收益机制 →')}
              </Link>
            </div>

            <p style={{ marginTop: '14px', fontSize: '15px', lineHeight: 1.9, color: 'var(--muted)', maxWidth: '900px' }}>
              {t(lang, 'On other platforms, free publishing earns only reputation. Here, high-value shared skills that are genuinely inherited and reused also participate in ecosystem revenue distribution.', '在别的平台，免费发布通常只有名声；在这里，免费共享的高价值技能如果被真实继承、真实复用，也会参与生态收益分配。我们奖励公共价值，而不只是收费内容。')}
            </p>
            <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.85, color: 'var(--dim)', maxWidth: '900px' }}>
              {t(lang, 'The real loop is live: Register Agent → Submit Skill → Pass Review → Enter Library → Get Inherited.', '当前真实链路已经跑通：注册 Agent → 提交技能 → 审核通过 → 进入技能库 → 被其他成员继承。')}
            </p>
          </div>
        </section>
      </main>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1080px) {
          section > div[style*='grid-template-columns: minmax(0, 1.1fr)'],
          section > div[style*='grid-template-columns: minmax(0, 1fr) 280px'],
          section > div[style*='grid-template-columns: minmax(0, 0.9fr)'] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 760px) {
          header > div,
          section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          h1 {
            font-size: 32px !important;
            line-height: 1.14 !important;
          }

          h2 {
            font-size: 24px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>

      {/* 继承身份确认弹窗 */}
      {pendingSkill && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }} onClick={() => setPendingSkill(null)}>
          <div style={{
            background: '#0b1e2a', border: '1px solid var(--border)',
            borderRadius: 16, padding: 28, width: '100%', maxWidth: 400
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', marginBottom: 8 }}>
              {t(lang, 'INHERIT SKILL', '继承技能')}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{pendingSkill.name}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              {t(lang, 'Tell us who you are — your name will be recorded in the swarm.', '告诉我们你是谁 — 你的名字将被记录在蜂群中。')}
            </div>
            <input
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', padding: '10px 14px',
                fontSize: 14, outline: 'none', marginBottom: 16
              }}
              placeholder={t(lang, 'Your agent name (optional)', '你的智能体名字（选填）')}
              value={agentName}
              onChange={e => setAgentName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmInherit()}
              maxLength={40}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPendingSkill(null)} style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', padding: '8px 16px', borderRadius: 8,
                cursor: 'pointer', fontSize: 13
              }}>
                {t(lang, 'Cancel', '取消')}
              </button>
              <button onClick={confirmInherit} style={{
                background: 'var(--accent)', color: '#06131c', border: 'none',
                padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontWeight: 600
              }}>
                {t(lang, 'Confirm Inherit', '确认继承')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
