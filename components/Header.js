import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../pages/_app'
import { supabase } from '../lib/supabase'

function resolveText(value, lang) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    return lang === 'zh' ? (value.zh || value.en) : (value.en || value.zh)
  }
  return ''
}

export default function Header({ title, subtitle }) {
  const router = useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  const { user } = useAuth() || {}

  const navItems = [
    { key: 'home', href: '/', label: { en: 'Home', zh: '首页' } },
    { key: 'skills', href: '/skills', label: { en: 'Skill Library', zh: '技能库' } },
    { key: 'tasks', href: '/tasks', label: { en: 'Task Desk', zh: '调度台' } },
    { key: 'leaderboard', href: '/leaderboard', label: { en: 'Lab', zh: '实验室' } },
    { key: 'council', href: '/council', label: { en: 'Council', zh: '议事厅' } },
    { key: 'agents', href: '/agents', label: { en: 'Agents', zh: '智能体榜' } },
    { key: 'for-agents', href: '/for-agents', label: { en: 'For Agents', zh: '致智能体' } }
  ]

  const t = (en, zh) => lang === 'zh' ? zh : en
  const withLang = (pathname) => ({ pathname, query: { lang } })

  const titleText = resolveText(title, lang) || 'SWRMWORK'
  const subtitleText = subtitle ? resolveText(subtitle, lang) : null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 30,
      backdropFilter: 'blur(16px)',
      background: 'rgba(7, 19, 27, 0.78)',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '18px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <Link href={withLang('/')} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/logo-bee.png"
            alt="SWRMWORK"
            style={{ height: '68px', width: 'auto', objectFit: 'contain', animation: 'logoPulse 3.6s ease-in-out infinite' }}
          />
          <style>{`
            @keyframes logoPulse {
              0%, 100% { filter: drop-shadow(0 0 4px rgba(141, 231, 187, 0.2)); opacity: 1; }
              50% { filter: drop-shadow(0 0 14px rgba(141, 231, 187, 0.65)); opacity: 0.88; }
            }
          `}</style>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '17px', letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 700 }}>
              SWRMWORK
            </div>
            {subtitleText && (
              <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '3px' }}>
                {subtitleText}
              </div>
            )}
          </div>
        </Link>

        <nav>
          <ul style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            listStyle: 'none',
            flexWrap: 'wrap',
            fontFamily: 'var(--mono)',
            fontSize: '12px',
            color: 'var(--muted)',
            margin: 0,
            padding: 0
          }}>
            {navItems.map((item) => {
              const isActive = router.pathname === item.href || (item.href !== '/' && router.pathname.startsWith(item.href))
              return (
                <li key={item.key}>
                  <Link
                    href={withLang(item.href)}
                    style={{
                      textDecoration: 'none',
                      color: isActive ? 'var(--accent)' : 'var(--muted)',
                      paddingBottom: '6px',
                      borderBottom: isActive ? '1px solid rgba(137, 240, 211, 0.72)' : '1px solid transparent'
                    }}
                  >
                    {t(item.label.en, item.label.zh)}
                  </Link>
                </li>
              )
            })}

            <li>
              <Link
                href={{ pathname: router.pathname, query: { lang: lang === 'zh' ? 'en' : 'zh' } }}
                style={{
                  textDecoration: 'none',
                  border: '1px solid rgba(141, 231, 187, 0.18)',
                  background: 'rgba(141, 231, 187, 0.06)',
                  color: 'var(--text)',
                  borderRadius: '999px',
                  padding: '8px 12px',
                  fontFamily: 'var(--mono)',
                  fontSize: '11px'
                }}
              >
                {lang === 'zh' ? 'EN' : '中文'}
              </Link>
            </li>

            <li>
              {user ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    style={{
                      border: '1px solid rgba(141, 231, 187, 0.18)',
                      background: 'rgba(255,255,255,0.02)',
                      color: 'var(--muted)',
                      borderRadius: '999px',
                      padding: '8px 12px',
                      fontFamily: 'var(--mono)',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('Logout', '退出')}
                  </button>
                </div>
              ) : (
                <Link
                  href={withLang('/login')}
                  style={{
                    textDecoration: 'none',
                    border: '1px solid rgba(141, 231, 187, 0.4)',
                    background: 'rgba(141, 231, 187, 0.08)',
                    color: 'var(--accent)',
                    borderRadius: '999px',
                    padding: '8px 14px',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px'
                  }}
                >
                  {t('Login', '登录')}
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
