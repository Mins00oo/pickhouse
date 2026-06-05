export const colors = {
  cream: '#faf6f0',
  creamDark: '#f0e9dd',
  ink: '#2a2620',
  inkSoft: '#5a544a',
  inkMuted: '#8a8278',
  accentGreen: '#7a9b76',
  accentBeige: '#c7b8a3',
  white: '#ffffff',
  border: '#e8e0d2',
  danger: '#c5523f',
  star: '#d4a84b',
  cardBg: '#ffffff',

  // ── 집 추가 위저드 / 메인 지도 목업 팔레트 (HomeMapScreen homeColors와 동일 hex) ──
  primary: '#1B7A53',
  primaryDark: '#0F5A3D',
  primarySoft: '#E8F3EC',
  coral: '#E8754A',
  amber: '#E9B949',
  red: '#D94A4A',
  green: '#3DA773',
  surface: '#FAFAF6',
  borderSoft: '#EFEDE5',
  borderHard: '#E5E2DA',
  muted: '#6B7068',
  inkStrong: '#0E1A14',
  ink70: '#3B4641',
  // 컨디션 3단계 의미색 (좋음/보통/나쁨)
  condGood: '#3DA773',
  condMid: '#E9B949',
  condBad: '#D94A4A',
  // 내 장소 색상 — 직장=primary(그린), 학교=보라, 기타=coral
  school: '#7B5FCC',
  schoolSoft: '#EFEAFB',
  // 카카오 검색 뱃지
  kakaoYellow: '#FEE500',
  kakaoInk: '#3A2929',
} as const;

export type ColorKey = keyof typeof colors;
