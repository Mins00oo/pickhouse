import { StyleSheet, Text, View } from 'react-native';
import { House } from '@/types';
import { colors, conditionColor } from '@/theme';
import {
  CONDITION_KEYS,
  CONDITION_META,
  ConditionKey,
  conditionValueLabel,
  normalizeConditionLevel,
} from '@/screens/houses/conditionMeta';
import { directionColorLevel } from '../compareUtils';
import { directionLabel } from '@/screens/houses/wizardConstants';

/**
 * 컨디션 한 줄 — 항목별 실제 값(햇빛=향, 곰팡이=없음 …) + 색.
 * level은 색 칠하는 용도(1~3), text는 화면에 보일 실제 단어.
 */
function ClRow({
  label,
  lLevel,
  rLevel,
  lText,
  rText,
  dense,
}: {
  label: string;
  lLevel: 1 | 2 | 3 | undefined;
  rLevel: 1 | 2 | 3 | undefined;
  lText: string;
  rText: string;
  dense: boolean;
}) {
  const cell = (level: 1 | 2 | 3 | undefined, text: string) => {
    const color = conditionColor(level);
    return (
      <View style={[styles.cell, { paddingVertical: dense ? 5 : 7 }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.text, { color, fontSize: dense ? 12.5 : 13 }]}>{text}</Text>
      </View>
    );
  };
  return (
    <View style={styles.row}>
      {cell(lLevel, lText)}
      <Text style={styles.label}>{label}</Text>
      {cell(rLevel, rText)}
    </View>
  );
}

/** 한 집 쌍의 컨디션 행 묶음(햇빛=향, 나머지=항목 어휘). */
export function ConditionRows({ a, b, dense = false }: { a: House; b: House; dense?: boolean }) {
  return (
    <>
      {CONDITION_KEYS.map((key) => {
        const meta = CONDITION_META[key];
        if (key === 'sunlight') {
          return (
            <ClRow
              key={key}
              label={meta.label}
              lLevel={directionColorLevel(a.direction)}
              rLevel={directionColorLevel(b.direction)}
              lText={directionLabel(a.direction) ?? '—'}
              rText={directionLabel(b.direction) ?? '—'}
              dense={dense}
            />
          );
        }
        const la = normalizeConditionLevel(conditionRawValue(a, key));
        const rb = normalizeConditionLevel(conditionRawValue(b, key));
        return (
          <ClRow
            key={key}
            label={meta.label}
            lLevel={la}
            rLevel={rb}
            lText={conditionValueLabel(key, la)}
            rText={conditionValueLabel(key, rb)}
            dense={dense}
          />
        );
      })}
    </>
  );
}

/** 컨디션 키 → House 필드 값. (sunlight는 향으로 별도 처리하므로 여기 미포함) */
function conditionRawValue(house: House, key: Exclude<ConditionKey, 'sunlight'>): number | undefined {
  switch (key) {
    case 'waterPressure':
      return house.waterPressure;
    case 'moisture':
      return house.moisture;
    case 'noise':
      return house.noise;
    case 'ventilation':
      return house.ventilation;
    default:
      return undefined;
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 1 },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  label: { width: 56, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.muted },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontWeight: '700', letterSpacing: -0.2 },
});
