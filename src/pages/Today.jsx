import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { SlidersHorizontal, Check, Syringe, ExternalLink, Milk, Search, BarChart3, Sparkles, ChevronUp, ChevronDown } from 'lucide-react'
import {
  formatDate, getKoreanDateStr, getGreeting,
  HOUR_HEIGHT, DAY_START, DAY_END,
  timeToTop as _timeToTop, currentTimeTop as _currentTimeTop,
  snapToTime as _snapToTime, blockHeight as _blockHeight,
  timeToMinutes,
} from '../utils'
import { useSchedules, useAllSchedules } from '../context/ScheduleContext'
import { useCategories } from '../context/CategoryContext'
import { useSettings } from '../context/SettingsContext'
import { fetchBabyTimeData } from '../github'
import { analyzeBabyData } from '../data/babyAnalyzer'
import { getNextVaccination, VACCINATION_SOURCE_URL } from '../data/vaccinations'
import StructuredBlock from '../components/StructuredBlock'
import CategoryManager from '../components/CategoryManager'

// Dynamic timeline helpers — effectiveStart can be earlier than DAY_START
function makeTimelineHelpers(effectiveStart) {
  const hours = Array.from({ length: DAY_END - effectiveStart }, (_, i) => effectiveStart + i)
  const totalH = (DAY_END - effectiveStart) * HOUR_HEIGHT
  const toTop = (time) => {
    const [h, m] = time.split(':').map(Number)
    return (h + m / 60 - effectiveStart) * HOUR_HEIGHT
  }
  const height = (s, e) => {
    const diff = timeToMinutes(e) - timeToMinutes(s)
    return Math.max((diff / 60) * HOUR_HEIGHT, 36)
  }
  const nowTop = () => {
    const now = new Date()
    const pos = (now.getHours() + now.getMinutes() / 60 - effectiveStart) * HOUR_HEIGHT
    if (pos < 0 || pos > totalH) return null
    return pos
  }
  const snap = (px) => {
    const raw = px / HOUR_HEIGHT + effectiveStart
    const mins = Math.round(raw * 60 / 30) * 30
    const hour = Math.min(Math.max(Math.floor(mins / 60), effectiveStart), DAY_END - 1)
    const minute = mins % 60
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  return { hours, totalH, toTop, height, nowTop, snap }
}

export default function Today({ openModal, onOpenSearch, onOpenStats }) {
  const today    = new Date()
  const todayStr = formatDate(today)
  const { schedules, loading, toggleComplete, updateSchedule } = useSchedules(todayStr)
  const allSchedules = useAllSchedules()
  const { categories, getCategory } = useCategories()
  const { settings } = useSettings()

  const [filter,        setFilter]        = useState('all')
  const [showCatMgr,    setShowCatMgr]    = useState(false)
  const [personFilter,  setPersonFilter]  = useState('everyone')
  const [compactHeader, setCompactHeader] = useState(() => {
    try { return localStorage.getItem('today_compact_header') === '1' } catch { return false }
  })
  const [showBabyLayer, setShowBabyLayer] = useState(false)
  const [babySchedule,  setBabySchedule]  = useState([])
  const [babyRecords,   setBabyRecords]   = useState(null)
  const [babyTotalDays, setBabyTotalDays] = useState(0)
  const [babyPatterns,  setBabyPatterns]  = useState(null)
  const [firstFeedTime, setFirstFeedTime] = useState(null)
  const [nowTick,       setNowTick]       = useState(() => Date.now())
  const timelineRef = useRef(null)

  const effectiveStart = 0 // 항상 00시부터 표시

  const TL = useMemo(() => makeTimelineHelpers(effectiveStart), [effectiveStart])
  const [nowTop, setNowTop] = useState(() => TL.nowTop())

  const PERSON_TABS = [
    { value: 'everyone', label: '전체',  emoji: '👥' },
    { value: 'all',      label: '공통',  emoji: '👫' },
    { value: 'mom',      label: '엄마', emoji: '👩' },
    { value: 'dad',      label: '아빠', emoji: '👨' },
  ]

  useEffect(() => {
    const t = setInterval(() => setNowTop(TL.nowTop()), 60_000)
    return () => clearInterval(t)
  }, [TL])

  useEffect(() => {
    if (loading || !timelineRef.current) return
    timelineRef.current.scrollTop = nowTop != null ? Math.max(0, nowTop - 120) : 0
  }, [loading]) // eslint-disable-line

  // Load baby data once
  useEffect(() => {
    if (!settings.babyBirthdate) return
    const birth = new Date(settings.babyBirthdate)
    const totalDays = Math.floor((new Date() - birth) / (1000 * 60 * 60 * 24))
    setBabyTotalDays(totalDays)

    fetchBabyTimeData().then(({ babyData }) => {
      if (babyData?.records) setBabyRecords(babyData.records)
    }).catch(() => {})
  }, [settings.babyBirthdate])

  // Re-analyze when records or firstFeedTime changes
  useEffect(() => {
    if (!babyRecords || !babyTotalDays) return
    const result = analyzeBabyData(babyRecords, babyTotalDays, firstFeedTime)
    if (result.todaySchedule) setBabySchedule(result.todaySchedule)
    if (result.patterns) setBabyPatterns(result.patterns)
    // Set default first feed time from pattern (only once)
    if (!firstFeedTime && result.patterns?.avgFirstFeeding) {
      setFirstFeedTime(result.patterns.avgFirstFeeding)
    }
  }, [babyRecords, babyTotalDays, firstFeedTime])

  // 1분마다 tick — 마지막 수유 경과 시간용
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const handleFirstFeedChange = useCallback((e) => {
    setFirstFeedTime(e.target.value)
  }, [])

  const toggleCompactHeader = useCallback(() => {
    setCompactHeader(v => {
      const next = !v
      try { localStorage.setItem('today_compact_header', next ? '1' : '') } catch {}
      return next
    })
  }, [])

  // Filter real schedules (exclude legacy baby predictions)
  const realSchedules = useMemo(() =>
    schedules.filter(s => !s.isBabyPrediction),
    [schedules]
  )

  const displayed = filter === 'all'
    ? realSchedules
    : realSchedules.filter(s => s.category === filter)

  const sorted = [...displayed].sort((a, b) => a.startTime.localeCompare(b.startTime))

  const timelineBlocks = displayed.filter(s => {
    if (personFilter === 'everyone') return true
    if (personFilter === 'all') return !s.person || s.person === 'all'
    return s.person === personFilter
  })

  const completed = realSchedules.filter(s => s.completed).length
  const total     = realSchedules.length

  // 다음 예방접종 — 60일 이내만 표시 (너무 먼 미래는 숨김)
  const nextVacc = useMemo(() => {
    if (!settings.babyBirthdate || !babyTotalDays) return null
    const next = getNextVaccination(babyTotalDays)
    if (!next) return null
    if (next.status === 'future' && next.diffDays > 60) return null
    return next
  }, [settings.babyBirthdate, babyTotalDays])

  // 자주 쓰는 일정 — 최근 60일 내 title 빈도 상위 5개 (오늘 이미 있는 건 제외)
  const quickTemplates = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 60)
    const cutoffStr = formatDate(cutoff)
    const todayTitles = new Set(realSchedules.map(s => (s.title || '').trim()))

    const counts = new Map() // title -> { count, sample }
    for (const s of allSchedules) {
      if (s.isBabyPrediction) continue
      if (!s.title || !s.title.trim()) continue
      if (s.date < cutoffStr) continue
      if (todayTitles.has(s.title.trim())) continue // 오늘 이미 있음
      const key = s.title.trim()
      const prev = counts.get(key) || { count: 0, sample: s }
      prev.count += 1
      // 가장 최근 샘플 유지 (category/person 추론용)
      if (!prev.sample || s.date > prev.sample.date) prev.sample = s
      counts.set(key, prev)
    }
    return [...counts.entries()]
      .filter(([, v]) => v.count >= 2)   // 2회 이상 등장한 것만
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([title, v]) => ({ title, count: v.count, sample: v.sample }))
  }, [allSchedules, realSchedules])

  // 마지막 수유 + 경과 시간 (BabyTime 데이터 기준)
  const feedingTimer = useMemo(() => {
    if (!babyRecords) return null
    let best = null
    for (const r of babyRecords) {
      if (!['분유', '모유', '유축수유'].includes(r.type)) continue
      if (!r.startDate || !r.startTime) continue
      const ts = new Date(`${r.startDate}T${r.startTime}:00`).getTime()
      if (Number.isNaN(ts)) continue
      if (!best || ts > best.ts) best = { ts, startTime: r.startTime, type: r.type }
    }
    if (!best) return null
    const elapsedMin = Math.max(0, Math.floor((nowTick - best.ts) / 60000))
    // 24시간 넘으면 데이터가 stale로 간주, 표시 안 함
    if (elapsedMin > 24 * 60) return null
    return {
      lastTime:    best.startTime,
      lastType:    best.type,
      elapsedMin,
      avgInterval: babyPatterns?.avgFeedingInterval || 180,
    }
  }, [babyRecords, babyPatterns, nowTick])

  function handleGridTap(e) {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    openModal({
      defaultDate: todayStr,
      defaultStartTime: TL.snap(y),
      defaultPerson: (personFilter === 'mom' || personFilter === 'dad') ? personFilter : 'all',
    })
  }

  const hasBabyData = babySchedule.length > 0

  return (
    <div className="flex flex-col bg-warm-100 overflow-hidden" style={{ height: '100%' }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warm-500 mb-0.5">{getGreeting()} ✦</p>
            <h1 className="text-[1.35rem] font-bold text-warm-900 leading-snug tracking-tight">
              {getKoreanDateStr(today)}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
            <button
              onClick={onOpenSearch}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-200 active:bg-warm-300 transition-colors"
              aria-label="검색"
            >
              <Search size={16} className="text-warm-700" />
            </button>
            <button
              onClick={onOpenStats}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-200 active:bg-warm-300 transition-colors"
              aria-label="통계"
            >
              <BarChart3 size={16} className="text-warm-700" />
            </button>
            <button
              onClick={toggleCompactHeader}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-200 active:bg-warm-300 transition-colors"
              aria-label={compactHeader ? '헤더 펼치기' : '헤더 접기'}
            >
              {compactHeader
                ? <ChevronDown size={16} className="text-warm-700" />
                : <ChevronUp   size={16} className="text-warm-700" />}
            </button>
          </div>
        </div>
        {!compactHeader && (
          <>
            {total > 0 && (
              <div className="flex items-center gap-2.5 mt-3">
                <div className="flex-1 h-1.5 rounded-full bg-warm-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-terra transition-all duration-700"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-warm-500">{completed}/{total} 완료</span>
              </div>
            )}
            {total === 0 && !loading && (
              <p className="mt-2 text-sm text-warm-400">오늘 일정이 없어요. 오른쪽 타임라인을 탭해 추가해보세요.</p>
            )}
            {(nextVacc || feedingTimer) && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nextVacc && <VaccinationDdayCard next={nextVacc} />}
                {feedingTimer && <FeedingTimerCard data={feedingTimer} />}
              </div>
            )}
          </>
        )}
      </div>

      {/* Category chips */}
      <div className="px-4 pb-3 flex gap-2 items-center flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1">
          {[{ id: 'all', label: '전체', color: '#9B8E87' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
              style={{
                background: filter === cat.id ? cat.color : cat.color + '18',
                color:      filter === cat.id ? '#fff'    : cat.color,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCatMgr(true)}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-warm-200 active:bg-warm-300 transition-colors"
        >
          <SlidersHorizontal size={14} className="text-warm-600" />
        </button>
      </div>

      {/* Quick templates — 자주 쓰는 일정 (최근 60일 내, 2회+ 등장) */}
      {quickTemplates.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 items-center flex-shrink-0">
          <div className="flex items-center gap-1 text-warm-400 flex-shrink-0">
            <Sparkles size={11} />
            <span className="text-[10px] font-bold uppercase tracking-wide">자주</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
            {quickTemplates.map(({ title, count, sample }) => (
              <button
                key={title}
                onClick={() => openModal({
                  defaultDate:     todayStr,
                  defaultTitle:    title,
                  defaultCategory: sample.category,
                  defaultPerson:   (personFilter === 'mom' || personFilter === 'dad') ? personFilter : (sample.person || 'all'),
                  defaultStartTime: sample.startTime,
                })}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-warm-50 border border-warm-200/60 text-[11px] font-semibold text-warm-700 active:bg-warm-100 active:scale-95 transition-all"
              >
                <span className="truncate max-w-[140px]">{title}</span>
                <span className="text-[9px] text-warm-400">·{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden border-t border-warm-200/60">

        {/* ── Left: Todo list ── */}
        <div className="w-[42%] flex-shrink-0 overflow-y-auto scrollbar-none border-r border-warm-200/60">
          <div className="px-3 pt-2 pb-28 space-y-2">
            {sorted.length === 0 && !loading && (
              <p className="text-[12px] text-warm-300 text-center mt-10">일정이 없어요</p>
            )}
            {sorted.map(s => {
              const cat = getCategory(s.category)
              return (
                <div
                  key={s.id}
                  className="bg-warm-50 rounded-2xl px-3 py-3 shadow-warm-sm border border-warm-200/40"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center active:scale-90 transition-all"
                      style={{
                        borderColor:     cat.color,
                        backgroundColor: s.completed ? cat.color : 'transparent',
                      }}
                      onClick={() => toggleComplete(s)}
                    >
                      {s.completed && <Check size={9} color="white" strokeWidth={3.5} />}
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openModal({ schedule: s })}>
                      <p
                        className="text-[13px] font-bold leading-snug"
                        style={{
                          color: s.completed ? 'rgb(var(--color-warm-400))' : 'rgb(var(--color-warm-900))',
                          textDecoration: s.completed ? 'line-through' : 'none',
                        }}
                      >
                        {s.title}
                      </p>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: cat.color + 'AA' }}>
                        {s.startTime} – {s.endTime}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: cat.color + '20', color: cat.color }}
                        >
                          {cat.label}
                        </span>
                        {s.person === 'mom' && <span className="text-[11px]">👩</span>}
                        {s.person === 'dad' && <span className="text-[11px]">👨</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: Structured timeline ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Person filter tabs + baby toggle */}
          <div className="flex gap-1.5 px-2 py-2 flex-shrink-0 border-b border-warm-200/60">
            {PERSON_TABS.map(p => (
              <button
                key={p.value}
                onClick={() => setPersonFilter(p.value)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  background: personFilter === p.value ? '#D4715A' : 'rgb(var(--color-warm-200))',
                  color:      personFilter === p.value ? '#fff'    : 'rgb(var(--color-warm-500))',
                }}
              >
                <span>{p.emoji}</span>{p.label}
              </button>
            ))}
            {hasBabyData && (
              <button
                onClick={() => setShowBabyLayer(v => !v)}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  background: showBabyLayer ? '#5E9E8A' : 'rgb(var(--color-warm-200))',
                  color:      showBabyLayer ? '#fff'    : 'rgb(var(--color-warm-500))',
                }}
              >
                <span>👶</span>예상
              </button>
            )}
          </div>

          {/* First feeding time adjuster */}
          {showBabyLayer && hasBabyData && (
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-warm-200/60 bg-warm-50 flex-shrink-0">
              <span className="text-[10px] text-warm-500">첫 수유</span>
              <input
                type="time"
                value={firstFeedTime || ''}
                onChange={handleFirstFeedChange}
                className="text-[11px] font-semibold text-warm-800 bg-warm-100 border border-warm-200 rounded-lg px-2 py-1 outline-none w-[80px]"
              />
              <span className="text-[9px] text-warm-400 flex-1">변경 시 전체 일정이 자동 조정됩니다</span>
            </div>
          )}

          <div ref={timelineRef} className="flex-1 overflow-y-auto scrollbar-none">
          <div className="flex pl-1 pt-2 pb-28">
            {/* Time labels */}
            <div className="w-[36px] flex-shrink-0 relative select-none" style={{ height: TL.totalH }}>
              {TL.hours.map(h => (
                <div
                  key={h}
                  className="absolute right-1 text-[9px] font-medium text-warm-400 leading-none"
                  style={{ top: Math.max(0, (h - effectiveStart) * HOUR_HEIGHT - 6) }}
                >
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Grid + blocks */}
            <div
              className="flex-1 relative cursor-pointer pr-2"
              style={{ height: TL.totalH }}
              onClick={handleGridTap}
            >
              {TL.hours.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-warm-200/60"
                  style={{ top: (h - effectiveStart) * HOUR_HEIGHT }}
                />
              ))}

              {nowTop != null && (
                <div
                  className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                  style={{ top: nowTop }}
                >
                  <div className="w-2 h-2 rounded-full bg-terra flex-shrink-0 -ml-1" />
                  <div className="flex-1 border-t-2 border-terra" />
                </div>
              )}

              {/* Baby overlay blocks */}
              {showBabyLayer && babySchedule.map((s, i) => (
                <BabyOverlayBlock key={`baby-${i}`} item={s} effectiveStart={effectiveStart} />
              ))}

              {timelineBlocks.map(s => {
                let position = 'full'
                if (personFilter === 'everyone') {
                  if (s.person === 'mom') position = 'left'
                  else if (s.person === 'dad') position = 'right'
                }
                return (
                  <StructuredBlock
                    key={s.id}
                    schedule={s}
                    position={position}
                    effectiveStart={effectiveStart}
                    onToggle={() => toggleComplete(s)}
                    onEdit={() => openModal({ schedule: s })}
                    onMove={(startTime, endTime) => updateSchedule(s.id, { startTime, endTime })}
                  />
                )
              })}
            </div>
          </div>
          </div>
        </div>
      </div>

      {showCatMgr && <CategoryManager onClose={() => setShowCatMgr(false)} />}
    </div>
  )
}

// ── 예방접종 D-day 카드 (헤더 영역) ──
function VaccinationDdayCard({ next }) {
  const { vaccination: v, status, diffDays } = next

  // status별 색상 — current는 강조, upcoming은 sage, future는 차분
  const palette = {
    current:  { bg: 'rgba(212, 113, 90, 0.12)',  border: 'rgba(212, 113, 90, 0.25)',  fg: '#D4715A', label: '접종 시기' },
    upcoming: { bg: 'rgba(94, 158, 138, 0.12)',  border: 'rgba(94, 158, 138, 0.25)',  fg: '#5E9E8A', label: '다가오는 접종' },
    future:   { bg: 'rgba(155, 142, 135, 0.10)', border: 'rgba(155, 142, 135, 0.20)', fg: '#9B8E87', label: '예정된 접종' },
  }
  const c = palette[status] || palette.future

  // D-day 표기
  const ddayText =
    diffDays > 0  ? `D-${diffDays}` :
    diffDays === 0 ? 'D-day' :
                     `D+${Math.abs(diffDays)}`

  // 백신 미리보기 (앞 2개 + 외 N종)
  const preview = v.vaccines.length <= 2
    ? v.vaccines.join(', ')
    : `${v.vaccines.slice(0, 2).join(', ')} 외 ${v.vaccines.length - 2}종`

  return (
    <a
      href={VACCINATION_SOURCE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 active:scale-[0.99] transition-transform"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: c.fg + '22' }}
      >
        <Syringe size={16} style={{ color: c.fg }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c.fg }}>
          {c.label}
        </p>
        <p className="text-[12px] font-semibold text-warm-900 truncate">
          {v.label} · {preview}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[15px] font-bold" style={{ color: c.fg }}>{ddayText}</span>
        <ExternalLink size={11} style={{ color: c.fg + 'AA' }} />
      </div>
    </a>
  )
}

// ── 마지막 수유 경과 타이머 (BabyTime 데이터 기준) ──
function FeedingTimerCard({ data }) {
  const { lastTime, elapsedMin, avgInterval } = data

  // 평균 간격 대비 경과 비율로 상태 결정
  const status =
    elapsedMin > avgInterval * 1.15 ? 'overdue' :
    elapsedMin > avgInterval * 0.85 ? 'soon'    : 'ok'

  const palette = {
    ok:      { fg: '#5E9E8A', bg: 'rgba(94, 158, 138, 0.12)',  border: 'rgba(94, 158, 138, 0.25)',  label: '여유' },
    soon:    { fg: '#C8924A', bg: 'rgba(200, 146, 74, 0.12)',  border: 'rgba(200, 146, 74, 0.25)',  label: '수유 임박' },
    overdue: { fg: '#D4715A', bg: 'rgba(212, 113, 90, 0.14)',  border: 'rgba(212, 113, 90, 0.30)',  label: '수유 시간' },
  }
  const c = palette[status]

  const fmt = (m) => m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간 ${m % 60}분`
  const pct = Math.min((elapsedMin / Math.max(avgInterval, 1)) * 100, 100)

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: c.fg + '22' }}
      >
        <Milk size={16} style={{ color: c.fg }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: c.fg }}>
          {c.label} · 마지막 {lastTime}
        </p>
        <p className="text-[12px] font-semibold text-warm-900 truncate">
          {fmt(elapsedMin)} 경과 · 평균 {fmt(avgInterval)}
        </p>
        <div className="mt-1 h-1 rounded-full bg-warm-200/80 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: c.fg }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Baby overlay block (non-interactive, visual only) ──
function BabyOverlayBlock({ item, effectiveStart = DAY_START }) {
  const [h, m] = item.startTime.split(':').map(Number)
  const top = (h + m / 60 - effectiveStart) * HOUR_HEIGHT
  const diff = timeToMinutes(item.endTime) - timeToMinutes(item.startTime)
  const height = Math.max((diff / 60) * HOUR_HEIGHT, 28)

  const colors = {
    feeding: { bg: '#5E9E8A' },
    nap:     { bg: '#8B7EC8' },
    night:   { bg: '#5B8DB8' },
    play:    { bg: '#D4715A' },
  }
  const c = colors[item.type] || colors.feeding

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{ top, height, left: '4px', right: '4px' }}
    >
      <div
        className="w-full h-full rounded-[12px] flex items-center gap-1.5 px-2.5 overflow-hidden"
        style={{
          backgroundColor: c.bg + '18',
          border: `1.5px dashed ${c.bg}60`,
        }}
      >
        <span className="text-[11px] flex-shrink-0">{item.title.split(' ')[0]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold truncate" style={{ color: c.bg }}>
            {item.title.replace(/^[^\s]+\s/, '')}
          </p>
          {height >= 36 && (
            <p className="text-[9px]" style={{ color: c.bg + 'AA' }}>
              {item.startTime}~{item.endTime}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
