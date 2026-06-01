import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/theme';

/**
 * 거점(직장/학교) 미등록 시 지도 상단에 뜨는 가벼운 등록 유도 배너.
 * 거리 기능의 첫 접점 — 등록되면 호출부에서 렌더하지 않는다.
 */
export function AnchorNudge({ onPress, onDismiss }: { onPress: () => void; onDismiss: () => void }) {
  return (
    <Pressable
      testID="anchor-nudge"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="briefcase" size={16} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>직장·학교를 등록해요</Text>
        <Text style={styles.body}>집마다 통근·통학 거리를 알려드려요</Text>
      </View>
      <Pressable
        testID="anchor-nudge-dismiss"
        accessibilityRole="button"
        accessibilityLabel="닫기"
        hitSlop={10}
        onPress={onDismiss}
      >
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  iconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { ...typography.caption, color: colors.ink, fontWeight: '800' },
  body: { ...typography.caption, color: colors.inkMuted, fontSize: 11 },
});
