import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

/** 비교표 섹션 구분 라벨 — 아이콘 + 텍스트 + 가는 구분선. */
export function SectionLabel({ icon, children }: { icon: string; children: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as never} size={13} color={colors.ink70} />
      <Text style={styles.text}>{children}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 16, paddingBottom: 6, paddingHorizontal: 4 },
  text: { fontSize: 12, fontWeight: '700', color: colors.ink70, letterSpacing: -0.2 },
  line: { flex: 1, height: 1, backgroundColor: colors.borderSoft, marginLeft: 4 },
});
