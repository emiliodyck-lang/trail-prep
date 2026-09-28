const KEY = 'habits.v1';
const PER_PAGE = 6;
const PALETTE = ['#ff6b6b', '#f59f00', '#12b886', '#4c6ef5', '#845ef7', '#e64980'];
const $ = id => document.getElementById(id);

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
      const cell = el('div', 'cell');
      const c = el('button', 'circle' + (done ? ' done' : ''));
      c.style.setProperty('--c', PALETTE[h.color % PALETTE.length]);
      c.setAttribute('aria-label', `${h.name}, ${done ? 'done' : 'not done'}`);
      if (done) c.append(el('span', 'tick', '✓'));
      c.append(el('span', 'n', h.name));
      if (h.unit) c.append(el('span', 'g', `${fmt(h.goal)} ${h.unit}`));
      const s = streak(h);
      if (s) c.append(el('span', 's', `🔥 ${s}`));
      pressable(c, () => toggle(h, today), () => openEditSheet(h));
      cell.append(c);
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
  const pick = { mode: 'none', goal: '', unit: '', auto: true };
  openSheet(`
    <h2>New habit</h2>
    <label class="field">Name<span class="goal"><input id="hname" maxlength="40" placeholder="e.g. Drink water" autocomplete="off"></span></label>
    <div id="opts"></div>
    <div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="primary" id="save">Add habit</button></div>
    <div class="links">Backup: <button id="export">Export</button> · <button id="import">Import</button></div>
  `, () => {});
  const name = $('hname');
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
  name.focus();
}
$('add').onclick = openAddSheet;

// Holding a circle: fix past days or delete the habit.
function openEditSheet(h) {
  const color = PALETTE[h.color % PALETTE.length];
  const draw = () => {
    const days = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i)).map(d => {
      const key = ymd(d);
      return `<button class="day${h.done.includes(key) ? ' on' : ''}" data-day="${key}">${d.toLocaleDateString(undefined, { weekday: 'short' })}<b>${d.getDate()}</b></button>`;
    }).join('');
    openSheet(`
      <h2>${esc(h.name)}</h2>
      <p class="sub">${h.unit ? `${fmt(h.goal)} ${esc(h.unit)} a day · ` : ''}${streak(h) ? `🔥 ${streak(h)} day streak` : 'No streak yet'}</p>
      <p class="sub">Tap a day to mark it done or not done.</p>
      <div class="days" style="--c:${color}">${days}</div>
      <div class="actions"><button class="danger" id="del">Delete</button><button class="primary" id="close">Done</button></div>
    `, panel => {
      panel.querySelectorAll('.day').forEach(b => b.onclick = () => { toggle(h, b.dataset.day); draw(); });
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
