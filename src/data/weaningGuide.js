/**
 * 이유식 종합 가이드 데이터
 *
 * ── 근거(출처) ──
 * - 질병관리청 국가건강정보포털 「이유기보충식(이유식)」(공식 1차 근거)
 *   https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470
 * - WHO Complementary feeding / AAP HealthyChildren
 * - 식품의약품안전처 식품안전나라
 *
 * ※ 단계 시기 표기 주의(사실): 공식(질병관리청·WHO) 분류는 6개월 시작 기준으로
 *   초기(6개월)/9~11개월/12~23개월의 3구간을 쓴다. 반면 한국 부모·시판 이유식 업계가
 *   실제로 쓰는 관례는 초기/중기/후기/완료기의 4단계다. 아래 STAGES는 "관례 4단계"를
 *   기준으로 정리하되, 공식 권장 시작 시기(만 4~6개월, 모유수유아는 6개월)를 함께 명시한다.
 *   개월수 경계는 자료마다 1~2개월 편차가 있으므로 범위로 본다(추론 아님, 자료 간 편차 사실).
 */

export const WEANING_SOURCES = {
  KDCA: {
    name: '질병관리청 국가건강정보포털 — 이유기보충식',
    url: 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470',
  },
  AAP: {
    name: 'AAP HealthyChildren — Starting Solid Foods',
    url: 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Starting-Solid-Foods.aspx',
  },
  WHO: {
    name: 'WHO — Complementary feeding',
    url: 'https://www.who.int/health-topics/complementary-feeding',
  },
  MFDS: {
    name: '식품의약품안전처 식품안전나라',
    url: 'https://www.foodsafetykorea.go.kr/',
  },
  CHILDCARE: {
    name: '아이사랑 보육포털 — 영유아 건강',
    url: 'https://www.childcare.go.kr/',
  },
}

// ─────────────────────────────────────────────
// 1) 단계별 가이드 (관례 4단계)
// ─────────────────────────────────────────────
export const WEANING_STAGES = [
  {
    id: 'early',
    label: '초기',
    icon: '🥄',
    color: '#5E9E8A',
    monthRange: '만 4~6개월',
    dayStart: 120, dayEnd: 210, // 하이라이트용(대략)
    texture: '미음 → 묽은 죽 (10배죽). 입자 없이 곱게 갈거나 체에 거른 형태',
    riceRatio: '10배죽 (쌀:물 = 1:10)',
    times: '하루 1회',
    amount: '1~2큰술(10~30g)에서 시작 → 50~80g까지 서서히 증가',
    milkFeeds: '수유 4~5회 병행(수유가 주, 이유식은 연습)',
    firstFoods: '쌀미음으로 시작 → 적응 후 소고기·채소(애호박·단호박·청경채)·과일(사과·배)',
    keyPoints: [
      '오전(10~11시)에 한 숟갈씩, 새 재료는 한 번에 하나만',
      '철분 보충이 중요 — 시작 2~3주 후 소고기(쇠고기)미음 도입 권장(모유수유아 특히)',
      '먹는 양보다 "삼키고 숟가락에 적응"하는 연습이 목표',
      '알레르기 관찰을 위해 새 재료는 3일(자료에 따라 3~7일) 간격',
    ],
    cautions: '뱉거나 거부해도 정상 — 강요 금지. 소금·설탕 무첨가.',
    sources: ['KDCA', 'WHO'],
  },
  {
    id: 'mid',
    label: '중기',
    icon: '🍲',
    color: '#C8924A',
    monthRange: '만 7~9개월',
    dayStart: 210, dayEnd: 300,
    texture: '으깬 죽 (7배죽 → 5배죽). 0.3cm 안팎 잘게 다진 입자가 섞임',
    riceRatio: '7배죽 → 5배죽 (쌀:물 = 1:7 → 1:5)',
    times: '하루 2회',
    amount: '1회 70~100g (하루 총 140~200g 안팎)',
    milkFeeds: '수유 3~5회 병행',
    firstFoods: '닭고기·흰살생선·두부·달걀노른자·다양한 채소(브로콜리·시금치·당근)와 과일',
    keyPoints: [
      '단백질(고기·생선·두부·달걀) 본격 도입 — 5가지 식품군 다양화',
      '혀로 으깰 수 있는 정도의 질감, 덩어리를 조금씩 키움',
      '컵으로 물 마시는 연습 시작',
      '달걀: 노른자→전란 순이 관례지만, 최신 권장은 전란 조기 도입이 알레르기 예방에 유리',
    ],
    cautions: '시금치·비트 등 질산염 높은 채소는 6개월 이후 소량부터.',
    sources: ['KDCA', 'AAP'],
  },
  {
    id: 'late',
    label: '후기',
    icon: '🍚',
    color: '#D4715A',
    monthRange: '만 10~12개월',
    dayStart: 300, dayEnd: 365,
    texture: '무른 밥 / 진밥 (3배죽 → 무른밥). 0.5cm 안팎, 잇몸으로 으깨는 질감',
    riceRatio: '진밥 (쌀:물 = 1:2~3)',
    times: '하루 3회 (이유식이 주식)',
    amount: '1회 100~150g',
    milkFeeds: '수유 2~3회로 감소',
    firstFoods: '대부분의 식재료 가능 — 다양한 고기·생선·채소, 핑거푸드 적극 도입',
    keyPoints: [
      '하루 세 끼를 가족 식사 리듬에 맞춰 규칙적으로',
      '스스로 집어먹는 핑거푸드로 자기주도 식사 연습',
      '간식 1~2회 추가 가능(과일·고구마 등)',
      '여전히 무염 원칙 — 가족 음식은 간하기 전에 덜어주기',
    ],
    cautions: '포도·방울토마토는 4등분, 견과류 통째 금지(질식).',
    sources: ['KDCA', 'AAP'],
  },
  {
    id: 'complete',
    label: '완료기',
    icon: '🍽️',
    color: '#8B7EC8',
    monthRange: '만 12~18개월',
    dayStart: 365, dayEnd: 545,
    texture: '진밥 → 일반밥. 가족과 비슷한 질감(작게·부드럽게)',
    riceRatio: '일반밥 (쌀:물 = 1:1~1.2)',
    times: '하루 3회 + 간식 1~2회',
    amount: '성인 1/3~1/2 분량, 아이 식욕에 맞춰',
    milkFeeds: '생우유 하루 400~600ml(간식 개념), 돌 이후 전환 가능',
    firstFoods: '가족과 거의 같은 식단(싱겁게). 다양한 식감·맛 경험',
    keyPoints: [
      '돌 이후 생우유·꿀 섭취 가능',
      '숟가락·포크 사용, 컵으로 물 마시기 자립',
      '편식 시작 시기 — 다양한 식재료를 반복 노출',
      '간은 여전히 최소화, 어른 음식은 싱겁게',
    ],
    cautions: '여전히 질식 위험 음식(통견과·떡·사탕) 주의.',
    sources: ['KDCA', 'AAP'],
  },
]

// ─────────────────────────────────────────────
// 2) 식재료 도입 시기 (검색용 핵심 데이터)
//    stage: early/mid/late/complete/after1y
// ─────────────────────────────────────────────
export const INGREDIENTS = [
  // 곡류
  { name: '쌀',          aliases: ['쌀미음', '백미'], cat: '곡류', stage: 'early', allergen: false, note: '가장 첫 식재료. 알레르기 거의 없음' },
  { name: '찹쌀',        aliases: [], cat: '곡류', stage: 'early', allergen: false, note: '쌀 적응 후' },
  { name: '오트밀(귀리)', aliases: ['귀리'], cat: '곡류', stage: 'early', allergen: false, note: '초기 후반~중기, 곱게 갈아서' },
  { name: '보리',        aliases: [], cat: '곡류', stage: 'mid', allergen: false, note: '글루텐 소량 함유' },
  { name: '밀(글루텐)',  aliases: ['밀가루', '국수'], cat: '곡류', stage: 'mid', allergen: true, note: '알레르기 유발 8대 식품. 6개월 이후 소량 도입 권장' },

  // 채소
  { name: '애호박',      aliases: ['호박'], cat: '채소', stage: 'early', allergen: false, note: '초기 채소로 무난, 익혀서 곱게' },
  { name: '단호박',      aliases: [], cat: '채소', stage: 'early', allergen: false, note: '단맛이 좋아 거부 적음' },
  { name: '감자',        aliases: [], cat: '채소', stage: 'early', allergen: false, note: '으깨서 부드럽게' },
  { name: '고구마',      aliases: [], cat: '채소', stage: 'early', allergen: false, note: '변비 주의해 수분과 함께' },
  { name: '청경채',      aliases: [], cat: '채소', stage: 'early', allergen: false, note: '부드러운 잎채소' },
  { name: '브로콜리',    aliases: [], cat: '채소', stage: 'early', allergen: false, note: '꽃 부분 데쳐서, 초기~중기' },
  { name: '당근',        aliases: [], cat: '채소', stage: 'early', allergen: false, note: '반드시 익혀서. 생당근은 질식 위험' },
  { name: '오이',        aliases: [], cat: '채소', stage: 'early', allergen: false, note: '초기엔 익혀서, 후기 핑거푸드로' },
  { name: '양배추',      aliases: [], cat: '채소', stage: 'mid', allergen: false, note: '데쳐서, 가스 유발 가능' },
  { name: '시금치',      aliases: [], cat: '채소', stage: 'mid', allergen: false, note: '질산염 — 6개월 이후 소량부터' },
  { name: '비트',        aliases: [], cat: '채소', stage: 'mid', allergen: false, note: '질산염 — 6개월 이후 소량' },
  { name: '토마토',      aliases: ['방울토마토'], cat: '채소', stage: 'mid', allergen: false, note: '산도 높음. 방울토마토는 4등분(질식)' },

  // 과일
  { name: '사과',        aliases: [], cat: '과일', stage: 'early', allergen: false, note: '익혀서 퓨레로, 초기 무난' },
  { name: '배',          aliases: [], cat: '과일', stage: 'early', allergen: false, note: '소화·변비에 도움' },
  { name: '바나나',      aliases: [], cat: '과일', stage: 'early', allergen: false, note: '으깨서 바로, 익힐 필요 없음' },
  { name: '아보카도',    aliases: [], cat: '과일', stage: 'early', allergen: false, note: '좋은 지방, 으깨서' },
  { name: '자두(푸룬)',  aliases: ['푸룬'], cat: '과일', stage: 'early', allergen: false, note: '변비에 도움' },
  { name: '딸기',        aliases: [], cat: '과일', stage: 'mid', allergen: true, note: '알레르기 가능, 중기~후기' },
  { name: '키위',        aliases: [], cat: '과일', stage: 'late', allergen: true, note: '산도·알레르기 가능, 후기' },
  { name: '감귤·오렌지', aliases: ['오렌지', '귤'], cat: '과일', stage: 'mid', allergen: false, note: '산도 높음, 소량부터' },
  { name: '포도',        aliases: [], cat: '과일', stage: 'late', allergen: false, note: '질식 위험 — 껍질 벗겨 4등분' },
  { name: '망고',        aliases: [], cat: '과일', stage: 'mid', allergen: false, note: '잘 익은 것 으깨서' },

  // 단백질
  { name: '소고기',      aliases: ['쇠고기', '소고기미음'], cat: '단백질', stage: 'early', allergen: false, note: '철분 최고 공급원. 초기(시작 2~3주 후)부터 권장' },
  { name: '닭고기',      aliases: ['닭가슴살'], cat: '단백질', stage: 'mid', allergen: false, note: '지방 적은 가슴살·안심부터' },
  { name: '흰살생선',    aliases: ['대구', '광어', '도미'], cat: '단백질', stage: 'mid', allergen: true, note: '알레르기 가능. 가시 제거 철저' },
  { name: '연어',        aliases: [], cat: '단백질', stage: 'mid', allergen: true, note: '중기~후기, 오메가3' },
  { name: '두부',        aliases: ['콩'], cat: '단백질', stage: 'mid', allergen: true, note: '대두 알레르기 가능, 부드러워 좋음' },
  { name: '달걀노른자',  aliases: ['계란노른자'], cat: '단백질', stage: 'mid', allergen: true, note: '익힌 노른자부터' },
  { name: '달걀전란',    aliases: ['계란', '달걀흰자'], cat: '단백질', stage: 'mid', allergen: true, note: '관례는 후기지만, 최신 권장은 6개월경 조기 도입이 알레르기 예방에 유리' },
  { name: '땅콩',        aliases: ['땅콩버터'], cat: '단백질', stage: 'mid', allergen: true, note: '통땅콩 금지(질식). 묽은 땅콩버터로 6개월경 조기 도입 권장(LEAP 연구)' },
  { name: '새우·갑각류', aliases: ['새우', '게', '갑각류'], cat: '단백질', stage: 'after1y', allergen: true, note: '알레르기 강함, 돌 무렵 이후' },

  // 유제품
  { name: '플레인 요구르트', aliases: ['요거트'], cat: '유제품', stage: 'mid', allergen: true, note: '무가당. 조리·소량은 중기 가능' },
  { name: '치즈',        aliases: ['아기치즈'], cat: '유제품', stage: 'mid', allergen: true, note: '저염 아기치즈 소량' },
  { name: '생우유(음용)', aliases: ['우유'], cat: '유제품', stage: 'after1y', allergen: true, note: '돌 이후 음용. 그 전 조리용 소량은 가능' },
]

export const INGREDIENT_STAGE_LABEL = {
  early: { label: '초기 (4~6개월)', color: '#5E9E8A' },
  mid: { label: '중기 (7~9개월)', color: '#C8924A' },
  late: { label: '후기 (10~12개월)', color: '#D4715A' },
  complete: { label: '완료기 (12~18개월)', color: '#8B7EC8' },
  after1y: { label: '돌 이후', color: '#5B8DB8' },
}

export const INGREDIENT_CATEGORIES = ['전체', '곡류', '채소', '과일', '단백질', '유제품']

// ─────────────────────────────────────────────
// 3) 알레르기 가이드
// ─────────────────────────────────────────────
export const ALLERGY_GUIDE = {
  rule: {
    title: '3일 규칙 (한 번에 하나씩)',
    points: [
      '새 식재료는 한 번에 하나만, 3일(자료에 따라 3~7일) 연속 관찰',
      '오전에 먹여 반응을 낮 동안 관찰 — 두드러기·구토·설사·호흡곤란 체크',
      '이상 없으면 안전 식재료로 등록하고 다음 재료로',
      '반응이 나타나면 즉시 중단하고 소아과 상담',
    ],
  },
  earlyIntro: {
    title: '알레르기 식품 "조기 도입"이 최신 권장',
    body: '과거엔 알레르기 우려로 늦게 시작했지만, 최신 지침은 이유식을 시작하는 만 4~6개월에 알레르기 유발 식품도 (한 번에 하나씩) 도입하는 것이 오히려 알레르기 예방에 유리하다고 본다. 땅콩(LEAP 연구)·달걀이 대표 사례.',
    sources: ['KDCA', 'AAP'],
  },
  // 8대(국내 표시대상은 더 많지만 영아 흔한 것 중심)
  majorAllergens: [
    { name: '달걀', emoji: '🥚', note: '익힌 노른자→전란. 6개월경 조기 도입 권장' },
    { name: '우유', emoji: '🥛', note: '조리용 소량은 중기, 음용은 돌 이후' },
    { name: '밀(글루텐)', emoji: '🌾', note: '6개월 이후 소량 도입' },
    { name: '대두(콩·두부)', emoji: '🫘', note: '두부로 부드럽게 도입' },
    { name: '땅콩', emoji: '🥜', note: '통땅콩 금지, 묽은 땅콩버터로 조기 도입' },
    { name: '견과류', emoji: '🌰', note: '통째 금지(질식), 갈아서' },
    { name: '생선', emoji: '🐟', note: '흰살생선부터, 가시 제거' },
    { name: '갑각류', emoji: '🦐', note: '돌 무렵 이후' },
  ],
  source: 'MFDS',
}

// ─────────────────────────────────────────────
// 4) 돌 전 피해야 할 음식
// ─────────────────────────────────────────────
export const AVOID_FOODS = [
  { name: '꿀', emoji: '🍯', reason: '보툴리누스균 아포 — 돌 전 영아 보툴리눔증 위험. 끓여도 사라지지 않음', until: '만 12개월 이전 금지', danger: 'high' },
  { name: '생우유(음용)', emoji: '🥛', reason: '단백질·미네랄이 신장에 부담, 설사·장출혈 가능', until: '돌 이후 음용', danger: 'high' },
  { name: '소금·간', emoji: '🧂', reason: '신장·혈압 부담. 모유/분유의 나트륨으로 충분', until: '돌 전 무염 원칙', danger: 'mid' },
  { name: '설탕·단 음료', emoji: '🍬', reason: '충치·비만, 영양가 없음. 주스·가당 요구르트 포함', until: '최대한 늦게·적게', danger: 'mid' },
  { name: '질식 위험 음식', emoji: '⚠️', reason: '통견과·포도알·방울토마토·생당근·떡·사탕·소시지 — 동그랗고 미끄럽거나 단단', until: '잘게·길게 자르거나 익혀서', danger: 'high' },
  { name: '커피·차', emoji: '☕', reason: '카페인, 철분 흡수 방해', until: '영아기 금지', danger: 'mid' },
]

// ─────────────────────────────────────────────
// 5) 자기주도 이유식 (BLW)
// ─────────────────────────────────────────────
export const BLW_GUIDE = {
  intro: 'Baby-Led Weaning. 퓨레 단계를 건너뛰고 처음부터 아기가 손으로 음식을 집어 스스로 먹게 하는 방식. 전통 죽 이유식과 병행도 가능.',
  startConditions: [
    '만 6개월 이상',
    '지지 없이 혼자 앉을 수 있음',
    '목·고개를 안정적으로 가눔',
    '물건을 잡아 입으로 가져감',
  ],
  fingerFood: [
    '성인 손가락 크기의 긴 스틱 형태(잡기 쉬움)',
    '익혀서 잇몸으로 으깨질 만큼 부드럽게',
    '10개월 이후 집게잡기 되면 작은 조각도 OK',
  ],
  gagVsChoke: {
    gag: '헛구역질(개그 리플렉스): "우웩" 소리·기침·얼굴 빨개짐 — 음식이 기도로 가는 걸 막는 정상 학습 반응. 개입하지 말고 지켜보기',
    choke: '질식: 소리 없음·기침 못함·얼굴이 파래짐 — 즉시 응급처치(영아 등 두드리기/가슴 압박) 필요',
  },
  safety: [
    '반드시 수직으로 곧게 앉혀서 — 뒤로 기대 먹이지 않기',
    '먹는 동안 절대 자리를 비우지 않기',
    '동그란 것(포도·방울토마토)은 반드시 4등분',
    '소금·설탕·꿀 무첨가는 동일',
    '영아 심폐소생술(CPR)·하임리히 미리 익혀두기',
  ],
  note: '연구상 BLW와 전통 숟가락 이유식 간 질식 빈도에 유의미한 차이는 없는 것으로 보고됨.',
  sources: ['KDCA', 'AAP'],
}

// ─────────────────────────────────────────────
// 6) 준비물 / 용품 (단계별) — 쇼핑 검색 링크 포함
// ─────────────────────────────────────────────
const coupang = (q) => `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}`
const kurly = (q) => `https://www.kurly.com/search?sword=${encodeURIComponent(q)}`
const naverShop = (q) => `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(q)}`

export const TOOLS = [
  { name: '이유식 마스터기', when: '초기~', essential: true, desc: '찜+갈기 일체형. 소량 조리에 편리(베이비브레짜 등)', search: coupang('이유식 마스터기') },
  { name: '실리콘 큐브(밀폐)', when: '초기~', essential: true, desc: '소분 냉동 보관. 밀폐형이면 빼지 않고 그대로 보관', search: coupang('이유식 실리콘 큐브 밀폐') },
  { name: '이유식 스푼(실리콘)', when: '초기~', essential: true, desc: '잇몸에 부드러운 실리콘 헤드', search: coupang('이유식 실리콘 스푼') },
  { name: '핸드블렌더/다지기', when: '초기~중기', essential: true, desc: '퓨레·다지기용. 마스터기 없으면 필수', search: coupang('핸드블렌더 이유식 다지기') },
  { name: '실리콘 빕(턱받이)', when: '초기~', essential: true, desc: '음식받이 포켓형이 청소 편함', search: coupang('실리콘 턱받이 음식받이') },
  { name: '이유식 용기(유리)', when: '중기~', essential: false, desc: '냄새·색 안 배는 유리. 전자레인지 가능', search: coupang('이유식 유리 보관용기') },
  { name: '아기 식판/흡착볼', when: '중기~', essential: false, desc: '바닥에 흡착돼 잘 안 엎어짐', search: coupang('아기 흡착 식판') },
  { name: '하이체어(이유식 의자)', when: '중기~', essential: true, desc: '곧게 앉혀 먹이기 — 안전·자세 핵심', search: coupang('하이체어 이유식 의자') },
  { name: '실리콘 찜기/찜망', when: '초기~', essential: false, desc: '재료 찌기. 냄비+찜망으로 대체 가능', search: coupang('실리콘 찜기 이유식') },
  { name: '미니 저울', when: '초기~', essential: false, desc: '1g 단위 계량. 양 가늠에 도움', search: coupang('주방 저울 1g') },
]

// ─────────────────────────────────────────────
// 7) 구매처 (재료·시판 이유식)
// ─────────────────────────────────────────────
export const STORES = {
  ingredients: [
    { name: '쿠팡 (이유식 용품)', desc: '용품·재료 빠른배송, 가격 비교', url: 'https://www.coupang.com/np/categories/445895' },
    { name: '마켓컬리', desc: '유기농 인증 베이비 채소·재료 새벽배송', url: kurly('이유식 재료') },
    { name: '초록마을', desc: '친환경·유기농 먹거리 전문', url: 'https://www.choroc.com/' },
    { name: '한살림', desc: '생협 — 꼬마와땅 이유식 재료(조합원 가입 필요)', url: 'https://shop.hansalim.or.kr/' },
    { name: '네이버쇼핑(가격비교)', desc: '재료·용품 최저가 비교', url: naverShop('이유식 재료 세트') },
  ],
  ready: [
    // 시판 이유식 브랜드 (2025 선호도 조사 상위 — 출처: 브랜드 조사 기사)
    { name: '베베쿡', desc: '시판 이유식 1위(2025). 단계별·무첨가', url: naverShop('베베쿡 이유식') },
    { name: '루솔', desc: '합리적 가격·신선재료(2025 상위권)', url: naverShop('루솔 이유식') },
    { name: '엘빈즈', desc: '국내산·부드러운 질감, 프리미엄', url: naverShop('엘빈즈 이유식') },
    { name: '푸드케어(베이비본죽)', desc: '유리병·맞춤배송', url: naverShop('푸드케어 베이비본죽 이유식') },
    { name: '시판 이유식 랭킹 비교', desc: '브랜드별 실시간 순위', url: 'https://mom-mom.net/rankings/%EC%8B%9C%ED%8C%90%20%EC%9D%B4%EC%9C%A0%EC%8B%9D' },
  ],
}

// ─────────────────────────────────────────────
// 8) 추천 유튜브
// ─────────────────────────────────────────────
export const YOUTUBE = [
  { name: '하정훈의 삐뽀삐뽀119 소아과', desc: '소아과 전문의 — 이유식 원칙·먹여도 되는 음식', url: 'https://www.youtube.com/channel/UC6t0ees15Lp0gyrLrAyLeJQ', type: '전문의' },
  { name: '이유식레스토랑', desc: '단계별 레시피·식재료 정보', url: 'https://www.youtube.com/channel/UCYkZXqRUbsAdPAszMUDPslw', type: '레시피' },
  { name: '꾸잉레시피', desc: '집밥 스타일 이유식 레시피', url: 'https://www.youtube.com/channel/UCFO-VuvgSQx8oMRr4fcjA3Q', type: '레시피' },
  { name: '아빠의큐브공장', desc: '큐브 만들기·소분 보관 노하우', url: 'https://www.youtube.com/channel/UCcE5jVHSYduhcDjvt8ybE8A', type: '실전' },
  { name: '초기 이유식 시작 검색', desc: '내 아이 시기에 맞는 영상 검색', url: 'https://www.youtube.com/results?search_query=초기+이유식+시작+쌀미음', type: '검색' },
  { name: 'BLW 자기주도 이유식 검색', desc: '핑거푸드·BLW 실전 영상', url: 'https://www.youtube.com/results?search_query=자기주도+이유식+BLW+핑거푸드', type: '검색' },
]

// ─────────────────────────────────────────────
// 9) 참고 사이트 / 레시피
// ─────────────────────────────────────────────
export const REFERENCE_SITES = [
  { name: '질병관리청 국가건강정보포털 — 이유식', desc: '공식 가이드(시기·양·철분·알레르기)', url: WEANING_SOURCES.KDCA.url, tag: '공식' },
  { name: '식품안전나라(식약처)', desc: '식품 안전·알레르기 표시 정보', url: WEANING_SOURCES.MFDS.url, tag: '공식' },
  { name: '아이사랑 보육포털', desc: '영유아 건강·발달·이유식', url: WEANING_SOURCES.CHILDCARE.url, tag: '공식' },
  { name: 'AAP HealthyChildren', desc: '미국 소아과학회 영문 가이드', url: WEANING_SOURCES.AAP.url, tag: '해외' },
  { name: '만개의레시피 — 이유식', desc: '단계별 이유식 레시피 검색', url: 'https://www.10000recipe.com/recipe/list.html?q=이유식', tag: '레시피' },
  { name: 'Nibli 이유식 레시피', desc: '초기·BLW 레시피 200+', url: 'https://www.nibli.org/ko/recipes', tag: '레시피' },
]

// 현재 일수 기준 단계 인덱스
export function getStageIndexByDays(totalDays) {
  for (let i = WEANING_STAGES.length - 1; i >= 0; i--) {
    if (totalDays >= WEANING_STAGES[i].dayStart) return i
  }
  return 0
}
