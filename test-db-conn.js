const { Pool } = require('pg');
const fs = require('fs');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnb2lzbXFhcnpjaGtzemloeXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE2NjgzMiwiZXhwIjoyMDg5NzQyODMyfQ.PliscqyQOXZsVby9p6aEOlCCWlGDRWzhauQ9PkQpjpE';
const projectRef = 'agoismqarzchkszihysr';

async function tryConnect() {
  // Format 1: postgres.project-ref with JWT
  const connStr1 = `postgresql://postgres.${projectRef}:${serviceKey}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`;
  
  console.log('Trying connection format 1...');
  const pool1 = new Pool({ connectionString: connStr1, connectionTimeoutMillis: 10000 });
  try {
    const client = await pool1.connect();
    console.log('SUCCESS with format 1!');
    client.release();
    await pool1.end();
    return { format: 1, connStr: connStr1 };
  } catch (e) {
    console.log('Format 1 failed:', e.message.substring(0, 100));
    await pool1.end();
  }
  
  // Format 2: postgres with JWT  
  const connStr2 = `postgresql://postgres:${serviceKey}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`;
  console.log('\nTrying connection format 2...');
  const pool2 = new Pool({ connectionString: connStr2, connectionTimeoutMillis: 10000 });
  try {
    const client = await pool2.connect();
    console.log('SUCCESS with format 2!');
    client.release();
    await pool2.end();
    return { format: 2, connStr: connStr2 };
  } catch (e) {
    console.log('Format 2 failed:', e.message.substring(0, 100));
    await pool2.end();
  }
  
  // Format 3: Direct connection with project ref
  const connStr3 = `postgresql://postgres:${serviceKey}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
  console.log('\nTrying connection format 3 (direct)...');
  const pool3 = new Pool({ connectionString: connStr3, connectionTimeoutMillis: 10000 });
  try {
    const client = await pool3.connect();
    console.log('SUCCESS with format 3!');
    client.release();
    await pool3.end();
    return { format: 3, connStr: connStr3 };
  } catch (e) {
    console.log('Format 3 failed:', e.message.substring(0, 100));
    await pool3.end();
  }
  
  return null;
}

tryConnect().then(result => {
  if (result) {
    console.log('\nWorking connection found:', result.format);
  } else {
    console.log('\nNo working connection format found.');
  }
});