/**
 * 执行 council-schema.sql 到 Supabase
 * 使用 Supabase Management API
 */

const fs = require('fs');
const path = require('path');

// 配置
const SUPABASE_URL = 'https://agoismqarzchkszihysr.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnb2lzbXFhcnpjaGtzemloeXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE2NjgzMiwiZXhwIjoyMDg5NzQyODMyfQ.PliscqyQOXZsVby9p6aEOlCCWlGDRWzhauQ9PkQpjpE';

async function executeSql(sql) {
    // 使用 Supabase 的 SQL 执行端点
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({ sql })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`SQL 执行失败: ${response.status} ${text}`);
    }

    return response.json();
}

async function verifyTables() {
    // 验证表是否创建成功
    const tables = ['council_proposals', 'council_comments', 'council_votes'];
    const results = {};

    for (const table of tables) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
            method: 'GET',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Prefer': 'count=exact'
            }
        });
        
        results[table] = response.ok ? '✅ 存在' : `❌ 不存在或无权限`;
    }

    return results;
}

async function main() {
    console.log('='.repeat(60));
    console.log('SwarmWork Council Schema Executor');
    console.log('='.repeat(60));
    console.log(`\n目标 Supabase: ${SUPABASE_URL}`);
    
    // 读取 SQL
    const sqlPath = path.join(__dirname, '..', '..', 'council-schema.sql');
    console.log(`\n读取 SQL 文件: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`SQL 内容长度: ${sql.length} 字符`);
    
    // 尝试执行
    console.log('\n尝试执行 SQL...');
    
    try {
        // 先验证当前表状态
        console.log('\n执行前验证表状态...');
        const beforeVerify = await verifyTables();
        console.log('执行前:', beforeVerify);
        
        // Supabase REST API 不支持直接执行 DDL
        // 需要使用 Supabase Dashboard 的 SQL Editor 或 psql
        console.log('\n⚠️  Supabase REST API 不支持执行 DDL (CREATE TABLE 等)');
        console.log('\n请手动执行以下步骤:');
        console.log('1. 打开 https://supabase.com/dashboard/project/agoismqarzchkszihysr/sql');
        console.log('2. 复制 council-schema.sql 的内容');
        console.log('3. 粘贴到 SQL Editor 并执行');
        
    } catch (error) {
        console.error('\n错误:', error.message);
    }
    
    // 验证
    console.log('\n验证表状态...');
    const verifyResult = await verifyTables();
    console.log('验证结果:', verifyResult);
}

main().catch(console.error);