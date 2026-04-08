# Design Changes Log — UI Redesign + UX Improvements
## Done by: Design Claude instance (2026-04-07)
## Approved by: Elad

---

## Summary

Full UI redesign to match kid-friendly reference apps (QuizzyKids, groo theme, kids quiz apps), plus character overhaul and system prompt rewrite. All changes were approved by the user, including items that went beyond the original Tailwind-only scope in `DESIGN_CONTEXT.md`.

---

## Approved Exceptions (outside original scope)

The following changes go beyond "Tailwind CSS only" but were **explicitly approved by the user**:

1. **Play-again button** — added a replay button on assistant messages (calls existing `speak()`)
2. **Character emoji/personality changes** — edited `app/lib/characters.ts` (normally owned by the other instance)
3. **System prompt rewrite** — edited `app/app/api/chat/route.ts` and `app/app/api/chat-stream/route.ts`
4. **Switch character button** — added a button in chat header to go back to character select
5. **Audio pause on unlock** — added logic to pause TTS when unlock screen triggers

---

## All Files Changed

### `app/app/globals.css`
- Removed dark mode override (app is always light/warm)
- Changed root colors to warm cream (`#fdf6ee`) and dark brown (`#3d2c1e`)
- Added custom animations: `float`, `wiggle`, `pop-in`, `shimmer`
- Added utility classes: `.animate-float`, `.animate-wiggle`, `.animate-pop-in`, `.animate-shimmer`

### `app/app/layout.tsx`
- Updated metadata title: "Create Next App" → "English Buddy"
- Updated description: → "Learn English with a friend!"

### `app/app/page.tsx` — Full styling overhaul per screen

#### Welcome Screen
- Background: cold blue→purple gradient → warm cream (`#fdf6ee`) with soft blurred decorative circles
- Card: `white` → `white/80` with backdrop blur, amber border, `rounded-3xl`
- Input: blue accents → amber accents, larger padding, warm placeholder color
- Button: `blue-500` → `amber-500` with shadow glow and hover lift animation

#### Character Select Screen
- Warm cream background with decorative blurs
- Cards: larger padding (`p-5`), `rounded-3xl`, amber borders, pop-in stagger animation
- Selected state: amber ring + checkmark indicator
- Progress bar: wrapped in a frosted card, amber color scheme
- Added subtitle text "Pick a friend to chat with"

#### Question Cards Screen
- Warm cream background
- Each card gets a different pastel tint (purple, amber, emerald) for visual variety
- Larger emoji (`text-5xl`), bolder text, pop-in animations with stagger
- Skip button: subtle amber text instead of white

#### Chat Screen
- Background: `gray-50` → warm cream (`#fdf6ee`)
- Header: character gradient → frosted white (`bg-white/80 backdrop-blur`) with amber accents
- **New: 🔄 switch character button** (circular, next to "New Question")
- User bubbles: `blue-500` → `amber-500` with warm shadow
- AI bubbles: white with soft shadow, amber accent text, border
- **New: 🔄 replay button** on each assistant message (circular, `w-10 h-10`)
- Loading indicator: "thinking..." text → 3 animated bouncing amber dots
- Quick responses: gray border → amber border, semibold font, shadow
- Mic button: `blue-500` → `amber-500`, speaking state → `purple-500`
- Progress bar: `white/20` → `amber-100` fill

#### Feedback Screen
- Warm cream background with decorative blurs
- Added wiggle-animated thinking emoji (🤔) as header decoration
- Added subtitle "Help me pick the right level for you"
- Buttons: pastel backgrounds with matching borders (emerald, amber, purple)
- Pop-in stagger animation

#### Unlock Screen
- Background: `yellow→orange` gradient → warm cream with gradient to `amber-50`
- 8 floating celebration emoji decorations (🎉⭐🥳🎊✨🌟🎈💫)
- Warm glow blurs in background
- Content wrapped in frosted card with pop-in animation
- Larger emoji (`text-[6rem]`), wiggling 🎉🎉🎉 row
- Pulsing CTA button
- **Audio pauses** when unlock screen appears (clears queue, stops playback)

### `app/lib/characters.ts` — Full character overhaul

**Old (animals with gimmicky speech):**
| Emoji | Name | Personality |
|-------|------|-------------|
| 🐱 | Lily | Cat, says "purr-fect!" and "meow-velous!" |
| 🐕 | Max | Dog, says "woof!" and "pawsome!" |
| 🤖 | Zap | Robot, says "beep boop" |
| 🦉 | Luna | Owl, says "did you know?" |
| 🦖 | Rex | Dinosaur, says "RAWR!" |

**New (human teenagers, natural speech):**
| Emoji | Name | Personality |
|-------|------|-------------|
| 👩‍🦰 | Mia | Friendly and curious, warm and encouraging |
| 👦 | Jake | Upbeat and sporty, like a supportive older brother |
| 🧑‍🎤 | Sam | Creative, loves music/art, relaxed and cool |
| 👩‍🎓 | Nina | Smart and kind, shares fun facts, patient |
| 🧑‍🚀 | Leo | Adventurous and energetic, fun older friend |

### `app/app/api/chat-stream/route.ts` + `app/app/api/chat/route.ts` — System prompt rewrite

**Old approach:** Teacher mode. "Keep sentences SHORT (5-8 words max)", "gently correct grammar", "Introduce 1-2 new vocabulary words".

**New approach:** Cool older friend. Key changes:
- **Has opinions and hot takes** — "Pizza? Ok but honestly tacos are better. Change my mind!"
- **Tells stories and fun facts** — "Did you know some people put fries ON pizza?"
- **Corrects casually** — "We say 'I went' not 'I goed' — English is weird like that"
- **Follows the kid's energy** — doesn't railroad the conversation
- **Explicitly banned**: sounding like a textbook, generic praise, quiz-style questions
- **Still teaches** but sneaks it in naturally instead of making it the focus

---

## Design System Summary

| Element | Old | New |
|---------|-----|-----|
| Primary bg | `blue-400` → `purple-500` gradient | Warm cream `#fdf6ee` |
| Primary action | `blue-500` | `amber-500` |
| Text primary | white | `amber-800/900` |
| Text secondary | `white/70-80` | `amber-600/60` |
| Cards | white, `rounded-2xl` | `white/80` backdrop-blur, `rounded-3xl`, amber border |
| Shadows | `shadow-lg` | Soft custom `0_4px_20px_rgba(0,0,0,0.06)` |
| Animations | minimal (bounce, pulse) | float, wiggle, pop-in with stagger delays |
| Chat user bubble | `blue-500` | `amber-500` |
| Chat AI bubble | white, `shadow-sm` | white, soft shadow, amber accents |
| Mic button | `blue-500` | `amber-500` (speaking: `purple-500`) |
| Characters | Animals with gimmicks | Human teenagers, natural speech |
| AI personality | Teacher mode | Cool older friend |

---

## Note for other Claude instance

- `localStorage` keys for characters use the old IDs (`lily`, `max`, etc.) — returning users may need to clear localStorage
- The system prompt is now significantly different — if you modify it, preserve the "cool friend, not teacher" vibe
- The character `color` field (gradient) is still used in the code but currently only affects the unlock screen celebration — the chat header now uses frosted white instead of the character gradient
