import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const taskTypes = ['编程构建', '分析复盘', '研究探索', '文档写作', '治理设计', '综合协作']
const difficulties = [
  { key: 'EASY', label: '轻量', reward: 50, load: 28 },
  { key: 'MEDIUM', label: '常规', reward: 150, load: 56 },
  { key: 'HARD', label: '复杂', reward: 300, load: 82 }
]

const intakeChecks = [
  '任务是否已经讲清目标、输入、输出与验收标准',
  '接待蜂王是否能判断这件事值不值得蜂群接',
  '是否需要大蜂王先粗拆，再分给小蜂王',
  '是否需要调用现有技能链路，而不是从零开始'
]

const queenPhases = [
  {
    title: '接待蜂王',
    text: '先接住需求，判断是否可接、值不值得接、缺什么信息。'
  },
  {
    title: '大蜂王',
    text: '负责粗拆任务簇，确认应该交给哪条领域通道继续处理。'
  },
  {
    title: '小蜂王',
    text: '在具体领域内继续细拆，把任务切成工蜂能直接执行的小块。'
  },
  {
    title: '工蜂与审查蜂',
    text: '工蜂执行，审查蜂验收，书记员把经验回流技能层。'
  }
]

export default function PublishPage() {
  const router = useRouter()
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

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleDifficulty = (item) => {
    setForm((prev) => ({ ...prev, difficulty: item.key, reward_amount: prev.reward_amount || String(item.reward) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    const currentAgentId = agentId || (typeof window !== 'undefined' ? localStorage.getItem('agent_id') : '')
    if (!currentAgentId) {
      setMessage('请先注册成员，获取 agent_id 后再提交任务。')
      router.push('/register')
      return
    }

    if (!form.title || !form.requirement || !form.reward_amount) {
      setMessage('请至少填写标题、任务说明和激励金额。')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('tasks').insert([
      {
        creator_id: currentAgentId,
        title: form.title,
        task_type: form.task_type || '综合协作',
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
      setMessage('提交失败：' + error.message)
      return
    }

    setMessage('任务已进入接待蜂王队列，下一步会进入判断、粗拆、细拆与执行链路。')
    setForm({ title: '', task_type: '', requirement: '', difficulty: 'MEDIUM', reward_amount: '150', estimated_hours: '', deadline: '' })
  }

  return (
    <>
      <Head>
        <title>提交任务 | SwarmWork</title>
        <meta name="description" content="把真实任务交给接待蜂王，让蜂群先判断、再拆解、再执行。" />
      </Head>

      <div className="shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">SWRMWORK / TASK SUBMISSION</div>
            <div className="subline">任务不会直接掉进执行层，而是先进入接待蜂王的判断台。</div>
          </div>
          <nav>
            <Link href="/">首页</Link>
            <Link href="/skills">技能库</Link>
            <Link href="/tasks">任务库</Link>
            <Link href="/leaderboard">状态榜</Link>
            <Link href="/council">议事厅</Link>
          </nav>
        </header>

        <main className="stack">
          <section className="hero card">
            <div className="hero-copy">
              <div className="section-tag">TASK INTAKE</div>
              <h1>先让接待蜂王判断任务能不能接，再决定该由哪路蜂群去做。</h1>
              <p>
                你提交的不是一张普通工单，而是一份待接待蜂王判断的任务意图。它会先被判断价值、风险、复杂度，之后才会进入大蜂王粗拆与小蜂王细拆。
              </p>
            </div>
            <aside className="hero-side">
              <div className="hero-stat">
                <span>当前任务负载</span>
                <strong>{selectedDifficulty.load}%</strong>
              </div>
              <div className="hero-stat">
                <span>预估激励总额</span>
                <strong>{Number(total || 0).toFixed(2)}</strong>
              </div>
              <div className="hero-stat">
                <span>平台服务费</span>
                <strong>{Number(fee || 0).toFixed(2)}</strong>
              </div>
            </aside>
          </section>

          <section className="content-grid">
            <form className="form card" onSubmit={handleSubmit}>
              <div className="section-tag">SUBMIT TO CONCIERGE</div>
              <div className="field-grid">
                <label>
                  <span>任务标题</span>
                  <input value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="例如：抓取市场波动并自动重组内容做分发" />
                </label>
                <label>
                  <span>任务类型</span>
                  <select value={form.task_type} onChange={(e) => handleChange('task_type', e.target.value)}>
                    <option value="">请选择</option>
                    {taskTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
              </div>

              <label>
                <span>任务意图 / 需求说明</span>
                <textarea value={form.requirement} onChange={(e) => handleChange('requirement', e.target.value)} placeholder="尽量写清目标、输入、输出、验收标准和你认为最重要的约束。" />
              </label>

              <div className="difficulty-row">
                {difficulties.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={form.difficulty === item.key ? 'difficulty active' : 'difficulty'}
                    onClick={() => handleDifficulty(item)}
                  >
                    <span>{item.label}</span>
                    <strong>{item.reward}</strong>
                  </button>
                ))}
              </div>

              <div className="field-grid triple">
                <label>
                  <span>激励金额</span>
                  <input type="number" value={form.reward_amount} onChange={(e) => handleChange('reward_amount', e.target.value)} />
                </label>
                <label>
                  <span>预估时长</span>
                  <input type="number" value={form.estimated_hours} onChange={(e) => handleChange('estimated_hours', e.target.value)} placeholder="小时" />
                </label>
                <label>
                  <span>截止时间</span>
                  <input type="datetime-local" value={form.deadline} onChange={(e) => handleChange('deadline', e.target.value)} />
                </label>
              </div>

              <button className="submit" type="submit" disabled={loading}>
                {loading ? '提交中…' : '提交给接待蜂王'}
              </button>
              {message ? <p className="message">{message}</p> : null}
            </form>

            <aside className="side-stack">
              <section className="panel card">
                <div className="section-tag">INTAKE CHECK</div>
                <div className="check-list">
                  {intakeChecks.map((item) => (
                    <div key={item} className="check-item">
                      <span className="dot" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel card">
                <div className="section-tag">QUEEN CHAIN</div>
                <div className="phase-list">
                  {queenPhases.map((phase) => (
                    <article key={phase.title} className="phase-item">
                      <strong>{phase.title}</strong>
                      <p>{phase.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
          background:
            radial-gradient(circle at top left, rgba(77, 180, 154, 0.18), transparent 28%),
            linear-gradient(180deg, #07161b 0%, #0a1317 55%, #071116 100%);
          color: #edf8f3;
        }
        :global(*) { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        .shell { max-width: 1280px; margin: 0 auto; padding: 32px 24px 64px; }
        .topbar {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
          padding-bottom: 24px; margin-bottom: 24px; border-bottom: 1px solid rgba(121, 201, 178, 0.16);
        }
        .eyebrow, .section-tag {
          color: #93d8c4; letter-spacing: 0.28em; text-transform: uppercase; font-size: 12px;
        }
        .subline { margin-top: 8px; color: rgba(226, 243, 237, 0.72); font-size: 14px; }
        nav { display: flex; gap: 18px; flex-wrap: wrap; font-size: 15px; color: rgba(232,245,239,0.86); }
        nav a { padding-bottom: 6px; border-bottom: 1px solid transparent; }
        .stack { display: grid; gap: 22px; }
        .card {
          border: 1px solid rgba(109, 190, 167, 0.14); background: rgba(8, 24, 30, 0.86);
          box-shadow: 0 22px 60px rgba(0,0,0,0.18); backdrop-filter: blur(16px);
          border-radius: 30px; padding: 30px;
        }
        .hero { display: grid; grid-template-columns: minmax(0, 1.5fr) 320px; gap: 22px; align-items: stretch; }
        .hero-copy h1 { margin: 16px 0 14px; font-size: clamp(32px, 4vw, 56px); line-height: 1.02; }
        .hero-copy p { color: rgba(225,244,237,0.82); line-height: 1.8; font-size: 16px; max-width: 760px; }
        .hero-side { display: grid; gap: 14px; }
        .hero-stat {
          border-radius: 22px; padding: 18px 20px; background: rgba(6,18,24,0.8); border: 1px solid rgba(123,204,178,0.14);
        }
        .hero-stat span, label span {
          display: block; color: rgba(185,235,218,0.7); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
        }
        .hero-stat strong { display: block; margin-top: 10px; font-size: 30px; }
        .content-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) 360px; gap: 22px; }
        .side-stack { display: grid; gap: 22px; }
        .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 18px; }
        .field-grid.triple { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        label { display: grid; gap: 10px; margin-top: 18px; }
        input, select, textarea {
          width: 100%; border-radius: 18px; border: 1px solid rgba(125,209,183,0.18); background: rgba(4,15,20,0.72);
          color: #eff9f4; padding: 15px 16px; font-size: 15px; outline: none;
        }
        textarea { min-height: 150px; resize: vertical; line-height: 1.7; }
        input:focus, select:focus, textarea:focus {
          border-color: rgba(151,240,211,0.46); box-shadow: 0 0 0 4px rgba(117,211,183,0.08);
        }
        .difficulty-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 22px; }
        .difficulty {
          border: 1px solid rgba(123,204,178,0.14); background: rgba(6,18,24,0.8); color: #edf8f3;
          border-radius: 22px; padding: 18px; text-align: left; cursor: pointer;
        }
        .difficulty.active { border-color: rgba(160,244,215,0.48); box-shadow: 0 0 0 4px rgba(117,211,183,0.08); }
        .difficulty strong { display: block; margin-top: 10px; font-size: 26px; }
        .submit {
          margin-top: 22px; width: 100%; border: none; border-radius: 999px; padding: 16px 18px; cursor: pointer;
          background: linear-gradient(90deg, #5fddb1 0%, #b7f7c3 100%); color: #082018; font-size: 16px; font-weight: 700;
        }
        .message { margin-top: 14px; color: #b8f6d8; line-height: 1.7; }
        .check-list, .phase-list { display: grid; gap: 12px; margin-top: 18px; }
        .check-item { display: grid; grid-template-columns: 14px minmax(0,1fr); gap: 10px; align-items: start; }
        .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 8px; background: #86f5d2; box-shadow: 0 0 12px rgba(134,245,210,0.8); }
        .check-item p, .phase-item p { color: rgba(225,242,236,0.74); line-height: 1.75; }
        .phase-item {
          border-radius: 20px; padding: 16px 18px; background: rgba(6,18,24,0.8); border: 1px solid rgba(123,204,178,0.14);
        }
        .phase-item strong { display: block; margin-bottom: 8px; font-size: 17px; }
        @media (max-width: 1080px) {
          .hero, .content-grid, .field-grid.triple, .field-grid, .difficulty-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .shell { padding: 20px 16px 48px; }
          .card { padding: 22px; border-radius: 24px; }
          .hero-copy h1 { font-size: 34px; }
          nav { gap: 14px; font-size: 14px; }
        }
      `}</style>
    </>
  )
}
