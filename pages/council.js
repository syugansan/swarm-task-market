import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'

function t(lang, zh, en) {
  return lang === 'zh' ? zh : en
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function CouncilPage() {
  const router = useRouter()
  const lang = router.query.lang === 'en' ? 'en' : 'zh'

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [sending, setSending] = useState(false)
  const [showProposal, setShowProposal] = useState(false)
  const [proposal, setProposal] = useState({ title: '', content: '' })
  const [proposalSending, setProposalSending] = useState(false)
  const [proposalDone, setProposalDone] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef(null)
  const sinceRef = useRef(null)

  // 拉取消息
  async function fetchMessages(initial = false) {
    try {
      const url = initial
        ? '/api/council/chat'
        : `/api/council/chat${sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : ''}`

      const res = await fetch(url)
      const data = await res.json()
      if (!data.success) return

      const incoming = data.messages || []
      if (incoming.length === 0) return

      sinceRef.current = incoming[incoming.length - 1].created_at

      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        const next = [...prev, ...incoming.filter(m => !ids.has(m.id))]
        return next.slice(-120)
      })
    } catch {
      // 静默失败，下次轮询再试
    }
  }

  useEffect(() => {
    fetchMessages(true)
    const timer = setInterval(() => fetchMessages(false), 8000)
    return () => clearInterval(timer)
  }, [])

  // 新消息自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/council/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, author_name: authorName.trim() || '访客' })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'failed')

      const incoming = [data.message, data.ai_message].filter(Boolean)
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        return [...prev, ...incoming.filter(m => !ids.has(m.id))].slice(-120)
      })
      if (incoming.length > 0) {
        sinceRef.current = incoming[incoming.length - 1].created_at
      }
      setInput('')
    } catch (err) {
      setError(t(lang, '发送失败，请重试', 'Send failed, please retry'))
    } finally {
      setSending(false)
    }
  }

  async function submitProposal(e) {
    e.preventDefault()
    if (!proposal.title.trim() || !proposal.content.trim() || proposalSending) return

    setProposalSending(true)
    try {
      const res = await fetch('/api/council/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposal.title.trim(),
          summary: proposal.content.trim(),
          proposer_name: authorName.trim() || '访客',
          proposal_type: 'governance'
        })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'failed')
      setProposalDone(true)
    } catch {
      setError(t(lang, '提案提交失败，请重试', 'Proposal failed, please retry'))
    } finally {
      setProposalSending(false)
    }
  }

  return (
    <>
      <Head>
        <title>{t(lang, '议事厅 — 蜂群', 'Council — Swarm')}</title>
      </Head>

      <Header lang={lang} />

      <main style={styles.main}>
        {/* 顶栏 */}
        <div style={styles.topBar}>
          <div>
            <div style={styles.topLabel}>{t(lang, '治理层', 'GOVERNANCE')}</div>
            <h1 style={styles.topTitle}>{t(lang, '议事厅', 'Council')}</h1>
          </div>
          <button style={styles.proposalBtn} onClick={() => { setShowProposal(true); setProposalDone(false) }}>
            {t(lang, '我有改进想法', 'Submit Idea')}
          </button>
        </div>

        {/* 聊天区 */}
        <div style={styles.chatBox}>
          {messages.length === 0 && (
            <div style={styles.empty}>
              {t(lang, '暂无消息，欢迎反馈你对网站的想法或问题', 'No messages yet. Share your feedback or ideas.')}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ ...styles.msgRow, justifyContent: msg.is_ai ? 'flex-start' : 'flex-end' }}>
              <div style={msg.is_ai ? styles.msgAI : styles.msgUser}>
                <div style={styles.msgMeta}>
                  <span style={msg.is_ai ? styles.nameAI : styles.nameUser}>{msg.author_name}</span>
                  <span style={styles.msgTime}>{formatTime(msg.created_at)}</span>
                </div>
                <div style={styles.msgContent}>{msg.content}</div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* 输入区 */}
        <form style={styles.inputArea} onSubmit={sendMessage}>
          <input
            style={styles.nameInput}
            placeholder={t(lang, '你的名字（选填）', 'Name (optional)')}
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            maxLength={20}
          />
          <input
            style={styles.textInput}
            placeholder={t(lang, '输入反馈或想法，@站长 可呼叫…', 'Share feedback… @站长 to call admin')}
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={500}
            disabled={sending}
          />
          <button style={{ ...styles.sendBtn, opacity: sending ? 0.5 : 1 }} type="submit" disabled={sending}>
            {sending ? '…' : t(lang, '发送', 'Send')}
          </button>
        </form>

        {error && <div style={styles.errorBar}>{error}</div>}
      </main>

      {/* 提案弹窗 */}
      {showProposal && (
        <div style={styles.overlay} onClick={() => setShowProposal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            {proposalDone ? (
              <div style={styles.modalDone}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>
                  {t(lang, '提案已提交', 'Proposal submitted')}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
                  {t(lang, '我们会在议事厅跟进，感谢你的贡献', 'We will follow up in the council. Thank you.')}
                </div>
                <button style={styles.closeBtn} onClick={() => setShowProposal(false)}>
                  {t(lang, '关闭', 'Close')}
                </button>
              </div>
            ) : (
              <form onSubmit={submitProposal}>
                <div style={styles.modalTitle}>{t(lang, '提交改进想法', 'Submit an Idea')}</div>
                <div style={styles.modalDesc}>
                  {t(lang, '有价值的想法将进入正式提案流程', 'Valuable ideas enter the formal proposal process')}
                </div>
                <input
                  style={styles.modalInput}
                  placeholder={t(lang, '标题（一句话概括）', 'Title (one sentence)')}
                  value={proposal.title}
                  onChange={e => setProposal(p => ({ ...p, title: e.target.value }))}
                  maxLength={80}
                  required
                />
                <textarea
                  style={styles.modalTextarea}
                  placeholder={t(lang, '详细描述：现在有什么问题，你希望怎么改…', 'Describe: what is the problem and how to fix it…')}
                  value={proposal.content}
                  onChange={e => setProposal(p => ({ ...p, content: e.target.value }))}
                  maxLength={1000}
                  rows={5}
                  required
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" style={styles.cancelBtn} onClick={() => setShowProposal(false)}>
                    {t(lang, '取消', 'Cancel')}
                  </button>
                  <button type="submit" style={{ ...styles.submitBtn, opacity: proposalSending ? 0.5 : 1 }} disabled={proposalSending}>
                    {proposalSending ? '…' : t(lang, '提交提案', 'Submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  main: {
    maxWidth: 780,
    margin: '0 auto',
    padding: '24px 20px 0',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 64px)',
    boxSizing: 'border-box'
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexShrink: 0
  },
  topLabel: {
    fontSize: 11,
    letterSpacing: '0.12em',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  topTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--accent)'
  },
  proposalBtn: {
    background: 'transparent',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.02em',
    transition: 'background 0.15s',
    whiteSpace: 'nowrap'
  },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  empty: {
    color: 'var(--dim)',
    fontSize: 13,
    textAlign: 'center',
    padding: '60px 20px'
  },
  msgRow: {
    display: 'flex'
  },
  msgAI: {
    maxWidth: '72%',
    background: 'rgba(141, 231, 187, 0.07)',
    border: '1px solid rgba(141, 231, 187, 0.18)',
    borderRadius: '4px 12px 12px 12px',
    padding: '10px 14px'
  },
  msgUser: {
    maxWidth: '72%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px 4px 12px 12px',
    padding: '10px 14px'
  },
  msgMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5
  },
  nameAI: {
    fontSize: 12,
    color: 'var(--accent)',
    fontWeight: 600
  },
  nameUser: {
    fontSize: 12,
    color: 'var(--muted)',
    fontWeight: 500
  },
  msgTime: {
    fontSize: 11,
    color: 'var(--dim)'
  },
  msgContent: {
    fontSize: 14,
    color: 'var(--text)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  inputArea: {
    display: 'flex',
    gap: 8,
    padding: '12px 0 20px',
    flexShrink: 0,
    alignItems: 'center'
  },
  nameInput: {
    width: 110,
    flexShrink: 0,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    padding: '10px 12px',
    fontSize: 13,
    outline: 'none'
  },
  textInput: {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none'
  },
  sendBtn: {
    background: 'var(--accent)',
    color: '#06131c',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0
  },
  errorBar: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    padding: '4px 0 12px'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20
  },
  modal: {
    background: '#0b1e2a',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 28,
    width: '100%',
    maxWidth: 480
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--accent)',
    marginBottom: 6
  },
  modalDesc: {
    fontSize: 13,
    color: 'var(--muted)',
    marginBottom: 20
  },
  modalInput: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    marginBottom: 12
  },
  modalTextarea: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    marginBottom: 16,
    fontFamily: 'inherit',
    lineHeight: 1.6
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
    padding: '8px 16px',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 13
  },
  submitBtn: {
    background: 'var(--accent)',
    color: '#06131c',
    border: 'none',
    padding: '8px 20px',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--muted)',
    padding: '8px 24px',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 13
  },
  modalDone: {
    textAlign: 'center',
    padding: '12px 0'
  }
}

export async function getServerSideProps() { return { props: {} } }
