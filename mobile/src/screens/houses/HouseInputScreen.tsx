import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { PhotoGrid } from '@/components/PhotoGrid';
import { cameraHelper } from '@/photos/cameraHelper';
import { photosRepo } from '@/db/photos.repo';
import { useCreateHouse, useHouse, useUpdateHouse } from '@/queries/houses.queries';
import { KakaoAddressPicker } from '@/integrations/kakaoAddress';
import { geocodeAddress } from '@/integrations/kakaoGeocode';
import {
  Address,
  DealType,
  Direction,
  FloorType,
  HouseDraft,
  HouseStackParamList,
  Photo,
  RoomType,
} from '@/types';
import { colors } from '@/theme';
import { CONDITION_KEYS, CONDITION_META, ConditionKey, normalizeConditionLevel } from './conditionMeta';
import { MAINTENANCE_OPTIONS, ROOM_TYPE_OPTIONS } from './wizardConstants';
import { StepTabs } from './components/wizard/StepTabs';
import { SegmentedControl } from './components/wizard/SegmentedControl';
import { Chips } from './components/wizard/Chips';
import { TriStateRow } from './components/wizard/TriStateRow';
import { SwitchRow } from './components/wizard/SwitchRow';
import { AmountInput } from './components/wizard/AmountInput';
import { PyeongInput } from './components/wizard/PyeongInput';
import { FloorTypeInput } from './components/wizard/FloorTypeInput';
import { DirectionPicker } from './components/wizard/DirectionPicker';
import { Field, FieldLabel } from './components/wizard/FieldLabel';
import { BottomBar } from './components/wizard/BottomBar';
import { AddressField } from './components/wizard/AddressField';
import { DateField } from './components/wizard/DateField';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseInput'>;
type WizardDealType = Extract<DealType, 'WOLSE' | 'JEONSE'>;
type SeparateUtility = 'WATER' | 'ELECTRIC' | 'GAS';

// 별도 납부 입력은 전기·가스만 (수도/인터넷은 보통 정액 포함). 디자인의 METER=[전기,가스]와 일치.
const SEPARATE_UTILITY_OPTIONS: { code: SeparateUtility; label: string }[] = [
  { code: 'ELECTRIC', label: '전기' },
  { code: 'GAS', label: '가스' },
];

interface WizardForm {
  dealType: WizardDealType;
  nickname: string;
  address: Address | null;
  detail: string;
  visitedAt: string;
  deposit: string;
  rent: string;
  maintenanceFee: string;
  maintenanceIncludes: number[]; // indices into MAINTENANCE_OPTIONS
  utilityEstimates: Partial<Record<SeparateUtility, string>>;
  roomType?: RoomType;
  area: string;
  floorType: FloorType;
  floor: string;
  totalFloor: string;
  direction?: Direction;
  cond: Partial<Record<ConditionKey, 1 | 2 | 3>>;
  facilities: { hasElevator: boolean; hasParking: boolean; fullOption: boolean };
  memo: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const INITIAL: WizardForm = {
  dealType: 'WOLSE',
  nickname: '',
  address: null,
  detail: '',
  visitedAt: today(),
  deposit: '',
  rent: '',
  maintenanceFee: '',
  maintenanceIncludes: [],
  utilityEstimates: {},
  roomType: undefined,
  area: '',
  floorType: 'GROUND',
  floor: '',
  totalFloor: '',
  direction: undefined,
  cond: {},
  facilities: { hasElevator: false, hasParking: false, fullOption: false },
  memo: '',
};

const intOrUndef = (s: string): number | undefined => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
};

export function HouseInputScreen({ navigation, route }: Props) {
  const houseId = route.params?.houseId;
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<WizardForm>(INITIAL);
  const [addrOpen, setAddrOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [existingPhotoIds, setExistingPhotoIds] = useState<string[]>([]);
  const [tempHouseId] = useState(() => Crypto.randomUUID());
  const didPrefill = useRef(false);

  const { mutateAsync: createHouse, isPending } = useCreateHouse();
  const { mutateAsync: updateHouse, isPending: isUpdating } = useUpdateHouse();
  const { data: editingHouse } = useHouse(typeof houseId === 'string' ? houseId : undefined);
  const workingHouseId = typeof houseId === 'string' ? houseId : tempHouseId;
  const saving = isPending || isUpdating;

  const set = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!editingHouse || didPrefill.current) return;
    didPrefill.current = true;
    const includes = (editingHouse.maintenanceIncludes ?? [])
      .map((code) => MAINTENANCE_OPTIONS.findIndex((o) => o.code === code))
      .filter((i) => i >= 0);
    const estimates: Partial<Record<SeparateUtility, string>> = {};
    if (editingHouse.utilityEstimates) {
      for (const { code: c } of SEPARATE_UTILITY_OPTIONS) {
        const v = editingHouse.utilityEstimates[c];
        if (typeof v === 'number') estimates[c] = String(v);
      }
    }
    setForm({
      dealType: editingHouse.dealType === 'JEONSE' ? 'JEONSE' : 'WOLSE',
      nickname: editingHouse.nickname ?? '',
      address: editingHouse.address,
      detail: editingHouse.address.detail ?? '',
      visitedAt: editingHouse.visitedAt ?? editingHouse.createdAt?.slice(0, 10) ?? today(),
      deposit: String(editingHouse.deposit ?? ''),
      rent: editingHouse.rent == null ? '' : String(editingHouse.rent),
      maintenanceFee: editingHouse.maintenanceFee == null ? '' : String(editingHouse.maintenanceFee),
      maintenanceIncludes: includes,
      utilityEstimates: estimates,
      roomType: editingHouse.roomType,
      area: editingHouse.area == null ? '' : String(editingHouse.area),
      floorType: editingHouse.floorType ?? (editingHouse.floor != null ? 'GROUND' : 'GROUND'),
      floor: editingHouse.floor == null ? '' : String(editingHouse.floor),
      totalFloor: editingHouse.totalFloor == null ? '' : String(editingHouse.totalFloor),
      direction: editingHouse.direction,
      cond: {
        sunlight: normalizeConditionLevel(editingHouse.sunlight),
        waterPressure: normalizeConditionLevel(editingHouse.waterPressure),
        moisture: normalizeConditionLevel(editingHouse.moisture),
        noise: normalizeConditionLevel(editingHouse.noise),
        ventilation: normalizeConditionLevel(editingHouse.ventilation),
      },
      facilities: {
        hasElevator: editingHouse.hasElevator ?? false,
        hasParking: editingHouse.hasParking ?? false,
        fullOption: editingHouse.fullOption ?? false,
      },
      memo: editingHouse.memo ?? '',
    });
    setExistingPhotoIds(editingHouse.photoIds ?? []);
  }, [editingHouse]);

  function handleAddressPicked(base: Address) {
    setAddrOpen(false);
    set('detail', '');
    set('address', base);
    setGeocoding(true);
    void geocodeAddress(base.roadAddress || base.jibunAddress)
      .then((coord) => {
        if (!coord) return;
        setForm((f) => ({
          ...f,
          address: f.address
            ? { ...f.address, latitude: coord.latitude, longitude: coord.longitude }
            : { ...base, latitude: coord.latitude, longitude: coord.longitude },
        }));
      })
      .finally(() => setGeocoding(false));
  }

  async function handleAddPhoto() {
    const captured = await cameraHelper.takePhoto(workingHouseId);
    if (captured) {
      setPhotos((p) => [
        ...p,
        {
          id: captured.id,
          houseId: workingHouseId,
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

  function buildDraft(): HouseDraft {
    const finalAddress: Address = {
      ...(form.address as Address),
      detail: form.detail.trim() || undefined,
    };
    const includedCodes = form.maintenanceIncludes.map((i) => MAINTENANCE_OPTIONS[i]!.code);
    const estimates: Partial<Record<SeparateUtility, number>> = {};
    SEPARATE_UTILITY_OPTIONS.forEach(({ code: c }) => {
      if (!includedCodes.includes(c)) {
        const n = intOrUndef(form.utilityEstimates[c] ?? '');
        if (n != null && n > 0) estimates[c] = n;
      }
    });
    const photoIds = Array.from(new Set([...existingPhotoIds, ...photos.map((p) => p.id)]));
    return {
      address: finalAddress,
      dealType: form.dealType,
      deposit: intOrUndef(form.deposit) ?? 0,
      rent: form.dealType === 'JEONSE' ? undefined : (intOrUndef(form.rent) ?? 0),
      maintenanceFee: intOrUndef(form.maintenanceFee),
      area: form.area ? Number(form.area) : undefined,
      floor: form.floorType === 'GROUND' ? intOrUndef(form.floor) : undefined,
      totalFloor: intOrUndef(form.totalFloor),
      hasElevator: form.facilities.hasElevator,
      hasParking: form.facilities.hasParking,
      memo: form.memo.trim() || undefined,
      nickname: form.nickname.trim() || undefined,
      visitedAt: form.visitedAt || undefined,
      roomType: form.roomType,
      floorType: form.floorType,
      direction: form.direction,
      maintenanceIncludes: includedCodes.length ? includedCodes : undefined,
      utilityEstimates: Object.keys(estimates).length ? estimates : undefined,
      fullOption: form.facilities.fullOption,
      sunlight: form.cond.sunlight,
      waterPressure: form.cond.waterPressure,
      moisture: form.cond.moisture,
      noise: form.cond.noise,
      ventilation: form.cond.ventilation,
      photoIds,
    };
  }

  async function handleSave() {
    if (!form.nickname.trim()) {
      setStep(1);
      Alert.alert('집 별칭을 입력해주세요');
      return;
    }
    if (!form.address) {
      setStep(1);
      Alert.alert('주소를 선택해주세요');
      return;
    }
    if (!form.deposit) {
      setStep(2);
      Alert.alert(form.dealType === 'JEONSE' ? '전세금을 입력해주세요' : '보증금을 입력해주세요');
      return;
    }
    if (form.dealType !== 'JEONSE' && !form.rent) {
      setStep(2);
      Alert.alert('월세를 입력해주세요');
      return;
    }
    const draft = buildDraft();
    if (typeof houseId === 'string') {
      await updateHouse({ id: houseId, patch: draft });
    } else {
      await createHouse({ id: tempHouseId, ...draft });
    }
    navigation.goBack();
  }

  const includedCodes = form.maintenanceIncludes.map((i) => MAINTENANCE_OPTIONS[i]!.code);
  const separateUtilities = SEPARATE_UTILITY_OPTIONS.filter((o) => !includedCodes.includes(o.code));
  const includedLabels = form.maintenanceIncludes
    .map((i) => MAINTENANCE_OPTIONS[i]?.label)
    .filter((l): l is string => Boolean(l));
  const separateLabels = separateUtilities.map((o) => o.label);
  const maintenanceFeeNum = parseInt(form.maintenanceFee || '', 10) || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
      <StepTabs step={step} onJump={setStep} onClose={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <Field>
                <FieldLabel required>거래 유형</FieldLabel>
                <SegmentedControl
                  testIDPrefix="dealtype"
                  options={['월세', '전세']}
                  value={form.dealType === 'WOLSE' ? 0 : 1}
                  onChange={(i) => {
                    const next: WizardDealType = i === 0 ? 'WOLSE' : 'JEONSE';
                    setForm((f) => ({ ...f, dealType: next, rent: next === 'JEONSE' ? '' : f.rent }));
                  }}
                />
              </Field>
              <Field>
                <FieldLabel required>집 별칭</FieldLabel>
                <LineInput
                  testID="nickname-input"
                  value={form.nickname}
                  onChangeText={(t) => set('nickname', t)}
                  placeholder="예: 청파동 빌라"
                  icon="home-outline"
                />
              </Field>
              <Field>
                <FieldLabel required>주소</FieldLabel>
                <AddressField
                  address={form.address}
                  detail={form.detail}
                  geocoding={geocoding}
                  onSearch={() => setAddrOpen(true)}
                  onChangeDetail={(t) => set('detail', t)}
                />
              </Field>
              <Field>
                <FieldLabel hint="기본: 오늘">방문일</FieldLabel>
                <DateField value={form.visitedAt} onChange={(iso) => set('visitedAt', iso)} />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field>
                <FieldLabel required>{form.dealType === 'WOLSE' ? '보증금 / 월세' : '전세금'}</FieldLabel>
                {form.dealType === 'WOLSE' ? (
                  <View style={{ gap: 8 }}>
                    <AmountInput
                      testID="amount-보증금"
                      label="보증금"
                      value={form.deposit}
                      onChangeText={(t) => set('deposit', t)}
                    />
                    <AmountInput
                      testID="amount-월세"
                      label="월세"
                      value={form.rent}
                      onChangeText={(t) => set('rent', t)}
                    />
                  </View>
                ) : (
                  <AmountInput
                    testID="amount-전세금"
                    label="전세금"
                    value={form.deposit}
                    onChangeText={(t) => set('deposit', t)}
                  />
                )}
              </Field>
              <Field>
                <FieldLabel hint="없으면 0">관리비</FieldLabel>
                <AmountInput
                  testID="amount-관리비"
                  label="관리비"
                  value={form.maintenanceFee}
                  onChangeText={(t) => set('maintenanceFee', t)}
                />
              </Field>
              <Field>
                <FieldLabel hint="관리비에 포함된 항목을 골라주세요">관리비 포함 항목</FieldLabel>
                <Chips
                  multi
                  testIDPrefix="maint-include"
                  options={MAINTENANCE_OPTIONS.map((o) => o.label)}
                  value={form.maintenanceIncludes}
                  onToggle={(i) =>
                    setForm((f) => ({
                      ...f,
                      maintenanceIncludes: f.maintenanceIncludes.includes(i)
                        ? f.maintenanceIncludes.filter((x) => x !== i)
                        : [...f.maintenanceIncludes, i],
                    }))
                  }
                />
              </Field>
              {separateUtilities.length > 0 ? (
                <Field>
                  <FieldLabel hint="관리비에 안 들어간 항목">별도 납부 (월 예상)</FieldLabel>
                  <View style={{ gap: 8 }}>
                    {separateUtilities.map(({ code: c, label }) => (
                      <AmountInput
                        key={c}
                        testID={`utility-${label}`}
                        label={`${label} 별도`}
                        value={form.utilityEstimates[c] ?? ''}
                        onChangeText={(t) =>
                          setForm((f) => ({
                            ...f,
                            utilityEstimates: { ...f.utilityEstimates, [c]: t },
                          }))
                        }
                      />
                    ))}
                  </View>
                </Field>
              ) : null}

              <View
                testID="maintenance-summary"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 9,
                  padding: 13,
                  borderRadius: 13,
                  backgroundColor: colors.primarySoft,
                }}
              >
                <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '500', color: colors.primaryDark, lineHeight: 18, letterSpacing: -0.2 }}>
                  관리비 <Text style={{ fontWeight: '800' }}>{maintenanceFeeNum.toLocaleString('ko-KR')}만원</Text>
                  {includedLabels.length > 0 ? (
                    <Text>
                      에 <Text style={{ fontWeight: '800' }}>{includedLabels.join('·')}</Text> 포함
                    </Text>
                  ) : null}
                  {separateLabels.length > 0 ? (
                    <Text>
                      {' · '}
                      <Text style={{ fontWeight: '800' }}>{separateLabels.join('·')}</Text> 별도 납부
                    </Text>
                  ) : null}
                </Text>
              </View>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Field>
                <FieldLabel required>방 구조</FieldLabel>
                <Chips
                  testIDPrefix="roomtype"
                  options={ROOM_TYPE_OPTIONS.map((o) => o.label)}
                  value={ROOM_TYPE_OPTIONS.findIndex((o) => o.code === form.roomType)}
                  onToggle={(i) => {
                    const code = ROOM_TYPE_OPTIONS[i]!.code;
                    set('roomType', form.roomType === code ? undefined : code);
                  }}
                />
              </Field>
              <Field>
                <FieldLabel required hint="직접 입력하거나 눌러서 선택">평수</FieldLabel>
                <PyeongInput value={form.area} onChange={(t) => set('area', t)} />
              </Field>
              <Field>
                <FieldLabel required hint="층 유형을 먼저 선택">층수</FieldLabel>
                <FloorTypeInput
                  value={form.floorType}
                  onChange={(t) => set('floorType', t)}
                  floor={form.floor}
                  totalFloor={form.totalFloor}
                  onChangeFloor={(t) => set('floor', t)}
                  onChangeTotal={(t) => set('totalFloor', t)}
                />
              </Field>
              <Field>
                <FieldLabel hint="햇빛과 직결돼요">향</FieldLabel>
                <DirectionPicker value={form.direction} onChange={(d) => set('direction', d)} />
              </Field>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Field>
                <FieldLabel hint="보면서 느낀 점을 빠르게">컨디션 체크</FieldLabel>
                <View style={{ gap: 7 }}>
                  {CONDITION_KEYS.map((k) => (
                    <TriStateRow
                      key={k}
                      icon={CONDITION_META[k].icon}
                      label={CONDITION_META[k].label}
                      value={form.cond[k]}
                      onChange={(v) => setForm((f) => ({ ...f, cond: { ...f.cond, [k]: v } }))}
                    />
                  ))}
                </View>
              </Field>
              <Field>
                <FieldLabel>시설</FieldLabel>
                <View style={{ gap: 7 }}>
                  <SwitchRow
                    icon="git-network-outline"
                    label="엘리베이터"
                    value={form.facilities.hasElevator}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        facilities: { ...f.facilities, hasElevator: !f.facilities.hasElevator },
                      }))
                    }
                  />
                  <SwitchRow
                    icon="car-outline"
                    label="주차 가능"
                    value={form.facilities.hasParking}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        facilities: { ...f.facilities, hasParking: !f.facilities.hasParking },
                      }))
                    }
                  />
                  <SwitchRow
                    icon="home-outline"
                    label="풀옵션"
                    value={form.facilities.fullOption}
                    onToggle={() =>
                      setForm((f) => ({
                        ...f,
                        facilities: { ...f.facilities, fullOption: !f.facilities.fullOption },
                      }))
                    }
                  />
                </View>
              </Field>
              <Field>
                <FieldLabel hint="최대 10장">사진</FieldLabel>
                <PhotoGrid photos={photos} onAdd={handleAddPhoto} onRemove={handleRemovePhoto} />
              </Field>
              <Field>
                <FieldLabel hint="자유롭게">메모</FieldLabel>
                <TextInput
                  testID="memo-input"
                  accessibilityLabel="메모"
                  value={form.memo}
                  onChangeText={(t) => set('memo', t)}
                  multiline
                  placeholder="좋았던 점·아쉬운 점·협상 여지 등"
                  placeholderTextColor="#C7C3B8"
                  style={{
                    minHeight: 80,
                    backgroundColor: colors.white,
                    borderRadius: 13,
                    borderWidth: 1,
                    borderColor: colors.borderHard,
                    padding: 14,
                    fontSize: 14,
                    color: colors.inkStrong,
                    textAlignVertical: 'top',
                  }}
                />
              </Field>
            </>
          ) : null}
        </ScrollView>

        <BottomBar
          step={step}
          saving={saving}
          onSave={handleSave}
          onNext={() => setStep((s) => Math.min(4, s + 1))}
        />
      </KeyboardAvoidingView>

      <KakaoAddressPicker
        visible={addrOpen}
        onClose={() => setAddrOpen(false)}
        onSelect={handleAddressPicked}
      />
    </SafeAreaView>
  );
}

function LineInput({
  testID,
  value,
  onChangeText,
  placeholder,
  icon,
}: {
  testID: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon?: string;
}) {
  return (
    <View
      style={{
        height: 52,
        backgroundColor: colors.white,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: value ? colors.borderHard : colors.borderSoft,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 8,
      }}
    >
      {icon ? <Ionicons name={icon as never} size={18} color={colors.muted} /> : null}
      <TextInput
        testID={testID}
        accessibilityLabel={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.3,
          color: colors.inkStrong,
          padding: 0,
        }}
      />
    </View>
  );
}
