const { Pool } = require('pg');
const fs = require('fs');

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnb2lzbXFhcnpjaGtzemloeXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE2NjgzMiwiZXhwIjoyMDg5NzQyODMyfQ.PliscqyQOXZsVby9p6aEOlCCWlGDRWzhauQ9PkQpjpE';
const projectRef = 'agoismqarzchkszihysr';

async function tryConnect() {
  const sslConfig = { rejectUnauthorized: false };
  
  // Format 1: postgres.project-ref with JWT
  console.log('Trying connection format 1 (ssl bypass)...');
  const pool1 = new Pool({ 
    connectionString: `postgresql://postgres.${projectRef}:${serviceKey}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    ssl: sslConfig,
    connectionTimeoutMillis: 15000
  });
  try {
    const client = await pool1.connect();
    console.log('SUCCESS with format 1!');
    const result = await client.query('SELECT current_database(), current_user');
    console.log('DB:', result.rows[0]);
    client.release();
    await pool1.end();
    return 1;
  } catch (e) {
    console.log('Format 1 failed:', e.message.substring(0, 100));
    await pool1.end();
  }
  
  // Format 2: postgres with JWT  
  console.log('\nTrying connection format 2 (ssl bypass)...');
  const pool2 = new Pool({ 
    connectionString: `postgresql://postgres:${serviceKey}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    ssl: sslConfig,
    connectionTimeoutMillis: 15000
  });
  try {
    const client = await pool2.connect();
    console.log('SUCCESS with format 2!');
    const result = await client.query('SELECT current_database(), current_user');
    console.log('DB:', result.rows[0]);
    client.release();
    await pool2.end();
    return 2;
  } catch (e) {
    console.log('Format 2 failed:', e.message.substring(0, 100));
    await pool2.end();
  }
  
  return null;
}

tryConnect().then(result => {
  if (result) {
    console.log('\nWorking connection format:', result);
  } else {
    console.log('\nAll formats failed.');
  }
});