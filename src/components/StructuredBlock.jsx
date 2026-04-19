import { Check } from 'lucide-react'
import { timeToTop, blockHeight } from '../utils'
import { useCategories } from '../context/CategoryContext'

const PERSON_EMOJI = { mom: '👩', dad: '👨' }

export default function StructuredBlock({ schedule, position = 'full', onToggle, onEdit }) {
  const { getCategory } = useCategories()
  const cat    = getCategory(schedule.category)
  const top    = timeToTop(schedule.startTime)
  const height = Math.max(blockHeight(schedule.startTime, schedule.endTime), 44)
  const done   = schedule.completed
  const compact = position !== 'full'

  // Position style based on layout mode
  const posStyle = position === 'left'
    ? { left: '2px', right: '51%' }
    : position === 'right'
      ? { left: '51%', right: '2px' }
      : { left: '4px', right: '4px' }

  return (
    <div
      className="absolute cursor-pointer select-none active:opacity-80 transition-opacity"
      style={{ top, height, ...posStyle }}
      onClick={onEdit}
    >
      <div
        className={`w-full h-full rounded-[14px] flex items-center shadow-sm overflow-hidden ${compact ? 'gap-1 px-1.5' : 'gap-2 px-2'}`}
        style={{
          backgroundColor: done ? '#F5F0EE' : '#FFFFFF',
          border: `1.5px solid ${done ? '#E5DDD8' : cat.color + '50'}`,
        }}
      >
        {/* Category badge */}
        <div
          className={`rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold ${compact ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-[12px]'}`}
          style={{ backgroundColor: done ? '#C4B8B0' : cat.color }}
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
              color: done ? '#B0A49E' : '#3D302B',
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
              borderColor:     done ? '#C4B8B0' : cat.color,
              backgroundColor: done ? '#C4B8B0' : 'transparent',
            }}
            onClick={e => { e.stopPropagation(); onToggle() }}
          >
            {done && <Check size={9} color="white" strokeWidth={3.5} />}
          </button>
        )}
      </div>
    </div>
  )
}
