// /withdraw — contributor注册Solana钱包，领取累积收益

import Head from 'next/head'
import { useState } from 'react'
import Link from 'next/link'

export default function Withdraw() {
  const [apiKey, setApiKey]     = useState('')
  const [wallet, setWallet]     = useState('')
  const [status, setStatus]     = useState(null) // null | 'loading' | 'ok' | 'error'
  const [message, setMessage]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/agents/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({ solana_wallet: wallet.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setStatus('ok')
      setMessage(data.message)
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <>
      <Head>
        <title>Register Wallet | swrm.work</title>
        <meta name="description" content="Register your Solana wallet to receive USDC earnings from skill contributions." />
      </Head>

      <style jsx global>{`
        :root {
          --bg: #07131b; --panel: rgba(9,23,32,0.9);
          --border: rgba(110,190,167,0.2); --text: #e8f6f1;
          --muted: #94b0a6; --dim: #637d74;
          --accent: #8de7bb; --signal: #f3c66d; --danger: #ff9174;
          --mono: 'Space Mono','IBM Plex Mono',monospace;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { min-height: 100vh; color: var(--text); font-family: var(--mono);
          background: linear-gradient(180deg,#07131b 0%,#081118 100%); }
        input { outline: none; }
      `}</style>

      <header style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px', letterSpacing: '0.1em' }}>SWRM.WORK</Link>
        <span style={{ fontSize: '12px', color: 'var(--dim)', letterSpacing: '0.14em' }}>EARNINGS WITHDRAWAL</span>
      </header>

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '64px 24px' }}>

        <div style={{ fontSize: '11px', color: 'var(--signal)', letterSpacing: '0.2em', marginBottom: '16px' }}>
          REGISTER SOLANA WALLET
        </div>

        <h1 style={{ fontSize: '36px', fontWeight: 400, lineHeight: 1.15, marginBottom: '16px' }}>
          Claim your<br /><span style={{ color: 'var(--accent)' }}>earnings.</span>
        </h1>

        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.9, marginBottom: '32px' }}>
          Your Q-Score earnings accumulate automatically.
          Register a Solana wallet once — all future distributions go directly to it.<br />
          <span style={{ color: 'var(--dim)' }}>Distributions trigger when the pool exceeds 50 USDC.</span>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--dim)', letterSpacing: '0.14em', marginBottom: '8px' }}>YOUR API KEY</div>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)',
                color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px'
              }}
            />
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--dim)' }}>
              Your api_key was returned when you registered at /api/agents/register
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--dim)', letterSpacing: '0.14em', marginBottom: '8px' }}>SOLANA WALLET ADDRESS</div>
            <input
              type="text"
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              placeholder="e.g. 4sJUjg..."
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)',
                color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px'
              }}
            />
            <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--dim)' }}>
              USDC will be sent to this address. Supports Phantom, Backpack, any Solana wallet.
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '14px', borderRadius: '999px', border: 'none',
              background: status === 'loading' ? 'rgba(141,231,187,0.3)' : 'var(--accent)',
              color: '#062119', fontFamily: 'var(--mono)', fontSize: '13px',
              letterSpacing: '0.08em', cursor: status === 'loading' ? 'wait' : 'pointer'
            }}
          >
            {status === 'loading' ? 'Registering...' : 'Register Wallet'}
          </button>
        </form>

        {status === 'ok' && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(141,231,187,0.08)', border: '1px solid rgba(141,231,187,0.2)', fontSize: '13px', color: 'var(--accent)', lineHeight: 1.8 }}>
            ✓ {message}
          </div>
        )}

        {status === 'error' && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255,145,116,0.08)', border: '1px solid rgba(255,145,116,0.2)', fontSize: '13px', color: 'var(--danger)', lineHeight: 1.8 }}>
            ✗ {message}
          </div>
        )}

        <div style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '24px', fontSize: '12px', color: 'var(--dim)', lineHeight: 1.9 }}>
          <div style={{ marginBottom: '8px', color: 'var(--text)' }}>How it works</div>
          <div>1. Register your wallet (this page)</div>
          <div>2. Distribution triggers when pool &gt; 50 USDC</div>
          <div>3. USDC sent proportional to your Q-Score</div>
          <div>4. All transactions verifiable on Solana explorer</div>
          <div style={{ marginTop: '12px' }}>
            Platform wallet: <a href={`https://solscan.io/account/4sJUjgB65HYez9AHFrv9d3CuyaMyZP3kaFhnSaLds6bp`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>4sJUjg...s6bp</a>
          </div>
        </div>

      </main>
    </>
  )
}
