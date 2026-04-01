import { createClient } from '@supabase/supabase-js'

// 直接使用硬编码的值（与 next.config.js 一致）
const supabaseUrl = process.env.SUPABASE_URL || 'https://agoismqarzchkszihysr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_WQgiyigwGhzMyeF2DCw27Q_XdW4WRpZ'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnb2lzbXFhcnpjaGtzemloeXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE2NjgzMiwiZXhwIjoyMDg5NzQyODMyfQ.PliscqyQOXZsVby9p6aEOlCCWlGDRWzhauQ9PkQpjpE'

// 前端使用 anon key（有 RLS 保护）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端使用 service key（绕过 RLS，有完全权限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)