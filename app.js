// === Constants ===
const DAYS = [
  { key: 'monday', label: '월요일' },
  { key: 'tuesday', label: '화요일' },
  { key: 'wednesday', label: '수요일' },
  { key: 'thursday', label: '목요일' },
  { key: 'friday', label: '금요일' },
  { key: 'saturday', label: '토요일' },
  { key: 'sunday', label: '일요일' },
];

const STORAGE_KEY = 'weekly_schedule';
const HOUR_HEIGHT = 60; // px, matches CSS --hour-height
const START_HOUR = 6;
const END_HOUR = 24;

// === State ===
let currentDay = 'monday';
let editingEventId = null;
let scheduleData = loadData();

// === DOM Elements ===
const timeline = document.getElementById('timeline');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const scheduleForm = document.getElementById('scheduleForm');
const eventTitleInput = document.getElementById('eventTitle');
const startTimeSelect = document.getElementById('startTime');
const endTimeSelect = document.getElementById('endTime');
const colorPicker = document.getElementById('colorPicker');
const btnAdd = document.getElementById('btnAdd');
const btnCancel = document.getElementById('btnCancel');
const btnDelete = document.getElementById('btnDelete');
const modalClose = document.getElementById('modalClose');
const currentDayLabel = document.querySelector('.current-day-label');

// === Data Management ===
function loadData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  // Default empty schedule
  const empty = {};
  DAYS.forEach(d => empty[d.key] = []);
  return empty;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scheduleData));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// === Time Helpers ===
function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function populateTimeSelects() {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = formatTime(h * 60 + m);
      options.push(`<option value="${val}">${val}</option>`);
    }
  }
  // Add 24:00 for end time
  const endOptions = [...options, '<option value="24:00">24:00</option>'];
  startTimeSelect.innerHTML = options.join('');
  endTimeSelect.innerHTML = endOptions.join('');

  // Defaults
  startTimeSelect.value = '09:00';
  endTimeSelect.value = '10:00';
}

// === Timeline Rendering ===
function renderTimeline() {
  timeline.innerHTML = '';

  // Create time slots
  for (let h = START_HOUR; h < END_HOUR; h++) {
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.innerHTML = `
      <div class="time-label">${String(h).padStart(2, '0')}:00</div>
      <div class="time-content" data-hour="${h}"></div>
    `;
    timeline.appendChild(slot);
  }

  // Render events
  const events = scheduleData[currentDay] || [];
  events.forEach(event => renderEvent(event));
}

function renderEvent(event) {
  const startMin = parseTime(event.startTime);
  const endMin = parseTime(event.endTime);
  const durationMin = endMin - startMin;

  if (durationMin <= 0) return;

  // Calculate position relative to START_HOUR
  const topOffset = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = (durationMin / 60) * HOUR_HEIGHT;

  // Only render if visible in the timeline range
  if (topOffset + height <= 0 || topOffset >= (END_HOUR - START_HOUR) * HOUR_HEIGHT) return;

  const block = document.createElement('div');
  block.className = 'event-block';
  block.style.top = `${Math.max(0, topOffset)}px`;
  block.style.height = `${Math.max(24, height)}px`;
  block.style.backgroundColor = event.color || '#4A90D9';
  block.dataset.eventId = event.id;

  block.innerHTML = `
    <span class="event-title">${escapeHtml(event.title)}</span>
    <span class="event-time">${event.startTime} - ${event.endTime}</span>
  `;

  block.addEventListener('click', () => openEditModal(event));

  // Append to the first time-content container (events are absolutely positioned)
  const firstContent = timeline.querySelector('.time-content');
  if (firstContent) {
    firstContent.appendChild(block);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// === Day Tabs ===
function initDayTabs() {
  const tabs = document.querySelectorAll('.day-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentDay = tab.dataset.day;
      updateDayLabel();
      renderTimeline();
    });
  });

  // Set today's day as active
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, ...
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Map JS day to our DAYS index
  const todayIndex = dayMap[jsDay];
  currentDay = DAYS[todayIndex].key;

  tabs.forEach(t => t.classList.remove('active'));
  tabs[todayIndex].classList.add('active');
  updateDayLabel();
}

function updateDayLabel() {
  const day = DAYS.find(d => d.key === currentDay);
  currentDayLabel.textContent = day ? day.label : '';
}

// === Modal ===
function openModal() {
  modalOverlay.classList.add('open');
  eventTitleInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove('open');
  editingEventId = null;
  scheduleForm.reset();
  btnDelete.classList.add('hidden');
  modalTitle.textContent = '일정 추가';
  // Reset color selection
  document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
  document.querySelector('.color-option').classList.add('selected');
  startTimeSelect.value = '09:00';
  endTimeSelect.value = '10:00';
}

function openEditModal(event) {
  editingEventId = event.id;
  modalTitle.textContent = '일정 수정';
  eventTitleInput.value = event.title;
  startTimeSelect.value = event.startTime;
  endTimeSelect.value = event.endTime;

  // Select color
  document.querySelectorAll('.color-option').forEach(c => {
    c.classList.toggle('selected', c.dataset.color === event.color);
  });

  btnDelete.classList.remove('hidden');
  openModal();
}

function getSelectedColor() {
  const selected = colorPicker.querySelector('.color-option.selected');
  return selected ? selected.dataset.color : '#4A90D9';
}

// === Event Handlers ===
btnAdd.addEventListener('click', () => {
  editingEventId = null;
  closeModal(); // reset form
  openModal();
});

btnCancel.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Color picker
colorPicker.addEventListener('click', (e) => {
  const option = e.target.closest('.color-option');
  if (!option) return;
  document.querySelectorAll('.color-option').forEach(c => c.classList.remove('selected'));
  option.classList.add('selected');
});

// Save event
scheduleForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = eventTitleInput.value.trim();
  const startTime = startTimeSelect.value;
  const endTime = endTimeSelect.value;
  const color = getSelectedColor();

  if (!title) return;
  if (parseTime(endTime) <= parseTime(startTime)) {
    alert('종료 시간은 시작 시간보다 늦어야 합니다.');
    return;
  }

  if (editingEventId) {
    // Update existing event
    const events = scheduleData[currentDay];
    const idx = events.findIndex(ev => ev.id === editingEventId);
    if (idx !== -1) {
      events[idx] = { ...events[idx], title, startTime, endTime, color };
    }
  } else {
    // Add new event
    scheduleData[currentDay].push({
      id: generateId(),
      title,
      startTime,
      endTime,
      color,
    });
  }

  saveData();
  closeModal();
  renderTimeline();
});

// Delete event
btnDelete.addEventListener('click', () => {
  if (!editingEventId) return;
  if (!confirm('이 일정을 삭제하시겠습니까?')) return;

  scheduleData[currentDay] = scheduleData[currentDay].filter(ev => ev.id !== editingEventId);
  saveData();
  closeModal();
  renderTimeline();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// === Init ===
populateTimeSelects();
initDayTabs();
renderTimeline();
