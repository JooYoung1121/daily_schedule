import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import {
  INGREDIENTS,
  INGREDIENT_STAGE_LABEL,
  WEANING_STAGES,
  getStageIndexByDays,
} from '../data/weaningGuide'

const WORLD_SIZE = 1000
const MIN_ZOOM = 1
const MAX_ZOOM = 4
const LABEL_ZOOM = 1.55

const GROUP_MODES = [
  { id: 'category', label: '식품군별' },
  { id: 'stage', label: '도입 시기별' },
  { id: 'allergen', label: '알레르기별' },
]

const CATEGORY_META = {
  곡류: { label: '곡류', icon: '🌾' },
  채소: { label: '채소', icon: '🥬' },
  과일: { label: '과일', icon: '🍐' },
  단백질: { label: '철분·단백질', icon: '🥩' },
  유제품: { label: '유제품', icon: '🥣' },
}

const CATEGORY_LAYOUT = {
  채소: { cx: 245, cy: 250, width: 430, height: 400 },
  단백질: { cx: 745, cy: 220, width: 360, height: 350 },
  곡류: { cx: 720, cy: 515, width: 360, height: 250 },
  과일: { cx: 280, cy: 735, width: 450, height: 350 },
  유제품: { cx: 730, cy: 830, width: 370, height: 260 },
}

const STAGE_LAYOUT = {
  early: { cx: 300, cy: 330, width: 520, height: 520 },
  mid: { cx: 735, cy: 315, width: 400, height: 480 },
  late: { cx: 285, cy: 790, width: 390, height: 290 },
  after1y: { cx: 730, cy: 790, width: 400, height: 290 },
}

const ALLERGEN_LAYOUT = {
  general: { cx: 300, cy: 500, width: 520, height: 850 },
  allergen: { cx: 760, cy: 500, width: 380, height: 850 },
}

const CLUSTER_COLORS = [
  {
    background: 'rgb(var(--color-sage) / 0.10)',
    border: 'rgb(var(--color-sage) / 0.22)',
  },
  {
    background: 'rgb(var(--color-terra) / 0.08)',
    border: 'rgb(var(--color-terra) / 0.20)',
  },
  {
    background: 'rgb(var(--color-warm-300) / 0.20)',
    border: 'rgb(var(--color-warm-400) / 0.25)',
  },
  {
    background: 'rgb(var(--color-sage-light) / 0.18)',
    border: 'rgb(var(--color-sage) / 0.18)',
  },
  {
    background: 'rgb(var(--color-terra-light) / 0.16)',
    border: 'rgb(var(--color-terra) / 0.16)',
  },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function buildGroups(mode) {
  if (mode === 'stage') {
    const keys = ['early', 'mid', 'late', 'after1y']
    return keys.map((key, index) => ({
      key,
      label: INGREDIENT_STAGE_LABEL[key]?.label || key,
      icon: WEANING_STAGES.find(stage => stage.id === key)?.icon || (key === 'after1y' ? '🎂' : '🥄'),
      ingredients: INGREDIENTS.filter(ingredient => ingredient.stage === key),
      ...STAGE_LAYOUT[key],
      color: CLUSTER_COLORS[index],
    }))
  }

  if (mode === 'allergen') {
    return [
      {
        key: 'general',
        label: '일반 재료',
        icon: '🌱',
        ingredients: INGREDIENTS.filter(ingredient => !ingredient.allergen),
        ...ALLERGEN_LAYOUT.general,
        color: CLUSTER_COLORS[0],
      },
      {
        key: 'allergen',
        label: '알레르기 확인 필요',
        icon: '🛡️',
        ingredients: INGREDIENTS.filter(ingredient => ingredient.allergen),
        ...ALLERGEN_LAYOUT.allergen,
        color: CLUSTER_COLORS[1],
      },
    ]
  }

  return Object.entries(CATEGORY_LAYOUT).map(([key, layout], index) => ({
    key,
    ...CATEGORY_META[key],
    ingredients: INGREDIENTS.filter(ingredient => ingredient.cat === key),
    ...layout,
    color: CLUSTER_COLORS[index],
  }))
}

function positionIngredients(group) {
  const count = group.ingredients.length
  const radiusX = Math.max(70, group.width / 2 - 72)
  const radiusY = Math.max(60, group.height / 2 - 70)

  return group.ingredients.map((ingredient, index) => {
    if (count === 1) return { ingredient, x: group.cx, y: group.cy + 12 }

    const progress = 0.20 + (0.75 * Math.sqrt(index / Math.max(1, count - 1)))
    const angle = (index * 2.399963229728653) - Math.PI / 2
    return {
      ingredient,
      x: group.cx + Math.cos(angle) * radiusX * progress,
      y: group.cy + 18 + Math.sin(angle) * radiusY * progress,
    }
  })
}

function formatDate(value) {
  if (!value) return '-'
  const [, month, day] = value.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}

export default function IngredientMap({ analysis, totalDays = 0, dataLoading = false }) {
  const containerRef = useRef(null)
  const pointersRef = useRef(new Map())
  const gestureRef = useRef(null)
  const draggedRef = useRef(false)
  const [size, setSize] = useState({ width: 1, height: 1 })
  const [mode, setMode] = useState('category')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedName, setSelectedName] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const groups = useMemo(() => buildGroups(mode), [mode])
  const positionedGroups = useMemo(
    () => groups.map(group => ({ ...group, nodes: positionIngredients(group) })),
    [groups],
  )

  const triedMap = useMemo(
    () => new Map(analysis.triedIngredients.map(item => [item.ingredient.name, item])),
    [analysis.triedIngredients],
  )
  const refusedMap = useMemo(
    () => new Map(analysis.refusedIngredients.map(item => [item.ingredient.name, item])),
    [analysis.refusedIngredients],
  )
  const nextNames = useMemo(
    () => new Set(analysis.nextIngredients.map(ingredient => ingredient.name)),
    [analysis.nextIngredients],
  )

  const currentStageIndex = getStageIndexByDays(totalDays)
  const currentStageId = WEANING_STAGES[currentStageIndex]?.id || 'early'
  const stageOrder = { early: 0, mid: 1, late: 2, complete: 3, after1y: 3 }

  const ingredientState = ingredient => {
    const eaten = triedMap.has(ingredient.name)
    const refused = refusedMap.has(ingredient.name)
    const locked = !eaten && (
      ingredient.stage === 'after1y'
        ? totalDays < 365
        : stageOrder[ingredient.stage] > stageOrder[currentStageId]
    )
    const recommended = !eaten && !locked && nextNames.has(ingredient.name)
    return { eaten, refused, locked, recommended }
  }

  const selectedIngredient = INGREDIENTS.find(item => item.name === selectedName) || null
  const selectedState = selectedIngredient ? ingredientState(selectedIngredient) : null
  const selectedHistory = selectedIngredient ? triedMap.get(selectedIngredient.name) : null
  const selectedRefusal = selectedIngredient ? refusedMap.get(selectedIngredient.name) : null
  const selectedMeals = selectedIngredient
    ? [...analysis.meals]
      .reverse()
      .filter(meal => meal.ingredients.some(item => item.name === selectedIngredient.name))
      .slice(0, 3)
    : []

  const baseScale = Math.min(size.width / WORLD_SIZE, size.height / WORLD_SIZE)
  const worldScale = baseScale * zoom

  const clampPan = (nextPan, nextZoom = zoom) => {
    const scaledSize = WORLD_SIZE * baseScale * nextZoom
    const limitX = Math.max(0, (scaledSize - size.width) / 2) + 36
    const limitY = Math.max(0, (scaledSize - size.height) / 2) + 36
    return {
      x: clamp(nextPan.x, -limitX, limitX),
      y: clamp(nextPan.y, -limitY, limitY),
    }
  }

  const setZoomAround = (nextZoom, point = { x: size.width / 2, y: size.height / 2 }) => {
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
    const relativeX = point.x - (size.width / 2)
    const relativeY = point.y - (size.height / 2)
    const ratio = clampedZoom / zoom
    const nextPan = {
      x: relativeX - ((relativeX - pan.x) * ratio),
      y: relativeY - ((relativeY - pan.y) * ratio),
    }
    setZoom(clampedZoom)
    setPan(clampPan(nextPan, clampedZoom))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const focusGroup = group => {
    const targetZoom = clamp(
      0.82 * Math.min(
        size.width / Math.max(1, group.width * baseScale),
        size.height / Math.max(1, group.height * baseScale),
      ),
      1.8,
      3.3,
    )
    const nextPan = {
      x: -(group.cx - (WORLD_SIZE / 2)) * baseScale * targetZoom,
      y: -(group.cy - (WORLD_SIZE / 2)) * baseScale * targetZoom,
    }
    setZoom(targetZoom)
    setPan(clampPan(nextPan, targetZoom))
  }

  const changeMode = nextMode => {
    setMode(nextMode)
    setSelectedName(null)
    resetView()
  }

  const handleWheel = event => {
    event.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    setZoomAround(
      zoom * (event.deltaY > 0 ? 0.88 : 1.14),
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
    )
  }

  const startGesture = () => {
    const points = [...pointersRef.current.values()]
    draggedRef.current = false
    if (points.length === 1) {
      gestureRef.current = {
        type: 'pan',
        point: points[0],
        pan,
      }
    } else if (points.length >= 2) {
      const [first, second] = points
      gestureRef.current = {
        type: 'pinch',
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        center: {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2,
        },
        zoom,
        pan,
      }
    }
  }

  const handlePointerDown = event => {
    if (event.target.closest('[data-map-action]')) return
    containerRef.current.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    startGesture()
  }

  const handlePointerMove = event => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointersRef.current.values()]
    const gesture = gestureRef.current
    if (!gesture) return

    if (points.length === 1 && gesture.type === 'pan') {
      const dx = points[0].x - gesture.point.x
      const dy = points[0].y - gesture.point.y
      if (Math.abs(dx) + Math.abs(dy) > 4) draggedRef.current = true
      setPan(clampPan({ x: gesture.pan.x + dx, y: gesture.pan.y + dy }))
      return
    }

    if (points.length >= 2) {
      if (gesture.type !== 'pinch') {
        startGesture()
        return
      }
      const [first, second] = points
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const center = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      }
      const nextZoom = clamp(gesture.zoom * (distance / Math.max(1, gesture.distance)), MIN_ZOOM, MAX_ZOOM)
      const centerDx = center.x - gesture.center.x
      const centerDy = center.y - gesture.center.y
      const ratio = nextZoom / gesture.zoom
      const centerFromViewport = {
        x: gesture.center.x - (containerRef.current.getBoundingClientRect().left + size.width / 2),
        y: gesture.center.y - (containerRef.current.getBoundingClientRect().top + size.height / 2),
      }
      const nextPan = {
        x: centerFromViewport.x - ((centerFromViewport.x - gesture.pan.x) * ratio) + centerDx,
        y: centerFromViewport.y - ((centerFromViewport.y - gesture.pan.y) * ratio) + centerDy,
      }
      draggedRef.current = true
      setZoom(nextZoom)
      setPan(clampPan(nextPan, nextZoom))
    }
  }

  const handlePointerUp = event => {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size) startGesture()
    else gestureRef.current = null
  }

  const chooseIngredient = ingredient => {
    if (draggedRef.current) return
    setSelectedName(ingredient.name)
  }

  return (
    <div className="space-y-3">
      <section className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-terra">우리 아기 식재료 탐험</p>
            <h3 className="text-[19px] font-bold text-warm-900 mt-1">식재료 지도</h3>
            <p className="text-[12px] text-warm-500 mt-1 leading-relaxed">
              지도를 움직이고 확대해서 다음 재료를 찾아보세요.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[20px] font-bold text-warm-900">{analysis.triedIngredients.length}/{INGREDIENTS.length}</p>
            <p className="text-[10px] font-semibold text-warm-500">먹어본 재료</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-warm-200 mt-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-sage transition-all"
            style={{ width: `${(analysis.triedIngredients.length / INGREDIENTS.length) * 100}%` }}
          />
        </div>
      </section>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {GROUP_MODES.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => changeMode(item.id)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-colors ${
              mode === item.id
                ? 'bg-warm-900 text-warm-50'
                : 'bg-warm-200 text-warm-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1">
        <LegendDot className="bg-sage" label="먹어봄" />
        <LegendDot className="bg-terra border-2 border-terra" label="다음 추천" />
        <LegendDot className="bg-warm-50 border border-warm-300" label="아직 안 먹음" />
        <LegendDot className="bg-warm-300 opacity-50" label="아직 이른 재료" />
        <span className="text-[10px] text-warm-500">주황 테두리 · 거부 기록</span>
      </div>

      <div
        ref={containerRef}
        data-testid="ingredient-map"
        className="relative aspect-square min-h-[340px] max-h-[600px] overflow-hidden rounded-2xl bg-warm-50 border border-warm-200 shadow-warm-sm cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute left-3 top-3 z-30 rounded-full bg-warm-50/90 px-2.5 py-1.5 text-[10px] font-semibold text-warm-600 shadow-warm-sm">
          {zoom < LABEL_ZOOM ? '식품군을 누르면 확대돼요' : '빈 곳을 끌어 이동해요'}
        </div>

        <div className="absolute right-3 top-3 z-30 flex flex-col gap-1.5">
          <MapControl label="확대" onClick={() => setZoomAround(zoom * 1.3)}>
            <Plus size={17} />
          </MapControl>
          <MapControl label="축소" onClick={() => setZoomAround(zoom / 1.3)}>
            <Minus size={17} />
          </MapControl>
          <MapControl label="전체 보기" onClick={resetView}>
            <RotateCcw size={15} />
          </MapControl>
        </div>

        {dataLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-warm-50/80">
            <p className="text-[13px] font-semibold text-warm-600">먹은 기록을 확인하는 중이에요…</p>
          </div>
        )}

        <div
          className="absolute left-1/2 top-1/2 origin-center"
          style={{
            width: WORLD_SIZE,
            height: WORLD_SIZE,
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${worldScale})`,
          }}
        >
          {positionedGroups.map(group => (
            <div
              key={group.key}
              className="absolute rounded-[42%]"
              style={{
                left: group.cx - group.width / 2,
                top: group.cy - group.height / 2,
                width: group.width,
                height: group.height,
                background: group.color.background,
                border: `3px solid ${group.color.border}`,
              }}
            >
              <button
                type="button"
                data-map-action
                onClick={() => {
                  if (!draggedRef.current) focusGroup(group)
                }}
                className="absolute left-6 top-5 z-30 rounded-2xl px-2 py-1 text-left hover:bg-warm-50/50"
                aria-label={`${group.label} 영역 확대`}
              >
                <span className="block text-[28px] font-bold text-warm-800">
                  {group.icon} {group.label}
                </span>
                <span className="block text-[19px] font-semibold text-warm-500 mt-0.5">
                  {group.ingredients.length}개
                </span>
              </button>
            </div>
          ))}

          {positionedGroups.flatMap(group => group.nodes).map(({ ingredient, x, y }) => {
            const state = ingredientState(ingredient)
            const showLabel = zoom >= LABEL_ZOOM
            return (
              <button
                key={ingredient.name}
                type="button"
                data-map-action
                onClick={event => {
                  event.stopPropagation()
                  chooseIngredient(ingredient)
                }}
                className={`absolute z-20 flex items-center justify-center font-bold transition-all ${
                  showLabel
                    ? 'w-[126px] min-h-[54px] px-3 py-2 rounded-2xl text-[18px] leading-tight'
                    : 'w-12 h-12 rounded-full text-[20px]'
                } ${
                  selectedName === ingredient.name ? 'ring-[6px] ring-warm-900/20' : ''
                } ${
                  state.eaten
                    ? 'bg-sage text-white border-[3px] border-sage-dark'
                    : state.locked
                      ? 'bg-warm-300 text-warm-600 border-[3px] border-warm-400 opacity-55'
                      : state.recommended
                        ? 'bg-terra/20 text-warm-900 border-[4px] border-terra'
                        : 'bg-warm-50 text-warm-700 border-[3px] border-warm-300'
                }`}
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: state.refused
                    ? '0 0 0 7px rgb(var(--color-terra) / 0.35)'
                    : '0 2px 7px rgb(44 33 24 / 0.10)',
                }}
                aria-label={`${ingredient.name}, ${state.eaten ? '먹어본 재료' : state.locked ? '아직 이른 재료' : state.recommended ? '다음 추천 재료' : '아직 안 먹은 재료'}`}
              >
                {showLabel ? (
                  <span>{state.eaten && '✓ '}{ingredient.name}</span>
                ) : (
                  <span>{state.eaten ? '✓' : state.locked ? '·' : state.recommended ? '!' : '○'}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedIngredient ? (
        <section className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[17px] font-bold text-warm-900">{selectedIngredient.name}</h3>
                <StatusBadge state={selectedState} />
                {selectedRefusal && (
                  <span className="text-[10px] font-bold text-terra bg-terra/10 px-2 py-1 rounded-full">거부 기록 있음</span>
                )}
              </div>
              <p className="text-[11px] text-warm-500 mt-1">
                {selectedIngredient.cat} · {INGREDIENT_STAGE_LABEL[selectedIngredient.stage]?.label}
                {selectedIngredient.allergen ? ' · 알레르기 확인 필요' : ''}
              </p>
            </div>
            {selectedHistory && (
              <div className="text-right flex-shrink-0">
                <p className="text-[16px] font-bold text-sage-dark">{selectedHistory.mealCount}회</p>
                <p className="text-[10px] text-warm-500">먹은 기록</p>
              </div>
            )}
          </div>

          <p className="text-[12px] text-warm-700 mt-3 leading-relaxed">{selectedIngredient.note}</p>

          {selectedHistory && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <InfoCell label="처음 먹은 날" value={formatDate(selectedHistory.firstDate)} />
              <InfoCell label="최근 먹은 날" value={formatDate(selectedHistory.lastDate)} />
            </div>
          )}

          {selectedMeals.length > 0 && (
            <div className="mt-3 pt-3 border-t border-warm-200/70">
              <p className="text-[11px] font-bold text-warm-500 mb-2">이 재료로 먹은 메뉴</p>
              <div className="space-y-2">
                {selectedMeals.map((meal, index) => (
                  <div key={`${meal.startDate}-${meal.startTime}-${index}`} className="flex items-center gap-2 bg-warm-100 rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-warm-800 truncate">{meal.menu}</p>
                      <p className="text-[10px] text-warm-500 mt-0.5">
                        {formatDate(meal.startDate)}
                        {meal.vendor ? ` · ${meal.vendor.name}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-sage-dark">{meal.amountLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="rounded-2xl bg-warm-200/60 px-4 py-3 text-center">
          <p className="text-[11px] text-warm-600">재료를 누르면 먹은 날짜와 관련 메뉴가 보여요.</p>
        </div>
      )}
    </div>
  )
}

function LegendDot({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-warm-500">
      <span className={`w-2.5 h-2.5 rounded-full ${className}`} />
      {label}
    </span>
  )
}

function MapControl({ label, onClick, children }) {
  return (
    <button
      type="button"
      data-map-action
      onClick={event => {
        event.stopPropagation()
        onClick()
      }}
      className="w-9 h-9 rounded-xl bg-warm-50 text-warm-700 border border-warm-200 shadow-warm-sm flex items-center justify-center active:scale-95"
      aria-label={label}
    >
      {children}
    </button>
  )
}

function StatusBadge({ state }) {
  const config = state.eaten
    ? { text: '먹어봄', classes: 'text-sage-dark bg-sage/15' }
    : state.locked
      ? { text: '아직 이른 재료', classes: 'text-warm-500 bg-warm-200' }
      : state.recommended
        ? { text: '다음 추천', classes: 'text-terra bg-terra/10' }
        : { text: '아직 안 먹음', classes: 'text-warm-600 bg-warm-200' }
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${config.classes}`}>
      {config.text}
    </span>
  )
}

function InfoCell({ label, value }) {
  return (
    <div className="bg-warm-100 rounded-xl p-2.5">
      <p className="text-[10px] font-bold text-warm-500">{label}</p>
      <p className="text-[12px] font-semibold text-warm-800 mt-1">{value}</p>
    </div>
  )
}
