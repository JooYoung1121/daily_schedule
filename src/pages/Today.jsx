import { useState, useEffect, useRef } from 'react'
import { Settings } from 'lucide-react'
import {
  formatDate, getKoreanDateStr, getGreeting,
  HOUR_HEIGHT, DAY_START, DAY_END,
  timeToTop, currentTimeTop, snapToTime,
} from '../utils'
import { useSchedules } from '../context/ScheduleContext'
import { useCategories } from '../context/CategoryContext'
import TimelineBlock from '../components/TimelineBlock'
import CategoryManager from '../components/CategoryManager'

const HOURS   = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
const TOTAL_H = (DAY_END - DAY_START) * HOUR_HEIGHT

export default function Today({ openModal }) {
  const today    = new Date()
  const todayStr = formatDate(today)
  const { schedules, loading, toggleComplete } = useSchedules(todayStr)
  const { categories } = useCategories()

  const [nowTop,       setNowTop]       = useState(currentTimeTop())
  const [filter,       setFilter]       = useState('all')
  const [showCatMgr,   setShowCatMgr]   = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNowTop(currentTimeTop()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (loading || !scrollRef.current) return
    scrollRef.current.scrollTop = nowTop != null ? Math.max(0, nowTop - 120) : 0
  }, [loading]) // eslint-disable-line

  const displayed = filter === 'all'
    ? schedules
    : schedules.filter(s => s.category === filter)

  const completed = schedules.filter(s => s.completed).length
  const total     = schedules.length

  function handleGridTap(e) {
    if (e.target !== e.currentTarget) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const y     = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0)
    openModal({ defaultDate: todayStr, defaultStartTime: snapToTime(y) })
  }

  return (
    <div className="flex flex-col bg-warm-100 overflow-hidden" style={{ height: '100%' }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warm-500 mb-0.5">{getGreeting()} ✦</p>
            <h1 className="text-[1.35rem] font-bold text-warm-900 leading-snug tracking-tight">
              {getKoreanDateStr(today)}
            </h1>
          </div>
          {/* Category settings button */}
          <button
            onClick={() => setShowCatMgr(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-200 active:bg-warm-300 transition-colors flex-shrink-0 ml-3 mt-1"
          >
            <Settings size={16} className="text-warm-600" />
          </button>
        </div>

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
          <p className="mt-2 text-sm text-warm-400">오늘 일정이 없어요. 하나 추가해볼까요?</p>
        )}
      </div>

      {/* Category filter chips */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
        {[{ id: 'all', label: '전체', color: '#9B8E87' }, ...categories].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95"
            style={{
              background: filter === cat.id ? cat.color : cat.color + '18',
              color:      filter === cat.id ? '#fff'    : cat.color,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-none px-4 pb-28">
        <div className="flex">
          <div className="w-[52px] flex-shrink-0 relative select-none" style={{ height: TOTAL_H }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[11px] font-medium text-warm-400"
                style={{ top: (h - DAY_START) * HOUR_HEIGHT - 8 }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="flex-1 relative cursor-pointer" style={{ height: TOTAL_H }} onClick={handleGridTap}>
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 border-t border-warm-200/60"
                   style={{ top: (h - DAY_START) * HOUR_HEIGHT }} />
            ))}

            {nowTop != null && (
              <div className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                   style={{ top: nowTop }}>
                <div className="w-2.5 h-2.5 rounded-full bg-terra flex-shrink-0 -ml-1" />
                <div className="flex-1 border-t-2 border-terra" />
              </div>
            )}

            {displayed.map(s => (
              <TimelineBlock
                key={s.id}
                schedule={s}
                onToggle={() => toggleComplete(s)}
                onEdit={() => openModal({ schedule: s })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Category Manager modal */}
      {showCatMgr && <CategoryManager onClose={() => setShowCatMgr(false)} />}
    </div>
  )
}
