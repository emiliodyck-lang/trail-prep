const KEY = 'habits.v1';
const $ = id => document.getElementById(id);

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
const fmt = n => String(Math.round(n * 100) / 100);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Keyword -> suggested units as [unit, default daily goal, quick-add step].
const PRESETS = [
  { match: /water|hydrat/i, units: [['L', 2, 0.25], ['oz', 64, 8], ['glasses', 8, 1], ['ml', 2000, 250]] },
  { match: /read|book/i, units: [['pages', 10, 5], ['minutes', 20, 5]] },
  { match: /walk|run|jog|step|hike/i, units: [['steps', 8000, 1000], ['km', 5, 1], ['mi', 3, 0.5], ['minutes', 30, 5]] },
  { match: /push.?up|sit.?up|squat|pull.?up|burpee/i, units: [['reps', 50, 10]] },
  { match: /sleep/i, units: [['hours', 8, 1]] },
  { match: /meditat|stretch|study|practi|exercise|workout|yoga|journal|plank/i, units: [['minutes', 15, 5]] },
];

// Largest round step that takes at least ~4 taps to hit the goal.
function niceStep(goal) {
  const steps = [1000, 500, 250, 100, 50, 10, 5, 2, 1, 0.5, 0.25, 0.1];
  return steps.find(s => s <= goal / 4) || 0.1;
}

let state = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { habits: [] }; }
  catch { return { habits: [] }; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  render();
}
const buzz = () => { if (navigator.vibrate) navigator.vibrate(10); };

const isAmount = h => h.type === 'amount';
const amountOn = (h, date) => h.log[date] || 0;
const isDone = (h, date) => isAmount(h) ? amountOn(h, date) >= h.goal : h.done.includes(date);

function addAmount(h, date, delta) {
  const v = Math.max(0, Math.round((amountOn(h, date) + delta) * 1000) / 1000);
  if (v) h.log[date] = v; else delete h.log[date];
  buzz();
  save();
}

// Past-day dots flip a day between "not done" and "done" (the full goal for amount habits).
function toggle(h, date) {
  if (isAmount(h)) {
    if (isDone(h, date)) delete h.log[date]; else h.log[date] = h.goal;
  } else {
    const i = h.done.indexOf(date);
    if (i === -1) h.done.push(date); else h.done.splice(i, 1);
  }
  buzz();
  save();
}

// Consecutive done days ending today, or ending yesterday if today isn't logged yet.
function streak(h) {
  let n = 0, i = isDone(h, ymd(daysAgo(0))) ? 0 : 1;
  while (isDone(h, ymd(daysAgo(i)))) { n++; i++; }
  return n;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function render() {
  const today = ymd(daysAgo(0));
  $('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const list = $('list');
  list.replaceChildren();
  let doneCount = 0;

  for (const h of state.habits) {
    const done = isDone(h, today);
    if (done) doneCount++;
    const li = el('li', done ? 'done' : '');

    const check = el('button', 'check' + (isAmount(h) ? ' plus' : ''), isAmount(h) ? '+' : '✓');
    check.setAttribute('aria-label', isAmount(h) ? `Log ${h.unit} for ${h.name}` : `${done ? 'Unmark' : 'Mark'} ${h.name}`);
    check.onclick = () => isAmount(h) ? openLogSheet(h) : toggle(h, today);

    const body = el('div', 'body');
    body.onclick = () => isAmount(h) ? openLogSheet(h) : toggle(h, today);
    const meta = el('div', 'meta');
    const week = el('span', 'week');
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i), key = ymd(d);
      const dot = el('button', 'dot' + (isDone(h, key) ? ' on' : ''));
      dot.title = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      dot.onclick = e => { e.stopPropagation(); toggle(h, key); };
      week.append(dot);
    }
    const s = streak(h);
    meta.append(week, el('span', '', s ? `🔥 ${s}` : 'No streak'));
    body.append(el('div', 'name', h.name));
    if (isAmount(h)) {
      const amt = amountOn(h, today);
      const bar = el('div', 'bar');
      const fill = el('span');
      fill.style.width = Math.min(100, amt / h.goal * 100) + '%';
      bar.append(fill);
      const row = el('div', 'amt');
      row.append(bar, el('span', '', `${fmt(amt)} / ${fmt(h.goal)} ${h.unit}`));
      body.append(row);
    }
    body.append(meta);

    const del = el('button', 'del', '×');
    del.setAttribute('aria-label', `Delete ${h.name}`);
    del.onclick = () => {
      if (confirm(`Delete "${h.name}" and its history?`)) {
        state.habits = state.habits.filter(x => x !== h);
        save();
      }
    };

    li.append(check, body, del);
    list.append(li);
  }

  $('empty').hidden = state.habits.length > 0;
  $('progress').textContent = state.habits.length ? `${doneCount}/${state.habits.length}` : '';
}

// ---- Bottom sheet ----
function openSheet(html, bind) {
  const sheet = $('sheet');
  sheet.querySelector('.panel').innerHTML = html;
  sheet.hidden = false;
  bind(sheet.querySelector('.panel'));
}
function closeSheet() { $('sheet').hidden = true; }
$('sheet').onclick = e => { if (e.target.id === 'sheet') closeSheet(); };

// Asked right after typing a name: just check it off, or track an amount in some unit.
function openAddSheet(name) {
  const preset = PRESETS.find(p => p.match.test(name));
  const units = preset ? preset.units : [];
  const pick = { mode: units.length ? units[0][0] : 'check', goal: units.length ? units[0][1] : '' };

  const draw = () => {
    const chip = (mode, label) => `<button class="chip${pick.mode === mode ? ' sel' : ''}" data-mode="${esc(mode)}">${esc(label)}</button>`;
    const amountFields = pick.mode === 'check' ? '' : `
      <label class="field">Daily goal
        <span class="goal">
          <input id="goal" type="number" inputmode="decimal" min="0" step="any" value="${pick.goal}" placeholder="e.g. 10">
          ${pick.mode === 'other'
            ? `<input id="unit" placeholder="unit, e.g. cups" maxlength="12" value="${esc(pick.unit || '')}">`
            : `<span class="unit">${esc(pick.mode)}</span>`}
        </span>
      </label>`;
    openSheet(`
      <h2>How do you want to track “${esc(name)}”?</h2>
      <div class="chips">
        ${chip('check', '✓ Just check it off')}
        ${units.map(u => chip(u[0], u[0])).join('')}
        ${chip('other', 'Other unit…')}
      </div>
      ${amountFields}
      <div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="add" id="save">Add habit</button></div>
    `, panel => {
      panel.querySelectorAll('.chip').forEach(b => b.onclick = () => {
        pick.mode = b.dataset.mode;
        const u = units.find(u => u[0] === pick.mode);
        pick.goal = u ? u[1] : '';
        draw();
        const g = $('unit') || $('goal');
        if (g && !u) g.focus();
      });
      const goal = $('goal'), unit = $('unit');
      if (goal) goal.oninput = () => { pick.goal = goal.value; };
      if (unit) unit.oninput = () => { pick.unit = unit.value; };
      $('cancel').onclick = closeSheet;
      $('save').onclick = () => {
        const base = { id: 'h_' + Date.now().toString(36), name, created: ymd(daysAgo(0)) };
        if (pick.mode === 'check') {
          state.habits.push({ ...base, done: [] });
        } else {
          const g = parseFloat(pick.goal);
          const u = pick.mode === 'other' ? (pick.unit || '').trim() : pick.mode;
          if (!(g > 0)) return goal.focus();
          if (!u) return unit.focus();
          const preset = units.find(x => x[0] === u);
          const step = preset && preset[2] <= g ? preset[2] : niceStep(g);
          state.habits.push({ ...base, type: 'amount', unit: u, goal: g, step, log: {} });
        }
        $('name').value = '';
        closeSheet();
        save();
      };
    });
  };
  draw();
}

// Tapping an amount habit asks "how much?" with the keyboard already up, plus quick buttons.
function openLogSheet(h) {
  const today = ymd(daysAgo(0));
  const question = /water|drink|hydrat/i.test(h.name) ? 'How much did you drink?' : 'How much did you do?';
  const quick = [h.step, h.step * 2, h.step * 4].filter(v => v <= h.goal * 1.5);
  const amt = amountOn(h, today);
  openSheet(`
    <h2>${question}</h2>
    <p class="sub">${esc(h.name)} · ${fmt(amt)} / ${fmt(h.goal)} ${esc(h.unit)} today</p>
    <div class="goal"><input id="custom" class="big-input" type="text" inputmode="decimal" autocomplete="off" placeholder="0"><span class="unit">${esc(h.unit)}</span></div>
    <div class="chips quick">
      ${quick.map(v => `<button class="chip" data-d="${v}">+${fmt(v)} ${esc(h.unit)}</button>`).join('')}
      ${amt > 0 ? `<button class="chip" data-d="${-Math.min(amt, h.step)}">Undo −${fmt(Math.min(amt, h.step))}</button>` : ''}
    </div>
    <div class="actions"><button class="ghost" id="close">Cancel</button><button class="add" id="addc">Add</button></div>
  `, panel => {
    const input = $('custom');
    const done = v => { addAmount(h, today, v); closeSheet(); };
    panel.querySelectorAll('.chip').forEach(b => b.onclick = () => done(parseFloat(b.dataset.d)));
    $('close').onclick = closeSheet;
    $('addc').onclick = () => {
      const v = parseFloat(input.value.replace(',', '.'));
      if (v > 0) done(v); else input.focus();
    };
    input.onkeydown = e => { if (e.key === 'Enter') $('addc').click(); };
    input.focus();
  });
}

$('form').onsubmit = e => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (name) openAddSheet(name);
};

$('export').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = `habits-${ymd(daysAgo(0))}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};
$('import').onclick = () => $('file').click();
$('file').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.habits)) throw new Error('bad file');
    if (confirm('Replace current habits with the imported file?')) { state = data; save(); }
  } catch { alert('That file is not a valid habits export.'); }
  e.target.value = '';
};

// Re-render when the app comes back to the foreground so "today" rolls over at midnight.
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
