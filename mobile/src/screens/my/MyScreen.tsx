import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '@/theme';

export function MyScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>마이</Text>
        <Text style={styles.subtitle}>프로필 준비 중</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>내 집 기록</Text>
        <Text style={styles.panelBody}>저장한 집, 로그인 정보, 앱 설정을 이곳에서 관리하게 됩니다.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.inkMuted,
  },
  panel: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  panelTitle: {
    ...typography.bodyBold,
    color: colors.ink,
  },
  panelBody: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.inkSoft,
  },
});
