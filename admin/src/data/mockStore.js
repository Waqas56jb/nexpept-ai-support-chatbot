import { SETTINGS_STORAGE_KEY } from '../utils/constants.js'

const now = Date.now()
const iso = (offsetMs) => new Date(now + offsetMs).toISOString()

/** @type {Set<(state: object) => void>} */
const listeners = new Set()

/** @type {object | null} */
let currentUser = null

function defaultSettings() {
  return {
    brandName: 'NexPept',
    greeting: 'Hey! How can we assist you today?',
    headerTitle: 'Our team is here for you',
    agentName: 'NexPept Support',
    agentAvatar:
      'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop&crop=faces',
    whatsappUrl: 'https://wa.me/16472606806',
    instagramUrl: 'https://www.instagram.com/official.nexpept/',
    connectionStatus: 'link_only',
    aiEnabledDefault: true,
    businessHours: { timezone: 'America/Toronto', start: '09:00', end: '17:00' },
  }
}

function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return defaultSettings()
    return { ...defaultSettings(), ...JSON.parse(raw) }
  } catch {
    return defaultSettings()
  }
}

function persistSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore quota / private mode */
  }
}

function seedState() {
  const agents = [
    {
      id: 'agent_001',
      name: 'Alex Morgan',
      email: 'alex@nexpept.demo',
      password: 'Demo@123',
      role: 'admin',
      status: 'online',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
      createdAt: iso(-86400000 * 90),
      updatedAt: iso(-3600000),
    },
    {
      id: 'agent_002',
      name: 'Jordan Lee',
      email: 'jordan@nexpept.com',
      password: 'agent123',
      role: 'agent',
      status: 'away',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
      createdAt: iso(-86400000 * 60),
      updatedAt: iso(-7200000),
    },
    {
      id: 'agent_003',
      name: 'Sam Patel',
      email: 'sam@nexpept.com',
      password: 'agent123',
      role: 'agent',
      status: 'offline',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
      createdAt: iso(-86400000 * 30),
      updatedAt: iso(-86400000),
    },
  ]

  const channels = [
    {
      id: 'ch_website',
      type: 'website',
      label: 'Website chat',
      enabled: true,
      connectionStatus: 'connected',
      updatedAt: iso(-86400000 * 2),
    },
    {
      id: 'ch_whatsapp',
      type: 'whatsapp',
      label: 'WhatsApp',
      enabled: true,
      url: 'https://wa.me/16472606806',
      connectionStatus: 'link_only',
      updatedAt: iso(-86400000),
    },
    {
      id: 'ch_instagram',
      type: 'instagram',
      label: 'Instagram',
      enabled: true,
      url: 'https://www.instagram.com/official.nexpept/',
      connectionStatus: 'link_only',
      updatedAt: iso(-43200000),
    },
  ]

  const leads = [
    {
      id: 'lead_001',
      name: 'Chris Nguyen',
      email: 'chris.nguyen@example.com',
      phone: '+1 416-555-0101',
      country: 'CA',
      source: 'website',
      status: 'new',
      tags: ['research'],
      createdAt: iso(-3600000 * 2),
      notes: 'Asked about COA availability.',
    },
    {
      id: 'lead_002',
      name: 'Taylor Brooks',
      email: 't.brooks@labmail.ca',
      phone: '+1 647-555-0188',
      country: 'CA',
      source: 'whatsapp',
      status: 'contacted',
      tags: ['shipping'],
      createdAt: iso(-86400000),
      notes: 'GTA delivery timeline question.',
    },
    {
      id: 'lead_003',
      name: 'Morgan Ellis',
      email: 'morgan.e@example.org',
      country: 'CA',
      source: 'instagram',
      status: 'qualified',
      tags: ['bulk'],
      createdAt: iso(-86400000 * 2),
      notes: 'Institutional buyer — follow up with catalog.',
    },
    {
      id: 'lead_004',
      name: 'Riley Chen',
      email: 'riley.chen@example.com',
      phone: '+1 905-555-0142',
      country: 'CA',
      source: 'website',
      status: 'new',
      tags: [],
      createdAt: iso(-7200000),
    },
    {
      id: 'lead_005',
      name: 'Jamie Ortiz',
      email: 'jamie.ortiz@example.com',
      country: 'CA',
      source: 'website',
      status: 'lost',
      tags: ['returns'],
      createdAt: iso(-86400000 * 5),
      notes: 'Policy clarification only.',
    },
    {
      id: 'lead_006',
      name: 'Casey Kim',
      email: 'casey.kim@example.com',
      phone: '+1 613-555-0199',
      country: 'CA',
      source: 'whatsapp',
      status: 'contacted',
      tags: ['quality'],
      createdAt: iso(-86400000 * 3),
    },
    {
      id: 'lead_007',
      name: 'Drew Martinez',
      email: 'drew.m@example.com',
      country: 'CA',
      source: 'instagram',
      status: 'new',
      tags: ['faq'],
      createdAt: iso(-1800000),
    },
    {
      id: 'lead_008',
      name: 'Quinn Adams',
      email: 'quinn.adams@example.com',
      phone: '+1 778-555-0110',
      country: 'CA',
      source: 'website',
      status: 'qualified',
      tags: ['repeat'],
      createdAt: iso(-86400000 * 7),
    },
    {
      id: 'lead_009',
      name: 'Avery Singh',
      email: 'avery.s@example.com',
      country: 'CA',
      source: 'website',
      status: 'new',
      tags: [],
      createdAt: iso(-5400000),
    },
    {
      id: 'lead_010',
      name: 'Parker Walsh',
      email: 'parker.w@example.com',
      phone: '+1 403-555-0166',
      country: 'CA',
      source: 'whatsapp',
      status: 'contacted',
      tags: ['shipping', 'rural'],
      createdAt: iso(-86400000 * 4),
    },
  ]

  const conversations = [
    {
      id: 'conv_001',
      channel: 'website',
      status: 'ai_handling',
      subject: 'COA request for batch',
      customerName: 'Chris Nguyen',
      customerEmail: 'chris.nguyen@example.com',
      leadId: 'lead_001',
      assignedAgentId: null,
      aiEnabled: true,
      handoffId: null,
      lastMessageAt: iso(-600000),
      createdAt: iso(-3600000 * 3),
      updatedAt: iso(-600000),
      unreadCount: 1,
    },
    {
      id: 'conv_002',
      channel: 'whatsapp',
      status: 'handoff_pending',
      subject: 'Shipping to rural Ontario',
      customerName: 'Taylor Brooks',
      customerPhone: '+1 647-555-0188',
      leadId: 'lead_002',
      assignedAgentId: null,
      aiEnabled: false,
      handoffId: 'handoff_001',
      lastMessageAt: iso(-900000),
      createdAt: iso(-86400000),
      updatedAt: iso(-900000),
      unreadCount: 2,
    },
    {
      id: 'conv_003',
      channel: 'instagram',
      status: 'assigned',
      subject: 'Product catalog inquiry',
      customerName: 'Morgan Ellis',
      customerHandle: '@morgan_lab',
      leadId: 'lead_003',
      assignedAgentId: 'agent_002',
      aiEnabled: false,
      handoffId: 'handoff_002',
      lastMessageAt: iso(-1200000),
      createdAt: iso(-86400000 * 2),
      updatedAt: iso(-1200000),
      unreadCount: 0,
    },
    {
      id: 'conv_004',
      channel: 'website',
      status: 'open',
      subject: 'New chat — pricing',
      customerName: 'Riley Chen',
      customerEmail: 'riley.chen@example.com',
      leadId: 'lead_004',
      assignedAgentId: null,
      aiEnabled: true,
      handoffId: null,
      lastMessageAt: iso(-300000),
      createdAt: iso(-7200000),
      updatedAt: iso(-300000),
      unreadCount: 1,
    },
    {
      id: 'conv_005',
      channel: 'website',
      status: 'waiting_for_customer',
      subject: 'Return policy clarification',
      customerName: 'Jamie Ortiz',
      customerEmail: 'jamie.ortiz@example.com',
      leadId: 'lead_005',
      assignedAgentId: 'agent_003',
      aiEnabled: false,
      handoffId: 'handoff_003',
      lastMessageAt: iso(-86400000),
      createdAt: iso(-86400000 * 5),
      updatedAt: iso(-86400000),
      unreadCount: 0,
    },
    {
      id: 'conv_006',
      channel: 'whatsapp',
      status: 'resolved',
      subject: 'Quality summary explained',
      customerName: 'Casey Kim',
      customerPhone: '+1 613-555-0199',
      leadId: 'lead_006',
      assignedAgentId: 'agent_002',
      aiEnabled: false,
      handoffId: null,
      lastMessageAt: iso(-86400000 * 3),
      createdAt: iso(-86400000 * 4),
      updatedAt: iso(-86400000 * 3),
      resolvedAt: iso(-86400000 * 3),
      unreadCount: 0,
    },
    {
      id: 'conv_007',
      channel: 'instagram',
      status: 'ai_handling',
      subject: 'FAQ — shipping regions',
      customerName: 'Drew Martinez',
      customerHandle: '@drew_peptides',
      leadId: 'lead_007',
      assignedAgentId: null,
      aiEnabled: true,
      handoffId: null,
      lastMessageAt: iso(-450000),
      createdAt: iso(-3600000),
      updatedAt: iso(-450000),
      unreadCount: 1,
    },
    {
      id: 'conv_008',
      channel: 'website',
      status: 'assigned',
      subject: 'Repeat order support',
      customerName: 'Quinn Adams',
      customerEmail: 'quinn.adams@example.com',
      leadId: 'lead_008',
      assignedAgentId: 'agent_001',
      aiEnabled: false,
      handoffId: 'handoff_004',
      lastMessageAt: iso(-1800000),
      createdAt: iso(-86400000 * 7),
      updatedAt: iso(-1800000),
      unreadCount: 0,
    },
    {
      id: 'conv_009',
      channel: 'whatsapp',
      status: 'open',
      subject: 'Hello from WhatsApp link',
      customerName: 'Guest',
      leadId: null,
      assignedAgentId: null,
      aiEnabled: true,
      handoffId: null,
      lastMessageAt: iso(-240000),
      createdAt: iso(-240000),
      updatedAt: iso(-240000),
      unreadCount: 1,
    },
    {
      id: 'conv_010',
      channel: 'website',
      status: 'resolved',
      subject: 'Business hours',
      customerName: 'Avery Singh',
      customerEmail: 'avery.s@example.com',
      leadId: 'lead_009',
      assignedAgentId: 'agent_003',
      aiEnabled: false,
      handoffId: null,
      lastMessageAt: iso(-86400000 * 2),
      createdAt: iso(-86400000 * 2),
      updatedAt: iso(-86400000 * 2),
      resolvedAt: iso(-86400000 * 2),
      unreadCount: 0,
    },
    {
      id: 'conv_011',
      channel: 'whatsapp',
      status: 'ai_handling',
      subject: 'Delivery estimate — Alberta',
      customerName: 'Parker Walsh',
      customerPhone: '+1 403-555-0166',
      leadId: 'lead_010',
      assignedAgentId: null,
      aiEnabled: true,
      handoffId: null,
      lastMessageAt: iso(-720000),
      createdAt: iso(-86400000 * 4),
      updatedAt: iso(-720000),
      unreadCount: 0,
    },
    {
      id: 'conv_012',
      channel: 'instagram',
      status: 'handoff_pending',
      subject: 'Handoff test — complex order',
      customerName: 'Insta User',
      customerHandle: '@nexpept_fan',
      leadId: null,
      assignedAgentId: null,
      aiEnabled: false,
      handoffId: 'handoff_005',
      lastMessageAt: iso(-1500000),
      createdAt: iso(-7200000),
      updatedAt: iso(-1500000),
      unreadCount: 3,
    },
  ]

  const handoffs = [
    {
      id: 'handoff_001',
      conversationId: 'conv_002',
      status: 'pending',
      reason: 'Customer asked for human agent re: rural delivery',
      requestedAt: iso(-900000),
      claimedBy: null,
      claimedAt: null,
    },
    {
      id: 'handoff_002',
      conversationId: 'conv_003',
      status: 'claimed',
      reason: 'Bulk / institutional inquiry',
      requestedAt: iso(-86400000 * 2),
      claimedBy: 'agent_002',
      claimedAt: iso(-86400000 * 2 + 600000),
    },
    {
      id: 'handoff_003',
      conversationId: 'conv_005',
      status: 'claimed',
      reason: 'Policy exception question',
      requestedAt: iso(-86400000 * 5),
      claimedBy: 'agent_003',
      claimedAt: iso(-86400000 * 5 + 1200000),
    },
    {
      id: 'handoff_004',
      conversationId: 'conv_008',
      status: 'claimed',
      reason: 'Repeat customer — account help',
      requestedAt: iso(-86400000 * 7),
      claimedBy: 'agent_001',
      claimedAt: iso(-86400000 * 7 + 900000),
    },
    {
      id: 'handoff_005',
      conversationId: 'conv_012',
      status: 'pending',
      reason: 'Multi-line order — needs agent review',
      requestedAt: iso(-1500000),
      claimedBy: null,
      claimedAt: null,
    },
  ]

  const messages = [
    {
      id: 'msg_001',
      conversationId: 'conv_001',
      senderType: 'customer',
      senderId: null,
      content: 'Hi, can I get a COA for your latest BPC batch?',
      visibility: 'public',
      createdAt: iso(-3600000 * 3),
    },
    {
      id: 'msg_002',
      conversationId: 'conv_001',
      senderType: 'ai',
      senderId: 'ai',
      content:
        'Product Quality Summary is on the product page. Independent third-party COAs are available on request for select batches — I can note your request for the team.',
      visibility: 'public',
      createdAt: iso(-3500000),
    },
    {
      id: 'msg_003',
      conversationId: 'conv_001',
      senderType: 'customer',
      senderId: null,
      content: 'Please note it — batch listed as NP-2025-03.',
      visibility: 'public',
      createdAt: iso(-600000),
    },
    {
      id: 'msg_004',
      conversationId: 'conv_002',
      senderType: 'customer',
      senderId: null,
      content: 'Do you ship to very rural areas in Ontario?',
      visibility: 'public',
      createdAt: iso(-86400000 - 600000),
    },
    {
      id: 'msg_005',
      conversationId: 'conv_002',
      senderType: 'ai',
      senderId: 'ai',
      content:
        'We ship within Canada via Canada Post Xpresspost. Rural areas often take 3–5 business days.',
      visibility: 'public',
      createdAt: iso(-86400000 - 300000),
    },
    {
      id: 'msg_006',
      conversationId: 'conv_002',
      senderType: 'customer',
      senderId: null,
      content: 'I need a human to confirm for my postal code.',
      visibility: 'public',
      createdAt: iso(-900000),
    },
    {
      id: 'msg_007',
      conversationId: 'conv_002',
      senderType: 'system',
      senderId: 'system',
      content: 'Conversation queued for human handoff.',
      visibility: 'internal',
      createdAt: iso(-900000),
    },
    {
      id: 'msg_008',
      conversationId: 'conv_003',
      senderType: 'customer',
      senderId: null,
      content: 'Do you have a PDF catalog for labs?',
      visibility: 'public',
      createdAt: iso(-86400000 * 2),
    },
    {
      id: 'msg_009',
      conversationId: 'conv_003',
      senderType: 'agent',
      senderId: 'agent_002',
      content: 'Hi Morgan — I can email our research product overview. What is your best email?',
      visibility: 'public',
      createdAt: iso(-1200000),
    },
    {
      id: 'msg_010',
      conversationId: 'conv_004',
      senderType: 'customer',
      senderId: null,
      content: 'What is the price for 5mg vial?',
      visibility: 'public',
      createdAt: iso(-300000),
    },
    {
      id: 'msg_011',
      conversationId: 'conv_005',
      senderType: 'customer',
      senderId: null,
      content: 'Can I return an unopened vial?',
      visibility: 'public',
      createdAt: iso(-86400000 * 5),
    },
    {
      id: 'msg_012',
      conversationId: 'conv_005',
      senderType: 'agent',
      senderId: 'agent_003',
      content:
        'All sales are final due to product nature. If you have a quality concern, share your order ID and we will assist.',
      visibility: 'public',
      createdAt: iso(-86400000),
    },
    {
      id: 'msg_013',
      conversationId: 'conv_006',
      senderType: 'customer',
      senderId: null,
      content: 'How do you verify quality before listing?',
      visibility: 'public',
      createdAt: iso(-86400000 * 4),
    },
    {
      id: 'msg_014',
      conversationId: 'conv_006',
      senderType: 'ai',
      senderId: 'ai',
      content:
        'Every peptide product is lab-tested before listing. Untested products are not sold.',
      visibility: 'public',
      createdAt: iso(-86400000 * 3 - 3600000),
    },
    {
      id: 'msg_015',
      conversationId: 'conv_006',
      senderType: 'agent',
      senderId: 'agent_002',
      content: 'Happy to help further if you need batch-specific documentation.',
      visibility: 'public',
      createdAt: iso(-86400000 * 3),
    },
    {
      id: 'msg_016',
      conversationId: 'conv_007',
      senderType: 'customer',
      senderId: null,
      content: 'Do you ship outside Canada?',
      visibility: 'public',
      createdAt: iso(-450000),
    },
    {
      id: 'msg_017',
      conversationId: 'conv_007',
      senderType: 'ai',
      senderId: 'ai',
      content: 'We currently ship to addresses within Canada only.',
      visibility: 'public',
      createdAt: iso(-440000),
    },
    {
      id: 'msg_018',
      conversationId: 'conv_008',
      senderType: 'customer',
      senderId: null,
      content: 'I ordered last month — need invoice copy.',
      visibility: 'public',
      createdAt: iso(-86400000 * 7),
    },
    {
      id: 'msg_019',
      conversationId: 'conv_008',
      senderType: 'agent',
      senderId: 'agent_001',
      content: 'Sent to your email on file. Let me know if you need anything else.',
      visibility: 'public',
      createdAt: iso(-1800000),
    },
    {
      id: 'msg_020',
      conversationId: 'conv_009',
      senderType: 'customer',
      senderId: null,
      content: 'Hi, I came from your WhatsApp link.',
      visibility: 'public',
      createdAt: iso(-240000),
    },
    {
      id: 'msg_021',
      conversationId: 'conv_010',
      senderType: 'customer',
      senderId: null,
      content: 'Are you open on weekends?',
      visibility: 'public',
      createdAt: iso(-86400000 * 2 - 7200000),
    },
    {
      id: 'msg_022',
      conversationId: 'conv_010',
      senderType: 'agent',
      senderId: 'agent_003',
      content: 'Support replies Mon–Fri; orders may still ship per schedule on the site.',
      visibility: 'public',
      createdAt: iso(-86400000 * 2),
    },
    {
      id: 'msg_023',
      conversationId: 'conv_011',
      senderType: 'customer',
      senderId: null,
      content: 'How long to Calgary?',
      visibility: 'public',
      createdAt: iso(-720000),
    },
    {
      id: 'msg_024',
      conversationId: 'conv_011',
      senderType: 'ai',
      senderId: 'ai',
      content: 'Alberta typically 3–5 business days after same-day dispatch when in stock.',
      visibility: 'public',
      createdAt: iso(-710000),
    },
    {
      id: 'msg_025',
      conversationId: 'conv_012',
      senderType: 'customer',
      senderId: null,
      content: 'I want 3 different peptides in one order — can someone help?',
      visibility: 'public',
      createdAt: iso(-7200000),
    },
    {
      id: 'msg_026',
      conversationId: 'conv_012',
      senderType: 'ai',
      senderId: 'ai',
      content: 'I can start a cart guide — connecting you with a team member for complex orders.',
      visibility: 'public',
      createdAt: iso(-7100000),
    },
    {
      id: 'msg_027',
      conversationId: 'conv_012',
      senderType: 'system',
      senderId: 'system',
      content: 'Handoff requested — awaiting agent.',
      visibility: 'internal',
      createdAt: iso(-1500000),
    },
    {
      id: 'msg_028',
      conversationId: 'conv_012',
      senderType: 'customer',
      senderId: null,
      content: 'Also need storage guidance for lab use.',
      visibility: 'public',
      createdAt: iso(-1490000),
    },
    {
      id: 'msg_029',
      conversationId: 'conv_002',
      senderType: 'agent',
      senderId: 'agent_001',
      content: 'Checking Canada Post service map for your area.',
      visibility: 'internal',
      createdAt: iso(-800000),
    },
    {
      id: 'msg_030',
      conversationId: 'conv_003',
      senderType: 'agent',
      senderId: 'agent_002',
      content: 'Internal: verify institutional buyer before sending catalog.',
      visibility: 'internal',
      createdAt: iso(-1100000),
    },
    {
      id: 'msg_031',
      conversationId: 'conv_001',
      senderType: 'system',
      senderId: 'system',
      content: 'AI confidence low — monitor for handoff.',
      visibility: 'internal',
      createdAt: iso(-580000),
    },
    {
      id: 'msg_032',
      conversationId: 'conv_004',
      senderType: 'ai',
      senderId: 'ai',
      content: 'Pricing is shown on each product page in CAD. Which product are you viewing?',
      visibility: 'public',
      createdAt: iso(-290000),
    },
  ]

  const knowledge = [
    {
      id: 'kb_001',
      type: 'faq',
      title: 'Do you provide COAs?',
      body: 'Product Quality Summary is available on every product page. Independent third-party Certificates of Analysis are available upon request for select batches.',
      tags: ['quality', 'coa'],
      published: true,
      updatedAt: iso(-86400000 * 10),
      createdAt: iso(-86400000 * 30),
    },
    {
      id: 'kb_002',
      type: 'faq',
      title: 'Where do you ship?',
      body: 'We ship to addresses within Canada only via Canada Post Xpresspost for safe, discreet delivery.',
      tags: ['shipping'],
      published: true,
      updatedAt: iso(-86400000 * 8),
      createdAt: iso(-86400000 * 30),
    },
    {
      id: 'kb_003',
      type: 'faq',
      title: 'When will I get my order?',
      body: 'Most orders ship the same business day. GTA typically 1–2 business days; rural or remote areas 3–5 business days.',
      tags: ['shipping', 'delivery'],
      published: true,
      updatedAt: iso(-86400000 * 5),
      createdAt: iso(-86400000 * 25),
    },
    {
      id: 'kb_004',
      type: 'faq',
      title: 'How do you verify product quality?',
      body: 'Every peptide product is lab-tested before listing. If a product has not been tested, we do not sell it.',
      tags: ['quality'],
      published: true,
      updatedAt: iso(-86400000 * 4),
      createdAt: iso(-86400000 * 20),
    },
    {
      id: 'kb_005',
      type: 'faq',
      title: 'What is your return policy?',
      body: 'All sales are final due to the nature of our products. If you have a quality concern, contact us so we can assist.',
      tags: ['returns', 'policy'],
      published: true,
      updatedAt: iso(-86400000 * 3),
      createdAt: iso(-86400000 * 15),
    },
    {
      id: 'kb_006',
      type: 'article',
      title: 'Contact channels',
      body: 'Customers can reach us via website chat, WhatsApp (link on site), or Instagram DM. WhatsApp and Instagram open as external links (link_only mode).',
      tags: ['channels'],
      published: true,
      updatedAt: iso(-86400000 * 2),
      createdAt: iso(-86400000 * 12),
    },
    {
      id: 'kb_007',
      type: 'sop',
      title: 'Demo SOP — Handoff to human agent',
      body:
        'DEMO ONLY — NOT MEDICAL ADVICE. When a visitor asks for a human, set conversation to handoff_pending, disable AI, create one handoff record, and notify on-call agents. Do not provide health, dosing, or treatment guidance; route product documentation questions to published FAQs and COA-on-request workflow. Escalate quality concerns to a supervisor without making efficacy claims.',
      tags: ['sop', 'handoff', 'demo'],
      published: true,
      updatedAt: iso(-86400000),
      createdAt: iso(-86400000 * 6),
    },
    {
      id: 'kb_008',
      type: 'article',
      title: 'Research use disclaimer (support script)',
      body: 'NexPept products are for laboratory research use only. Support agents must not interpret research compounds for human consumption or make medical claims in chat.',
      tags: ['compliance', 'script'],
      published: true,
      updatedAt: iso(-43200000),
      createdAt: iso(-86400000 * 4),
    },
  ]

  const notifications = [
    {
      id: 'notif_001',
      type: 'handoff',
      title: 'Handoff waiting',
      body: 'Taylor Brooks — rural shipping (WhatsApp)',
      read: false,
      conversationId: 'conv_002',
      createdAt: iso(-900000),
    },
    {
      id: 'notif_002',
      type: 'handoff',
      title: 'Handoff waiting',
      body: 'Instagram user — multi-item order',
      read: false,
      conversationId: 'conv_012',
      createdAt: iso(-1500000),
    },
    {
      id: 'notif_003',
      type: 'new_message',
      title: 'New message',
      body: 'Chris Nguyen replied on website chat',
      read: false,
      conversationId: 'conv_001',
      createdAt: iso(-600000),
    },
    {
      id: 'notif_004',
      type: 'lead',
      title: 'New lead',
      body: 'Drew Martinez from Instagram',
      read: true,
      leadId: 'lead_007',
      createdAt: iso(-1800000),
    },
    {
      id: 'notif_005',
      type: 'new_message',
      title: 'New message',
      body: 'Riley Chen — pricing question',
      read: false,
      conversationId: 'conv_004',
      createdAt: iso(-300000),
    },
    {
      id: 'notif_006',
      type: 'system',
      title: 'Mock data loaded',
      body: 'Admin panel is using in-memory demo data.',
      read: true,
      createdAt: iso(-86400000),
    },
    {
      id: 'notif_007',
      type: 'new_message',
      title: 'WhatsApp guest message',
      body: 'New visitor from WhatsApp link',
      read: false,
      conversationId: 'conv_009',
      createdAt: iso(-240000),
    },
    {
      id: 'notif_008',
      type: 'lead',
      title: 'Lead updated',
      body: 'Quinn Adams marked qualified',
      read: true,
      leadId: 'lead_008',
      createdAt: iso(-86400000 * 7),
    },
  ]

  return {
    agents,
    leads,
    conversations,
    channels,
    messages,
    knowledge,
    notifications,
    handoffs,
    settings: loadPersistedSettings(),
    meta: { seededAt: new Date().toISOString() },
  }
}

/** @type {ReturnType<typeof seedState>} */
let state = seedState()

function nextId(prefix, existing) {
  const nums = existing
    .map((item) => {
      const match = String(item.id).match(new RegExp(`^${prefix}_(\\d+)$`))
      return match ? Number(match[1]) : 0
    })
    .filter((n) => n > 0)
  const max = nums.length ? Math.max(...nums) : 0
  return `${prefix}_${String(max + 1).padStart(3, '0')}`
}

export function notify() {
  const snapshot = getState()
  listeners.forEach((listener) => {
    try {
      listener(snapshot)
    } catch {
      /* subscriber error */
    }
  })
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState() {
  return {
    ...state,
    agents: state.agents.map((a) => ({ ...a, password: undefined })),
    currentUser: currentUser
      ? { ...currentUser, password: undefined }
      : null,
  }
}

function sanitizeAgent(agent) {
  if (!agent) return null
  const { password: _p, ...rest } = agent
  return rest
}

export function login(email, password) {
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase()
  const pwd = String(password || '')

  let agent = state.agents.find(
    (a) => a.email.toLowerCase() === normalizedEmail && a.password === pwd,
  )

  if (!agent && pwd.length >= 6 && normalizedEmail.includes('@')) {
    agent = state.agents.find((a) => a.email.toLowerCase() === normalizedEmail)
    if (!agent) {
      agent = {
        id: nextId('agent', state.agents),
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: pwd,
        role: 'agent',
        status: 'online',
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      state.agents.push(agent)
    }
  }

  if (!agent) {
    const err = new Error('Invalid email or password')
    err.code = 'AUTH_FAILED'
    throw err
  }

  currentUser = sanitizeAgent(agent)
  notify()
  return currentUser
}

export function logout() {
  currentUser = null
  notify()
}

export function getCurrentUser() {
  return currentUser ? { ...currentUser } : null
}

export function getDashboardSummary() {
  const openStatuses = [
    'open',
    'ai_handling',
    'handoff_pending',
    'assigned',
    'waiting_for_customer',
  ]
  const openConversations = state.conversations.filter((c) =>
    openStatuses.includes(c.status),
  )
  const pendingHandoffs = state.handoffs.filter((h) => h.status === 'pending')
  const unreadNotifications = state.notifications.filter((n) => !n.read).length
  const newLeads = state.leads.filter((l) => l.status === 'new').length

  const byChannel = state.conversations.reduce((acc, c) => {
    acc[c.channel] = (acc[c.channel] || 0) + 1
    return acc
  }, {})

  const byStatus = state.conversations.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  return {
    totals: {
      conversations: state.conversations.length,
      openConversations: openConversations.length,
      pendingHandoffs: pendingHandoffs.length,
      leads: state.leads.length,
      newLeads,
      unreadNotifications,
      knowledgeArticles: state.knowledge.length,
    },
    byChannel,
    byStatus,
    recentActivity: [...state.conversations]
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      )
      .slice(0, 5),
  }
}

/**
 * @param {{ status?: string, channel?: string, assignedAgentId?: string, search?: string }} [filters]
 */
export function listConversations(filters = {}) {
  let list = [...state.conversations]
  if (filters.status) {
    list = list.filter((c) => c.status === filters.status)
  }
  if (filters.channel) {
    list = list.filter((c) => c.channel === filters.channel)
  }
  if (filters.assignedAgentId) {
    list = list.filter((c) => c.assignedAgentId === filters.assignedAgentId)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(
      (c) =>
        c.subject?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.customerEmail?.toLowerCase().includes(q),
    )
  }
  return list.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  )
}

export function getConversation(id) {
  const conv = state.conversations.find((c) => c.id === id)
  if (!conv) {
    const err = new Error('Conversation not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  return { ...conv }
}

export function getMessages(conversationId) {
  return state.messages
    .filter((m) => m.conversationId === conversationId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((m) => ({ ...m }))
}

export function sendMessage(conversationId, payload) {
  const conv = state.conversations.find((c) => c.id === conversationId)
  if (!conv) {
    const err = new Error('Conversation not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  const content = String(payload?.content || '').trim()
  if (!content) {
    const err = new Error('Message content is required')
    err.code = 'VALIDATION'
    throw err
  }

  const message = {
    id: nextId('msg', state.messages),
    conversationId,
    senderType: payload.senderType || 'agent',
    senderId:
      payload.senderType === 'agent'
        ? currentUser?.id || payload.senderId || null
        : payload.senderId || null,
    content,
    visibility: payload.visibility === 'internal' ? 'internal' : 'public',
    createdAt: new Date().toISOString(),
  }

  state.messages.push(message)
  conv.lastMessageAt = message.createdAt
  conv.updatedAt = message.createdAt
  if (payload.senderType === 'customer') {
    conv.unreadCount = (conv.unreadCount || 0) + 1
  }

  notify()
  return { ...message }
}

export function updateConversation(id, patch) {
  const idx = state.conversations.findIndex((c) => c.id === id)
  if (idx === -1) {
    const err = new Error('Conversation not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  state.conversations[idx] = {
    ...state.conversations[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  notify()
  return { ...state.conversations[idx] }
}

function findActiveHandoffForConversation(conversationId) {
  return state.handoffs.find(
    (h) =>
      h.conversationId === conversationId &&
      (h.status === 'pending' || h.status === 'claimed'),
  )
}

/**
 * Atomic handoff: handoff_pending, ai off, notification, no duplicate active handoffs.
 */
export function requestHandoff(conversationId, reason = 'Customer requested human agent') {
  const conv = state.conversations.find((c) => c.id === conversationId)
  if (!conv) {
    const err = new Error('Conversation not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  const existing = findActiveHandoffForConversation(conversationId)
  if (existing) {
    if (conv.status !== 'handoff_pending' && conv.status !== 'assigned') {
      conv.status = existing.status === 'claimed' ? 'assigned' : 'handoff_pending'
      conv.aiEnabled = false
      conv.handoffId = existing.id
      conv.updatedAt = new Date().toISOString()
    }
    notify()
    return { conversation: { ...conv }, handoff: { ...existing } }
  }

  const handoff = {
    id: nextId('handoff', state.handoffs),
    conversationId,
    status: 'pending',
    reason,
    requestedAt: new Date().toISOString(),
    claimedBy: null,
    claimedAt: null,
  }
  state.handoffs.push(handoff)

  conv.status = 'handoff_pending'
  conv.aiEnabled = false
  conv.handoffId = handoff.id
  conv.updatedAt = handoff.requestedAt

  state.messages.push({
    id: nextId('msg', state.messages),
    conversationId,
    senderType: 'system',
    senderId: 'system',
    content: 'Conversation queued for human handoff.',
    visibility: 'internal',
    createdAt: handoff.requestedAt,
  })

  state.notifications.unshift({
    id: nextId('notif', state.notifications),
    type: 'handoff',
    title: 'Handoff waiting',
    body: `${conv.customerName || 'Customer'} — ${conv.subject || 'Support chat'}`,
    read: false,
    conversationId,
    createdAt: handoff.requestedAt,
  })

  notify()
  return { conversation: { ...conv }, handoff: { ...handoff } }
}

export function claimHandoff(id, agentId) {
  const handoff = state.handoffs.find((h) => h.id === id)
  if (!handoff) {
    const err = new Error('Handoff not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  if (handoff.status !== 'pending') {
    const err = new Error('Handoff is not available to claim')
    err.code = 'CONFLICT'
    throw err
  }

  const agent = state.agents.find((a) => a.id === agentId)
  if (!agent) {
    const err = new Error('Agent not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  handoff.status = 'claimed'
  handoff.claimedBy = agentId
  handoff.claimedAt = new Date().toISOString()

  const conv = state.conversations.find((c) => c.id === handoff.conversationId)
  if (conv) {
    conv.status = 'assigned'
    conv.assignedAgentId = agentId
    conv.aiEnabled = false
    conv.handoffId = handoff.id
    conv.updatedAt = handoff.claimedAt
  }

  notify()
  return { handoff: { ...handoff }, conversation: conv ? { ...conv } : null }
}

export function resolveConversation(id) {
  const conv = state.conversations.find((c) => c.id === id)
  if (!conv) {
    const err = new Error('Conversation not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  const ts = new Date().toISOString()
  conv.status = 'resolved'
  conv.resolvedAt = ts
  conv.updatedAt = ts
  conv.unreadCount = 0

  const handoff = state.handoffs.find(
    (h) => h.conversationId === id && h.status === 'claimed',
  )
  if (handoff) {
    handoff.status = 'completed'
    handoff.completedAt = ts
  }

  notify()
  return { ...conv }
}

export function reopenConversation(id) {
  const conv = state.conversations.find((c) => c.id === id)
  if (!conv) {
    const err = new Error('Conversation not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  conv.status = conv.assignedAgentId ? 'assigned' : 'open'
  delete conv.resolvedAt
  conv.updatedAt = new Date().toISOString()
  notify()
  return { ...conv }
}

export function returnToAI(id) {
  const conv = state.conversations.find((c) => c.id === id)
  if (!conv) {
    const err = new Error('Conversation not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  const active = findActiveHandoffForConversation(id)
  if (active) {
    active.status = 'cancelled'
    active.cancelledAt = new Date().toISOString()
  }

  conv.status = 'ai_handling'
  conv.aiEnabled = true
  conv.assignedAgentId = null
  conv.handoffId = null
  conv.updatedAt = new Date().toISOString()

  state.messages.push({
    id: nextId('msg', state.messages),
    conversationId: id,
    senderType: 'system',
    senderId: 'system',
    content: 'Conversation returned to AI assistant.',
    visibility: 'internal',
    createdAt: conv.updatedAt,
  })

  notify()
  return { ...conv }
}

export function listHandoffs() {
  return state.handoffs
    .map((h) => {
      const conv = state.conversations.find((c) => c.id === h.conversationId)
      return {
        ...h,
        conversation: conv ? { ...conv } : null,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    )
}

export function listLeads() {
  return [...state.leads].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getLead(id) {
  const lead = state.leads.find((l) => l.id === id)
  if (!lead) {
    const err = new Error('Lead not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  return { ...lead }
}

export function listKnowledge(filters = {}) {
  let list = [...state.knowledge]
  if (filters.type) list = list.filter((k) => k.type === filters.type)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.body.toLowerCase().includes(q) ||
        k.tags?.some((t) => t.toLowerCase().includes(q)),
    )
  }
  if (filters.published != null) {
    list = list.filter((k) => k.published === filters.published)
  }
  return list.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function createKnowledge(data) {
  const item = {
    id: nextId('kb', state.knowledge),
    type: data.type || 'faq',
    title: String(data.title || '').trim(),
    body: String(data.body || '').trim(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    published: data.published !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (!item.title) {
    const err = new Error('Title is required')
    err.code = 'VALIDATION'
    throw err
  }
  state.knowledge.push(item)
  notify()
  return { ...item }
}

export function updateKnowledge(id, patch) {
  const idx = state.knowledge.findIndex((k) => k.id === id)
  if (idx === -1) {
    const err = new Error('Knowledge item not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  state.knowledge[idx] = {
    ...state.knowledge[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  notify()
  return { ...state.knowledge[idx] }
}

export function deleteKnowledge(id) {
  const idx = state.knowledge.findIndex((k) => k.id === id)
  if (idx === -1) {
    const err = new Error('Knowledge item not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  const [removed] = state.knowledge.splice(idx, 1)
  notify()
  return { ...removed }
}

export function listNotifications() {
  return [...state.notifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function markNotificationRead(id) {
  const notif = state.notifications.find((n) => n.id === id)
  if (!notif) {
    const err = new Error('Notification not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  notif.read = true
  notify()
  return { ...notif }
}

export function markAllNotificationsRead() {
  state.notifications.forEach((n) => {
    n.read = true
  })
  notify()
  return listNotifications()
}

export function getUnreadNotificationCount() {
  return state.notifications.filter((n) => !n.read).length
}

export function listAgents() {
  return state.agents.map((a) => sanitizeAgent(a))
}

export function createAgent(data) {
  const email = String(data.email || '').trim().toLowerCase()
  if (state.agents.some((a) => a.email.toLowerCase() === email)) {
    const err = new Error('Agent with this email already exists')
    err.code = 'CONFLICT'
    throw err
  }
  const agent = {
    id: nextId('agent', state.agents),
    name: String(data.name || '').trim() || email,
    email,
    password: String(data.password || 'changeme'),
    role: data.role === 'admin' ? 'admin' : 'agent',
    status: data.status || 'offline',
    avatar: data.avatar || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  state.agents.push(agent)
  notify()
  return sanitizeAgent(agent)
}

export function updateAgent(id, patch) {
  const idx = state.agents.findIndex((a) => a.id === id)
  if (idx === -1) {
    const err = new Error('Agent not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  const { password, ...safePatch } = patch
  state.agents[idx] = {
    ...state.agents[idx],
    ...safePatch,
    ...(password ? { password: String(password) } : {}),
    updatedAt: new Date().toISOString(),
  }
  notify()
  return sanitizeAgent(state.agents[idx])
}

export function getSettings() {
  return { ...state.settings }
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch }
  persistSettings(state.settings)
  notify()
  return { ...state.settings }
}

export function getChannels() {
  return state.channels.map((c) => ({ ...c }))
}

export function updateChannel(channelType, patch) {
  const idx = state.channels.findIndex((c) => c.type === channelType)
  if (idx === -1) {
    const err = new Error('Channel not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  state.channels[idx] = {
    ...state.channels[idx],
    ...patch,
    type: channelType,
    updatedAt: new Date().toISOString(),
  }
  notify()
  return { ...state.channels[idx] }
}

/** Reset store to seed data (optional dev helper). */
export function resetMockStore() {
  state = seedState()
  currentUser = null
  notify()
}
