/* ─────────────────────────────────────────────────────────────────
   PRODUCTIVITY DASHBOARD — app.js
   Sections:
     0. Storage helper (cross-browser / extension safe)
     1. Theme Toggle (light / dark, persisted)
     2. Clock & Greeting
     3. Focus Timer
     4. Tasks
     5. Quick Links
───────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════
   0. STORAGE HELPER
   Wraps localStorage in try/catch so the app works even when
   storage is restricted (e.g. some browser-extension sandboxes,
   private-browsing modes, or cross-origin iframes).
═══════════════════════════════════════════════════════════════ */
const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage unavailable — continue without persisting
    }
  },
};

/* ═══════════════════════════════════════════════════════════════
   1. THEME TOGGLE
═══════════════════════════════════════════════════════════════ */
const themeToggleBtn   = document.getElementById('theme-toggle');
const themeToggleIcon  = themeToggleBtn.querySelector('.theme-toggle__icon');
const themeToggleLabel = themeToggleBtn.querySelector('.theme-toggle__label');

// Apply a theme and update the button to reflect the opposite action
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    themeToggleIcon.textContent  = '☀️';
    themeToggleLabel.textContent = 'Light';
    themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    themeToggleIcon.textContent  = '🌙';
    themeToggleLabel.textContent = 'Dark';
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storage.set('theme', next);
}

// Load saved theme, falling back to the OS preference, then light
(function initTheme() {
  const saved = storage.get('theme', null);
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  } else {
    applyTheme('light');
  }
})();

themeToggleBtn.addEventListener('click', toggleTheme);

/* ═══════════════════════════════════════════════════════════════
   2. CLOCK & GREETING
═══════════════════════════════════════════════════════════════ */
const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date');
const greetingEl = document.getElementById('greeting');

// Cache the last-rendered date string and greeting so we only
// write to the DOM when the value actually changes (date changes
// once a day, greeting a few times a day — not every second).
let _lastDate = '';
let _lastGreet = '';

function updateClock() {
  const now  = new Date();
  const hour = now.getHours();

  // Time — always update (changes every second)
  const hh = String(hour).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  // Date — only write to DOM when the string actually changes
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
  if (dateStr !== _lastDate) {
    dateEl.textContent = dateStr;
    _lastDate = dateStr;
  }

  // Greeting — only write to DOM when it changes
  const USER_NAME = 'Charis Nur Noveli Alfaridzi';
  const greet =
    hour >= 5  && hour < 12 ? `Good Morning, ${USER_NAME}`   :
    hour >= 12 && hour < 17 ? `Good Afternoon, ${USER_NAME}` :
    hour >= 17 && hour < 21 ? `Good Evening, ${USER_NAME}`   : `Good Night, ${USER_NAME}`;
  if (greet !== _lastGreet) {
    greetingEl.textContent = greet;
    _lastGreet = greet;
  }
}

updateClock();
setInterval(updateClock, 1000);


/* ═══════════════════════════════════════════════════════════════
   3. FOCUS TIMER
═══════════════════════════════════════════════════════════════ */
const FOCUS_MINUTES  = 25;
const timerDisplay   = document.getElementById('timer-display');
const btnStart       = document.getElementById('timer-start');
const btnStop        = document.getElementById('timer-stop');
const btnReset       = document.getElementById('timer-reset');

let timerSeconds  = FOCUS_MINUTES * 60;
let timerInterval = null;
let timerRunning  = false;

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTimer(timerSeconds);
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.textContent = '00:00';
      return;
    }
    timerSeconds--;
    renderTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function resetTimer() {
  stopTimer();
  timerSeconds = FOCUS_MINUTES * 60;
  renderTimer();
}

btnStart.addEventListener('click', startTimer);
btnStop.addEventListener('click', stopTimer);
btnReset.addEventListener('click', resetTimer);

renderTimer();


/* ═══════════════════════════════════════════════════════════════
   4. TASKS
═══════════════════════════════════════════════════════════════ */
const taskInput       = document.getElementById('task-input');
const taskCategoryEl  = document.getElementById('task-category');
const taskAddBtn      = document.getElementById('task-add');
const taskList        = document.getElementById('task-list');
const filterBtns      = document.querySelectorAll('.btn--filter');

// Load tasks from storage or use empty list
let tasks = storage.get('tasks', []);
// Active filter — resets to '' (All) on every page load per Req 3.4
let activeFilter = '';

function saveTasks() {
  storage.set('tasks', tasks);
}

// Map category string → CSS modifier class
function tagClass(category) {
  const map = { Work: 'work', Personal: 'personal', Study: 'study', Other: 'other' };
  return map[category] || null;
}

function renderTasks() {
  taskList.innerHTML = '';

  const filtered = activeFilter
    ? tasks.filter(t => t.category === activeFilter)
    : tasks;

  // Empty-state messaging (Req 6.3)
  if (filtered.length === 0) {
    const li = document.createElement('li');
    li.className = 'task-empty';
    li.textContent = activeFilter
      ? `No tasks match the "${activeFilter}" filter.`
      : 'No tasks yet. Add one above.';
    taskList.appendChild(li);
    return;
  }

  filtered.forEach((task) => {
    // Use the real index in the full tasks array for mutations
    const realIndex = tasks.indexOf(task);

    const li = document.createElement('li');
    li.className = 'task-item';

    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    checkbox.id      = `task-${realIndex}`;
    checkbox.addEventListener('change', () => {
      tasks[realIndex].done = checkbox.checked;
      saveTasks();
      label.style.textDecoration = checkbox.checked ? 'line-through' : '';
      label.style.color          = checkbox.checked ? 'var(--color-text-faint)' : '';
    });

    const label = document.createElement('label');
    label.className   = 'task-item__label';
    label.htmlFor     = `task-${realIndex}`;
    label.textContent = task.text;
    if (task.done) {
      label.style.textDecoration = 'line-through';
      label.style.color          = 'var(--color-text-faint)';
    }

    // Tag badge (only if category is set)
    const cls = tagClass(task.category);
    if (cls) {
      const badge = document.createElement('span');
      badge.className   = `task-tag task-tag--${cls}`;
      badge.textContent = task.category;
      li.appendChild(checkbox);
      li.appendChild(label);
      li.appendChild(badge);
    } else {
      li.appendChild(checkbox);
      li.appendChild(label);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'btn btn--danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => {
      tasks.splice(realIndex, 1);
      saveTasks();
      renderTasks();
    });

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function shake(el) {
  el.classList.remove('input--shake');
  void el.offsetWidth;
  el.classList.add('input--shake');
  el.addEventListener('animationend', () => el.classList.remove('input--shake'), { once: true });
}

function addTask() {
  const text     = taskInput.value.trim();
  const category = taskCategoryEl.value;   // '' means no tag
  if (!text) { shake(taskInput); return; }
  tasks.push({ text, done: false, category });
  saveTasks();
  renderTasks();
  taskInput.value        = '';
  taskCategoryEl.value   = '';
  taskInput.focus();
}

// Filter bar interaction
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle('btn--filter-active', b === btn));
    renderTasks();
  });
});

taskAddBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

renderTasks();


/* ═══════════════════════════════════════════════════════════════
   5. QUICK LINKS
═══════════════════════════════════════════════════════════════ */
const linkNameInput = document.getElementById('link-name');
const linkUrlInput  = document.getElementById('link-url');
const linkAddBtn    = document.getElementById('link-add');
const linkList      = document.getElementById('link-list');

// Default links matching the screenshot
const DEFAULT_LINKS = [
  { name: 'Google',   url: 'https://google.com' },
  { name: 'Gmail',    url: 'https://mail.google.com' },
  { name: 'Calendar', url: 'https://calendar.google.com' },
];

function saveLinks() {
  storage.set('links', links);
}

// Load from storage; fall back to defaults on first run
let links = storage.get('links', null);
if (!links) {
  links = DEFAULT_LINKS.slice();
  saveLinks();
}

function normalizeUrl(url) {
  if (!url) return '#';
  if (!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

function renderLinks() {
  linkList.innerHTML = '';
  links.forEach((link, index) => {
    const a = document.createElement('a');
    a.className  = 'link-item';
    a.href       = normalizeUrl(link.url);
    a.target     = '_blank';
    a.rel        = 'noopener noreferrer';
    a.textContent = link.name;

    const removeBtn = document.createElement('button');
    removeBtn.className   = 'link-item__remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove link: ${link.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      links.splice(index, 1);
      saveLinks();
      renderLinks();
    });

    a.appendChild(removeBtn);
    linkList.appendChild(a);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();
  if (!name) { shake(linkNameInput); return; }
  if (!url)  { shake(linkUrlInput);  return; }
  links.push({ name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

renderLinks();
