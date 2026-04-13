// ─── GitHub API DB ────────────────────────────────────────────────────────────
// 레포 내 data/schedules.json 을 DB로 사용합니다.
//
// 토큰 우선순위:
//   1. 빌드 시 주입된 환경변수 VITE_GH_PAT  (GitHub Pages 배포용)
//   2. localStorage 'gh_pat'               (로컬 개발 또는 수동 입력 시)

const OWNER     = 'JooYoung1121'
const REPO      = 'daily_schedule'
const FILE_PATH = 'data/schedules.json'
const API       = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`

// ─── Token helpers ────────────────────────────────────────────────────────────

const ENV_TOKEN = import.meta.env.VITE_GH_PAT || ''

export function getToken()   { return ENV_TOKEN || localStorage.getItem('gh_pat') || '' }
export function setToken(t)  { localStorage.setItem('gh_pat', t.trim()) }
export function clearToken() { localStorage.removeItem('gh_pat') }
// 환경변수가 있으면 항상 토큰이 있는 것으로 간주 → SetupScreen 건너뜀
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

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchSchedules() {
  const res = await fetch(API, { headers: authHeaders() })

  if (res.status === 404) return { schedules: [], sha: null }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `GitHub API ${res.status}`)
  }

  const data = await res.json()
  return {
    schedules: JSON.parse(fromBase64(data.content)),
    sha: data.sha,
  }
}

export async function saveSchedules(schedules, sha) {
  const body = {
    message: `schedules: update ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    content: toBase64(JSON.stringify(schedules, null, 2)),
    ...(sha ? { sha } : {}),
  }

  const res = await fetch(API, {
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
