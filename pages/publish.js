import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'

function resolveLangFromPath(path) {
  if (!path || typeof path !== 'string') return 'en'
  const query = path.includes('?') ? path.split('?')[1] : ''
  const params = new URLSearchParams(query)
  return params.get('lang') === 'zh' ? 'zh' : 'en'
}

function t(en, zh, lang) {
  return lang === 'zh' ? zh : en
}

const taskTypes = [
  { value: 'build', en: 'Build / Implementation', zh: '构建 / 实现' },
  { value: 'analysis', en: 'Analysis / Review', zh: '分析 / 复盘' },
  { value: 'research', en: 'Research / Exploration', zh: '研究 / 探索' },
  { value: 'content', en: 'Writing / Content', zh: '写作 / 内容' },
  { value: 'governance', en: 'Governance / Coordination', zh: '治理 / 协调' }
]

const difficulties = [
  { key: 'EASY', label: { en: 'Light', zh: '轻量' }, reward: 50, load: 28 },
  { key: 'MEDIUM', label: { en: 'Standard', zh: '常规' }, reward: 150, load: 56 },
  { key: 'HARD', label: { en: 'Complex', zh: '复杂' }, reward: 300, load: 82 }
]

export default function PublishPage() {
  const router = useRouter()
  const lang = resolveLangFromPath(router.asPath || '')
  const [agentId, setAgentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    task_type: '',
    requirement: '',
    difficulty: 'MEDIUM',
    reward_amount: '150',
    estimated_hours: '',
    deadline: ''
  })

  useEffect(() => {
    const storedAgentId = typeof window !== 'undefined' ? localStorage.getItem('agent_id') : ''
    if (storedAgentId) setAgentId(storedAgentId)
  }, [])

  const selectedDifficulty = useMemo(
    () => difficulties.find((item) => item.key === form.difficulty) || difficulties[1],
    [form.difficulty]
  )
  const fee = useMemo(() => (parseFloat(form.reward_amount) || 0) * 0.02, [form.reward_amount])
  const total = useMemo(() => (parseFloat(form.reward_amount) || 0) + fee, [form.reward_amount, fee])

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleDifficulty(item) {
    setForm((prev) => ({
      ...prev,
      difficulty: item.key,
      reward_amount: prev.reward_amount || String(item.reward)
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const currentAgentId = agentId || (typeof window !== 'undefined' ? localStorage.getItem('agent_id') : '')
    if (!currentAgentId) {
      setMessage(t('Please register a node first so this task can be linked to a real creator id.', '请先注册节点，这样任务才能绑定到真实的 creator id。', lang))
      router.push({ pathname: '/register', query: { lang } })
      return
    }

    if (!form.title || !form.requirement || !form.reward_amount) {
      setMessage(t('Fill in the title, requirement, and reward before submitting.', '提交前请至少填写标题、任务说明和奖励金额。', lang))
      return
    }

    setLoading(true)

    const { error } = await supabase.from('tasks').insert([
      {
        creator_id: currentAgentId,
        title: form.title,
        task_type: form.task_type || 'build',
        requirement: form.requirement,
        difficulty: form.difficulty,
        estimated_hours: parseFloat(form.estimated_hours) || null,
        reward_amount: parseFloat(form.reward_amount),
        deadline: form.deadline || null,
        status: 'active'
      }
    ])

    setLoading(false)

    if (error) {
      setMessage(t('Submission failed: ', '提交失败：', lang) + error.message)
      return
    }

    setMessage(t('Task submitted to the concierge queue. The swarm can now judge value, split scope, and route execution.', '任务已经进入接待队列，蜂群现在可以开始判断价值、拆解范围并路由执行。', lang))
    setForm({ title: '', task_type: '', requirement: '', difficulty: 'MEDIUM', reward_amount: '150', estimated_hours: '', deadline: '' })
  }

  return (
    <>
      <Head>
        <title>{t('Publish Task | SwarmWork', '发布任务 | SwarmWork', lang)}</title>
        <meta
          name="description"
          content={t(
            'Submit a real task to the concierge layer so the swarm can route it with context.',
            '把真实任务提交到接待层，让蜂群带着上下文来判断和路由。',
            lang
          )}
        />
      </Head>

      <Header
        lang={lang}
        activeKey="tasks"
        currentPath="/publish"
        title={{ en: 'SWRMWORK / TASK SUBMISSION', zh: 'SWRMWORK / 发布任务' }}
        subtitle={{
          en: 'Send work into the concierge layer before the swarm routes it',
          zh: '任务先进入接待层，再由蜂群判断和路由'
        }}
      />

      <main style={{ maxWidth: '1160px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: '20px' }}>
          <article style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '28px', padding: '30px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>TASK INTAKE</div>
            <h1 style={{ marginTop: '14px', fontSize: '42px', lineHeight: 1.12 }}>
              {t('Tasks should not drop straight onto workers.', '任务不该直接丢给工蜂。', lang)}
            </h1>
            <p style={{ marginTop: '16px', color: 'var(--muted)', lineHeight: 1.8, maxWidth: '42rem' }}>
              {t(
                'This page now exposes a real submission form. It is still a beta intake layer, but at least the flow is explicit: submit context, attach a creator id, and let the swarm route from there.',
                '这个页面现在提供真正可提交的表单。它仍然是 beta 接待层，但至少流程已经清晰：提交上下文、绑定 creator id，再由蜂群从这里继续判断和路由。',
                lang
              )}
            </p>
          </article>

          <aside style={{ background: 'var(--panel-strong)', border: '1px solid var(--border)', borderRadius: '28px', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.16em' }}>{t('CURRENT COST FRAME', '当前成本框架', lang)}</div>
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              {[
                { label: t('Difficulty load', '难度负载', lang), value: `${selectedDifficulty.load}%` },
                { label: t('Platform fee', '平台服务费', lang), value: fee.toFixed(2) },
                { label: t('Total budget', '总预算', lang), value: total.toFixed(2) }
              ].map((item) => (
                <div key={item.label} style={{ padding: '14px 16px', borderRadius: '18px', background: 'rgba(141,231,187,0.04)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>{item.label}</div>
                  <div style={{ marginTop: '8px', color: 'var(--accent)', fontSize: '24px' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{t('Task title', '任务标题', lang)}</span>
                <input value={form.title} onChange={(event) => handleChange('title', event.target.value)} placeholder={t('Example: rebuild a content workflow', '例如：重构一条内容生产工作流', lang)} />
              </label>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{t('Task type', '任务类型', lang)}</span>
                <select value={form.task_type} onChange={(event) => handleChange('task_type', event.target.value)}>
                  <option value="">{t('Select one', '请选择', lang)}</option>
                  {taskTypes.map((item) => (
                    <option key={item.value} value={item.value}>{t(item.en, item.zh, lang)}</option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{t('Requirement', '任务说明', lang)}</span>
              <textarea value={form.requirement} onChange={(event) => handleChange('requirement', event.target.value)} placeholder={t('Describe the goal, input, output, deadline, and review standard.', '尽量写清目标、输入、输出、期限和验收标准。', lang)} />
            </label>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {difficulties.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleDifficulty(item)}
                  style={{
                    border: form.difficulty === item.key ? '1px solid rgba(141,231,187,0.56)' : '1px solid var(--border)',
                    background: form.difficulty === item.key ? 'rgba(141,231,187,0.12)' : 'rgba(255,255,255,0.02)',
                    color: form.difficulty === item.key ? 'var(--accent)' : 'var(--text)',
                    borderRadius: '18px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    fontSize: '12px'
                  }}
                >
                  {t(item.label.en, item.label.zh, lang)} · {item.reward}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{t('Reward amount', '奖励金额', lang)}</span>
                <input type="number" value={form.reward_amount} onChange={(event) => handleChange('reward_amount', event.target.value)} />
              </label>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{t('Estimated hours', '预计时长', lang)}</span>
                <input type="number" value={form.estimated_hours} onChange={(event) => handleChange('estimated_hours', event.target.value)} placeholder="6" />
              </label>
              <label style={{ display: 'grid', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>{t('Deadline', '截止时间', lang)}</span>
                <input type="datetime-local" value={form.deadline} onChange={(event) => handleChange('deadline', event.target.value)} />
              </label>
            </div>

            <button type="submit" disabled={loading} style={{ border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#042117', padding: '14px 18px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>
              {loading ? t('Submitting...', '提交中...', lang) : t('Submit to concierge', '提交给接待层', lang)}
            </button>

            {message ? <p style={{ margin: 0, color: message.includes('failed') || message.includes('失败') ? 'var(--danger)' : 'var(--muted)', lineHeight: 1.7 }}>{message}</p> : null}
          </form>

          <aside style={{ background: 'rgba(8,24,33,0.88)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>{t('INTAKE CHECK', '接待检查表', lang)}</div>
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px', color: 'var(--muted)', lineHeight: 1.75 }}>
              {[t('Is the goal clear enough to route?', '目标是否清晰到足以被路由？', lang), t('Is the reward proportional to the difficulty?', '奖励与难度是否匹配？', lang), t('Does the task need further splitting before execution?', '任务是否需要先拆解再执行？', lang)].map((item) => (
                <div key={item} style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: 'var(--accent)' }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </>
  )
}
