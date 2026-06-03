import { Pressable, Text, View } from 'react-native';
import { colors } from '@/theme';
import { NumericInput } from './NumericInput';

export interface BuiltYearInputProps {
  value: string;
  onChange: (t: string) => void;
}

const THIS_YEAR = new Date().getFullYear();
// 자주 쓰는 연식 빠른 선택(올해/2년 전/5년 전/10년 전/20년 전).
const PRESETS = [THIS_YEAR, THIS_YEAR - 2, THIS_YEAR - 5, THIS_YEAR - 10, THIS_YEAR - 20];

/** 건축연도 입력 — 4자리 연도 직접 입력 + 자주 쓰는 연식 칩 + 연식(N년차) 환산. */
export function BuiltYearInput({ value, onChange }: BuiltYearInputProps) {
  const year = Number(value);
  const valid = value.length === 4 && Number.isFinite(year) && year >= 1900 && year <= THIS_YEAR + 1;
  const age = valid ? THIS_YEAR - year : null;
  const ageText = age == null ? '' : age <= 0 ? '신축' : `${age}년차`;

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
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>준공연도</Text>
        <NumericInput
          testID="builtyear-input"
          accessibilityLabel="건축연도"
          value={value}
          onChangeText={(raw) => onChange(raw.slice(0, 4))}
          keyboardType="number-pad"
          placeholder="2020"
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
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink70 }}>년</Text>
        <Text
          testID="builtyear-age"
          style={{ fontSize: 12, fontWeight: '600', color: colors.muted, minWidth: 44, textAlign: 'right' }}
        >
          {ageText}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {PRESETS.map((p) => {
          const on = String(p) === value;
          return (
            <Pressable
              key={p}
              testID={`builtyear-preset-${p}`}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${p}년`}
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
                {p}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
