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
cd C:\Tests\EnglishBuddy\app
npx next dev -p 3004
```
Dev port: **3004**. PowerShell: don't chain commands with `&&` — run separately. Working dir resets between Bash tool calls, so use absolute paths.

## Deploy
```bash
cd C:\Tests\EnglishBuddy\app
vercel --prod --yes
```
Live URL: https://app-dxu57gif6-eladizen-7580s-projects.vercel.app
Repo: https://github.com/eladayzen/EnglishBuddy

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
- AI responses: max **10 words** (tightened from 15 — old limit was ignored). Enforced in both `app/api/chat/route.ts` and `app/api/chat-stream/route.ts` system prompts.
- Mic: tap to start, tap to stop (manual control, `continuous=true`, never auto-cuts)
- Pressing mic while AI speaks stops audio immediately
- Pre-cached common opener phrases for instant first-word playback
- 400ms pause between TTS sentences (`PAUSE_BETWEEN_SENTENCES_MS`)

## Sisense Submission Status
DONE and submitted (April 2026). Greenhouse video + repo delivered. 200 synthetic users seeded to Neon, Sisense Live Model connected, MCP server at `C:\Tests\sisense-mcp-server` with Claude Desktop. Don't redo this work.

## Pending Work
**Stop-hint bubble** — when the kid taps the mic to record and doesn't tap again to stop, after ~1.5–2s show an animated (non-clickable) bubble near the mic button reminding them to tap again to stop.
- File: `app/app/page.tsx`
- Approach: add `showStopHint` state, `setTimeout` in `startListening` (~1500ms), clear in `stopListening`. Position absolutely near the mic button (bottom-center of chat screen, size-20). Tailwind `animate-bounce` or `animate-pulse`.
- Test locally on 3004 first, then deploy.

## Last Deployed State
AI word limit tightened to 10 words (see `api/chat/route.ts` and `api/chat-stream/route.ts`), deployed to Vercel, confirmed working.
