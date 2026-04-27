import { useMemo, useState } from 'react'
import { X, BarChart3 } from 'lucide-react'
import { useAllSchedules } from '../context/ScheduleContext'
import { useCategories } from '../context/CategoryContext'
import { formatDate, getWeekDates, timeToMinutes } from '../utils'

const RANGE_TABS = [
  { id: 'week',  label: '이번 주' },
  { id: 'month', label: '이번 달' },
]

const PERSON_TABS = [
  { value: 'all-persons', label: '전체',  emoji: '👥' },
  { value: 'all',         label: '공통',  emoji: '👫' },
  { value: 'mom',         label: '엄마', emoji: '👩' },
  { value: 'dad',         label: '아빠', emoji: '👨' },
]

function getRangeDates(rangeId) {
  const today = new Date()
  if (rangeId === 'week') {
    return getWeekDates(today).map(formatDate)
  }
  // month
  const y = today.getFullYear(), m = today.getMonth()
  const last = new Date(y, m + 1, 0).getDate()
  return Array.from({ length: last }, (_, i) => formatDate(new Date(y, m, i + 1)))
}

function durationMin(s) {
  return Math.max(timeToMinutes(s.endTime) - timeToMinutes(s.startTime), 0)
}

function fmtDuration(min) {
  if (min < 60) return `${min}분`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

export default function StatsModal({ onClose }) {
  const allSchedules = useAllSchedules()
  const { categories, getCategory } = useCategories()
  const [range,  setRange]  = useState('week')
  const [person, setPerson] = useState('all-persons')

  const stats = useMemo(() => {
    const dateSet = new Set(getRangeDates(range))
    const filtered = allSchedules
      .filter(s => !s.isBabyPrediction)
      .filter(s => dateSet.has(s.date))
      .filter(s => {
        if (person === 'all-persons') return true
        if (person === 'all') return s.person === 'all' || !s.person
        return s.person === person
      })

    const total = filtered.length
    const completed = filtered.filter(s => s.completed).length

    // 카테고리별 분/건수
    const byCat = new Map()
    for (const s of filtered) {
      const m = durationMin(s)
      const key = s.category || 'other'
      const prev = byCat.get(key) || { min: 0, count: 0, completed: 0 }
      prev.min += m
      prev.count += 1
      if (s.completed) prev.completed += 1
      byCat.set(key, prev)
    }

    const totalMin = [...byCat.values()].reduce((a, b) => a + b.min, 0)

    // 인물별 분
    const byPerson = { all: 0, mom: 0, dad: 0 }
    for (const s of filtered) {
      const m = durationMin(s)
      const p = s.person || 'all'
      byPerson[p] = (byPerson[p] || 0) + m
    }

    // 카테고리 정렬: 분 내림차순
    const catRows = [...byCat.entries()]
      .map(([id, v]) => ({ id, ...v, cat: getCategory(id) }))
      .sort((a, b) => b.min - a.min)

    return { total, completed, totalMin, catRows, byPerson }
  }, [allSchedules, range, person, getCategory])

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const maxCatMin = Math.max(1, ...stats.catRows.map(r => r.min))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-[680px] sm:max-h-[85vh] sm:rounded-3xl bg-warm-50 rounded-t-[28px] shadow-warm-lg animate-slide-up flex flex-col overflow-hidden">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-warm-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-terra" />
            <h2 className="text-[17px] font-bold text-warm-900">통계</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 active:bg-warm-200 transition-colors">
            <X size={15} className="text-warm-600" />
          </button>
        </div>

        {/* Range tabs */}
        <div className="px-5 pb-2 flex gap-1.5 flex-shrink-0">
          {RANGE_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setRange(t.id)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
              style={{
                background: range === t.id ? '#D4715A' : 'rgb(var(--color-warm-200))',
                color:      range === t.id ? '#fff'    : 'rgb(var(--color-warm-500))',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Person tabs */}
        <div className="px-5 pb-3 flex gap-1.5 flex-shrink-0 border-b border-warm-200/60">
          {PERSON_TABS.map(p => (
            <button
              key={p.value}
              onClick={() => setPerson(p.value)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: person === p.value ? '#5E9E8A' : 'rgb(var(--color-warm-200))',
                color:      person === p.value ? '#fff'    : 'rgb(var(--color-warm-500))',
              }}
            >
              <span>{p.emoji}</span>{p.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-4">

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard label="총 일정" value={`${stats.total}개`} sub={fmtDuration(stats.totalMin)} />
            <SummaryCard label="완료율"  value={`${completionPct}%`} sub={`${stats.completed}/${stats.total} 완료`} />
            <SummaryCard label="공통/엄마/아빠" value={`${Math.round(stats.byPerson.all/60) || 0}h / ${Math.round(stats.byPerson.mom/60) || 0}h / ${Math.round(stats.byPerson.dad/60) || 0}h`} sub="시간 합계" small />
          </div>

          {/* Category bar chart */}
          <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
            <h3 className="text-[13px] font-bold text-warm-800 mb-3">카테고리별 시간</h3>
            {stats.catRows.length === 0 ? (
              <p className="text-[12px] text-warm-400 text-center py-6">데이터가 없어요</p>
            ) : (
              <div className="space-y-2">
                {stats.catRows.map(row => {
                  const pct = (row.min / maxCatMin) * 100
                  const compPct = row.count > 0 ? Math.round((row.completed / row.count) * 100) : 0
                  return (
                    <div key={row.id}>
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-[12px] font-semibold" style={{ color: row.cat.color }}>
                          {row.cat.label}
                        </span>
                        <span className="text-[11px] text-warm-500 flex-shrink-0">
                          {fmtDuration(row.min)} · {row.count}건 · {compPct}% 완료
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-warm-200/70 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: row.cat.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, small = false }) {
  return (
    <div className="bg-warm-100 rounded-2xl p-3">
      <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide truncate">{label}</p>
      <p className={`${small ? 'text-[11px]' : 'text-[16px]'} font-bold text-warm-900 mt-0.5`}>{value}</p>
      <p className="text-[10px] text-warm-500 mt-0.5">{sub}</p>
    </div>
  )
}
