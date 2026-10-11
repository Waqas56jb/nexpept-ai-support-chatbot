# NexPept support API

Express backend for the NexPept AI support chatbot admin panel and website widget. All Postgres tables use the `nexpept_` prefix so this project can share a Supabase database safely.

## Prerequisites

- Node.js 18+
- Postgres connection (Supabase direct connection or `DATABASE_URL`)

## Setup

```bash
cd server
cp .env.example .env
# Edit .env with your Supabase/Postgres credentials (do not commit .env)
npm install
```

## Database

Run migrations (creates `nexpept_*` tables only — `CREATE IF NOT EXISTS`, no drops):

```bash
npm run db:migrate
```

Seed demo admin, settings, and FAQs:

```bash
npm run db:seed
```

Demo login after seed:

- Email: `alex@nexpept.demo`
- Password: `Demo@123`

## Run

Development (auto-reload):

```bash
npm run dev
```

Production:

```bash
npm start
```

Default port: **4000** (`PORT` in `.env`).

Health check: `GET http://localhost:4000/api/health`

## Auth (demo)

- `POST /api/auth/login` with `{ "email", "password" }` → `{ user }`
- Optional: send `x-agent-id: <uuid>` on admin requests (and `GET /api/auth/me`)

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (preferred) |
| `SUPABASE_DB_*` | Alternative host/user/password parts |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Optional Supabase client |
| `OPENAI_API_KEY` | OpenAI key for professional on-topic support replies |
| `OPENAI_MODEL` | Model id (default `gpt-4o-mini`) |
