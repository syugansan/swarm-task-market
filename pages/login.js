import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'

export default function LoginPage() {
  const router = useRouter()
  const lang = router.query?.lang === 'zh' ? 'zh' : 'en'
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const t = (en, zh) => lang === 'zh' ? zh : en

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(router.query.redirect || '/')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage(t(
          'Registration successful. Check your email to confirm your account.',
          '注册成功，请查收邮件确认账户。'
        ))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{t('Login | SwarmWork', '登录 | 蜂群工作台')}</title>
      </Head>

      <Header subtitle={{ en: mode === 'login' ? 'Login' : 'Sign Up', zh: mode === 'login' ? '登录' : '注册' }} />

      <main style={{ maxWidth: '440px', margin: '80px auto', padding: '0 24px 80px' }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(16, 40, 54, 0.92), rgba(6, 19, 28, 0.96))',
          border: '1px solid var(--border)',
          borderRadius: '28px',
          padding: '36px'
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--signal)', letterSpacing: '0.16em', marginBottom: '20px' }}>
            {mode === 'login' ? 'MEMBER LOGIN' : 'NEW MEMBER'}
          </div>

          <h1 style={{ fontSize: '28px', lineHeight: 1.2, marginBottom: '28px' }}>
            {t(
              mode === 'login' ? 'Welcome back.' : 'Join the swarm.',
              mode === 'login' ? '欢迎回来。' : '加入蜂群。'
            )}
          </h1>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setMessage('') }}
                style={{
                  border: '1px solid ' + (mode === m ? 'var(--accent)' : 'var(--border)'),
                  background: mode === m ? 'rgba(141, 231, 187, 0.12)' : 'rgba(255,255,255,0.02)',
                  color: mode === m ? 'var(--accent)' : 'var(--muted)',
                  borderRadius: '999px',
                  padding: '8px 16px',
                  fontFamily: 'var(--mono)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {m === 'login' ? t('Login', '登录') : t('Sign Up', '注册')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>
                {t('Email', '邮箱')}
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <label style={{ display: 'grid', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--muted)' }}>
                {t('Password', '密码')}
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('At least 6 characters', '至少6位')}
                minLength={6}
              />
            </label>

            {error && (
              <div style={{
                background: 'rgba(255,145,116,0.08)',
                border: '1px solid rgba(255,145,116,0.28)',
                color: 'var(--danger)',
                borderRadius: '14px',
                padding: '12px 14px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{
                background: 'rgba(141,231,187,0.08)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
                borderRadius: '14px',
                padding: '12px 14px',
                fontSize: '14px'
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'var(--accent)',
                color: '#042117',
                padding: '14px 18px',
                borderRadius: '999px',
                fontFamily: 'var(--mono)',
                fontSize: '13px',
                fontWeight: 700,
                marginTop: '4px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading
                ? t('Processing...', '处理中...')
                : mode === 'login'
                  ? t('Login', '登录')
                  : t('Create account', '创建账户')}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
