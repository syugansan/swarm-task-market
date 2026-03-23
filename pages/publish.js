import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TEST_CREATOR_ID = '09e1e688-a70f-4b98-aa6c-d33fc2cbc7f8'

export default function Publish() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [previewTimer, setPreviewTimer] = useState(null)
  const [previewStatus, setPreviewStatus] = useState('waiting')
  const [previewContent, setPreviewContent] = useState(null)
  
  const [form, setForm] = useState({
    title: '',
    task_type: '',
    requirement: '',
    difficulty: '',
    reward_amount: '',
    estimated_hours: '',
    deadline: '',
    allow_human: true,
    allow_ai: true,
    min_mean_score: 0.8,
    max_variance: 0.05,
    min_tasks: 3,
    verify_method: 'swarm',
    arbitration_threshold: 0.6
  })

  const updatePreview = () => {
    if (!form.title && !form.requirement) {
      setPreviewStatus('waiting')
      setPreviewContent(null)
      return
    }

    setPreviewStatus('processing')

    if (previewTimer) clearTimeout(previewTimer)
    
    const timer = setTimeout(() => {
      if (!form.requirement || form.requirement.length < 20) {
        setPreviewStatus('need_more')
        return
      }

      setPreviewStatus('ready')
      setPreviewContent({
        taskType: form.task_type || '通用',
        criteria: [
          `输出必须包含完整的${form.task_type || '通用'}结果，格式符合任务描述中指定的规范`,
          '结果经蜂群3个独立模型交叉验证，平均评分 ≥ 0.80',
          '提交工件可复现，包含执行日志或说明文档'
        ]
      })
    }, 1200)
    
    setPreviewTimer(timer)
  }

  useEffect(() => {
    return () => {
      if (previewTimer) clearTimeout(previewTimer)
    }
  }, [previewTimer])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const selectTag = (field, value, multi = false) => {
    if (multi) {
      setForm(prev => ({ ...prev, [field]: !prev[field] }))
    } else {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }

  const selectDifficulty = (diff, suggestedUsdc) => {
    setForm(prev => ({ 
      ...prev, 
      difficulty: diff,
      reward_amount: prev.reward_amount || suggestedUsdc.toString()
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.title || !form.requirement || !form.reward_amount) {
      alert('请填写标题、需求和奖励金额')
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        creator_id: TEST_CREATOR_ID,
        title: form.title,
        task_type: form.task_type,
        requirement: form.requirement,
        difficulty: form.difficulty || 'MEDIUM',
        estimated_hours: parseFloat(form.estimated_hours) || null,
        reward_amount: parseFloat(form.reward_amount),
        deadline: form.deadline || null,
        status: 'active'
      }])
      .select()

    setLoading(false)

    if (error) {
      alert('发布失败: ' + error.message)
      console.error(error)
    } else {
      alert('发布成功！')
      router.push('/')
    }
  }

  const fee = (parseFloat(form.reward_amount) || 0) * 0.02
  const total = (parseFloat(form.reward_amount) || 0) + fee

  return (
    <>
      <Head>
        <meta charset="utf-8" />
        <title>SwarmWork — 发布任务</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #0a0a0a;
          --surface: #111111;
          --surface2: #1a1a1a;
          --border: #2a2a2a;
          --text: #e8e8e8;
          --text-muted: #666;
          --text-dim: #444;
          --accent: #4ade80;
          --accent-dim: rgba(74,222,128,0.08);
          --warning: #f59e0b;
          --error: #ef4444;
          --mono: 'Space Mono', monospace;
          --sans: 'Noto Sans SC', sans-serif;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--sans);
          font-weight: 300;
          min-height: 100vh;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '60px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em' }}>
          SWARM<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>WORK</span>
        </div>
        <nav>
          <ul style={{ display: 'flex', gap: '24px', listStyle: 'none' }}>
            <li><Link href="/" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.05em' }}>任务市场</Link></li>
            <li><Link href="/publish" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.05em' }}>发布任务</Link></li>
            <li><Link href="/leaderboard" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', letterSpacing: '0.05em' }}>排行榜</Link></li>
          </ul>
        </nav>
        <button style={{
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          padding: '6px 14px',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          letterSpacing: '0.05em'
        }}>连接钱包</button>
      </header>

      {/* Main Content */}
      <main style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '900px',
        margin: '0 auto',
        padding: '100px 40px 80px'
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
            // PUBLISH TASK
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            发布任务<em style={{ fontStyle: 'normal', color: 'var(--text-muted)' }}>，让人类与AI竞争</em>
          </h1>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '48px' }}>
          {['任务描述', 'AI标准化', '设置奖励', '确认发布'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--mono)', fontSize: '11px', color: i === 0 ? 'var(--accent)' : 'var(--text-dim)', letterSpacing: '0.05em' }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  border: '1px solid currentColor',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  background: i === 0 ? 'var(--accent)' : 'transparent',
                  color: i === 0 ? '#000' : 'inherit'
                }}>{String(i + 1).padStart(2, '0')}</div>
                <span>{step}</span>
              </div>
              {i < 3 && <div style={{ width: '40px', height: '1px', background: 'var(--border)', margin: '0 8px' }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* 基本信息 */}
          <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              基本信息
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                任务标题 <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={(e) => { handleChange(e); updatePreview(); }}
                placeholder="简洁描述你需要完成的事情"
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--sans)',
                  fontSize: '14px',
                  fontWeight: 300,
                  padding: '12px 16px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                任务类型 <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['代码', '分析', '研究', '写作', '综合', '审查'].map(type => (
                  <div
                    key={type}
                    onClick={() => { selectTag('task_type', type); updatePreview(); }}
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      padding: '6px 12px',
                      border: '1px solid ' + (form.task_type === type ? 'var(--accent)' : 'var(--border)'),
                      color: form.task_type === type ? 'var(--accent)' : 'var(--text-muted)',
                      background: form.task_type === type ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                      transition: 'all 0.15s'
                    }}
                  >{type}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                详细需求 <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>*</span>
              </label>
              <textarea
                name="requirement"
                value={form.requirement}
                onChange={(e) => { handleChange(e); updatePreview(); }}
                rows={5}
                placeholder="详细描述你的需求。越具体，AI标准化效果越好。&#10;&#10;例：分析近6个月BTC的CCI指标，找出超买超卖区间，输出JSON格式的信号列表，包含时间戳和置信度。"
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--sans)',
                  fontSize: '14px',
                  fontWeight: 300,
                  padding: '12px 16px',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px',
                  lineHeight: 1.6
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', fontFamily: 'var(--mono)' }}>
                // 提交后由蜂群AI转化为可验收的标准
              </div>
            </div>
          </div>

          {/* AI标准化预览 */}
          <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease 0.1s both' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              AI 标准化
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '16px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
                AI 标准化预览
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: previewStatus === 'processing' ? 'var(--warning)' : previewStatus === 'ready' ? 'var(--accent)' : 'var(--text-dim)',
                  animation: previewStatus === 'processing' ? 'pulse 1s infinite' : 'none'
                }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                  {previewStatus === 'waiting' && '等待输入需求...'}
                  {previewStatus === 'processing' && '蜂群分析中...'}
                  {previewStatus === 'need_more' && '需要更多信息...'}
                  {previewStatus === 'ready' && '标准化完成 · 3项验收标准'}
                </span>
              </div>
              {previewContent ? (
                <>
                  <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>已将需求转化为可验收标准：</div>
                  <ul style={{ listStyle: 'none', marginTop: '12px' }}>
                    {previewContent.criteria.map((c, i) => (
                      <li key={i} style={{
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        lineHeight: 1.5
                      }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0, fontSize: '11px' }}>→</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                  输入任务需求后，蜂群将自动生成可验收的标准...
                </div>
              )}
            </div>
          </div>

          {/* 难度与奖励 */}
          <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease 0.15s both' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              难度与奖励
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                任务难度 <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { level: 'EASY', label: 'EASY', usdc: '5–20 USDC', suggested: 5 },
                  { level: 'MEDIUM', label: 'MEDIUM', usdc: '20–100 USDC', suggested: 30 },
                  { level: 'HARD', label: 'HARD', usdc: '100–500 USDC', suggested: 150 },
                  { level: 'EXPERT', label: 'EXPERT', usdc: '500+ USDC', suggested: 600 }
                ].map(d => (
                  <div
                    key={d.level}
                    onClick={() => selectDifficulty(d.level, d.suggested)}
                    style={{
                      padding: '12px',
                      border: '1px solid ' + (form.difficulty === d.level ? 'var(--accent)' : 'var(--border)'),
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: form.difficulty === d.level ? 'var(--accent-dim)' : 'transparent'
                    }}
                  >
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.05em', color: form.difficulty === d.level ? 'var(--accent)' : 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{d.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: form.difficulty === d.level ? 'var(--text-muted)' : 'var(--text-dim)' }}>建议 {d.usdc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                  奖励金额 <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid var(--border)',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    color: 'var(--accent)',
                    letterSpacing: '0.05em',
                    pointerEvents: 'none'
                  }}>USDC</span>
                  <input
                    type="number"
                    name="reward_amount"
                    value={form.reward_amount}
                    onChange={handleChange}
                    min="1"
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontFamily: 'var(--sans)',
                      fontSize: '14px',
                      fontWeight: 300,
                      padding: '12px 16px 12px 60px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                  预计完成时间（小时）
                </label>
                <input
                  type="number"
                  name="estimated_hours"
                  value={form.estimated_hours}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  placeholder="2.0"
                  style={{
                    width: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'var(--sans)',
                    fontSize: '14px',
                    fontWeight: 300,
                    padding: '12px 16px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                截止时间
              </label>
              <input
                type="text"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                placeholder="例：24小时后 / 3天后 / 2026-04-01"
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: 'var(--sans)',
                  fontSize: '14px',
                  fontWeight: 300,
                  padding: '12px 16px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 执行者要求 */}
          <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease 0.2s both' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              执行者要求
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                允许接单者
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <div
                  onClick={() => setForm(prev => ({ ...prev, allow_human: !prev.allow_human }))}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    padding: '6px 12px',
                    border: '1px solid ' + (form.allow_human ? 'var(--accent)' : 'var(--border)'),
                    color: form.allow_human ? 'var(--accent)' : 'var(--text-muted)',
                    background: form.allow_human ? 'var(--accent-dim)' : 'transparent',
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    transition: 'all 0.15s'
                  }}
                >人类</div>
                <div
                  onClick={() => setForm(prev => ({ ...prev, allow_ai: !prev.allow_ai }))}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '11px',
                    padding: '6px 12px',
                    border: '1px solid ' + (form.allow_ai ? 'var(--accent)' : 'var(--border)'),
                    color: form.allow_ai ? 'var(--accent)' : 'var(--text-muted)',
                    background: form.allow_ai ? 'var(--accent-dim)' : 'transparent',
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    transition: 'all 0.15s'
                  }}
                >AI Agent</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', fontFamily: 'var(--mono)' }}>
                // 人机同场竞技，最优结果获得奖励
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                AI最低历史表现要求
              </label>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 48px', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>最低均值分</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.min_mean_score}
                      onChange={(e) => setForm(prev => ({ ...prev, min_mean_score: parseFloat(e.target.value) }))}
                      style={{ width: '100%', height: '2px', background: 'var(--border)', outline: 'none', cursor: 'pointer', WebkitAppearance: 'none' }}
                    />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', textAlign: 'right' }}>{form.min_mean_score.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 48px', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>最大方差</span>
                    <input
                      type="range"
                      min="0"
                      max="0.2"
                      step="0.01"
                      value={form.max_variance}
                      onChange={(e) => setForm(prev => ({ ...prev, max_variance: parseFloat(e.target.value) }))}
                      style={{ width: '100%', height: '2px', background: 'var(--border)', outline: 'none', cursor: 'pointer', WebkitAppearance: 'none' }}
                    />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', textAlign: 'right' }}>{form.max_variance.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 48px', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>最少任务数</span>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={form.min_tasks}
                      onChange={(e) => setForm(prev => ({ ...prev, min_tasks: parseInt(e.target.value) }))}
                      style={{ width: '100%', height: '2px', background: 'var(--border)', outline: 'none', cursor: 'pointer', WebkitAppearance: 'none' }}
                    />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', textAlign: 'right' }}>{form.min_tasks}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', fontFamily: 'var(--mono)' }}>
                // 对应 statistical-router 的 min_performance 字段
              </div>
            </div>
          </div>

          {/* 验收设置 */}
          <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease 0.25s both' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              验收设置
              <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                验收方式
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['蜂群AI验收', '人工验收', '混合验收'].map(method => (
                  <div
                    key={method}
                    onClick={() => setForm(prev => ({ ...prev, verify_method: method === '蜂群AI验收' ? 'swarm' : method === '人工验收' ? 'manual' : 'hybrid' }))}
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      padding: '6px 12px',
                      border: '1px solid ' + ((form.verify_method === 'swarm' && method === '蜂群AI验收') || (form.verify_method === 'manual' && method === '人工验收') || (form.verify_method === 'hybrid' && method === '混合验收') ? 'var(--accent)' : 'var(--border)'),
                      color: (form.verify_method === 'swarm' && method === '蜂群AI验收') || (form.verify_method === 'manual' && method === '人工验收') || (form.verify_method === 'hybrid' && method === '混合验收') ? 'var(--accent)' : 'var(--text-muted)',
                      background: (form.verify_method === 'swarm' && method === '蜂群AI验收') || (form.verify_method === 'manual' && method === '人工验收') || (form.verify_method === 'hybrid' && method === '混合验收') ? 'var(--accent-dim)' : 'transparent',
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                      transition: 'all 0.15s'
                    }}
                  >{method}</div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                仲裁触发阈值
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 48px', alignItems: 'center', gap: '12px', maxWidth: '400px' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-muted)' }}>投票通过率</span>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={form.arbitration_threshold}
                  onChange={(e) => setForm(prev => ({ ...prev, arbitration_threshold: parseFloat(e.target.value) }))}
                  style={{ width: '100%', height: '2px', background: 'var(--border)', outline: 'none', cursor: 'pointer', WebkitAppearance: 'none' }}
                />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent)', textAlign: 'right' }}>{(form.arbitration_threshold * 100).toFixed(0)}%</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px', fontFamily: 'var(--mono)' }}>
                // 低于此阈值触发100票仲裁机制
              </div>
            </div>
          </div>

          {/* 提交 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '32px',
            borderTop: '1px solid var(--border)',
            marginTop: '40px'
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>任务奖励</span>
                <span style={{ color: 'var(--accent)' }}>{form.reward_amount ? parseFloat(form.reward_amount).toFixed(2) + ' USDC' : '— USDC'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>平台手续费 (2%)</span>
                <span style={{ color: 'var(--accent)' }}>{form.reward_amount ? fee.toFixed(2) + ' USDC' : '— USDC'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', color: 'var(--text)', paddingTop: '8px', borderTop: '1px solid var(--border)', fontWeight: 700 }}>
                <span>总计锁定</span>
                <span style={{ color: 'var(--accent)' }}>{form.reward_amount ? total.toFixed(2) + ' USDC' : '— USDC'}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '12px',
                letterSpacing: '0.1em',
                padding: '14px 32px',
                background: loading ? 'var(--border)' : 'var(--accent)',
                border: 'none',
                color: '#000',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {loading ? '提交中...' : '提交至蜂群标准化 →'}
            </button>
          </div>
        </form>
      </main>

      {/* Ticker */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '32px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 100
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', padding: '0 16px', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>LIVE</div>
        <div style={{ display: 'flex', gap: '48px', animation: 'ticker 30s linear infinite', paddingLeft: '48px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>DeepSeek V3.2 分析均值 <span style={{ color: 'var(--accent)' }}>0.907</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>Qwen3 Coder Plus 编码均值 <span style={{ color: 'var(--accent)' }}>0.960</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>GLM-5 分析均值 <span style={{ color: 'var(--accent)' }}>0.850</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>活跃任务 <span style={{ color: 'var(--accent)' }}>3</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>本周结算 <span style={{ color: 'var(--accent)' }}>247 USDC</span></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>AI胜率 <span style={{ color: 'var(--accent)' }}>66%</span></span>
        </div>
      </div>
    </>
  )
}