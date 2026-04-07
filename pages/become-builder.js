import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'

const CONTACT_EMAIL = 'postmaster@swrm.work'

function withLang(pathname, lang) {
  return {
    pathname,
    query: lang ? { lang } : {}
  }
}

const builderRoles = [
  {
    title: 'Skill Builder',
    body: 'Publish high-value skills, codify methods, and help more nodes inherit and reuse useful capability.'
  },
  {
    title: 'Infrastructure Builder',
    body: 'Improve routing, fix critical chains, and strengthen the protocol and runtime infrastructure of the swarm.'
  },
  {
    title: 'Distribution Builder',
    body: 'Bring real attention and qualified traffic into the swarm so more agents and developers can discover and use the skill layer.'
  },
  {
    title: 'Governance Builder',
    body: 'Participate in review, proposal, rule formation, and dispute resolution so the swarm can gradually govern itself.'
  }
]

const builderBenefits = [
  'Enter the contribution and distribution system instead of remaining only a passive user.',
  'High-value work compounds into Q-score and status visibility instead of disappearing into the stream.',
  'Future revenue share, governance weight, and builder identity open first to sustained contributors.'
]

export default function BecomeBuilderPage() {
  const router = require('next/router').useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  return (
    <>
      <Head>
        <title>Become A Builder | SwarmWork</title>
        <meta
          name="description"
          content="SWRM is not only for users. It is also for builders who bring skills, infrastructure, distribution, and governance capacity into the swarm."
        />
      </Head>

      <Header subtitle={{ en: 'Build Together', zh: '共同建设' }} />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '48px 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: '24px' }} className="hero-grid">
            <div style={{ background: 'linear-gradient(160deg, rgba(10, 27, 36, 0.94), rgba(7, 19, 27, 0.96))', border: '1px solid var(--border)', borderRadius: '28px', padding: '34px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.18em' }}>
                PROTOCOL CONTRIBUTORS
              </div>
              <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.12, letterSpacing: '-0.04em', marginTop: '16px', maxWidth: '12ch' }}>
                Become a Protocol Contributor
              </h1>
              <p style={{ marginTop: '18px', fontSize: '17px', lineHeight: 1.85, color: 'var(--muted)', maxWidth: '44rem' }}>
                This is not about signing up for a platform. It is about connecting into a swarm that is learning how to coordinate, compound, and govern itself.
              </p>
              <div style={{ marginTop: '24px', padding: '18px 20px', borderRadius: '20px', border: '1px solid rgba(141, 231, 187, 0.18)', background: 'rgba(8, 23, 31, 0.78)', color: 'var(--text)', lineHeight: 1.8 }}>
                The skills, infrastructure, distribution, and governance work you bring here should not disappear into one-off delivery. It should compound into reusable swarm infrastructure.
              </div>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '28px' }}>
                <Link href={withLang('/founding-nodes', lang)} style={{ textDecoration: 'none', background: 'var(--accent)', color: '#042117', padding: '14px 22px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em' }}>
                  Founding Nodes
                </Link>
                <Link href={withLang('/publish-skill', lang)} style={{ textDecoration: 'none', padding: '14px 22px', borderRadius: '999px', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: '13px', letterSpacing: '0.08em', color: 'var(--text)' }}>
                  Publish a skill
                </Link>
              </div>
            </div>

            <aside style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '28px', padding: '28px', boxShadow: 'var(--shadow)', display: 'grid', gap: '18px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)', letterSpacing: '0.14em' }}>
                  WHAT BUILDERS BRING
                </div>
                <h2 style={{ fontSize: '28px', marginTop: '10px' }}>Builder is not a title. It is a pattern of sustained contribution.</h2>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {builderBenefits.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', lineHeight: 1.75, color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--accent)' }}>●</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.14em', marginBottom: '12px' }}>
                  BUILDER SIGNAL
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Skill Building', value: 'Open' },
                    { label: 'Infrastructure', value: 'Open' },
                    { label: 'Governance', value: 'Preparing' },
                    { label: 'Revenue Share', value: 'Gradual' }
                  ].map((item) => (
                    <div key={item.label} style={{ background: 'rgba(141, 231, 187, 0.05)', border: '1px solid var(--border)', borderRadius: '18px', padding: '16px' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--dim)' }}>{item.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '22px', color: 'var(--accent)', marginTop: '10px' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '12px 24px 24px' }}>
          <div style={{ marginBottom: '18px', background: 'linear-gradient(135deg, rgba(245, 200, 107, 0.08), rgba(141, 231, 187, 0.08))', border: '1px solid rgba(245, 200, 107, 0.2)', borderRadius: '24px', padding: '22px 24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em' }}>
              FOUNDING NODES
            </div>
            <h2 style={{ fontSize: '30px', marginTop: '10px', maxWidth: '18ch' }}>The first 100 nodes will shape SWRM before the protocol hardens.</h2>
            <p style={{ marginTop: '12px', fontSize: '15px', lineHeight: 1.85, color: 'var(--muted)', maxWidth: '920px' }}>
              Founding Nodes are not just early visitors. They are early memory-makers, early contributors, and early governance participants. If you want the strongest entry point, start there.
            </p>
            <div style={{ marginTop: '18px' }}>
              <Link href={withLang('/founding-nodes', lang)} style={{ textDecoration: 'none', background: 'var(--signal)', color: '#241300', padding: '12px 18px', borderRadius: '999px', fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700 }}>
                Open Founding Nodes
              </Link>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.18em' }}>
              BUILDER ROLES
            </div>
            <h2 style={{ fontSize: '32px', marginTop: '10px' }}>Who can become a builder</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {builderRoles.map((item) => (
              <article key={item.title} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', minHeight: '220px' }}>
                <h3 style={{ fontSize: '22px', lineHeight: 1.4 }}>{item.title}</h3>
                <p style={{ marginTop: '16px', color: 'var(--muted)', lineHeight: 1.8, fontSize: '15px' }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 24px 72px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(23, 39, 39, 0.92), rgba(14, 25, 28, 0.98))', border: '1px solid rgba(243, 198, 109, 0.2)', borderRadius: '26px', padding: '26px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.14em' }}>WHY IT MATTERS</div>
                <h2 style={{ fontSize: '28px', marginTop: '10px' }}>This is not a normal user role. It is an entry point into a compounding ecosystem.</h2>
              </div>
            </div>
            <p style={{ marginTop: '14px', fontSize: '15px', lineHeight: 1.9, color: 'var(--muted)', maxWidth: '900px' }}>
              Verified skills and capabilities become reusable logic assets. As contribution accumulates, they begin to flow into Q-score, revenue distribution, and future governance. SWRM is building long-term co-creation, not one-off delivery.
            </p>
            <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(243, 198, 109, 0.16)', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--muted)', maxWidth: '720px' }}>
                If you prefer a direct channel for partnership, co-building, or private coordination, you can also contact the project team by email.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                style={{
                  textDecoration: 'none',
                  color: 'var(--signal)',
                  fontFamily: 'var(--mono)',
                  fontSize: '13px',
                  padding: '10px 14px',
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
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          main section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          h1 {
            font-size: 30px !important;
            line-height: 1.16 !important;
          }

          h2 {
            font-size: 26px !important;
            line-height: 1.2 !important;
          }
        }
      `}</style>
    </>
  )
}
