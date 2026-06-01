import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';
import { NumericInput } from './NumericInput';

const PRESETS = [6, 9, 12, 15, 18, 24];
const SQM_PER_PYEONG = 3.305785;

export interface PyeongInputProps {
  value: string;
  onChange: (t: string) => void;
}

export function PyeongInput({ value, onChange }: PyeongInputProps) {
  const num = Number(value);
  const sqm = Number.isFinite(num) && num > 0 ? (num * SQM_PER_PYEONG).toFixed(1) : '0.0';
  return (
    <View>
      <View
        style={{
          height: 56,
          backgroundColor: colors.white,
          borderRadius: 13,
          borderWidth: 1.5,
          borderColor: colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>전용면적</Text>
        <NumericInput
          testID="pyeong-input"
          accessibilityLabel="전용면적(평)"
          value={value}
          onChangeText={onChange}
          sanitize={(s) => s.replace(/[^0-9.]/g, '')}
          keyboardType="decimal-pad"
          placeholder="0"
          style={{
            flex: 1,
            textAlign: 'right',
            fontSize: 20,
            fontWeight: '700',
            letterSpacing: -0.5,
            color: colors.inkStrong,
            padding: 0,
          }}
        />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink70 }}>평</Text>
        <Text
          testID="pyeong-sqm"
          style={{ fontSize: 12, fontWeight: '600', color: colors.muted, minWidth: 58, textAlign: 'right' }}
        >
          ≈ {sqm}㎡
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {PRESETS.map((p) => {
          const on = String(p) === value;
          return (
            <Pressable
              key={p}
              testID={`pyeong-preset-${p}`}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${p}평`}
              onPress={() => onChange(String(p))}
              style={{
                height: 34,
                paddingHorizontal: 13,
                borderRadius: 17,
                justifyContent: 'center',
                backgroundColor: on ? colors.primarySoft : colors.white,
                borderWidth: 1,
                borderColor: on ? colors.primary : colors.borderHard,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: on ? '700' : '600',
                  letterSpacing: -0.3,
                  color: on ? colors.primary : colors.ink70,
                }}
              >
                {p}평
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
