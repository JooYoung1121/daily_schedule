import { INGREDIENTS } from './weaningGuide.js'

const CATEGORY_META = [
  { id: '곡류', label: '곡류', icon: '🌾', hint: '쌀뿐 아니라 귀리·보리 등도 다양하게' },
  { id: '채소', label: '채소', icon: '🥬', hint: '색과 종류를 바꿔가며 부드럽게' },
  { id: '과일', label: '과일', icon: '🍐', hint: '익히거나 으깨고, 주스보다 과육으로' },
  { id: '단백질', label: '철분·단백질', icon: '🥩', hint: '고기·생선·달걀·콩류를 번갈아' },
  { id: '유제품', label: '유제품', icon: '🥣', hint: '무가당 요구르트·살균 저염 치즈' },
]

export const AGE_FEEDING_GUIDES = [
  {
    minDays: 120,
    maxDays: 179,
    label: '만 4~5개월',
    title: '준비 신호를 먼저 확인',
    meals: '분유 수유아는 4~6개월 사이 시작 가능',
    amount: '한두 숟가락부터 천천히',
    texture: '매우 부드러운 미음·퓌레',
    focus: '분유·모유가 여전히 주식이며, 시작 시기는 아기 준비 상태에 맞춰요.',
  },
  {
    minDays: 180,
    maxDays: 269,
    label: '만 6~8개월',
    title: '다양한 식품군을 넓혀가는 시기',
    meals: '하루 2~3회',
    amount: '2~3숟가락 → 한 끼 반 컵까지',
    texture: '으깨거나 거른 반고형식',
    focus: '곡류와 함께 고기·달걀·콩류 같은 철분·단백질 식품을 자주 포함해요.',
  },
  {
    minDays: 270,
    maxDays: 364,
    label: '만 9~11개월',
    title: '질감과 자기주도 식사를 확장',
    meals: '하루 3~4회',
    amount: '한 끼 반 컵~¾컵',
    texture: '잘게 다진 음식·부드러운 핑거푸드',
    focus: '곡류·단백질·채소·과일·유제품을 골고루 경험하고 컵과 숟가락을 연습해요.',
  },
  {
    minDays: 365,
    maxDays: Infinity,
    label: '만 12~23개월',
    title: '가족식으로 천천히 전환',
    meals: '하루 3~4회 + 필요 시 간식 1~2회',
    amount: '한 끼 ¾컵~1컵',
    texture: '가족 음식과 비슷하되 작고 부드럽게',
    focus: '다양성을 유지하고, 아기의 배고픔·포만 신호에 맞춰 강요하지 않아요.',
  },
]

function normalize(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()[\]{}.,/+:·_-]/g, '')
}

const INGREDIENT_TERMS = INGREDIENTS
  .flatMap(ingredient =>
    [ingredient.name, ...(ingredient.aliases || [])]
      .map(term => ({ ingredient, term: normalize(term) }))
  )
  .filter(item => item.term)
  .sort((a, b) => b.term.length - a.term.length)

export function findIngredientsInText(value) {
  const text = normalize(value)
  if (!text) return []

  const occupied = []
  const found = new Map()

  for (const item of INGREDIENT_TERMS) {
    let fromIndex = 0
    while (fromIndex < text.length) {
      const start = text.indexOf(item.term, fromIndex)
      if (start === -1) break
      const end = start + item.term.length
      const overlaps = occupied.some(range => start < range.end && end > range.start)
      if (!overlaps) {
        occupied.push({ start, end })
        found.set(item.ingredient.name, item.ingredient)
        break
      }
      fromIndex = start + 1
    }
  }

  return [...found.values()]
}

function getMealMenu(record) {
  return [record.weaningFood, record.memo].filter(Boolean).join(' · ')
}

function dateMinusDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() - days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getAgeGuide(totalDays) {
  return AGE_FEEDING_GUIDES.find(guide =>
    totalDays >= guide.minDays && totalDays <= guide.maxDays
  ) || AGE_FEEDING_GUIDES[0]
}

export function analyzeWeaningRecords(records = [], totalDays = 0) {
  const meals = records
    .filter(record => record.type === '이유식')
    .map(record => {
      const menu = getMealMenu(record)
      const refused = /안\s*먹|거부/.test(menu)
      const ingredients = findIngredientsInText(menu)
      return {
        ...record,
        menu: menu || '메뉴 미기록',
        refused,
        ingredients,
        amountLabel: record.amountMl
          ? `${record.amountMl}${record.amountUnit || 'ml'}`
          : '양 미기록',
      }
    })
    .sort((a, b) =>
      `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`)
    )

  const ingredientHistory = new Map()
  meals.forEach(meal => {
    meal.ingredients.forEach(ingredient => {
      const previous = ingredientHistory.get(ingredient.name) || {
        ingredient,
        firstDate: meal.startDate,
        lastDate: meal.startDate,
        mealCount: 0,
        refusalCount: 0,
      }
      previous.lastDate = meal.startDate
      previous.mealCount += meal.refused ? 0 : 1
      previous.refusalCount += meal.refused ? 1 : 0
      ingredientHistory.set(ingredient.name, previous)
    })
  })

  const triedIngredients = [...ingredientHistory.values()]
    .filter(item => item.mealCount > 0)
    .sort((a, b) => a.firstDate.localeCompare(b.firstDate))
  const refusedIngredients = [...ingredientHistory.values()]
    .filter(item => item.refusalCount > 0)
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate))

  const latestDate = meals.at(-1)?.startDate || null
  const recentFrom = latestDate ? dateMinusDays(latestDate, 6) : null
  const recentMeals = recentFrom
    ? meals.filter(meal => meal.startDate >= recentFrom)
    : []

  const categoryProgress = CATEGORY_META.map(category => {
    const items = triedIngredients.filter(item => item.ingredient.cat === category.id)
    return { ...category, items, count: items.length }
  })

  const monthlyMap = new Map()
  meals.forEach(meal => {
    const month = meal.startDate?.slice(0, 7)
    if (!month) return
    const summary = monthlyMap.get(month) || {
      month,
      mealCount: 0,
      recordedMenuCount: 0,
      ingredients: new Set(),
    }
    summary.mealCount += 1
    summary.recordedMenuCount += meal.menu === '메뉴 미기록' ? 0 : 1
    meal.ingredients.forEach(ingredient => summary.ingredients.add(ingredient.name))
    monthlyMap.set(month, summary)
  })
  const monthly = [...monthlyMap.values()].map(summary => ({
    ...summary,
    ingredients: [...summary.ingredients],
  }))

  const triedNames = new Set(triedIngredients.map(item => item.ingredient.name))
  const nextIngredients = INGREDIENTS
    .filter(ingredient => !triedNames.has(ingredient.name))
    .filter(ingredient => totalDays >= 365 || ingredient.stage !== 'after1y')
    .sort((a, b) => {
      const priority = ingredient =>
        (ingredient.cat === '단백질' ? 0 : ingredient.allergen ? 1 : 2)
      return priority(a) - priority(b)
    })
    .slice(0, 8)

  const allergenProgress = INGREDIENTS
    .filter(ingredient => ingredient.allergen)
    .map(ingredient => ({
      ingredient,
      tried: triedNames.has(ingredient.name),
      history: ingredientHistory.get(ingredient.name) || null,
    }))

  return {
    meals,
    recentMeals,
    latestMeals: [...meals].reverse().slice(0, 12),
    triedIngredients,
    refusedIngredients,
    categoryProgress,
    allergenProgress,
    nextIngredients,
    monthly,
    ageGuide: getAgeGuide(totalDays),
    dateRange: meals.length
      ? { from: meals[0].startDate, to: meals.at(-1).startDate }
      : null,
    menuRecordedCount: meals.filter(meal => meal.menu !== '메뉴 미기록').length,
  }
}
