// ─── Categories ──────────────────────────────────────────────────────────────
export const CATEGORIES = {
  work:     { id: 'work',     label: '업무', color: '#5E9E8A', bg: '#EBF5F2', light: '#C2DDD6' },
  personal: { id: 'personal', label: '개인', color: '#D4715A', bg: '#FAF0EB', light: '#F5C4AF' },
  health:   { id: 'health',   label: '건강', color: '#C8924A', bg: '#FAF3E8', light: '#EDC99A' },
  study:    { id: 'study',    label: '학습', color: '#8B7EC8', bg: '#F2F0FA', light: '#C9C3E8' },
  other:    { id: 'other',    label: '기타', color: '#9B8E87', bg: '#F5F0EE', light: '#D4CBC7' },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

// ─── Timeline constants ───────────────────────────────────────────────────────
export const HOUR_HEIGHT = 80   // px per hour
export const DAY_START   = 6    // 6 AM
export const DAY_END     = 24   // midnight

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getWeekDates(centerDate) {
  const day     = centerDate.getDay()
  const monday  = new Date(centerDate)
  monday.setDate(centerDate.getDate() - ((day + 6) % 7))

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const SHORT_DAYS = ['일', '월', '화', '수', '목', '금', '토']
const LONG_DAYS  = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

export function getKoreanDay(date, short = true) {
  return short ? SHORT_DAYS[date.getDay()] : LONG_DAYS[date.getDay()]
}

export function getKoreanDateStr(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${getKoreanDay(date, false)}`
}

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 6)  return '좋은 새벽이에요'
  if (h < 12) return '좋은 아침이에요'
  if (h < 14) return '점심 시간이에요'
  if (h < 18) return '좋은 오후예요'
  if (h < 22) return '좋은 저녁이에요'
  return '오늘도 수고했어요'
}

// ─── Time / position helpers ──────────────────────────────────────────────────

export function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Returns top offset (px) of a given HH:MM time within the timeline */
export function timeToTop(time) {
  const [h, m] = time.split(':').map(Number)
  return (h + m / 60 - DAY_START) * HOUR_HEIGHT
}

/** Returns height (px) of a block spanning startTime → endTime */
export function blockHeight(startTime, endTime) {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime)
  return Math.max((diff / 60) * HOUR_HEIGHT, 36)
}

/** Current time position (px) within the timeline, or null if outside range */
export function currentTimeTop() {
  const now = new Date()
  const pos = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_HEIGHT
  if (pos < 0 || pos > (DAY_END - DAY_START) * HOUR_HEIGHT) return null
  return pos
}

/** Snap a pixel offset to the nearest 15-minute slot, return HH:MM */
export function snapToTime(px) {
  const raw    = px / HOUR_HEIGHT + DAY_START       // fractional hour
  const mins   = Math.round(raw * 60 / 15) * 15    // snap to 15 min
  const hour   = Math.min(Math.max(Math.floor(mins / 60), DAY_START), DAY_END - 1)
  const minute = mins % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
