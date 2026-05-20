import { ViewStyle, Platform } from 'react-native';

export const shadows = {
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#3a2e1a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  })!,
  medium: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#3a2e1a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    android: { elevation: 6 },
    default: {},
  })!,
} as const;
