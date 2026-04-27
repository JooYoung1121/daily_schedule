import { useState, useRef, useEffect, useCallback } from 'react'
import { useSettings } from '../context/SettingsContext'
import { fetchBabyTimeData, saveBabyTimeData } from '../github'
import { FEEDING_GUIDE, SLEEP_GUIDE, MILESTONES_DETAIL, SOLID_FOOD_GUIDE, SOURCES, getGuideForAge } from '../data/babyReference'
import { readBabyTimeFile, mergeAndSort } from '../data/babyTimeParser'
import { analyzeBabyData } from '../data/babyAnalyzer'
import { VACCINATIONS, VACCINATION_SOURCE_URL } from '../data/vaccinations'

// ── 주차별 발달 마일스톤 (기존) ──
const MILESTONES = [
  {
    weekStart: 0, weekEnd: 3, icon: '👶', color: '#E07B8C',
    title: '신생아 (1~3주)', summary: '모든 감각이 깨어나는 시기예요.',
    behaviors: ['모로 반사 (놀람 반사)', '빨기·쥐기·루팅 반사', '엄마 목소리·냄새 인식', '빛과 그림자 구분'],
    tips: ['하루 16~20시간 수면은 정상이에요', '배꼽 소독 꼼꼼히', '황달 증상을 관찰하세요', '수유 후 트림은 필수'],
    feeding: '1.5~3시간 간격 (하루 8~12회)', sleep: '하루 16~20시간, 2~4시간 간격 수면',
    sources: [
      { label: '아이사랑 포털 — 신생아 성장발달', url: 'https://www.childcare.go.kr/?menuno=288' },
      { label: '질병관리청 — 영유아 건강검진', url: 'https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuLv=1&menuCd=115' },
    ],
    videos: [
      { label: '하정훈 — 신생아 초보 부모 필수 가이드', url: 'https://www.youtube.com/results?search_query=하정훈+신생아+돌보기+필수' },
      { label: '하정훈 — 신생아 수유 총정리', url: 'https://www.youtube.com/results?search_query=하정훈+신생아+수유+모유+분유' },
    ],
  },
  {
    weekStart: 4, weekEnd: 7, icon: '😊', color: '#D4715A',
    title: '1개월', summary: '첫 사회적 미소가 나타나는 감동적인 시기!',
    behaviors: ['사회적 미소 시작', '움직이는 물체 눈으로 추적', '엎드렸을 때 잠깐 고개 들기', '소리 나는 곳으로 고개 돌리기'],
    tips: ['B형간염 2차 접종 (출생 4주)', '엎드리기 연습(Tummy Time) 하루 2~3분씩', '흑백 패턴 장난감으로 시각 자극'],
    feeding: '모유 2~3시간, 분유 3~4시간 간격', sleep: '하루 14~17시간, 밤에 3~4시간 연속 수면 시작',
    sources: [
      { label: '아이사랑 포털 — 1~3개월 성장발달', url: 'https://www.childcare.go.kr/?menuno=289' },
      { label: 'AAP — 1개월 발달 마일스톤', url: 'https://www.healthychildren.org/English/ages-stages/baby/Pages/default.aspx' },
    ],
    videos: [
      { label: '하정훈 — 1개월 아기 궁금한 것 총정리', url: 'https://www.youtube.com/results?search_query=하정훈+1개월+아기+발달' },
      { label: '차이의놀이 — 1개월 아기 놀이법', url: 'https://www.youtube.com/results?search_query=차이의놀이+1개월+신생아+놀이' },
    ],
  },
  {
    weekStart: 8, weekEnd: 11, icon: '🗣️', color: '#C8924A',
    title: '2개월', summary: '웃음과 옹알이가 시작돼요!',
    behaviors: ['활발한 웃음 (까르르)', '옹알이 시작 (아아~, 우우~)', '손발을 활발히 움직이기', '얼굴 인식력 발달'],
    tips: ['2개월 국가예방접종 (DTaP·폴리오·Hib·폐렴구균·로타바이러스)', '접종 후 미열 주의 — 해열제 준비', '색깔 있는 장난감으로 자극'],
    feeding: '3~4시간 간격, 1회 100~120ml', sleep: '하루 14~16시간, 밤 4~5시간 연속 가능',
    sources: [
      { label: '아이사랑 포털 — 1~3개월 성장발달', url: 'https://www.childcare.go.kr/?menuno=289' },
      { label: '질병관리청 — 2개월 예방접종 안내', url: 'https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuLv=1&menuCd=115' },
    ],
    videos: [
      { label: '하정훈 — 2개월 예방접종 꼭 알아야 할 것', url: 'https://www.youtube.com/results?search_query=하정훈+2개월+예방접종+아기' },
    ],
  },
  {
    weekStart: 12, weekEnd: 15, icon: '🤲', color: '#8B7EC8',
    title: '3개월', summary: '목 가누기가 안정되고 손에 관심이 생겨요.',
    behaviors: ['목 가누기 안정화', '손을 바라보며 탐색', '물건 잡으려는 시도', '소리 내어 웃기 (까르르)'],
    tips: ['엎드리기 연습 하루 5~10분', '딸랑이·소리 나는 장난감 자극', '수면 교육 서서히 시작 가능', '밤 수유 횟수 줄이기 시도'],
    feeding: '3~4시간 간격, 1회 120~150ml', sleep: '하루 14~15시간, 밤 6~8시간 연속 가능해지기 시작',
    sources: [
      { label: '아이사랑 포털 — 1~3개월 돌보기', url: 'https://www.childcare.go.kr/?menuno=425' },
    ],
    videos: [
      { label: '하정훈 — 100일 아기 수면 교육 방법', url: 'https://www.youtube.com/results?search_query=하정훈+100일+수면교육+아기' },
      { label: '차이의놀이 — 100일 아기 놀아주기', url: 'https://www.youtube.com/results?search_query=차이의놀이+100일+아기+놀이' },
    ],
  },
  {
    weekStart: 16, weekEnd: 19, icon: '🎯', color: '#5E9E8A',
    title: '4개월', summary: '물건을 잡고 뒤집기를 시도해요!',
    behaviors: ['물건 잡아서 입에 넣기', '뒤집기 시도 (앞→뒤)', '엎드려서 90도 이상 고개 들기', '이름에 반응 시작'],
    tips: ['4개월 국가예방접종 (DTaP·폴리오·Hib·폐렴구균·로타바이러스)', '이유식 준비 정보 수집 시작', '소파·침대 낙상 각별히 주의'],
    feeding: '4시간 간격, 1회 150~180ml', sleep: '하루 12~15시간, 낮잠 2~3회',
    sources: [{ label: '아이사랑 포털 — 4~6개월 성장발달', url: 'https://www.childcare.go.kr/?menuno=290' }],
    videos: [
      { label: '하정훈 — 4개월 뒤집기와 발달 체크', url: 'https://www.youtube.com/results?search_query=하정훈+4개월+아기+뒤집기+발달' },
    ],
  },
  {
    weekStart: 20, weekEnd: 23, icon: '🙌', color: '#E07B8C',
    title: '5개월', summary: '뒤집기 완성! 움직임이 매우 활발해져요.',
    behaviors: ['뒤집기 완성 (앞뒤 모두)', '두 손으로 물건 번갈아 잡기', '발가락 잡아당기기', '낯가림 시작 가능'],
    tips: ['소파·침대 낙상 각별히 주의', '작은 물건 근처에 두지 않기', '이유식 시작 검토 (5~6개월)'],
    feeding: '4~5시간 간격, 1회 150~200ml', sleep: '하루 12~14시간, 낮잠 2회',
    sources: [{ label: '아이사랑 포털 — 4~6개월 돌보기', url: 'https://www.childcare.go.kr/?menuno=290' }],
    videos: [
      { label: '하정훈 — 5개월 아기 낯가림 대처법', url: 'https://www.youtube.com/results?search_query=하정훈+5개월+낯가림+아기' },
    ],
  },
  {
    weekStart: 24, weekEnd: 35, icon: '🥣', color: '#D4715A',
    title: '6~8개월', summary: '이유식 시작! 앉기와 기기를 향해 나아가요.',
    behaviors: ['이유식 시작 (쌀미음)', '도움받아 앉기', '배밀이·기기 준비', '음악에 맞춰 반응'],
    tips: ['6개월 예방접종 (DTaP 3차·B형간염 3차)', '이유식 쌀미음→채소→과일→육류 순서로', '컵으로 물 마시는 연습'],
    feeding: '이유식 1회 + 수유 4~5회', sleep: '하루 12~14시간, 밤잠 안정',
    sources: [{ label: '아이사랑 포털 — 4~6개월 성장발달', url: 'https://www.childcare.go.kr/?menuno=290' }],
    videos: [
      { label: '하정훈 — 이유식 시작 총정리', url: 'https://www.youtube.com/results?search_query=하정훈+이유식+시작+쌀미음+6개월' },
    ],
  },
  {
    weekStart: 36, weekEnd: 52, icon: '🚀', color: '#5B8DB8',
    title: '9~12개월', summary: '기기 시작! 첫 단어와 첫 걸음이 기다려요.',
    behaviors: ['기기 시작', '잡고 서기', '"엄마·아빠" 의미 있게 말하기', '손 흔들어 인사', '첫 걸음 시도'],
    tips: ['12개월 예방접종 (MMR·수두·A형간염·Hib 4차)', '안전한 공간 확보', '이유식 → 유아식 전환'],
    feeding: '이유식 3회 + 수유 2~3회', sleep: '하루 12~13시간',
    sources: [{ label: '아이사랑 포털 — 10~12개월 성장발달', url: 'https://www.childcare.go.kr/?menuno=292' }],
    videos: [
      { label: '하정훈 — 돌 전 아기 발달 체크리스트', url: 'https://www.youtube.com/results?search_query=하정훈+돌전+아기+발달+체크' },
    ],
  },
]

// ── 개월 탭 정의 ──
const MONTH_TABS = MILESTONES.map((m, i) => ({
  index: i,
  label: m.title.replace(/\s*\(.*\)/, ''),
  weekStart: m.weekStart,
  weekEnd: m.weekEnd,
  color: m.color,
  icon: m.icon,
}))

function getBabyAge(birthdate) {
  const birth = new Date(birthdate)
  const now = new Date()
  const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(totalDays / 7)
  const months = Math.floor(totalDays / 30.44)
  const remainDays = totalDays - Math.round(months * 30.44)
  return { totalDays, weeks, months, remainDays: Math.max(0, remainDays) }
}

function getCurrentMilestoneIndex(weeks) {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (weeks >= MILESTONES[i].weekStart) return i
  }
  return 0
}

// ── 섹션 탭 ──
const SECTION_TABS = [
  { id: 'dev',   label: '발달정보', icon: '📋' },
  { id: 'guide', label: '표준 가이드', icon: '📊' },
  { id: 'analysis', label: '내 아이 분석', icon: '🔍' },
]

export default function Baby() {
  const { settings, loading: settingsLoading, updateSetting } = useSettings()
  const birthdate = settings.babyBirthdate || ''

  const [inputDate, setInputDate] = useState('')
  const [editing, setEditing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [section, setSection] = useState('dev')
  const [babyRecords, setBabyRecords] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [babyDataSha, setBabyDataSha] = useState(null)
  const monthTabsRef = useRef(null)
  const fileInputRef = useRef(null)

  const showEditor = !settingsLoading && (!birthdate || editing)

  // 저장된 BabyTime 데이터 로드
  useEffect(() => {
    if (!birthdate) return
    fetchBabyTimeData().then(({ babyData, sha }) => {
      if (babyData?.records) {
        setBabyRecords(babyData.records)
        setBabyDataSha(sha)
      }
    }).catch(() => {})
  }, [birthdate])

  // 레코드 변경시 분석 실행
  useEffect(() => {
    if (!babyRecords || !birthdate) return
    const age = getBabyAge(birthdate)
    const result = analyzeBabyData(babyRecords, age.totalDays)
    setAnalysis(result)
  }, [babyRecords, birthdate])

  // 현재 개월수에 맞는 탭 자동 선택
  useEffect(() => {
    if (!birthdate || selectedMonth !== null) return
    const age = getBabyAge(birthdate)
    setSelectedMonth(getCurrentMilestoneIndex(age.weeks))
  }, [birthdate, selectedMonth])

  // 선택된 탭으로 스크롤
  useEffect(() => {
    if (selectedMonth === null || !monthTabsRef.current) return
    const btn = monthTabsRef.current.children[selectedMonth]
    if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedMonth])

  async function handleSave() {
    if (!inputDate) return
    await updateSetting('babyBirthdate', inputDate)
    setEditing(false)
  }

  const handleFileUpload = useCallback(async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const allRecords = []
      for (const file of files) {
        const records = await readBabyTimeFile(file)
        allRecords.push(...records)
      }
      const sorted = mergeAndSort([allRecords])
      setBabyRecords(sorted)

      // GitHub에 저장
      const newSha = await saveBabyTimeData(
        { records: sorted, updatedAt: new Date().toISOString() },
        babyDataSha
      )
      setBabyDataSha(newSha)
    } catch (err) {
      console.error('BabyTime 파일 파싱 오류:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [babyDataSha])

  if (settingsLoading) {
    return (
      <div className="flex flex-col bg-warm-100 items-center justify-center" style={{ height: '100%' }}>
        <p className="text-warm-400 text-sm">불러오는 중…</p>
      </div>
    )
  }

  if (showEditor) {
    return (
      <div className="flex flex-col bg-warm-100" style={{ height: '100%' }}>
        <div className="px-5 pt-8 pb-4">
          <h1 className="text-[1.35rem] font-bold text-warm-900 tracking-tight">육아 정보</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 pb-28">
          <div className="text-6xl">👶</div>
          <div className="text-center">
            <h2 className="text-[18px] font-bold text-warm-900 mb-2">아기 생년월일을 알려주세요</h2>
            <p className="text-[13px] text-warm-400">주차별 발달 정보와 예방접종 일정을 안내드려요</p>
          </div>
          <div className="w-full space-y-3">
            <input
              type="date" value={inputDate} onChange={e => setInputDate(e.target.value)}
              className="w-full bg-warm-50 border border-warm-200 rounded-2xl px-4 py-3.5 text-[15px] text-warm-800 outline-none"
            />
            <button onClick={handleSave} disabled={!inputDate}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-[15px] bg-terra transition-all active:brightness-90 disabled:opacity-40"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const age = getBabyAge(birthdate)
  const currentIdx = getCurrentMilestoneIndex(age.weeks)
  const viewIdx = selectedMonth ?? currentIdx
  const milestone = MILESTONES[viewIdx]
  const isCurrentMonth = viewIdx === currentIdx

  return (
    <div className="flex flex-col bg-warm-100 overflow-hidden" style={{ height: '100%' }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[1.35rem] font-bold text-warm-900 tracking-tight">육아 정보</h1>
            <p className="text-[13px] text-warm-500 mt-0.5">
              {age.months > 0 ? `${age.months}개월 ${age.remainDays}일` : `${age.totalDays}일`} · {age.weeks}주차
            </p>
          </div>
          <button onClick={() => { setInputDate(birthdate); setEditing(true) }}
            className="text-[12px] text-warm-500 bg-warm-200 px-3 py-1.5 rounded-full active:bg-warm-300 transition-colors flex-shrink-0"
          >
            생일 변경
          </button>
        </div>

        {/* Age progress */}
        {(() => {
          const pct = Math.min((age.totalDays / 365) * 100, 100)
          const labelLeft = Math.min(Math.max(pct, 4), 94)
          return (
            <>
              <div className="mt-3 bg-warm-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: MILESTONES[currentIdx].color }} />
              </div>
              <div className="relative mt-1" style={{ height: '16px' }}>
                <span className="absolute left-0 text-[10px] text-warm-400">출생</span>
                <span className="absolute text-[10px] font-bold -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${labelLeft}%`, color: MILESTONES[currentIdx].color }}>
                  D+{age.totalDays}
                </span>
                <span className="absolute right-0 text-[10px] text-warm-400">12개월</span>
              </div>
            </>
          )
        })()}
      </div>

      {/* Month tabs */}
      <div ref={monthTabsRef}
        className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none flex-shrink-0"
      >
        {MONTH_TABS.map((tab, i) => (
          <button key={i} onClick={() => setSelectedMonth(i)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95 relative"
            style={{
              background: viewIdx === i ? tab.color : tab.color + '18',
              color: viewIdx === i ? '#fff' : tab.color,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {i === currentIdx && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-terra border border-white" />
            )}
          </button>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 px-4 pb-3 flex-shrink-0">
        {SECTION_TABS.map(tab => (
          <button key={tab.id} onClick={() => setSection(tab.id)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{
              background: section === tab.id ? milestone.color : 'transparent',
              color: section === tab.id ? '#fff' : 'rgb(var(--color-warm-500))',
            }}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-28 space-y-4">

        {/* ── 발달정보 섹션 ── */}
        {section === 'dev' && (
          <>
            {!isCurrentMonth && (
              <div className="bg-warm-200/50 rounded-xl px-3 py-2 text-[11px] text-warm-500 text-center">
                현재 시기가 아닌 <strong>{milestone.title}</strong> 정보를 보고 있어요
              </div>
            )}
            <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: milestone.color + '20' }}>
                  {milestone.icon}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wide">
                    {isCurrentMonth ? '현재 시기' : '열람 중'}
                  </p>
                  <h2 className="text-[16px] font-bold text-warm-900">{milestone.title}</h2>
                  <p className="text-[12px] text-warm-500 mt-0.5">{milestone.summary}</p>
                </div>
              </div>

              {/* Behaviors */}
              <div className="mb-3">
                <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mb-2">발달 특징</p>
                <div className="space-y-1.5">
                  {milestone.behaviors.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: milestone.color }} />
                      <p className="text-[13px] text-warm-700">{b}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-warm-100 rounded-xl p-3 mb-3">
                <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mb-2">이 시기 포인트</p>
                <div className="space-y-1.5">
                  {milestone.tips.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-warm-400 text-[11px] mt-0.5 flex-shrink-0">•</span>
                      <p className="text-[12px] text-warm-600">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feeding & Sleep */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-warm-100 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-warm-400 mb-1">🍼 수유</p>
                  <p className="text-[11px] text-warm-700 leading-relaxed">{milestone.feeding}</p>
                </div>
                <div className="bg-warm-100 rounded-xl p-2.5">
                  <p className="text-[10px] font-bold text-warm-400 mb-1">😴 수면</p>
                  <p className="text-[11px] text-warm-700 leading-relaxed">{milestone.sleep}</p>
                </div>
              </div>

              {/* Videos */}
              {milestone.videos?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mb-2">추천 영상</p>
                  <div className="space-y-1.5">
                    {milestone.videos.map((v, i) => (
                      <a key={i} href={v.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-warm-100 rounded-lg px-2.5 py-2 active:bg-warm-200 transition-colors">
                        <span className="text-[12px] flex-shrink-0">▶</span>
                        <p className="text-[11px] text-warm-700 flex-1 leading-snug">{v.label}</p>
                        <span className="text-[10px] text-warm-400 flex-shrink-0">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {milestone.sources?.length > 0 && (
                <div className="border-t border-warm-200/60 pt-2.5">
                  <p className="text-[10px] font-bold text-warm-300 uppercase tracking-wide mb-1.5">출처·참고자료</p>
                  <div className="space-y-1">
                    {milestone.sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="block text-[10px] text-warm-400 hover:text-warm-600 underline decoration-warm-200 underline-offset-2 leading-relaxed">
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vaccination schedule */}
            <VaccinationCard age={age} />
          </>
        )}

        {/* ── 표준 가이드 섹션 ── */}
        {section === 'guide' && (
          <GuideSection totalDays={age.totalDays} milestone={milestone} viewIdx={viewIdx} />
        )}

        {/* ── 내 아이 분석 섹션 ── */}
        {section === 'analysis' && (
          <AnalysisSection
            babyRecords={babyRecords}
            analysis={analysis}
            uploading={uploading}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            age={age}
          />
        )}
      </div>
    </div>
  )
}

// ── 예방접종 카드 ──
function VaccinationCard({ age }) {
  return (
    <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-bold text-warm-900">예방접종 일정</h3>
        <a href={VACCINATION_SOURCE_URL}
          target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-warm-400 underline underline-offset-2">
          질병관리청 기준
        </a>
      </div>
      <div className="space-y-2">
        {VACCINATIONS.map((v, i) => {
          const isPast = age.totalDays > v.days + 21
          const isCurrent = age.totalDays >= v.days - 7 && age.totalDays <= v.days + 21
          return (
            <div key={i}
              className={`flex gap-3 items-start rounded-xl px-3 py-2.5 transition-colors ${
                isCurrent ? 'bg-terra/10 border border-terra/20'
                  : isPast ? 'bg-warm-100 opacity-50' : 'bg-warm-100'
              }`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5 ${
                isPast ? 'bg-sage text-white' : isCurrent ? 'bg-terra text-white' : 'bg-warm-200 text-warm-500'
              }`}>
                {isPast ? '✓' : isCurrent ? '!' : '·'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-bold text-warm-800">{v.label}</p>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-terra bg-terra/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      접종 시기
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">{v.vaccines.join(' · ')}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 표준 가이드 섹션 ──
function GuideSection({ totalDays, milestone, viewIdx }) {
  // viewIdx 기반으로 해당 개월수의 표준 데이터 찾기
  const ms = MILESTONES[viewIdx]
  const midDays = Math.round((ms.weekStart + ms.weekEnd) / 2 * 7)
  const feedGuide = getGuideForAge(FEEDING_GUIDE, midDays)
  const sleepGuide = getGuideForAge(SLEEP_GUIDE, midDays)
  const devDetail = MILESTONES_DETAIL.find(m => midDays >= m.minDays && midDays <= m.maxDays)
  const solidGuide = SOLID_FOOD_GUIDE.find(s => midDays >= s.minDays && midDays <= s.maxDays)

  return (
    <>
      {/* 수유 가이드 */}
      <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
        <h3 className="text-[14px] font-bold text-warm-900 mb-3">🍼 수유 가이드 ({feedGuide.label})</h3>
        <div className="space-y-2">
          <Row label="1회 수유량" value={`${feedGuide.perMl[0]}~${feedGuide.perMl[1]}ml`} />
          <Row label="하루 횟수" value={`${feedGuide.timesPerDay[0]}~${feedGuide.timesPerDay[1]}회`} />
          <Row label="하루 총량" value={`${feedGuide.dailyMl[0]}~${feedGuide.dailyMl[1]}ml`} />
          <Row label="참고" value={feedGuide.notes} />
        </div>
        <p className="text-[10px] text-warm-400 mt-2">출처: {feedGuide.source} — <a href={SOURCES.AAP.url} target="_blank" rel="noopener noreferrer" className="underline">{SOURCES.AAP.name}</a></p>
      </div>

      {/* 수면 가이드 */}
      <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
        <h3 className="text-[14px] font-bold text-warm-900 mb-3">😴 수면 가이드 ({sleepGuide.label})</h3>
        <div className="space-y-2">
          <Row label="총 수면" value={`${sleepGuide.totalHrs[0]}~${sleepGuide.totalHrs[1]}시간`} />
          <Row label="밤잠" value={`${sleepGuide.nightHrs[0]}~${sleepGuide.nightHrs[1]}시간`} />
          <Row label="낮잠" value={`${sleepGuide.naps[0]}~${sleepGuide.naps[1]}회 (${sleepGuide.napDurMin[0]}~${sleepGuide.napDurMin[1]}분)`} />
          <Row label="활동시간" value={`${sleepGuide.wakeWindowMin[0]}~${sleepGuide.wakeWindowMin[1]}분`} />
          <Row label="참고" value={sleepGuide.notes} />
        </div>
        <p className="text-[10px] text-warm-400 mt-2">출처: {sleepGuide.source} — <a href={SOURCES.NSF.url} target="_blank" rel="noopener noreferrer" className="underline">{SOURCES.NSF.name}</a></p>
      </div>

      {/* 발달 상세 */}
      {devDetail && (
        <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
          <h3 className="text-[14px] font-bold text-warm-900 mb-3">🧒 발달 상세 ({devDetail.label})</h3>
          <DevCategory label="대근육" items={devDetail.grossMotor} color={milestone.color} />
          <DevCategory label="소근육" items={devDetail.fineMotor} color={milestone.color} />
          <DevCategory label="언어/인지" items={devDetail.language} color={milestone.color} />
          <DevCategory label="사회성" items={devDetail.social} color={milestone.color} />
          <p className="text-[10px] text-warm-400 mt-2">출처: {devDetail.source} — <a href={SOURCES.CDC.url} target="_blank" rel="noopener noreferrer" className="underline">{SOURCES.CDC.name}</a></p>
        </div>
      )}

      {/* 이유식 */}
      {solidGuide && (
        <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
          <h3 className="text-[14px] font-bold text-warm-900 mb-3">🥣 이유식 가이드 ({solidGuide.label})</h3>
          <div className="space-y-2">
            <Row label="식재료" value={solidGuide.foods} />
            <Row label="빈도" value={solidGuide.frequency} />
            <Row label="양" value={solidGuide.amount} />
            <Row label="참고" value={solidGuide.notes} />
          </div>
          <p className="text-[10px] text-warm-400 mt-2">출처: {solidGuide.source}</p>
        </div>
      )}

      {/* 전체 수유 테이블 */}
      <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
        <h3 className="text-[14px] font-bold text-warm-900 mb-3">📋 전체 수유량 참조표</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-warm-400 border-b border-warm-200">
                <th className="text-left py-1.5 pr-2 font-semibold">시기</th>
                <th className="text-right py-1.5 px-2 font-semibold">1회(ml)</th>
                <th className="text-right py-1.5 px-2 font-semibold">횟수</th>
                <th className="text-right py-1.5 pl-2 font-semibold">일총량</th>
              </tr>
            </thead>
            <tbody>
              {FEEDING_GUIDE.map((g, i) => {
                const isActive = totalDays >= g.minDays && totalDays <= g.maxDays
                return (
                  <tr key={i} className={isActive ? 'bg-terra/10 font-bold' : ''}>
                    <td className="py-1.5 pr-2 text-warm-700">{g.label} {isActive && '←'}</td>
                    <td className="py-1.5 px-2 text-right text-warm-600">{g.perMl[0]}~{g.perMl[1]}</td>
                    <td className="py-1.5 px-2 text-right text-warm-600">{g.timesPerDay[0]}~{g.timesPerDay[1]}</td>
                    <td className="py-1.5 pl-2 text-right text-warm-600">{g.dailyMl[0]}~{g.dailyMl[1]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-warm-400 mt-2">출처: AAP (American Academy of Pediatrics)</p>
      </div>
    </>
  )
}

// ── 내 아이 분석 섹션 ──
function AnalysisSection({ babyRecords, analysis, uploading, fileInputRef, onFileUpload, age }) {
  if (!babyRecords) {
    return (
      <div className="bg-warm-50 rounded-2xl p-6 shadow-warm-sm border border-warm-200/40 text-center">
        <div className="text-4xl mb-3">📱</div>
        <h3 className="text-[15px] font-bold text-warm-900 mb-2">BabyTime 데이터 업로드</h3>
        <p className="text-[12px] text-warm-500 mb-4 leading-relaxed">
          BabyTime 앱에서 내보낸 txt 파일을 업로드하면<br />
          수유·수면 패턴을 분석하고 맞춤 제안을 드려요.
        </p>
        <p className="text-[11px] text-warm-400 mb-4 bg-warm-100 rounded-xl p-3 text-left leading-relaxed">
          <strong>내보내기 방법:</strong> BabyTime 앱 → 설정 → 내보내기 → 일일기록(txt)<br />
          zip 파일을 풀고 txt 파일을 업로드해주세요. (여러 파일 선택 가능)
        </p>
        <input ref={fileInputRef} type="file" accept=".txt" multiple
          onChange={onFileUpload} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="w-full py-3 rounded-2xl font-bold text-white text-[14px] bg-terra transition-all active:brightness-90 disabled:opacity-40">
          {uploading ? '분석 중...' : 'txt 파일 업로드'}
        </button>
      </div>
    )
  }

  if (analysis?.error) {
    return (
      <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40 text-center">
        <p className="text-[13px] text-warm-500">{analysis.error}</p>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40 text-center">
        <p className="text-[13px] text-warm-400">분석 중...</p>
      </div>
    )
  }

  const { avg, comparison, patterns, todaySchedule, suggestions } = analysis

  return (
    <>
      {/* 데이터 요약 */}
      <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-bold text-warm-900">최근 {avg.days}일 요약</h3>
          <p className="text-[10px] text-warm-400">{avg.dateRange.from} ~ {avg.dateRange.to}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard icon="🍼" label="일평균 수유량" value={`${avg.avgFeedingMl}ml`}
            sub={`${avg.avgFeedingCount}회/일`}
            status={comparison.feeding.status} standard={comparison.feeding.standard} unit="ml" />
          <StatCard icon="😴" label="일평균 수면" value={`${avg.avgTotalSleepHrs}시간`}
            sub={`낮잠 ${avg.avgNapCount}회`}
            status={comparison.sleep.status} standard={comparison.sleep.standard} unit="시간" />
          <StatCard icon="🌙" label="평균 밤잠" value={`${(avg.avgNightMin / 60).toFixed(1)}시간`}
            sub={`표준 ${comparison.sleep.standardNightHrs[0]}~${comparison.sleep.standardNightHrs[1]}시간`} />
          <StatCard icon="🧷" label="평균 기저귀" value={`${avg.avgDiaperCount}회/일`} />
        </div>

        {/* 파일 재업로드 */}
        <div className="mt-3 flex gap-2">
          <input ref={fileInputRef} type="file" accept=".txt" multiple onChange={onFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex-1 py-2 rounded-xl text-[11px] font-semibold bg-warm-200 text-warm-600 active:bg-warm-300 transition-colors">
            {uploading ? '업로드 중...' : '데이터 업데이트'}
          </button>
        </div>
      </div>

      {/* 패턴 분석 */}
      {patterns && (
        <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
          <h3 className="text-[14px] font-bold text-warm-900 mb-3">패턴 분석</h3>
          <div className="space-y-2">
            {patterns.avgFirstFeeding && <Row label="평균 첫 수유" value={patterns.avgFirstFeeding} />}
            {patterns.avgLastFeeding && <Row label="평균 마지막 수유" value={patterns.avgLastFeeding} />}
            <Row label="평균 수유 간격" value={`${patterns.avgFeedingInterval}분 (${(patterns.avgFeedingInterval / 60).toFixed(1)}시간)`} />
            {patterns.avgFirstNap && <Row label="평균 첫 낮잠" value={patterns.avgFirstNap} />}
            {patterns.avgNightSleepStart && <Row label="평균 밤잠 시작" value={patterns.avgNightSleepStart} />}
          </div>
        </div>
      )}

      {/* 오늘 예상 일정 */}
      {todaySchedule?.length > 0 && (
        <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
          <h3 className="text-[14px] font-bold text-warm-900 mb-3">오늘 예상 일정</h3>
          <div className="space-y-1.5">
            {todaySchedule.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-warm-100 rounded-xl px-3 py-2">
                <span className="text-[13px]">{s.title.split(' ')[0]}</span>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-warm-800">{s.title}</p>
                  <p className="text-[10px] text-warm-500">{s.startTime} ~ {s.endTime}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-warm-100 rounded-xl px-3 py-2 text-center">
            <p className="text-[11px] text-warm-500">
              오늘 페이지 타임라인에서 <strong className="text-warm-700">👶 예상</strong> 버튼을 누르면 오버레이로 확인할 수 있어요
            </p>
          </div>
        </div>
      )}

      {/* 제안 */}
      <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
        <h3 className="text-[14px] font-bold text-warm-900 mb-3">분석 및 제안</h3>
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="bg-warm-100 rounded-xl p-3">
              <div className="flex items-start gap-2 mb-1">
                <span className="text-[14px]">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-warm-800">{s.title}</p>
                  <p className="text-[11px] text-warm-500 mt-0.5">{s.detail}</p>
                </div>
              </div>
              <p className="text-[11px] text-warm-600 mt-1.5 leading-relaxed pl-6">{s.advice}</p>
              {s.source && (
                <p className="text-[9px] text-warm-400 mt-1 pl-6">
                  출처: <a href={s.source.url} target="_blank" rel="noopener noreferrer" className="underline">{s.source.name}</a>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ── 공통 컴포넌트 ──

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <p className="text-[11px] text-warm-400 w-20 flex-shrink-0">{label}</p>
      <p className="text-[12px] text-warm-700 flex-1">{value}</p>
    </div>
  )
}

function StatCard({ icon, label, value, sub, status, standard, unit }) {
  const statusColors = {
    normal: { bg: '#E8F5E9', text: '#2E7D32', badge: '적정' },
    low:    { bg: '#FFF3E0', text: '#E65100', badge: '부족' },
    high:   { bg: '#E3F2FD', text: '#1565C0', badge: '많음' },
  }
  const st = status ? statusColors[status] : null

  return (
    <div className="bg-warm-100 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[13px]">{icon}</span>
        <p className="text-[10px] font-bold text-warm-400">{label}</p>
        {st && (
          <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: st.bg, color: st.text }}>
            {st.badge}
          </span>
        )}
      </div>
      <p className="text-[16px] font-bold text-warm-900">{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-0.5">{sub}</p>}
      {standard && <p className="text-[9px] text-warm-400 mt-0.5">표준: {standard[0]}~{standard[1]}{unit}</p>}
    </div>
  )
}

function DevCategory({ label, items, color }) {
  return (
    <div className="mb-2.5">
      <p className="text-[11px] font-bold text-warm-500 mb-1">{label}</p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
            <p className="text-[12px] text-warm-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
