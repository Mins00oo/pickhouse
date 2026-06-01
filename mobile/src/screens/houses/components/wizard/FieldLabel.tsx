import { ReactNode } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { colors } from '@/theme';

export function FieldLabel({
  children,
  required,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 9 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 }}>
        {children}
      </Text>
      {required ? (
        <Text style={{ color: colors.coral, fontSize: 13, fontWeight: '700' }}>*</Text>
      ) : null}
      {hint ? (
        <Text style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: '500', color: colors.muted }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function Field({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[{ marginBottom: 22 }, style]}>{children}</View>;
}
