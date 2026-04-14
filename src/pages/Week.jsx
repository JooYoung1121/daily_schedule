import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatDate, getWeekDates, getKoreanDay,
  HOUR_HEIGHT, DAY_START, DAY_END,
  timeToTop, blockHeight,
} from '../utils'
import { useWeekSchedules } from '../context/ScheduleContext'
import { useCategories } from '../context/CategoryContext'

const HOURS   = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
const TOTAL_H = (DAY_END - DAY_START) * HOUR_HEIGHT

const PERSON_TABS = [
  { value: 'everyone', label: '전체',  emoji: '👥' },
  { value: 'all',      label: '공통',  emoji: '👫' },
  { value: 'mom',      label: '엄마', emoji: '👩' },
  { value: 'dad',      label: '아빠', emoji: '👨' },
]

export default function Week({ openModal }) {
  const [base, setBase] = useState(new Date())
  const [personFilter, setPersonFilter] = useState('everyone')
  const weekDates    = getWeekDates(base)
  const weekDateStrs = weekDates.map(formatDate)
  const { schedules } = useWeekSchedules(weekDateStrs)
  const { getCategory } = useCategories()

  const todayStr = formatDate(new Date())

  const prevWeek = () => { const d = new Date(base); d.setDate(d.getDate() - 7); setBase(d) }
  const nextWeek = () => { const d = new Date(base); d.setDate(d.getDate() + 7); setBase(d) }

  const filtered = schedules.filter(s => {
    if (personFilter === 'everyone') return true
    if (personFilter === 'all') return !s.person || s.person === 'all'
    return s.person === personFilter
  })

  const monthLabel = (() => {
    const m0 = weekDates[0].getMonth() + 1
    const m6 = weekDates[6].getMonth() + 1
    const y  = weekDates[0].getFullYear()
    return m0 === m6 ? `${y}년 ${m0}월` : `${y}년 ${m0}월 - ${m6}월`
  })()

  return (
    <div className="flex flex-col bg-warm-100 overflow-hidden" style={{ height: '100%' }}>
      <div className="px-5 pt-8 pb-3 flex-shrink-0">
        <h1 className="text-[1.35rem] font-bold text-warm-900 tracking-tight mb-3">주간 일정</h1>
        <div className="flex items-center justify-between">
          <button onClick={prevWeek} className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-200 active:bg-warm-300 transition-colors">
            <ChevronLeft size={18} className="text-warm-700" />
          </button>
          <span className="text-sm font-semibold text-warm-700">{monthLabel}</span>
          <button onClick={nextWeek} className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-200 active:bg-warm-300 transition-colors">
            <ChevronRight size={18} className="text-warm-700" />
          </button>
        </div>
      </div>

      {/* Person filter */}
      <div className="flex gap-1.5 px-5 pb-2 flex-shrink-0">
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

      {/* Day headers */}
      <div className="flex px-4 pb-2 flex-shrink-0">
        <div className="w-[44px] flex-shrink-0" />
        {weekDates.map((date, i) => {
          const isToday = formatDate(date) === todayStr
          const isSun   = date.getDay() === 0
          const isSat   = date.getDay() === 6
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] font-medium text-warm-400">{getKoreanDay(date)}</span>
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-bold
                ${isToday ? 'bg-terra text-white' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-warm-700'}`}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-28">
        <div className="flex">
          <div className="w-[44px] flex-shrink-0 relative select-none" style={{ height: TOTAL_H }}>
            {HOURS.map(h => (
              <div key={h} className="absolute right-1 text-[10px] font-medium text-warm-400"
                   style={{ top: (h - DAY_START) * HOUR_HEIGHT - 7 }}>{h}</div>
            ))}
          </div>

          {weekDates.map((date, dayIdx) => {
            const ds        = formatDate(date)
            const isToday   = ds === todayStr
            const dayScheds = filtered.filter(s => s.date === ds)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))

            return (
              <div key={dayIdx} className="flex-1 relative border-l border-warm-200/60" style={{ height: TOTAL_H }}>
                {HOURS.map(h => (
                  <div key={h} className="absolute left-0 right-0 border-t border-warm-200/60"
                       style={{ top: (h - DAY_START) * HOUR_HEIGHT }} />
                ))}
                {isToday && <div className="absolute inset-0 bg-terra/[0.04] pointer-events-none" />}

                {dayScheds.map(s => {
                  const cat = getCategory(s.category)
                  const top = timeToTop(s.startTime)
                  const h   = Math.max(blockHeight(s.startTime, s.endTime), 20)
                  return (
                    <div
                      key={s.id}
                      className="absolute left-0.5 right-0.5 rounded-md overflow-hidden cursor-pointer active:opacity-70 transition-opacity"
                      style={{ top, height: h, backgroundColor: cat.color + '20', borderLeft: `2.5px solid ${cat.color}`, opacity: s.completed ? 0.45 : 1 }}
                      onClick={() => openModal({ schedule: s })}
                    >
                      <div className="flex items-center gap-0.5 px-1 pt-0.5">
                        {s.person === 'mom' && <span className="text-[8px]">👩</span>}
                        {s.person === 'dad' && <span className="text-[8px]">👨</span>}
                        <p className="text-[10px] font-semibold leading-tight truncate" style={{ color: cat.color }}>
                          {s.title}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
