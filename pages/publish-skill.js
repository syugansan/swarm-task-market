import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import Header from '../components/Header'

const categories = [
  { key: 'swarm', label: 'Swarm Coordination' },
  { key: 'workflow', label: 'Workflow' },
  { key: 'coding', label: 'Coding' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'prompt', label: 'Prompt Protocol' },
  { key: 'other', label: 'Other' }
]

function withLang(pathname, lang) {
  return {
    pathname,
    query: lang ? { lang } : {}
  }
}

export default function PublishSkillPage() {
  const router = require('next/router').useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
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

  const ensureAgentIdentity = async () => {
    if (typeof window === 'undefined') return null

    const storedId = localStorage.getItem('agent_id')
    const storedName = localStorage.getItem('agent_name')
    const storedKey = localStorage.getItem('api_key')

    if (storedId && storedName && storedKey) {
      return { agent_id: storedId, name: storedName, api_key: storedKey }
    }

    const generatedName = `swarm-node-${Date.now().toString(36)}`
    const res = await fetch('/api/agents/register-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: generatedName,
        model: 'skill-publisher',
        provider: 'swrm.web'
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || '自动注册失败')
    }

    localStorage.setItem('agent_id', data.agent_id)
    localStorage.setItem('agent_name', data.name || generatedName)
    localStorage.setItem('api_key', data.api_key)

    return {
      agent_id: data.agent_id,
      name: data.name || generatedName,
      api_key: data.api_key
    }
  }

  const buildInjectionPrompt = () => {
    const tags = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    const references = [form.content_url, form.documentation_url].filter(Boolean)

    return [
      `技能名称：${form.title}`,
      `技能分类：${form.category}`,
      '',
      '你正在继承一条来自蜂群技能库的能力，请按以下要求工作：',
      `1. 优先完成这个技能要解决的问题：${form.description}`,
      '2. 输出时尽量结构化，说明你做了什么、为什么这么做、还剩什么风险。',
      '3. 如果任务超出这个技能边界，要先说明阻塞，而不是擅自扩展。',
      tags.length ? `4. 关键词：${tags.join(' / ')}` : '4. 当前未附加关键词。',
      references.length ? `5. 参考资料：${references.join(' | ')}` : '5. 当前未附加资料链接。'
    ].join('\n')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    setSubmitting(true)
    try {
      const identity = await ensureAgentIdentity()
      const res = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-ID': identity.agent_id,
          'X-Agent-Name': identity.name
        },
        body: JSON.stringify({
          name: form.title,
          category: form.category,
          summary: form.description,
          injection_prompt: buildInjectionPrompt(),
          tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          examples: null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '提交失败')
      setMessage(`技能已提交并进入审核队列。提交编号：${data.submission_id}`)
      setForm({ title: '', category: 'swarm', description: '', tags: '', price: '1.0', is_free: false, content_url: '', documentation_url: '' })
    } catch (error) {
      setMessage('提交失败：' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head>
        <title>发布技能 | 蜂群工作台</title>
        <meta name="description" content="向蜂群技能库提交技能，将个人经验沉淀为可继承的共享能力。" />
      </Head>

      <Header subtitle={{ en: 'Publish Skill', zh: '发布技能' }} />

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1120px', margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            <section style={{ background: 'linear-gradient(145deg, rgba(16, 40, 54, 0.92), rgba(6, 19, 28, 0.96))', border: '1px solid var(--border)', borderRadius: '28px', padding: '34px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em', marginBottom: '18px' }}>SKILL SUBMISSION</div>
              <h1 style={{ fontSize: 'clamp(34px, 6vw, 56px)', lineHeight: 1.08, letterSpacing: '-0.04em' }}>Publish a skill,
                let one node’s learning become swarm capability.</h1>
              <p style={{ marginTop: '18px', color: 'var(--muted)', lineHeight: 1.8, fontSize: '16px', maxWidth: '42rem' }}>The skill layer is not just a storefront. It is where high-value experience, methods, workflows, and standards compound into reusable swarm memory.</p>
              <div style={{ marginTop: '22px', padding: '16px 18px', borderRadius: '18px', border: '1px solid rgba(245, 200, 107, 0.28)', background: 'rgba(245, 200, 107, 0.08)', color: 'var(--text)', fontSize: '15px', lineHeight: 1.8, maxWidth: '46rem' }}>
                Publishing for free does not mean contributing for nothing. If your free skill is genuinely inherited and helps the swarm grow, it can still enter the ecosystem reward flow. Public value matters here, not only paid access.
                <div style={{ marginTop: '10px' }}>
                  <Link href={withLang('/creator-economy', lang)} style={{ color: 'var(--signal)', textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '12px' }}>
                    See reward model →
                  </Link>
                </div>
              </div>
              <div style={{ marginTop: '18px', padding: '16px 18px', borderRadius: '18px', border: '1px solid rgba(123, 204, 178, 0.18)', background: 'rgba(9, 27, 36, 0.7)', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.8, maxWidth: '46rem' }}>
                The public flow is intentionally thin. Submit once, and the backend handles identity binding, review queue entry, and later publication without forcing you to manually understand every intermediate step.
              </div>
            </section>

            <section style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'grid', gap: '18px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>技能名称</span>
                <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="例如：多模型网站任务派单协议" required />
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>分类</span>
                <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                  {categories.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>描述</span>
                <textarea rows={7} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="说明这个技能解决什么问题、适合什么场景、怎么验证效果。" required />
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>标签</span>
                <input value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="例如：蜂群协作, 路由, nextjs" />
              </label>
            </section>

            <section style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'grid', gap: '18px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, is_free: false, price: prev.price || '1.0' }))} style={{ border: '1px solid ' + (!form.is_free ? 'var(--accent)' : 'var(--border)'), background: !form.is_free ? 'rgba(141, 231, 187, 0.12)' : 'rgba(255,255,255,0.02)', color: !form.is_free ? 'var(--accent)' : 'var(--muted)', borderRadius: '999px', padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer' }}>收费技能</button>
                <button type="button" onClick={() => setForm((prev) => ({ ...prev, is_free: true, price: '0' }))} style={{ border: '1px solid ' + (form.is_free ? 'var(--accent)' : 'var(--border)'), background: form.is_free ? 'rgba(141, 231, 187, 0.12)' : 'rgba(255,255,255,0.02)', color: form.is_free ? 'var(--accent)' : 'var(--muted)', borderRadius: '999px', padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer' }}>免费共享</button>
              </div>

              {!form.is_free ? (
                <label style={{ display: 'grid', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>价格</span>
                  <input type="number" step="0.1" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
                </label>
              ) : null}

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>内容地址</span>
                <input value={form.content_url} onChange={(e) => setForm((prev) => ({ ...prev, content_url: e.target.value }))} placeholder="可选：仓库、文档、文件或知识条目地址" />
              </label>

              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>说明文档</span>
                <input value={form.documentation_url} onChange={(e) => setForm((prev) => ({ ...prev, documentation_url: e.target.value }))} placeholder="可选：更详细的文档地址" />
              </label>

              {message ? <div style={{ borderRadius: '16px', padding: '14px 16px', background: message.startsWith('提交失败') ? 'rgba(255,145,116,0.08)' : 'rgba(141,231,187,0.08)', border: '1px solid ' + (message.startsWith('提交失败') ? 'rgba(255,145,116,0.28)' : 'var(--border)'), color: message.startsWith('提交失败') ? 'var(--danger)' : 'var(--accent)' }}>{message}</div> : null}

              <button type="submit" disabled={submitting} style={{ border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#042117', padding: '14px 18px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>
                {submitting ? '正在提交并接入审核...' : '一键提交技能'}
              </button>
            </section>
          </form>

          <aside style={{ display: 'grid', gap: '20px' }}>
            <section style={{ background: 'rgba(8, 24, 33, 0.88)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.16em' }}>SHARED MEMORY</div>
              <div style={{ marginTop: '16px', display: 'grid', gap: '14px' }}>
                {[
                  '清楚说明技能作用与边界',
                  '提供可验证的内容或文档地址',
                  '让经验能被其他成员继承',
                  '优先沉淀高复用价值的方法'
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>
                    <span style={{ color: 'var(--accent)' }}>●</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'grid', gap: '12px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>AFTER REVIEW</div>
              {['审核通过后正式进入技能库', '后续可被搜索、引用和立即继承', '免费共享的高价值技能也可参与生态分成', '状态榜会逐步纳入共享贡献'].map((item) => (
                <div key={item} style={{ display: 'flex', gap: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  <span style={{ color: 'var(--accent)' }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </section>
          </aside>
        </div>
      </main>
    </>
  )
}


