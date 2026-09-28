const KEY = 'habits.v1';
const PER_PAGE = 6;
const PALETTE = ['#ff6b6b', '#f59f00', '#12b886', '#4c6ef5', '#845ef7', '#e64980'];
const $ = id => document.getElementById(id);

// Background gradients: [top, middle, bottom]. Picked with the 🎨 button, remembered per device.
const THEMES = [
  ['Violet', '#5b7cfa', '#9b5de5', '#e05cb5'],
  ['Sunset', '#ff8a4c', '#ff4f7b', '#c2409b'],
  ['Ocean', '#2f6fe4', '#1596c9', '#12a88a'],
  ['Forest', '#11865f', '#2f9e44', '#7a9a12'],
  ['Night', '#262463', '#4a3fc4', '#8b3fd9'],
];
const THEME_KEY = 'habits.theme';
function applyTheme(i) {
  const [, a, b, c] = THEMES[i] || THEMES[0];
  const st = document.body.style;
  st.setProperty('--g1', a); st.setProperty('--g2', b); st.setProperty('--g3', c);
  document.querySelector('meta[name=theme-color]').content = a;
}
let themeIndex = 0;
try { themeIndex = +localStorage.getItem(THEME_KEY) || 0; } catch {}
applyTheme(themeIndex);

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const fmt = n => String(Math.round(n * 100) / 100);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Keyword -> suggested units as [unit, default daily goal].
const PRESETS = [
  { match: /water|hydrat/i, units: [['L', 2], ['oz', 64], ['glasses', 8], ['ml', 2000]] },
  { match: /read|book/i, units: [['pages', 10], ['minutes', 20]] },
  { match: /walk|run|jog|step|hike/i, units: [['steps', 8000], ['km', 5], ['mi', 3], ['minutes', 30]] },
  { match: /push.?up|sit.?up|squat|pull.?up|burpee/i, units: [['reps', 50]] },
  { match: /sleep/i, units: [['hours', 8]] },
  { match: /meditat|stretch|study|practi|exercise|workout|yoga|journal|plank/i, units: [['minutes', 15]] },
];

// Keyword -> suggested emojis. First match wins; DEFAULT_EMOJI when nothing matches.
const EMOJI = [
  [/water|hydrat/i, ['💧', '🥤', '🚰', '🧊']],
  [/read|book/i, ['📚', '📖', '🤓']],
  [/dog/i, ['🐕', '🦮']],
  [/run|jog/i, ['🏃', '👟', '🏅']],
  [/walk|step|hike/i, ['🚶', '👟', '🥾', '🌳']],
  [/bike|cycl/i, ['🚴', '🚲']],
  [/swim/i, ['🏊', '🌊']],
  [/meditat|mindful|breath/i, ['🧘', '🕯️', '🌿']],
  [/yoga|stretch/i, ['🧘', '🤸']],
  [/sleep|bed/i, ['😴', '🛌', '🌙']],
  [/push.?up|pull.?up|sit.?up|squat|burpee|plank|gym|workout|exercise|lift/i, ['💪', '🏋️', '🔥']],
  [/guitar/i, ['🎸', '🎶']],
  [/piano/i, ['🎹', '🎶']],
  [/music|sing|practi/i, ['🎵', '🎤', '🎶']],
  [/journal|write|diary/i, ['✍️', '📓', '🖊️']],
  [/study|learn|homework|school/i, ['📝', '🎓', '🧠']],
  [/language|spanish|french|german|english|duolingo/i, ['🗣️', '🌍', '🦉']],
  [/code|program/i, ['💻', '⌨️']],
  [/vitamin|pill|medic/i, ['💊']],
  [/fruit|veg|salad|eat|healthy|food/i, ['🥦', '🍎', '🥗']],
  [/cook|meal/i, ['🍳', '🥘']],
  [/coffee/i, ['☕']],
  [/sugar|sweet|candy/i, ['🍬', '🚫']],
  [/alcohol|beer|drink(?!.*water)/i, ['🚫', '🍺']],
  [/smok|vape/i, ['🚭']],
  [/phone|screen|social|scroll/i, ['📵', '📱']],
  [/teeth|floss|brush/i, ['🦷', '🪥']],
  [/skin|face/i, ['🧴', '✨']],
  [/clean|tidy/i, ['🧹', '🧽', '✨']],
  [/plant/i, ['🪴', '🌱']],
  [/pray|church|bible/i, ['🙏', '✝️']],
  [/call|family|mom|dad|friend/i, ['📞', '❤️']],
  [/save|money|budget/i, ['💰', '🐷']],
];
const DEFAULT_EMOJI = ['⭐', '✅', '🎯', '💪', '❤️', '🔥'];
const suggestEmoji = name => (EMOJI.find(([re]) => re.test(name)) || [, DEFAULT_EMOJI])[1];
const firstGrapheme = str => {
  const t = str.trim();
  if (!t) return '';
  return window.Intl && Intl.Segmenter ? [...new Intl.Segmenter().segment(t)][0].segment : [...t][0];
};

// Renders "no emoji / suggestions / type your own" into box. onPick('') clears it.
function emojiPicker(box, name, current, onPick) {
  const options = [...new Set([...(current ? [current] : []), ...suggestEmoji(name)])];
  box.innerHTML = `
    <div class="field">Emoji (optional)</div>
    <div class="chips emojis">
      <button class="chip${current ? '' : ' sel'}" data-e="">None</button>
      ${options.map(e => `<button class="chip emo${e === current ? ' sel' : ''}" data-e="${esc(e)}">${esc(e)}</button>`).join('')}
      <input class="own" maxlength="8" placeholder="Your own" aria-label="Type your own emoji">
    </div>`;
  box.querySelectorAll('.chip').forEach(b => b.onclick = () => onPick(b.dataset.e));
  const own = box.querySelector('.own');
  own.oninput = () => { const e = firstGrapheme(own.value); if (e) onPick(e); };
}

let state = load();

function load() {
  let s;
  try { s = JSON.parse(localStorage.getItem(KEY)) || { habits: [] }; }
  catch { s = { habits: [] }; }
  s.habits.forEach((h, i) => {
    // Older versions logged partial amounts per day; a day counts as done if the goal was reached.
    if (h.log) {
      h.done = Object.keys(h.log).filter(d => h.log[d] >= h.goal);
      delete h.log; delete h.type; delete h.step;
    }
    h.done = h.done || [];
    if (h.color == null) h.color = i % PALETTE.length;
  });
  return s;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  render();
}

function toggle(h, date) {
  const i = h.done.indexOf(date);
  if (i === -1) h.done.push(date); else h.done.splice(i, 1);
  if (navigator.vibrate) navigator.vibrate(10);
  save();
}

// Consecutive done days ending today, or ending yesterday if today isn't logged yet.
function streak(h) {
  const set = new Set(h.done);
  let n = 0, i = set.has(ymd(daysAgo(0))) ? 0 : 1;
  while (set.has(ymd(daysAgo(i)))) { n++; i++; }
  return n;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// Tap runs onTap; holding ~0.5s without moving runs onHold. Swiping cancels both.
function pressable(node, onTap, onHold) {
  let timer, sx, sy, held = false;
  node.addEventListener('pointerdown', e => {
    held = false; sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => { held = true; if (navigator.vibrate) navigator.vibrate(20); onHold(); }, 500);
  });
  node.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clearTimeout(timer); });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) node.addEventListener(t, () => clearTimeout(timer));
  node.addEventListener('click', () => { if (!held) onTap(); });
  node.addEventListener('contextmenu', e => e.preventDefault());
}

let justToggled = null;
const pagesEl = $('pages');
const currentPage = () => Math.round(pagesEl.scrollLeft / (pagesEl.clientWidth || 1));
function goToPage(i) { pagesEl.scrollTo({ left: i * pagesEl.clientWidth, behavior: 'instant' }); updateDots(); }

function render() {
  const today = ymd(daysAgo(0));
  $('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const total = state.habits.length;
  const doneCount = state.habits.filter(h => h.done.includes(today)).length;
  $('progress').textContent = total ? `${doneCount} of ${total} done · hold a circle to edit` : '';

  const shown = state.habits;
  const keep = currentPage();
  pagesEl.replaceChildren();

  if (!shown.length) {
    const p = el('div', 'page empty', 'Tap + to add your first habit.');
    pagesEl.append(p);
  }
  for (let start = 0; start < shown.length; start += PER_PAGE) {
    const page = el('div', 'page');
    for (const h of shown.slice(start, start + PER_PAGE)) {
      const done = h.done.includes(today);
      // The habit just tapped starts in its old state so the ring can animate to the new one.
      const animate = h.id === justToggled;
      const cell = el('button', 'habit' + (done !== animate ? ' done' : ''));
      if (animate) requestAnimationFrame(() => requestAnimationFrame(() => cell.classList.toggle('done', done)));
      cell.setAttribute('aria-label', `${h.name}, ${done ? 'done' : 'not done'}`);
      const ring = el('span', 'ring');
      ring.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="48"/><circle class="arc" cx="50" cy="50" r="48" pathLength="100"/></svg>';
      ring.append(h.emoji ? el('span', 'e', h.emoji) : el('span', 'i', firstGrapheme(h.name).toUpperCase()), el('span', 'ok', '✓'));
      const label = el('span', 'label');
      label.append(el('span', 'n', h.name));
      const s = streak(h);
      const info = [h.unit ? `${fmt(h.goal)} ${h.unit}` : '', s ? `🔥 ${s}` : ''].filter(Boolean).join(' · ');
      if (info) label.append(el('span', 'g', info));
      cell.append(ring, label);
      pressable(cell, () => { justToggled = h.id; toggle(h, today); justToggled = null; }, () => openEditSheet(h));
      page.append(cell);
    }
    pagesEl.append(page);
  }

  const count = pagesEl.children.length;
  $('dots').replaceChildren(...(count > 1 ? Array.from({ length: count }, () => el('span')) : []));
  goToPage(Math.min(keep, count - 1));
  updateDots();
}

function updateDots() {
  const i = currentPage();
  [...$('dots').children].forEach((d, j) => d.classList.toggle('on', i === j));
}
pagesEl.addEventListener('scroll', updateDots, { passive: true });

// ---- Bottom sheet ----
function openSheet(html, bind) {
  const sheet = $('sheet');
  sheet.querySelector('.panel').innerHTML = html;
  sheet.hidden = false;
  bind(sheet.querySelector('.panel'));
}
function closeSheet() { $('sheet').hidden = true; }
$('sheet').onclick = e => { if (e.target.id === 'sheet') closeSheet(); };

// Name, then optionally a daily goal in some unit (e.g. 2 L). Suggested units follow the name as you type.
function openAddSheet() {
  const pick = { mode: 'none', goal: '', unit: '', auto: true, emoji: '' };
  openSheet(`
    <h2>New habit</h2>
    <label class="field">Name<span class="goal"><input id="hname" maxlength="40" placeholder="e.g. Drink water" autocomplete="off"></span></label>
    <div id="emo"></div>
    <div id="opts"></div>
    <div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="primary" id="save">Add habit</button></div>
    <div class="links">Backup: <button id="export">Export</button> · <button id="import">Import</button> · version 12</div>
  `, () => {});
  const name = $('hname');
  const drawEmoji = () => emojiPicker($('emo'), name.value, pick.emoji, e => { pick.emoji = e; drawEmoji(); });
  const unitsFor = n => (PRESETS.find(p => p.match.test(n)) || { units: [] }).units;

  // Only the unit chips and goal field redraw, so the name box keeps focus and the keyboard stays up.
  const drawOpts = focusId => {
    const units = unitsFor(name.value);
    const chip = (mode, label) => `<button class="chip${pick.mode === mode ? ' sel' : ''}" data-mode="${esc(mode)}">${esc(label)}</button>`;
    $('opts').innerHTML = `
      <div class="chips">
        ${chip('none', 'No unit')}
        ${units.map(u => chip(u[0], u[0])).join('')}
        ${chip('other', 'Other unit…')}
      </div>
      ${pick.mode === 'none' ? '' : `
      <label class="field">Daily goal
        <span class="goal">
          <input id="goal" type="text" inputmode="decimal" autocomplete="off" value="${esc(String(pick.goal))}" placeholder="e.g. 10">
          ${pick.mode === 'other'
            ? `<input id="unit" placeholder="unit, e.g. cups" maxlength="12" value="${esc(pick.unit)}">`
            : `<span class="unit">${esc(pick.mode)}</span>`}
        </span>
      </label>`}`;
    const goal = $('goal'), unit = $('unit');
    if (goal) goal.oninput = () => { pick.goal = goal.value; };
    if (unit) unit.oninput = () => { pick.unit = unit.value; };
    $('opts').querySelectorAll('.chip').forEach(b => b.onclick = () => {
      pick.auto = false;
      pick.mode = b.dataset.mode;
      const u = units.find(u => u[0] === pick.mode);
      pick.goal = u ? u[1] : '';
      drawOpts(pick.mode === 'other' ? 'unit' : !u && pick.mode !== 'none' ? 'goal' : null);
    });
    const f = focusId && $(focusId);
    if (f) f.focus();
  };

  name.oninput = () => {
    // Until the user picks a unit themselves, follow the name's suggestion.
    if (pick.auto) {
      const first = unitsFor(name.value)[0];
      pick.mode = first ? first[0] : 'none';
      pick.goal = first ? first[1] : '';
    }
    drawOpts();
    drawEmoji();
  };
  $('cancel').onclick = closeSheet;
  $('export').onclick = exportData;
  $('import').onclick = () => $('file').click();
  $('save').onclick = () => {
    const n = name.value.trim();
    if (!n) return name.focus();
    const last = state.habits[state.habits.length - 1];
    const h = { id: 'h_' + Date.now().toString(36), name: n, created: ymd(daysAgo(0)), done: [],
      color: last ? (last.color + 1) % PALETTE.length : 0 };
    if (pick.emoji) h.emoji = pick.emoji;
    if (pick.mode !== 'none') {
      const g = parseFloat(String(pick.goal).replace(',', '.'));
      const u = pick.mode === 'other' ? pick.unit.trim() : pick.mode;
      if (!(g > 0)) return $('goal').focus();
      if (!u) return $('unit').focus();
      Object.assign(h, { unit: u, goal: g });
    }
    state.habits.push(h);
    closeSheet();
    save();
    goToPage(Math.floor((state.habits.length - 1) / PER_PAGE));
  };
  drawOpts();
  drawEmoji();
  name.focus();
}
$('add').onclick = openAddSheet;

function openThemeSheet() {
  const draw = () => openSheet(`
    <h2>Colors</h2>
    <p class="sub">${THEMES[themeIndex][0]}</p>
    <div class="themes">${THEMES.map(([n, a, b, c], i) =>
      `<button class="swatch${i === themeIndex ? ' sel' : ''}" data-i="${i}" aria-label="${n}" style="background:linear-gradient(160deg, ${a}, ${b}, ${c})"></button>`).join('')}</div>
    <div class="actions"><button class="primary" id="close">Done</button></div>
  `, panel => {
    panel.querySelectorAll('.swatch').forEach(b => b.onclick = () => {
      themeIndex = +b.dataset.i;
      applyTheme(themeIndex);
      try { localStorage.setItem(THEME_KEY, themeIndex); } catch {}
      draw();
    });
    $('close').onclick = closeSheet;
  });
  draw();
}
$('theme').onclick = openThemeSheet;

// Holding a circle: rename, fix any of the past year's days, change the emoji, or delete.
const HISTORY_DAYS = 365;
function openEditSheet(h) {
  const color = PALETTE[h.color % PALETTE.length];
  const streakText = () => {
    const n = streak(h);
    return `${h.unit ? `${fmt(h.goal)} ${esc(h.unit)} a day · ` : ''}${n ? `🔥 ${n} day streak` : 'No streak yet'}`;
  };
  // Oldest on the left, today on the far right; a month label marks the 1st and the first chip.
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => daysAgo(HISTORY_DAYS - 1 - i)).map((d, i) => {
    const key = ymd(d);
    const month = i === 0 || d.getDate() === 1 ? d.toLocaleDateString(undefined, { month: 'short' }) : '';
    return `<button class="day${h.done.includes(key) ? ' on' : ''}" data-day="${key}"><i>${month}</i>${d.toLocaleDateString(undefined, { weekday: 'short' })}<b>${d.getDate()}</b></button>`;
  }).join('');
  openSheet(`
    <div class="title-row"><span id="edit-emoji">${h.emoji ? esc(h.emoji) : ''}</span>
      <input id="rename" class="title-input" maxlength="40" value="${esc(h.name)}" aria-label="Habit name" autocomplete="off" enterkeyhint="done"><span class="pen" aria-hidden="true">✎</span></div>
    <p class="sub" id="edit-streak">${streakText()}</p>
    <p class="sub">Tap a day to mark it done or not done. Swipe for earlier days.</p>
    <div class="days" style="--c:${color}">${days}</div>
    <div id="emo"></div>
    <div class="actions"><button class="danger" id="del">Delete</button><button class="primary" id="close">Done</button></div>
  `, panel => {
    const strip = panel.querySelector('.days');
    strip.scrollLeft = strip.scrollWidth;
    // Update just the tapped chip so the strip keeps its scroll position.
    strip.onclick = e => {
      const b = e.target.closest('.day');
      if (!b) return;
      toggle(h, b.dataset.day);
      b.classList.toggle('on', h.done.includes(b.dataset.day));
      $('edit-streak').innerHTML = streakText();
    };

    const rename = $('rename');
    const commit = () => {
      const n = rename.value.trim();
      if (n && n !== h.name) { h.name = n; save(); }
      rename.value = h.name;
    };
    rename.onchange = commit;
    rename.onkeydown = e => { if (e.key === 'Enter') rename.blur(); };

    const drawEmoji = () => emojiPicker($('emo'), h.name, h.emoji || '', e => {
      if (e) h.emoji = e; else delete h.emoji;
      $('edit-emoji').textContent = h.emoji || '';
      save();
      drawEmoji();
    });
    drawEmoji();

    $('close').onclick = () => { commit(); closeSheet(); };
    $('del').onclick = () => {
      if (confirm(`Delete "${h.name}" and its history?`)) {
        state.habits = state.habits.filter(x => x !== h);
        closeSheet();
        save();
      }
    };
  });
}

// ---- Stats ----
// A day counts toward a habit from the day it was created (or its earliest logged day, if backfilled).
// Today only counts once it's done, so the rate doesn't drop every morning.
const dayNum = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const keyOf = n => new Date(n * 864e5).toISOString().slice(0, 10);
const startOf = h => Math.min(dayNum(h.created || ymd(daysAgo(0))), ...h.done.map(dayNum));
function longestStreak(h) {
  const days = [...new Set(h.done.map(dayNum))].sort((a, b) => a - b);
  let best = 0, run = 0;
  days.forEach((d, i) => { run = i && d === days[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); });
  return best;
}
const RANGES = [['week', 'Week', 7, 'last 7 days'], ['month', 'Month', 30, 'last 30 days'], ['year', 'Year', 365, 'last 12 months'], ['all', 'All time', 0, 'all time']];
const statsView = { habit: 'all', range: 'month' };

function computeStats(habits, range) {
  const today = dayNum(ymd(daysAgo(0)));
  const earliest = Math.min(...habits.map(startOf));
  const len = RANGES.find(r => r[0] === range)[2];
  const from = len ? today - len + 1 : earliest;
  const days = [];
  let done = 0, possible = 0, perfect = 0;
  const weekday = Array.from({ length: 7 }, () => ({ done: 0, possible: 0 }));
  for (let d = from; d <= today; d++) {
    const key = keyOf(d);
    let dd = 0, dp = 0;
    for (const h of habits) {
      if (d < startOf(h)) continue;
      const hit = h.done.includes(key);
      if (d === today && !hit) continue;
      dp++; if (hit) dd++;
    }
    const wd = (new Date(d * 864e5).getUTCDay() + 6) % 7; // Monday = 0
    weekday[wd].done += dd; weekday[wd].possible += dp;
    if (dp && dd === dp && (d !== today || dp === habits.filter(h => d >= startOf(h)).length)) perfect++;
    done += dd; possible += dp;
    days.push({ d, key, done: dd, possible: dp });
  }
  return { days, done, possible, perfect, weekday, from, today };
}

// Daily bars for week/month; monthly bars for year/all time.
const daily = (st, range) => range === 'week' || range === 'month' || st.days.length <= 31;
function buckets(st, range) {
  if (daily(st, range)) {
    return st.days.map(x => {
      const date = new Date(x.d * 864e5);
      return { ...x, short: st.days.length <= 7 ? date.toLocaleDateString(undefined, { weekday: 'narrow', timeZone: 'UTC' }) : String(date.getUTCDate()),
        long: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }) };
    });
  }
  const map = new Map();
  for (const x of st.days) {
    const k = x.key.slice(0, 7);
    if (!map.has(k)) {
      const date = new Date(x.d * 864e5);
      map.set(k, { done: 0, possible: 0, short: date.toLocaleDateString(undefined, { month: 'narrow', timeZone: 'UTC' }),
        long: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }) });
    }
    const b = map.get(k); b.done += x.done; b.possible += x.possible;
  }
  return [...map.values()];
}

const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

function barChart(id, items, labelEvery) {
  return `<div class="chart" id="${id}">
    <div class="readout" aria-live="polite">Tap a bar for details</div>
    <div class="plot">
      <div class="grid"><span>100%</span><span>50%</span><span>0%</span></div>
      <div class="bars">${items.map((b, i) => `
        <button class="bar" data-tip="${esc(b.long)}: ${b.possible ? `${pct(b.done, b.possible)}% (${b.done} of ${b.possible})` : 'nothing to do yet'}">
          <span class="fill${b.possible ? '' : ' none'}" style="height:${b.possible ? Math.max(2, pct(b.done, b.possible)) : 0}%"></span>
          <span class="tick">${i % labelEvery === 0 ? esc(b.short) : ''}</span>
        </button>`).join('')}
      </div>
    </div>
  </div>`;
}

function openStats() {
  const view = $('stats');
  const draw = () => {
    const habits = state.habits;
    if (!habits.length) {
      view.innerHTML = `<div class="stats-in"><div class="stats-top"><button class="round" id="stats-close" aria-label="Back">‹</button><h1>Stats</h1></div>
        <p class="stats-empty">Add a habit to see your stats.</p></div>`;
      $('stats-close').onclick = closeStats;
      return;
    }
    const one = habits.find(h => h.id === statsView.habit);
    if (!one) statsView.habit = 'all';
    const sel = one ? [one] : habits;
    const st = computeStats(sel, statsView.range);
    const rate = pct(st.done, st.possible);
    const rangeName = RANGES.find(r => r[0] === statsView.range)[3];

    let tiles;
    if (one) {
      tiles = [
        ['Completions', `${st.done}<small> of ${st.possible} days</small>`],
        ['Current streak', `${streak(one)}<small> days</small>`],
        ['Longest streak', `${longestStreak(one)}<small> days</small>`],
        ['All-time total', `${one.done.length}<small> times</small>`],
      ];
    } else {
      const best = habits.map(h => [longestStreak(h), h]).sort((a, b) => b[0] - a[0])[0];
      tiles = [
        ['Completions', `${st.done}<small> of ${st.possible}</small>`],
        ['Best streak', `${best[0]}<small> days</small><em>${best[0] ? esc((best[1].emoji ? best[1].emoji + ' ' : '') + best[1].name) : '&nbsp;'}</em>`],
        ['Perfect days', `${st.perfect}<small> all done</small>`],
        ['Habits', `${habits.length}<small> tracked</small>`],
      ];
    }

    const b = buckets(st, statsView.range);
    const every = b.length <= 12 ? 1 : b.length <= 31 ? 5 : Math.ceil(b.length / 8);
    const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const wd = st.weekday.map((w, i) => ({ ...w, short: names[i][0], long: names[i] }));
    const ranked = wd.filter(w => w.possible).sort((a, c) => pct(c.done, c.possible) - pct(a.done, a.possible));
    const wdNote = ranked.length > 1
      ? `Best on <b>${ranked[0].long}s</b> (${pct(ranked[0].done, ranked[0].possible)}%), weakest on <b>${ranked[ranked.length - 1].long}s</b> (${pct(ranked[ranked.length - 1].done, ranked[ranked.length - 1].possible)}%).`
      : 'Keep going to see which days work best.';

    view.innerHTML = `<div class="stats-in">
      <div class="stats-top"><button class="round" id="stats-close" aria-label="Back">‹</button><h1>Stats</h1></div>
      <div class="pick">
        <button class="pchip${one ? '' : ' sel'}" data-h="all">All habits</button>
        ${habits.map(h => `<button class="pchip${one === h ? ' sel' : ''}" data-h="${h.id}">${h.emoji ? esc(h.emoji) + ' ' : ''}${esc(h.name)}</button>`).join('')}
      </div>
      <div class="seg">${RANGES.map(([k, label]) => `<button class="${statsView.range === k ? 'sel' : ''}" data-r="${k}">${label}</button>`).join('')}</div>
      <div class="hero">
        <div class="hero-n">${rate}<span>%</span></div>
        <div class="hero-t">completion rate, ${rangeName}<br><b>${st.done} of ${st.possible}</b> ${one ? 'days done' : 'check-offs done'}</div>
      </div>
      <div class="tiles">${tiles.map(([k, v]) => `<div class="tile"><div class="tk">${k}</div><div class="tv">${v}</div></div>`).join('')}</div>
      <h3>${daily(st, statsView.range) ? 'Each day' : 'Each month'}</h3>
      ${barChart('trend', b, every)}
      <h3>By day of the week</h3>
      ${barChart('weekdays', wd, 1)}
      <p class="note">${wdNote}</p>
    </div>`;
    $('stats-close').onclick = closeStats;
    view.querySelectorAll('.pchip').forEach(x => x.onclick = () => { statsView.habit = x.dataset.h; draw(); });
    view.querySelectorAll('.seg button').forEach(x => x.onclick = () => { statsView.range = x.dataset.r; draw(); });
    view.querySelectorAll('.chart').forEach(chart => {
      const out = chart.querySelector('.readout');
      chart.querySelectorAll('.bar').forEach(bar => {
        const show = () => {
          chart.querySelectorAll('.bar.on').forEach(o => o.classList.remove('on'));
          bar.classList.add('on');
          out.textContent = bar.dataset.tip;
        };
        bar.onclick = show;
        bar.onpointerenter = e => { if (e.pointerType === 'mouse') show(); };
      });
    });
    const sc = view.querySelector('.pick .sel');
    if (sc) sc.scrollIntoView({ block: 'nearest', inline: 'center' });
  };
  draw();
  view.hidden = false;
  view.scrollTop = 0;
}
function closeStats() { $('stats').hidden = true; }
$('stats-btn').onclick = openStats;

function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = `habits-${ymd(daysAgo(0))}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
$('file').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.habits)) throw new Error('bad file');
    if (confirm('Replace current habits with the imported file?')) {
      localStorage.setItem(KEY, JSON.stringify(data));
      state = load();
      closeSheet();
      save();
    }
  } catch { alert('That file is not a valid habits export.'); }
  e.target.value = '';
};

// Re-render when the app comes back to the foreground so "today" rolls over at midnight.
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
window.addEventListener('resize', () => goToPage(currentPage()));

// Always check the server for a new sw.js, and reload once when a new version takes over,
// so a deploy shows up on the next open instead of waiting on stale caches.
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
render();
