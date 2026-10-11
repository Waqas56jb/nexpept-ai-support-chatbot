# NexPept Admin

React admin panel for the NexPept AI support chatbot. Uses an in-memory mock store by default (`VITE_USE_MOCK=true`).

## Run locally

```bash
cd admin
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Mock login

| Field    | Value              |
| -------- | ------------------ |
| Email    | `alex@nexpept.demo` |
| Password | `Demo@123`         |

## Environment

Copy `.env.example` to `.env` if you need to override defaults:

- `VITE_USE_MOCK=true` — use mock data (default when unset)
- `VITE_API_BASE_URL` — reserved for a future real API

## Build

```bash
npm run build
npm run preview
```

## Pages

Dashboard, Conversations (inbox), Handoffs, Leads, Notifications, Knowledge, Chatbot settings, Channels (WhatsApp & Instagram), Agents, Account settings.
