# Habit Tracker — Design

## The one rule
**Logging a habit takes one tap, no extra screens.** Every feature gets judged by whether it slows that down.

## What's in v1
- **Opening the app shows Today.** No dashboard or splash screen: just today's habits as big tap targets.
- **Tap to mark a habit done. Tap again to undo.** No confirmations, notes or mood prompts.
- **Streak + 7-day strip** on each row, so you see progress without leaving the screen.
- **Adding a habit is one text field + one optional question.** Type a name, hit enter, and a sheet lets you attach a daily goal in a unit ("Drink water · 2 L"). Known words suggest units ("water" → L / oz / glasses / ml, "read" → pages / minutes, "walk" → steps / km / mi…) with a sensible goal filled in. "Other unit…" handles anything else, "No unit" skips it.
- **Every habit is done or not done.** The goal is just a label on the habit. No partial amounts to log. (We tried amount logging with +0.25 L buttons; it was more work per day than it was worth.)
- **All inputs use 16px text** so iPhones don't auto-zoom the page when you tap into one.
- **Tap the dots in the 7-day strip** to fix past days you forgot to log.
- **Offline, no account, no backend.** Data stays on the device (localStorage). Works as an installable PWA.
- **Export/import JSON** so data doesn't get stuck in one browser.

## Left out on purpose
| Feature | Why not (yet) |
|---|---|
| Accounts / sync | Adds a backend, auth and privacy work before there are any users. Export/import covers it for now. |
| Custom schedules (3x/week, weekdays) | Most-requested feature and the biggest complexity trap. Add it only after daily habits prove out. |
| Reminders / push | Web push is flaky on iOS. Build this in the native version. |
| Gamification (points, badges, levels) | Works for a week, then gets annoying. The streak is enough. |
| Categories, colors, icons | Setup busywork people do once and then abandon the app. |
| Charts / analytics | Nobody opens them after the first week. The 7-day strip covers 90% of it. |

## Data model
```json
{ "habits": [
  { "id": "h_x1", "name": "Meditate", "created": "2026-09-28", "done": ["2026-09-27", "2026-09-28"] },
  { "id": "h_x2", "name": "Drink water", "created": "2026-09-28", "unit": "L", "goal": 2, "done": ["2026-09-28"] }
] }
```
Unit suggestions come from a keyword list in `app.js` (`PRESETS`), not AI. It's instant, free and works offline, and a public site can't safely hold an AI API key.
Dates are local `YYYY-MM-DD` strings, so there are no timezone bugs.
A streak counts consecutive done days back from today. If today isn't done yet, it counts back from yesterday, so the streak doesn't show 0 all morning.

## Next steps, in order
1. Use it yourself every day for 2 weeks. Write down every bit of friction.
2. Add weekly-target habits ("3x/week") if you actually miss them.
3. If people other than you use it: wrap it with Capacitor or rewrite it in React Native / SwiftUI to get real reminders and home-screen widgets. **A widget where you tap to log without opening the app** is the real "easy" endgame.
