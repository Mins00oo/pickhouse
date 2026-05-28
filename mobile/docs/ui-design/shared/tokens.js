// pickhouse — design tokens
// Discipline > decoration.

const T = {
  // Surfaces
  paper:    '#F7F5F0',
  surface:  '#FFFFFF',
  inkDark:  '#0F0E0C',
  hairline: 'rgba(15, 14, 12, 0.08)',
  divider:  'rgba(15, 14, 12, 0.05)',
  wash:     'rgba(15, 14, 12, 0.04)',

  // Type
  ink:      '#0F0E0C',
  body:     '#33312D',
  muted:    '#8A857C',
  faint:    '#B8B2A7',

  // Accent — ONLY on primary CTA, selected tab, current-living marker.
  accent:   '#1F4D3F',
  accentSoft: 'rgba(31, 77, 63, 0.10)',

  // Pin & map
  pin:        '#0F0E0C',
  pinActive:  '#0F0E0C',
  mapLand:    '#EEEAE0',
  mapWater:   '#D6E2DD',
  mapRoad:    '#FFFFFF',
  mapStroke:  'rgba(15,14,12,0.06)',
  mapLabel:   '#8A857C',

  // Type family
  family: '"Pretendard", -apple-system, "SF Pro Text", "Apple SD Gothic Neo", system-ui',
  mono:   '"SF Mono", "Menlo", ui-monospace, monospace',
};

const TYPE = {
  display: { fontSize: 28, lineHeight: 1.1,  fontWeight: 700, letterSpacing: -1.0 },
  title:   { fontSize: 22, lineHeight: 1.2,  fontWeight: 700, letterSpacing: -0.6 },
  headline:{ fontSize: 17, lineHeight: 1.25, fontWeight: 600, letterSpacing: -0.3 },
  body:    { fontSize: 15, lineHeight: 1.35, fontWeight: 500, letterSpacing: -0.2 },
  caption: { fontSize: 13, lineHeight: 1.3,  fontWeight: 500, letterSpacing: -0.1 },
  meta:    { fontSize: 11, lineHeight: 1.2, fontWeight: 600, letterSpacing: 0.6,
             fontFamily: T.mono, textTransform: 'uppercase' },
  num:     { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' },
};

window.T = T;
window.TYPE = TYPE;
