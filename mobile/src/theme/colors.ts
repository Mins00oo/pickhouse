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
} as const;

export type ColorKey = keyof typeof colors;
