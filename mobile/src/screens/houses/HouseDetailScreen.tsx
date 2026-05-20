import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StarRating } from '@/components/StarRating';
import { PhotoGrid } from '@/components/PhotoGrid';
import { useHouse, useDeleteHouse } from '@/queries/houses.queries';
import { HouseStackParamList, Photo, RatingKey, RATING_KEYS } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { photosRepo } from '@/db/photos.repo';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseDetail'>;

export function HouseDetailScreen({ route, navigation }: Props) {
  const { houseId } = route.params;
  const { data: house, isLoading } = useHouse(houseId);
  const del = useDeleteHouse();
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    void photosRepo.listForHouse(houseId).then(setPhotos);
  }, [houseId]);

  if (isLoading || !house) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: colors.inkMuted }]}>불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  function priceLabel(): string {
    if (!house) return '';
    if (house.dealType === 'JEONSE') return `전세 ${house.deposit.toLocaleString()} 만원`;
    return `보증금 ${house.deposit.toLocaleString()} / 월세 ${house.rent?.toLocaleString() ?? 0} 만원`;
  }

  async function handleDelete() {
    Alert.alert('정말 삭제할까요?', '', [
      { text: '취소' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await del.mutateAsync(houseId);
          navigation.goBack();
        },
      },
    ]);
  }

  const presentRatings = RATING_KEYS.filter((k) => typeof house[k] === 'number');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}>
        <Card>
          <Text style={typography.caption}>주소</Text>
          <Text style={[typography.heading, { marginTop: spacing.xs }]}>
            {house.address.roadAddress || '주소 미입력'}
          </Text>
          <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
            {house.address.jibunAddress}
          </Text>
        </Card>

        <Card>
          <Text style={typography.caption}>가격</Text>
          <Text style={[typography.heading, { marginTop: spacing.xs }]}>{priceLabel()}</Text>
          {house.maintenanceFee ? (
            <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
              관리비 {house.maintenanceFee.toLocaleString()} 만원
            </Text>
          ) : null}
        </Card>

        {(house.area || house.floor || house.rooms) && (
          <Card>
            <Text style={typography.caption}>구조</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm }}>
              {house.area ? <Pill text={`${house.area}평`} /> : null}
              {house.floor ? <Pill text={`${house.floor}층`} /> : null}
              {house.rooms ? <Pill text={`방 ${house.rooms}`} /> : null}
              {house.bathrooms ? <Pill text={`욕실 ${house.bathrooms}`} /> : null}
            </View>
          </Card>
        )}

        {presentRatings.length > 0 ? (
          <Card>
            <Text style={typography.caption}>별점</Text>
            {presentRatings.map((k) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                <Text style={typography.body}>{labelOf(k)}</Text>
                <StarRating value={(house[k] as number) ?? 0} onChange={() => {}} />
              </View>
            ))}
          </Card>
        ) : null}

        {photos.length > 0 && (
          <Card>
            <Text style={typography.caption}>사진</Text>
            <View style={{ marginTop: spacing.sm }}>
              <PhotoGrid photos={photos} />
            </View>
          </Card>
        )}

        {house.memo ? (
          <Card>
            <Text style={typography.caption}>메모</Text>
            <Text style={[typography.body, { marginTop: spacing.xs }]}>{house.memo}</Text>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="수정"
              variant="secondary"
              onPress={() => navigation.navigate('HouseInput', { houseId })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="삭제" variant="ghost" onPress={handleDelete} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function labelOf(k: RatingKey): string {
  const m: Record<RatingKey, string> = {
    waterPressure: '수압',
    sunlight: '햇빛',
    noise: '소음',
    insulation: '단열',
    ventilation: '환기',
    moisture: '곰팡이/누수',
    neighborhood: '동네',
    firstImpression: '첫인상',
  };
  return m[k];
}

function Pill({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: colors.creamDark,
      }}
    >
      <Text style={[typography.caption, { color: colors.ink }]}>{text}</Text>
    </View>
  );
}
