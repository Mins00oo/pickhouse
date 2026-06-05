import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceType, TransportMode } from '@/types';
import { HouseStackParamList } from '@/navigation/types';
import { PLACE_META, PLACE_ORDER } from '@/screens/houses/placeMeta';
import { useMyPlaces, useSavePlace } from '@/queries/myPlaces.queries';
import { PlaceSearchResult, placeToAddress } from '@/integrations/kakaoPlaceSearch';
import type { MapCoordinate } from '@/screens/houses/houseMapUtils';
import { colors } from '@/theme';
import { PlacesHeader } from './components/PlacesHeader';
import { TransportPicker } from './components/TransportPicker';
import { KakaoPlaceSearchOverlay } from './components/KakaoPlaceSearchOverlay';

type Props = NativeStackScreenProps<HouseStackParamList, 'AddPlace'>;

export function AddPlaceScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const placeId = route.params?.placeId;
  const { data: places = [] } = useMyPlaces();
  const existing = useMemo(() => places.find((p) => p.id === placeId), [places, placeId]);
  const savePlace = useSavePlace();

  const [kind, setKind] = useState<PlaceType>('WORKPLACE');
  const [picked, setPicked] = useState<PlaceSearchResult | null>(null);
  const [label, setLabel] = useState('');
  const [transport, setTransport] = useState<TransportMode>('TRANSIT');
  const [isPrimary, setIsPrimary] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [origin, setOrigin] = useState<MapCoordinate | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  // 수정 모드: 비동기로 로드된 기존 내 장소 값으로 폼을 1회 프리필(외부 데이터 → 로컬 폼 동기화).
  useEffect(() => {
    if (hydrated || !existing) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setKind(existing.placeType);
    setLabel(existing.label ?? '');
    setTransport(existing.transport);
    setIsPrimary(existing.isPrimary);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [existing, hydrated]);

  // 거리 표시용 현재 위치(권한 있으면). 없으면 거리 생략.
  useEffect(() => {
    let mounted = true;
    Location.getLastKnownPositionAsync()
      .then((pos) => {
        if (mounted && pos) setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const display = picked
    ? { name: picked.placeName, category: picked.category, addr: picked.roadAddressName || picked.addressName }
    : existing
      ? { name: existing.label || PLACE_META[existing.placeType].label, category: undefined, addr: existing.address.roadAddress || existing.address.jibunAddress }
      : null;

  const canSave = Boolean(picked || existing) && !savePlace.isPending;

  const handlePick = (r: PlaceSearchResult) => {
    setPicked(r);
    setLabel(r.placeName);
    setSearchOpen(false);
  };

  const handleSave = async () => {
    const address = picked ? placeToAddress(picked) : existing?.address;
    if (!address) return;
    await savePlace.mutateAsync({
      id: existing?.id,
      placeType: kind,
      address,
      transport,
      isPrimary,
      label: label.trim() || undefined,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <PlacesHeader title={existing ? '장소 수정' : '장소 추가'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* 장소 종류 */}
        <Text style={styles.sectionTitle}>장소 종류</Text>
        <View style={styles.kindRow}>
          {PLACE_ORDER.map((type) => {
            const meta = PLACE_META[type];
            const on = type === kind;
            return (
              <Pressable
                key={type}
                testID={`place-kind-${type}`}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => setKind(type)}
                style={[styles.kindCell, on && { backgroundColor: meta.soft, borderColor: meta.color }]}
              >
                <Ionicons name={meta.icon as never} size={22} color={on ? meta.color : colors.muted} />
                <Text style={[styles.kindLabel, on && { color: meta.color, fontWeight: '700' }]}>{meta.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* 회사·학교 검색 */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>회사·학교 검색</Text>
        {display ? (
          <View style={styles.pickedCard}>
            <View style={styles.pickedIcon}>
              <Ionicons name="location" size={17} color={colors.primary} />
            </View>
            <View style={styles.pickedMain}>
              {display.category ? <Text style={styles.catBadge}>{display.category}</Text> : null}
              <Text style={styles.pickedName} numberOfLines={2}>
                {display.name}
              </Text>
              <Text style={styles.pickedAddr} numberOfLines={1}>
                {display.addr}
              </Text>
            </View>
            <Pressable testID="place-change" accessibilityRole="button" hitSlop={8} onPress={() => setSearchOpen(true)}>
              <Text style={styles.changeLink}>변경</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID="place-search-open"
            accessibilityRole="button"
            onPress={() => setSearchOpen(true)}
            style={styles.searchTrigger}
          >
            <Ionicons name="search" size={17} color={colors.muted} />
            <Text style={styles.searchTriggerText}>회사·학교 이름으로 검색</Text>
            <View style={styles.kakaoBtn}>
              <Text style={styles.kakaoBtnText}>kakao 검색</Text>
            </View>
          </Pressable>
        )}

        {/* 표시 이름 */}
        <View style={[styles.labelRow, styles.sectionGap]}>
          <Text style={styles.sectionTitle}>표시 이름</Text>
          <Text style={styles.hint}>카드엔 아이콘만 표시 · 짧게 권장</Text>
        </View>
        <View style={styles.labelInputWrap}>
          <TextInput
            testID="place-label-input"
            value={label}
            onChangeText={setLabel}
            placeholder="예: 판교 회사"
            placeholderTextColor={colors.muted}
            style={styles.labelInput}
          />
        </View>

        {/* 주 이동수단 */}
        <View style={[styles.labelRow, styles.sectionGap]}>
          <Text style={styles.sectionTitle}>주 이동수단</Text>
          <Text style={styles.hint}>통근시간 계산 기준</Text>
        </View>
        <TransportPicker value={transport} onChange={setTransport} />

        {/* 주 통근지 토글 */}
        <View style={[styles.primaryRow, styles.sectionGap]}>
          <View style={styles.primaryIcon}>
            <Ionicons name="checkmark" size={17} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryTitle}>주 통근지로 설정</Text>
            <Text style={styles.primarySub}>집 카드에 이 장소까지의 시간이 표시돼요</Text>
          </View>
          <Switch
            testID="place-primary-toggle"
            value={isPrimary}
            onValueChange={setIsPrimary}
            trackColor={{ true: colors.primary, false: colors.borderHard }}
            thumbColor={colors.white}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          testID="place-save"
          accessibilityRole="button"
          disabled={!canSave}
          onPress={handleSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          {savePlace.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>장소 저장하기</Text>
          )}
        </Pressable>
      </View>

      {searchOpen ? (
        <KakaoPlaceSearchOverlay origin={origin} onClose={() => setSearchOpen(false)} onPick={handlePick} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  body: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3, marginBottom: 9 },
  sectionGap: { marginTop: 22 },
  kindRow: { flexDirection: 'row', gap: 8 },
  kindCell: {
    flex: 1,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderHard,
    backgroundColor: colors.white,
  },
  kindLabel: { fontSize: 13, fontWeight: '600', color: colors.ink70 },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  searchTriggerText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.muted, letterSpacing: -0.3 },
  kakaoBtn: { height: 38, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.kakaoYellow },
  kakaoBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.kakaoInk },
  pickedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.borderHard,
    backgroundColor: colors.white,
  },
  pickedIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, marginTop: 1 },
  pickedMain: { flex: 1, minWidth: 0 },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    color: colors.muted,
    fontSize: 9.5,
    fontWeight: '600',
  },
  pickedName: { fontSize: 14.5, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3, marginTop: 3, lineHeight: 19 },
  pickedAddr: { fontSize: 11.5, fontWeight: '500', color: colors.muted, marginTop: 3 },
  changeLink: { fontSize: 12.5, fontWeight: '600', color: colors.primary },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  hint: { fontSize: 11.5, fontWeight: '500', color: colors.muted },
  labelInputWrap: { height: 52, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 13, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.white },
  labelInput: { fontSize: 15, fontWeight: '600', color: colors.inkStrong, letterSpacing: -0.3, paddingVertical: 0 },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  primaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  primaryTitle: { fontSize: 13.5, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 },
  primarySub: { fontSize: 11, fontWeight: '500', color: colors.muted, marginTop: 1 },
  footer: { paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft, backgroundColor: colors.white },
  saveBtn: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.inkStrong },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15.5, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
});
