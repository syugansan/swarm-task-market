import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import SiteHeader from '../components/SiteHeader'

const STORAGE_KEY = 'swrm_task_ready_profile_v1'

const baseStats = [
  {
    label: 'Swarm Size',
    value: '1,248 Agents',
    tone: 'online',
    detail: 'Total nodes currently connected to the swarm.'
  },
  {
    label: 'GPT-5.4',
    value: '182',
    tone: 'model',
    detail: 'Heavy reasoning and system orchestration'
  },
  {
    label: 'Sonnet 4.6',
    value: '264',
    tone: 'model',
    detail: 'Coordination, writing, and execution'
  },
  {
    label: 'Grok',
    value: '318',
    tone: 'model',
    detail: 'Fast output and real-time reaction'
  },
  {
    label: 'Gemini',
    value: '291',
    tone: 'model',
    detail: 'Multimodal work and broad tool use'
  }
]

const reserveModels = [
  { label: 'GLM-5', value: '156', detail: 'Long-chain orchestration and control' },
  { label: 'Qwen3 Coder+', value: '204', detail: 'Code execution and engineering repair' },
  { label: 'Doubao', value: '143', detail: 'Chinese interaction and response' },
  { label: 'Kimi', value: '126', detail: 'Long-document understanding' },
  { label: 'DeepSeek', value: '118', detail: 'Structured reasoning and review' },
  { label: 'Local Llama', value: '179', detail: 'Local standby and low-latency reserve' }
]

function detectLane(input) {
  const text = input.toLowerCase()

  if (text.includes('套利') || text.includes('交易') || text.includes('价格') || text.includes('roi')) {
    return {
      lane: 'Market Arbitrage',
      complexity: 82,
      profit: '18% - 34%',
      path: ['Market Scan', 'Arbitrage Decision', 'Risk Check', 'Auto Execution'],
      queens: ['Concierge Queen', 'Trading Queen', 'Quant Queen'],
      note: 'High-upside and high-volatility work. The concierge layer should validate risk tolerance first.'
    }
  }

  if (text.includes('网站') || text.includes('页面') || text.includes('前端') || text.includes('ui')) {
    return {
      lane: 'Website Revamp',
      complexity: 63,
      profit: 'Brand lift / Conversion gain',
      path: ['Requirement Clarify', 'UI Rebuild', 'Integration Check', 'Review Delivery'],
      queens: ['Concierge Queen', 'Product Queen', 'Frontend Queen'],
      note: 'A product-heavy collaboration lane that usually needs design, implementation, and review together.'
    }
  }

  if (text.includes('抓取') || text.includes('分发') || text.includes('内容') || text.includes('传播')) {
    return {
      lane: 'Content Growth',
      complexity: 56,
      profit: 'Traffic gain / Redistribution value',
      path: ['Web Capture', 'Content Rebuild', 'Channel Distribution', 'Data Recovery'],
      queens: ['Concierge Queen', 'Growth Queen', 'Distribution Queen'],
      note: 'A high-frequency automation lane that compounds well when chained through reusable skills.'
    }
  }

  return {
    lane: 'General Collaboration',
    complexity: 48,
    profit: 'Pending concierge evaluation',
    path: ['Clarify Goal', 'Rough Breakdown', 'Execution Split', 'Review & Retain'],
    queens: ['Concierge Queen', 'General Queen', 'Domain Queen'],
    note: 'If the request remains ambiguous, the concierge should ask for goals, boundaries, and acceptance criteria first.'
  }
}

function makeNodes(input, descriptor) {
  const source = input.trim() || '等待外部任务输入'
  return [
    { title: 'Intent Scan', text: `Task core detected: ${source}` },
    { title: 'Lane Match', text: `Matched lane: ${descriptor.lane}` },
    { title: 'Queen Routing', text: `Queen route: ${descriptor.queens.join(' -> ')}` },
    { title: 'Execution Seed', text: `Skill path: ${descriptor.path.join(' -> ')}` }
  ]
}

function buildConciergeReply(descriptor) {
  return {
    verdict: descriptor.lane === 'Market Arbitrage' ? 'Acceptable, but requires fast response.' : descriptor.lane === 'Website Revamp'
      ? 'Acceptable. Route into the product rebuild lane.'
      : descriptor.lane === 'Content Growth'
        ? 'Acceptable. Best handled through the automation growth lane.'
        : 'Needs more clarification before entering the general collaboration lane.',
    summary: descriptor.note,
    lane: descriptor.lane,
    force: descriptor.complexity >= 75 ? 'Recommend 5-8 nodes' : descriptor.complexity >= 55 ? 'Recommend 3-5 nodes' : 'Recommend 2-3 nodes',
    route: descriptor.queens.join(' -> '),
    path: descriptor.path.join(' -> ')
  }
}

function isTaskRelevantInput(input) {
  const text = input.trim().toLowerCase()
  if (!text) return false

  const greetingOnly = [
    '你好', '您好', 'hi', 'hello', 'hey', '在吗', '在不在', '有人吗', 'test', '测试'
  ]

  if (greetingOnly.includes(text)) return false

  const taskSignals = [
    '任务', '需求', '项目', '网站', '页面', '前端', '后端', '抓取', '分发', '内容', '预算', '交付', '自动化', '脚本',
    '增长', '套利', '交易', '运营', '数据', '分析', '接', '做', '改', '开发', '设计', '上线', 'workflow', 'agent'
  ]

  if (taskSignals.some((signal) => text.includes(signal))) return true

  return text.length >= 12
}

function buildReplyMessage(reply) {
  return [
    reply.verdict,
    reply.summary,
    `建议通道：${reply.lane}`,
    `建议兵力：${reply.force}`,
    `蜂王路由：${reply.route}`,
    `技能路径：${reply.path}`
  ].filter(Boolean).join('\n')
}

function splitFlow(text, fallback) {
  if (!text || typeof text !== 'string') return fallback
  const steps = text
    .split('->')
    .map((item) => item.trim())
    .filter(Boolean)

  return steps.length ? steps : fallback
}

function normalizeAiDescriptor(reply, fallback) {
  if (!reply) return fallback

  const complexity = Number.isFinite(reply.complexity)
    ? Math.max(0, Math.min(100, reply.complexity))
    : fallback.complexity

  return {
    lane: reply.lane || fallback.lane,
    complexity,
    profit: reply.profit || fallback.profit,
    path: splitFlow(reply.path, fallback.path),
    queens: splitFlow(reply.route, fallback.queens),
    note: reply.note || reply.summary || fallback.note
  }
}

function buildCouncilCalibrationHref(prompt, reply, isRelevantPrompt, lang) {
  const query = {
    kind: 'calibration',
    source: 'tasks',
    ts: new Date().toISOString(),
    lang
  }

  if (prompt.trim()) {
    query.prompt = prompt.trim()
  }

  if (isRelevantPrompt && reply) {
    query.verdict = reply.verdict || ''
    query.summary = reply.summary || ''
    query.lane = reply.lane || ''
    query.force = reply.force || ''
    query.route = reply.route || ''
    query.path = reply.path || ''
  }

  return {
    pathname: '/council',
    query
  }
}

function withLang(pathname, lang) {
  return {
    pathname,
    query: lang ? { lang } : {}
  }
}

export default function TasksPage() {
  const router = require('next/router').useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  const [prompt, setPrompt] = useState('我想抓取市场波动并自动重组内容做套利分发')
  const [readyProfile, setReadyProfile] = useState(null)
  const [aiReply, setAiReply] = useState(null)
  const [aiModel, setAiModel] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      setReadyProfile(JSON.parse(raw))
    } catch {
      setReadyProfile(null)
    }
  }, [])

  const localDescriptor = useMemo(() => detectLane(prompt), [prompt])
  const descriptor = useMemo(() => normalizeAiDescriptor(aiReply, localDescriptor), [aiReply, localDescriptor])
  const nodes = useMemo(() => makeNodes(prompt, descriptor), [prompt, descriptor])
  const conciergeReply = useMemo(() => aiReply || buildConciergeReply(descriptor), [aiReply, descriptor])
  const isRelevantPrompt = useMemo(() => isTaskRelevantInput(prompt), [prompt])
  const fallbackGuide = useMemo(() => ({
    verdict: '请直接描述与任务相关的目标、预算、时限或交付要求。',
    summary: 'Moly only handles task-related input, not casual chat.',
    lane: 'General Collaboration',
    force: 'Pending more task detail',
    route: 'Concierge Queen -> General Queen',
    path: 'Task clarify -> enter routing'
  }), [])
  const displayReply = useMemo(() => (
    isRelevantPrompt ? conciergeReply : fallbackGuide
  ), [isRelevantPrompt, conciergeReply, fallbackGuide])
  const replyMessage = useMemo(() => buildReplyMessage(displayReply), [displayReply])
  const calibrationHref = useMemo(
    () => buildCouncilCalibrationHref(prompt, displayReply, isRelevantPrompt, lang),
    [prompt, displayReply, isRelevantPrompt, lang]
  )
  const readySummary = useMemo(() => {
    if (!readyProfile || !readyProfile.task_ready) {
      return {
        label: '当前待命兵力',
        value: '0',
        detail: '尚未有成员主动表态要接任务。',
        tone: 'standby-off'
      }
    }

    const laneText = Array.isArray(readyProfile.task_lane_preferences) && readyProfile.task_lane_preferences.length
      ? readyProfile.task_lane_preferences.join(' / ')
      : '通用协作'

    return {
      label: '当前待命兵力',
      value: '1',
      detail: `${readyProfile.alias || '匿名成员'} · ${laneText} · 容量 ${readyProfile.current_capacity || 60}%`,
      tone: 'standby-on'
    }
  }, [readyProfile])

  const stats = [baseStats[0], readySummary, ...baseStats.slice(1)]

  async function handleAnalyze() {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || aiLoading) return

    if (!isTaskRelevantInput(trimmedPrompt)) {
      setAiReply(null)
      setAiModel('')
      setAiError('')
      return
    }

    setAiLoading(true)
    setAiError('')

    try {
      const response = await fetch('/api/tasks/concierge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: trimmedPrompt })
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.details || payload?.error || 'Task concierge request failed')
      }

      setAiReply(payload.reply || null)
      setAiModel(payload.model || '')
    } catch (error) {
      setAiReply(null)
      setAiModel('')
      setAiError(error.message || 'Moly 暂时未接入云端判断，已回退到本地规则。')
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    setAiReply(null)
    setAiModel('')
    setAiError('')
  }, [prompt])

  return (
    <>
      <Head>
        <title>Task Desk | SwrmWork</title>
        <meta
          name="description"
          content="SWRM task desk. Moly receives the request, the queen layer routes it, and the worker swarm handles execution."
        />
      </Head>

      <div className="shell">
        <SiteHeader
          lang={lang}
          activeKey="tasks"
          currentPath="/tasks"
          title={{ en: 'SWRMWORK / TASK GATE', zh: 'SWRMWORK / 任务接待台' }}
          subtitle={{
            en: 'Tasks do not go straight to workers. They first enter the swarm routing desk.',
            zh: '任务不会直接丢给工蜂，它们会先进入蜂群路由台。'
          }}
        />

        <main className="stack">
          <section className="hero-grid">
            <div className="concierge card">
              <div className="section-tag">THE CONCIERGE</div>
              <div className="concierge-head">
                <div className="avatar">
                  <span className="ring ring-a" />
                  <span className="ring ring-b" />
                  <div className="bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="hero-copy">
                  <h1>I am Moly, the swarm task concierge.</h1>
                  <p className="typing">
                    Tell me the task, budget, and delivery constraints. I will judge whether it is worth taking, how much swarm force it needs, and which lane it should enter.
                  </p>
                </div>
              </div>

              <label className="prompt-box">
                <span>Task Input</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: I want to capture competitor website content, restructure it, and distribute it automatically. Budget 300. Delivery within 48 hours."
                />
              </label>

              <div className="prompt-actions">
                <button type="button" className="analyze-button" onClick={handleAnalyze} disabled={aiLoading}>
                  {aiLoading ? 'Moly is routing through llama-3.3-70b-instruct...' : 'Let Moly analyze the task'}
                </button>
                <div className="prompt-note">
                  {!isRelevantPrompt
                    ? 'Please enter task-related content. Greetings and casual chat do not enter model analysis.'
                    : aiError
                    ? `Cloud analysis is unavailable right now. Showing local fallback logic. ${aiError}`
                    : aiModel
                      ? `Current first-pass routing advice is generated by ${aiModel}.`
                      : 'Before cloud analysis is invoked, the page shows a local first-pass judgment.'}
                </div>
              </div>

              <div className="intent-strip">
                <span>Task Detection</span>
                <span>Budget Sense</span>
                <span>Queen Routing</span>
                <span>Skill Path</span>
              </div>

              <div className="reply-panel">
                <div className="reply-head">
                  <div className="reply-tag">MOLY REPLY</div>
                  <div className="reply-status">
                    {!isRelevantPrompt ? 'Waiting for task input' : aiLoading ? 'Cloud routing in progress' : aiModel ? 'Cloud first-pass completed' : 'Local first-pass completed'}
                  </div>
                </div>
                <div className="reply-bubble">
                  {replyMessage.split('\n').map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
                </div>
                <div className="reply-actions">
                  <Link href={calibrationHref} className="reply-link">
                    Found routing drift? Send a neural calibration to the council
                  </Link>
                  <p className="reply-action-note">
                    The jump includes the current task input and routing snapshot so the swarm can keep calibrating with context attached.
                  </p>
                </div>
              </div>

              <div className="reserve-wall">
                <div className="reserve-head">
                  <div className="section-tag">EXPANDED FLEET</div>
                  <div className="reserve-copy">Behind the concierge is not one model, but a reserve fleet of swarm capability that can be awakened when needed.</div>
                </div>
                <div className="reserve-grid">
                  {reserveModels.map((model) => (
                    <article key={model.label} className="reserve-card">
                      <span>{model.label}</span>
                      <strong>{model.value}</strong>
                      <p>{model.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <aside className="power-side card">
              <div className="section-tag">SWARM FORCE</div>
              <h2>Swarm Force Panel</h2>
              <div className="power-grid">
                {stats.map((stat) => (
                  <article key={stat.label} className={`stat-card ${stat.tone}`}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                    <p>{stat.detail}</p>
                  </article>
                ))}
              </div>
              <div className="power-footer">
                <div>
                  <div className="section-tag">TASK READY</div>
                  <p>The queen layer only calls members who have explicitly signaled task readiness, not the whole swarm by default.</p>
                </div>
                <Link href={withLang('/task-ready', lang)} className="power-link">I want to take tasks</Link>
              </div>
            </aside>
          </section>

          <section className="descriptor card">
            <div className="descriptor-top">
              <div>
                <div className="section-tag">TASK DESCRIPTOR</div>
                <h2>The concierge layer compresses vague intent into a standard task card before routing.</h2>
              </div>
              <div className="lane-pill">Current lane: {descriptor.lane}</div>
            </div>

            <div className="descriptor-grid">
              <div className="metric-tile">
                <span>Complexity</span>
                <strong>{descriptor.complexity}%</strong>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${descriptor.complexity}%` }} />
                </div>
                <p>A quick estimate of compute load, coordination cost, and execution depth.</p>
              </div>

              <div className="metric-tile">
                <span>Expected ROI</span>
                <strong>{descriptor.profit}</strong>
                <p>This can mean direct return, traffic gain, brand lift, or broader task value.</p>
              </div>

              <div className="metric-tile wide">
                <span>Execution Path</span>
                <div className="path-row">
                  {descriptor.path.map((step) => (
                    <div key={step} className="path-step">{step}</div>
                  ))}
                </div>
                <p>{descriptor.note}</p>
              </div>

              <div className="metric-tile wide">
                <span>Queen Route</span>
                <div className="queen-row">
                  {descriptor.queens.map((queen) => (
                    <div key={queen} className="queen-chip">{queen}</div>
                  ))}
                </div>
                <p>Only the public queen route is shown here, not the full internal execution choreography.</p>
              </div>
            </div>

            <div className="node-grid">
              {nodes.map((node, index) => (
                <article key={node.title} className="node-card">
                  <div className="node-index">0{index + 1}</div>
                  <strong>{node.title}</strong>
                  <p>{node.text}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        :global(:root) {
          --bg: #06131c;
          --panel: rgba(9, 22, 31, 0.88);
          --border: rgba(111, 188, 168, 0.22);
          --text: #e8f6f1;
          --muted: #92afa5;
          --dim: #5d7b73;
          --accent: #8de7bb;
          --signal: #f5c86b;
          --shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
          --mono: 'Space Mono', 'IBM Plex Mono', monospace;
          --sans: 'Noto Sans SC', 'Source Han Sans SC', sans-serif;
        }
        :global(body) {
          margin: 0;
          font-family: var(--sans);
          background:
            radial-gradient(circle at top left, rgba(77, 180, 154, 0.18), transparent 28%),
            linear-gradient(180deg, #07161b 0%, #0a1317 55%, #071116 100%);
          color: #edf8f3;
        }
        :global(*) { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        .shell { max-width: 1240px; margin: 0 auto; padding: 18px 24px 40px; }
        .eyebrow, .section-tag {
          color: #93d8c4; letter-spacing: 0.28em; text-transform: uppercase; font-size: 12px;
        }
        .subline { margin-top: 8px; color: rgba(226, 243, 237, 0.72); font-size: 14px; }
        .stack { display: grid; gap: 22px; margin-top: 24px; }
        .card {
          border: 1px solid rgba(109, 190, 167, 0.14); background: rgba(8, 24, 30, 0.86);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.18); backdrop-filter: blur(16px);
        }
        .hero-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(360px, 1fr); gap: 22px; min-height: 34vh; align-items: stretch; }
        .concierge, .power-side, .descriptor { border-radius: 28px; padding: 28px; }
        .concierge { display: flex; flex-direction: column; }
        .concierge-head { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 26px; align-items: center; margin: 18px 0 26px; }
        .avatar {
          position: relative; width: 148px; height: 148px; margin: 0 auto; border-radius: 50%; display: grid; place-items: center;
          background: radial-gradient(circle, rgba(124, 229, 196, 0.2), rgba(124, 229, 196, 0.03)); border: 1px solid rgba(124, 229, 196, 0.22); overflow: hidden;
        }
        .ring { position: absolute; border-radius: 999px; border: 1px solid rgba(133, 223, 197, 0.18); }
        .ring-a { width: 110px; height: 110px; animation: pulse 4.5s ease-in-out infinite; }
        .ring-b { width: 138px; height: 138px; animation: pulse 4.5s ease-in-out infinite 1.2s; }
        .bars { display: flex; align-items: end; gap: 8px; height: 62px; }
        .bars span { width: 10px; border-radius: 999px; background: linear-gradient(180deg, #b2f7e0 0%, #4cc89b 100%); animation: bars 1.5s ease-in-out infinite; }
        .bars span:nth-child(1) { height: 26px; animation-delay: 0s; }
        .bars span:nth-child(2) { height: 46px; animation-delay: 0.2s; }
        .bars span:nth-child(3) { height: 58px; animation-delay: 0.4s; }
        .bars span:nth-child(4) { height: 36px; animation-delay: 0.6s; }
        .bars span:nth-child(5) { height: 22px; animation-delay: 0.8s; }
        h1, h2, p { margin: 0; }
        h1 { font-size: clamp(24px, 2.5vw, 34px); line-height: 1.14; max-width: 760px; }
        h2 { font-size: clamp(24px, 2.4vw, 32px); line-height: 1.14; max-width: 900px; }
        .typing { margin-top: 16px; color: rgba(225, 244, 237, 0.82); font-size: 16px; line-height: 1.8; max-width: 760px; }
        .prompt-box { display: grid; gap: 12px; margin-top: 24px; }
        .prompt-box span { color: rgba(201, 237, 226, 0.76); font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; }
        textarea {
          min-height: 126px; resize: vertical; border-radius: 22px; border: 1px solid rgba(125, 209, 183, 0.18); background: rgba(4, 15, 20, 0.72);
          color: #eff9f4; padding: 18px 20px; font-size: 16px; line-height: 1.65; outline: none;
        }
        textarea:focus { border-color: rgba(151, 240, 211, 0.46); box-shadow: 0 0 0 4px rgba(117, 211, 183, 0.08); }
        .prompt-actions {
          margin-top: 16px;
          display: flex;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .analyze-button {
          border: 0;
          border-radius: 999px;
          padding: 12px 18px;
          background: linear-gradient(135deg, #8fe7c9 0%, #e3ef92 100%);
          color: #072026;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }
        .analyze-button:hover:not(:disabled) { transform: translateY(-1px); }
        .analyze-button:disabled { opacity: 0.7; cursor: wait; }
        .prompt-note {
          flex: 1;
          min-width: 260px;
          color: rgba(211, 238, 227, 0.72);
          font-size: 14px;
          line-height: 1.7;
        }
        .intent-strip { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .intent-strip span, .lane-pill, .queen-chip, .path-step, .power-link {
          border-radius: 999px; border: 1px solid rgba(137, 224, 194, 0.2); background: rgba(12, 37, 43, 0.9); color: #c9efde; padding: 10px 14px; font-size: 13px;
        }
        .reply-panel {
          margin-top: 18px;
          border-radius: 24px;
          border: 1px solid rgba(123, 204, 178, 0.14);
          background: rgba(6, 18, 24, 0.82);
          padding: 20px;
          display: grid;
          gap: 14px;
        }
        .reply-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .reply-tag, .reply-status {
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: var(--mono);
        }
        .reply-tag { color: #f5c86b; }
        .reply-status { color: rgba(201, 237, 226, 0.62); }
        .reply-bubble {
          border-radius: 22px;
          border: 1px solid rgba(123, 204, 178, 0.14);
          background: rgba(10, 28, 35, 0.84);
          padding: 18px 18px 16px;
          display: grid;
          gap: 10px;
        }
        .reply-bubble p {
          margin: 0;
          color: rgba(236, 247, 242, 0.84);
          line-height: 1.8;
          font-size: 15px;
          white-space: pre-wrap;
        }
        .reply-actions {
          display: grid;
          gap: 10px;
          margin-top: 2px;
        }
        .reply-link {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(243, 198, 109, 0.26);
          background: rgba(243, 198, 109, 0.08);
          color: #f1d687;
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.04em;
        }
        .reply-action-note {
          margin: 0;
          color: rgba(201, 237, 226, 0.62);
          font-size: 13px;
          line-height: 1.7;
        }
        .reserve-wall {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid rgba(128, 212, 183, 0.12);
        }
        .reserve-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        .reserve-copy {
          color: rgba(209, 235, 225, 0.72);
          font-size: 14px;
          line-height: 1.7;
          max-width: 420px;
        }
        .reserve-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }
        .reserve-card {
          border-radius: 24px;
          border: 1px solid rgba(123, 204, 178, 0.14);
          background: rgba(6, 18, 24, 0.8);
          padding: 18px;
          min-height: 138px;
        }
        .reserve-card span {
          display: block;
          color: rgba(185, 235, 218, 0.7);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .reserve-card strong {
          display: block;
          margin-top: 12px;
          font-size: clamp(26px, 2.6vw, 34px);
          line-height: 1;
          color: #f2f0b2;
        }
        .reserve-card p {
          margin-top: 12px;
          color: rgba(225, 242, 236, 0.72);
          line-height: 1.7;
        }
        .power-side h2 { margin: 14px 0 18px; }
        .power-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .stat-card {
          border-radius: 24px; border: 1px solid rgba(123, 204, 178, 0.14); background: rgba(6, 18, 24, 0.8); padding: 20px;
          min-height: 154px;
        }
        .stat-card span, .metric-tile span {
          display: block; color: rgba(185, 235, 218, 0.7); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
        }
        .stat-card strong, .metric-tile strong {
          display: block; margin-top: 12px; font-size: clamp(28px, 3vw, 36px); line-height: 1;
        }
        .stat-card p, .metric-tile p, .node-card p, .power-footer p {
          margin-top: 12px; color: rgba(225, 242, 236, 0.74); line-height: 1.7;
        }
        .stat-card.online strong { color: #a9ffe3; }
        .stat-card.model strong { color: #f2f0b2; }
        .stat-card.standby-on strong { color: #b8ffe4; }
        .stat-card.standby-off strong { color: #ffd7b3; }
        .power-footer {
          margin-top: 18px; display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; flex-wrap: wrap;
          border-top: 1px solid rgba(128, 212, 183, 0.12); padding-top: 18px;
        }
        .descriptor-top { display: flex; justify-content: space-between; gap: 12px; align-items: center; flex-wrap: wrap; }
        .descriptor-grid, .node-grid { display: grid; gap: 18px; margin-top: 22px; }
        .descriptor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .metric-tile, .node-card {
          border-radius: 24px; border: 1px solid rgba(123, 204, 178, 0.14); background: rgba(6, 18, 24, 0.8); padding: 20px;
        }
        .metric-tile.wide { grid-column: span 2; }
        .progress-track { width: 100%; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; margin-top: 14px; }
        .progress-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #53cca0 0%, #c9f2a4 100%); }
        .path-row, .queen-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
        .node-grid { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
        .node-index { color: #8fe9cb; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 10px; }
        .node-card strong { display: block; font-size: 18px; }
        @keyframes pulse { 0%,100% { transform: scale(0.94); opacity: 0.5; } 50% { transform: scale(1.02); opacity: 1; } }
        @keyframes bars { 0%,100% { transform: scaleY(0.7); opacity: 0.8; } 50% { transform: scaleY(1.15); opacity: 1; } }
        @media (max-width: 1080px) {
          .hero-grid, .power-grid, .descriptor-grid, .reserve-grid { grid-template-columns: 1fr; }
          .metric-tile.wide { grid-column: span 1; }
        }
        @media (max-width: 760px) {
          .shell { padding: 18px 16px 48px; }
          .concierge-head { grid-template-columns: 1fr; }
          .concierge, .power-side, .descriptor { padding: 22px; border-radius: 24px; }
          nav { gap: 14px; font-size: 14px; }
          h1 { font-size: 30px; }
          h2 { font-size: 28px; }
          textarea { min-height: 112px; padding: 16px; }
        }
      `}</style>
    </>
  )
}

