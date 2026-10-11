import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { buildPgConfig } from '../src/db.js'

dotenv.config()

const { Client } = pg

const DEMO_EMAIL = 'alex@nexpept.demo'
const DEMO_PASSWORD = 'Demo@123'

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=faces'

const AGENT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces'

const FAQS = [
  {
    type: 'faq',
    title: 'Do you provide COAs?',
    question: 'Do you provide COAs?',
    answer:
      '[Demo] Product Quality Summary is on every product page. Independent third-party Certificates of Analysis may be available on request for select batches — not medical advice.',
    tags: ['quality', 'coa'],
  },
  {
    type: 'faq',
    title: 'Where do you ship?',
    question: 'Where do you ship?',
    answer:
      '[Demo] We ship to addresses within Canada only via Canada Post Xpresspost. This is general logistics info, not a guarantee for every postal code.',
    tags: ['shipping'],
  },
  {
    type: 'faq',
    title: 'When will I get my order?',
    question: 'When will I get my order?',
    answer:
      '[Demo] Many orders ship the same business day. GTA often 1–2 business days; rural or remote areas often 3–5 business days. Times are estimates.',
    tags: ['shipping', 'delivery'],
  },
  {
    type: 'faq',
    title: 'How do you verify product quality?',
    question: 'How do you verify product quality?',
    answer:
      '[Demo] Peptide products are lab-tested before listing. Untested products are not sold. Support must not make medical or efficacy claims.',
    tags: ['quality'],
  },
  {
    type: 'faq',
    title: 'What is your return policy?',
    question: 'What is your return policy?',
    answer:
      '[Demo] All sales are final due to product nature. For quality concerns, contact support with your order ID — demo policy only.',
    tags: ['returns', 'policy'],
  },
]

async function main() {
  const client = new Client(buildPgConfig())
  await client.connect()

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    const { rows: existingAgents } = await client.query(
      `SELECT id FROM nexpept_agents WHERE email = $1 LIMIT 1`,
      [DEMO_EMAIL],
    )

    if (existingAgents.length === 0) {
      await client.query(
        `INSERT INTO nexpept_agents (name, email, password_hash, role, status, avatar_url)
         VALUES ($1, $2, $3, 'admin', 'active', $4)`,
        ['Alex Morgan', DEMO_EMAIL, passwordHash, AGENT_AVATAR],
      )
      console.log('Seeded admin agent:', DEMO_EMAIL)
    } else {
      console.log('Admin agent already exists, skipping agent insert.')
    }

    const { rows: settingsRows } = await client.query(
      `SELECT id FROM nexpept_settings LIMIT 1`,
    )

    const channels = [
      {
        id: 'ch_website',
        type: 'website',
        label: 'Website chat',
        enabled: true,
        connectionStatus: 'connected',
      },
      {
        id: 'ch_whatsapp',
        type: 'whatsapp',
        label: 'WhatsApp',
        enabled: true,
        url: 'https://wa.me/16472606806',
        connectionStatus: 'link_only',
      },
      {
        id: 'ch_instagram',
        type: 'instagram',
        label: 'Instagram',
        enabled: true,
        url: 'https://www.instagram.com/official.nexpept/',
        connectionStatus: 'link_only',
      },
    ]

    const theme = {
      brandName: 'NexPept',
      aiEnabledDefault: true,
      widgetEnabled: true,
      businessHours: { timezone: 'America/Toronto', start: '09:00', end: '17:00' },
      whatsappUrl: 'https://wa.me/16472606806',
      instagramUrl: 'https://www.instagram.com/official.nexpept/',
      connectionStatus: 'link_only',
    }

    if (settingsRows.length === 0) {
      await client.query(
        `INSERT INTO nexpept_settings (
          workspace_name, greeting, team_name, header_title, avatar_url,
          online_status, show_faqs, enable_human_handoff, theme, channels
        ) VALUES ($1, $2, $3, $4, $5, $6, true, true, $7::jsonb, $8::jsonb)`,
        [
          'NexPept',
          'Hey! How can we assist you today?',
          'NexPept Support',
          'Our team is here for you',
          DEFAULT_AVATAR,
          'online',
          JSON.stringify(theme),
          JSON.stringify(channels),
        ],
      )
      console.log('Seeded default nexpept_settings row.')
    } else {
      console.log('Settings row already exists, skipping settings insert.')
    }

    for (const faq of FAQS) {
      const { rows } = await client.query(
        `SELECT id FROM nexpept_knowledge WHERE type = 'faq' AND title = $1 LIMIT 1`,
        [faq.title],
      )
      if (rows.length > 0) continue

      await client.query(
        `INSERT INTO nexpept_knowledge (
          type, question, answer, title, content, status, tags
        ) VALUES ($1, $2, $3, $4, $5, 'published', $6)`,
        [faq.type, faq.question, faq.answer, faq.title, faq.answer, faq.tags],
      )
    }
    console.log('Ensured 5 published FAQ knowledge items.')

    console.log('Seed complete.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
