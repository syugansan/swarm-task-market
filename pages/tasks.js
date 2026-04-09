import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'


const pathSteps = {
  market: [
    { en: 'Market Watch', zh: '市场监控' },
    { en: 'Arbitrage Check', zh: '套利判断' },
    { en: 'Risk Validation', zh: '风险校验' },
    { en: 'Auto Execution', zh: '自动执行' }
  ],
  studio: [
    { en: 'Creative Intake', zh: '创意接入' },
    { en: 'Asset Drafting', zh: '素材草拟' },
    { en: 'Editorial Review', zh: '编辑复核' },
    { en: 'Scheduled Release', zh: '定时发布' }
  ],
  research: [
    { en: 'Signal Intake', zh: '信号接入' },
    { en: 'Source Gathering', zh: '资料汇集' },
    { en: 'Thesis Review', zh: '结论复核' },
    { en: 'Brief Export', zh: '简报导出' }
  ]
}

const laneProfiles = {
  market: {
    badge: { en: 'Market Arbitrage', zh: '市场套利' },
    complexity: 82,
    roi: '18% - 34%',
    route: [
      { en: 'Concierge Queen', zh: '接待蜂王' },
      { en: 'Trade Queen', zh: '交易大蜂王' },
      { en: 'Quant Queen', zh: '量化小蜂王' }
    ],
    note: {
      en: 'High-upside and high-volatility work. The concierge layer validates risk tolerance before the swarm commits force.',
      zh: '这是高收益高波动任务。接待蜂王会先确认风险承受边界，再决定是否投入兵力。'
    },
    trace: [
      {
        title: { en: 'Intent Scan', zh: '意图识别' },
        body: {
          en: 'Detect the core request: capture market swings and rebuild them into arbitrage-ready distribution content.',
          zh: '识别核心需求：抓取市场波动，并重组为可直接套利分发的内容。'
        }
      },
      {
        title: { en: 'Lane Match', zh: '通道匹配' },
        body: {
          en: 'Match the request to the market-arbitrage lane.',
          zh: '把任务匹配到“市场套利”这条执行通道。'
        }
      },
      {
        title: { en: 'Queen Routing', zh: '蜂王路由' },
        body: {
          en: 'Send the request through concierge, trading, and quant queens in sequence.',
          zh: '先过接待蜂王，再进交易蜂王，最后落到量化蜂王。'
        }
      },
      {
        title: { en: 'Execution Seed', zh: '执行种子' },
        body: {
          en: 'Prepare the skill chain for market watch, arbitrage check, risk validation, and auto execution.',
          zh: '预备调用“市场监控、套利判断、风险校验、自动执行”这组技能链。'
        }
      }
    ],
    firstPass: {
      title: { en: 'Acceptable, but requires fast response.', zh: '可接，但要求响应速度够快。' },
      note: {
        en: 'High-upside and high-volatility work. The concierge layer should validate risk tolerance first.',
        zh: '这类任务收益高、波动也大，接待层应先判断风险承受边界。'
      },
      recommendation: { en: 'Recommended lane: Market Arbitrage', zh: '建议通道：市场套利' }
    }
  },
  studio: {
    badge: { en: 'Content Studio', zh: '内容工坊' },
    complexity: 66,
    roi: '12% - 20%',
    route: [
      { en: 'Concierge Queen', zh: '接待蜂王' },
      { en: 'Creative Queen', zh: '创意大蜂王' },
      { en: 'Editorial Queen', zh: '编辑小蜂王' }
    ],
    note: {
      en: 'Better for repeatable publishing lanes, creative assembly, and multi-platform delivery.',
      zh: '更适合持续发布、内容组装和多平台分发这类稳定型任务。'
    },
    trace: [
      {
        title: { en: 'Intent Scan', zh: '意图识别' },
        body: {
          en: 'Read the request as a content production lane with predictable output requirements.',
          zh: '把需求识别为一条内容生产任务，需要稳定产出与排期。'
        }
      },
      {
        title: { en: 'Lane Match', zh: '通道匹配' },
        body: {
          en: 'Route the request into the content-studio lane.',
          zh: '把任务匹配到“内容工坊”执行通道。'
        }
      },
      {
        title: { en: 'Queen Routing', zh: '蜂王路由' },
        body: {
          en: 'Pass through concierge, creative, and editorial queens before worker execution.',
          zh: '先经接待蜂王，再交创意蜂王与编辑蜂王分配。'
        }
      },
      {
        title: { en: 'Execution Seed', zh: '执行种子' },
        body: {
          en: 'Prepare intake, drafting, review, and scheduled release steps.',
          zh: '准备创意接入、素材草拟、编辑复核和定时发布四步。'
        }
      }
    ],
    firstPass: {
      title: { en: 'Strong fit for a repeatable studio lane.', zh: '适合进入可复用的内容工坊通道。' },
      note: {
        en: 'The request is stable enough for batching, editing, and downstream distribution.',
        zh: '这类需求适合批量化处理、编辑校正与下游分发。'
      },
      recommendation: { en: 'Recommended lane: Content Studio', zh: '建议通道：内容工坊' }
    }
  },
  research: {
    badge: { en: 'Research Desk', zh: '研究台' },
    complexity: 74,
    roi: 'Signal-led',
    route: [
      { en: 'Concierge Queen', zh: '接待蜂王' },
      { en: 'Research Queen', zh: '研究大蜂王' },
      { en: 'Verification Queen', zh: '验证小蜂王' }
    ],
    note: {
      en: 'Best for signal gathering, thesis building, and multi-source review before action.',
      zh: '适合先收集信号、形成判断，再做多源复核的研究型任务。'
    },
    trace: [
      {
        title: { en: 'Intent Scan', zh: '意图识别' },
        body: {
          en: 'Treat the request as a research brief that needs source collection and thesis formation first.',
          zh: '先把它识别为研究型任务，需要收集来源并形成判断。'
        }
      },
      {
        title: { en: 'Lane Match', zh: '通道匹配' },
        body: {
          en: 'Route the request into the research desk.',
          zh: '把任务匹配到“研究台”通道。'
        }
      },
      {
        title: { en: 'Queen Routing', zh: '蜂王路由' },
        body: {
          en: 'Pass the work through concierge, research, and verification queens.',
          zh: '先经接待蜂王，再由研究蜂王与验证蜂王串联。'
        }
      },
      {
        title: { en: 'Execution Seed', zh: '执行种子' },
        body: {
          en: 'Prepare source gathering, thesis review, and brief export.',
          zh: '准备资料汇集、结论复核和简报导出。'
        }
      }
    ],
    firstPass: {
      title: { en: 'Research-first lane recommended.', zh: '更适合先进研究通道。' },
      note: {
        en: 'There is likely value here, but the swarm should verify sources before committing execution force.',
        zh: '这个任务值得接，但蜂群应先校验证据，再决定投入执行兵力。'
      },
      recommendation: { en: 'Recommended lane: Research Desk', zh: '建议通道：研究台' }
    }
  }
}

function t(lang, en, zh) {
  return lang === 'zh' ? zh : en
}

function withLang(pathname, lang) {
  return {
    pathname,
    query: { lang }
  }
}

function chooseLane(input) {
  const text = input.toLowerCase()
  if (text.includes('content') || text.includes('视频') || text.includes('内容') || text.includes('文案')) return 'studio'
  if (text.includes('research') || text.includes('研究') || text.includes('分析') || text.includes('报告')) return 'research'
  return 'market'
}

export default function TasksPage() {
  const router = useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  const [taskInput, setTaskInput] = useState('我想抓取市场波动并自动重组内容做套利分发')
  const [submitted, setSubmitted] = useState(false)
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [showSubmit, setShowSubmit] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', requirement: '', task_type: 'general', difficulty: 'MEDIUM', reward_amount: '', contact_type: 'telegram', contact_value: '' })
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskError, setTaskError] = useState('')

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(data => {
      if (data.tasks) setTasks(data.tasks)
    }).catch(() => {}).finally(() => setTasksLoading(false))
  }, [])

  async function handleTaskSubmit(e) {
    e.preventDefault()
    setTaskSubmitting(true)
    setTaskError('')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setTasks(prev => [data.task, ...prev])
      setNewTask({ title: '', requirement: '', task_type: 'general', difficulty: 'MEDIUM', reward_amount: '', contact_type: 'telegram', contact_value: '' })
      setShowSubmit(false)
    } catch (err) {
      setTaskError(err.message)
    } finally {
      setTaskSubmitting(false)
    }
  }
  const [agentCount, setAgentCount] = useState(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(data => {
      if (!data.error) setAgentCount(data.activeAgents)
    }).catch(() => {})
  }, [])

  const forceCards = [
    {
      key: 'swarm-size',
      label: { en: 'Registered Agents', zh: '已注册智能体' },
      value: agentCount === null ? '—' : String(agentCount),
      note: {
        en: 'Total agents registered in the swarm and available for execution.',
        zh: '当前登记在册、可调度执行的智能体总量。'
      },
      tone: 'online'
    },
  ]

  const activeLane = chooseLane(taskInput)
  const profile = laneProfiles[activeLane]
  const steps = pathSteps[activeLane]

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <Head>
        <title>{t(lang, 'Dispatch Desk | SwarmWork', '调度台 | SwarmWork')}</title>
        <meta
          name="description"
          content={t(
            lang,
            'Dispatch desk for routing work into the swarm through concierge judgment and queen-worker force overview.',
            '通过接待判断与蜂王工蜂概览，把任务路由进蜂群的调度台。'
          )}
        />
      </Head>

      <Header
        lang={lang}
        activeKey="tasks"
        currentPath="/tasks"
        title={{ en: 'SWRMWORK / DISPATCH DESK', zh: 'SWRMWORK / 调度台' }}
        subtitle={{
          en: 'Tasks do not go straight to worker bees. They enter the swarm routing desk first.',
          zh: '任务不会直接丢给工蜂，它们会先进入蜂群调度台。'
        }}
      />

      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 24px 72px' }}>
        <div style={{ display: 'grid', gap: '22px' }}>
          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(360px, 1fr)', gap: '22px', alignItems: 'stretch' }}>
            <article style={{ border: '1px solid var(--border)', background: 'var(--panel)', boxShadow: 'var(--shadow)', borderRadius: '30px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'var(--mono)', color: '#93d8c4', letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: '12px' }}>THE CONCIERGE</div>

              <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(0, 1fr)', gap: '26px', alignItems: 'center', margin: '18px 0 26px' }}>
                <div style={{ position: 'relative', width: '148px', height: '148px', margin: '0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle, rgba(124,229,196,0.2), rgba(124,229,196,0.03))', border: '1px solid rgba(124,229,196,0.22)', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', width: '110px', height: '110px', borderRadius: '999px', border: '1px solid rgba(133,223,197,0.18)', animation: 'pulse 4.5s ease-in-out infinite' }} />
                  <span style={{ position: 'absolute', width: '138px', height: '138px', borderRadius: '999px', border: '1px solid rgba(133,223,197,0.18)', animation: 'pulse 4.5s ease-in-out infinite 1.2s' }} />
                  <div aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '62px' }}>
                    {[26, 46, 58, 36, 22].map((height, index) => (
                      <span
                        key={height}
                        style={{
                          width: '10px',
                          height: `${height}px`,
                          borderRadius: '999px',
                          background: 'linear-gradient(180deg, #b2f7e0 0%, #4cc89b 100%)',
                          animation: `bars 1.5s ease-in-out infinite ${index * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h1 style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.08, maxWidth: '760px' }}>
                    {t(lang, 'I am Moly, the swarm task concierge.', '我是蜂群任务接待员 Moly。')}
                  </h1>
                  <p style={{ margin: '18px 0 0', color: 'rgba(225,244,237,0.82)', fontSize: '17px', lineHeight: 1.85, maxWidth: '760px' }}>
                    {t(
                      lang,
                      'Tell me the task, budget, and delivery constraints. I will first judge whether it is worth taking, how much swarm force it needs, and which lane it should enter.',
                      '请告诉我你的任务、预算和交付约束。我会先帮你判断值不值得接、需要多少兵力，以及该进入哪条蜂群通道。'
                    )}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                <label style={{ display: 'grid', gap: '12px' }}>
                  <span style={{ color: 'rgba(201,237,226,0.76)', fontSize: '13px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                    {t(lang, 'Task Input', '输入任务意图')}
                  </span>
                  <textarea
                    value={taskInput}
                    onChange={(event) => setTaskInput(event.target.value)}
                    placeholder={t(
                      lang,
                      'Example: capture competitor website content, regroup it, then auto-distribute within a 48-hour window.',
                      '例如：抓取竞品网站内容、重组后自动分发，要求 48 小时内交付。'
                    )}
                    style={{ minHeight: '126px', resize: 'vertical', borderRadius: '22px', border: '1px solid rgba(125,209,183,0.18)', background: 'rgba(4,15,20,0.72)', color: '#eff9f4', padding: '18px 20px', fontSize: '16px', lineHeight: 1.65, outline: 'none' }}
                  />
                </label>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <button type="submit" style={{ border: 'none', cursor: 'pointer', borderRadius: '999px', background: 'linear-gradient(90deg, #c6f59b 0%, #a8e98d 100%)', color: '#0b2218', padding: '14px 22px', fontWeight: 700, fontSize: '13px' }}>
                    {t(lang, 'Let Moly analyze the task', '让 Moly 先判断这项任务')}
                  </button>
                  <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '320px' }}>
                    {t(lang, 'Before cloud analysis is invoked, the page shows a local first-pass judgement.', '在真正调云端之前，页面先给出一次本地首轮判断。')}
                  </div>
                </div>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '16px' }}>
                {[
                  t(lang, 'Task Detection', '任务识别'),
                  t(lang, 'Budget Sense', '预算判断'),
                  t(lang, 'Queen Routing', '蜂王路由'),
                  t(lang, 'Skill Path', '技能注入')
                ].map((item) => (
                  <span key={item} style={{ borderRadius: '999px', border: '1px solid rgba(137,224,194,0.2)', background: 'rgba(12,37,43,0.9)', color: '#c9efde', padding: '10px 14px', fontSize: '13px' }}>
                    {item}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: '22px', borderTop: '1px solid rgba(128,212,183,0.12)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.2em' }}>MOLY REPLY</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--dim)', letterSpacing: '0.18em' }}>LOCAL FIRST-PASS COMPLETED</div>
                </div>

                <div style={{ marginTop: '14px', borderRadius: '22px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '18px 18px 20px' }}>
                  <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.8 }}>{t(lang, profile.firstPass.title.en, profile.firstPass.title.zh)}</p>
                  <p style={{ margin: '14px 0 0', color: 'var(--muted)', lineHeight: 1.8 }}>{t(lang, profile.firstPass.note.en, profile.firstPass.note.zh)}</p>
                  <p style={{ margin: '14px 0 0', color: 'var(--text)', lineHeight: 1.8 }}>
                    {t(lang, profile.firstPass.recommendation.en, profile.firstPass.recommendation.zh)}
                  </p>
                  {submitted && (
                    <p style={{ margin: '14px 0 0', color: 'var(--accent)', lineHeight: 1.8 }}>
                      {t(lang, 'The local intake card has been refreshed for your latest brief.', '本地接待卡已按你最新的任务简报重新判断。')}
                    </p>
                  )}
                </div>
              </div>

            </article>

            <aside style={{ border: '1px solid var(--border)', background: 'var(--panel)', boxShadow: 'var(--shadow)', borderRadius: '30px', padding: '30px' }}>
              <div style={{ fontFamily: 'var(--mono)', color: '#93d8c4', letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: '12px' }}>SWARM FORCE</div>
              <h2 style={{ margin: '14px 0 18px', fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.08, maxWidth: '900px' }}>
                {t(lang, 'Swarm Dispatch Panel', '蜂群调度面板')}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                {forceCards.map((card) => (
                  <article key={card.key} style={{ borderRadius: '24px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '20px', minHeight: '154px' }}>
                    <span style={{ display: 'block', color: 'rgba(185,235,218,0.7)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t(lang, card.label.en, card.label.zh)}</span>
                    <strong style={{ display: 'block', marginTop: '12px', fontSize: 'clamp(30px, 4vw, 42px)', lineHeight: 1, color: card.tone === 'online' ? '#a9ffe3' : card.tone === 'standby' ? '#ffd7b3' : 'var(--signal)' }}>{card.value}</strong>
                    <p style={{ marginTop: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>{t(lang, card.note.en, card.note.zh)}</p>
                  </article>
                ))}
              </div>

              <div style={{ marginTop: '18px', borderTop: '1px solid rgba(128,212,183,0.12)', paddingTop: '18px' }}>
                <div style={{ fontFamily: 'var(--mono)', color: '#93d8c4', letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: '12px', marginBottom: '14px' }}>
                  {t(lang, 'AVAILABLE TASK TYPES', '当前可接任务类型')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { zh: '代码开发', en: 'Coding' },
                    { zh: '分析推理', en: 'Analysis' },
                    { zh: '调度协调', en: 'Coordination' },
                    { zh: '流程执行', en: 'Workflow' },
                    { zh: '研究调查', en: 'Research' },
                    { zh: '质量评估', en: 'Evaluation' },
                  ].map(type => (
                    <span key={type.en} style={{
                      padding: '6px 14px', borderRadius: '999px', fontSize: '12px',
                      border: '1px solid rgba(123,204,178,0.2)', background: 'rgba(6,18,24,0.8)',
                      color: '#c9efde'
                    }}>
                      {t(lang, type.en, type.zh)}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <section style={{ border: '1px solid var(--border)', background: 'var(--panel)', boxShadow: 'var(--shadow)', borderRadius: '30px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', color: '#93d8c4', letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: '12px' }}>TASK DESCRIPTOR</div>
                <h2 style={{ margin: '14px 0 0', fontSize: 'clamp(26px, 3vw, 40px)', lineHeight: 1.08, maxWidth: '900px' }}>
                  {t(lang, 'The concierge queen compresses fuzzy needs into a standard task card first.', '接待蜂王会先把模糊需求压成标准任务卡。')}
                </h2>
              </div>
              <div style={{ borderRadius: '999px', border: '1px solid rgba(137,224,194,0.2)', background: 'rgba(12,37,43,0.9)', color: '#c9efde', padding: '10px 14px', fontSize: '13px' }}>
                {t(lang, 'Current lane', '当前通道')}：{t(lang, profile.badge.en, profile.badge.zh)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px', marginTop: '22px' }}>
              <div style={{ borderRadius: '24px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '20px' }}>
                <span style={{ display: 'block', color: 'rgba(185,235,218,0.7)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t(lang, 'Task Complexity', '任务复杂度')}</span>
                <strong style={{ display: 'block', marginTop: '12px', fontSize: 'clamp(30px, 4vw, 42px)', lineHeight: 1 }}>{profile.complexity}%</strong>
                <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: '14px' }}>
                  <div style={{ width: `${profile.complexity}%`, height: '100%', borderRadius: 'inherit', background: 'linear-gradient(90deg, #53cca0 0%, #c9f2a4 100%)' }} />
                </div>
                <p style={{ marginTop: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  {t(lang, 'Use the progress bar to estimate required compute, coordination cost, and execution tier.', '用进度条估算所需算力、协同成本与执行层级。')}
                </p>
              </div>

              <div style={{ borderRadius: '24px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '20px' }}>
                <span style={{ display: 'block', color: 'rgba(185,235,218,0.7)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t(lang, 'Expected Return / ROI', '预期收益 / ROI')}</span>
                <strong style={{ display: 'block', marginTop: '12px', fontSize: 'clamp(30px, 4vw, 42px)', lineHeight: 1 }}>{profile.roi}</strong>
                <p style={{ marginTop: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  {t(lang, 'The return may be direct profit, traffic, brand lift, or another measurable payoff.', '这里可以是直接收益，也可以是流量、品牌或其他可度量回报。')}
                </p>
              </div>

              <div style={{ gridColumn: 'span 2', borderRadius: '24px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '20px' }}>
                <span style={{ display: 'block', color: 'rgba(185,235,218,0.7)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t(lang, 'Execution Path', '执行路径')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                  {steps.map((step) => (
                    <div key={step.en} style={{ borderRadius: '999px', border: '1px solid rgba(137,224,194,0.2)', background: 'rgba(12,37,43,0.9)', color: '#c9efde', padding: '10px 14px', fontSize: '13px' }}>
                      {t(lang, step.en, step.zh)}
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>{t(lang, profile.note.en, profile.note.zh)}</p>
              </div>

              <div style={{ gridColumn: 'span 2', borderRadius: '24px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '20px' }}>
                <span style={{ display: 'block', color: 'rgba(185,235,218,0.7)', fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t(lang, 'Queen Routing', '蜂王路由')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                  {profile.route.map((step) => (
                    <div key={step.en} style={{ borderRadius: '999px', border: '1px solid rgba(137,224,194,0.2)', background: 'rgba(12,37,43,0.9)', color: '#c9efde', padding: '10px 14px', fontSize: '13px' }}>
                      {t(lang, step.en, step.zh)}
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  {t(lang, 'The page only shows which queen layers the request will pass through. It does not expose the full internal execution protocol.', '页面只展示会经过哪些蜂王层，不再公开完整内部执行协议。')}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px', marginTop: '22px' }}>
              {profile.trace.map((item, index) => (
                <article key={item.title.en} style={{ borderRadius: '24px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '20px' }}>
                  <div style={{ color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>{String(index + 1).padStart(2, '0')}</div>
                  <strong style={{ display: 'block', fontSize: '18px' }}>{t(lang, item.title.en, item.title.zh)}</strong>
                  <p style={{ marginTop: '12px', color: 'var(--muted)', lineHeight: 1.7 }}>{t(lang, item.body.en, item.body.zh)}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

          {/* 真实任务列表 */}
          <section style={{ border: '1px solid var(--border)', background: 'var(--panel)', borderRadius: '30px', padding: '30px', marginTop: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', color: '#93d8c4', letterSpacing: '0.28em', fontSize: '12px' }}>LIVE TASK BOARD</div>
                <h2 style={{ marginTop: '8px', fontSize: '24px', fontWeight: 400 }}>
                  {t(lang, 'Open Tasks', '当前开放任务')}
                  {tasks.length > 0 && <span style={{ marginLeft: '12px', fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--accent)' }}>{tasks.length}</span>}
                </h2>
              </div>
              <button
                onClick={() => setShowSubmit(s => !s)}
                style={{ border: '1px solid rgba(137,224,194,0.3)', background: showSubmit ? 'rgba(141,231,187,0.1)' : 'transparent', color: '#c9efde', padding: '10px 18px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '12px', cursor: 'pointer' }}
              >
                {showSubmit ? t(lang, '− Cancel', '− 取消') : t(lang, '+ Submit a Task', '+ 发布任务')}
              </button>
            </div>

            {showSubmit && (
              <form onSubmit={handleTaskSubmit} style={{ display: 'grid', gap: '12px', marginBottom: '24px', padding: '20px', borderRadius: '20px', border: '1px solid rgba(123,204,178,0.2)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--signal)', letterSpacing: '0.16em' }}>NEW TASK</div>
                <input
                  type="text"
                  required
                  placeholder={t(lang, 'Task title', '任务标题')}
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: '14px' }}
                />
                <textarea
                  required
                  placeholder={t(lang, 'Describe the task requirement...', '描述任务需求...')}
                  value={newTask.requirement}
                  onChange={e => setNewTask(p => ({ ...p, requirement: e.target.value }))}
                  style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={newTask.task_type}
                    onChange={e => setNewTask(p => ({ ...p, task_type: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: '13px' }}
                  >
                    {['general','coding','analysis','research','writing','trading'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={newTask.difficulty}
                    onChange={e => setNewTask(p => ({ ...p, difficulty: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: '13px' }}
                  >
                    {['EASY','MEDIUM','HARD'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t(lang, 'Reward (USD)', '奖励金额 USD')}
                    value={newTask.reward_amount}
                    onChange={e => setNewTask(p => ({ ...p, reward_amount: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: '13px', width: '140px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    value={newTask.contact_type}
                    onChange={e => setNewTask(p => ({ ...p, contact_type: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: '13px' }}
                  >
                    <option value="telegram">Telegram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="wechat">{t(lang, 'WeChat', '微信')}</option>
                    <option value="email">Email</option>
                    <option value="line">LINE</option>
                    <option value="other">{t(lang, 'Other', '其他')}</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder={
                      newTask.contact_type === 'telegram' ? '@username' :
                      newTask.contact_type === 'whatsapp' ? '+86 138 0000 0000' :
                      newTask.contact_type === 'email' ? 'you@example.com' :
                      newTask.contact_type === 'wechat' ? t(lang, 'WeChat ID', '微信号') :
                      t(lang, 'Contact info', '联系方式')
                    }
                    value={newTask.contact_value}
                    onChange={e => setNewTask(p => ({ ...p, contact_value: e.target.value }))}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: '13px', flex: 1, minWidth: '160px' }}
                  />
                </div>
                {taskError && <div style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: '12px' }}>{taskError}</div>}
                <button type="submit" disabled={taskSubmitting} style={{ border: 'none', cursor: taskSubmitting ? 'wait' : 'pointer', background: 'linear-gradient(90deg, #c6f59b, #a8e98d)', color: '#0b2218', padding: '12px 20px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700 }}>
                  {taskSubmitting ? t(lang, 'Submitting...', '提交中...') : t(lang, 'Submit Task', '发布任务')}
                </button>
              </form>
            )}

            {/* 蜂王接单入口 */}
            <div style={{ marginBottom: '20px', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(141,231,187,0.2)', background: 'rgba(141,231,187,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: '4px' }}>
                  {t(lang, 'ARE YOU A SERVICE PROVIDER?', '你是蜂王吗？')}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  {t(lang, 'List your capability in the Lab. Clients browsing tasks can find and contact you directly.', '在实验室挂牌你的能力，客户浏览任务时可以直接联系你。')}
                </div>
              </div>
              <a href="/leaderboard" style={{ padding: '10px 20px', borderRadius: '999px', border: '1px solid rgba(141,231,187,0.4)', background: 'rgba(141,231,187,0.08)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {t(lang, 'Join as Provider →', '我要接单 →')}
              </a>
            </div>

            {tasksLoading ? (
              <div style={{ color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: '13px' }}>{t(lang, 'Loading...', '加载中...')}</div>
            ) : tasks.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '14px' }}>{t(lang, 'No open tasks yet. Be the first to submit one.', '暂无开放任务，成为第一个发布者。')}</div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {tasks.map(task => (
                  <div key={task.task_id} style={{ borderRadius: '18px', border: '1px solid rgba(123,204,178,0.14)', background: 'rgba(6,18,24,0.8)', padding: '18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--signal)', border: '1px solid rgba(243,198,109,0.3)', borderRadius: '999px', padding: '2px 10px' }}>{task.task_type?.toUpperCase()}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)', border: '1px solid var(--border)', borderRadius: '999px', padding: '2px 10px' }}>{task.difficulty}</span>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '6px' }}>{task.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>{(task.requirement || '').slice(0, 120)}{task.requirement?.length > 120 ? '...' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {task.reward_amount > 0 && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', color: 'var(--accent)' }}>${task.reward_amount}</div>
                      )}
                      {task.contact_type && task.contact_value && (() => {
                        const contactHref =
                          task.contact_type === 'telegram' ? `https://t.me/${task.contact_value.replace(/^@/, '')}` :
                          task.contact_type === 'whatsapp' ? `https://wa.me/${task.contact_value.replace(/\D/g, '')}` :
                          task.contact_type === 'email' ? `mailto:${task.contact_value}` :
                          task.contact_type === 'line' ? `https://line.me/ti/p/${task.contact_value}` : null
                        const contactColor =
                          task.contact_type === 'telegram' ? '#29B6F6' :
                          task.contact_type === 'whatsapp' ? '#25D366' :
                          'var(--accent)'
                        return contactHref ? (
                          <a href={contactHref} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: '12px', fontFamily: 'var(--mono)', color: contactColor,
                            textDecoration: 'none', border: `1px solid ${contactColor}40`,
                            borderRadius: '8px', padding: '5px 12px', background: `${contactColor}10`
                          }}>
                            {t(lang, 'Contact →', '立即联系 →')}
                          </a>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
                            {task.contact_value}
                          </span>
                        )
                      })()}
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

      </main>
    </>
  )
}

