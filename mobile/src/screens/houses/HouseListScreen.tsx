import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HouseStackParamList, MainTabParamList } from '@/navigation/types';
import { useHouses } from '@/queries/houses.queries';
import { colors, spacing, typography } from '@/theme';
import { HouseRecordRow } from './components/HouseRecordRow';
import { getDisplayHouses } from './houseSampleData';

type Props = BottomTabScreenProps<MainTabParamList, 'HouseList'>;

export function HouseListScreen({ navigation }: Props) {
  const { data = [], refetch, isFetching } = useHouses();
  const houses = useMemo(
    () => [...getDisplayHouses(data)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
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
        <Text style={styles.title}>보관함</Text>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
});
