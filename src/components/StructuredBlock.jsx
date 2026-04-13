import { Check } from 'lucide-react'
import { timeToTop, blockHeight } from '../utils'
import { useCategories } from '../context/CategoryContext'

export default function StructuredBlock({ schedule, onToggle, onEdit }) {
  const { getCategory } = useCategories()
  const cat    = getCategory(schedule.category)
  const top    = timeToTop(schedule.startTime)
  const height = Math.max(blockHeight(schedule.startTime, schedule.endTime), 44)
  const done   = schedule.completed

  return (
    <div
      className="absolute left-1 right-1 cursor-pointer select-none active:opacity-80 transition-opacity"
      style={{ top, height }}
      onClick={onEdit}
    >
      <div
        className="w-full h-full rounded-[14px] flex items-center gap-2 px-2 shadow-sm overflow-hidden"
        style={{
          backgroundColor: done ? '#F5F0EE' : '#FFFFFF',
          border: `1.5px solid ${done ? '#E5DDD8' : cat.color + '50'}`,
        }}
      >
        {/* Category badge */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[12px] font-bold"
          style={{ backgroundColor: done ? '#C4B8B0' : cat.color }}
        >
          {cat.label[0]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p
            className="text-[11.5px] font-bold leading-tight truncate"
            style={{
              color: done ? '#B0A49E' : '#3D302B',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {schedule.title}
          </p>
          {height >= 52 && (
            <p className="text-[10px] font-medium mt-0.5" style={{ color: cat.color + 'AA' }}>
              {schedule.startTime} – {schedule.endTime}
            </p>
          )}
        </div>

        {/* Check button */}
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
      </div>
    </div>
  )
}
