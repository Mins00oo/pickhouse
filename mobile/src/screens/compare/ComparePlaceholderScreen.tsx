import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

/** 비교 화면 — 디자인 확정 전 '준비 중' 플레이스홀더. footer 5탭 구성을 유지하기 위함. */
export function ComparePlaceholderScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>비교</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="grid-outline" size={38} color={colors.primary} />
        </View>
        <Text style={styles.heading}>비교 기능 준비 중</Text>
        <Text style={styles.desc}>
          기록한 집들을 가격·옵션·통근시간까지{'\n'}한 화면에서 나란히 비교하는 기능을 준비하고 있어요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 19, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.4 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 20 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.4, marginBottom: 10 },
  desc: { fontSize: 13.5, fontWeight: '500', color: colors.muted, lineHeight: 21, letterSpacing: -0.2, textAlign: 'center' },
});
