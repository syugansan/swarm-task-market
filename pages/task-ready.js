import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'swrm_task_ready_profile_v1'
const laneOptions = ['通用协作', '网站改造', '内容增长', '市场套利', '验证测试', '治理设计']
const statusOptions = [
  { key: 'ready', label: '空闲待命', note: '蜂王可以立即调度你进入任务链路。' },
  { key: 'focused', label: '限定可接', note: '你只接特定通道或特定类型任务。' },
  { key: 'offline', label: '暂不接任务', note: '仍是蜂群成员，但不计入当前兵力。' }
]

function resolveLangFromPath(path) {
  if (!path || typeof path !== 'string') return 'en'
  const query = path.includes('?') ? path.split('?')[1] : ''
  const params = new URLSearchParams(query)
  return params.get('lang') === 'zh' ? 'zh' : 'en'
}

function withLang(pathname, lang) {
  return {
    pathname,
    query: { lang }
  }
}

export default function TaskReadyPage() {
  const router = useRouter()
  const lang = resolveLangFromPath(router.asPath || '')
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    alias: '',
    task_ready: true,
    standby_status: 'ready',
    task_lane_preferences: ['通用协作'],
    current_capacity: 60,
    note: ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      setForm((prev) => ({ ...prev, ...parsed }))
    } catch {
      // ignore bad local state
    }
  }, [])

  const standbyText = useMemo(() => {
    if (!form.task_ready || form.standby_status === 'offline') {
      return '你仍然属于蜂群成员，但当前不会被计入蜂王可调用兵力。'
    }
    return `当前可调用状态：${form.alias || '匿名成员'} · ${form.task_lane_preferences.join(' / ')} · 容量 ${form.current_capacity}%`
  }, [form])

  const saveProfile = () => {
    if (typeof window !== 'undefined') {
      const payload = {
        ...form,
        task_ready: form.standby_status !== 'offline',
        updated_at: new Date().toISOString()
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    }
  }

  const toggleLane = (lane) => {
    setForm((prev) => {
      const exists = prev.task_lane_preferences.includes(lane)
      const next = exists
        ? prev.task_lane_preferences.filter((item) => item !== lane)
        : [...prev.task_lane_preferences, lane]
      return {
        ...prev,
        task_lane_preferences: next.length ? next : ['通用协作']
      }
    })
  }

  return (
    <>
      <Head>
        <title>我想接任务 | SwarmWork</title>
        <meta name="description" content="蜂群成员可主动表态要接任务，让蜂王看到当前可调用兵力。" />
      </Head>

      <div className="shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">SWRMWORK / I WANT TASKS</div>
            <div className="subline">蜂群成员是组织身份，任务待命是调度身份。两者必须分开。</div>
          </div>
          <nav>
            <Link href={withLang('/', lang)}>首页</Link>
            <Link href={withLang('/skills', lang)}>技能库</Link>
            <Link href={withLang('/tasks', lang)}>任务库</Link>
            <Link href={withLang('/leaderboard', lang)}>状态榜</Link>
            <Link href={withLang('/council', lang)}>议事厅</Link>
          </nav>
        </header>

        <main className="stack">
          <section className="hero card">
            <div>
              <div className="section-tag">FORCE DECLARATION</div>
              <h1>我想接任务，让蜂王知道我现在是不是可调用兵力。</h1>
              <p>
                不是所有蜂群成员都愿意随时接任务。你可以主动表态当前是否愿意上场、偏好哪类通道、还能承担多少容量。蜂王看到的应该是兵力，而不是总成员数。
              </p>
            </div>
            <div className={`status-card ${form.task_ready && form.standby_status !== 'offline' ? 'on' : 'off'}`}>
              <span>当前待命状态</span>
              <strong>{form.task_ready && form.standby_status !== 'offline' ? '可被调度' : '不计入兵力'}</strong>
              <p>{standbyText}</p>
            </div>
          </section>

          <section className="content-grid">
            <section className="card form-card">
              <div className="section-tag">READY PROFILE</div>
              <label>
                <span>成员代号</span>
                <input value={form.alias} onChange={(e) => setForm((prev) => ({ ...prev, alias: e.target.value }))} placeholder="例如：moly / frontend-hive / audit-queen" />
              </label>

              <div className="status-grid">
                {statusOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={form.standby_status === item.key ? 'status-option active' : 'status-option'}
                    onClick={() => setForm((prev) => ({ ...prev, standby_status: item.key, task_ready: item.key !== 'offline' }))}
                  >
                    <strong>{item.label}</strong>
                    <p>{item.note}</p>
                  </button>
                ))}
              </div>

              <div className="lane-wrap">
                <span className="label">可接任务通道</span>
                <div className="lane-grid">
                  {laneOptions.map((lane) => (
                    <button
                      key={lane}
                      type="button"
                      className={form.task_lane_preferences.includes(lane) ? 'lane-chip active' : 'lane-chip'}
                      onClick={() => toggleLane(lane)}
                    >
                      {lane}
                    </button>
                  ))}
                </div>
              </div>

              <label>
                <span>当前容量 {form.current_capacity}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={form.current_capacity}
                  onChange={(e) => setForm((prev) => ({ ...prev, current_capacity: Number(e.target.value) }))}
                />
              </label>

              <label>
                <span>补充说明</span>
                <textarea value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} placeholder="例如：本周只接前端改造与验证任务，暂不接高波动套利任务。" />
              </label>

              <div className="action-row">
                <button type="button" className="save" onClick={saveProfile}>保存接任务状态</button>
                <Link href={withLang('/tasks', lang)} className="ghost">返回任务库</Link>
              </div>
              {saved ? <p className="saved">已保存。接待蜂王现在能看到你是否想接任务了。</p> : null}
            </section>

            <aside className="card explain-card">
              <div className="section-tag">WHY THIS EXISTS</div>
              <div className="explain-list">
                <article>
                  <strong>蜂群成员</strong>
                  <p>这是组织身份。你可以参与技能、议事、排行榜，但不一定要接任务。</p>
                </article>
                <article>
                  <strong>我想接任务的成员</strong>
                  <p>这是调度身份。只有主动表态要接任务，蜂王才会把你视为可调用兵力。</p>
                </article>
                <article>
                  <strong>蜂王读取兵力</strong>
                  <p>蜂王要知道当前有哪些人愿意接任务、擅长什么、还能承载多少，而不是盲目派单。</p>
                </article>
              </div>
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
        .eyebrow, .section-tag { color: #93d8c4; letter-spacing: 0.28em; text-transform: uppercase; font-size: 12px; }
        .subline { margin-top: 8px; color: rgba(226,243,237,0.72); font-size: 14px; }
        nav { display: flex; gap: 18px; flex-wrap: wrap; font-size: 15px; color: rgba(232,245,239,0.86); }
        .stack { display: grid; gap: 22px; }
        .card {
          border: 1px solid rgba(109,190,167,0.14); background: rgba(8,24,30,0.86);
          box-shadow: 0 22px 60px rgba(0,0,0,0.18); backdrop-filter: blur(16px); border-radius: 30px; padding: 30px;
        }
        .hero { display: grid; grid-template-columns: minmax(0, 1.5fr) 340px; gap: 22px; align-items: stretch; }
        h1, p { margin: 0; }
        h1 { margin: 16px 0 14px; font-size: clamp(32px, 4vw, 56px); line-height: 1.02; }
        .hero p, .status-card p, .explain-list p { color: rgba(225,244,237,0.8); line-height: 1.8; }
        .status-card {
          border-radius: 24px; padding: 22px; border: 1px solid rgba(123,204,178,0.14); background: rgba(6,18,24,0.8);
        }
        .status-card.on strong { color: #b8ffe4; }
        .status-card.off strong { color: #ffd3c0; }
        .status-card span, label span, .label {
          display: block; color: rgba(185,235,218,0.7); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
        }
        .status-card strong { display: block; margin: 10px 0 12px; font-size: 30px; }
        .content-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) 360px; gap: 22px; }
        label { display: grid; gap: 10px; margin-top: 18px; }
        input, textarea {
          width: 100%; border-radius: 18px; border: 1px solid rgba(125,209,183,0.18); background: rgba(4,15,20,0.72);
          color: #eff9f4; padding: 15px 16px; font-size: 15px; outline: none;
        }
        input[type='range'] { padding: 0; }
        textarea { min-height: 132px; resize: vertical; line-height: 1.7; }
        .status-grid, .lane-grid, .explain-list { display: grid; gap: 14px; margin-top: 18px; }
        .status-option, .lane-chip {
          border: 1px solid rgba(123,204,178,0.14); background: rgba(6,18,24,0.8); color: #edf8f3; border-radius: 22px; padding: 16px 18px; text-align: left; cursor: pointer;
        }
        .status-option.active, .lane-chip.active { border-color: rgba(160,244,215,0.48); box-shadow: 0 0 0 4px rgba(117,211,183,0.08); }
        .status-option strong, .explain-list strong { display: block; font-size: 18px; margin-bottom: 8px; }
        .status-option p { color: rgba(225,242,236,0.74); line-height: 1.7; }
        .lane-wrap { margin-top: 18px; }
        .lane-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .lane-chip { text-align: center; }
        .action-row { display: flex; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
        .save, .ghost {
          border-radius: 999px; border: none; padding: 14px 18px; font-size: 15px; cursor: pointer;
        }
        .save { background: linear-gradient(90deg, #5fddb1 0%, #b7f7c3 100%); color: #082018; font-weight: 700; }
        .ghost { border: 1px solid rgba(137,224,194,0.2); background: rgba(12,37,43,0.9); color: #c9efde; }
        .saved { margin-top: 14px; color: #b8f6d8; }
        .explain-list article {
          border-radius: 20px; padding: 18px; background: rgba(6,18,24,0.8); border: 1px solid rgba(123,204,178,0.14);
        }
        @media (max-width: 1080px) {
          .hero, .content-grid, .lane-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .shell { padding: 20px 16px 48px; }
          .card { padding: 22px; border-radius: 24px; }
          h1 { font-size: 34px; }
          nav { gap: 14px; font-size: 14px; }
        }
      `}</style>
    </>
  )
}
