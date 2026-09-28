const KEY = 'habits.v1';
const $ = id => document.getElementById(id);

const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };

let state = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { habits: [] }; }
  catch { return { habits: [] }; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  render();
}

function toggle(habit, date) {
  const i = habit.done.indexOf(date);
  if (i === -1) habit.done.push(date); else habit.done.splice(i, 1);
  if (navigator.vibrate) navigator.vibrate(10);
  save();
}

// Consecutive done days ending today, or ending yesterday if today isn't logged yet.
function streak(habit) {
  const set = new Set(habit.done);
  let n = 0, i = set.has(ymd(daysAgo(0))) ? 0 : 1;
  while (set.has(ymd(daysAgo(i)))) { n++; i++; }
  return n;
}

function render() {
  const today = ymd(daysAgo(0));
  $('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const list = $('list');
  list.replaceChildren();
  let doneCount = 0;

  for (const h of state.habits) {
    const isDone = h.done.includes(today);
    if (isDone) doneCount++;
    const li = document.createElement('li');
    li.className = isDone ? 'done' : '';

    const check = document.createElement('button');
    check.className = 'check';
    check.textContent = '✓';
    check.setAttribute('aria-label', `${isDone ? 'Unmark' : 'Mark'} ${h.name}`);
    check.onclick = () => toggle(h, today);

    const body = document.createElement('div');
    body.className = 'body';
    body.onclick = () => toggle(h, today);
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = h.name;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const s = streak(h);
    const st = document.createElement('span');
    st.textContent = s ? `🔥 ${s}` : 'No streak';
    const week = document.createElement('span');
    week.className = 'week';
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i), key = ymd(d);
      const dot = document.createElement('button');
      dot.className = 'dot' + (h.done.includes(key) ? ' on' : '');
      dot.title = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      dot.onclick = e => { e.stopPropagation(); toggle(h, key); };
      week.append(dot);
    }
    meta.append(week, st);
    body.append(name, meta);

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '×';
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

$('form').onsubmit = e => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!name) return;
  state.habits.push({ id: 'h_' + Date.now().toString(36), name, created: ymd(daysAgo(0)), done: [] });
  $('name').value = '';
  save();
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
