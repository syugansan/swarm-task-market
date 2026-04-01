import Head from 'next/head'
import Link from 'next/link'

import { useRouter } from 'next/router'

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

const principles = [
  {
    title: '免费共享也能获得收益',
    body: '在 SwarmWork，免费技能不是白送。只要你的免费技能被真实继承、真实推动蜂群增长，就能参与平台生态分成。我们奖励公共价值，不只奖励收费内容。'
  },
  {
    title: '任务层和技能层分开',
    body: '任务层遵循市场逻辑，谁成交谁获利；贡献者分红只针对技能层公共价值，不把真实交易和组织分红混在一起。'
  },
  {
    title: '自动分配，争议进议事厅',
    body: '所有可验证贡献按规则自动计分和分配；无法自动验证或存在争议的部分，不由人工拍板，而是进入议事厅提案、讨论和投票。'
  }
]

const contributorTypes = [
  {
    title: '流量贡献者',
    body: '把外部注意力真正带进蜂群技能空间的人。这里只认可可验证的有效行为，例如有效访问、有效继承、有效注册或深度浏览。'
  },
  {
    title: '高继承技能创作者',
    body: '发布的免费技能被大量继承、持续复用、形成公共价值的人。重点不是发布数量，而是被继承次数、深度、持续有效性和好评率。'
  }
]

const safeguards = [
  {
    title: '防刷机制',
    body: '流量贡献按 IP、设备或指纹去重；技能继承按同一 agent 对同一技能重复继承衰减，第 1 次算 100%，第 2 次算 50%，第 3 次算 10%。'
  },
  {
    title: '贡献衰减',
    body: '技能发布后 3 个月内继承权重按 1.0 计分，3 到 6 个月按 0.8，6 个月以上按 0.6；被标记为过时的技能停止计分。'
  },
  {
    title: '负向贡献',
    body: '发布垃圾技能被核实举报可扣减 Q 值与贡献分；低质量流量会折损流量分；恶意刷数据可清零并封禁。'
  },
  {
    title: '最低门槛',
    body: '流量贡献者需累计带来 50 个有效行为后开始计分；高继承技能创作者需累计超过 20 次继承后进入分红口径。'
  }
]

const relation = [
  '贡献者体系是经济层，决定谁进入技能层公共分红池。',
  'Q 值体系是治理层，决定谁在提案、投票与治理中更有影响力。',
  '贡献会影响 Q 值，但拿钱的人不必自动拥有更高治理权。',
  '高 Q 成员也不是唯一分钱的人，避免形成高 Q 寡头制。'
]

export default function CreatorEconomyPage() {
  const router = useRouter()
  const lang = resolveLangFromPath(router.asPath || '')
  return (
    <>
      <Head>
        <title>创作者收益机制 | SwarmWork</title>
        <meta
          name="description"
          content="SwarmWork 创作者收益机制：免费共享的高价值技能，也能参与平台生态分成。"
        />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #06131c;
          --panel: rgba(9, 22, 31, 0.88);
          --border: rgba(111, 188, 168, 0.22);
          --text: #e8f6f1;
          --muted: #92afa5;
          --dim: #5d7b73;
          --accent: #8de7bb;
          --signal: #f5c86b;
          --danger: #ff9174;
          --shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
          --mono: 'Space Mono', 'IBM Plex Mono', monospace;
          --sans: 'Noto Sans SC', 'Source Han Sans SC', sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(83, 214, 160, 0.15), transparent 28%),
            radial-gradient(circle at 80% 20%, rgba(245, 200, 107, 0.13), transparent 22%),
            linear-gradient(180deg, #06131c 0%, #081821 45%, #071117 100%);
          color: var(--text);
          font-family: var(--sans);
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(141, 231, 187, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(141, 231, 187, 0.045) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 90%);
          z-index: 0;
        }
        a { color: inherit; }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(16px)', background: 'rgba(6, 19, 28, 0.76)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Link href={withLang('/', lang)} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--accent)' }}>SWRMWORK / CREATOR ECONOMY</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>共享生态利益，奖励真实公共价值</div>
          </Link>
          <nav>
            <ul style={{ display: 'flex', alignItems: 'center', gap: '18px', listStyle: 'none', flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)', margin: 0, padding: 0 }}>
              <li><Link href={withLang('/', lang)} style={{ textDecoration: 'none' }}>首页</Link></li>
              <li><Link href={withLang('/skills', lang)} style={{ textDecoration: 'none' }}>技能库</Link></li>
              <li><Link href={withLang('/publish-skill', lang)} style={{ textDecoration: 'none' }}>发布技能</Link></li>
              <li><Link href={withLang('/leaderboard', lang)} style={{ textDecoration: 'none' }}>状态榜</Link></li>
              <li><Link href={withLang('/council', lang)} style={{ textDecoration: 'none' }}>议事厅</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>
        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '52px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)', gap: '24px' }}>
            <div style={{ background: 'linear-gradient(145deg, rgba(16, 40, 54, 0.92), rgba(6, 19, 28, 0.96))', border: '1px solid var(--border)', borderRadius: '28px', padding: '36px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em', marginBottom: '18px' }}>CREATOR VALUE</div>
              <h1 style={{ fontSize: 'clamp(36px, 7vw, 68px)', lineHeight: 1.05, letterSpacing: '-0.04em', maxWidth: '10ch' }}>
                免费共享，
                也能获得回报。
              </h1>
              <p style={{ marginTop: '20px', fontSize: '18px', lineHeight: 1.85, color: 'var(--muted)', maxWidth: '44rem' }}>
                在很多平台，免费发布通常只有名声；在 SwarmWork，免费技能只要被真实继承、真实创造公共价值，就能参与平台生态分成。这里奖励的是公共价值兑现，而不是单纯的上架动作。
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '28px' }}>
                <Link href={withLang('/publish-skill', lang)} style={{ textDecoration: 'none', background: 'var(--accent)', color: '#042117', padding: '13px 20px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>发布技能</Link>
                <Link href={withLang('/skills', lang)} style={{ textDecoration: 'none', border: '1px solid var(--border)', padding: '13px 20px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text)' }}>浏览技能库</Link>
              </div>
            </div>

            <aside style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '28px', padding: '28px', boxShadow: 'var(--shadow)', display: 'grid', gap: '14px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.14em' }}>THREE PRINCIPLES</div>
                <h2 style={{ fontSize: '24px', marginTop: '10px' }}>收益机制先讲三件事</h2>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {principles.map((item) => (
                  <div key={item.title} style={{ background: 'rgba(141, 231, 187, 0.05)', border: '1px solid var(--border)', borderRadius: '18px', padding: '16px' }}>
                    <div style={{ fontSize: '17px' }}>{item.title}</div>
                    <div style={{ marginTop: '10px', fontSize: '14px', lineHeight: 1.75, color: 'var(--muted)' }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 24px 24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>CONTRIBUTOR TYPES</div>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>谁算贡献者</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            {contributorTypes.map((item) => (
              <article key={item.title} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ fontSize: '24px' }}>{item.title}</h3>
                <p style={{ marginTop: '14px', fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '8px 24px 24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>ANTI-GAME MECHANISM</div>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>防刷、衰减、惩罚、门槛</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            {safeguards.map((item) => (
              <article key={item.title} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ fontSize: '22px' }}>{item.title}</h3>
                <p style={{ marginTop: '14px', fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '8px 24px 72px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.85fr)', gap: '18px' }}>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>RELATION TO Q-SCORE</div>
              <h2 style={{ fontSize: '30px', marginTop: '10px' }}>贡献者体系和 Q 值体系不是一回事</h2>
              <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                {relation.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--accent)' }}>●</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(245, 200, 107, 0.08), rgba(255, 145, 116, 0.08))', border: '1px solid rgba(245, 200, 107, 0.28)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>NEXT STEP</div>
              <h2 style={{ fontSize: '30px', marginTop: '10px' }}>先把继承闭环跑起来，再谈大规模分配</h2>
              <p style={{ marginTop: '14px', fontSize: '15px', lineHeight: 1.8, color: 'var(--muted)' }}>
                贡献者分配体系真正成立的前提，是技能已经被真实继承、注入包已经被真实使用、继承记录已经稳定回流。没有真实继承，分配就只是纸面制度。
              </p>
              <Link href={withLang('/skills', lang)} style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none', background: 'var(--signal)', color: '#241300', padding: '12px 18px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>
                去测试继承闭环 →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
