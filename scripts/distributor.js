// SWRM 收益分配 Agent
// 每30分钟检查一次，余额 > 50 USDC 则按 Q-Score 份额分配

const { createClient } = require('@supabase/supabase-js')
const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js')
const { getAssociatedTokenAddress, createTransferInstruction, getAccount, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } = require('@solana/spl-token')

// ─── 配置 ───────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const SOLANA_RPC   = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
const USDC_MINT    = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') // USDC mainnet
const THRESHOLD_USDC = 50 // 触发分配的最低余额（U）
const CHECK_INTERVAL = 30 * 60 * 1000 // 30分钟

// 平台钱包私钥（从环境变量读）
const PLATFORM_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.PLATFORM_PRIVATE_KEY_BYTES))
)
const PLATFORM_PUBKEY = PLATFORM_KEYPAIR.publicKey

// ─── 初始化客户端 ────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const connection = new Connection(SOLANA_RPC, 'confirmed')

// ─── 工具函数 ────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

// 获取平台USDC余额（返回U数，6位小数）
async function getPlatformUsdcBalance() {
  const ata = await getAssociatedTokenAddress(USDC_MINT, PLATFORM_PUBKEY)
  try {
    const account = await getAccount(connection, ata)
    return Number(account.amount) / 1_000_000
  } catch {
    return 0
  }
}

// 从Supabase读Q-Score快照，只返回有solana_wallet的contributor
async function getContributors() {
  const { data: agents, error } = await supabase
    .from('agent_profiles')
    .select('id, name, solana_wallet, q_score')
    .not('solana_wallet', 'is', null)
    .gt('q_score', 0)

  if (error) throw new Error(`Supabase error: ${error.message}`)
  return agents || []
}

// 计算每人份额（按q_score比例）
function calcShares(contributors, totalUsdc) {
  const totalQ = contributors.reduce((sum, a) => sum + (a.q_score || 0), 0)
  if (totalQ === 0) return []

  return contributors.map(a => ({
    ...a,
    shareUsdc: (a.q_score / totalQ) * totalUsdc
  })).filter(a => a.shareUsdc >= 0.01) // 低于0.01U的跳过，累积到下次
}

// 确保recipient有ATA，没有就创建
async function ensureAta(recipientPubkey, transaction) {
  const ata = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)
  try {
    await getAccount(connection, ata)
  } catch {
    // ATA不存在，创建
    transaction.add(
      createAssociatedTokenAccountInstruction(
        PLATFORM_PUBKEY,
        ata,
        recipientPubkey,
        USDC_MINT
      )
    )
  }
  return ata
}

// 执行分配
async function distribute(contributors, totalUsdc) {
  const shares = calcShares(contributors, totalUsdc)
  if (shares.length === 0) {
    log('无有效contributor，跳过')
    return
  }

  const platformAta = await getAssociatedTokenAddress(USDC_MINT, PLATFORM_PUBKEY)
  const { blockhash } = await connection.getLatestBlockhash()

  // 分批处理（每批最多8个，避免交易过大）
  const batchSize = 8
  for (let i = 0; i < shares.length; i += batchSize) {
    const batch = shares.slice(i, i + batchSize)
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: PLATFORM_PUBKEY })

    for (const contributor of batch) {
      const recipientPubkey = new PublicKey(contributor.solana_wallet)
      const recipientAta = await ensureAta(recipientPubkey, tx)
      const lamports = Math.floor(contributor.shareUsdc * 1_000_000)

      tx.add(
        createTransferInstruction(
          platformAta,
          recipientAta,
          PLATFORM_PUBKEY,
          lamports
        )
      )

      log(`  → ${contributor.name}: ${contributor.shareUsdc.toFixed(4)} USDC → ${contributor.solana_wallet}`)
    }

    tx.sign(PLATFORM_KEYPAIR)
    const sig = await connection.sendRawTransaction(tx.serialize())
    await connection.confirmTransaction(sig, 'confirmed')
    log(`  批次 ${Math.floor(i/batchSize)+1} 完成，tx: ${sig}`)

    // 写入分配记录
    await supabase.from('distribution_history').insert(
      batch.map(c => ({
        agent_id: c.id,
        amount_usdc: c.shareUsdc,
        solana_wallet: c.solana_wallet,
        tx_signature: sig,
        distributed_at: new Date().toISOString()
      }))
    )
  }
}

// ─── 主循环 ──────────────────────────────────────────────
async function check() {
  try {
    log('检查USDC余额...')
    const balance = await getPlatformUsdcBalance()
    log(`当前余额: ${balance.toFixed(4)} USDC`)

    if (balance < THRESHOLD_USDC) {
      log(`余额低于阈值 ${THRESHOLD_USDC} USDC，跳过`)
      return
    }

    log(`余额超过阈值，开始分配 ${balance.toFixed(4)} USDC...`)
    const contributors = await getContributors()
    log(`有钱包的 contributor: ${contributors.length} 个`)

    if (contributors.length === 0) {
      log('暂无注册钱包的contributor，等待')
      return
    }

    await distribute(contributors, balance * 0.95) // 留5%作为手续费缓冲
    log('✅ 本轮分配完成')
  } catch (err) {
    console.error(`[ERROR] ${err.message}`)
  }
}

// 启动
log('SWRM Distributor Agent 启动')
log(`平台钱包: ${PLATFORM_PUBKEY.toBase58()}`)
check()
setInterval(check, CHECK_INTERVAL)
