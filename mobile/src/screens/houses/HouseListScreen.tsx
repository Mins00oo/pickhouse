import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StarRating } from '@/components/StarRating';
import { useHouses } from '@/queries/houses.queries';
import { House, HouseStackParamList, RATING_KEYS } from '@/types';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseList'>;

type SortMode = 'recent' | 'priceAsc' | 'priceDesc' | 'rating';

function priceLabel(h: House): string {
  if (h.dealType === 'JEONSE') return `전세 ${h.deposit.toLocaleString()}`;
  return `${h.deposit.toLocaleString()} / ${h.rent?.toLocaleString() ?? 0}`;
}

function avgRating(h: House): number {
  const vals: number[] = [];
  for (const key of RATING_KEYS) {
    const v = h[key];
    if (typeof v === 'number') vals.push(v);
  }
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function HouseListScreen({ navigation }: Props) {
  const [sort, setSort] = useState<SortMode>('recent');
  const { data = [], refetch, isFetching } = useHouses();

  const sorted = useMemo(() => {
    const arr = [...data];
    if (sort === 'priceAsc') arr.sort((a, b) => a.deposit - b.deposit);
    else if (sort === 'priceDesc') arr.sort((a, b) => b.deposit - a.deposit);
    else if (sort === 'rating') arr.sort((a, b) => avgRating(b) - avgRating(a));
    else arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return arr;
  }, [data, sort]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.lg }}>
        <SortChip label="최신순" active={sort === 'recent'} onPress={() => setSort('recent')} />
        <SortChip label="가격↑" active={sort === 'priceAsc'} onPress={() => setSort('priceAsc')} />
        <SortChip label="가격↓" active={sort === 'priceDesc'} onPress={() => setSort('priceDesc')} />
        <SortChip label="별점" active={sort === 'rating'} onPress={() => setSort('rating')} />
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center', marginTop: spacing.xxxl }]}>
            아직 기록한 집이 없어요{'\n'}+ 버튼으로 첫 집을 기록해보세요
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('HouseDetail', { houseId: item.id })}>
            <Card>
              <Text style={[typography.bodyBold, { color: colors.ink }]}>
                {item.address.roadAddress || '주소 미입력'}
              </Text>
              <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
                {priceLabel(item)} (만원)
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                <StarRating value={Math.round(avgRating(item))} onChange={() => {}} />
              </View>
            </Card>
          </Pressable>
        )}
      />
      <View style={{ position: 'absolute', bottom: spacing.xl, left: spacing.xl, right: spacing.xl }}>
        <Button label="+ 새 집 기록" onPress={() => navigation.navigate('HouseInput')} />
      </View>
    </SafeAreaView>
  );
}

function SortChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: active ? colors.ink : colors.white,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
      }}
    >
      <Text style={[typography.caption, { color: active ? colors.white : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}
