// ─── GitHub API DB ────────────────────────────────────────────────────────────
// data/schedules.json, data/categories.json 을 GitHub REST API로 관리합니다.
//
// 토큰 우선순위:
//   1. 빌드 시 주입된 환경변수 VITE_GH_PAT  (GitHub Pages 배포용)
//   2. localStorage 'gh_pat'               (로컬 개발 또는 수동 입력 시)

const OWNER = 'JooYoung1121'
const REPO  = 'daily_schedule'

function apiUrl(path) {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const ENV_TOKEN = import.meta.env.VITE_GH_PAT || ''

export function getToken()   { return ENV_TOKEN || localStorage.getItem('gh_pat') || '' }
export function setToken(t)  { localStorage.setItem('gh_pat', t.trim()) }
export function clearToken() { localStorage.removeItem('gh_pat') }
export function hasToken()   { return !!(ENV_TOKEN || localStorage.getItem('gh_pat')) }

function authHeaders() {
  return {
    Authorization:  `Bearer ${getToken()}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

// ─── Encode / decode ──────────────────────────────────────────────────────────

function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

function fromBase64(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))))
}

// ─── Generic file helpers ─────────────────────────────────────────────────────

async function fetchFile(path, fallback) {
  const res = await fetch(apiUrl(path), { headers: authHeaders() })
  if (res.status === 404) return { data: fallback, sha: null }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `GitHub API ${res.status}`)
  }
  const json = await res.json()
  return { data: JSON.parse(fromBase64(json.content)), sha: json.sha }
}

async function saveFile(path, data, sha, commitMsg) {
  const body = {
    message: commitMsg,
    content: toBase64(JSON.stringify(data, null, 2)),
    ...(sha ? { sha } : {}),
  }
  const res = await fetch(apiUrl(path), {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub API ${res.status}`)
  }
  return (await res.json()).content.sha
}

function timestamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export async function fetchSchedules() {
  const { data, sha } = await fetchFile('data/schedules.json', [])
  return { schedules: data, sha }
}

export async function saveSchedules(schedules, sha) {
  return saveFile('data/schedules.json', schedules, sha, `schedules: update ${timestamp()}`)
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  { id: 'work',     label: '업무', color: '#5E9E8A' },
  { id: 'personal', label: '개인', color: '#D4715A' },
  { id: 'health',   label: '건강', color: '#C8924A' },
  { id: 'study',    label: '학습', color: '#8B7EC8' },
  { id: 'other',    label: '기타', color: '#9B8E87' },
]

export async function fetchCategories() {
  const { data, sha } = await fetchFile('data/categories.json', DEFAULT_CATEGORIES)
  return { categories: data, sha }
}

export async function saveCategories(categories, sha) {
  return saveFile('data/categories.json', categories, sha, `categories: update ${timestamp()}`)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  babyBirthdate: '',
}

export async function fetchSettings() {
  const { data, sha } = await fetchFile('data/settings.json', DEFAULT_SETTINGS)
  return { settings: data, sha }
}

export async function saveSettings(settings, sha) {
  return saveFile('data/settings.json', settings, sha, `settings: update ${timestamp()}`)
}

// ─── BabyTime data ───────────────────────────────────────────────────────

export async function fetchBabyTimeData() {
  const { data, sha } = await fetchFile('data/babytime.json', null)
  return { babyData: data, sha }
}

export async function saveBabyTimeData(data, sha) {
  return saveFile('data/babytime.json', data, sha, `babytime: update ${timestamp()}`)
}

// ─── Token test ───────────────────────────────────────────────────────────────

export async function testToken() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}`,
      { headers: authHeaders() },
    )
    if (res.status === 401) return { ok: false, message: '토큰이 유효하지 않아요.' }
    if (res.status === 403) return { ok: false, message: '접근 권한이 없어요.' }
    if (res.status === 404) return { ok: false, message: '레포를 찾을 수 없어요.' }
    if (!res.ok)            return { ok: false, message: `오류 ${res.status}` }
    return { ok: true, message: '연결 성공!' }
  } catch {
    return { ok: false, message: '네트워크 오류가 발생했어요.' }
  }
}
