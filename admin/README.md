# NexPept Admin

React admin panel for the NexPept AI support chatbot.

**Live:** [nexpept-ai-support-chatbot-admin.vercel.app](https://nexpept-ai-support-chatbot-admin.vercel.app/)

API is hardcoded to `https://nexpept-ai-support-chatbot-server.vercel.app/api` (no `.env` needed).

## Run locally

```bash
cd admin
npm install
npm run dev
```

## Login

| Field    | Value               |
| -------- | ------------------- |
| Email    | `alex@nexpept.demo` |
| Password | `Demo@123`          |

## Related URLs

| App    | URL |
| ------ | --- |
| Admin  | https://nexpept-ai-support-chatbot-admin.vercel.app |
| Client | https://nexpept-ai-support-chatbot.vercel.app |
| Server | https://nexpept-ai-support-chatbot-server.vercel.app |

## Build

```bash
npm run build
npm run preview
```

## Pages

Dashboard, Conversations (inbox), Handoffs, Leads, Notifications, Knowledge, Chatbot settings, Channels (WhatsApp & Instagram), Agents, Account settings.
