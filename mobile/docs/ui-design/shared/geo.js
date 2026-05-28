// Geo positions for each house (approximate, Mapo-gu cluster).
// Stored in a SVG-friendly 0..1 space so the faux map can scale anywhere.
// origin: top-left = NW.  Han river runs along the bottom edge.

const GEO = {
  h01: { x: 0.22, y: 0.42 }, // 망원
  h02: { x: 0.46, y: 0.58 }, // 합정
  h03: { x: 0.32, y: 0.28 }, // 연남
  h04: { x: 0.58, y: 0.55 }, // 상수
  h05: { x: 0.50, y: 0.34 }, // 서교
  h06: { x: 0.26, y: 0.48 }, // 망원 1.5룸
  h07: { x: 0.18, y: 0.22 }, // 연희
  h08: { x: 0.48, y: 0.60 }, // 합정 미니
  h09: { x: 0.24, y: 0.44 }, // 망원 신축
  h10: { x: 0.66, y: 0.30 }, // 아현
};

// Neighborhood clusters — used to group lists meaningfully.
const NEIGHBORHOODS = [
  { id: 'mangwon',  label: '망원',  ids: ['h01','h06','h09'] },
  { id: 'hapjeong', label: '합정·상수', ids: ['h02','h04','h08'] },
  { id: 'yeonnam',  label: '연남·연희', ids: ['h03','h07'] },
  { id: 'seogyo',   label: '서교·아현', ids: ['h05','h10'] },
];

window.GEO = GEO;
window.NEIGHBORHOODS = NEIGHBORHOODS;
