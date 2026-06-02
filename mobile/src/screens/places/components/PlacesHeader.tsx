import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

/** 거점 등록 스택 공용 헤더 — 뒤로가기 + 타이틀. */
export function PlacesHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Pressable
        testID="places-header-back"
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        hitSlop={10}
        onPress={onBack}
        style={styles.backBtn}
      >
        <Ionicons name="chevron-back" size={22} color={colors.ink70} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.4 },
});
