const KEY = 'habits.v1';
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
  // Older versions logged partial amounts per day; a day counts as done if the goal was reached.
  for (const h of s.habits) {
    if (h.log) {
      h.done = Object.keys(h.log).filter(d => h.log[d] >= h.goal);
      delete h.log; delete h.type; delete h.step;
    }
    h.done = h.done || [];
  }
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

function render() {
  const today = ymd(daysAgo(0));
  $('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const list = $('list');
  list.replaceChildren();
  let doneCount = 0;

  for (const h of state.habits) {
    const done = h.done.includes(today);
    if (done) doneCount++;
    const li = el('li', done ? 'done' : '');

    const check = el('button', 'check', '✓');
    check.setAttribute('aria-label', `${done ? 'Unmark' : 'Mark'} ${h.name}`);
    check.onclick = () => toggle(h, today);

    const body = el('div', 'body');
    body.onclick = () => toggle(h, today);
    const name = el('div', 'name', h.name);
    if (h.unit) name.append(el('span', 'target', ` · ${fmt(h.goal)} ${h.unit}`));
    const meta = el('div', 'meta');
    const week = el('span', 'week');
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i), key = ymd(d);
      const dot = el('button', 'dot' + (h.done.includes(key) ? ' on' : ''));
      dot.title = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      dot.onclick = e => { e.stopPropagation(); toggle(h, key); };
      week.append(dot);
    }
    const s = streak(h);
    meta.append(week, el('span', '', s ? `🔥 ${s}` : 'No streak'));
    body.append(name, meta);

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

// Asked right after typing a name: optionally attach a daily goal in some unit (e.g. 2 L).
function openAddSheet(name) {
  const preset = PRESETS.find(p => p.match.test(name));
  const units = preset ? preset.units : [];
  const pick = { mode: units.length ? units[0][0] : 'none', goal: units.length ? units[0][1] : '' };

  const draw = () => {
    const chip = (mode, label) => `<button class="chip${pick.mode === mode ? ' sel' : ''}" data-mode="${esc(mode)}">${esc(label)}</button>`;
    const goalFields = pick.mode === 'none' ? '' : `
      <label class="field">Daily goal
        <span class="goal">
          <input id="goal" type="text" inputmode="decimal" autocomplete="off" value="${pick.goal}" placeholder="e.g. 10">
          ${pick.mode === 'other'
            ? `<input id="unit" placeholder="unit, e.g. cups" maxlength="12" value="${esc(pick.unit || '')}">`
            : `<span class="unit">${esc(pick.mode)}</span>`}
        </span>
      </label>`;
    openSheet(`
      <h2>Add “${esc(name)}”</h2>
      <p class="sub">Pick a unit to set a daily goal, or skip it.</p>
      <div class="chips">
        ${chip('none', 'No unit')}
        ${units.map(u => chip(u[0], u[0])).join('')}
        ${chip('other', 'Other unit…')}
      </div>
      ${goalFields}
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
        const h = { id: 'h_' + Date.now().toString(36), name, created: ymd(daysAgo(0)), done: [] };
        if (pick.mode !== 'none') {
          const g = parseFloat(String(pick.goal).replace(',', '.'));
          const u = pick.mode === 'other' ? (pick.unit || '').trim() : pick.mode;
          if (!(g > 0)) return goal.focus();
          if (!u) return unit.focus();
          Object.assign(h, { unit: u, goal: g });
        }
        state.habits.push(h);
        $('name').value = '';
        closeSheet();
        save();
      };
    });
  };
  draw();
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
    if (confirm('Replace current habits with the imported file?')) {
      localStorage.setItem(KEY, JSON.stringify(data));
      state = load();
      save();
    }
  } catch { alert('That file is not a valid habits export.'); }
  e.target.value = '';
};

// Re-render when the app comes back to the foreground so "today" rolls over at midnight.
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
