# English Buddy 🎓

**AI-powered English conversation app for kids** — built as a Sisense Builder Evangelist assignment demo.

## What Is This?

English Buddy is a voice-first English tutor for kids (ages 8-12) learning English as a second language. Kids pick a topic, chat with an AI character, and improve their English through natural conversation.

**But this repo isn't just about the app.** It's a demonstration of how a solo builder can go from zero to investor-ready analytics using **Sisense + AI tools**.

## The Story

I vibe-coded this app in 3 days using Claude Code. Then I connected Sisense's MCP Server to Claude Desktop, pointed it at my production database, and within minutes I was asking natural language questions about my users — and getting visual charts with AI insights back.

No dashboard building. No SQL. Just conversation.

## What's Inside

```
app/                  → Next.js app (the English tutor)
docs/
  STRATEGY.md         → Strategy document (audience, channels, PLG)
  PRD.md              → Product requirements
  SETUP_GUIDE.md      → Step-by-step technical setup guide
  CLAUDE_DESKTOP_CONTEXT.md → Prompt template for Claude Desktop analytics
server/
  schema.sql          → PostgreSQL database schema
scripts/
  seed-synthetic-data.js → Generates 200 users of realistic app data
```

## Live Demo

- **App:** [English Buddy on Vercel](https://app-dxu57gif6-eladizen-7580s-projects.vercel.app)
- **Video:** [link to video]

## Tech Stack

| Component | Technology |
|-----------|-----------|
| App | Next.js + Tailwind CSS |
| AI Chat | Claude API (Anthropic) |
| Voice | OpenAI TTS + Web Speech API |
| Database | PostgreSQL on Neon |
| Analytics | Sisense Live Connect + MCP Server |
| AI Analytics | Claude Desktop + Sisense MCP |
| Hosting | Vercel |

## Quick Start

### Run the app locally

```bash
cd app
npm install
cp .env.example .env.local  # Add your API keys
npm run dev
```

### Seed the database

```bash
npm install pg
DATABASE_URL="your-postgres-connection-string" node scripts/seed-synthetic-data.js
```

### Connect Sisense

See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for the complete walkthrough.

## Assignment Deliverables

| Part | Weight | Deliverable |
|------|--------|-------------|
| Strategy | 30% | [docs/STRATEGY.md](docs/STRATEGY.md) |
| Build | 40% | This repo + live app + Sisense integration |
| Story | 30% | Video walkthrough |

---

Built with Claude Code, Claude API, OpenAI TTS, Sisense, and a lot of coffee ☕
