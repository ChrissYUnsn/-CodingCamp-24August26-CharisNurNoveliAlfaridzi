/* ─────────────────────────────────────────────────────────────────
   PRODUCTIVITY DASHBOARD — app.js
   Sections:
     0. Storage helper (cross-browser / extension safe)
     1. Clock & Greeting
     2. Focus Timer
     3. Tasks
     4. Quick Links
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
   1. CLOCK & GREETING
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
   2. FOCUS TIMER
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
   3. TASKS
═══════════════════════════════════════════════════════════════ */
const taskInput = document.getElementById('task-input');
const taskAddBtn = document.getElementById('task-add');
const taskList  = document.getElementById('task-list');

// Load tasks from storage or use empty list
let tasks = storage.get('tasks', []);

function saveTasks() {
  storage.set('tasks', tasks);
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    checkbox.id      = `task-${index}`;
    checkbox.addEventListener('change', () => {
      // Patch the data and only update this label's style —
      // no full re-render needed for a simple toggle.
      tasks[index].done = checkbox.checked;
      saveTasks();
      label.style.textDecoration = checkbox.checked ? 'line-through' : '';
      label.style.color          = checkbox.checked ? '#9ca3af'      : '';
    });

    const label = document.createElement('label');
    label.className  = 'task-item__label';
    label.htmlFor    = `task-${index}`;
    label.textContent = task.text;
    if (task.done) {
      label.style.textDecoration = 'line-through';
      label.style.color          = '#9ca3af';
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'btn btn--danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

function shake(el) {
  el.classList.remove('input--shake');
  // Force reflow so re-adding the class restarts the animation
  void el.offsetWidth;
  el.classList.add('input--shake');
  el.addEventListener('animationend', () => el.classList.remove('input--shake'), { once: true });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) { shake(taskInput); return; }
  tasks.push({ text, done: false });
  saveTasks();
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
}

taskAddBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask();
});

renderTasks();


/* ═══════════════════════════════════════════════════════════════
   4. QUICK LINKS
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
