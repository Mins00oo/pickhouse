import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export interface BottomBarProps {
  step: number; // 1..4
  saving: boolean;
  onSave: () => void;
  onNext: () => void;
}

export function BottomBar({ step, saving, onSave, onNext }: BottomBarProps) {
  const last = step === 4;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 10,
        backgroundColor: colors.white,
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
      }}
    >
      {last ? (
        <Pressable
          testID="save-button"
          accessibilityRole="button"
          accessibilityLabel="집 저장하기"
          disabled={saving}
          onPress={onSave}
          style={{
            flex: 1,
            height: 54,
            borderRadius: 15,
            backgroundColor: colors.inkStrong,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Ionicons name="checkmark" size={17} color={colors.white} />
          <Text style={{ fontSize: 15.5, fontWeight: '700', color: colors.white, letterSpacing: -0.3 }}>
            {saving ? '저장 중...' : '집 저장하기'}
          </Text>
        </Pressable>
      ) : (
        <>
          <Pressable
            testID="save-button"
            accessibilityRole="button"
            accessibilityLabel="저장"
            disabled={saving}
            onPress={onSave}
            style={{
              width: 96,
              height: 54,
              borderRadius: 15,
              borderWidth: 1,
              borderColor: colors.borderHard,
              backgroundColor: colors.white,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink70 }}>
              {saving ? '저장 중' : '저장'}
            </Text>
          </Pressable>
          <Pressable
            testID="next-button"
            accessibilityRole="button"
            accessibilityLabel="다음 항목"
            onPress={onNext}
            style={{
              flex: 1,
              height: 54,
              borderRadius: 15,
              backgroundColor: colors.inkStrong,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 15.5, fontWeight: '700', color: colors.white, letterSpacing: -0.3 }}>
              다음 항목
            </Text>
            <Ionicons name="chevron-forward" size={17} color={colors.white} />
          </Pressable>
        </>
      )}
    </View>
  );
}
