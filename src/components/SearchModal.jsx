import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, Calendar } from 'lucide-react'
import { useAllSchedules } from '../context/ScheduleContext'
import { useCategories } from '../context/CategoryContext'
import { formatDate } from '../utils'

const PERSON_TABS = [
  { value: 'all-persons', label: '전체',  emoji: '👥' },
  { value: 'all',         label: '공통',  emoji: '👫' },
  { value: 'mom',         label: '엄마', emoji: '👩' },
  { value: 'dad',         label: '아빠', emoji: '👨' },
]

function formatRelativeDate(dateStr, todayStr) {
  if (dateStr === todayStr) return '오늘'
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(todayStr + 'T00:00:00')
  const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24))
  if (diffDays === -1) return '어제'
  if (diffDays === 1)  return '내일'
  if (diffDays > 0 && diffDays <= 7) return `D-${diffDays}`
  if (diffDays < 0 && diffDays >= -7) return `${-diffDays}일 전`
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function SearchModal({ onClose, onPick }) {
  const allSchedules = useAllSchedules()
  const { categories, getCategory } = useCategories()
  const [query,  setQuery]  = useState('')
  const [catId,  setCatId]  = useState('all')
  const [person, setPerson] = useState('all-persons')
  const inputRef = useRef(null)

  const todayStr = formatDate(new Date())

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allSchedules
      .filter(s => !s.isBabyPrediction)
      .filter(s => {
        if (catId !== 'all' && s.category !== catId) return false
        if (person !== 'all-persons') {
          if (person === 'all' ? !(s.person === 'all' || !s.person) : s.person !== person) return false
        }
        if (!q) return true
        return (s.title || '').toLowerCase().includes(q)
            || (s.note  || '').toLowerCase().includes(q)
      })
      .sort((a, b) => {
        // 가까운 날짜 우선 (todayStr 기준 절대값), 그 안에서는 startTime
        const da = Math.abs(new Date(a.date) - new Date(todayStr))
        const db = Math.abs(new Date(b.date) - new Date(todayStr))
        if (da !== db) return da - db
        return (a.startTime || '').localeCompare(b.startTime || '')
      })
      .slice(0, 80)
  }, [allSchedules, query, catId, person, todayStr])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center animate-fade-in" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-[680px] sm:max-h-[80vh] sm:rounded-3xl bg-warm-50 rounded-t-[28px] shadow-warm-lg animate-slide-up flex flex-col overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-warm-300" />
        </div>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-2 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-warm-100 rounded-2xl px-3 py-2.5">
            <Search size={16} className="text-warm-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="제목·메모로 검색"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[14px] text-warm-900 placeholder-warm-400"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="text-warm-400 active:scale-90 transition-transform">
                <X size={14} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-warm-400 bg-warm-200 px-1.5 py-0.5 rounded">⌘K</kbd>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-warm-100 active:bg-warm-200 transition-colors flex-shrink-0">
            <X size={15} className="text-warm-600" />
          </button>
        </div>

        {/* Filters — categories */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          {[{ id: 'all', label: '전체', color: '#9B8E87' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatId(cat.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
              style={{
                background: catId === cat.id ? cat.color : cat.color + '18',
                color:      catId === cat.id ? '#fff'    : cat.color,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filters — person */}
        <div className="px-4 pb-3 flex gap-1.5 flex-shrink-0 border-b border-warm-200/60">
          {PERSON_TABS.map(p => (
            <button
              key={p.value}
              onClick={() => setPerson(p.value)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: person === p.value ? '#D4715A' : 'rgb(var(--color-warm-200))',
                color:      person === p.value ? '#fff'    : 'rgb(var(--color-warm-500))',
              }}
            >
              <span>{p.emoji}</span>{p.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3 space-y-1.5 max-h-[50vh] sm:max-h-none">
          {results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[13px] text-warm-400">
                {query.trim() || catId !== 'all' || person !== 'all-persons'
                  ? '결과가 없어요'
                  : '검색어를 입력하거나 필터를 선택하세요'}
              </p>
            </div>
          )}
          {results.map(s => {
            const cat   = getCategory(s.category)
            const relD  = formatRelativeDate(s.date, todayStr)
            const isPast = new Date(s.date) < new Date(todayStr)
            return (
              <button
                key={s.id}
                onClick={() => onPick(s)}
                className="w-full text-left bg-warm-50 hover:bg-warm-100 active:bg-warm-100 transition-colors rounded-2xl px-3 py-2.5 flex items-start gap-3 border border-warm-200/40"
                style={{ opacity: isPast ? 0.7 : 1 }}
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: cat.color + '20', color: cat.color }}
                    >
                      {cat.label}
                    </span>
                    {s.person === 'mom' && <span className="text-[11px]">👩</span>}
                    {s.person === 'dad' && <span className="text-[11px]">👨</span>}
                    {s.completed && (
                      <span className="text-[9px] font-bold text-sage bg-sage/10 px-1.5 py-0.5 rounded-full">완료</span>
                    )}
                    {s.repeatGroupId && (
                      <span className="text-[9px] text-warm-400">반복</span>
                    )}
                  </div>
                  <p className="text-[13px] font-bold text-warm-900 mt-0.5 truncate">{s.title}</p>
                  {s.note && (
                    <p className="text-[11px] text-warm-500 mt-0.5 truncate">{s.note}</p>
                  )}
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-warm-600">
                    <Calendar size={10} />
                    {relD}
                  </div>
                  <p className="text-[10px] text-warm-400 mt-0.5">{s.startTime}~{s.endTime}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  )
}
