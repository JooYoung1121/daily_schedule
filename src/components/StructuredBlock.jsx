import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { HOUR_HEIGHT, DAY_START, timeToMinutes } from '../utils'
import { useCategories } from '../context/CategoryContext'

const PERSON_EMOJI = { mom: '👩', dad: '👨' }

// 드래그 임계값 — 이 거리 미만이면 클릭으로 처리
const DRAG_THRESHOLD_PX = 8
const SNAP_MIN = 30
const DAY_END_MIN = 24 * 60

function minToTime(min) {
  const m = Math.max(0, Math.min(DAY_END_MIN - 1, Math.round(min)))
  const h = Math.floor(m / 60)
  const r = m % 60
  return `${String(h).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export default function StructuredBlock({ schedule, position = 'full', effectiveStart, onToggle, onEdit, onMove }) {
  const { getCategory } = useCategories()
  const cat = getCategory(schedule.category)
  const es = effectiveStart ?? DAY_START
  const [sh, sm] = schedule.startTime.split(':').map(Number)
  const top = (sh + sm / 60 - es) * HOUR_HEIGHT
  const diff = timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime)
  const height = Math.max((diff / 60) * HOUR_HEIGHT, 44)
  const done   = schedule.completed
  const compact = position !== 'full'

  const posStyle = position === 'left'
    ? { left: '2px', right: '51%' }
    : position === 'right'
      ? { left: '51%', right: '2px' }
      : { left: '4px', right: '4px' }

  // ── 드래그 상태 ──
  const [dragOffset, setDragOffset] = useState(0)
  const [previewTime, setPreviewTime] = useState(null)
  const dragRef = useRef({ startY: 0, started: false, dragging: false })

  function handlePointerDown(e) {
    // 체크 버튼 클릭은 드래그로 진입하지 않음 (별도 stopPropagation)
    if (!onMove) return
    dragRef.current = { startY: e.clientY, started: true, dragging: false }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  function handlePointerMove(e) {
    const st = dragRef.current
    if (!st.started) return
    const delta = e.clientY - st.startY

    if (!st.dragging && Math.abs(delta) >= DRAG_THRESHOLD_PX) {
      st.dragging = true
    }
    if (!st.dragging) return

    // 분 단위 변화량을 30분 단위로 snap
    const minDelta = Math.round((delta / HOUR_HEIGHT) * 60 / SNAP_MIN) * SNAP_MIN
    const startMin = sh * 60 + sm + minDelta
    const clamped  = Math.max(0, Math.min(DAY_END_MIN - diff, startMin))
    const snappedDeltaPx = ((clamped - (sh * 60 + sm)) / 60) * HOUR_HEIGHT
    setDragOffset(snappedDeltaPx)
    setPreviewTime(minToTime(clamped))
  }

  function handlePointerUp() {
    const st = dragRef.current
    const wasDragging = st.dragging
    const newStart = previewTime
    dragRef.current = { startY: 0, started: false, dragging: false }
    setDragOffset(0)
    setPreviewTime(null)

    if (wasDragging && newStart) {
      const newEnd = minToTime(timeToMinutes(newStart) + diff)
      // 변경 없을 때는 호출 안 함
      if (newStart !== schedule.startTime) {
        onMove?.(newStart, newEnd)
      }
    } else if (!wasDragging) {
      onEdit?.()
    }
  }

  function handlePointerCancel() {
    dragRef.current = { startY: 0, started: false, dragging: false }
    setDragOffset(0)
    setPreviewTime(null)
  }

  const dragging = !!previewTime

  return (
    <div
      className="absolute select-none"
      style={{
        top,
        height,
        ...posStyle,
        transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
        zIndex: dragging ? 40 : undefined,
        cursor: onMove ? (dragging ? 'grabbing' : 'pointer') : 'pointer',
        touchAction: 'none', // 모바일 스크롤 방지
        transition: dragging ? 'none' : 'opacity 0.15s',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* 드래그 중 시간 미리보기 */}
      {dragging && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-terra text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-warm whitespace-nowrap z-10">
          {previewTime} – {minToTime(timeToMinutes(previewTime) + diff)}
        </div>
      )}

      <div
        className={`w-full h-full rounded-[14px] flex items-center shadow-sm overflow-hidden ${compact ? 'gap-1 px-1.5' : 'gap-2 px-2'}`}
        style={{
          backgroundColor: done ? 'rgb(var(--color-warm-100))' : 'rgb(var(--color-warm-50))',
          border: `1.5px solid ${done ? 'rgb(var(--color-warm-200))' : cat.color + '50'}`,
          opacity: dragging ? 0.92 : 1,
          boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.20)' : undefined,
        }}
      >
        {/* Category badge */}
        <div
          className={`rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold ${compact ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-[12px]'}`}
          style={{ backgroundColor: done ? 'rgb(var(--color-warm-400))' : cat.color }}
        >
          {compact && schedule.person && PERSON_EMOJI[schedule.person]
            ? PERSON_EMOJI[schedule.person]
            : cat.label[0]
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p
            className={`font-bold leading-tight truncate ${compact ? 'text-[10px]' : 'text-[11.5px]'}`}
            style={{
              color: done ? 'rgb(var(--color-warm-400))' : 'rgb(var(--color-warm-900))',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {schedule.title}
          </p>
          {!compact && height >= 52 && (
            <p className="text-[10px] font-medium mt-0.5" style={{ color: cat.color + 'AA' }}>
              {schedule.startTime} – {schedule.endTime}
            </p>
          )}
        </div>

        {/* Check button */}
        {!compact && (
          <button
            className="w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center active:scale-90 transition-all"
            style={{
              borderColor:     done ? 'rgb(var(--color-warm-400))' : cat.color,
              backgroundColor: done ? 'rgb(var(--color-warm-400))' : 'transparent',
            }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onToggle() }}
          >
            {done && <Check size={9} color="white" strokeWidth={3.5} />}
          </button>
        )}
      </div>
    </div>
  )
}
