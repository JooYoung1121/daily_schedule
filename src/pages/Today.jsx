import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'
import {
  formatDate, getKoreanDateStr, getGreeting,
  HOUR_HEIGHT, DAY_START, DAY_END,
  timeToTop, currentTimeTop, snapToTime,
} from '../utils'
import { useSchedules } from '../context/ScheduleContext'
import { useCategories } from '../context/CategoryContext'
import StructuredBlock from '../components/StructuredBlock'
import CategoryManager from '../components/CategoryManager'

const HOURS   = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
const TOTAL_H = (DAY_END - DAY_START) * HOUR_HEIGHT

export default function Today({ openModal }) {
  const today    = new Date()
  const todayStr = formatDate(today)
  const { schedules, loading, toggleComplete } = useSchedules(todayStr)
  const { categories, getCategory } = useCategories()

  const [nowTop,     setNowTop]     = useState(currentTimeTop())
  const [filter,     setFilter]     = useState('all')
  const [showCatMgr,  setShowCatMgr]  = useState(false)
  const [personFilter, setPersonFilter] = useState('everyone')
  const timelineRef = useRef(null)

  const PERSON_TABS = [
    { value: 'everyone', label: '전체',  emoji: '👥' },
    { value: 'all',      label: '공통',  emoji: '👫' },
    { value: 'mom',      label: '엄마', emoji: '👩' },
    { value: 'dad',      label: '아빠', emoji: '👨' },
  ]

  useEffect(() => {
    const t = setInterval(() => setNowTop(currentTimeTop()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (loading || !timelineRef.current) return
    timelineRef.current.scrollTop = nowTop != null ? Math.max(0, nowTop - 120) : 0
  }, [loading]) // eslint-disable-line

  const displayed = filter === 'all'
    ? schedules
    : schedules.filter(s => s.category === filter)

  const sorted = [...displayed].sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Right timeline: filter per person tab
  const timelineBlocks = displayed.filter(s => {
    if (personFilter === 'everyone') return true
    if (personFilter === 'all') return !s.person || s.person === 'all'
    return s.person === personFilter
  })

  const completed = schedules.filter(s => s.completed).length
  const total     = schedules.length

  function handleGridTap(e) {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    openModal({
      defaultDate: todayStr,
      defaultStartTime: snapToTime(y),
      defaultPerson: (personFilter === 'mom' || personFilter === 'dad') ? personFilter : 'all',
    })
  }

  return (
    <div className="flex flex-col bg-warm-100 overflow-hidden" style={{ height: '100%' }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-3 flex-shrink-0">
        <p className="text-sm font-medium text-warm-500 mb-0.5">{getGreeting()} ✦</p>
        <h1 className="text-[1.35rem] font-bold text-warm-900 leading-snug tracking-tight">
          {getKoreanDateStr(today)}
        </h1>
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
                          color: s.completed ? '#B0A49E' : '#3D302B',
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
          {/* Person filter tabs */}
          <div className="flex gap-1.5 px-2 py-2 flex-shrink-0 border-b border-warm-200/60">
            {PERSON_TABS.map(p => (
              <button
                key={p.value}
                onClick={() => setPersonFilter(p.value)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                style={{
                  background: personFilter === p.value ? '#D4715A' : '#F0EAE4',
                  color:      personFilter === p.value ? '#fff'    : '#8A7B72',
                }}
              >
                <span>{p.emoji}</span>{p.label}
              </button>
            ))}
          </div>

          <div ref={timelineRef} className="flex-1 overflow-y-auto scrollbar-none">
          <div className="flex pl-1 pb-28">
            {/* Time labels */}
            <div className="w-[36px] flex-shrink-0 relative select-none" style={{ height: TOTAL_H }}>
              {HOURS.map(h => (
                <div
                  key={h}
                  className="absolute right-1 text-[9px] font-medium text-warm-400 leading-none"
                  style={{ top: (h - DAY_START) * HOUR_HEIGHT - 6 }}
                >
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Grid + blocks */}
            <div
              className="flex-1 relative cursor-pointer pr-2"
              style={{ height: TOTAL_H }}
              onClick={handleGridTap}
            >
              {HOURS.map(h => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-warm-200/60"
                  style={{ top: (h - DAY_START) * HOUR_HEIGHT }}
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
                    onToggle={() => toggleComplete(s)}
                    onEdit={() => openModal({ schedule: s })}
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
