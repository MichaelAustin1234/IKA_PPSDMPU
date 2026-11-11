import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

// Parse .env.local manually if not in env
if (!process.env.DATABASE_URL && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

async function run() {
  if (!dbUrl) {
    console.error('DATABASE_URL is not set in environment or .env.local!');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database via direct pg client...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  client.on('notice', (msg) => {
    console.log(`[PG NOTICE] ${msg.message}`);
  });

  await client.connect();
  console.log('Connected successfully to PostgreSQL!');

  const sqlPath = path.resolve(process.cwd(), 'supabase', 'migrations', 'dry_run_dedup_rollback.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Executing dry_run_dedup_rollback.sql (Single Transaction with ROLLBACK)...');
  const startTime = Date.now();
  await client.query(sql);
  const duration = Date.now() - startTime;

  console.log(`\n🎉 Dry-run SQL executed successfully in ${duration}ms! Transaction ROLLBACK completed.`);
  await client.end();
}

run().catch((err) => {
  console.error('❌ Dry-run SQL failed:', err);
  process.exit(1);
});
