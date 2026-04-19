/**
 * BabyTime 데이터 분석 엔진
 * 실제 기록 vs 표준 참조 데이터 비교, 패턴 분석, 제안 생성
 */

import { FEEDING_GUIDE, SLEEP_GUIDE, getGuideForAge, SOURCES } from './babyReference'

// ── 일별 요약 ──

function getDailySummary(records, dateStr) {
  const dayRecords = records.filter(r => r.startDate === dateStr)

  const feedings = dayRecords.filter(r => r.type === '분유' || r.type === '모유' || r.type === '유축')
  const naps = dayRecords.filter(r => r.type === '낮잠')
  const nightSleep = dayRecords.filter(r => r.type === '밤잠')
  const diapers = dayRecords.filter(r => r.type === '기저귀')

  const feedingTotalMl = feedings.reduce((sum, r) => sum + (r.amountMl || 0), 0)
  const feedingCount = feedings.length
  const napTotalMin = naps.reduce((sum, r) => sum + (r.durationMin || 0), 0)
  const napCount = naps.length
  const nightTotalMin = nightSleep.reduce((sum, r) => sum + (r.durationMin || 0), 0)
  const totalSleepMin = napTotalMin + nightTotalMin

  // 수유 간격 계산
  const feedingTimes = feedings
    .map(r => r.startTime)
    .filter(Boolean)
    .sort()
  const feedingIntervals = []
  for (let i = 1; i < feedingTimes.length; i++) {
    const [h1, m1] = feedingTimes[i - 1].split(':').map(Number)
    const [h2, m2] = feedingTimes[i].split(':').map(Number)
    feedingIntervals.push((h2 * 60 + m2) - (h1 * 60 + m1))
  }
  const avgIntervalMin = feedingIntervals.length > 0
    ? Math.round(feedingIntervals.reduce((a, b) => a + b, 0) / feedingIntervals.length)
    : 0

  return {
    date: dateStr,
    feeding: { totalMl: feedingTotalMl, count: feedingCount, avgIntervalMin, times: feedingTimes },
    nap: { totalMin: napTotalMin, count: napCount },
    nightSleep: { totalMin: nightTotalMin },
    totalSleepHrs: +(totalSleepMin / 60).toFixed(1),
    diaperCount: diapers.length,
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

  const feedingStatus = getStatus(avg.avgFeedingMl, feedGuide.dailyMl)
  const sleepStatus = getStatus(avg.avgTotalSleepHrs, sleepGuide.totalHrs)
  const napCountStatus = getStatus(avg.avgNapCount, sleepGuide.naps)

  return {
    feeding: {
      actual: avg.avgFeedingMl,
      standard: feedGuide.dailyMl,
      label: feedGuide.label,
      status: feedingStatus,
      count: avg.avgFeedingCount,
      standardCount: feedGuide.timesPerDay,
      intervalMin: avg.avgFeedingIntervalMin,
      source: feedGuide.source,
    },
    sleep: {
      actualHrs: avg.avgTotalSleepHrs,
      standard: sleepGuide.totalHrs,
      label: sleepGuide.label,
      status: sleepStatus,
      napCount: avg.avgNapCount,
      standardNapCount: sleepGuide.naps,
      napCountStatus,
      nightMin: avg.avgNightMin,
      standardNightHrs: sleepGuide.nightHrs,
      source: sleepGuide.source,
    },
  }
}

// ── 패턴 분석 → 다음 예상 시간 ──

function analyzePatterns(records) {
  const dates = getRecentDates(records, 7)
  if (dates.length < 2) return null

  // 각 날짜의 수유 시각 수집
  const feedingTimesByDay = dates.map(d => {
    return records
      .filter(r => r.startDate === d && (r.type === '분유' || r.type === '모유'))
      .map(r => r.startTime)
      .filter(Boolean)
      .sort()
  })

  // 평균 첫 수유, 마지막 수유 시각
  const firstFeedings = feedingTimesByDay.map(t => t[0]).filter(Boolean)
  const lastFeedings = feedingTimesByDay.map(t => t[t.length - 1]).filter(Boolean)

  function avgTime(times) {
    if (times.length === 0) return null
    const totalMin = times.reduce((sum, t) => {
      const [h, m] = t.split(':').map(Number)
      return sum + h * 60 + m
    }, 0)
    const avg = Math.round(totalMin / times.length)
    return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`
  }

  // 수면 패턴
  const napStartsByDay = dates.map(d => {
    return records
      .filter(r => r.startDate === d && r.type === '낮잠')
      .map(r => r.startTime)
      .filter(Boolean)
      .sort()
  })

  const nightStartsByDay = dates.map(d => {
    return records
      .filter(r => r.startDate === d && r.type === '밤잠')
      .map(r => r.startTime)
      .filter(Boolean)
      .sort()
  })

  // 수유 간격 평균
  const allIntervals = []
  feedingTimesByDay.forEach(times => {
    for (let i = 1; i < times.length; i++) {
      const [h1, m1] = times[i - 1].split(':').map(Number)
      const [h2, m2] = times[i].split(':').map(Number)
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1)
      if (diff > 0) allIntervals.push(diff)
    }
  })
  const avgInterval = allIntervals.length > 0
    ? Math.round(allIntervals.reduce((a, b) => a + b, 0) / allIntervals.length)
    : 180

  return {
    avgFirstFeeding: avgTime(firstFeedings),
    avgLastFeeding: avgTime(lastFeedings),
    avgFeedingInterval: avgInterval,
    avgFirstNap: avgTime(napStartsByDay.map(t => t[0]).filter(Boolean)),
    avgNightSleepStart: avgTime(nightStartsByDay.map(t => t[0]).filter(Boolean)),
  }
}

// ── 오늘 예상 일정 생성 ──

function generateTodaySchedule(patterns, avg) {
  if (!patterns) return []

  const schedules = []
  const feedCount = Math.round(avg?.avgFeedingCount || 6)
  const interval = patterns.avgFeedingInterval || 180

  // 수유 일정 생성
  if (patterns.avgFirstFeeding) {
    const [startH, startM] = patterns.avgFirstFeeding.split(':').map(Number)
    let currentMin = startH * 60 + startM

    for (let i = 0; i < feedCount; i++) {
      const h = Math.floor(currentMin / 60) % 24
      const m = currentMin % 60
      const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const endMin = currentMin + 15
      const endH = Math.floor(endMin / 60) % 24
      const endM = endMin % 60
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

      schedules.push({
        type: 'feeding',
        title: '🍼 수유 (예상)',
        startTime,
        endTime,
        note: `패턴 기반 예상 (평균 ${interval}분 간격)`,
      })
      currentMin += interval
    }
  }

  // 첫 낮잠
  if (patterns.avgFirstNap) {
    const avgNapDur = avg?.avgNapMin ? Math.round(avg.avgNapMin / (avg.avgNapCount || 1)) : 40
    const [h, m] = patterns.avgFirstNap.split(':').map(Number)
    const startMin = h * 60 + m
    const endMin = startMin + avgNapDur
    schedules.push({
      type: 'nap',
      title: '😴 낮잠 (예상)',
      startTime: patterns.avgFirstNap,
      endTime: `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
      note: `평균 낮잠 ${avgNapDur}분`,
    })
  }

  // 밤잠 시작
  if (patterns.avgNightSleepStart) {
    const [h, m] = patterns.avgNightSleepStart.split(':').map(Number)
    const startMin = h * 60 + m
    const endMin = startMin + 60
    schedules.push({
      type: 'night',
      title: '🌙 밤잠 시작 (예상)',
      startTime: patterns.avgNightSleepStart,
      endTime: `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`,
      note: '밤잠 시작 예상 시각',
    })
  }

  return schedules.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// ── 제안 생성 ──

function generateSuggestions(comparison, patterns, totalDays) {
  const suggestions = []
  const { feeding, sleep } = comparison

  // 수유량 분석
  if (feeding.status === 'low') {
    suggestions.push({
      icon: '⚠️',
      title: '수유량이 표준 범위보다 낮아요',
      detail: `일평균 ${feeding.actual}ml (표준 ${feeding.standard[0]}~${feeding.standard[1]}ml)`,
      advice: '1회 수유량을 10~20ml씩 서서히 늘려보세요. 아기가 거부하면 수유 횟수를 늘리는 것도 방법입니다.',
      source: SOURCES.AAP,
    })
  } else if (feeding.status === 'high') {
    suggestions.push({
      icon: 'ℹ️',
      title: '수유량이 표준 범위보다 많아요',
      detail: `일평균 ${feeding.actual}ml (표준 ${feeding.standard[0]}~${feeding.standard[1]}ml)`,
      advice: '과식으로 인한 역류나 구토가 없다면 크게 걱정하지 않아도 됩니다. 다만 소아과 정기검진 시 체중 증가 추이를 확인해보세요.',
      source: SOURCES.AAP,
    })
  } else {
    suggestions.push({
      icon: '✅',
      title: '수유량이 적정 범위예요',
      detail: `일평균 ${feeding.actual}ml (표준 ${feeding.standard[0]}~${feeding.standard[1]}ml)`,
      advice: '현재 수유 패턴을 잘 유지하고 계세요!',
      source: SOURCES.AAP,
    })
  }

  // 수면 분석
  if (sleep.status === 'low') {
    suggestions.push({
      icon: '⚠️',
      title: '총 수면시간이 표준보다 짧아요',
      detail: `일평균 ${sleep.actualHrs}시간 (표준 ${sleep.standard[0]}~${sleep.standard[1]}시간)`,
      advice: '활동 시간(wake window)을 체크하고, 피곤한 신호(눈 비비기, 하품)가 보이면 바로 재워보세요. 수면 환경(어둡게, 조용하게)도 점검해보세요.',
      source: SOURCES.NSF,
    })
  } else if (sleep.status === 'high') {
    suggestions.push({
      icon: 'ℹ️',
      title: '수면시간이 표준보다 많아요',
      detail: `일평균 ${sleep.actualHrs}시간 (표준 ${sleep.standard[0]}~${sleep.standard[1]}시간)`,
      advice: '아기가 건강하고 활발하다면 개인차일 수 있습니다. 다만 지나치게 많이 자면 수유량이 줄 수 있으니 수유 횟수를 확인하세요.',
      source: SOURCES.NSF,
    })
  } else {
    suggestions.push({
      icon: '✅',
      title: '수면시간이 적정 범위예요',
      detail: `일평균 ${sleep.actualHrs}시간 (표준 ${sleep.standard[0]}~${sleep.standard[1]}시간)`,
      advice: '좋은 수면 패턴을 유지하고 계세요!',
      source: SOURCES.NSF,
    })
  }

  // 낮잠 횟수
  if (sleep.napCountStatus === 'low') {
    suggestions.push({
      icon: '💤',
      title: '낮잠 횟수가 적어요',
      detail: `일평균 ${sleep.napCount}회 (표준 ${sleep.standardNapCount[0]}~${sleep.standardNapCount[1]}회)`,
      advice: '활동 시간이 길어지면 과자극 상태가 되어 오히려 잠들기 어려워질 수 있어요. 피곤한 신호를 일찍 캐치해서 낮잠 기회를 늘려보세요.',
      source: SOURCES.AAP,
    })
  }

  // 수유 간격
  if (feeding.intervalMin > 0) {
    const feedGuide = getGuideForAge(FEEDING_GUIDE, totalDays)
    const expectedMaxInterval = Math.round((24 * 60) / feedGuide.timesPerDay[0])
    if (feeding.intervalMin > expectedMaxInterval * 1.3) {
      suggestions.push({
        icon: '🕐',
        title: '수유 간격이 다소 길어요',
        detail: `평균 ${feeding.intervalMin}분 간격 (하루 ${feeding.count}회)`,
        advice: `이 시기에는 하루 ${feedGuide.timesPerDay[0]}~${feedGuide.timesPerDay[1]}회 수유가 권장됩니다. 간격을 조금 줄여보세요.`,
        source: SOURCES.AAP,
      })
    }
  }

  // 일반 안내
  suggestions.push({
    icon: '👨‍⚕️',
    title: '전문의 상담 안내',
    detail: '위 분석은 일반적인 참고 범위 기준이며, 아기마다 개인차가 있습니다.',
    advice: '정확한 평가는 소아청소년과 전문의와 상담하시는 것을 권장합니다.',
    source: SOURCES.KPS,
  })

  return suggestions
}

// ── 메인 분석 함수 ──

/**
 * BabyTime 데이터 전체 분석
 * @param {Array} records - parseBabyTimeText()의 결과
 * @param {number} totalDays - 아기 생후 일수
 * @returns {Object} 분석 결과
 */
export function analyzeBabyData(records, totalDays) {
  const avg = getMultiDayAvg(records, 7)
  if (!avg) {
    return { error: '분석할 데이터가 부족합니다. 최소 2일 이상의 데이터가 필요합니다.' }
  }

  const comparison = compareWithStandard(avg, totalDays)
  const patterns = analyzePatterns(records)
  const todaySchedule = generateTodaySchedule(patterns, avg)
  const suggestions = generateSuggestions(comparison, patterns, totalDays)

  return {
    avg,
    comparison,
    patterns,
    todaySchedule,
    suggestions,
  }
}

/**
 * 오늘 날짜 요약
 */
export function getTodaySummary(records) {
  const today = new Date().toISOString().split('T')[0]
  return getDailySummary(records, today)
}
