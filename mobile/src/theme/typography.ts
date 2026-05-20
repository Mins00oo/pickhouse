import { TextStyle } from 'react-native';

export const typography = {
  display: { fontSize: 32, fontWeight: '700', lineHeight: 40 } as TextStyle,
  title: { fontSize: 24, fontWeight: '600', lineHeight: 32 } as TextStyle,
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 28 } as TextStyle,
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 } as TextStyle,
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 } as TextStyle,
  miniLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;
