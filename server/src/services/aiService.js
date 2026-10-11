import OpenAI from 'openai'
import { pool, TABLES } from '../db.js'
import {
  AI_GENERATION_DEFAULTS,
  AI_MODEL_DEFAULT,
  buildSystemPrompt,
} from '../prompts/nexpeptSupport.js'

let openaiClient = null
let openaiKeyUsed = null

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null
  if (!openaiClient || openaiKeyUsed !== key) {
    openaiClient = new OpenAI({ apiKey: key })
    openaiKeyUsed = key
  }
  return openaiClient
}

export function isHandoffPhrase(text) {
  const lower = String(text || '').toLowerCase()
  const phrases = [
    'speak with team member',
    'speak with a team member',
    'talk to human',
    'talk to a human',
    'human agent',
    'real person',
    'live agent',
    'customer service',
  ]
  return phrases.some((p) => lower.includes(p))
}

async function loadPublishedFaqs() {
  const { rows } = await pool.query(
    `SELECT title, question, answer, content, tags FROM ${TABLES.knowledge}
     WHERE type = 'faq' AND status = 'published'
     ORDER BY updated_at DESC`,
  )
  return rows
}

/** Keyword fallback when OpenAI is unavailable */
function faqMatch(userText, faqs) {
  const lower = userText.toLowerCase()
  let best = null
  let bestScore = 0

  for (const faq of faqs) {
    const title = (faq.title || faq.question || '').toLowerCase()
    const answer = faq.answer || faq.content || ''
    const tags = (faq.tags || []).join(' ').toLowerCase()
    let score = 0

    if (title && lower.includes(title.slice(0, Math.min(title.length, 20)))) score += 3
    const words = title.split(/\s+/).filter((w) => w.length > 3)
    for (const w of words) {
      if (lower.includes(w)) score += 1
    }
    if (tags.includes('coa') && (lower.includes('coa') || lower.includes('certificate'))) score += 4
    if (tags.includes('shipping') && (lower.includes('ship') || lower.includes('delivery'))) score += 3
    if (tags.includes('returns') && lower.includes('return')) score += 4
    if (tags.includes('quality') && lower.includes('quality')) score += 3

    if (score > bestScore) {
      bestScore = score
      best = answer
    }
  }

  if (bestScore >= 2 && best) return best
  return null
}

/**
 * Map DB messages to OpenAI chat roles (recent window only).
 * @param {Array<{ sender_type?: string, senderType?: string, content: string }>} history
 */
function toChatMessages(history = [], latestUserText) {
  const roles = {
    customer: 'user',
    ai: 'assistant',
    agent: 'assistant',
    system: 'assistant',
  }

  const prior = history
    .filter((m) => m?.content && String(m.content).trim())
    .slice(-16)
    .map((m) => {
      const type = m.sender_type || m.senderType || 'customer'
      return {
        role: roles[type] || 'user',
        content: String(m.content).trim().slice(0, 2000),
      }
    })
    .filter((m) => m.role === 'user' || m.role === 'assistant')

  // Ensure the latest user turn is present (in case history fetch raced ahead of insert)
  const last = prior[prior.length - 1]
  if (!last || last.role !== 'user' || last.content !== latestUserText) {
    prior.push({ role: 'user', content: latestUserText })
  }

  return prior
}

/**
 * @param {string} userText
 * @param {{ history?: Array, customerName?: string } | string} [options]
 */
export async function generateReply(userText, options = {}) {
  const legacyContext = typeof options === 'string' ? options : ''
  const history = typeof options === 'object' && options ? options.history || [] : []
  const customerName =
    typeof options === 'object' && options ? options.customerName || '' : ''

  const faqs = await loadPublishedFaqs()
  const openai = getOpenAI()

  if (openai) {
    try {
      const system = buildSystemPrompt({ faqs, customerName })
      const messages = [
        { role: 'system', content: system },
        ...(legacyContext
          ? [{ role: 'assistant', content: String(legacyContext).slice(0, 1500) }]
          : []),
        ...toChatMessages(history, userText),
      ]

      const completion = await openai.chat.completions.create(
        {
          model: process.env.OPENAI_MODEL || AI_MODEL_DEFAULT,
          messages,
          ...AI_GENERATION_DEFAULTS,
        },
        { timeout: 25000 },
      )

      const text = completion.choices[0]?.message?.content?.trim()
      if (text) return text
    } catch (err) {
      console.error('[aiService] OpenAI error:', err?.message || err)
      /* fall through */
    }
  }

  const matched = faqMatch(userText, faqs)
  if (matched) return matched

  return (
    'Thank you for contacting NexPept. I can help with research product questions, COAs, Canada shipping, delivery times, quality, and returns. ' +
    'For anything I cannot confirm from our approved information, please tap “Speak with team member” and a specialist will continue.'
  )
}
