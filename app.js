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

const pagesEl = $('pages');
const currentPage = () => Math.round(pagesEl.scrollLeft / (pagesEl.clientWidth || 1));
function goToPage(i) { pagesEl.scrollTo({ left: i * pagesEl.clientWidth, behavior: 'instant' }); updateDots(); }

function render() {
  const today = ymd(daysAgo(0));
  $('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const total = state.habits.length;
  const doneCount = state.habits.filter(h => h.done.includes(today)).length;
  $('progress').textContent = total ? `${doneCount} of ${total} done · hold a circle to edit` : '';

  const q = $('search').value.trim().toLowerCase();
  const shown = state.habits.filter(h => h.name.toLowerCase().includes(q));
  const keep = currentPage();
  pagesEl.replaceChildren();

  if (!shown.length) {
    const p = el('div', 'page empty', total ? 'No habits match your search.' : 'Tap + to add your first habit.');
    pagesEl.append(p);
  }
  for (let start = 0; start < shown.length; start += PER_PAGE) {
    const page = el('div', 'page');
    for (const h of shown.slice(start, start + PER_PAGE)) {
      const done = h.done.includes(today);
      const cell = el('button', 'habit' + (done ? ' done' : ''));
      cell.setAttribute('aria-label', `${h.name}, ${done ? 'done' : 'not done'}`);
      const ring = el('span', 'ring');
      ring.append(h.emoji ? el('span', 'e', h.emoji) : el('span', 'i', firstGrapheme(h.name).toUpperCase()));
      const label = el('span', 'label');
      label.append(el('span', 'n', (done ? '✓ ' : '') + h.name));
      const s = streak(h);
      const info = [h.unit ? `${fmt(h.goal)} ${h.unit}` : '', s ? `🔥 ${s}` : ''].filter(Boolean).join(' · ');
      if (info) label.append(el('span', 'g', info));
      cell.append(ring, label);
      pressable(cell, () => toggle(h, today), () => openEditSheet(h));
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
$('search').addEventListener('input', () => { render(); goToPage(0); });

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
    <div class="links">Backup: <button id="export">Export</button> · <button id="import">Import</button></div>
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
    $('search').value = '';
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

// Holding a circle: change the emoji, fix past days, or delete the habit.
function openEditSheet(h) {
  const color = PALETTE[h.color % PALETTE.length];
  const draw = () => {
    const days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i)).map(d => {
      const key = ymd(d);
      return `<button class="day${h.done.includes(key) ? ' on' : ''}" data-day="${key}">${d.toLocaleDateString(undefined, { weekday: 'short' })}<b>${d.getDate()}</b></button>`;
    }).join('');
    openSheet(`
      <h2>${h.emoji ? esc(h.emoji) + ' ' : ''}${esc(h.name)}</h2>
      <p class="sub">${h.unit ? `${fmt(h.goal)} ${esc(h.unit)} a day · ` : ''}${streak(h) ? `🔥 ${streak(h)} day streak` : 'No streak yet'}</p>
      <p class="sub">Tap a day to mark it done or not done.</p>
      <div class="days" style="--c:${color}">${days}</div>
      <div id="emo"></div>
      <div class="actions"><button class="danger" id="del">Delete</button><button class="primary" id="close">Done</button></div>
    `, panel => {
      panel.querySelectorAll('.day').forEach(b => b.onclick = () => { toggle(h, b.dataset.day); draw(); });
      emojiPicker($('emo'), h.name, h.emoji || '', e => {
        if (e) h.emoji = e; else delete h.emoji;
        save();
        draw();
      });
      $('close').onclick = closeSheet;
      $('del').onclick = () => {
        if (confirm(`Delete "${h.name}" and its history?`)) {
          state.habits = state.habits.filter(x => x !== h);
          closeSheet();
          save();
        }
      };
    });
  };
  draw();
}

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

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
