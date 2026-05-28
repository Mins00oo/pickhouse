// pickhouse — data
// Two collections:
//   HOUSES        — 10 candidates currently being viewed/considered
//   LIVED_HOMES   — places the user has actually lived in (with dates)
// No categorical status flags. Per-stat ratings (1..5) only.

const HOUSES = [
  { id: 'h01', nick: '망원 빌라',  addr: '서울 마포구 망원동 412-7', line: '6호선 망원역 도보 7분',
    deal: '전세',  deposit: 25000, rent: 0,
    area: 18, areaM: 59, floor: 3, totalFloor: 4,
    type: '빌라', facing: '남향', yearBuilt: 2019,
    stats: { sun: 5, water: 4, noise: 3, view: 3, kitchen: 4, bath: 4, vent: 4, insul: 3 },
    has: { elev: false, fridge: true, ac: true, washer: true, gas: true, parking: true, pet: true, builtinCloset: true },
    visited: '2026-05-12 14:30', visitedShort: '5/12',
    note: '거실 햇빛 진짜 좋음. 부엌 좁은게 살짝 걸림',
    swatch: '#E8B86C', swatch2: '#C97E3D', photos: 12 },
  { id: 'h02', nick: '합정 오피',  addr: '서울 마포구 합정동 396-12', line: '2호선 합정역 도보 3분',
    deal: '월세', deposit: 1000, rent: 85,
    area: 12, areaM: 40, floor: 12, totalFloor: 15,
    type: '오피스텔', facing: '동향', yearBuilt: 2022,
    stats: { sun: 3, water: 5, noise: 5, view: 5, kitchen: 5, bath: 5, vent: 4, insul: 5 },
    has: { elev: true, fridge: true, ac: true, washer: true, gas: false, parking: true, pet: false, builtinCloset: true },
    visited: '2026-05-12 16:00', visitedShort: '5/12',
    note: '뷰 미쳤음. 근데 좁고 가스 없는게 마음에 안듦',
    swatch: '#7BA7C9', swatch2: '#3D6890', photos: 8 },
  { id: 'h03', nick: '연남 투룸',  addr: '서울 마포구 연남동 240-31', line: '경의중앙선 가좌역 도보 9분',
    deal: '월세', deposit: 2000, rent: 75,
    area: 15, areaM: 49, floor: 2, totalFloor: 5,
    type: '빌라', facing: '남서향', yearBuilt: 2017,
    stats: { sun: 4, water: 3, noise: 2, view: 2, kitchen: 3, bath: 3, vent: 3, insul: 3 },
    has: { elev: false, fridge: true, ac: false, washer: true, gas: true, parking: false, pet: true, builtinCloset: false },
    visited: '2026-05-13 11:00', visitedShort: '5/13',
    note: '동네 좋은데 도로 소음 좀',
    swatch: '#C4D9A8', swatch2: '#7A9C5C', photos: 6 },
  { id: 'h04', nick: '상수 신축',  addr: '서울 마포구 상수동 72-3', line: '6호선 상수역 도보 5분',
    deal: '반전세', deposit: 5000, rent: 55,
    area: 14, areaM: 46, floor: 5, totalFloor: 8,
    type: '오피스텔', facing: '남향', yearBuilt: 2024,
    stats: { sun: 5, water: 5, noise: 4, view: 4, kitchen: 5, bath: 5, vent: 5, insul: 5 },
    has: { elev: true, fridge: true, ac: true, washer: true, gas: true, parking: true, pet: false, builtinCloset: true },
    visited: '2026-05-14 10:30', visitedShort: '5/14',
    note: '거의 풀옵션. 신축이라 다 깨끗. 1순위!!',
    swatch: '#E8DCC4', swatch2: '#A88E5C', photos: 18 },
  { id: 'h05', nick: '서교 옥탑',  addr: '서울 마포구 서교동 363-9', line: '2호선 홍대입구역 도보 12분',
    deal: '월세', deposit: 500, rent: 55,
    area: 11, areaM: 36, floor: '옥탑', totalFloor: 4,
    type: '빌라', facing: '남향', yearBuilt: 2010,
    stats: { sun: 5, water: 2, noise: 4, view: 5, kitchen: 2, bath: 2, vent: 5, insul: 1 },
    has: { elev: false, fridge: false, ac: false, washer: false, gas: true, parking: false, pet: true, builtinCloset: false },
    visited: '2026-05-14 15:00', visitedShort: '5/14',
    note: '옥상 진짜 좋은데... 여름 더위 ㄷㄷ 단열 0',
    swatch: '#D4A5A5', swatch2: '#A85C5C', photos: 9 },
  { id: 'h06', nick: '망원 1.5룸', addr: '서울 마포구 망원동 480-2', line: '6호선 망원역 도보 11분',
    deal: '월세', deposit: 1500, rent: 70,
    area: 13, areaM: 43, floor: 4, totalFloor: 6,
    type: '오피스텔', facing: '북향', yearBuilt: 2020,
    stats: { sun: 1, water: 4, noise: 4, view: 3, kitchen: 4, bath: 4, vent: 3, insul: 4 },
    has: { elev: true, fridge: true, ac: true, washer: true, gas: false, parking: true, pet: false, builtinCloset: true },
    visited: '2026-05-15 13:00', visitedShort: '5/15',
    note: '북향 답 없음. 낮인데 어두움',
    swatch: '#9DA6B5', swatch2: '#5C6878', photos: 7 },
  { id: 'h07', nick: '연희 단독',  addr: '서울 서대문구 연희동 188-44', line: '경의중앙선 가좌역 도보 13분',
    deal: '전세', deposit: 22000, rent: 0,
    area: 20, areaM: 66, floor: 1, totalFloor: 2,
    type: '단독', facing: '남동향', yearBuilt: 2008,
    stats: { sun: 4, water: 3, noise: 4, view: 3, kitchen: 3, bath: 3, vent: 4, insul: 3 },
    has: { elev: false, fridge: false, ac: true, washer: false, gas: true, parking: true, pet: true, builtinCloset: false },
    visited: '2026-05-15 16:30', visitedShort: '5/15',
    note: '마당 있음. 옵션은 거의 없음',
    swatch: '#B5A89C', swatch2: '#8A6E5C', photos: 11 },
  { id: 'h08', nick: '합정 미니',  addr: '서울 마포구 합정동 414-8', line: '2호선 합정역 도보 6분',
    deal: '월세', deposit: 500, rent: 60,
    area: 8, areaM: 26, floor: 3, totalFloor: 5,
    type: '오피스텔', facing: '서향', yearBuilt: 2018,
    stats: { sun: 3, water: 4, noise: 4, view: 3, kitchen: 4, bath: 4, vent: 3, insul: 4 },
    has: { elev: true, fridge: true, ac: true, washer: true, gas: false, parking: false, pet: false, builtinCloset: true },
    visited: '2026-05-16 11:30', visitedShort: '5/16',
    note: '너무 좁아... 8평은 무리',
    swatch: '#D4C9A5', swatch2: '#A89D7A', photos: 5 },
  { id: 'h09', nick: '망원 신축',  addr: '서울 마포구 망원동 200-15', line: '6호선 망원역 도보 4분',
    deal: '반전세', deposit: 8000, rent: 40,
    area: 16, areaM: 53, floor: 6, totalFloor: 7,
    type: '오피스텔', facing: '남향', yearBuilt: 2025,
    stats: { sun: 5, water: 5, noise: 4, view: 5, kitchen: 5, bath: 5, vent: 5, insul: 5 },
    has: { elev: true, fridge: true, ac: true, washer: true, gas: true, parking: true, pet: true, builtinCloset: true },
    visited: '2026-05-16 14:00', visitedShort: '5/16',
    note: '비싸지만 진짜 좋다. 상수랑 고민',
    swatch: '#A8C4B8', swatch2: '#5C8A78', photos: 22 },
  { id: 'h10', nick: '아현 빌라',  addr: '서울 마포구 아현동 615-22', line: '2호선 아현역 도보 8분',
    deal: '전세', deposit: 19000, rent: 0,
    area: 14, areaM: 46, floor: 2, totalFloor: 4,
    type: '빌라', facing: '남향', yearBuilt: 2015,
    stats: { sun: 4, water: 4, noise: 3, view: 2, kitchen: 3, bath: 3, vent: 3, insul: 4 },
    has: { elev: false, fridge: true, ac: true, washer: true, gas: true, parking: false, pet: true, builtinCloset: false },
    visited: '2026-05-17 13:00', visitedShort: '5/17',
    note: '가성비 괜찮. 주차 없는게 아쉬움',
    swatch: '#C9A87B', swatch2: '#8A6E3D', photos: 10 },
];

// Places the user has actually lived. Oldest → newest. No "current" entry —
// the user is between homes (which is why pickhouse is being used now).
const LIVED_HOMES = [
  { id: 'L01', nick: '신촌 자취방',  addr: '서대문구 창천동',
    from: '2018-03', to: '2019-08', months: 17,
    type: '원룸', area: 7,  deal: '월세', deposit: 500, rent: 45,
    memory: '첫 자취. 5평 원룸이었지만 다 가능했다.',
    swatch: '#D8C9A8', swatch2: '#A8956C' },
  { id: 'L02', nick: '망원 옥탑',   addr: '마포구 망원동',
    from: '2019-09', to: '2021-12', months: 28,
    type: '빌라(옥탑)', area: 10, deal: '월세', deposit: 1000, rent: 55,
    memory: '여름엔 더웠지만 옥상에서 본 한강 노을은 평생 기억.',
    swatch: '#E8B58C', swatch2: '#B57850' },
  { id: 'L03', nick: '합정 오피스텔', addr: '마포구 합정동',
    from: '2022-01', to: '2024-02', months: 26,
    type: '오피스텔', area: 12, deal: '월세', deposit: 2000, rent: 80,
    memory: '한강뷰. 출퇴근 편했고 친구들 많이 놀러왔다.',
    swatch: '#A8C4D8', swatch2: '#5C7896' },
  { id: 'L04', nick: '연남 투룸',   addr: '마포구 연남동',
    from: '2024-03', to: '2026-04', months: 26,
    type: '빌라', area: 14, deal: '전세', deposit: 18000, rent: 0,
    memory: '동네가 너무 좋아서 떠나기 싫었던 곳.',
    swatch: '#C8D8A8', swatch2: '#789660' },
];

// ── Formatters ──────────────────────────────────────────────────────────
function fmtMoney(deal, dep, rent) {
  if (deal === '전세') {
    const eok = Math.floor(dep / 10000);
    const man = dep % 10000;
    return man ? `${eok}억 ${man.toLocaleString()}` : `${eok}억`;
  }
  const dStr = dep >= 10000
    ? `${Math.floor(dep/10000)}억${dep%10000 ? ' ' + (dep%10000).toLocaleString() : ''}`
    : dep >= 1000
      ? `${(dep/1000).toFixed(dep%1000?1:0)}천`
      : `${dep}`;
  return `${dStr}/${rent}`;
}
function fmtMoneyFull(h) { return `${h.deal} ${fmtMoney(h.deal, h.deposit, h.rent)}`; }
function avgStat(h) {
  const v = Object.values(h.stats);
  return v.reduce((a, b) => a + b, 0) / v.length;
}
function fmtMonths(m) {
  const y = Math.floor(m / 12), r = m % 12;
  return y ? (r ? `${y}년 ${r}개월` : `${y}년`) : `${r}개월`;
}
function fmtYM(s) {
  const [y, m] = s.split('-');
  return `${y}.${m}`;
}

const STAT_LABELS = {
  sun: '햇빛', water: '수압', noise: '소음', view: '뷰',
  kitchen: '부엌', bath: '욕실', vent: '환기', insul: '단열',
};

const HAS_LABELS = {
  elev: '엘리베이터', fridge: '냉장고', ac: '에어컨', washer: '세탁기',
  gas: '가스레인지', parking: '주차', pet: '반려동물', builtinCloset: '빌트인장',
};

Object.assign(window, {
  HOUSES, LIVED_HOMES, STAT_LABELS, HAS_LABELS,
  fmtMoney, fmtMoneyFull, avgStat, fmtMonths, fmtYM,
});
