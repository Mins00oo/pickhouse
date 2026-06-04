import { ScrollView, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PhotoGrid } from '@/components/PhotoGrid';
import { useHouse, useDeleteHouse } from '@/queries/houses.queries';
import { useHousePhotos } from '@/queries/photos.queries';
import { House, HouseStackParamList } from '@/types';
import { colors, spacing, typography } from '@/theme';
import {
  builtYearLabel,
  CONDITION_KEYS,
  CONDITION_META,
  conditionColor,
  conditionValueLabel,
  dealTypeLabel,
  directionColorLevel,
  directionLabel,
  floorTypeLabel,
  normalizeConditionLevel,
  roomTypeLabel,
} from '@/domain/house';
import { AnchorDistanceCard } from './components/AnchorDistanceCard';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseDetail'>;

export function HouseDetailScreen({ route, navigation }: Props) {
  const { houseId } = route.params;
  const { data: house, isLoading } = useHouse(houseId);
  const del = useDeleteHouse();
  const { data: photos = [] } = useHousePhotos(houseId);

  if (isLoading || !house) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: colors.inkMuted }]}>불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  function priceLabel(): string {
    if (!house) return '';
    if (house.dealType === 'JEONSE') return `${dealTypeLabel('JEONSE')} ${house.deposit.toLocaleString()} 만원`;
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

  // 햇빛은 향(direction)으로 표시하므로 direction 유무로 판단. 나머지는 저장된 1~3 값 유무.
  const presentConditions = CONDITION_KEYS.filter((k) =>
    k === 'sunlight' ? Boolean(house.direction) : typeof house[k] === 'number',
  );
  const floorText = floorLabel(house);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}>
        <Card>
          <Text style={typography.caption}>주소</Text>
          <Text style={[typography.heading, { marginTop: spacing.xs }]}>
            {house.nickname?.trim() || house.address.roadAddress || '주소 미입력'}
          </Text>
          {house.nickname?.trim() ? (
            <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
              {house.address.roadAddress}
            </Text>
          ) : null}
          <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
            {house.address.jibunAddress}
            {house.address.detail ? ` ${house.address.detail}` : ''}
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

        <AnchorDistanceCard house={house} />

        {(house.area || house.floor || house.rooms || house.roomType || house.floorType || house.builtYear) && (
          <Card>
            <Text style={typography.caption}>구조</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm }}>
              {house.roomType ? <Pill text={roomTypeLabel(house.roomType) ?? ''} /> : null}
              {house.area ? <Pill text={`${house.area}평`} /> : null}
              {floorText ? <Pill text={floorText} /> : null}
              {house.rooms ? <Pill text={`방 ${house.rooms}`} /> : null}
              {house.bathrooms ? <Pill text={`욕실 ${house.bathrooms}`} /> : null}
              {house.builtYear ? <Pill text={builtYearLabel(house.builtYear)} /> : null}
            </View>
          </Card>
        )}

        {presentConditions.length > 0 ? (
          <Card>
            <Text style={typography.caption}>컨디션</Text>
            {presentConditions.map((k) => {
              // 햇빛 = 향(남향/북향…) 텍스트, 색은 향→레벨 매핑. 나머지는 항목별 단어.
              const isSun = k === 'sunlight';
              const lvl = isSun
                ? directionColorLevel(house.direction)
                : normalizeConditionLevel(house[k] as number);
              const valueText = isSun
                ? (directionLabel(house.direction) ?? '—')
                : conditionValueLabel(k, lvl);
              return (
                <View
                  key={k}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons name={CONDITION_META[k].icon as never} size={16} color={conditionColor(lvl)} />
                    <Text style={typography.body}>{CONDITION_META[k].label}</Text>
                  </View>
                  <Text style={[typography.bodyBold, { color: conditionColor(lvl) }]}>{valueText}</Text>
                </View>
              );
            })}
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

function floorLabel(h: House): string | null {
  // 반지하/옥탑은 층 유형 라벨로(숫자 층 대신). 지상은 N/M층.
  if (h.floorType === 'SEMI_BASEMENT' || h.floorType === 'ROOFTOP') {
    return floorTypeLabel(h.floorType) ?? null;
  }
  if (h.floor != null) return h.totalFloor != null ? `${h.floor}/${h.totalFloor}층` : `${h.floor}층`;
  return null;
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
