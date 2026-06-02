import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HouseStackParamList } from '@/navigation/types';
import { useAnchorPlaces } from '@/queries/anchorPlaces.queries';
import { colors } from '@/theme';
import { PlacesHeader } from './components/PlacesHeader';
import { PlaceCard } from './components/PlaceCard';

type Props = NativeStackScreenProps<HouseStackParamList, 'Places'>;

export function PlacesListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: places = [] } = useAnchorPlaces();
  const isEmpty = places.length === 0;

  const addPlace = () => navigation.navigate('AddPlace', undefined);
  const editPlace = (placeId: string) => navigation.navigate('AddPlace', { placeId });

  return (
    <View style={styles.root}>
      <PlacesHeader title="직장·학교" onBack={() => navigation.goBack()} />

      {isEmpty ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="navigate" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>통근 기준지를 등록해 보세요</Text>
          <Text style={styles.emptyBody}>
            직장이나 학교를 등록하면 집을 비교할 때{'\n'}가격·옵션과 함께 <Text style={styles.emptyStrong}>출퇴근 시간</Text>까지{'\n'}한눈에 따져볼 수 있어요.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.whyCard}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <Text style={styles.whyText}>
              등록한 장소까지의 <Text style={styles.whyStrong}>통근시간</Text>이 집 카드와 비교 화면에 자동으로 표시돼요. 가격·옵션만큼 중요한{' '}
              <Text style={styles.whyStrong}>출퇴근 거리</Text>를 한눈에 따져보세요.
            </Text>
          </View>

          <Text style={styles.countLabel}>
            등록된 장소 <Text style={{ color: colors.primary }}>{places.length}</Text>
          </Text>

          <View style={{ gap: 10 }}>
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} onEdit={() => editPlace(p.id)} />
            ))}
          </View>

          <Pressable testID="places-add" accessibilityRole="button" onPress={addPlace} style={styles.addBtn}>
            <Ionicons name="add" size={18} color={colors.ink70} />
            <Text style={styles.addBtnText}>장소 추가</Text>
          </Pressable>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {isEmpty ? (
          <>
            <Pressable testID="places-empty-add" accessibilityRole="button" onPress={addPlace} style={styles.primaryBtn}>
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>직장·학교 등록</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.laterBtn}>
              <Text style={styles.laterText}>나중에 할게요</Text>
            </Pressable>
          </>
        ) : (
          <Pressable testID="places-done" accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.doneBtn}>
            <Text style={styles.doneText}>완료</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  body: { padding: 16, paddingBottom: 24 },
  whyCard: { flexDirection: 'row', gap: 11, padding: 14, borderRadius: 14, backgroundColor: colors.primarySoft, marginBottom: 18 },
  whyText: { flex: 1, fontSize: 12.5, fontWeight: '500', color: colors.primaryDark, lineHeight: 19, letterSpacing: -0.2 },
  whyStrong: { fontWeight: '800' },
  countLabel: { fontSize: 13, fontWeight: '700', color: colors.ink70, letterSpacing: -0.3, marginBottom: 10 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 56,
    marginTop: 14,
    borderRadius: 15,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderHard,
    backgroundColor: colors.white,
  },
  addBtnText: { fontSize: 14.5, fontWeight: '700', color: colors.ink70, letterSpacing: -0.3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 88, height: 88, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginBottom: 22 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.5, marginBottom: 10 },
  emptyBody: { fontSize: 13.5, fontWeight: '500', color: colors.muted, lineHeight: 22, letterSpacing: -0.2, textAlign: 'center' },
  emptyStrong: { color: colors.ink70, fontWeight: '700' },
  footer: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft, backgroundColor: colors.white },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 54, borderRadius: 15, backgroundColor: colors.primary },
  primaryBtnText: { fontSize: 15.5, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  laterBtn: { alignItems: 'center', marginTop: 14 },
  laterText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  doneBtn: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.inkStrong },
  doneText: { fontSize: 15.5, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
});
