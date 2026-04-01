// 执行 migration 到 Supabase
// 运行方式: node scripts/run-migration.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://agoismqarzchkszihysr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnb2lzbXFhcnpjaGtzemloeXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE2NjgzMiwiZXhwIjoyMDg5NzQyODMyfQ.PliscqyQOXZsVby9p6aEOlCCWlGDRWzhauQ9PkQpjpE'

async function runMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 读取 migration SQL
  const migrationPath = path.join(__dirname, '../supabase/migrations/escrow-config.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log('Migration SQL length:', sql.length)
  
  // 分割 SQL 为多个语句执行
  // Supabase 不支持直接执行多语句，需要逐个执行
  
  // 简化：只创建必要的表和配置
  console.log('Creating system_config table...')
  
  // 用 RPC 执行 SQL（如果有的话）
  // 或者手动创建表
  
  try {
    // 先尝试创建 system_config 表
    const { error: configError } = await supabase.rpc('exec_sql', { query: `
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        value_type TEXT DEFAULT 'string',
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    ` })
    
    if (configError) {
      console.log('RPC exec_sql not available, using table operations...')
      
      // 尝试直接插入配置（假设表已存在）
      const configs = [
        { key: 'escrow_amount', value: '1', value_type: 'number', description: '质押点数' },
        { key: 'escrow_days', value: '30', value_type: 'number', description: '质押周期（天）' },
        { key: 'min_inherits_for_release', value: '1', value_type: 'number', description: '最少继承次数' },
        { key: 'min_rating_for_release', value: '3.5', value_type: 'number', description: '最低好评率' },
        { key: 'release_on_first_inherit', value: 'true', value_type: 'boolean', description: '是否首传即退' }
      ]
      
      // 尝试创建表（用 Supabase 表 API）
      // 实际上 Supabase REST API 不能创建表，需要用 SQL Editor
      
      console.log('Please run the migration SQL in Supabase SQL Editor:')
      console.log('---')
      console.log(sql.substring(0, 500) + '...')
      console.log('---')
      
      // 保存 SQL 到临时文件方便复制
      const tempPath = path.join(__dirname, '../temp-migration.sql')
      fs.writeFileSync(tempPath, sql)
      console.log('SQL saved to:', tempPath)
      
      return
    }
    
    console.log('system_config table created')
    
  } catch (err) {
    console.error('Migration error:', err.message)
    console.log('Please run the migration SQL manually in Supabase SQL Editor')
    console.log('File location: supabase/migrations/escrow-config.sql')
  }
}

runMigration()