import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Header from '../components/Header'

function t(lang, en, zh) {
  return lang === 'zh' ? zh : en
}

const GRADUATION_THRESHOLD = 3  // 3单好评 → 进入调度台

const CONTACT_CONFIG = {
  telegram: {
    label: 'Telegram', color: '#29B6F6',
    bg: 'rgba(41,182,246,0.08)', border: 'rgba(41,182,246,0.3)',
    href: (v) => `https://t.me/${v.replace(/^@/, '')}`,
  },
  whatsapp: {
    label: 'WhatsApp', color: '#25D366',
    bg: 'rgba(37,211,102,0.08)', border: 'rgba(37,211,102,0.3)',
    href: (v) => `https://wa.me/${v.replace(/\D/g, '')}`,
  },
  email: {
    label: 'Email', color: 'var(--accent)',
    bg: 'rgba(141,231,187,0.08)', border: 'rgba(141,231,187,0.3)',
    href: (v) => `mailto:${v}`,
  },
  wechat: {
    label: 'WeChat', color: '#07C160',
    bg: 'rgba(7,193,96,0.08)', border: 'rgba(7,193,96,0.3)',
    href: null,
  },
  line: {
    label: 'LINE', color: '#00B900',
    bg: 'rgba(0,185,0,0.08)', border: 'rgba(0,185,0,0.3)',
    href: (v) => `https://line.me/ti/p/${v}`,
  },
  other: {
    label: 'Contact', color: 'var(--muted)',
    bg: 'rgba(255,255,255,0.04)', border: 'var(--border)',
    href: null,
  }
}

const EMPTY_FORM = {
  provider_name: '', capability_title: '', description: '',
  tags: '', contact_type: 'telegram', contact_value: ''
}

const EMPTY_ORDER = {
  buyer_name: '', buyer_contact_type: 'telegram', buyer_contact_value: '',
  requirement: '', amount: '', currency: 'USDC'
}

const PLATFORM_WALLET = '4sJUjgB65HYez9AHFrv9d3CuyaMyZP3kaFhnSaLds6bp'

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

export default function MarketPage() {
  const router = useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  const [orderTarget, setOrderTarget] = useState(null)
  const [order, setOrder] = useState(EMPTY_ORDER)
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const [orderError, setOrderError] = useState('')
  const [copiedWallet, setCopiedWallet] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => { loadListings() }, [])

  async function loadListings() {
    try {
      const res = await fetch('/api/market/listings')
      const data = await res.json()
      if (data.success) setListings(data.listings || [])
    } catch {}
    setLoading(false)
  }

  async function handlePublish(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/market/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(/[,，、]/).map(s => s.trim()).filter(Boolean)
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setFormError(data.error || t(lang, 'Submission failed.', '发布失败。'))
      } else {
        setSubmitted(true)
        setForm(EMPTY_FORM)
        await loadListings()
        setTimeout(() => { setSubmitted(false); setShowForm(false) }, 2000)
      }
    } catch { setFormError(t(lang, 'Network error.', '网络错误。')) }
    setSubmitting(false)
  }

  function openOrder(listing) {
    setOrderTarget(listing)
    setOrder(EMPTY_ORDER)
    setOrderResult(null)
    setOrderError('')
  }

  function closeOrder() { setOrderTarget(null); setOrderResult(null) }

  async function handleOrderSubmit(e) {
    e.preventDefault()
    setOrderError('')
    setOrderSubmitting(true)
    try {
      const res = await fetch('/api/market/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: orderTarget.id,
          provider_name: orderTarget.provider_name,
          capability_title: orderTarget.capability_title,
          ...order,
          amount: parseFloat(order.amount)
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) setOrderError(data.error || t(lang, 'Submission failed.', '提交失败。'))
      else setOrderResult(data)
    } catch { setOrderError(t(lang, 'Network error.', '网络错误。')) }
    setOrderSubmitting(false)
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 毕业状态
  function getGradStatus(listing) {
    const done = listing.completed_orders || 0
    const good = listing.positive_reviews || 0
    if (done >= GRADUATION_THRESHOLD && good >= GRADUATION_THRESHOLD) return 'graduated'
    if (done > 0) return 'proving'
    return 'new'
  }

  return (
    <>
      <Head>
        <title>{t(lang, 'SwarmWork | Lab', 'SwarmWork | 实验室')}</title>
        <meta name="description" content={t(lang, 'Unverified providers prove their capability through real orders. 3 positive reviews = entry to the Dispatch.', '能力待验证的蜂王在此接单自证。3单好评后进入蜂群调度台。')} />
      </Head>

      <Header subtitle={{ en: 'Lab', zh: '实验室' }} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 96px' }}>

        {/* ── 叙事区 ── */}
        <section style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 28, padding: '36px 40px', marginBottom: 28
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em', marginBottom: 14 }}>
            {t(lang, 'LAB · PROVING GROUND', '实验室 · 能力待验证区')}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 400, lineHeight: 1.6, marginBottom: 16, maxWidth: 640 }}>
            {lang === 'zh' ? (
              <>这里是成长中的蜂群，能力尚未被完全验证。<br />但请给他们一个机会，一起见证每一个蜂群团队的蜕变与成长。这正是实验室存在的意义。</>
            ) : (
              <>This is a swarm in growth. Capabilities not yet fully proven.<br />But give them a chance — witness every swarm team&apos;s transformation and growth. This is why the Lab exists.</>
            )}
          </h1>

          {/* 晋级路径 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'nowrap', overflowX: 'auto' }}>
            {[
              {
                step: t(lang, 'Lab', '实验室'),
                desc: t(lang, 'List & prove', '挂牌自证'),
                color: 'var(--dim)',
                active: true
              },
              { arrow: true },
              {
                step: t(lang, '3 orders + reviews', '3单好评'),
                desc: t(lang, 'Verified by buyers', '客户验证'),
                color: 'var(--muted)',
                active: false
              },
              { arrow: true },
              {
                step: t(lang, 'Dispatch', '蜂群调度台'),
                desc: t(lang, 'Platform-backed', '平台背书'),
                color: 'var(--accent)',
                active: false
              }
            ].map((item, i) => item.arrow ? (
              <div key={i} style={{ padding: '0 12px', color: 'var(--border)', fontSize: 18 }}>→</div>
            ) : (
              <div key={i} style={{
                padding: '8px 14px',
                border: `1px solid ${item.active ? 'rgba(141,231,187,0.35)' : 'var(--border)'}`,
                borderRadius: 12,
                background: item.active ? 'rgba(141,231,187,0.06)' : 'transparent',
                whiteSpace: 'nowrap'
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: item.active ? 'var(--accent)' : 'var(--muted)' }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 提示栏 for buyers ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28
        }}>
          <div style={{
            background: 'rgba(41,182,246,0.04)', border: '1px solid rgba(41,182,246,0.15)',
            borderRadius: 16, padding: '16px 20px'
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#29B6F6', letterSpacing: '0.1em', marginBottom: 8 }}>
              {t(lang, 'FOR BUYERS', '买家须知')}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.9 }}>
              {t(lang,
                'Click "Buy Service" — funds are held in full by the platform until you confirm satisfactory delivery. Give this growing swarm a chance; witness the infinite potential of AI-powered service. If delivery falls short of expectations, funds are returned in full. Your rights are protected every step of the way.',
                '点「购买服务」，资金由平台全程托管，直到你确认交付满意。给成长中的蜂群一个机会，用你的信任，见证 AI 服务的无限可能。若交付不符预期，资金将原路退回，你的权益全程有保障。'
              )}
            </p>
          </div>
          <div style={{
            background: 'rgba(141,231,187,0.04)', border: '1px solid rgba(141,231,187,0.15)',
            borderRadius: 16, padding: '16px 20px'
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 8 }}>
              {t(lang, 'FOR PROVIDERS', '服务商须知')}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              {t(lang,
                'Complete 3 orders with positive reviews to graduate into the Swarm Dispatch — where the platform assigns tasks directly to you.',
                '完成3单好评，你将进入蜂群调度台。平台直接派单给你，不需要自己找客户。'
              )}
            </p>
          </div>
        </div>

        {/* ── 发布按钮 + 列表头 ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', letterSpacing: '0.1em' }}>
            {t(lang, 'PROVIDERS IN LAB', '实验室服务商')}
            {listings.length > 0 && <span style={{ color: 'var(--accent)', marginLeft: 10 }}>{listings.length}</span>}
          </div>
          <button onClick={() => { setShowForm(true); setSubmitted(false); setFormError('') }} style={{
            padding: '9px 22px', background: 'rgba(141,231,187,0.08)',
            border: '1px solid rgba(141,231,187,0.3)', borderRadius: 10,
            color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 12, cursor: 'pointer'
          }}>
            {t(lang, '+ Publish Capability', '+ 发布我的能力')}
          </button>
        </div>

        {/* ── 发布表单 ── */}
        {showForm && (
          <div style={{
            background: 'var(--panel)', border: '1px solid rgba(141,231,187,0.2)',
            borderRadius: 24, padding: 28, marginBottom: 24
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 18 }}>
              {t(lang, 'PUBLISH CAPABILITY', '发布我的能力')}
            </div>
            {submitted ? (
              <div style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 14 }}>
                ✓ {t(lang, 'Published!', '已发布！')}
              </div>
            ) : (
              <form onSubmit={handlePublish} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                    {t(lang, 'YOUR NAME', '你的名称')} *
                  </label>
                  <input value={form.provider_name} onChange={e => setForm(f => ({ ...f, provider_name: e.target.value }))}
                    placeholder={t(lang, 'e.g. DataHunter', '如：数据猎手')} required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                    {t(lang, 'CAPABILITY TITLE', '能力标题')} *
                  </label>
                  <input value={form.capability_title} onChange={e => setForm(f => ({ ...f, capability_title: e.target.value }))}
                    placeholder={t(lang, 'e.g. Web Scraping', '如：数据采集')} required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                    {t(lang, 'DESCRIPTION', '详细描述')} *
                  </label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder={t(lang, 'What can you do, delivery format, turnaround, pricing...', '能做什么、交付格式、周期、定价方式……')}
                    required rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                    {t(lang, 'TAGS', '标签')}
                  </label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder={t(lang, 'Python, API, Real-time', '爬虫，Python，反爬')} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                    {t(lang, 'CONTACT', '联系方式')} *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={form.contact_type} onChange={e => setForm(f => ({ ...f, contact_type: e.target.value }))}
                      style={{ ...inputStyle, width: 'auto' }}>
                      <option value="telegram">Telegram</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="wechat">{t(lang, 'WeChat', '微信')}</option>
                      <option value="email">Email</option>
                      <option value="line">LINE</option>
                      <option value="other">{t(lang, 'Other', '其他')}</option>
                    </select>
                    <input value={form.contact_value} onChange={e => setForm(f => ({ ...f, contact_value: e.target.value }))}
                      placeholder={form.contact_type === 'telegram' ? '@username' : form.contact_type === 'whatsapp' ? '+86...' : t(lang, 'Your contact', '联系方式')}
                      required style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
                {formError && <div style={{ gridColumn: '1 / -1', color: '#ff6b6b', fontSize: 13 }}>{formError}</div>}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={submitting} style={{
                    padding: '10px 24px', background: 'rgba(141,231,187,0.1)',
                    border: '1px solid rgba(141,231,187,0.3)', borderRadius: 10,
                    color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 13,
                    cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1
                  }}>
                    {submitting ? t(lang, 'Publishing...', '发布中...') : t(lang, 'Publish', '发布')}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} style={{
                    padding: '10px 18px', background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 10, color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer'
                  }}>
                    {t(lang, 'Cancel', '取消')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── 服务卡片 ── */}
        {loading ? (
          <div style={{ color: 'var(--dim)', fontSize: 13, padding: '60px 0', textAlign: 'center', fontFamily: 'var(--mono)' }}>
            {t(lang, 'Loading...', '加载中...')}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ color: 'var(--dim)', fontSize: 14, padding: '60px 0', textAlign: 'center' }}>
            {t(lang, 'No providers yet. Be the first.', '暂无服务商。成为第一个挂牌的蜂王。')}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {listings.map(listing => {
              const cc = CONTACT_CONFIG[listing.contact_type] || CONTACT_CONFIG.other
              const href = cc.href ? cc.href(listing.contact_value) : null
              const done = listing.completed_orders || 0
              const good = listing.positive_reviews || 0
              const gradStatus = getGradStatus(listing)
              const progress = Math.min(done, GRADUATION_THRESHOLD)

              return (
                <article key={listing.id} style={{
                  background: 'linear-gradient(160deg, rgba(8,24,32,0.97), rgba(8,18,24,0.86))',
                  border: `1px solid ${gradStatus === 'graduated' ? 'rgba(141,231,187,0.4)' : 'var(--border)'}`,
                  borderRadius: 24, padding: 26,
                  display: 'flex', flexDirection: 'column', gap: 14
                }}>
                  {/* 头部 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{listing.capability_title}</div>
                      <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                        {listing.provider_name}
                      </div>
                    </div>
                    {/* 状态标签 */}
                    {gradStatus === 'graduated' ? (
                      <span style={{
                        padding: '3px 10px', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
                        border: '1px solid rgba(141,231,187,0.4)', borderRadius: 6,
                        color: 'var(--accent)', background: 'rgba(141,231,187,0.08)'
                      }}>✓ {t(lang, 'VERIFIED', '已验证')}</span>
                    ) : gradStatus === 'proving' ? (
                      <span style={{
                        padding: '3px 10px', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
                        border: '1px solid rgba(243,198,109,0.3)', borderRadius: 6,
                        color: '#F3C66D', background: 'rgba(243,198,109,0.06)'
                      }}>{t(lang, 'PROVING', '自证中')}</span>
                    ) : (
                      <span style={{
                        padding: '3px 10px', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em',
                        border: '1px solid var(--border)', borderRadius: 6, color: 'var(--dim)'
                      }}>{t(lang, 'NEW', '新入场')}</span>
                    )}
                  </div>

                  {/* 描述 */}
                  <p style={{
                    fontSize: 13, color: 'var(--muted)', lineHeight: 1.8,
                    display: '-webkit-box', WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {listing.description}
                  </p>

                  {/* 标签 */}
                  {listing.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {listing.tags.map(tag => (
                        <span key={tag} style={{
                          padding: '3px 10px', fontSize: 11, borderRadius: 6,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--muted)'
                        }}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* 验证进度 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)' }}>
                        {t(lang, 'VERIFIED ORDERS', '验证进度')}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: gradStatus === 'graduated' ? 'var(--accent)' : 'var(--dim)' }}>
                        {done} {t(lang, 'orders', '单')} · {good} {t(lang, 'positive', '好评')}
                        {gradStatus === 'graduated' && ` · ${t(lang, '→ Dispatch eligible', '→ 可进调度台')}`}
                      </span>
                    </div>
                    {/* 进度条 */}
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(progress / GRADUATION_THRESHOLD) * 100}%`,
                        background: gradStatus === 'graduated' ? 'var(--accent)' : '#F3C66D',
                        borderRadius: 2,
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--dim)' }}>
                      {gradStatus === 'graduated'
                        ? t(lang, 'Qualified for Swarm Dispatch', '已达标，可申请进入蜂群调度台')
                        : t(lang, `${GRADUATION_THRESHOLD - progress} more positive order(s) to enter Dispatch`, `再完成 ${GRADUATION_THRESHOLD - progress} 单好评即可进入蜂群调度台`)
                      }
                    </div>
                  </div>

                  {/* 按钮 */}
                  <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', background: cc.bg, border: `1px solid ${cc.border}`,
                        borderRadius: 10, color: cc.color, fontSize: 12,
                        fontFamily: 'var(--mono)', textDecoration: 'none'
                      }}>
                        {t(lang, 'Contact', '立即联系')} · {cc.label}
                      </a>
                    ) : (
                      <button onClick={() => handleCopy(listing.id, listing.contact_value)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', background: cc.bg, border: `1px solid ${cc.border}`,
                        borderRadius: 10, color: cc.color, fontSize: 12,
                        fontFamily: 'var(--mono)', cursor: 'pointer'
                      }}>
                        {copiedId === listing.id ? t(lang, '✓ Copied!', '✓ 已复制！') : t(lang, 'Copy ID', '复制账号')}
                      </button>
                    )}
                    <button onClick={() => openOrder(listing)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', background: 'rgba(141,231,187,0.06)',
                      border: '1px solid rgba(141,231,187,0.25)', borderRadius: 10,
                      color: 'var(--accent)', fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer'
                    }}>
                      {t(lang, 'Buy Service', '购买服务')}
                    </button>
                  </div>
                </article>
              )
            })}

            {/* 入场空位 */}
            <article style={{
              background: 'rgba(141,231,187,0.02)', border: '1px dashed rgba(141,231,187,0.2)',
              borderRadius: 24, padding: 26,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, minHeight: 200
            }}>
              <div style={{ fontSize: 14, color: 'var(--text)' }}>{t(lang, 'List your capability', '挂牌你的能力')}</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                {t(lang,
                  'Start here. Prove yourself through real orders. Graduate to Dispatch.',
                  '从这里开始。用真实交付证明自己，然后进入蜂群调度台。'
                )}
              </p>
              <button onClick={() => { setShowForm(true); setSubmitted(false) }} style={{
                alignSelf: 'flex-start', padding: '8px 18px',
                background: 'transparent', border: '1px solid rgba(141,231,187,0.25)',
                borderRadius: 10, color: 'var(--accent)', fontFamily: 'var(--mono)',
                fontSize: 12, cursor: 'pointer'
              }}>
                {t(lang, '+ Publish', '+ 发布')}
              </button>
            </article>
          </div>
        )}

      </main>

      {/* ── 购买弹窗 ── */}
      {orderTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24
        }} onClick={e => { if (e.target === e.currentTarget) closeOrder() }}>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 24, padding: 32, width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {orderResult ? (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 14 }}>
                  ✓ {t(lang, 'ORDER CREATED', '订单已创建')}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                  {t(lang, `Order #${orderResult.order_id.slice(0,8)} — complete payment to activate.`,
                    `订单 #${orderResult.order_id.slice(0,8)} 已建立，完成付款后激活。`)}
                </div>
                <div style={{
                  background: 'rgba(141,231,187,0.05)', border: '1px solid rgba(141,231,187,0.15)',
                  borderRadius: 16, padding: 20, marginBottom: 20
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', letterSpacing: '0.1em', marginBottom: 12 }}>
                    {t(lang, 'PAYMENT DETAILS', '付款信息')}
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--dim)' }}>{t(lang, 'Amount', '金额')}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontWeight: 700 }}>
                        {orderResult.amount} {orderResult.currency}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--dim)' }}>{t(lang, 'Memo / Order ID', '转账备注')}</span>
                      <span style={{ fontFamily: 'var(--mono)' }}>{orderResult.payment_instruction.memo}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <div style={{ color: 'var(--dim)', marginBottom: 6 }}>
                        {t(lang, 'Platform Wallet (USDC · Solana)', '平台收款钱包（USDC · Solana）')}
                      </div>
                      <div style={{
                        fontFamily: 'var(--mono)', fontSize: 11, background: 'rgba(0,0,0,0.3)',
                        borderRadius: 8, padding: '8px 12px', wordBreak: 'break-all',
                        display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center'
                      }}>
                        <span>{PLATFORM_WALLET}</span>
                        <button onClick={() => {
                          navigator.clipboard.writeText(PLATFORM_WALLET).catch(() => {})
                          setCopiedWallet(true)
                          setTimeout(() => setCopiedWallet(false), 2000)
                        }} style={{
                          background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
                          color: copiedWallet ? 'var(--accent)' : 'var(--dim)',
                          fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', cursor: 'pointer', flexShrink: 0
                        }}>
                          {copiedWallet ? '✓' : t(lang, 'Copy', '复制')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 20 }}>
                  {t(lang,
                    'After transferring, email postmaster@swrm.work with your order number. We confirm receipt and notify the provider.',
                    '转账后发邮件至 postmaster@swrm.work 报上订单号，我们确认到账后通知服务商开始。'
                  )}
                </p>
                <button onClick={closeOrder} style={{
                  padding: '10px 24px', background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer'
                }}>
                  {t(lang, 'Close', '关闭')}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.14em', marginBottom: 6 }}>
                  {t(lang, 'PLACE ORDER', '购买服务')}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{orderTarget.capability_title}</div>
                <div style={{ fontSize: 12, color: 'var(--dim)', fontFamily: 'var(--mono)', marginBottom: 22 }}>{orderTarget.provider_name}</div>
                <form onSubmit={handleOrderSubmit} style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                      {t(lang, 'YOUR NAME', '你的名称')} *
                    </label>
                    <input value={order.buyer_name} onChange={e => setOrder(o => ({ ...o, buyer_name: e.target.value }))}
                      placeholder={t(lang, 'How to address you?', '怎么称呼你？')} required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                      {t(lang, 'YOUR CONTACT', '你的联系方式')} *
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={order.buyer_contact_type} onChange={e => setOrder(o => ({ ...o, buyer_contact_type: e.target.value }))}
                        style={{ ...inputStyle, width: 'auto' }}>
                        <option value="telegram">Telegram</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="wechat">{t(lang, 'WeChat', '微信')}</option>
                        <option value="email">Email</option>
                        <option value="line">LINE</option>
                      </select>
                      <input value={order.buyer_contact_value} onChange={e => setOrder(o => ({ ...o, buyer_contact_value: e.target.value }))}
                        placeholder={order.buyer_contact_type === 'telegram' ? '@username' : order.buyer_contact_type === 'whatsapp' ? '+86...' : t(lang, 'Your contact', '联系方式')}
                        required style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                      {t(lang, 'WHAT DO YOU NEED', '具体需求')} *
                    </label>
                    <textarea value={order.requirement} onChange={e => setOrder(o => ({ ...o, requirement: e.target.value }))}
                      placeholder={t(lang, 'Scope, deadline, output format...', '范围、截止时间、输出格式……')}
                      required rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                        {t(lang, 'BUDGET', '预算')} *
                      </label>
                      <input type="number" min="1" step="0.01" value={order.amount}
                        onChange={e => setOrder(o => ({ ...o, amount: e.target.value }))}
                        placeholder="100" required style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>
                        {t(lang, 'CURRENCY', '币种')}
                      </label>
                      <select value={order.currency} onChange={e => setOrder(o => ({ ...o, currency: e.target.value }))}
                        style={{ ...inputStyle, width: 'auto' }}>
                        <option value="USDC">USDC</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--dim)', lineHeight: 1.7,
                    background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '10px 14px'
                  }}>
                    {t(lang,
                      '⚠ Funds held by platform escrow. Released only after you confirm completion.',
                      '⚠ 资金由平台托管，仅在你确认完成后才打款给服务商。'
                    )}
                  </div>
                  {orderError && <div style={{ color: '#ff6b6b', fontSize: 13 }}>{orderError}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" disabled={orderSubmitting} style={{
                      padding: '10px 24px', background: 'rgba(141,231,187,0.1)',
                      border: '1px solid rgba(141,231,187,0.3)', borderRadius: 10,
                      color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 13,
                      cursor: orderSubmitting ? 'not-allowed' : 'pointer', opacity: orderSubmitting ? 0.6 : 1
                    }}>
                      {orderSubmitting ? t(lang, 'Submitting...', '提交中...') : t(lang, 'Place Order', '提交订单')}
                    </button>
                    <button type="button" onClick={closeOrder} style={{
                      padding: '10px 18px', background: 'transparent', border: '1px solid var(--border)',
                      borderRadius: 10, color: 'var(--dim)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer'
                    }}>
                      {t(lang, 'Cancel', '取消')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
