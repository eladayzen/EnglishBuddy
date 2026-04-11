# Context for Claude Desktop — Sisense MCP Analytics Session

Paste this into your first message to Claude Desktop when starting the analytics demo.

---

## THE PROMPT — COPY EVERYTHING BELOW THIS LINE

You have access to the Sisense MCP Server. You can query my data and build visual charts.

Here's what you need to know:

### The App: English Buddy
An AI-powered English conversation app for kids (ages 8-12) learning English as a second language. Kids pick a topic from 3 visual cards, then have a voice conversation with an AI character. After each conversation, they rate the difficulty (too easy / just right / too hard).

### The Database: EnglishBuddy (Live Model)
Connected to a PostgreSQL database with 30 days of user activity data. Use the data source called "EnglishBuddy".

### Tables and Fields

**users** (200 users)
- id, name — user identity
- sequence_group — either "sequence_A" or "sequence_B" (A/B test groups, 100 users each)
- difficulty_level — current difficulty (1-3)
- total_messages — lifetime messages sent
- total_sessions — lifetime sessions
- current_character — which AI character they use (mia, jake, sam, nina, leo)
- created_at — signup date (spread across 30 days starting March 8, 2026)
- last_seen_at — last activity date

**sessions** (~637 sessions)
- id, user_id — links to users
- started_at, ended_at — session timestamps
- questions_answered — topics picked in this session
- messages_sent — total messages in session
- duration_seconds — how long the session lasted
- device — "web"

**conversations** (~1,575 conversations)
- id, session_id, user_id — links
- question_id — which question was shown
- question_text — the question text
- selected_option — which card the kid picked
- skipped — true if kid skipped this question
- message_count — messages in this conversation
- difficulty_rating — "too_easy", "just_right", or "too_hard" (kid's feedback)
- difficulty_level — 1, 2, or 3
- topic_tag — "animals", "food", "activities", "travel", "feelings", "games", "people", "colors", "dreams"
- started_at — when this conversation started

**messages** (~7,649 messages)
- id, conversation_id, user_id
- role — "user" or "assistant"
- content — the message text
- created_at — timestamp

### A/B Test Setup
- sequence_A: starts with animals → food → activities → travel → feelings
- sequence_B: starts with food → games → people → colors → dreams
- Sequence B was designed to retain slightly better

### What I Want to Explore

Please help me answer these questions with charts:

1. **User Retention** — Show me how many users come back on day 1, day 3, day 7, and day 14 after signing up
2. **A/B Test Comparison** — Compare retention between sequence_A and sequence_B. Which one keeps kids coming back?
3. **Topic Engagement** — Which topics generate the most conversation? (messages per topic)
4. **Difficulty Distribution** — How are kids rating the difficulty? Are most saying "just right"?
5. **Session Depth** — How many topics do kids typically complete per session?
6. **Daily Active Users** — How many unique users are active each day over the 30-day period?

Start by listing the data sources to confirm you can see the EnglishBuddy model, then let's explore!
