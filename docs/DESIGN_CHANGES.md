# Design Changes Log — UI Redesign (2026-04-07)

## Overview

The UI was redesigned to match kid-friendly reference apps (QuizzyKids, groo theme, kids quiz apps). All changes are **Tailwind CSS class changes only** — no structural or logic changes — with one exception noted below.

## Approved Exception: Play-Again Button

A "Play again" button was added to each assistant chat message. This was **approved by the user** even though it goes beyond the Tailwind-only scope in `DESIGN_CONTEXT.md`. The button calls the existing `speak(msg.content)` function — no new logic was written.

**Location:** Chat screen, inside each assistant message bubble.
**Code:** `<button onClick={() => speak(msg.content)}>🔊 Play again</button>`

## Files Changed

### `app/app/globals.css`
- Removed dark mode override (app is always light/warm)
- Changed root colors to warm cream (`#fdf6ee`) and dark brown (`#3d2c1e`)
- Added custom animations: `float`, `wiggle`, `pop-in`, `shimmer`
- Added corresponding utility classes: `.animate-float`, `.animate-wiggle`, `.animate-pop-in`, `.animate-shimmer`

### `app/app/page.tsx` — Styling changes per screen

#### Welcome Screen
- Background: cold blue-purple gradient → warm cream (`#fdf6ee`) with soft decorative blurred circles
- Card: white → white/80 with backdrop blur, amber border, rounded-3xl
- Input: blue accents → amber accents, larger padding
- Button: blue-500 → amber-500 with shadow glow and hover lift

#### Character Select Screen
- Same warm cream background with decorative blurs
- Cards: larger padding (p5), rounded-3xl, amber borders, pop-in animation with stagger
- Selected state: amber ring + checkmark indicator
- Progress bar: wrapped in a frosted card, amber colors

#### Question Cards Screen
- Warm cream background
- Each card gets a different pastel tint (purple, amber, emerald) for visual variety
- Larger emoji (text-5xl), bolder text, pop-in animations
- Skip button: subtle amber text instead of white

#### Chat Screen
- Background: gray-50 → warm cream (`#fdf6ee`)
- Header: gradient → frosted white (`bg-white/80 backdrop-blur`) with amber accents
- User bubbles: blue-500 → amber-500 with warm shadow
- AI bubbles: white with soft shadow, amber accent colors, border
- **New: "🔊 Play again" button** on each assistant message
- Loading indicator: "thinking..." text → animated bouncing dots (3 amber circles)
- Quick responses: gray border → amber border, semibold, shadow
- Mic button: blue-500 → amber-500, speaking state → purple-500
- Progress bar: white/20 → amber-100 fill

#### Feedback Screen
- Warm cream background with decorative blurs
- Added wiggle-animated thinking emoji (🤔) as header decoration
- Added subtitle text for context
- Buttons: pastel backgrounds with matching borders (emerald, amber, purple)
- Pop-in animation with stagger

#### Unlock Screen
- Background: yellow-orange gradient → warm cream with floating celebration emoji decorations
- Content wrapped in frosted card with pop-in animation
- Larger emoji (text-8xl)
- Button: white with orange text → amber-500 with white text, matching other screens

### `app/app/layout.tsx`
- Updated metadata title from "Create Next App" → "English Buddy"
- Updated description → "Learn English with a friend!"

## Design System Summary

| Element | Old | New |
|---------|-----|-----|
| Primary bg | blue-400 → purple-500 gradient | Warm cream `#fdf6ee` |
| Primary action | blue-500 | amber-500 |
| Text primary | white | amber-800/900 |
| Text secondary | white/70-80 | amber-600/60 |
| Cards | white, rounded-2xl | white/80 backdrop-blur, rounded-3xl, amber border |
| Shadows | shadow-lg | Soft custom `0_4px_20px_rgba(0,0,0,0.06)` |
| Animations | minimal (bounce, pulse) | float, wiggle, pop-in with stagger delays |
| Chat user bubble | blue-500 | amber-500 |
| Chat AI bubble | white, shadow-sm | white, soft shadow, amber accents |
| Mic button | blue-500 | amber-500 (speaking: purple-500) |
