# English Buddy — Project Guide

## Project
AI English tutor for kids (8-12). Voice-first conversations with unlockable characters.

## Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js + Tailwind (`app/`) |
| AI Chat | Claude API → `app/api/chat-stream/route.ts` (streaming), `app/api/chat/route.ts` (fallback) |
| Voice | OpenAI TTS → `app/api/speak/route.ts`, Web Speech API for mic input |
| Database | PostgreSQL on Neon |
| Analytics | Sisense Live Connect + MCP Server |
| Hosting | Vercel |

## Key Files
```
app/app/page.tsx              — All UI (welcome, characters, chat, feedback)
app/lib/characters.ts         — 5 AI characters with voices + personalities
app/lib/questions.ts          — Question cards + A/B test sequences
app/app/api/chat-stream/      — Claude streaming chat with sentence-level TTS
app/app/api/speak/            — OpenAI TTS (voice per character)
server/schema.sql             — PostgreSQL schema (users, sessions, conversations, messages)
scripts/seed-synthetic-data.js — Generates 200 users of realistic data
docs/SETUP_GUIDE.md           — Sisense MCP integration guide
docs/CLAUDE_DESKTOP_CONTEXT.md — Prompt template for Sisense analytics
```

## Env Vars (`.env.local`)
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

## Run Locally
```bash
cd app && npm install && npm run dev  # runs on localhost:3001
```

## Deploy
```bash
cd app && vercel --prod --yes
```

## Database
- **Neon PostgreSQL** (free tier, EU Central)
- Connection: see Railway/Neon dashboard
- Schema: `server/schema.sql`
- Seed: `DATABASE_URL="..." node scripts/seed-synthetic-data.js`
- Tables: `users`, `sessions`, `conversations`, `messages`

## Architecture
```
Kid opens app → Vercel serves page
Kid speaks → Web Speech API transcribes → Claude API responds
AI speaks → OpenAI TTS generates audio → plays in browser
Data logged → Neon PostgreSQL
Analytics → Sisense reads PostgreSQL → MCP Server → Claude Desktop
```

## A/B Testing
- `sequence_A`: animals → food → activities → travel → feelings
- `sequence_B`: food → games → people → colors → dreams
- Users assigned randomly at creation, stored in `users.sequence_group`

## Characters (unlockable by message count)
| Name | Voice | Unlock |
|------|-------|--------|
| Mia 👩‍🦰 | nova | 0 |
| Jake 👦 | fable | 20 |
| Sam 🧑‍🎤 | echo | 50 |
| Nina 👩‍🎓 | shimmer | 100 |
| Leo 🧑‍🚀 | onyx | 150 |

## Rules
- AI responses: 1 sentence + 1 question, max ~15 words
- Mic: tap to start, tap to stop (manual control, never auto-cuts)
- Pressing mic while AI speaks stops audio immediately
- Pre-cached common opener phrases for instant first-word playback
- 400ms pause between TTS sentences
