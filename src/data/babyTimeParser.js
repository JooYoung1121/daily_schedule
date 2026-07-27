/**
 * BabyTime 앱 export txt 파일 파싱기
 * 포맷: `====================` 구분자로 레코드 분리
 * 기록 종류: 분유, 모유, 이유식, 낮잠, 밤잠, 기저귀, 목욕, 열
 */

const RECORD_SEPARATOR = '===================='

// "2026-04-19 05:00 PM" → { date: "2026-04-19", time: "17:00" }
function parseDateTime(str) {
  const trimmed = str.trim()
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  const [, date, hourStr, min, ampm] = match
  let hour = parseInt(hourStr, 10)
  if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12
  if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0
  return { date, time: `${String(hour).padStart(2, '0')}:${min}` }
}

// 단일 레코드 블록 파싱
function parseRecord(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  const record = {
    startDate: null, startTime: null,
    endDate: null, endTime: null,
    type: null, durationMin: null,
    amountMl: null, side: null,
    diaperType: null, diaperColor: null,
    temperature: null,
    amountUnit: null, weaningFood: null,
    memo: null,
  }

  // 첫 줄: 시간 범위 또는 단일 시간
  const timeLine = lines[0]
  if (timeLine.includes('~')) {
    const [startStr, endStr] = timeLine.split('~')
    const start = parseDateTime(startStr)
    const end = parseDateTime(endStr)
    if (start) { record.startDate = start.date; record.startTime = start.time }
    if (end) { record.endDate = end.date; record.endTime = end.time }
  } else {
    const dt = parseDateTime(timeLine)
    if (dt) { record.startDate = dt.date; record.startTime = dt.time }
  }

  // 나머지 줄 파싱
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('기록 종류:')) {
      record.type = line.replace('기록 종류:', '').trim()
    } else if (line.startsWith('소요시간:')) {
      const m = line.match(/(\d+)/)
      if (m) record.durationMin = parseInt(m[1], 10)
    } else if (line.includes('총 양(ml):') || line.includes('총양(ml):')) {
      // BabyTime은 이유식 양의 제목은 "(ml)"로 내보내면서 실제 단위는
      // 값 뒤에 (ml) 또는 (g)로 기록한다.
      const m = line.match(/([\d.]+)\s*\((ml|g)\)/i)
      if (m) {
        record.amountMl = Number(m[1])
        record.amountUnit = m[2].toLowerCase()
      }
    } else if (line.startsWith('이유식 종류:')) {
      record.weaningFood = line.replace('이유식 종류:', '').trim() || null
    } else if (line.startsWith('메모:')) {
      record.memo = line.replace('메모:', '').trim() || null
    } else if (line.startsWith('수유 방향:') || line.startsWith('유축 방향:')) {
      record.side = line.split(':')[1]?.trim() || null
    } else if (line.startsWith('배변 형태:')) {
      record.diaperType = line.replace('배변 형태:', '').trim()
    } else if (line.startsWith('배변색:')) {
      record.diaperColor = line.replace('배변색:', '').trim()
    } else if (line.startsWith('체온:')) {
      const m = line.match(/([\d.]+)/)
      if (m) record.temperature = parseFloat(m[1])
    }
  }

  return record.type ? record : null
}

/**
 * BabyTime txt 파일 내용을 파싱하여 레코드 배열 반환
 * @param {string} text - txt 파일 전체 텍스트
 * @returns {Array} 파싱된 레코드 배열 (최신순 → 오래된순 정렬됨)
 */
export function parseBabyTimeText(text) {
  const blocks = text.split(RECORD_SEPARATOR).filter(b => b.trim())
  const records = []
  for (const block of blocks) {
    const record = parseRecord(block)
    if (record) records.push(record)
  }
  return records
}

/**
 * 여러 파일의 레코드를 합치고 날짜 오름차순 정렬
 */
export function mergeAndSort(recordArrays) {
  const all = recordArrays.flat()
  return all.sort((a, b) => {
    const da = `${a.startDate} ${a.startTime}`
    const db = `${b.startDate} ${b.startTime}`
    return da.localeCompare(db)
  })
}

/**
 * 새로 가져온 월만 교체하고, 그 외 월의 기존 기록은 보존한다.
 * 한 달을 다시 내보내 업로드해도 과거 전체 기록이 사라지지 않도록 한다.
 */
export function replaceMonths(existingRecords = [], incomingRecords = []) {
  const incomingMonths = new Set(
    incomingRecords.map(record => record.startDate?.slice(0, 7)).filter(Boolean),
  )
  const preserved = existingRecords.filter(record =>
    !incomingMonths.has(record.startDate?.slice(0, 7)),
  )
  const seen = new Set()
  return mergeAndSort([preserved, incomingRecords]).filter(record => {
    const key = JSON.stringify(record)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * 파일 업로드 핸들러 — FileReader로 txt 읽기
 * @param {File} file
 * @returns {Promise<Array>} 파싱된 레코드 배열
 */
export function readBabyTimeFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const records = parseBabyTimeText(e.target.result)
        resolve(records)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 특정 날짜의 레코드만 필터
 */
export function filterByDate(records, dateStr) {
  return records.filter(r => r.startDate === dateStr)
}

/**
 * 특정 타입의 레코드만 필터
 */
export function filterByType(records, type) {
  return records.filter(r => r.type === type)
}
