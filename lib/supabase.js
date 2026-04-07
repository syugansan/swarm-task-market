import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_WQgiyigwGhzMyeF2DCw27Q_XdW4WRpZ'

// 前端客户端 - 使用 anon key（有 RLS 保护）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端客户端 - 仅在 API 路由中使用
const serviceKey = process.env.SUPABASE_SERVICE_KEY
export const supabaseAdmin = serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null