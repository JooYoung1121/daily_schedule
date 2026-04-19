/**
 * BabyTime 데이터 분석 엔진
 * 실제 기록 vs 표준 참조 데이터 비교, 패턴 분석, 제안 생성
 */

import { FEEDING_GUIDE, SLEEP_GUIDE, getGuideForAge, SOURCES } from './babyReference'

// ── helpers ──

function toMin(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fromMin(min) {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function avgOfMins(mins) {
  if (mins.length === 0) return 0
  return Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
}

function avgTime(times) {
  if (times.length === 0) return null
  return fromMin(avgOfMins(times.map(toMin)))
}

// ── 일별 요약 ──

function getDailySummary(records, dateStr) {
  const dayRecords = records.filter(r => r.startDate === dateStr)

  const feedings = dayRecords.filter(r => r.type === '분유' || r.type === '모유' || r.type === '유축수유')
  const naps = dayRecords.filter(r => r.type === '낮잠')
  const nightSleep = dayRecords.filter(r => r.type === '밤잠')
  const diapers = dayRecords.filter(r => r.type === '기저귀')
  const plays = dayRecords.filter(r => r.type === '놀이')

  const feedingTotalMl = feedings.reduce((sum, r) => sum + (r.amountMl || 0), 0)
  const feedingCount = feedings.length
  const napTotalMin = naps.reduce((sum, r) => sum + (r.durationMin || 0), 0)
  const napCount = naps.length
  const nightTotalMin = nightSleep.reduce((sum, r) => sum + (r.durationMin || 0), 0)
  const totalSleepMin = napTotalMin + nightTotalMin
  const playCount = plays.length
  const playTotalMin = plays.reduce((sum, r) => sum + (r.durationMin || 0), 0)

  const feedingTimes = feedings.map(r => r.startTime).filter(Boolean).sort()
  const feedingIntervals = []
  for (let i = 1; i < feedingTimes.length; i++) {
    const diff = toMin(feedingTimes[i]) - toMin(feedingTimes[i - 1])
    if (diff > 0) feedingIntervals.push(diff)
  }
  const avgIntervalMin = feedingIntervals.length > 0 ? avgOfMins(feedingIntervals) : 0

  return {
    date: dateStr,
    feeding: { totalMl: feedingTotalMl, count: feedingCount, avgIntervalMin, times: feedingTimes },
    nap: { totalMin: napTotalMin, count: napCount },
    nightSleep: { totalMin: nightTotalMin },
    totalSleepHrs: +(totalSleepMin / 60).toFixed(1),
    diaperCount: diapers.length,
    play: { count: playCount, totalMin: playTotalMin },
  }
}

// ── 다중 일 요약 (최근 N일) ──

function getRecentDates(records, days = 7) {
  const dates = [...new Set(records.map(r => r.startDate).filter(Boolean))].sort().reverse()
  return dates.slice(0, days)
}

function getMultiDayAvg(records, days = 7) {
  const dates = getRecentDates(records, days)
  if (dates.length === 0) return null

  const summaries = dates.map(d => getDailySummary(records, d))
  const n = summaries.length

  return {
    days: n,
    dateRange: { from: dates[dates.length - 1], to: dates[0] },
    avgFeedingMl: Math.round(summaries.reduce((s, d) => s + d.feeding.totalMl, 0) / n),
    avgFeedingCount: +(summaries.reduce((s, d) => s + d.feeding.count, 0) / n).toFixed(1),
    avgFeedingIntervalMin: Math.round(summaries.reduce((s, d) => s + d.feeding.avgIntervalMin, 0) / n),
    avgNapCount: +(summaries.reduce((s, d) => s + d.nap.count, 0) / n).toFixed(1),
    avgNapMin: Math.round(summaries.reduce((s, d) => s + d.nap.totalMin, 0) / n),
    avgNightMin: Math.round(summaries.reduce((s, d) => s + d.nightSleep.totalMin, 0) / n),
    avgTotalSleepHrs: +(summaries.reduce((s, d) => s + d.totalSleepHrs, 0) / n).toFixed(1),
    avgDiaperCount: +(summaries.reduce((s, d) => s + d.diaperCount, 0) / n).toFixed(1),
    avgPlayCount: +(summaries.reduce((s, d) => s + d.play.count, 0) / n).toFixed(1),
    avgPlayMin: Math.round(summaries.reduce((s, d) => s + d.play.totalMin, 0) / n),
    summaries,
  }
}

// ── 표준 대비 분석 ──

function compareWithStandard(avg, totalDays) {
  const feedGuide = getGuideForAge(FEEDING_GUIDE, totalDays)
  const sleepGuide = getGuideForAge(SLEEP_GUIDE, totalDays)

  function getStatus(value, [min, max]) {
    if (value < min * 0.85) return 'low'
    if (value > max * 1.15) return 'high'
    return 'normal'
  }

  return {
    feeding: {
      actual: avg.avgFeedingMl,
      standard: feedGuide.dailyMl,
      label: feedGuide.label,
      status: getStatus(avg.avgFeedingMl, feedGuide.dailyMl),
      count: avg.avgFeedingCount,
      standardCount: feedGuide.timesPerDay,
      intervalMin: avg.avgFeedingIntervalMin,
      source: feedGuide.source,
    },
    sleep: {
      actualHrs: avg.avgTotalSleepHrs,
      standard: sleepGuide.totalHrs,
      label: sleepGuide.label,
      status: getStatus(avg.avgTotalSleepHrs, sleepGuide.totalHrs),
      napCount: avg.avgNapCount,
      standardNapCount: sleepGuide.naps,
      napCountStatus: getStatus(avg.avgNapCount, sleepGuide.naps),
      nightMin: avg.avgNightMin,
      standardNightHrs: sleepGuide.nightHrs,
      source: sleepGuide.source,
    },
  }
}

// ── 패턴 분석 (하루 전체 흐름) ──

function analyzePatterns(records) {
  const dates = getRecentDates(records, 7)
  if (dates.length < 2) return null

  // 각 날짜별 이벤트 시퀀스 수집
  const daySequences = dates.map(dateStr => {
    const dayRecs = records
      .filter(r => r.startDate === dateStr)
      .filter(r => ['분유', '모유', '유축수유', '낮잠', '밤잠', '놀이'].includes(r.type))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    return dayRecs
  })

  // 수유 패턴
  const feedingTimesByDay = daySequences.map(recs =>
    recs.filter(r => r.type === '분유' || r.type === '모유' || r.type === '유축수유')
      .map(r => r.startTime).filter(Boolean)
  )
  const feedingIntervals = []
  feedingTimesByDay.forEach(times => {
    for (let i = 1; i < times.length; i++) {
      const diff = toMin(times[i]) - toMin(times[i - 1])
      if (diff > 0) feedingIntervals.push(diff)
    }
  })

  // 낮잠 패턴 — 모든 낮잠 시각+기간 수집
  const napsByDay = daySequences.map(recs =>
    recs.filter(r => r.type === '낮잠').map(r => ({
      start: r.startTime,
      dur: r.durationMin || 30,
    }))
  )
  // 낮잠 N번째별 평균 시각·기간
  const maxNaps = Math.max(...napsByDay.map(n => n.length), 0)
  const napSlots = []
  for (let i = 0; i < maxNaps; i++) {
    const starts = napsByDay.map(n => n[i]?.start).filter(Boolean)
    const durs = napsByDay.map(n => n[i]?.dur).filter(Boolean)
    if (starts.length >= Math.ceil(dates.length / 2)) {
      napSlots.push({
        avgStart: avgTime(starts),
        avgDur: avgOfMins(durs),
      })
    }
  }

  // 놀이 패턴
  const playsByDay = daySequences.map(recs =>
    recs.filter(r => r.type === '놀이').map(r => ({
      start: r.startTime,
      dur: r.durationMin || 20,
    }))
  )
  const maxPlays = Math.max(...playsByDay.map(p => p.length), 0)
  const playSlots = []
  for (let i = 0; i < maxPlays; i++) {
    const starts = playsByDay.map(p => p[i]?.start).filter(Boolean)
    const durs = playsByDay.map(p => p[i]?.dur).filter(Boolean)
    if (starts.length >= Math.ceil(dates.length / 2)) {
      playSlots.push({
        avgStart: avgTime(starts),
        avgDur: avgOfMins(durs),
      })
    }
  }

  // 밤잠 시작
  const nightStarts = daySequences.map(recs =>
    recs.filter(r => r.type === '밤잠').map(r => r.startTime).filter(Boolean)[0]
  ).filter(Boolean)

  return {
    avgFirstFeeding: avgTime(feedingTimesByDay.map(t => t[0]).filter(Boolean)),
    avgLastFeeding: avgTime(feedingTimesByDay.map(t => t[t.length - 1]).filter(Boolean)),
    avgFeedingInterval: feedingIntervals.length > 0 ? avgOfMins(feedingIntervals) : 180,
    avgFeedingCount: Math.round(feedingTimesByDay.reduce((s, t) => s + t.length, 0) / feedingTimesByDay.length),
    napSlots,
    playSlots,
    avgNightSleepStart: avgTime(nightStarts),
  }
}

// ── 오늘 예상 일정 생성 (하루 전체 흐름) ──

/**
 * firstFeedingOverride: 사용자가 지정한 첫 수유 시각 (null이면 패턴 기반)
 */
function generateTodaySchedule(patterns, avg, firstFeedingOverride = null) {
  if (!patterns) return []

  const events = []
  const interval = patterns.avgFeedingInterval || 180
  const feedCount = patterns.avgFeedingCount || Math.round(avg?.avgFeedingCount || 6)

  // 첫 수유 시각 결정
  const baseFirstFeeding = firstFeedingOverride || patterns.avgFirstFeeding
  if (!baseFirstFeeding) return []

  const baseMin = toMin(baseFirstFeeding)
  // 원래 패턴의 첫 수유 시각과의 차이 (시간 이동량)
  const patternFirstMin = patterns.avgFirstFeeding ? toMin(patterns.avgFirstFeeding) : baseMin
  const timeShift = baseMin - patternFirstMin

  // 수유 일정
  for (let i = 0; i < feedCount; i++) {
    const startMin = baseMin + interval * i
    if (startMin >= 24 * 60) break
    events.push({
      type: 'feeding',
      title: '🍼 수유',
      startTime: fromMin(startMin),
      endTime: fromMin(startMin + 15),
      note: `${i + 1}/${feedCount}회 · 평균 ${interval}분 간격`,
      sortKey: startMin,
    })
  }

  // 낮잠 일정 — 모든 낮잠 슬롯
  patterns.napSlots.forEach((slot, i) => {
    if (!slot.avgStart) return
    const startMin = toMin(slot.avgStart) + timeShift
    const dur = slot.avgDur || 30
    if (startMin < 6 * 60 || startMin >= 22 * 60) return
    events.push({
      type: 'nap',
      title: `😴 낮잠 ${i + 1}`,
      startTime: fromMin(startMin),
      endTime: fromMin(startMin + dur),
      note: `평균 ${dur}분`,
      sortKey: startMin,
    })
  })

  // 놀이 일정
  patterns.playSlots.forEach((slot, i) => {
    if (!slot.avgStart) return
    const startMin = toMin(slot.avgStart) + timeShift
    const dur = slot.avgDur || 20
    if (startMin < 6 * 60 || startMin >= 22 * 60) return
    events.push({
      type: 'play',
      title: `🧸 놀이 ${i + 1}`,
      startTime: fromMin(startMin),
      endTime: fromMin(startMin + dur),
      note: `평균 ${dur}분`,
      sortKey: startMin,
    })
  })

  // 밤잠 시작
  if (patterns.avgNightSleepStart) {
    const startMin = toMin(patterns.avgNightSleepStart) + timeShift
    events.push({
      type: 'night',
      title: '🌙 밤잠 시작',
      startTime: fromMin(startMin),
      endTime: fromMin(startMin + 60),
      note: '밤잠 시작 예상 시각',
      sortKey: startMin,
    })
  }

  return events.sort((a, b) => a.sortKey - b.sortKey)
}

// ── 제안 생성 ──

function generateSuggestions(comparison, patterns, totalDays) {
  const suggestions = []
  const { feeding, sleep } = comparison

  if (feeding.status === 'low') {
    suggestions.push({
      icon: '⚠️', title: '수유량이 표준 범위보다 낮아요',
      detail: `일평균 ${feeding.actual}ml (표준 ${feeding.standard[0]}~${feeding.standard[1]}ml)`,
      advice: '1회 수유량을 10~20ml씩 서서히 늘려보세요. 아기가 거부하면 수유 횟수를 늘리는 것도 방법입니다.',
      source: SOURCES.AAP,
    })
  } else if (feeding.status === 'high') {
    suggestions.push({
      icon: 'ℹ️', title: '수유량이 표준 범위보다 많아요',
      detail: `일평균 ${feeding.actual}ml (표준 ${feeding.standard[0]}~${feeding.standard[1]}ml)`,
      advice: '과식으로 인한 역류나 구토가 없다면 크게 걱정하지 않아도 됩니다. 다만 소아과 정기검진 시 체중 증가 추이를 확인해보세요.',
      source: SOURCES.AAP,
    })
  } else {
    suggestions.push({
      icon: '✅', title: '수유량이 적정 범위예요',
      detail: `일평균 ${feeding.actual}ml (표준 ${feeding.standard[0]}~${feeding.standard[1]}ml)`,
      advice: '현재 수유 패턴을 잘 유지하고 계세요!',
      source: SOURCES.AAP,
    })
  }

  if (sleep.status === 'low') {
    suggestions.push({
      icon: '⚠️', title: '총 수면시간이 표준보다 짧아요',
      detail: `일평균 ${sleep.actualHrs}시간 (표준 ${sleep.standard[0]}~${sleep.standard[1]}시간)`,
      advice: '활동 시간(wake window)을 체크하고, 피곤한 신호(눈 비비기, 하품)가 보이면 바로 재워보세요. 수면 환경(어둡게, 조용하게)도 점검해보세요.',
      source: SOURCES.NSF,
    })
  } else if (sleep.status === 'high') {
    suggestions.push({
      icon: 'ℹ️', title: '수면시간이 표준보다 많아요',
      detail: `일평균 ${sleep.actualHrs}시간 (표준 ${sleep.standard[0]}~${sleep.standard[1]}시간)`,
      advice: '아기가 건강하고 활발하다면 개인차일 수 있습니다. 다만 지나치게 많이 자면 수유량이 줄 수 있으니 수유 횟수를 확인하세요.',
      source: SOURCES.NSF,
    })
  } else {
    suggestions.push({
      icon: '✅', title: '수면시간이 적정 범위예요',
      detail: `일평균 ${sleep.actualHrs}시간 (표준 ${sleep.standard[0]}~${sleep.standard[1]}시간)`,
      advice: '좋은 수면 패턴을 유지하고 계세요!',
      source: SOURCES.NSF,
    })
  }

  if (sleep.napCountStatus === 'low') {
    suggestions.push({
      icon: '💤', title: '낮잠 횟수가 적어요',
      detail: `일평균 ${sleep.napCount}회 (표준 ${sleep.standardNapCount[0]}~${sleep.standardNapCount[1]}회)`,
      advice: '활동 시간이 길어지면 과자극 상태가 되어 오히려 잠들기 어려워질 수 있어요. 피곤한 신호를 일찍 캐치해서 낮잠 기회를 늘려보세요.',
      source: SOURCES.AAP,
    })
  }

  if (feeding.intervalMin > 0) {
    const feedGuide = getGuideForAge(FEEDING_GUIDE, totalDays)
    const expectedMaxInterval = Math.round((24 * 60) / feedGuide.timesPerDay[0])
    if (feeding.intervalMin > expectedMaxInterval * 1.3) {
      suggestions.push({
        icon: '🕐', title: '수유 간격이 다소 길어요',
        detail: `평균 ${feeding.intervalMin}분 간격 (하루 ${feeding.count}회)`,
        advice: `이 시기에는 하루 ${feedGuide.timesPerDay[0]}~${feedGuide.timesPerDay[1]}회 수유가 권장됩니다. 간격을 조금 줄여보세요.`,
        source: SOURCES.AAP,
      })
    }
  }

  suggestions.push({
    icon: '👨‍⚕️', title: '전문의 상담 안내',
    detail: '위 분석은 일반적인 참고 범위 기준이며, 아기마다 개인차가 있습니다.',
    advice: '정확한 평가는 소아청소년과 전문의와 상담하시는 것을 권장합니다.',
    source: SOURCES.KPS,
  })

  return suggestions
}

// ── 메인 분석 함수 ──

/**
 * @param {Array} records - parseBabyTimeText()의 결과
 * @param {number} totalDays - 아기 생후 일수
 * @param {string|null} firstFeedingOverride - 첫 수유 시각 오버라이드 ("HH:MM" or null)
 */
export function analyzeBabyData(records, totalDays, firstFeedingOverride = null) {
  const avg = getMultiDayAvg(records, 7)
  if (!avg) {
    return { error: '분석할 데이터가 부족합니다. 최소 2일 이상의 데이터가 필요합니다.' }
  }

  const comparison = compareWithStandard(avg, totalDays)
  const patterns = analyzePatterns(records)
  const todaySchedule = generateTodaySchedule(patterns, avg, firstFeedingOverride)
  const suggestions = generateSuggestions(comparison, patterns, totalDays)

  return {
    avg,
    comparison,
    patterns,
    todaySchedule,
    suggestions,
  }
}

export function getTodaySummary(records) {
  const today = new Date().toISOString().split('T')[0]
  return getDailySummary(records, today)
}
