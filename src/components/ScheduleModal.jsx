import { useState, useEffect, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import { CATEGORY_LIST, formatDate } from '../utils'
import { useScheduleMutations } from '../context/ScheduleContext'

export default function ScheduleModal({ schedule, defaultDate, defaultStartTime, onClose }) {
  const { addSchedule, updateSchedule, deleteSchedule } = useScheduleMutations()
  const isEdit = !!(schedule && schedule.id)
  const titleRef = useRef(null)

  const todayStr = formatDate(new Date())
  const defaultEnd = (() => {
    if (!defaultStartTime) return '10:00'
    const [h, m] = defaultStartTime.split(':').map(Number)
    const end = h + 1
    return `${String(Math.min(end, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })()

  const [form, setForm] = useState({
    title:     schedule?.title     || '',
    date:      schedule?.date      || defaultDate || todayStr,
    startTime: schedule?.startTime || defaultStartTime || '09:00',
    endTime:   schedule?.endTime   || defaultEnd,
    category:  schedule?.category  || 'work',
    note:      schedule?.note      || '',
  })
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // Auto-focus title on open
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  async function handleSave() {
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      if (isEdit) {
        await updateSchedule(schedule.id, form)
      } else {
        await addSchedule(form)
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

  // Keyboard: Enter saves, Escape closes
  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
  }

  const selectedCat = CATEGORY_LIST.find(c => c.id === form.category) || CATEGORY_LIST[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end animate-fade-in"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-warm-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-[680px] mx-auto bg-warm-50 rounded-t-[28px] shadow-warm-lg animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-9 h-1 rounded-full bg-warm-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-warm-900">
            {isEdit ? '일정 수정' : '새 일정 추가'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-100 active:bg-warm-200 transition-colors"
          >
            <X size={15} className="text-warm-600" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 pb-4 overflow-y-auto scrollbar-none space-y-4 max-h-[72vh]">

          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            placeholder="무엇을 할 예정인가요?"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full text-[18px] font-bold bg-transparent border-b-2 border-warm-200
                       focus:border-terra pb-2 outline-none text-warm-900 placeholder-warm-300
                       transition-colors"
          />

          {/* Date */}
          <Row label="날짜">
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="flex-1 bg-warm-100 rounded-xl px-3 py-2.5 text-sm text-warm-800
                         outline-none cursor-pointer"
            />
          </Row>

          {/* Time */}
          <Row label="시간">
            <input
              type="time"
              value={form.startTime}
              onChange={e => set('startTime', e.target.value)}
              className="flex-1 bg-warm-100 rounded-xl px-3 py-2.5 text-sm text-warm-800 outline-none"
            />
            <span className="text-warm-400 font-medium text-sm">–</span>
            <input
              type="time"
              value={form.endTime}
              onChange={e => set('endTime', e.target.value)}
              className="flex-1 bg-warm-100 rounded-xl px-3 py-2.5 text-sm text-warm-800 outline-none"
            />
          </Row>

          {/* Category */}
          <Row label="카테고리" align="start">
            <div className="flex gap-2 flex-wrap flex-1">
              {CATEGORY_LIST.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => set('category', cat.id)}
                  className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                  style={{
                    background: form.category === cat.id ? cat.color : cat.bg,
                    color:      form.category === cat.id ? '#fff'    : cat.color,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Row>

          {/* Note */}
          <textarea
            placeholder="메모 (선택 사항)"
            value={form.note}
            onChange={e => set('note', e.target.value)}
            rows={2}
            className="w-full bg-warm-100 rounded-2xl px-4 py-3 text-sm text-warm-800
                       placeholder-warm-300 outline-none resize-none"
          />

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50
                           active:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} className="text-red-400" />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white text-[15px]
                         transition-all active:brightness-90 disabled:opacity-40"
              style={{ background: selectedCat.color }}
            >
              {saving ? '저장 중…' : isEdit ? '저장하기' : '추가하기'}
            </button>
          </div>
        </div>

        {/* Safe area */}
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
