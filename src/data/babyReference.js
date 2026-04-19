/**
 * 월별 표준 육아 참조 데이터
 * 출처: AAP (American Academy of Pediatrics), WHO, 대한소아과학회, National Sleep Foundation
 */

// ── 수유 가이드 (0~24개월) ──
export const FEEDING_GUIDE = [
  { label: '0~2주',    minDays: 0,   maxDays: 14,  perMl: [60, 90],   timesPerDay: [8, 12], dailyMl: [480, 720],  notes: '요구 시 수유 (on-demand), 초유 3~5일', source: 'AAP' },
  { label: '2~4주',    minDays: 15,  maxDays: 30,  perMl: [90, 120],  timesPerDay: [7, 8],  dailyMl: [630, 960],  notes: '수유 간격 점차 규칙적으로', source: 'AAP' },
  { label: '1~2개월',  minDays: 31,  maxDays: 60,  perMl: [120, 150], timesPerDay: [6, 8],  dailyMl: [720, 900],  notes: '밤 수유 간격이 서서히 길어짐', source: 'AAP' },
  { label: '2~3개월',  minDays: 61,  maxDays: 90,  perMl: [120, 150], timesPerDay: [6, 7],  dailyMl: [750, 900],  notes: '1회 수유량 안정화', source: 'AAP' },
  { label: '3~4개월',  minDays: 91,  maxDays: 120, perMl: [150, 180], timesPerDay: [5, 6],  dailyMl: [750, 960],  notes: '수유 리듬이 확립되는 시기', source: 'AAP' },
  { label: '4~6개월',  minDays: 121, maxDays: 180, perMl: [150, 200], timesPerDay: [5, 6],  dailyMl: [750, 1000], notes: '6개월 전후 이유식 시작 준비', source: 'AAP/WHO' },
  { label: '6~9개월',  minDays: 181, maxDays: 270, perMl: [180, 240], timesPerDay: [4, 5],  dailyMl: [700, 900],  notes: '이유식 1~2회 + 수유 병행', source: 'AAP' },
  { label: '9~12개월', minDays: 271, maxDays: 365, perMl: [180, 240], timesPerDay: [3, 4],  dailyMl: [500, 700],  notes: '이유식 3회 + 수유, 컵 연습 시작', source: 'AAP' },
  { label: '12~18개월',minDays: 366, maxDays: 545, perMl: [200, 200], timesPerDay: [2, 3],  dailyMl: [400, 500],  notes: '이유식이 주식, 생우유 전환 가능', source: 'AAP' },
  { label: '18~24개월',minDays: 546, maxDays: 730, perMl: [200, 200], timesPerDay: [2, 2],  dailyMl: [300, 400],  notes: '고형식 중심, 우유는 보조', source: 'AAP' },
]

// ── 수면 가이드 (0~24개월) ──
export const SLEEP_GUIDE = [
  { label: '0~1개월',  minDays: 0,   maxDays: 30,  totalHrs: [15, 18], nightHrs: [8, 9],   naps: [4, 5], napDurMin: [30, 120], wakeWindowMin: [45, 60],  notes: '수면-각성 주기가 불규칙', source: 'AAP/NSF' },
  { label: '1~2개월',  minDays: 31,  maxDays: 60,  totalHrs: [14, 17], nightHrs: [8, 10],  naps: [4, 5], napDurMin: [30, 120], wakeWindowMin: [60, 90],  notes: '밤에 3~4시간 연속 수면 시작', source: 'AAP/NSF' },
  { label: '2~3개월',  minDays: 61,  maxDays: 90,  totalHrs: [14, 16], nightHrs: [9, 10],  naps: [3, 4], napDurMin: [30, 120], wakeWindowMin: [60, 90],  notes: '밤 4~5시간 연속 수면 가능', source: 'AAP/NSF' },
  { label: '3~4개월',  minDays: 91,  maxDays: 120, totalHrs: [14, 16], nightHrs: [10, 11], naps: [3, 4], napDurMin: [60, 120], wakeWindowMin: [90, 120], notes: '수면 교육 시작 가능, 밤 6~8시간 연속', source: 'AAP/NSF' },
  { label: '4~6개월',  minDays: 121, maxDays: 180, totalHrs: [12, 16], nightHrs: [10, 11], naps: [2, 3], napDurMin: [60, 120], wakeWindowMin: [90, 150], notes: '낮잠 패턴 안정화, 수면 퇴행 가능', source: 'AAP/NSF' },
  { label: '6~9개월',  minDays: 181, maxDays: 270, totalHrs: [12, 15], nightHrs: [10, 11], naps: [2, 2], napDurMin: [60, 120], wakeWindowMin: [120, 180], notes: '낮잠 2회 안정, 분리불안 시작', source: 'AAP/NSF' },
  { label: '9~12개월', minDays: 271, maxDays: 365, totalHrs: [12, 15], nightHrs: [10, 12], naps: [1, 2], napDurMin: [60, 120], wakeWindowMin: [150, 210], notes: '낮잠 1~2회, 통잠 가능', source: 'AAP/NSF' },
  { label: '12~18개월',minDays: 366, maxDays: 545, totalHrs: [12, 14], nightHrs: [10, 12], naps: [1, 2], napDurMin: [90, 180], wakeWindowMin: [180, 240], notes: '낮잠 2→1회 전환기', source: 'AAP/NSF' },
  { label: '18~24개월',minDays: 546, maxDays: 730, totalHrs: [11, 14], nightHrs: [10, 12], naps: [1, 1], napDurMin: [90, 150], wakeWindowMin: [240, 360], notes: '낮잠 1회 안정', source: 'AAP/NSF' },
]

// ── 발달 마일스톤 상세 (0~24개월) ──
export const MILESTONES_DETAIL = [
  {
    label: '1개월', minDays: 0, maxDays: 60,
    grossMotor: ['엎드렸을 때 잠깐 고개 들기', '팔다리를 대칭으로 움직임'],
    fineMotor: ['손을 꽉 쥐고 있음 (파악반사)', '물건이 손에 닿으면 움켜쥠'],
    language: ['큰 소리에 반응 (놀람)', '엄마 목소리 인식'],
    social: ['얼굴 응시', '첫 사회적 미소 시작'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '2개월', minDays: 31, maxDays: 90,
    grossMotor: ['엎드려서 45도 이상 고개 들기', '팔다리 활발한 움직임'],
    fineMotor: ['손을 열었다 닫기 시작', '딸랑이를 잠깐 잡기'],
    language: ['쿠잉 (아~, 우~ 소리)', '소리 나는 방향으로 고개 돌림'],
    social: ['사회적 미소 활발', '눈 맞춤 시간 증가'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '3개월', minDays: 61, maxDays: 120,
    grossMotor: ['엎드려서 팔꿈치로 지탱하며 고개 들기', '목 가누기 안정화'],
    fineMotor: ['손을 바라보며 탐색', '물건 잡으려는 시도'],
    language: ['옹알이 시작 (까르르)', '소리 내어 웃음'],
    social: ['표정으로 기분 표현', '자발적으로 미소'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '4개월', minDays: 91, maxDays: 150,
    grossMotor: ['뒤집기 시도 (앞→뒤)', '엎드려서 90도 이상 고개 들기'],
    fineMotor: ['물건 잡아서 입에 넣기', '양손으로 잡기'],
    language: ['다양한 옹알이 (바, 가, 다)', '이름에 반응 시작'],
    social: ['거울 속 자기 모습에 반응', '소리 내어 크게 웃음'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '5개월', minDays: 121, maxDays: 180,
    grossMotor: ['뒤집기 완성 (앞뒤 모두)', '앉히면 잠깐 지탱'],
    fineMotor: ['두 손으로 물건 번갈아 잡기', '발가락 잡아당기기'],
    language: ['다양한 소리 모방 시도', '감정에 따라 다른 울음'],
    social: ['낯가림 시작 가능', '부모에게 팔 벌리기'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '6~8개월', minDays: 181, maxDays: 270,
    grossMotor: ['도움받아 앉기 → 혼자 앉기', '배밀이·기기 준비'],
    fineMotor: ['물건 손 간 이동', '엄지-검지 집기 시도'],
    language: ['반복 옹알이 (마마, 바바)', '이름에 반응'],
    social: ['낯가림 본격화', '친숙한 얼굴 인식'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '9~12개월', minDays: 271, maxDays: 365,
    grossMotor: ['기기 시작', '잡고 서기 → 첫 걸음 시도'],
    fineMotor: ['엄지-검지 집기 완성', '물건 놓기/던지기'],
    language: ['"엄마/아빠" 의미 있게 말하기', '"안돼" 이해'],
    social: ['손 흔들어 인사', '간단한 지시 따르기'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '12~18개월', minDays: 366, maxDays: 545,
    grossMotor: ['혼자 걷기', '쪼그려 앉았다 일어서기'],
    fineMotor: ['블록 2~3개 쌓기', '숟가락 사용 시도'],
    language: ['3~10개 단어', '간단한 지시 이해'],
    social: ['가작놀이 시작', '부모에게 물건 보여주기'],
    source: 'CDC/AAP 2022',
  },
  {
    label: '18~24개월', minDays: 546, maxDays: 730,
    grossMotor: ['뛰기 시작', '계단 오르내리기 (손잡이)'],
    fineMotor: ['블록 6개 이상 쌓기', '책 넘기기'],
    language: ['50개 이상 단어', '2단어 조합 ("엄마 물")'],
    social: ['또래 옆에서 놀기', '거부 표현 ("싫어")'],
    source: 'CDC/AAP 2022',
  },
]

// ── 이유식 가이드 ──
export const SOLID_FOOD_GUIDE = [
  { label: '6개월',     minDays: 150, maxDays: 210, foods: '쌀미음 (10배죽)', frequency: '1회/일', amount: '1~2큰술', notes: 'WHO 권장: 만 6개월 시작. 알레르기 관찰 3일 규칙', source: 'WHO/AAP' },
  { label: '7~8개월',   minDays: 210, maxDays: 270, foods: '채소·과일 퓨레, 두부, 고기 퓨레', frequency: '2~3회/일', amount: '2~4큰술', notes: '새 식재료는 3일 간격으로', source: 'WHO/AAP' },
  { label: '9~10개월',  minDays: 270, maxDays: 330, foods: '부드러운 핑거푸드, 잘게 다진 음식', frequency: '3회/일', amount: '4~6큰술', notes: '스스로 잡아먹는 연습', source: 'WHO/AAP' },
  { label: '11~12개월', minDays: 330, maxDays: 365, foods: '가족 식사 (부드럽게, 작게 자름)', frequency: '3회 + 간식', amount: '점차 증가', notes: '돌 이후 생우유 전환 가능', source: 'WHO/AAP' },
]

// 현재 개월수에 맞는 가이드 찾기
export function getGuideForAge(guides, totalDays) {
  for (let i = guides.length - 1; i >= 0; i--) {
    if (totalDays >= guides[i].minDays) return guides[i]
  }
  return guides[0]
}

// 모든 가이드 출처 정보
export const SOURCES = {
  AAP: { name: 'American Academy of Pediatrics', url: 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/How-Often-and-How-Much-Should-Your-Baby-Eat.aspx' },
  WHO: { name: 'World Health Organization', url: 'https://www.who.int/health-topics/infant-nutrition' },
  NSF: { name: 'National Sleep Foundation', url: 'https://www.sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need' },
  KPS: { name: '대한소아과학회', url: 'https://www.pediatrics.or.kr/' },
  CDC: { name: 'CDC Act Early Milestones', url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html' },
  KDCA: { name: '질병관리청 영유아 건강검진', url: 'https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuLv=1&menuCd=115' },
}
