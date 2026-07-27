import { useState, useMemo } from 'react'
import {
  WEANING_STAGES, INGREDIENTS, INGREDIENT_STAGE_LABEL, INGREDIENT_CATEGORIES,
  ALLERGY_GUIDE, AVOID_FOODS, BLW_GUIDE, TOOLS, STORES, YOUTUBE,
  REFERENCE_SITES, WEANING_SOURCES, getStageIndexByDays,
} from '../data/weaningGuide'
import { analyzeWeaningRecords } from '../data/weaningAnalyzer'

const SUB_TABS = [
  { id: 'record', label: '먹은 기록', icon: '📝' },
  { id: 'start',  label: '시작',   icon: '🚀' },
  { id: 'stages', label: '단계별', icon: '📈' },
  { id: 'foods',  label: '식재료', icon: '🥕' },
  { id: 'safety', label: '안전',   icon: '⚠️' },
  { id: 'blw',    label: 'BLW',    icon: '🤲' },
  { id: 'tools',  label: '준비물', icon: '🧰' },
  { id: 'shop',   label: '쇼핑',   icon: '🛒' },
  { id: 'media',  label: '영상·자료', icon: '▶️' },
]

const srcLinks = (ids) => ids.map(id => WEANING_SOURCES[id]).filter(Boolean)

export default function WeaningSection({ age, records = [] }) {
  const totalDays = age?.totalDays ?? 0
  const currentStageIdx = getStageIndexByDays(totalDays)
  const weaning = useMemo(
    () => analyzeWeaningRecords(records, totalDays),
    [records, totalDays],
  )
  const [sub, setSub] = useState('record')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  // 통합 검색: 식재료 + 단계/안전 키워드
  const searchResults = useMemo(() => {
    if (!q) return null
    const ing = INGREDIENTS.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.aliases.some(a => a.toLowerCase().includes(q)) ||
      i.cat.toLowerCase().includes(q) ||
      i.note.toLowerCase().includes(q)
    )
    const avoid = AVOID_FOODS.filter(f =>
      f.name.toLowerCase().includes(q) || f.reason.toLowerCase().includes(q)
    )
    const stages = WEANING_STAGES.filter(s =>
      s.label.includes(q) || s.firstFoods.toLowerCase().includes(q) ||
      s.keyPoints.some(p => p.toLowerCase().includes(q))
    )
    return { ing, avoid, stages }
  }, [q])

  return (
    <div className="space-y-3">
      {/* 검색 */}
      <div className="relative">
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="재료·키워드 검색 (예: 달걀, 꿀, 소고기, 알레르기)"
          className="w-full bg-warm-50 border border-warm-200 rounded-2xl pl-9 pr-9 py-2.5 text-[13px] text-warm-800 outline-none focus:border-terra/40"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-warm-400">🔍</span>
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 text-[14px]">✕</button>
        )}
      </div>

      {/* 검색 결과 모드 */}
      {searchResults ? (
        <SearchResults results={searchResults} />
      ) : (
        <>
          {/* 하위 탭 */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {SUB_TABS.map(t => (
              <button key={t.id} onClick={() => setSub(t.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95"
                style={{
                  background: sub === t.id ? 'rgb(var(--color-terra))' : 'rgb(var(--color-warm-200))',
                  color: sub === t.id ? '#fff' : 'rgb(var(--color-warm-600))',
                }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {sub === 'record' && <RecordTab analysis={weaning} />}
          {sub === 'start'  && <StartTab currentStageIdx={currentStageIdx} totalDays={totalDays} />}
          {sub === 'stages' && <StagesTab currentStageIdx={currentStageIdx} />}
          {sub === 'foods'  && <FoodsTab />}
          {sub === 'safety' && <SafetyTab />}
          {sub === 'blw'    && <BlwTab />}
          {sub === 'tools'  && <ToolsTab />}
          {sub === 'shop'   && <ShopTab />}
          {sub === 'media'  && <MediaTab />}
        </>
      )}
    </div>
  )
}

// ── 공통 카드 ──
function Card({ children, className = '' }) {
  return (
    <div className={`bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40 ${className}`}>
      {children}
    </div>
  )
}

function SourceLine({ ids }) {
  const links = srcLinks(ids)
  if (!links.length) return null
  return (
    <p className="text-[10px] text-warm-400 mt-2.5 pt-2 border-t border-warm-200/50 leading-relaxed">
      출처: {links.map((s, i) => (
        <span key={i}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-warm-200 underline-offset-2 hover:text-warm-600">{s.name}</a>
          {i < links.length - 1 ? ' · ' : ''}
        </span>
      ))}
    </p>
  )
}

function StageBadge({ stageId }) {
  const s = INGREDIENT_STAGE_LABEL[stageId]
  if (!s) return null
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.color + '22', color: s.color }}>{s.label}</span>
  )
}

// ── 실제 BabyTime 이유식 기록 ──
function RecordTab({ analysis }) {
  const [showAll, setShowAll] = useState(false)
  const {
    meals, latestMeals, triedIngredients, refusedIngredients, categoryProgress,
    allergenProgress, nextIngredients, monthly, ageGuide, dateRange,
    recentMeals, menuRecordedCount,
  } = analysis

  if (!meals.length) {
    return (
      <Card className="text-center py-8">
        <div className="text-4xl mb-3">🥣</div>
        <h3 className="text-[15px] font-bold text-warm-900">아직 이유식 기록이 없어요</h3>
        <p className="text-[12px] text-warm-500 mt-1.5 leading-relaxed">
          BabyTime에서 이유식 종류나 메모를 입력하면<br />
          먹어본 재료와 날짜가 자동으로 정리돼요.
        </p>
      </Card>
    )
  }

  const visibleMeals = showAll ? [...meals].reverse() : latestMeals
  const triedAllergens = allergenProgress.filter(item => item.tried)

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-bold text-terra uppercase tracking-wide">BabyTime 자동 정리</p>
            <h3 className="text-[17px] font-bold text-warm-900 mt-0.5">이유식 기록 한눈에</h3>
            <p className="text-[10px] text-warm-400 mt-1">
              {formatDate(dateRange.from)} ~ {formatDate(dateRange.to)}
            </p>
          </div>
          <span className="text-[10px] font-bold text-sage-dark bg-sage/10 px-2.5 py-1 rounded-full">
            최신 {formatDate(dateRange.to)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <RecordStat value={`${meals.length}회`} label="총 기록" />
          <RecordStat value={`${triedIngredients.length}개`} label="확인된 재료" />
          <RecordStat value={`${recentMeals.length}회`} label="최근 7일" />
        </div>
        <p className="text-[10px] text-warm-400 mt-3 leading-relaxed">
          메뉴가 적힌 {menuRecordedCount}건의 종류·메모만 분류했어요. 시판 이유식의 전체 원재료는 제품 표시를 별도로 확인해주세요.
        </p>
      </Card>

      <Card className="bg-sage/5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] font-bold text-sage-dark">현재 월령 기준</p>
            <h3 className="text-[15px] font-bold text-warm-900">{ageGuide.label} · {ageGuide.title}</h3>
          </div>
          <span className="text-2xl">🥄</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Mini label="횟수" value={ageGuide.meals} />
          <Mini label="한 끼 양" value={ageGuide.amount} />
          <Mini label="질감" value={ageGuide.texture} />
        </div>
        <p className="text-[12px] text-warm-600 leading-relaxed">{ageGuide.focus}</p>
        <p className="text-[10px] text-warm-400 mt-2">
          권장량은 목표치가 아닌 참고 범위예요. 실제 섭취량과 성장 상태는 아이마다 다릅니다.
        </p>
        <SourceLine ids={['KDCA', 'WHO']} />
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-[14px] font-bold text-warm-900">먹어본 식품군</h3>
            <p className="text-[10px] text-warm-400 mt-0.5">재료명을 적은 BabyTime 기록 기준</p>
          </div>
          <span className="text-[10px] font-bold text-sage-dark bg-sage/10 px-2 py-1 rounded-full">
            {categoryProgress.filter(group => group.count > 0).length}/{categoryProgress.length}군
          </span>
        </div>
        <div className="space-y-2">
          {categoryProgress.map(group => (
            <div key={group.id} className="bg-warm-100 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-[15px]">{group.icon}</span>
                <p className="text-[12px] font-bold text-warm-800">{group.label}</p>
                <span className="ml-auto text-[10px] text-warm-400">{group.count}개</span>
              </div>
              {group.count > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {group.items.map(item => (
                    <span key={item.ingredient.name}
                      className="text-[10px] font-semibold text-warm-700 bg-warm-50 px-2 py-1 rounded-full">
                      ✓ {item.ingredient.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-warm-400 mt-1.5">{group.hint}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div>
            <h3 className="text-[14px] font-bold text-warm-900">알레르기 식품 체크</h3>
            <p className="text-[10px] text-warm-400 mt-0.5">먹은 기록 {triedAllergens.length}개 확인</p>
          </div>
          <span className="text-[18px]">🛡️</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allergenProgress.map(item => (
            <span key={item.ingredient.name}
              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                item.tried
                  ? 'text-sage-dark bg-sage/15'
                  : 'text-warm-400 bg-warm-100'
              }`}>
              {item.tried ? '✓' : '○'} {item.ingredient.name}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-warm-400 mt-2.5 leading-relaxed">
          알레르기 식품은 한 번에 하나씩 소량으로 시작해 반응을 관찰하세요. 심한 습진·기존 알레르기가 있다면 먼저 소아과와 상의하세요.
        </p>
        <SourceLine ids={['KDCA', 'CDC']} />
      </Card>

      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-1">다음에 경험해볼 재료</h3>
        <p className="text-[10px] text-warm-400 mb-2.5">
          아직 메모에서 확인되지 않은 재료예요. 필수 순서가 아니라 다양성을 위한 참고 목록입니다.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {nextIngredients.map(ingredient => (
            <div key={ingredient.name} className="bg-warm-100 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[12px] font-bold text-warm-800">{ingredient.name}</p>
                {ingredient.allergen && (
                  <span className="text-[8px] font-bold text-terra bg-terra/10 px-1.5 py-0.5 rounded-full">알레르기</span>
                )}
              </div>
              <p className="text-[9px] text-warm-400 mt-1">{ingredient.cat} · {ingredient.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {refusedIngredients.length > 0 && (
        <Card className="bg-amber/5">
          <h3 className="text-[13px] font-bold text-warm-900 mb-2">다시 천천히 시도해볼 음식</h3>
          <div className="flex flex-wrap gap-1.5">
            {refusedIngredients.map(item => (
              <span key={item.ingredient.name}
                className="text-[10px] font-semibold text-warm-600 bg-warm-100 px-2 py-1 rounded-full">
                {item.ingredient.name} · {formatDate(item.lastDate)}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-warm-400 mt-2">새 음식 거부는 자연스러워요. 강요하지 않고 다른 날 다시 경험해보세요.</p>
        </Card>
      )}

      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">월별 기록</h3>
        <div className="grid grid-cols-2 gap-2">
          {monthly.map(month => (
            <div key={month.month} className="bg-warm-100 rounded-xl p-2.5">
              <p className="text-[11px] font-bold text-warm-800">{formatMonth(month.month)}</p>
              <p className="text-[10px] text-warm-500 mt-0.5">{month.mealCount}회 · 재료 {month.ingredients.length}개</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h3 className="text-[14px] font-bold text-warm-900">날짜별 이유식</h3>
            <p className="text-[10px] text-warm-400 mt-0.5">종류·메모 원문과 섭취량</p>
          </div>
          <span className="text-[10px] text-warm-400">{showAll ? `${meals.length}건 전체` : '최근 12건'}</span>
        </div>
        <div className="space-y-2">
          {visibleMeals.map((meal, index) => (
            <div key={`${meal.startDate}-${meal.startTime}-${index}`} className="bg-warm-100 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[11px] font-bold text-warm-500">
                      {formatDate(meal.startDate)} · {meal.startTime}
                    </p>
                    {meal.refused && (
                      <span className="text-[9px] font-bold text-terra bg-terra/10 px-1.5 py-0.5 rounded-full">안 먹음</span>
                    )}
                  </div>
                  <p className={`text-[13px] font-bold mt-0.5 ${
                    meal.menu === '메뉴 미기록' ? 'text-warm-400' : 'text-warm-800'
                  }`}>{meal.menu}</p>
                </div>
                <span className="text-[11px] font-bold text-sage-dark bg-sage/10 px-2 py-1 rounded-lg flex-shrink-0">
                  {meal.amountLabel}
                </span>
              </div>
              {meal.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {meal.ingredients.map(ingredient => (
                    <span key={ingredient.name}
                      className="text-[9px] text-warm-500 bg-warm-50 px-1.5 py-0.5 rounded-full">
                      {ingredient.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {meals.length > 12 && (
          <button onClick={() => setShowAll(value => !value)}
            className="w-full mt-3 py-2.5 rounded-xl bg-warm-200 text-[11px] font-bold text-warm-600 active:scale-[0.99] transition-transform">
            {showAll ? '최근 기록만 보기' : `전체 ${meals.length}건 보기`}
          </button>
        )}
      </Card>
    </div>
  )
}

function RecordStat({ value, label }) {
  return (
    <div className="bg-warm-100 rounded-xl p-2.5 text-center">
      <p className="text-[17px] font-bold text-warm-900">{value}</p>
      <p className="text-[9px] font-semibold text-warm-400 mt-0.5">{label}</p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '-'
  const [, month, day] = value.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}

function formatMonth(value) {
  const [year, month] = value.split('-')
  return `${year}년 ${Number(month)}월`
}

// ── 검색 결과 ──
function SearchResults({ results }) {
  const { ing, avoid, stages } = results
  const empty = !ing.length && !avoid.length && !stages.length
  if (empty) {
    return <Card className="text-center py-8"><p className="text-[13px] text-warm-400">검색 결과가 없어요</p></Card>
  }
  return (
    <div className="space-y-3">
      {ing.length > 0 && (
        <Card>
          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mb-2">식재료 {ing.length}</p>
          <div className="space-y-2">
            {ing.map((i, k) => <IngredientRow key={k} ing={i} />)}
          </div>
        </Card>
      )}
      {avoid.length > 0 && (
        <Card>
          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mb-2">피해야 할 음식 {avoid.length}</p>
          <div className="space-y-2">{avoid.map((f, k) => <AvoidRow key={k} food={f} />)}</div>
        </Card>
      )}
      {stages.length > 0 && (
        <Card>
          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mb-2">단계 {stages.length}</p>
          <div className="space-y-1.5">
            {stages.map((s, k) => (
              <div key={k} className="flex items-center gap-2 bg-warm-100 rounded-xl px-3 py-2">
                <span>{s.icon}</span>
                <div><p className="text-[12px] font-bold text-warm-800">{s.label} · {s.monthRange}</p>
                  <p className="text-[11px] text-warm-500">{s.firstFoods}</p></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function IngredientRow({ ing }) {
  return (
    <div className="flex items-start gap-2.5 bg-warm-100 rounded-xl px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-warm-800">{ing.name}</p>
          <StageBadge stageId={ing.stage} />
          <span className="text-[9px] font-semibold text-warm-400">{ing.cat}</span>
          {ing.allergen && <span className="text-[9px] font-bold text-terra bg-terra/10 px-1.5 py-0.5 rounded-full">알레르기</span>}
        </div>
        <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">{ing.note}</p>
      </div>
    </div>
  )
}

function AvoidRow({ food }) {
  const dangerColor = food.danger === 'high' ? '#D4715A' : '#C8924A'
  return (
    <div className="flex items-start gap-2.5 bg-warm-100 rounded-xl px-3 py-2.5">
      <span className="text-[18px] flex-shrink-0">{food.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-bold text-warm-800">{food.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: dangerColor + '22', color: dangerColor }}>{food.until}</span>
        </div>
        <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">{food.reason}</p>
      </div>
    </div>
  )
}

// ── 시작 탭 ──
function StartTab({ currentStageIdx, totalDays }) {
  const stage = WEANING_STAGES[currentStageIdx]
  const isPreStart = totalDays < WEANING_STAGES[0].dayStart
  return (
    <div className="space-y-3">
      {/* 현재 추천 */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: stage.color + '20' }}>{stage.icon}</div>
          <div>
            <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wide">우리 아기 현재 추천 단계</p>
            <h3 className="text-[16px] font-bold text-warm-900">{stage.label} 이유식 · {stage.monthRange}</h3>
          </div>
        </div>
        {isPreStart ? (
          <div className="bg-warm-100 rounded-xl p-3 text-[12px] text-warm-600 leading-relaxed">
            아직 시작 전이에요. 공식 권장은 <strong>만 4~6개월(모유수유아는 6개월)</strong> 시작.
            아래 준비 신호가 보이면 시작하세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Mini label="농도" value={stage.riceRatio} />
            <Mini label="횟수" value={stage.times} />
            <Mini label="1회량" value={stage.amount} />
            <Mini label="수유" value={stage.milkFeeds} />
          </div>
        )}
      </Card>

      {/* 시작 준비 신호 */}
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">✅ 이유식 시작 준비 신호</h3>
        <div className="space-y-1.5">
          {['목·고개를 잘 가눈다', '받쳐주면 앉을 수 있다', '음식에 관심을 보인다(입 오물거림)', '혀로 밀어내는 반사(돌출반사)가 줄었다'].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-sage text-[12px] mt-0.5">✓</span>
              <p className="text-[12px] text-warm-600">{s}</p>
            </div>
          ))}
        </div>
        <SourceLine ids={['KDCA', 'AAP']} />
      </Card>

      {/* 핵심 원칙 */}
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">📌 핵심 원칙</h3>
        <div className="space-y-1.5">
          {[
            '쌀미음으로 시작 → 철분 위해 곧 소고기 도입',
            '새 재료는 한 번에 하나, 3일씩 관찰',
            '돌 전 무염·무설탕·꿀 금지',
            '알레르기 식품도 미루지 말고 (하나씩) 조기 도입',
            '먹는 양보다 경험·연습이 목표 — 강요 금지',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-terra text-[11px] mt-0.5">•</span>
              <p className="text-[12px] text-warm-600 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
        <SourceLine ids={['KDCA']} />
      </Card>
    </div>
  )
}

function Mini({ label, value }) {
  return (
    <div className="bg-warm-100 rounded-xl p-2.5">
      <p className="text-[10px] font-bold text-warm-400 mb-0.5">{label}</p>
      <p className="text-[11px] text-warm-700 leading-snug">{value}</p>
    </div>
  )
}

// ── 단계별 탭 ──
function StagesTab({ currentStageIdx }) {
  return (
    <div className="space-y-3">
      {WEANING_STAGES.map((s, i) => {
        const isCurrent = i === currentStageIdx
        return (
          <Card key={s.id} className={isCurrent ? 'ring-2 ring-terra/30' : ''}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: s.color + '20' }}>{s.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-warm-900">{s.label}</h3>
                  {isCurrent && <span className="text-[9px] font-bold text-terra bg-terra/10 px-2 py-0.5 rounded-full">현재</span>}
                </div>
                <p className="text-[11px] text-warm-500">{s.monthRange}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Mini label="질감" value={s.texture} />
              <Mini label="죽 농도" value={s.riceRatio} />
              <Mini label="횟수" value={s.times} />
              <Mini label="1회량" value={s.amount} />
              <Mini label="수유 병행" value={s.milkFeeds} />
              <Mini label="대표 식재료" value={s.firstFoods} />
            </div>
            <div className="bg-warm-100 rounded-xl p-3 mb-2">
              <p className="text-[11px] font-bold text-warm-400 mb-1.5">이 단계 포인트</p>
              <div className="space-y-1">
                {s.keyPoints.map((p, k) => (
                  <div key={k} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.color }} />
                    <p className="text-[12px] text-warm-600 leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-warm-500 bg-amber/10 rounded-lg px-3 py-2">⚠️ {s.cautions}</p>
            <SourceLine ids={s.sources} />
          </Card>
        )
      })}
    </div>
  )
}

// ── 식재료 탭 ──
function FoodsTab() {
  const [cat, setCat] = useState('전체')
  const [stage, setStage] = useState('all')
  const list = useMemo(() => INGREDIENTS.filter(i =>
    (cat === '전체' || i.cat === cat) && (stage === 'all' || i.stage === stage)
  ), [cat, stage])

  return (
    <div className="space-y-3">
      <Card>
        <p className="text-[11px] font-bold text-warm-400 mb-2">분류</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {INGREDIENT_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
              style={{ background: cat === c ? 'rgb(var(--color-terra))' : 'rgb(var(--color-warm-200))', color: cat === c ? '#fff' : 'rgb(var(--color-warm-600))' }}>{c}</button>
          ))}
        </div>
        <p className="text-[11px] font-bold text-warm-400 mb-2">시기</p>
        <div className="flex gap-1.5 flex-wrap">
          <StageFilterBtn id="all" label="전체" active={stage === 'all'} onClick={() => setStage('all')} />
          {Object.entries(INGREDIENT_STAGE_LABEL).map(([id, v]) => (
            <StageFilterBtn key={id} id={id} label={v.label.split(' ')[0]} color={v.color} active={stage === id} onClick={() => setStage(id)} />
          ))}
        </div>
      </Card>
      <Card>
        <p className="text-[11px] text-warm-400 mb-2">{list.length}개 · 시기는 "언제부터 가능"한 기준</p>
        <div className="space-y-2">
          {list.map((i, k) => <IngredientRow key={k} ing={i} />)}
          {!list.length && <p className="text-[12px] text-warm-400 text-center py-4">해당 조건의 재료가 없어요</p>}
        </div>
        <SourceLine ids={['KDCA', 'AAP']} />
      </Card>
    </div>
  )
}

function StageFilterBtn({ label, color, active, onClick }) {
  return (
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
      style={{
        background: active ? (color || 'rgb(var(--color-terra))') : 'rgb(var(--color-warm-200))',
        color: active ? '#fff' : 'rgb(var(--color-warm-600))',
      }}>{label}</button>
  )
}

// ── 안전 탭 (알레르기 + 피해야 할 음식) ──
function SafetyTab() {
  return (
    <div className="space-y-3">
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-1">{ALLERGY_GUIDE.rule.title}</h3>
        <div className="space-y-1.5 mt-2">
          {ALLERGY_GUIDE.rule.points.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-terra text-[11px] mt-0.5">•</span>
              <p className="text-[12px] text-warm-600 leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-sage/5">
        <h3 className="text-[14px] font-bold text-warm-900 mb-1.5">💡 {ALLERGY_GUIDE.earlyIntro.title}</h3>
        <p className="text-[12px] text-warm-600 leading-relaxed">{ALLERGY_GUIDE.earlyIntro.body}</p>
        <SourceLine ids={ALLERGY_GUIDE.earlyIntro.sources} />
      </Card>

      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">주요 알레르기 유발 식품</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALLERGY_GUIDE.majorAllergens.map((a, i) => (
            <div key={i} className="bg-warm-100 rounded-xl p-2.5">
              <p className="text-[12px] font-bold text-warm-800">{a.emoji} {a.name}</p>
              <p className="text-[10px] text-warm-500 mt-0.5 leading-relaxed">{a.note}</p>
            </div>
          ))}
        </div>
        <SourceLine ids={[ALLERGY_GUIDE.source]} />
      </Card>

      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">🚫 돌 전 피해야 할 음식</h3>
        <div className="space-y-2">{AVOID_FOODS.map((f, i) => <AvoidRow key={i} food={f} />)}</div>
        <SourceLine ids={['KDCA', 'MFDS']} />
      </Card>
    </div>
  )
}

// ── BLW 탭 ──
function BlwTab() {
  return (
    <div className="space-y-3">
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-1.5">🤲 자기주도 이유식 (BLW)</h3>
        <p className="text-[12px] text-warm-600 leading-relaxed">{BLW_GUIDE.intro}</p>
      </Card>
      <Card>
        <h3 className="text-[13px] font-bold text-warm-900 mb-2">시작 조건</h3>
        <div className="space-y-1.5">
          {BLW_GUIDE.startConditions.map((s, i) => (
            <div key={i} className="flex items-start gap-2"><span className="text-sage text-[12px] mt-0.5">✓</span><p className="text-[12px] text-warm-600">{s}</p></div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-[13px] font-bold text-warm-900 mb-2">핑거푸드 형태</h3>
        <div className="space-y-1.5">
          {BLW_GUIDE.fingerFood.map((s, i) => (
            <div key={i} className="flex items-start gap-2"><span className="text-terra text-[11px] mt-0.5">•</span><p className="text-[12px] text-warm-600 leading-relaxed">{s}</p></div>
          ))}
        </div>
      </Card>
      <Card className="bg-amber/5">
        <h3 className="text-[13px] font-bold text-warm-900 mb-2">헛구역질 vs 질식 (꼭 구별!)</h3>
        <div className="space-y-2">
          <div className="bg-sage/10 rounded-xl p-2.5">
            <p className="text-[11px] font-bold text-sage mb-0.5">😮 헛구역질 (정상)</p>
            <p className="text-[11px] text-warm-600 leading-relaxed">{BLW_GUIDE.gagVsChoke.gag}</p>
          </div>
          <div className="bg-terra/10 rounded-xl p-2.5">
            <p className="text-[11px] font-bold text-terra mb-0.5">🆘 질식 (응급)</p>
            <p className="text-[11px] text-warm-600 leading-relaxed">{BLW_GUIDE.gagVsChoke.choke}</p>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="text-[13px] font-bold text-warm-900 mb-2">안전 수칙</h3>
        <div className="space-y-1.5">
          {BLW_GUIDE.safety.map((s, i) => (
            <div key={i} className="flex items-start gap-2"><span className="text-terra text-[11px] mt-0.5">•</span><p className="text-[12px] text-warm-600 leading-relaxed">{s}</p></div>
          ))}
        </div>
        <p className="text-[11px] text-warm-500 bg-warm-100 rounded-lg px-3 py-2 mt-2.5">ℹ️ {BLW_GUIDE.note}</p>
        <SourceLine ids={BLW_GUIDE.sources} />
      </Card>
    </div>
  )
}

// ── 준비물 탭 ──
function ToolsTab() {
  return (
    <div className="space-y-3">
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-1">🧰 이유식 준비물</h3>
        <p className="text-[11px] text-warm-400 mb-3">⭐ 표시는 필수 · 누르면 쇼핑 검색 결과로 이동</p>
        <div className="space-y-2">
          {TOOLS.map((t, i) => (
            <a key={i} href={t.search} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2.5 bg-warm-100 rounded-xl px-3 py-2.5 active:bg-warm-200 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-bold text-warm-800">{t.essential && '⭐ '}{t.name}</p>
                  <span className="text-[9px] font-semibold text-warm-400 bg-warm-200 px-1.5 py-0.5 rounded-full">{t.when}</span>
                </div>
                <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              <span className="text-[11px] text-warm-400 mt-1">🛒</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── 쇼핑 탭 ──
function ShopTab() {
  return (
    <div className="space-y-3">
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">🥕 재료 구매처</h3>
        <div className="space-y-2">{STORES.ingredients.map((s, i) => <StoreRow key={i} store={s} />)}</div>
      </Card>
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">🍱 시판 이유식 브랜드</h3>
        <p className="text-[11px] text-warm-400 mb-2.5">직접 만들기 부담될 때 — 체험팩으로 입맛 먼저 확인 추천</p>
        <div className="space-y-2">{STORES.ready.map((s, i) => <StoreRow key={i} store={s} />)}</div>
        <p className="text-[10px] text-warm-400 mt-2.5 leading-relaxed">※ 브랜드 순위는 2025년 소비자 선호도 조사 기준이며, 가격·구성은 시기에 따라 달라질 수 있어요.</p>
      </Card>
    </div>
  )
}

function StoreRow({ store }) {
  return (
    <a href={store.url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2.5 bg-warm-100 rounded-xl px-3 py-2.5 active:bg-warm-200 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-warm-800">{store.name}</p>
        <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">{store.desc}</p>
      </div>
      <span className="text-[11px] text-warm-400">→</span>
    </a>
  )
}

// ── 영상·자료 탭 ──
function MediaTab() {
  return (
    <div className="space-y-3">
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">▶️ 추천 유튜브</h3>
        <div className="space-y-2">
          {YOUTUBE.map((v, i) => (
            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2.5 bg-warm-100 rounded-xl px-3 py-2.5 active:bg-warm-200 transition-colors">
              <span className="text-[12px] mt-0.5">▶</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-bold text-warm-800">{v.name}</p>
                  <span className="text-[9px] font-semibold text-warm-400 bg-warm-200 px-1.5 py-0.5 rounded-full">{v.type}</span>
                </div>
                <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">{v.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-[14px] font-bold text-warm-900 mb-2.5">📚 참고 사이트·레시피</h3>
        <div className="space-y-2">
          {REFERENCE_SITES.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-2.5 bg-warm-100 rounded-xl px-3 py-2.5 active:bg-warm-200 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-bold text-warm-800">{s.name}</p>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: s.tag === '공식' ? 'rgb(var(--color-sage))' : 'rgb(var(--color-warm-300))', color: '#fff' }}>{s.tag}</span>
                </div>
                <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
              <span className="text-[11px] text-warm-400 mt-1">→</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}
