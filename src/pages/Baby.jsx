import { useState } from 'react'

const BABY_KEY = 'baby_birthdate'

// 국가예방접종 스케줄 (출생 후 일수 기준)
const VACCINATIONS = [
  { days: 0,   label: '출생',      vaccines: ['BCG (결핵)', 'B형간염 1차'] },
  { days: 30,  label: '1개월',     vaccines: ['B형간염 2차'] },
  { days: 60,  label: '2개월',     vaccines: ['DTaP 1차', '폴리오 1차', 'Hib 1차', '폐렴구균 1차', '로타바이러스 1차'] },
  { days: 120, label: '4개월',     vaccines: ['DTaP 2차', '폴리오 2차', 'Hib 2차', '폐렴구균 2차', '로타바이러스 2차'] },
  { days: 180, label: '6개월',     vaccines: ['DTaP 3차', '폴리오 3차', 'Hib 3차', '폐렴구균 3차', 'B형간염 3차', '로타바이러스 3차'] },
  { days: 365, label: '12개월',    vaccines: ['MMR 1차', '수두', 'A형간염 1차', 'Hib 4차', '폐렴구균 4차', '일본뇌염 1차'] },
  { days: 450, label: '15~18개월', vaccines: ['DTaP 4차', 'MMR 2차'] },
  { days: 730, label: '24개월',    vaccines: ['A형간염 2차', '일본뇌염 2차'] },
  { days: 1825,label: '만 5세',    vaccines: ['DTaP 5차', '폴리오 4차', '일본뇌염 3차'] },
  { days: 4380,label: '만 12세',   vaccines: ['Tdap/Td', 'HPV (여아 2회)', '일본뇌염 4차'] },
]

// 주차별 발달 마일스톤
const MILESTONES = [
  {
    weekStart: 0, weekEnd: 3, icon: '👶', color: '#E07B8C',
    title: '신생아 (1~3주)',
    summary: '모든 감각이 깨어나는 시기예요.',
    behaviors: ['모로 반사 (놀람 반사)', '빨기·쥐기·루팅 반사', '엄마 목소리·냄새 인식', '빛과 그림자 구분'],
    tips: ['하루 16~20시간 수면은 정상이에요', '배꼽 소독 꼼꼼히', '황달 증상을 관찰하세요', '수유 후 트림은 필수'],
    feeding: '1.5~3시간 간격 (하루 8~12회)',
    sleep: '하루 16~20시간, 2~4시간 간격 수면',
  },
  {
    weekStart: 4, weekEnd: 7, icon: '😊', color: '#D4715A',
    title: '1개월',
    summary: '첫 사회적 미소가 나타나는 감동적인 시기!',
    behaviors: ['사회적 미소 시작', '움직이는 물체 눈으로 추적', '엎드렸을 때 잠깐 고개 들기', '소리 나는 곳으로 고개 돌리기'],
    tips: ['B형간염 2차 접종 (출생 4주)', '엎드리기 연습(Tummy Time) 하루 2~3분씩', '흑백 패턴 장난감으로 시각 자극'],
    feeding: '모유 2~3시간, 분유 3~4시간 간격',
    sleep: '하루 14~17시간, 밤에 3~4시간 연속 수면 시작',
  },
  {
    weekStart: 8, weekEnd: 11, icon: '🗣️', color: '#C8924A',
    title: '2개월',
    summary: '웃음과 옹알이가 시작돼요!',
    behaviors: ['활발한 웃음 (까르르)', '옹알이 시작 (아아~, 우우~)', '손발을 활발히 움직이기', '얼굴 인식력 발달'],
    tips: ['2개월 국가예방접종 (DTaP·폴리오·Hib·폐렴구균·로타바이러스)', '접종 후 미열 주의 — 해열제 준비', '색깔 있는 장난감으로 자극'],
    feeding: '3~4시간 간격, 1회 100~120ml',
    sleep: '하루 14~16시간, 밤 4~5시간 연속 가능',
  },
  {
    weekStart: 12, weekEnd: 15, icon: '🤲', color: '#8B7EC8',
    title: '3개월',
    summary: '목 가누기가 안정되고 손에 관심이 생겨요.',
    behaviors: ['목 가누기 안정화', '손을 바라보며 탐색', '물건 잡으려는 시도', '소리 내어 웃기 (까르르)'],
    tips: ['엎드리기 연습 하루 5~10분', '딸랑이·소리 나는 장난감 자극', '수면 교육 서서히 시작 가능', '밤 수유 횟수 줄이기 시도'],
    feeding: '3~4시간 간격, 1회 120~150ml',
    sleep: '하루 14~15시간, 밤 6~8시간 연속 가능해지기 시작',
  },
  {
    weekStart: 16, weekEnd: 19, icon: '🎯', color: '#5E9E8A',
    title: '4개월',
    summary: '물건을 잡고 뒤집기를 시도해요!',
    behaviors: ['물건 잡아서 입에 넣기', '뒤집기 시도 (앞→뒤)', '엎드려서 90도 이상 고개 들기', '이름에 반응 시작'],
    tips: ['4개월 국가예방접종 (DTaP·폴리오·Hib·폐렴구균·로타바이러스)', '이유식 준비 정보 수집 시작', '소파·침대 낙상 각별히 주의'],
    feeding: '4시간 간격, 1회 150~180ml',
    sleep: '하루 12~15시간, 낮잠 2~3회',
  },
  {
    weekStart: 20, weekEnd: 23, icon: '🙌', color: '#E07B8C',
    title: '5개월',
    summary: '뒤집기 완성! 움직임이 매우 활발해져요.',
    behaviors: ['뒤집기 완성 (앞뒤 모두)', '두 손으로 물건 번갈아 잡기', '발가락 잡아당기기', '낯가림 시작 가능'],
    tips: ['소파·침대 낙상 각별히 주의', '작은 물건 근처에 두지 않기', '이유식 시작 검토 (5~6개월)'],
    feeding: '4~5시간 간격, 1회 150~200ml',
    sleep: '하루 12~14시간, 낮잠 2회',
  },
  {
    weekStart: 24, weekEnd: 35, icon: '🥣', color: '#D4715A',
    title: '6~8개월',
    summary: '이유식 시작! 앉기와 기기를 향해 나아가요.',
    behaviors: ['이유식 시작 (쌀미음)', '도움받아 앉기', '배밀이·기기 준비', '음악에 맞춰 반응'],
    tips: ['6개월 예방접종 (DTaP 3차·B형간염 3차)', '이유식 쌀미음→채소→과일→육류 순서로', '컵으로 물 마시는 연습', '안전문(베이비게이트) 준비'],
    feeding: '이유식 1회 + 수유 4~5회',
    sleep: '하루 12~14시간, 밤잠 안정',
  },
  {
    weekStart: 36, weekEnd: 52, icon: '🚀', color: '#5B8DB8',
    title: '9~12개월',
    summary: '기기 시작! 첫 단어와 첫 걸음이 기다려요.',
    behaviors: ['기기 시작', '잡고 서기', '"엄마·아빠" 의미 있게 말하기', '손 흔들어 인사', '첫 걸음 시도'],
    tips: ['12개월 예방접종 (MMR·수두·A형간염·Hib 4차)', '안전한 공간 확보', '이유식 → 유아식 전환', '첫 돌 준비'],
    feeding: '이유식 3회 + 수유 2~3회',
    sleep: '하루 12~13시간',
  },
]

function getBabyAge(birthdate) {
  const birth     = new Date(birthdate)
  const now       = new Date()
  const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  const weeks     = Math.floor(totalDays / 7)
  const months    = Math.floor(totalDays / 30.44)
  const remainDays = totalDays - Math.round(months * 30.44)
  return { totalDays, weeks, months, remainDays: Math.max(0, remainDays) }
}

function getCurrentMilestone(weeks) {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (weeks >= MILESTONES[i].weekStart) return { milestone: MILESTONES[i], index: i }
  }
  return { milestone: MILESTONES[0], index: 0 }
}

export default function Baby() {
  const [birthdate, setBirthdate] = useState(() => localStorage.getItem(BABY_KEY) || '')
  const [inputDate, setInputDate] = useState(birthdate)
  const [editing,   setEditing]   = useState(!birthdate)

  function handleSave() {
    if (!inputDate) return
    localStorage.setItem(BABY_KEY, inputDate)
    setBirthdate(inputDate)
    setEditing(false)
  }

  // ── 생일 입력 화면 ──
  if (editing || !birthdate) {
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
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              className="w-full bg-warm-50 border border-warm-200 rounded-2xl px-4 py-3.5 text-[15px] text-warm-800 outline-none"
            />
            <button
              onClick={handleSave}
              disabled={!inputDate}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-[15px] bg-terra transition-all active:brightness-90 disabled:opacity-40"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const age                    = getBabyAge(birthdate)
  const { milestone, index }   = getCurrentMilestone(age.weeks)
  const nextMilestone          = MILESTONES[index + 1]

  return (
    <div className="flex flex-col bg-warm-100 overflow-hidden" style={{ height: '100%' }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[1.35rem] font-bold text-warm-900 tracking-tight">육아 정보</h1>
            <p className="text-[13px] text-warm-500 mt-0.5">
              {age.months > 0
                ? `${age.months}개월 ${age.remainDays}일`
                : `${age.totalDays}일`
              } · {age.weeks}주차
            </p>
          </div>
          <button
            onClick={() => { setInputDate(birthdate); setEditing(true) }}
            className="text-[12px] text-warm-500 bg-warm-200 px-3 py-1.5 rounded-full active:bg-warm-300 transition-colors"
          >
            생일 변경
          </button>
        </div>

        {/* Age progress (0~12개월) */}
        <div className="mt-3 bg-warm-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((age.totalDays / 365) * 100, 100)}%`,
              backgroundColor: milestone.color,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-warm-400">출생</span>
          <span className="text-[10px] text-warm-400">D+{age.totalDays}</span>
          <span className="text-[10px] text-warm-400">12개월</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pb-28 space-y-4">

        {/* Current milestone */}
        <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: milestone.color + '20' }}
            >
              {milestone.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wide">현재 시기</p>
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
            <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mb-2">💡 이 시기 포인트</p>
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
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-warm-100 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-warm-400 mb-1">🍼 수유</p>
              <p className="text-[11px] text-warm-700 leading-relaxed">{milestone.feeding}</p>
            </div>
            <div className="bg-warm-100 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-warm-400 mb-1">😴 수면</p>
              <p className="text-[11px] text-warm-700 leading-relaxed">{milestone.sleep}</p>
            </div>
          </div>
        </div>

        {/* Vaccination schedule */}
        <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40">
          <h3 className="text-[14px] font-bold text-warm-900 mb-3">💉 예방접종 일정</h3>
          <div className="space-y-2">
            {VACCINATIONS.map((v, i) => {
              const isPast    = age.totalDays > v.days + 21
              const isCurrent = age.totalDays >= v.days - 7 && age.totalDays <= v.days + 21
              return (
                <div
                  key={i}
                  className={`flex gap-3 items-start rounded-xl px-3 py-2.5 transition-colors ${
                    isCurrent
                      ? 'bg-terra/10 border border-terra/20'
                      : isPast
                        ? 'bg-warm-100 opacity-50'
                        : 'bg-warm-100'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5 ${
                      isPast    ? 'bg-sage text-white' :
                      isCurrent ? 'bg-terra text-white' :
                                  'bg-warm-200 text-warm-500'
                    }`}
                  >
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
                    <p className="text-[11px] text-warm-500 mt-0.5 leading-relaxed">
                      {v.vaccines.join(' · ')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Next milestone preview */}
        {nextMilestone && (
          <div className="bg-warm-50 rounded-2xl p-4 shadow-warm-sm border border-warm-200/40 opacity-70">
            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide mb-2">다음 시기 예고</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{nextMilestone.icon}</span>
              <div>
                <p className="text-[13px] font-bold text-warm-800">{nextMilestone.title}</p>
                <p className="text-[12px] text-warm-500">{nextMilestone.summary}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
