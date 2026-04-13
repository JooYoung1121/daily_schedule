import { Check } from 'lucide-react'
import { timeToTop, blockHeight } from '../utils'
import { useCategories } from '../context/CategoryContext'

export default function TimelineBlock({ schedule, onToggle, onEdit }) {
  const { getCategory } = useCategories()
  const cat    = getCategory(schedule.category)
  const top    = timeToTop(schedule.startTime)
  const height = blockHeight(schedule.startTime, schedule.endTime)
  const done   = schedule.completed

  const bg = done ? '#F0ECE8' : cat.color + '28'
  const border = done ? '#C4B8B0' : cat.color

  return (
    <div
      className="absolute left-1 right-1 rounded-2xl overflow-hidden cursor-pointer select-none
                 active:scale-[0.98] transition-transform shadow-warm-sm"
      style={{ top, height, backgroundColor: bg, borderLeft: `3.5px solid ${border}` }}
      onClick={onEdit}
    >
      <div className="px-3 py-2 flex items-start justify-between h-full gap-2">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p
            className="text-[13px] font-bold leading-snug"
            style={{
              color:          done ? '#B0A49E' : cat.color,
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {schedule.title}
          </p>
          {height >= 52 && (
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: done ? '#C4B8B0' : cat.color + 'AA' }}>
              {schedule.startTime} – {schedule.endTime}
            </p>
          )}
          {height >= 68 && schedule.note && (
            <p className="text-[11px] mt-1 text-warm-400 truncate">{schedule.note}</p>
          )}
        </div>
        <button
          className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                     transition-all active:scale-90"
          style={{
            borderColor:     done ? '#C4B8B0' : cat.color,
            backgroundColor: done ? '#C4B8B0' : 'transparent',
          }}
          onClick={e => { e.stopPropagation(); onToggle() }}
        >
          {done && <Check size={10} color="white" strokeWidth={3.5} />}
        </button>
      </div>
    </div>
  )
}
