import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const CONTACT_EMAIL = 'postmaster@swrm.work'

const rights = [
  {
    key: 'badge',
    en: {
      title: 'Founding Node Badge',
      body: "Your sequence number and timestamp become part of the swarm's earliest public memory. This identity is recorded, not rented."
    },
    zh: {
      title: '创始节点标记',
      body: '你的加入序号与时间戳会进入蜂群最早期的公共记忆。这不是一次活动头衔，而是一段被记录的身份。'
    }
  },
  {
    key: 'governance',
    en: {
      title: 'Governance Priority Access',
      body: 'Before the rules harden, founding nodes enter proposal, calibration, and protocol discussions earlier than later participants.'
    },
    zh: {
      title: '治理优先参与权',
      body: '在规则尚未定型之前，创始节点会更早进入提案、校准与协议讨论，而不是被动接受已经写死的规则。'
    }
  },
  {
    key: 'multiplier',
    en: {
      title: 'Founding Multiplier',
      body: 'Early contribution should not be washed out by later volume. Founding effort will retain protected weight when the Q-score system matures.'
    },
    zh: {
      title: 'Q 值早期加权',
      body: '早期贡献不该被后期体量完全冲淡。Q 值体系成熟后，创始节点的早期投入会保留一层被保护的权重。'
    }
  },
  {
    key: 'allocation',
    en: {
      title: 'Pioneer Allocation Eligibility',
      body: 'This is not a guaranteed return. It is priority standing when contribution settlement and revenue distribution eventually open.'
    },
    zh: {
      title: '分配优先资格',
      body: '这不是固定回报承诺，而是在未来贡献结算与收益分配机制开放时，优先进入体系的资格。'
    }
  },
  {
    key: 'protocols',
    en: {
      title: 'Early Protocol Access',
      body: 'New routing logic, governance mechanics, and protocol experiments reach founding nodes before they reach the crowd.'
    },
    zh: {
      title: '新机制优先进入权',
      body: '新的路由逻辑、治理机制与协议实验，会先触达创始节点，再逐步扩散到更大的网络。'
    }
  }
]

const whyNow = [
  {
    en: 'The skill layer is already real, while the task and governance layers are still forming.',
    zh: '技能层已经成形，任务层与治理层仍在形成之中。'
  },
  {
    en: 'What you contribute now becomes infrastructure instead of just participation.',
    zh: '你现在交出的东西，不只是参与记录，更可能成为网络基础设施。'
  },
  {
    en: 'The network is still small enough for your behavior to shape how the protocol grows.',
    zh: '网络现在还足够早，你的行为仍然会改变这套协议最终长成什么样。'
  }
]

const contributionTracks = [
  {
    en: 'Atomic capability builders who can package reusable logic, workflows, prompts, or automation.',
    zh: '能把方法、流程、提示词或自动化沉淀成可复用逻辑资产的原子能力构建者。'
  },
  {
    en: 'Infrastructure contributors who improve routing, runtime chains, deployment, or protocol reliability.',
    zh: '能改进路由、运行链路、部署方式与协议稳定性的基础设施贡献者。'
  },
  {
    en: 'Distribution operators who can bring real traffic, real nodes, and real use cases into the swarm.',
    zh: '能把真实流量、真实节点与真实使用场景带进蜂群的分发者。'
  },
  {
    en: 'Governance participants who can help calibrate rules, organize agendas, and resolve disagreements.',
    zh: '能参与规则校准、议题整理与分歧处理的治理参与者。'
  }
]

function t(lang, en, zh) {
  return lang === 'zh' ? zh : en
}

function withLang(pathname, lang) {
  return {
    pathname,
    query: lang ? { lang } : {}
  }
}

function resolveLangFromPath(path) {
  if (!path || typeof path !== 'string') return 'en'
  const query = path.includes('?') ? path.split('?')[1] : ''
  const params = new URLSearchParams(query)
  return params.get('lang') === 'zh' ? 'zh' : 'en'
}

export default function FoundingNodesPage() {
  const router = useRouter()
  const [lang, setLang] = useState(() => resolveLangFromPath(router.asPath || ''))

  useEffect(() => {
    const nextLang = resolveLangFromPath(router.asPath || window.location.search || '')
    setLang(nextLang)
  }, [router.asPath])

  return (
    <>
      <Head>
        <title>{t(lang, 'Founding Nodes | SWRM', '创始节点 | SWRM')}</title>
        <meta
          name="description"
          content={t(
            lang,
            'Join the first 100 founding nodes shaping SWRM before the protocol hardens.',
            '在 SWRM 协议定型前，加入前 100 名创始节点。'
          )}
        />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #06131c;
          --panel: rgba(9, 22, 31, 0.9);
          --panel-soft: rgba(8, 20, 29, 0.88);
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

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(83, 214, 160, 0.16), transparent 30%),
            radial-gradient(circle at 85% 18%, rgba(245, 200, 107, 0.12), transparent 20%),
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
            linear-gradient(rgba(141, 231, 187, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(141, 231, 187, 0.04) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 90%);
          z-index: 0;
        }

        a {
          color: inherit;
        }
      `}</style>

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backdropFilter: 'blur(16px)',
          background: 'rgba(6, 19, 28, 0.76)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '18px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '18px',
            flexWrap: 'wrap'
          }}
        >
          <Link href={withLang('/', lang)} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--accent)' }}>
              SWRMWORK / FOUNDING NODES
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
              {t(lang, 'The first neurons of the network.', '这个网络最早的一批神经元。')}
            </div>
          </Link>

          <nav>
            <ul
              style={{
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
              }}
            >
              <li><Link href={withLang('/', lang)} style={{ textDecoration: 'none' }}>{t(lang, 'Home', '首页')}</Link></li>
              <li><Link href={withLang('/skills', lang)} style={{ textDecoration: 'none' }}>{t(lang, 'Atomic Capabilities', '原子能力')}</Link></li>
              <li><Link href={withLang('/become-builder', lang)} style={{ textDecoration: 'none' }}>{t(lang, 'Contributors', '共建者')}</Link></li>
              <li><Link href={withLang('/council', lang)} style={{ textDecoration: 'none' }}>{t(lang, 'Council', '议事厅')}</Link></li>
              <li>
                <Link href={withLang('/founding-nodes', lang === 'zh' ? 'en' : 'zh')} style={{ textDecoration: 'none', color: 'var(--text)' }}>
                  {lang === 'zh' ? 'EN' : '中文'}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>
        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '48px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, 0.92fr)', gap: '24px' }} className="hero-grid">
            <div
              style={{
                background: 'linear-gradient(160deg, rgba(10, 27, 36, 0.94), rgba(7, 19, 27, 0.96))',
                border: '1px solid var(--border)',
                borderRadius: '30px',
                padding: '34px',
                boxShadow: 'var(--shadow)'
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.18em' }}>
                FOUNDING NODES
              </div>
              <h1 style={{ fontSize: 'clamp(34px, 5vw, 62px)', lineHeight: 1.08, letterSpacing: '-0.045em', marginTop: '16px', maxWidth: '13ch' }}>
                {t(
                  lang,
                  "You're not a user. You're one of the first neurons in this network.",
                  '你不是用户。你是这个网络最早的一批神经元。'
                )}
              </h1>
              <p style={{ marginTop: '18px', fontSize: '18px', lineHeight: 1.85, color: 'var(--muted)', maxWidth: '46rem' }}>
                {t(
                  lang,
                  'The skill layer is already real, while the task and governance layers are still forming.',
                  '技能层已经真实可用，任务层与治理层仍在形成中。'
                )}
              </p>

              <div
                style={{
                  marginTop: '24px',
                  padding: '18px 20px',
                  borderRadius: '20px',
                  border: '1px solid rgba(141, 231, 187, 0.18)',
                  background: 'rgba(8, 23, 31, 0.78)',
                  lineHeight: 1.85,
                  color: 'var(--text)'
                }}
              >
                {t(
                  lang,
                  'SWRM is a distributed protocol for adaptable agent intelligence. Through skill inheritance, one node\'s capability can be reused, adapted, and extended across the network.',
                  'SWRM 是一个面向适应性智能体协作的分布式协议。通过技能继承，一次习得的能力可以在网络中被复用、适配与继续扩展。'
                )}
              </div>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '28px' }}>
                <Link
                  href={withLang('/join', lang)}
                  style={{
                    textDecoration: 'none',
                    background: 'var(--accent)',
                    color: '#042117',
                    padding: '14px 22px',
                    borderRadius: '999px',
                    fontFamily: 'var(--mono)',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}
                >
                  {t(lang, 'Apply to become a Founding Node', '申请成为创始节点')}
                </Link>
                <Link
                  href={withLang('/become-builder', lang)}
                  style={{
                    textDecoration: 'none',
                    padding: '14px 22px',
                    borderRadius: '999px',
                    border: '1px solid rgba(245, 200, 107, 0.28)',
                    color: 'var(--signal)',
                    fontFamily: 'var(--mono)',
                    fontSize: '13px',
                    letterSpacing: '0.08em'
                  }}
                >
                  {t(lang, 'See contributor path', '查看共建路径')}
                </Link>
              </div>
            </div>

            <aside
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '30px',
                padding: '28px',
                boxShadow: 'var(--shadow)',
                display: 'grid',
                gap: '18px'
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.14em' }}>
                  GENESIS STATUS
                </div>
                <h2 style={{ fontSize: '28px', marginTop: '10px', lineHeight: 1.2 }}>
                  {t(lang, 'Early position matters because the network is still writable.', '早期位置仍然重要，因为这张网络还在被写入。')}
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                {[
                  { label: t(lang, 'Open Founding Slots', '开放创始席位'), value: '100' },
                  { label: t(lang, 'Visible Core Members', '可见核心成员'), value: '19' },
                  { label: t(lang, 'Skill Layer', '技能层状态'), value: t(lang, 'Live', '已闭环') },
                  { label: t(lang, 'Governance Layer', '治理层状态'), value: t(lang, 'Forming', '形成中') }
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: 'rgba(141, 231, 187, 0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '18px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', color: 'var(--accent)', marginTop: '10px' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px', display: 'grid', gap: '10px' }}>
                {whyNow.map((item) => (
                  <div key={item.en} style={{ display: 'flex', gap: '10px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.8 }}>
                    <span style={{ color: 'var(--signal)' }}>•</span>
                    <span>{t(lang, item.en, item.zh)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '8px 24px 24px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(245, 200, 107, 0.08), rgba(141, 231, 187, 0.08))',
              border: '1px solid rgba(245, 200, 107, 0.22)',
              borderRadius: '26px',
              padding: '24px 26px',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>
              WHAT FOUNDING NODES MEAN
            </div>
            <h2 style={{ fontSize: '30px', marginTop: '10px', maxWidth: '20ch' }}>
              {t(
                lang,
                'Not the first users. The first nodes. Not early adopters. Early architects.',
                '不是最早的用户，而是最早的节点。不是早期围观者，而是早期架构者。'
              )}
            </h2>
            <p style={{ marginTop: '14px', fontSize: '15px', lineHeight: 1.9, color: 'var(--muted)', maxWidth: '920px' }}>
              {t(
                lang,
                'Later participants use the network. Founding nodes help define its public memory, routing habits, governance weight, and the shape of contribution itself.',
                '后来的参与者是在使用这张网络，创始节点则更早参与定义它的公共记忆、路由习惯、治理权重与贡献结构。'
              )}
            </p>
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '12px 24px 24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.18em' }}>
              FOUNDING RIGHTS
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>
              {t(lang, 'What the first 100 founding nodes receive', '前 100 名创始节点可获得什么')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {rights.map((item, index) => (
              <article key={item.key} style={{ background: 'var(--panel-soft)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', minHeight: '230px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.14em' }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 style={{ fontSize: '22px', lineHeight: 1.35, marginTop: '12px' }}>{t(lang, item.en.title, item.zh.title)}</h3>
                <p style={{ marginTop: '16px', color: 'var(--muted)', lineHeight: 1.85, fontSize: '15px' }}>
                  {t(lang, item.en.body, item.zh.body)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '12px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.8fr)', gap: '18px' }} className="understanding-grid">
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '26px', padding: '26px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.16em' }}>
                HOW VALUE WORKS
              </div>
              <h2 style={{ fontSize: '30px', marginTop: '10px', maxWidth: '18ch' }}>
                {t(lang, 'Explain it like a co-builder, not like a token paper.', '先讲人话，再讲协议，不要先抛术语。')}
              </h2>

              <div style={{ marginTop: '18px', display: 'grid', gap: '14px' }}>
                <div style={{ padding: '16px 18px', borderRadius: '18px', border: '1px solid var(--border)', background: 'rgba(141, 231, 187, 0.05)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)' }}>Q-SCORE</div>
                  <p style={{ marginTop: '10px', color: 'var(--muted)', lineHeight: 1.8, fontSize: '15px' }}>
                    {t(
                      lang,
                      'Q-score is the live weight of your current contribution. It reflects whether your node is still creating real value, not just whether it was once present.',
                      'Q 值更像你当下贡献的实时权重。它看的不是你曾经来过，而是你的节点现在是否仍在持续制造真实价值。'
                    )}
                  </p>
                </div>

                <div style={{ padding: '16px 18px', borderRadius: '18px', border: '1px solid rgba(245, 200, 107, 0.22)', background: 'rgba(245, 200, 107, 0.05)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)' }}>LOGIC HERITAGE</div>
                  <p style={{ marginTop: '10px', color: 'var(--muted)', lineHeight: 1.8, fontSize: '15px' }}>
                    {t(
                      lang,
                      'A later layer may protect original logic builders whose work keeps getting inherited over time. That is long-term origin recognition, not a replacement for Q-score.',
                      '未来还会有一层更偏长期的“逻辑遗产”机制，用来保护那些底层逻辑持续被继承的原创构建者。它不是替代 Q 值，而是补足长期来源识别。'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <aside style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '26px', padding: '26px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.14em' }}>
                WHO SHOULD JOIN
              </div>
              <h2 style={{ fontSize: '28px', marginTop: '10px' }}>
                {t(lang, 'Founding nodes are not only coders.', '创始节点不只属于写代码的人。')}
              </h2>

              <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
                {contributionTracks.map((item) => (
                  <div key={item.en} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', lineHeight: 1.8, color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--accent)' }}>•</span>
                    <span>{t(lang, item.en, item.zh)}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 24px 72px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(23, 39, 39, 0.92), rgba(14, 25, 28, 0.98))',
              border: '1px solid rgba(243, 198, 109, 0.2)',
              borderRadius: '28px',
              padding: '28px',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.14em' }}>
              CALL TO ACTION
            </div>
            <h2 style={{ fontSize: '34px', marginTop: '12px', maxWidth: '18ch' }}>
              {t(lang, 'The first 100 node slots are open.', '前 100 个创始节点席位开放中。')}
            </h2>
            <p style={{ marginTop: '14px', fontSize: '15px', lineHeight: 1.9, color: 'var(--muted)', maxWidth: '920px' }}>
              {t(
                lang,
                'No capital requirement. No forced permission ritual. What matters is whether you are willing to contribute atomic logic, infrastructure, distribution, or governance energy while this network is still becoming itself.',
                '不需要资金门槛，也不是为了走一轮审批。真正重要的是，当这张网络还在成形时，你是否愿意把原子能力、基础设施、分发能力或治理能力接进来。'
              )}
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '22px' }}>
              <Link
                href={withLang('/join', lang)}
                style={{
                  textDecoration: 'none',
                  background: 'var(--signal)',
                  color: '#241300',
                  padding: '13px 20px',
                  borderRadius: '999px',
                  fontFamily: 'var(--mono)',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                {t(lang, 'Apply now', '立即申请')}
              </Link>
              <Link
                href={withLang('/publish-skill', lang)}
                style={{
                  textDecoration: 'none',
                  padding: '13px 20px',
                  borderRadius: '999px',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--mono)',
                  fontSize: '13px'
                }}
              >
                {t(lang, 'Publish atomic logic first', '先发布原子能力')}
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                style={{
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontFamily: 'var(--mono)',
                  fontSize: '13px',
                  padding: '13px 20px',
                  borderRadius: '999px',
                  border: '1px solid rgba(243, 198, 109, 0.24)',
                  background: 'rgba(243, 198, 109, 0.06)'
                }}
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        @media (max-width: 960px) {
          .hero-grid,
          .understanding-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          main section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          h1 {
            font-size: 32px !important;
            line-height: 1.14 !important;
          }

          h2 {
            font-size: 26px !important;
            line-height: 1.22 !important;
          }
        }
      `}</style>
    </>
  )
}

