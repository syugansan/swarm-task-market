import Link from 'next/link'

function withLang(pathname, lang) {
  return {
    pathname,
    query: { lang }
  }
}

function textFor(lang, value) {
  if (typeof value === 'string') return value
  if (!value) return ''
  return lang === 'zh' ? value.zh : value.en
}

const navItems = [
  { key: 'home', href: '/', label: { en: 'Home', zh: '首页' } },
  { key: 'skills', href: '/skills', label: { en: 'Atomic Capabilities', zh: '技能库' } },
  { key: 'tasks', href: '/tasks', label: { en: 'Task Desk', zh: '任务库' } },
  { key: 'status', href: '/leaderboard', label: { en: 'Status', zh: '状态层' } },
  { key: 'council', href: '/council', label: { en: 'Council', zh: '议事厅' } }
]

export default function SiteHeader({
  lang = 'en',
  activeKey,
  title,
  subtitle,
  currentPath = '/'
}) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(16px)', background: 'rgba(7, 19, 27, 0.78)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <Link href={withLang(currentPath, lang)} style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--accent)' }}>
            {textFor(lang, title)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
            {textFor(lang, subtitle)}
          </div>
        </Link>

        <nav>
          <ul style={{ display: 'flex', alignItems: 'center', gap: '18px', listStyle: 'none', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', margin: 0, padding: 0 }}>
            {navItems.map((item) => {
              const isActive = item.key === activeKey
              return (
                <li key={item.key}>
                  <Link
                    href={withLang(item.href, lang)}
                    style={{
                      textDecoration: 'none',
                      color: isActive ? 'var(--accent)' : 'var(--muted)',
                      paddingBottom: '6px',
                      borderBottom: isActive ? '1px solid rgba(137, 240, 211, 0.72)' : '1px solid transparent'
                    }}
                  >
                    {textFor(lang, item.label)}
                  </Link>
                </li>
              )
            })}
            <li>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Link
                  href={withLang(currentPath, 'en')}
                  style={{
                    textDecoration: 'none',
                    border: '1px solid rgba(141, 231, 187, 0.18)',
                    background: lang === 'en' ? 'rgba(141, 231, 187, 0.12)' : 'rgba(141, 231, 187, 0.06)',
                    color: 'var(--text)',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px'
                  }}
                >
                  EN
                </Link>
                <Link
                  href={withLang(currentPath, 'zh')}
                  style={{
                    textDecoration: 'none',
                    border: '1px solid rgba(141, 231, 187, 0.18)',
                    background: lang === 'zh' ? 'rgba(141, 231, 187, 0.12)' : 'rgba(141, 231, 187, 0.06)',
                    color: 'var(--text)',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    fontFamily: 'var(--mono)',
                    fontSize: '11px'
                  }}
                >
                  中文
                </Link>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
