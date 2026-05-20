import { useState } from 'react';
import { ScrollView, TextInput, Text, View, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StarRating } from '@/components/StarRating';
import { AddressPicker } from '@/components/AddressPicker';
import { PhotoGrid } from '@/components/PhotoGrid';
import { cameraHelper } from '@/photos/cameraHelper';
import { useCreateHouse } from '@/queries/houses.queries';
import { Address, DealType, HouseStackParamList, Photo, RatingKey } from '@/types';
import { colors, radii, spacing, typography } from '@/theme';
import { photosRepo } from '@/db/photos.repo';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseInput'>;
type Mode = 'quick' | 'detail';
type Ratings = Partial<Record<RatingKey, number>>;

export function HouseInputScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('quick');
  const [address, setAddress] = useState<Address | null>(null);
  const [dealType, setDealType] = useState<DealType>('WOLSE');
  const [deposit, setDeposit] = useState('');
  const [rent, setRent] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [area, setArea] = useState('');
  const [floor, setFloor] = useState('');
  const [memo, setMemo] = useState('');
  const [ratings, setRatings] = useState<Ratings>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tempHouseId] = useState(() => Crypto.randomUUID());

  const { mutateAsync: createHouse, isPending } = useCreateHouse();

  async function handleAddPhoto() {
    const captured = await cameraHelper.takePhoto(tempHouseId);
    if (captured) {
      setPhotos((p) => [
        ...p,
        {
          id: captured.id,
          houseId: tempHouseId,
          localUri: captured.localUri,
          uploadStatus: 'pending',
          takenAt: new Date().toISOString(),
          mimeType: captured.mimeType,
        },
      ]);
    }
  }

  async function handleRemovePhoto(id: string) {
    await photosRepo.softDelete(id);
    setPhotos((arr) => arr.filter((p) => p.id !== id));
  }

  async function handleSave() {
    if (!deposit) {
      Alert.alert('보증금을 입력해주세요');
      return;
    }
    await createHouse({
      id: tempHouseId,
      address: address ?? { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType,
      deposit: parseInt(deposit, 10) || 0,
      rent: rent ? parseInt(rent, 10) : undefined,
      maintenanceFee: maintenance ? parseInt(maintenance, 10) : undefined,
      area: area ? parseFloat(area) : undefined,
      floor: floor ? parseInt(floor, 10) : undefined,
      memo: memo || undefined,
      ...ratings,
      photoIds: photos.map((p) => p.id),
    });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <View style={{ flexDirection: 'row', padding: spacing.lg, gap: spacing.sm }}>
        <ModeTab label="현장 모드" active={mode === 'quick'} onPress={() => setMode('quick')} />
        <ModeTab label="디테일 모드" active={mode === 'detail'} onPress={() => setMode('detail')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: spacing.md }}>
        {mode === 'quick' ? (
          <>
            <Card>
              <Text style={typography.caption}>가격</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <DealTypeChip label="전세" active={dealType === 'JEONSE'} onPress={() => setDealType('JEONSE')} />
                <DealTypeChip label="월세" active={dealType === 'WOLSE'} onPress={() => setDealType('WOLSE')} />
                <DealTypeChip label="반전세" active={dealType === 'BAN_JEONSE'} onPress={() => setDealType('BAN_JEONSE')} />
              </View>
              <Input placeholder="보증금 (만원)" value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
              <Input placeholder="월세 (만원)" value={rent} onChangeText={setRent} keyboardType="numeric" />
            </Card>

            <Card>
              <Text style={typography.caption}>빠른 별점</Text>
              {(['waterPressure', 'sunlight', 'noise', 'firstImpression'] as const).map((k) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                  <Text style={typography.body}>{labelOf(k)}</Text>
                  <StarRating
                    value={ratings[k] ?? 0}
                    onChange={(v) => setRatings((r) => ({ ...r, [k]: v }))}
                  />
                </View>
              ))}
            </Card>

            <Card>
              <Text style={typography.caption}>사진</Text>
              <View style={{ marginTop: spacing.sm }}>
                <PhotoGrid photos={photos} onAdd={handleAddPhoto} onRemove={handleRemovePhoto} />
              </View>
            </Card>

            <Card>
              <Text style={typography.caption}>한 줄 메모</Text>
              <Input
                placeholder="좋았던 점·아쉬운 점 한 줄"
                value={memo}
                onChangeText={setMemo}
                multiline
              />
            </Card>
          </>
        ) : (
          <>
            <Card>
              <AddressPicker value={address} onChange={setAddress} />
            </Card>

            <Card>
              <Text style={typography.caption}>거래 유형</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <DealTypeChip label="전세" active={dealType === 'JEONSE'} onPress={() => setDealType('JEONSE')} />
                <DealTypeChip label="월세" active={dealType === 'WOLSE'} onPress={() => setDealType('WOLSE')} />
                <DealTypeChip label="반전세" active={dealType === 'BAN_JEONSE'} onPress={() => setDealType('BAN_JEONSE')} />
              </View>
              <Input placeholder="보증금 (만원)" value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
              <Input placeholder="월세 (만원)" value={rent} onChangeText={setRent} keyboardType="numeric" />
              <Input placeholder="관리비 (만원)" value={maintenance} onChangeText={setMaintenance} keyboardType="numeric" />
              <Input placeholder="전용면적 (평)" value={area} onChangeText={setArea} keyboardType="numeric" />
              <Input placeholder="층" value={floor} onChangeText={setFloor} keyboardType="numeric" />
            </Card>

            <Card>
              <Text style={typography.caption}>주관 평가</Text>
              {(['waterPressure','sunlight','noise','insulation','ventilation','moisture','neighborhood','firstImpression'] as const).map((k) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                  <Text style={typography.body}>{labelOf(k)}</Text>
                  <StarRating
                    value={ratings[k] ?? 0}
                    onChange={(v) => setRatings((r) => ({ ...r, [k]: v }))}
                  />
                </View>
              ))}
            </Card>

            <Card>
              <Text style={typography.caption}>사진</Text>
              <View style={{ marginTop: spacing.sm }}>
                <PhotoGrid photos={photos} onAdd={handleAddPhoto} onRemove={handleRemovePhoto} />
              </View>
            </Card>

            <Card>
              <Text style={typography.caption}>메모</Text>
              <Input
                placeholder="장단점·코멘트·협상여지 등 자유롭게"
                value={memo}
                onChangeText={setMemo}
                multiline
              />
            </Card>
          </>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: spacing.xl, left: spacing.xl, right: spacing.xl }}>
        <Button label={isPending ? '저장 중...' : '저장'} onPress={handleSave} disabled={isPending} />
      </View>
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

function ModeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radii.pill,
        backgroundColor: active ? colors.ink : 'transparent',
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
      }}
    >
      <Text style={[typography.bodyBold, { color: active ? colors.white : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

function DealTypeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: active ? colors.accentGreen : colors.white,
        borderWidth: 1,
        borderColor: active ? colors.accentGreen : colors.border,
      }}
    >
      <Text style={[typography.caption, { color: active ? colors.white : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

function Input({ multiline, ...rest }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={colors.inkMuted}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: spacing.md,
        marginTop: spacing.sm,
        backgroundColor: colors.white,
        color: colors.ink,
        minHeight: multiline ? 80 : undefined,
      }}
    />
  );
}
