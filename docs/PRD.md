# English Buddy — Product Requirements Document
## MVP for Sisense Demo — April 2026

---

## Overview

English Buddy is an AI-powered English conversation app for kids (ages 8-12) who are learning English as a second language. Each session starts with a visual question (3 image cards), the kid picks one, and a short AI conversation follows about that topic.

The app is the VEHICLE for the Sisense demo. The real deliverable is showing how Sisense provides analytics for a vibe-coded product.

---

## Core User Flow

```
Kid opens app
  → Enters name (no auth, just a name — persisted in localStorage)
  → Sees: Question + 3 image/illustration cards
  → Example: "What's your favorite food?" → [Pizza] [Ice Cream] [Hamburger]
  → Option to [Skip] if they don't like the question
  
Kid picks a card
  → Chat window opens with AI greeting related to the topic
  → AI speaks in simple English (A1-A2 level)
  → AI asks follow-up questions, teaches vocabulary
  → Kid types or selects from suggested responses
  
Kid can keep chatting as long as they want
  → "New Question!" button is always visible but optional
  → Kid can keep talking about current topic if they're enjoying it
  
When kid clicks "New Question!"
  → Difficulty feedback screen appears first:
    "How was that?"
    😊 "Too easy!" → next conversation uses harder vocabulary
    👍 "Just right!" → keeps same difficulty  
    😅 "Too hard!" → next conversation uses simpler words
  → Three big emoji buttons, kid taps one
  → Instantly shows next question + 3 cards
  → AI adapts difficulty based on feedback
  → Repeat

Session ends
  → Kid closes tab (no explicit end)
  → Or after X questions answered
```

---

## Question System

### Question Config (server-side)
Each question has:
- `id`: unique identifier
- `text`: the question in English ("What's your favorite food?")
- `options`: array of 3 choices, each with:
  - `label`: text ("Pizza")
  - `image`: URL or emoji/illustration reference
- `topic_tag`: for analytics ("food", "animals", "sports", "family")
- `difficulty`: 1-3 (vocabulary level)
- `sequence_group`: for A/B testing ("sequence_A", "sequence_B")

### A/B Testing
- Two (or more) question sequences configured on server
- New users randomly assigned to a sequence
- Same user always gets the same sequence
- Sisense shows: which sequence retains better

### Example Questions (MVP — 6 total, 2 sequences of 3)

**Sequence A:**
1. "What's your favorite animal?" → [Dog] [Cat] [Fish]
2. "What do you like to eat?" → [Pizza] [Ice Cream] [Pasta]
3. "What do you do after school?" → [Play] [Read] [Watch TV]

**Sequence B:**
1. "What do you like to eat?" → [Pizza] [Ice Cream] [Pasta]
2. "What's your favorite game?" → [Soccer] [Video Games] [Hide and Seek]
3. "Who is your best friend?" → [A boy] [A girl] [My pet]

---

## AI Tutor Behavior

### System Prompt Principles
- Speak in very simple English (A1-A2 CEFR level)
- Short sentences (5-8 words max)
- Use the topic the kid selected
- Ask one question at a time
- When the kid makes a grammar mistake, gently correct: "Great! We say 'I like pizza' — you're doing awesome!"
- Introduce 1-2 new vocabulary words per conversation
- Be encouraging and fun
- Use emojis sparingly

### Example Conversation
```
AI (spoken aloud): "You like pizza! Me too! 🍕 What is your favorite pizza?"
Kid (speaks into mic): "i like pizza cheez"
AI (spoken aloud): "Cheese pizza! Yummy! 🧀 We say 'cheese pizza'. Do you like it with tomato sauce?"
Kid (taps button): "Yes!"
AI (spoken aloud): "Great! Pizza with cheese and tomato sauce is called 'Margherita'. Can you say 'Margherita pizza'?"
```

---

## Voice Interaction

### How It Works
- **Speech-to-Text:** Browser's built-in Web Speech API (`SpeechRecognition`). Kid speaks, browser transcribes. No external service, no cost.
- **Text-to-Speech:** Browser's built-in Web Speech API (`SpeechSynthesis`). AI responses are spoken aloud automatically.
- **Subtitles:** All conversation text shown on screen as chat bubbles (so kid can read along)
- **Fallback buttons:** Pre-made response buttons always visible for common phrases: "Yes!", "No", "I don't know", "Tell me more", "Say it again". Kid is never stuck if mic doesn't catch something.

### Input Modes
The kid can respond in THREE ways (whichever feels natural):
1. **Speak** — tap mic button (or always-listening), browser transcribes
2. **Tap a quick response button** — "Yes!", "No", "I like it!", "I don't know"
3. **Type** — keyboard input for older/more confident kids (optional, small input field)

### Platform Support
- Chrome (desktop + Android): Full support
- Safari (iOS): SpeechRecognition has limited support — fallback to buttons + typing
- Firefox: SpeechRecognition not supported — fallback to buttons + typing

### Voice Settings
- Speech rate: slower than normal (0.8x) for kids learning
- Voice: pick a clear, friendly English voice from available system voices
- Language: en-US for recognition

---

## Data Model (for Sisense analytics)

### Tables

**users**
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment |
| name | VARCHAR | Kid's display name |
| sequence_group | VARCHAR | A/B test group ("sequence_A" or "sequence_B") |
| created_at | TIMESTAMP | First visit |
| last_seen_at | TIMESTAMP | Last activity |

**sessions**
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment |
| user_id | INT | FK to users |
| started_at | TIMESTAMP | Session start |
| ended_at | TIMESTAMP | Session end (or last activity + 5 min timeout) |
| questions_answered | INT | Count of topics picked |
| messages_sent | INT | Total messages in session |
| duration_seconds | INT | Session duration |

**conversations**
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment |
| session_id | INT | FK to sessions |
| user_id | INT | FK to users |
| question_id | VARCHAR | Which question was shown |
| selected_option | VARCHAR | Which card they picked |
| skipped | BOOLEAN | Did they skip this question |
| message_count | INT | Messages in this conversation |
| difficulty_rating | VARCHAR | "too_easy", "just_right", "too_hard", or NULL if not rated |
| difficulty_level | INT | 1-3, the difficulty used for this conversation |
| new_words_introduced | TEXT[] | Vocabulary taught |
| started_at | TIMESTAMP | When this conversation started |

**messages**
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Auto-increment |
| conversation_id | INT | FK to conversations |
| role | VARCHAR | "user" or "assistant" |
| content | TEXT | Message text |
| created_at | TIMESTAMP | When sent |

---

## Sisense Dashboard (The Deliverable)

### Charts to Build

1. **Retention Curve** — Day 1/3/7/14/30 retention by cohort
   - X: days since signup, Y: % of users returning
   - Split by sequence_group (A vs B)

2. **Session Funnel**
   - Opened app → Started conversation → 3+ messages → Completed 2+ topics → Returned next day
   - Shows where kids drop off

3. **A/B Test Results**
   - Sequence A vs B: retention at day 3 and day 7
   - Sequence A vs B: avg messages per session
   - Sequence A vs B: avg topics per session

4. **Topic Engagement**
   - Bar chart: messages per topic (which topics generate most conversation)
   - Skip rate per question (which questions kids skip)

5. **Vocabulary Growth**
   - Words introduced over time (cumulative)
   - Most common words taught

6. **Difficulty Adaptation**
   - Pie chart: % too_easy / just_right / too_hard ratings over time
   - Trend: are ratings shifting toward "just right" as AI adapts?
   - Correlation: kids who rate "too hard" churn faster (retention by rating)

---

## Synthetic Data Generator

A Node.js script that creates realistic fake data:
- 200 users over 30 days
- Split 50/50 into sequence_A and sequence_B
- Realistic retention: ~60% day 1, ~30% day 3, ~15% day 7, ~5% day 14
- Sequence B retains slightly better (to show A/B result)
- 2-5 sessions per retained user
- 1-4 topics per session
- 3-8 messages per conversation
- Some questions get skipped more than others

---

## Tech Stack

| Component | Tech | Hosting |
|-----------|------|---------|
| Frontend | Next.js + Tailwind CSS | Netlify |
| Backend/API | Node.js + Express + TypeScript | Railway |
| AI | Claude API (Anthropic SDK) | API calls |
| Database | PostgreSQL | Railway |
| Analytics | Sisense Compose SDK + MCP Server | Sisense Cloud (trial) |
| Design | Tailwind (or Google Stitch if viable) | — |

---

## What We DON'T Build (out of scope)

- User authentication (just a name in localStorage)
- ~~Real speech/audio~~ → INCLUDED (Web Speech API, browser-native)
- Progress tracking UI for the kid
- Parent account / login
- Mobile app (web only)
- Real A/B testing framework (just two hardcoded sequences)
- Production error handling
- Real vocabulary tracking (synthetic data covers this)

---

## Build Order

1. **Set up project** — Next.js app, Express server, Railway PostgreSQL
2. **Database schema** — Create tables above
3. **Question config** — JSON file with 6 questions, 2 sequences
4. **Chat UI** — Question cards + chat window (Tailwind)
5. **AI integration** — Claude API with tutor system prompt
6. **Logging** — Every message, session, conversation saved to DB
7. **Synthetic data** — Generator script, run once to populate
8. **Sisense connection** — Connect to PostgreSQL, build data model
9. **Sisense dashboard** — 5 charts from the list above
10. **Embed (optional)** — Compose SDK charts in an admin page
11. **Strategy doc** — Already written
12. **Record video** — 3 min Loom walkthrough
