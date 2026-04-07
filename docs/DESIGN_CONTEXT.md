# Design Instance Context — English Buddy
## Read this first before doing any work

---

## What This Is

English Buddy is an AI-powered English conversation app for kids (ages 8-12) learning English as a second language. Each session starts with a visual question (3 image cards), the kid picks one, and a short AI conversation follows about that topic. The kid can speak via microphone or tap quick response buttons.

This is being built as a demo for a job application (Sisense Builder Evangelist). It needs to look polished enough for a 3-minute demo video.

---

## Your Job

Redesign the UI to look polished, fun, and kid-friendly. Think Duolingo meets a chat app. The user will provide design references — match that style.

**You only work in Tailwind CSS.** No new libraries. No component libraries. Just Tailwind classes.

---

## Files You Own

- `app/app/page.tsx` — the main (and only) page. All UI is here.
- `app/app/globals.css` — global styles if needed
- `app/components/*.tsx` — create component files here if you want to break up page.tsx

## Files You DO NOT Touch

- `app/app/api/*` — API routes (chat, speak, chat-stream)
- `app/lib/*` — questions config, characters config
- `docs/*` — documentation
- `server/*` — backend (doesn't exist yet)
- `scripts/*` — data scripts

## Before Editing page.tsx

The other Claude instance (working on backend/Sisense) may also need to edit page.tsx occasionally. **Always ask the user before making changes to page.tsx** so we don't create conflicts.

---

## Current App Structure (page.tsx)

The app has these screens/states:

1. **Welcome** (`state === "welcome"`) — Name input + "Let's Go!" button
2. **Character Select** (`state === "characters"`) — Grid of unlockable characters (emoji + name), progress bar to next unlock
3. **Question Cards** (`state === "question"`) — Question text + 3 option cards (emoji + label) + Skip button
4. **Chat** (`state === "chat"`) — Chat bubbles + quick response buttons + big mic button + progress bar in header
5. **Feedback** (`state === "feedback"`) — "How was that?" + 3 emoji buttons (too easy/just right/too hard)
6. **Unlock** (`state === "unlock"`) — Celebration screen when a new character is unlocked

## Characters

5 characters, each with emoji, name, color gradient, and voice:
- 🐱 Lily (pink-purple, starter)
- 🐕 Max (amber-orange, unlock at 20 messages)
- 🤖 Zap (cyan-blue, unlock at 50)
- 🦉 Luna (indigo-violet, unlock at 100)
- 🦖 Rex (green-emerald, unlock at 150)

## Key UI Elements

- **Chat header:** Character emoji + name + topic + "New Question" button + progress bar
- **Chat bubbles:** User messages (right, blue), AI messages (left, white with character name)
- **Quick responses:** "Yes!", "No", "I like it!", "I don't know", "Tell me more"
- **Mic button:** Big centered button, red when recording, blue when AI is speaking
- **Progress bar:** Shows progress toward unlocking next character (current emoji → bar → next emoji)

## Current Color Scheme

- Backgrounds: blue-to-purple gradient (welcome, questions, feedback)
- Chat: gray-50 background
- Each character has its own gradient color for the chat header

## What Needs Improvement

- Everything looks basic/default Tailwind
- Needs more personality — rounded corners, shadows, animations
- Card designs need more visual appeal
- Chat screen feels plain
- Welcome screen needs a better first impression
- The whole thing should feel like a fun kids app, not a developer prototype

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS (already configured)
- No other UI libraries

## How To Test

The app runs locally:
```
cd C:\Tests\EnglishBuddy\app
npx next dev -p 3002
```
Open http://localhost:3002

## Git

- Repo: https://github.com/eladayzen/EnglishBuddy
- Branch: master (we're all on master, no branching)
- Commit and push when you have a stable change
- Don't commit node_modules or .env.local
