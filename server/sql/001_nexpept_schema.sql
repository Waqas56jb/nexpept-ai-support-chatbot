-- NexPept support chatbot schema (prefixed tables only)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS nexpept_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexpept_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  source text CHECK (source IN ('website', 'whatsapp', 'instagram')),
  status text NOT NULL DEFAULT 'new',
  notes text,
  conversation_count int NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexpept_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES nexpept_leads(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'website' CHECK (channel IN ('website', 'whatsapp', 'instagram')),
  status text NOT NULL DEFAULT 'open' CHECK (
    status IN (
      'open',
      'ai_handling',
      'handoff_pending',
      'assigned',
      'waiting_for_customer',
      'resolved'
    )
  ),
  priority text,
  assigned_agent_id uuid REFERENCES nexpept_agents(id) ON DELETE SET NULL,
  ai_enabled boolean NOT NULL DEFAULT true,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_handle text,
  subject text,
  last_message text,
  unread_count int NOT NULL DEFAULT 0,
  handoff_requested_at timestamptz,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

CREATE TABLE IF NOT EXISTS nexpept_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES nexpept_conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'ai', 'agent', 'system')),
  sender_id uuid,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
  ai_generated boolean NOT NULL DEFAULT false,
  delivery_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexpept_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES nexpept_conversations(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'resolved')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES nexpept_agents(id) ON DELETE SET NULL,
  priority text
);

CREATE TABLE IF NOT EXISTS nexpept_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'faq' CHECK (type IN ('faq', 'article', 'sop')),
  question text,
  answer text,
  title text,
  summary text,
  content text,
  category text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  tags text[] NOT NULL DEFAULT '{}',
  source_reference text,
  updated_by uuid REFERENCES nexpept_agents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexpept_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  conversation_id uuid REFERENCES nexpept_conversations(id) ON DELETE SET NULL,
  recipient_agent_id uuid REFERENCES nexpept_agents(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nexpept_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_name text,
  greeting text,
  team_name text,
  header_title text,
  avatar_url text,
  online_status text,
  show_faqs boolean NOT NULL DEFAULT true,
  enable_human_handoff boolean NOT NULL DEFAULT true,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexpept_messages_conversation_id ON nexpept_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_nexpept_messages_created_at ON nexpept_messages (created_at);

CREATE INDEX IF NOT EXISTS idx_nexpept_conversations_status ON nexpept_conversations (status);
CREATE INDEX IF NOT EXISTS idx_nexpept_conversations_created_at ON nexpept_conversations (created_at);
CREATE INDEX IF NOT EXISTS idx_nexpept_conversations_channel ON nexpept_conversations (channel);

CREATE INDEX IF NOT EXISTS idx_nexpept_leads_email ON nexpept_leads (email);
CREATE INDEX IF NOT EXISTS idx_nexpept_leads_status ON nexpept_leads (status);
CREATE INDEX IF NOT EXISTS idx_nexpept_leads_created_at ON nexpept_leads (created_at);

CREATE INDEX IF NOT EXISTS idx_nexpept_handoffs_conversation_id ON nexpept_handoffs (conversation_id);
CREATE INDEX IF NOT EXISTS idx_nexpept_handoffs_status ON nexpept_handoffs (status);

CREATE INDEX IF NOT EXISTS idx_nexpept_notifications_created_at ON nexpept_notifications (created_at);
