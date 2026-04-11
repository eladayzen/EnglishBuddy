# Strategy: Sisense for the Vibe-Coding Builder
## Sisense Builder Evangelist Assignment — April 2026

---

## The Narrative

"I vibe-coded an AI-powered English tutor for kids using Claude Code. In three days, I had a working product with voice chat, character unlocking, A/B testing, and thousands of conversations logged. Then I needed analytics — retention curves, funnel breakdowns, A/B test results — the KPIs I need before going to market. I connected Sisense's MCP Server to Claude Desktop, pointed it at my production database, and within minutes I was asking natural language questions about my users and getting visual charts with AI insights. No dashboard building. No SQL. Just conversation."

---

## Part 1: Strategy (Who, Where, How)

### Target Audience

**Primary: Solo builders and indie developers** who've built (or are building) a product with AI tools — using Claude Code, Cursor, Replit Agent, or similar. They've shipped something real but don't have analytics yet.

These builders:
- Can write code (or have AI write it for them) but don't want to build custom analytics dashboards
- Need to understand retention, engagement, and conversion before spending money on user acquisition
- Want to impress investors with real KPIs, not just a demo
- Work fast — they'll adopt a tool they can set up in an afternoon, not one that takes a sprint

**Secondary: EdTech and AI-app builders** — anyone building conversational AI products (tutors, chatbots, companions) who need to measure conversation quality, engagement depth, and learning outcomes.

### Why This Audience for Sisense

The "vibe coder" is the new builder archetype — they move fast, ship fast, and need tools that match their speed. Sisense's MCP Server is uniquely positioned here: it lets AI agents (the same tools these builders already use) query production data and build charts through conversation. No other BI tool offers this.

The pitch isn't "replace your BI team" — it's "you don't need a BI team to start. Just connect your database and ask questions."

### Distribution Channels

1. **Twitter/X builder community** — Thread: "I vibe-coded an app in 3 days. Here's how I added analytics in 10 minutes with Sisense + Claude." Target: #buildinpublic, #vibecoding, indie dev community
2. **YouTube / Loom** — Technical walkthrough video (the one we built) showing the full flow from zero to charts
3. **IndieHackers** — "Show IH" post with the story + live demo link + GitHub repo
4. **r/startups, r/SaaS** — "How I got investor-ready analytics in one afternoon"
5. **Dev.to / Medium** — Tutorial format: "Add AI-Powered Analytics to Your App with Sisense MCP"
6. **AI tool communities** — Claude Discord, Cursor forums, Replit community — "Here's how to give your AI agent access to your production analytics"

### PLG Call to Action

**"Ship your analytics in a day, not a sprint."**

Sisense free trial → Connect your database → Install the MCP Server → Ask Claude about your data → See charts and insights in real time.

The key insight: builders don't want to BUILD dashboards. They want to ASK questions and GET answers. Sisense MCP makes that possible.

---

## Part 2: The Build

### What We Built

**English Buddy** — an AI-powered English conversation app for kids (ages 8-12) learning English as a second language.

**App features:**
- Voice-first interaction (OpenAI TTS + Web Speech API)
- Topic cards — kids pick from 3 visual choices, conversation flows from there
- 5 unlockable AI characters with different voices and personalities
- Difficulty adaptation based on kid feedback (too easy / just right / too hard)
- A/B testing — two different question sequences to test which retains better
- Progress system — message counter with character unlock milestones

**Tech stack:**
- Next.js + Tailwind CSS (Vercel)
- Claude API (Anthropic) for conversation
- OpenAI TTS for natural voice
- PostgreSQL on Neon for data storage
- Sisense (Live Connect + MCP Server) for analytics

**Analytics integration:**
- 200 synthetic users over 30 days, with realistic retention curves
- 637 sessions, 1,575 conversations, 7,649 messages
- A/B test groups with Sequence B retaining ~15% better
- Connected to Sisense via Live Model (PostgreSQL → Sisense → MCP → Claude Desktop)

**What Sisense enables:**
- "Show me user retention by cohort" → visual retention curve
- "Compare A/B test groups" → chart showing Sequence B wins
- "Which topics keep kids talking longest?" → topic engagement breakdown
- "How are difficulty ratings distributed?" → pie chart of feedback
- All powered by natural language through the MCP Server — no dashboard building required

### GitHub Repository

https://github.com/eladayzen/EnglishBuddy

Contains: app source code, synthetic data generator, database schema, setup guide, strategy docs, PRD.

---

## Part 3: The Story

### Video: "From Vibe-Coded App to Investor-Ready Analytics"

The video shows the complete journey:

1. **The app** — English Buddy in action, a kid chatting with an AI character
2. **The problem** — "I built this in 3 days with AI. But I can't go to market blind. I need to know: are kids coming back? What content works? Where do they drop off?"
3. **The setup** — Clone the MCP server, get a Sisense token, edit one config file, restart Claude Desktop. Done.
4. **The connection** — Connect Sisense to the production PostgreSQL database. Select tables. Publish.
5. **The magic** — Ask Claude Desktop questions about the data. Charts appear. AI insights explain what the data means. Retention curves, A/B test results, engagement metrics — all through conversation.
6. **The close** — "I went from zero analytics to investor-ready KPIs in one afternoon. That's the power of Sisense + AI."

### Why This Submission Stands Out

- **It's real, not a demo.** English Buddy is a working app that kids can use today.
- **It's built the way the target audience works.** Vibe-coded with AI tools, not hand-crafted over months.
- **The Sisense integration is genuine.** We're not embedding an iframe — we're using the MCP Server to have an AI conversation about production data.
- **The story is authentic.** A builder who needs analytics before launch — the exact persona Sisense should be reaching.
- **It showcases Sisense's unique advantage.** No other BI tool lets you query your data through an AI agent via MCP. This is Sisense's moat in the vibe-coding era.
