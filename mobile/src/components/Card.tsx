import { ReactNode } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { colors, radii, spacing, shadows } from '@/theme';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({ children, style, testID }: CardProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.cardBg,
          borderRadius: radii.lg,
          padding: spacing.lg,
          ...shadows.soft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
