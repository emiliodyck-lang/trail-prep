# Habit Tracker — Design

## The one rule
**Logging a habit takes one tap, no extra screens.** Every feature gets judged by whether it slows that down.

## What's in v1
- **Home screen is a grid of big rings, 6 per page** (2 × 3), on a full-screen color gradient (Streaks-style). Each ring holds the habit's emoji as a white silhouette (or its first letter), with the name in bold caps underneath. Tap to complete: the ring turns solid white and the emoji shows in full color. Tap again to undo.
- **🎨 button** switches between 5 gradients (Violet, Sunset, Ocean, Forest, Night), remembered on the device.
- **Swipe left/right for more pages.** Habit 7 starts page 2, and so on. Dots at the bottom show which page you're on. Adding a habit jumps to its page.
- **Small + in the top right** opens "New habit": a name, then optionally a unit and daily goal ("Drink water · 2 L"). Known words suggest units as you type ("water" → L / oz / glasses / ml, "read" → pages / minutes, "walk" → steps / km / mi…). "Other unit…" handles anything else, "No unit" skips it.
- **Optional emoji per habit.** The New habit sheet suggests emojis from the name ("water" → 💧🥤🚰🧊, "guitar" → 🎸🎶; generic ⭐✅🎯 when nothing matches), and you can type your own or pick None. Holding a circle lets you change it later. 
- **Every habit is done or not done.** The goal is just a label. No partial amounts to log. (We tried +0.25 L logging; it was more daily work than it was worth.)
- **Search bar at the bottom** filters the circles by name.
- **Hold a circle** to open its menu: see the streak, tap any of the last 7 days to fix a day you forgot, or delete it.
- **Offline, no account, no backend.** Data stays on the device (localStorage). Installable PWA. Export/import JSON sits at the bottom of the New habit sheet.
- **All inputs use 16px text** so iPhones don't auto-zoom the page.

## Left out on purpose
| Feature | Why not (yet) |
|---|---|
| Accounts / sync | Adds a backend, auth and privacy work before there are any users. Export/import covers it for now. |
| Custom schedules (3x/week, weekdays) | Most-requested feature and the biggest complexity trap. Add it only after daily habits prove out. |
| Reminders / push | Web push is flaky on iOS. Build this in the native version. |
| Gamification (points, badges, levels) | Works for a week, then gets annoying. The streak is enough. |
| Categories, icons, picking colors | Setup busywork people do once and then abandon the app. Colors are assigned automatically. |
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
