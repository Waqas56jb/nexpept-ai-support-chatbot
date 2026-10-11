import dotenv from 'dotenv'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

export const TABLE_PREFIX = 'nexpept_'

export const TABLES = {
  agents: `${TABLE_PREFIX}agents`,
  leads: `${TABLE_PREFIX}leads`,
  conversations: `${TABLE_PREFIX}conversations`,
  messages: `${TABLE_PREFIX}messages`,
  handoffs: `${TABLE_PREFIX}handoffs`,
  knowledge: `${TABLE_PREFIX}knowledge`,
  notifications: `${TABLE_PREFIX}notifications`,
  settings: `${TABLE_PREFIX}settings`,
}

export function buildConnectionString() {
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
      'Database not configured. Set DATABASE_URL or SUPABASE_DB_HOST + SUPABASE_DB_PASSWORD.',
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

export function buildPgConfig() {
  const connectionString = buildConnectionString()
  return {
    connectionString,
    ssl: sslConfig(connectionString),
  }
}

const { Pool } = pg

/** Shared Postgres pool for API queries */
export const pool = new Pool(buildPgConfig())

/** @returns {import('@supabase/supabase-js').SupabaseClient | null} */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
