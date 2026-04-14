import { useState, useEffect, useRef } from 'react'
import { X, Trash2, RefreshCw, Plus, Check } from 'lucide-react'
import { formatDate } from '../utils'
import { useScheduleMutations } from '../context/ScheduleContext'
import { useCategories } from '../context/CategoryContext'

const QUICK_PALETTE = [
  '#5E9E8A', '#D4715A', '#C8924A', '#8B7EC8',
  '#9B8E87', '#E07B8C', '#5B8DB8', '#7BAF5E',
]

const REPEAT_OPTIONS = [
  { value: 'none',    label: '반복 없음' },
  { value: 'daily',   label: '매일' },
  { value: 'weekday', label: '주중 (월~금)' },
  { value: 'weekly',  label: '매주 같은 요일' },
  { value: 'monthly', label: '매월 같은 날' },
  { value: 'custom',  label: '요일 선택' },
]

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// Add minutes to HH:MM time string
function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number)
  const total  = Math.min(h * 60 + m + mins, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function ScheduleModal({ schedule, defaultDate, defaultStartTime, onClose }) {
  const { addSchedule, addSchedules, updateSchedule, deleteSchedule } = useScheduleMutations()
  const { categories, getCategory, addCategory } = useCategories()
  const isEdit   = !!(schedule?.id)
  const titleRef = useRef(null)

  const todayStr    = formatDate(new Date())
  const startFallback = defaultStartTime ?? '09:00'
  const DEFAULT_DURATION = 10 // minutes

  const firstCatId = categories[0]?.id ?? 'work'

  const [form, setForm] = useState({
    title:      schedule?.title      ?? '',
    date:       schedule?.date       ?? defaultDate ?? todayStr,
    startTime:  schedule?.startTime  ?? startFallback,
    endTime:    schedule?.endTime    ?? addMinutes(startFallback, DEFAULT_DURATION),
    category:   schedule?.category   ?? firstCatId,
    note:       schedule?.note       ?? '',
    repeat:     schedule?.repeat     ?? 'none',
    person:     schedule?.person     ?? 'all',
    repeatDays: schedule?.repeatDays ?? [],
  })
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showRepeat, setShowRepeat] = useState(
    !!(schedule?.repeat && schedule.repeat !== 'none')
  )
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatLabel, setNewCatLabel] = useState('')
  const [newCatColor, setNewCatColor] = useState('#5E9E8A')

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // Auto-adjust endTime when startTime changes (keep duration, min 10 min)
  function handleStartTimeChange(newStart) {
    const [oh, om] = form.startTime.split(':').map(Number)
    const [eh, em] = form.endTime.split(':').map(Number)
    const duration = Math.max((eh * 60 + em) - (oh * 60 + om), DEFAULT_DURATION)
    setForm(prev => ({
      ...prev,
      startTime: newStart,
      endTime: addMinutes(newStart, duration),
    }))
  }

  // Ensure endTime > startTime when endTime changes
  function handleEndTimeChange(newEnd) {
    const [sh, sm] = form.startTime.split(':').map(Number)
    const [eh, em] = newEnd.split(':').map(Number)
    if (eh * 60 + em <= sh * 60 + sm) {
      newEnd = addMinutes(form.startTime, DEFAULT_DURATION)
    }
    set('endTime', newEnd)
  }

  async function handleAddCat() {
    if (!newCatLabel.trim()) return
    const newCat = await addCategory({ label: newCatLabel.trim(), color: newCatColor })
    if (newCat?.id) set('category', newCat.id)
    setShowAddCat(false)
    setNewCatLabel('')
    setNewCatColor('#5E9E8A')
  }

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  // Generate repeated schedule dates
  function getRepeatDates(startDate, repeat, repeatDays = []) {
    const dates = []
    const base  = new Date(startDate)

    if (repeat === 'custom' && repeatDays.length > 0) {
      let cursor = new Date(base)
      while (dates.length < 30) {
        cursor.setDate(cursor.getDate() + 1)
        if (repeatDays.includes(cursor.getDay())) {
          dates.push(formatDate(cursor))
        }
        if (cursor - base > 365 * 24 * 60 * 60 * 1000) break
      }
      return dates
    }

    for (let i = 1; i <= 30; i++) {
      const d = new Date(base)
      if (repeat === 'daily') {
        d.setDate(base.getDate() + i)
      } else if (repeat === 'weekday') {
        let added = 0, cursor = new Date(base)
        while (added < i) {
          cursor.setDate(cursor.getDate() + 1)
          if (cursor.getDay() !== 0 && cursor.getDay() !== 6) added++
        }
        dates.push(formatDate(cursor))
        continue
      } else if (repeat === 'weekly') {
        d.setDate(base.getDate() + i * 7)
      } else if (repeat === 'monthly') {
        d.setMonth(base.getMonth() + i)
      }
      dates.push(formatDate(d))
    }
    return dates
  }

  async function handleSave() {
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateSchedule(schedule.id, form)
      } else {
        // Collect all dates (main + repeats) and batch-save in ONE persist
        const allDates = [form.date]
        if (form.repeat !== 'none') {
          allDates.push(...getRepeatDates(form.date, form.repeat, form.repeatDays))
        }
        const items = allDates.map(date => ({ ...form, date }))
        await addSchedules(items)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('이 일정을 삭제할까요?') || deleting) return
    setDeleting(true)
    try {
      await deleteSchedule(schedule.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
  }

  function toggleRepeatDay(day) {
    const days = form.repeatDays || []
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day]
    set('repeatDays', next)
  }

  const selectedCat = getCategory(form.category)

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-warm-900/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-[680px] mx-auto bg-warm-50 rounded-t-[28px] shadow-warm-lg animate-slide-up">
        <div className="flex justify-center pt-3">
          <div className="w-9 h-1 rounded-full bg-warm-300" />
        </div>

        <div className="px-5 pt-3 pb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-warm-900">
            {isEdit ? '일정 수정' : '새 일정 추가'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 active:bg-warm-200 transition-colors">
            <X size={15} className="text-warm-600" />
          </button>
        </div>

        <div className="px-5 pb-4 overflow-y-auto scrollbar-none space-y-4 max-h-[72vh]">

          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            placeholder="무엇을 할 예정인가요?"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full text-[18px] font-bold bg-transparent border-b-2 border-warm-200
                       focus:border-terra pb-2 outline-none text-warm-900 placeholder-warm-300 transition-colors"
          />

          {/* Date */}
          <Row label="날짜">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className="flex-1 bg-warm-100 rounded-xl px-3 py-2.5 text-sm text-warm-800 outline-none cursor-pointer" />
          </Row>

          {/* Time */}
          <Row label="시간">
            <input type="time" value={form.startTime}
              onChange={e => handleStartTimeChange(e.target.value)}
              className="flex-1 bg-warm-100 rounded-xl px-3 py-2.5 text-sm text-warm-800 outline-none" />
            <span className="text-warm-400 font-medium text-sm">–</span>
            <input type="time" value={form.endTime}
              onChange={e => handleEndTimeChange(e.target.value)}
              className="flex-1 bg-warm-100 rounded-xl px-3 py-2.5 text-sm text-warm-800 outline-none" />
          </Row>

          {/* Person */}
          <Row label="담당">
            <div className="flex gap-2">
              {[
                { value: 'all', label: '공통', emoji: '👫' },
                { value: 'mom', label: '엄마', emoji: '👩' },
                { value: 'dad', label: '아빠', emoji: '👨' },
              ].map(p => (
                <button
                  key={p.value}
                  onClick={() => set('person', p.value)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                  style={{
                    background: form.person === p.value ? '#D4715A' : '#F5EFE6',
                    color:      form.person === p.value ? '#fff'    : '#8A7B72',
                  }}
                >
                  <span>{p.emoji}</span>{p.label}
                </button>
              ))}
            </div>
          </Row>

          {/* Category */}
          <Row label="카테고리" align="start">
            <div className="flex-1">
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => set('category', cat.id)}
                    className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                    style={{
                      background: form.category === cat.id ? cat.color : cat.color + '18',
                      color:      form.category === cat.id ? '#fff'    : cat.color,
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
                {!showAddCat && (
                  <button
                    onClick={() => setShowAddCat(true)}
                    className="px-3 py-1.5 rounded-full text-[13px] font-semibold border border-dashed border-warm-300 text-warm-400 hover:border-warm-400 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Plus size={12} />추가
                  </button>
                )}
              </div>

              {showAddCat && (
                <div className="mt-2.5 p-3 rounded-2xl bg-warm-100 space-y-2.5">
                  <input
                    autoFocus
                    type="text"
                    placeholder="카테고리 이름"
                    value={newCatLabel}
                    onChange={e => setNewCatLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddCat(); if (e.key === 'Escape') setShowAddCat(false) }}
                    className="w-full bg-white rounded-xl px-3 py-2 text-[13px] text-warm-800 outline-none placeholder-warm-300"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {QUICK_PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewCatColor(c)}
                        className="w-6 h-6 rounded-full transition-transform active:scale-90 flex items-center justify-center"
                        style={{ backgroundColor: c }}
                      >
                        {newCatColor === c && <Check size={11} color="white" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddCat(false); setNewCatLabel('') }}
                      className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-warm-500 bg-white active:bg-warm-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddCat}
                      disabled={!newCatLabel.trim()}
                      className="flex-1 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-40"
                      style={{ backgroundColor: newCatColor }}
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Row>

          {/* Repeat */}
          {!isEdit && (
            <Row label="반복" align="start">
              <div className="flex-1">
                <button
                  onClick={() => {
                    if (showRepeat) { set('repeat', 'none'); set('repeatDays', []) }
                    setShowRepeat(v => !v)
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all
                    ${showRepeat ? 'bg-terra/15 text-terra' : 'bg-warm-100 text-warm-500'}`}
                >
                  <RefreshCw size={13} />
                  {showRepeat
                    ? REPEAT_OPTIONS.find(o => o.value === form.repeat)?.label ?? '반복 설정'
                    : '반복 없음'
                  }
                </button>
                {showRepeat && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {REPEAT_OPTIONS.filter(o => o.value !== 'none').map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('repeat', opt.value)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
                        style={{
                          background: form.repeat === opt.value ? '#D4715A' : '#F5EFE6',
                          color:      form.repeat === opt.value ? '#fff'    : '#8A7B72',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom day picker */}
                {showRepeat && form.repeat === 'custom' && (
                  <div className="mt-2.5 flex gap-1.5">
                    {WEEKDAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => toggleRepeatDay(i)}
                        className="w-9 h-9 rounded-full text-[12px] font-bold transition-all active:scale-90"
                        style={{
                          background: (form.repeatDays || []).includes(i) ? '#D4715A' : '#F0EAE4',
                          color:      (form.repeatDays || []).includes(i) ? '#fff'    : '#8A7B72',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {showRepeat && form.repeat !== 'none' && (
                  <p className="text-xs text-warm-400 mt-1.5">
                    {form.repeat === 'custom' && (form.repeatDays || []).length === 0
                      ? '반복할 요일을 선택하세요'
                      : '오늘부터 30회 반복 생성돼요'
                    }
                  </p>
                )}
              </div>
            </Row>
          )}

          {/* Note */}
          <textarea
            placeholder="메모 (선택 사항)"
            value={form.note}
            onChange={e => set('note', e.target.value)}
            rows={2}
            className="w-full bg-warm-100 rounded-2xl px-4 py-3 text-sm text-warm-800
                       placeholder-warm-300 outline-none resize-none"
          />

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button onClick={handleDelete} disabled={deleting}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50">
                <Trash2 size={18} className="text-red-400" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || saving || (form.repeat === 'custom' && (form.repeatDays || []).length === 0 && showRepeat)}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white text-[15px] transition-all active:brightness-90 disabled:opacity-40"
              style={{ background: selectedCat.color }}
            >
              {saving ? '저장 중…' : isEdit ? '저장하기' : (form.repeat !== 'none' ? '반복 추가' : '추가하기')}
            </button>
          </div>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  )
}

function Row({ label, children, align = 'center' }) {
  return (
    <div className={`flex gap-3 ${align === 'start' ? 'items-start' : 'items-center'}`}>
      <span className="text-sm text-warm-500 w-16 flex-shrink-0 font-medium pt-0.5">{label}</span>
      {children}
    </div>
  )
}
