# Habit Tracker — Design

## The one rule
**Logging a habit takes one tap, no extra screens.** Every feature gets judged by whether it slows that down.

## What's in v1
- **Home screen is a grid of big rings, 6 per page** (2 × 3), on a full-screen color gradient (Streaks-style). Each ring holds the habit's white icon (or custom emoji silhouette, or its first letter), with the name in bold caps underneath. The icon always stays white. Tap to complete: a slim white ring sweeps around the circle like a progress bar and a ✓ badge pops in. Tap again to undo (the ring sweeps back).
- **🎨 button** picks one of 25 gradients: Violet, Sunset, Ocean, Forest, Night, Black, Graphite, Silver, Blue, Navy, Sky, Teal, Mint, Green, Lemon, Gold, Orange, Red, Pink, Bubblegum, Purple, Lavender, Peach, Aurora, Tropical. Light ones (Silver, Sky, Mint, Lemon, Gold, Bubblegum, Lavender, Peach) switch text, rings and icons to near-black so everything stays readable. The picker is a slim bar with a swipeable row of colors over the undimmed home screen: each tap previews live, Done keeps it, Cancel or tapping the screen above reverts. Remembered on the device.
- **Swipe left/right for more pages.** Habit 7 starts page 2, and so on. Dots at the bottom show which page you're on. Adding a habit jumps to its page.
- **Small + in the top right** opens "New habit": a name, then optionally a unit and daily goal ("Drink water · 2 L"). Known words suggest units as you type ("water" → L / oz / glasses / ml, "read" → pages / minutes, "walk" → steps / km / mi…). "Other unit…" handles anything else, "No unit" skips it.
- **Optional icon per habit.** 471 one-color icons in two styles: 305 clean ones from [Phosphor](https://phosphoricons.com) (fill weight, MIT) plus a custom-drawn toothbrush, and 165 bolder, sportier figures from [Material Symbols](https://fonts.google.com/icons) (rounded filled, Apache 2.0; keys prefixed `m-`). Suggestions alternate the two styles. All bundled in `icons.js` so they work offline and look identical on every phone. The New habit sheet suggests icons from the name ("water" → drops, "read" → books, "dog" → dog; generic star / target / fire when nothing matches), "All icons" opens the full grid, and you can still type your own emoji as a fallback (shown as a white silhouette). Old emoji choices migrate to the matching icon automatically. Hold a circle to change it later.
- **How often** (add sheet and hold menu): **Every day**, **Specific days** (tap M T W T F S S; other days show faded as "Rest day", never count as missed, and can still be tapped for a bonus), or **N× a week** (tap on the days you do it; the ring fills 1/N per check-off and counts as done at N; streak counts weeks, "🔥 4 wk").
- **Every check-off is done or not done.** The unit goal ("2 L") is just a label.
- **Hold menu top row: Pause / Finish / Delete.** Pause hides the habit and pause days never count as missed (streak survives); Finish hides it but keeps history; both come back from Settings.
- **⚙ Settings** (replaced the palette button): Colors, reorder active habits (drag the ⠿ grip or use up/down arrows), paused habits (Resume), finished habits (Restore / Delete), Backup (Export / Import with "last backup" date). A dashed "Back up your habits" nudge appears on the home screen after 14 days without an export. The app also asks the browser for persistent storage.
- **📊 Stats button at the bottom** (replaced the search bar) opens a full stats screen:
  - **Swipe a carousel** at the top to pick what you're looking at: first slide is **All habits** (a row of mini rings; with more than 5 it slowly drifts and fades at the edges), then one slide per habit with a big ring. Dots show the position.
  - **Robinhood-style top block:** a big completion % for the period, a ▲/▼ change line ("▲ 12% past month": where the line ends vs where it started), the chart with no grid and a dotted line at the starting value, and period pills underneath: **1D** (today), **1W / 1M / 1Y** (last 7 / 30 / 365 days), **ALL**, **Custom** (a scrollable calendar: tap a start date, then an end date, then Apply; tapping Custom again re-opens it). Dragging the chart swaps the big number and change line for that point; lifting the finger snaps back. The other numbers, day-of-week and time-of-day follow below.
  - Every range uses the same layout (numbers, line chart, day-of-week bars, time of day). **Day** shows that day's completion (everything due that day, today included); its line and bars cover the week around it with the day highlighted, and time of day covers just that day.
  - **Completion rate** = check-offs done ÷ check-offs possible. 2 habits × 10 days = 20 possible; missing 2 = 18 of 20 = 90%. A habit only counts from the day it was created (or its earliest backfilled day). **Today only counts once it's done**, so the rate doesn't drop every morning.
  - Plain big numbers, no boxes. All habits: completion %, check-offs (done/possible), best streak (and which habit). One habit: completion %, days done, all-time total, current streak, longest streak.
  - **Completion line** (stock-chart style, area underneath): one point per day across exactly the picked period, smoothed with a rolling average that grows with the period (Week: each day, Month: 7-day, Year / All time: 30-day; custom by length), so dragging a finger moves smoothly day by day. Up to 5 date labels along the bottom (months like "May 2025" on long views). **Day** shows today hour by hour instead. No pinch-zoom: the range menu is the zoom, like the 1W / 1M / 1Y / All buttons in stock apps.
  - The chart always starts at the left edge: the range begins at the first day any selected habit existed, and the left label shows that date.
  - **Time of day** line (next to the weekday bars): check-offs per hour, smoothed over 3 hours. Times are recorded when you tap a circle for today (`times: { "YYYY-MM-DD": minutesAfterMidnight }`); backfilled days have no time.
  - **By day of the week** chart plus "Best on Mondays, weakest on Fridays", to show where you slip.
- **Hold a circle** to open its menu: tap the name at the top to rename it, see the streak, swipe through a day strip (today on the right, up to a year back, month labels on the 1st) and tap any day to fix it, change the emoji, or delete it.
- **Motion:** sheets slide up over a fading backdrop and slide back down; Stats slides in from the right; holding a circle slowly shrinks it toward the long-press, then springs back; buttons squish slightly on tap. All off when the phone's Reduce Motion setting is on.
- **Offline, no account, no backend.** Data stays on the device (localStorage). Installable PWA. Export/import JSON sits at the bottom of the New habit sheet.
- **All inputs use 16px text** so iPhones don't auto-zoom the page.

## Left out on purpose
| Feature | Why not (yet) |
|---|---|
| Accounts / sync | Adds a backend, auth and privacy work before there are any users. Export/import covers it for now. |
| Reminders / push | Web push is flaky on iOS. Build this in the native version. |
| Gamification (points, badges, levels) | Works for a week, then gets annoying. The streak is enough. |
| Categories, icons, picking colors | Setup busywork people do once and then abandon the app. Colors are assigned automatically. |
| Heavy analytics (trends, correlations, exports to charts) | The stats screen covers what's actionable; more is noise. |

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
