import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQL_PATH = path.join(__dirname, '..', 'sql', '001_nexpept_schema.sql')

function buildConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const host = process.env.SUPABASE_DB_HOST
  const port = process.env.SUPABASE_DB_PORT || '5432'
  const database = process.env.SUPABASE_DB_NAME || 'postgres'
  const user = process.env.SUPABASE_DB_USER || 'postgres'
  const password = process.env.SUPABASE_DB_PASSWORD

  if (!host || !password) {
    throw new Error(
      'Set DATABASE_URL or SUPABASE_DB_HOST + SUPABASE_DB_PASSWORD (and optional SUPABASE_DB_* fields).',
    )
  }

  const encodedPassword = encodeURIComponent(password)
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`
}

function sslConfig(connectionString) {
  const lower = connectionString.toLowerCase()
  if (
    lower.includes('supabase.co') ||
    process.env.PGSSLMODE === 'require' ||
    process.env.NODE_ENV === 'production'
  ) {
    return { rejectUnauthorized: false }
  }
  return undefined
}

async function listNexpeptTables(client) {
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'nexpept_%' ORDER BY tablename`,
  )
  return rows.map((r) => r.tablename)
}

async function main() {
  const connectionString = buildConnectionString()
  const client = new Client({
    connectionString,
    ssl: sslConfig(connectionString),
  })

  await client.connect()

  try {
    const before = await listNexpeptTables(client)
    console.log('nexpept_* tables before migrate:', before.length ? before.join(', ') : '(none)')

    const sql = fs.readFileSync(SQL_PATH, 'utf8')
    if (!/CREATE\s+(TABLE|INDEX|EXTENSION)\s+IF\s+NOT\s+EXISTS/i.test(sql)) {
      throw new Error('Migration SQL must use CREATE IF NOT EXISTS only.')
    }
    if (/\bDROP\b/i.test(sql)) {
      throw new Error('Migration SQL must not contain DROP statements.')
    }

    await client.query(sql)

    const after = await listNexpeptTables(client)
    console.log('nexpept_* tables after migrate:', after.join(', '))
    console.log('Migration complete.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
