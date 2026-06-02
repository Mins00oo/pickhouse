import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransportMode } from '@/types';
import { TRANSPORT_META, TRANSPORT_ORDER } from '@/screens/houses/anchorMeta';
import { colors } from '@/theme';

/** 주 이동수단 선택 — 대중교통/자동차/도보 (자전거 제외). 통근시간 계산 기준. */
export function TransportPicker({
  value,
  onChange,
}: {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
}) {
  return (
    <View style={styles.row}>
      {TRANSPORT_ORDER.map((mode) => {
        const meta = TRANSPORT_META[mode];
        const on = mode === value;
        return (
          <Pressable
            key={mode}
            testID={`transport-${mode}`}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(mode)}
            style={[styles.cell, on && styles.cellOn]}
          >
            <Ionicons name={meta.icon as never} size={19} color={on ? colors.primary : colors.muted} />
            <Text style={[styles.label, on && styles.labelOn]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  cell: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.borderHard,
    backgroundColor: colors.white,
  },
  cellOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  label: { fontSize: 11, fontWeight: '600', color: colors.ink70 },
  labelOn: { color: colors.primary, fontWeight: '700' },
});
