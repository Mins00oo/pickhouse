import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HouseStackParamList, MainTabParamList } from '@/navigation/types';
import { useHouses } from '@/queries/houses.queries';
import { colors, spacing, typography } from '@/theme';
import { HouseRecordRow } from './components/HouseRecordRow';

type Props = BottomTabScreenProps<MainTabParamList, 'List'>;

export function HouseListScreen({ navigation }: Props) {
  const { data = [], refetch, isFetching } = useHouses();
  const houses = useMemo(
    () => [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data],
  );

  const openHouseDetail = (houseId: string) => {
    const rootNavigation =
      navigation.getParent<NavigationProp<HouseStackParamList>>() ??
      (navigation as unknown as NavigationProp<HouseStackParamList>);
    rootNavigation.navigate('HouseDetail', { houseId });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>목록</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.subtitle}>전체 기록 {houses.length}</Text>
          <Text style={styles.sortText}>최근 본 순</Text>
        </View>
      </View>

      <FlatList
        data={houses}
        keyExtractor={(house) => house.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>아직 기록한 집이 없어요</Text>
            <Text style={styles.emptyBody}>홈에서 첫 집을 기록하면 보관함에 모아볼 수 있어요.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <HouseRecordRow
            testID={`house-list-row-${item.id}`}
            house={item}
            selected={false}
            onSelect={openHouseDetail}
            onOpen={openHouseDetail}
          />
        )}
      />
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
  headerMeta: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
  },
  sortText: {
    ...typography.caption,
    color: colors.inkSoft,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.bodyBold,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.caption,
    marginTop: spacing.sm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
