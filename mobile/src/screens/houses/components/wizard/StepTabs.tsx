import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export const STEP_LABELS = ['기본', '가격', '구조', '체크'] as const;

export interface StepTabsProps {
  step: number; // 1..4
  onJump: (n: number) => void;
  onClose: () => void;
  requiredSteps?: number[];
}

export function StepTabs({ step, onJump, onClose, requiredSteps = [1, 2] }: StepTabsProps) {
  return (
    <View style={{ backgroundColor: colors.white, paddingHorizontal: 18, paddingTop: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 44,
        }}
      >
        <Pressable
          testID="wizard-close"
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={onClose}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={18} color={colors.ink70} />
        </Pressable>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 }}>
          집 추가
        </Text>
        <View style={{ width: 36, height: 36 }} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginTop: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSoft,
        }}
      >
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          return (
            <Pressable
              key={label}
              testID={`add-step-tab-${label}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label} 단계`}
              onPress={() => onJump(n)}
              style={{
                flex: 1,
                paddingBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 14.5,
                  fontWeight: active ? '700' : '600',
                  letterSpacing: -0.3,
                  color: active ? colors.inkStrong : colors.muted,
                }}
              >
                {label}
              </Text>
              {requiredSteps.includes(n) ? (
                <Text style={{ color: colors.coral, fontSize: 13, fontWeight: '700' }}>*</Text>
              ) : null}
              {active ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 12,
                    right: 12,
                    height: 2.5,
                    borderRadius: 2,
                    backgroundColor: colors.inkStrong,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text
        style={{
          fontSize: 11,
          fontWeight: '500',
          color: colors.muted,
          marginTop: 10,
          paddingBottom: 12,
          textAlign: 'center',
          letterSpacing: -0.2,
        }}
      >
        순서 상관없이 원하는 항목부터 입력하세요
      </Text>
    </View>
  );
}
