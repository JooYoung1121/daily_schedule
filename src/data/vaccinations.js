// ── 국가예방접종 일정 ──
// 출처: 질병관리청 영유아 표준 예방접종 일정
//   https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuLv=1&menuCd=115

export const VACCINATIONS = [
  { days: 0,    label: '출생',      vaccines: ['BCG (결핵)', 'B형간염 1차'] },
  { days: 30,   label: '1개월',     vaccines: ['B형간염 2차'] },
  { days: 60,   label: '2개월',     vaccines: ['DTaP 1차', '폴리오 1차', 'Hib 1차', '폐렴구균 1차', '로타바이러스 1차'] },
  { days: 120,  label: '4개월',     vaccines: ['DTaP 2차', '폴리오 2차', 'Hib 2차', '폐렴구균 2차', '로타바이러스 2차'] },
  { days: 180,  label: '6개월',     vaccines: ['DTaP 3차', '폴리오 3차', 'Hib 3차', '폐렴구균 3차', 'B형간염 3차', '로타바이러스 3차'] },
  { days: 365,  label: '12개월',    vaccines: ['MMR 1차', '수두', 'A형간염 1차', 'Hib 4차', '폐렴구균 4차', '일본뇌염 1차'] },
  { days: 450,  label: '15~18개월', vaccines: ['DTaP 4차', 'MMR 2차'] },
  { days: 730,  label: '24개월',    vaccines: ['A형간염 2차', '일본뇌염 2차'] },
  { days: 1825, label: '만 5세',    vaccines: ['DTaP 5차', '폴리오 4차', '일본뇌염 3차'] },
  { days: 4380, label: '만 12세',   vaccines: ['Tdap/Td', 'HPV (여아 2회)', '일본뇌염 4차'] },
]

export const VACCINATION_SOURCE_URL = 'https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuLv=1&menuCd=115'

// ── Status helpers ──
// 접종 권장 시기를 ±N일로 본다.
//   - upcoming: 권장일 7일 전~당일 (D-7 ~ D-day)
//   - current : 권장일 ~ 21일 후 (접종 시기)
//   - past    : 권장일 21일 초과
const WINDOW_BEFORE = 7
const WINDOW_AFTER  = 21

export function vaccinationStatus(v, totalDays) {
  if (totalDays < v.days - WINDOW_BEFORE) return 'future'
  if (totalDays <= v.days)                return 'upcoming'
  if (totalDays <= v.days + WINDOW_AFTER) return 'current'
  return 'past'
}

/**
 * 다음에 챙겨야 할 접종 한 건을 반환.
 * 우선순위:
 *   1) 현재 접종 시기 (current) — 가장 가까운 것 1개
 *   2) 다가오는 접종 (upcoming) — 가장 가까운 것 1개
 *   3) 미래 예정 (future) — 가장 가까운 것 1개
 *   4) 모두 지난 경우 null
 *
 * @param {number} totalDays - 아기 생후 일수
 * @returns {{ vaccination: object, status: 'current'|'upcoming'|'future', diffDays: number } | null}
 */
export function getNextVaccination(totalDays) {
  if (totalDays == null || totalDays < 0) return null

  let current = null
  let upcoming = null
  let future = null

  for (const v of VACCINATIONS) {
    const status = vaccinationStatus(v, totalDays)
    const diffDays = v.days - totalDays
    if (status === 'current'  && !current)  current  = { vaccination: v, status, diffDays }
    if (status === 'upcoming' && !upcoming) upcoming = { vaccination: v, status, diffDays }
    if (status === 'future'   && !future)   future   = { vaccination: v, status, diffDays }
  }

  return current || upcoming || future || null
}
