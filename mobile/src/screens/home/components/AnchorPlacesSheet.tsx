import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NaverMapMarkerOverlay, NaverMapView } from '@mj-studio/react-native-naver-map';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnchorType } from '@/types';
import { colors, radii, spacing, typography } from '@/theme';
import {
  PlaceSearchResult,
  placeToAddress,
  searchPlaces,
} from '@/integrations/kakaoPlaceSearch';
import {
  useAnchorPlaces,
  useClearAnchorPlace,
  useSetAnchorPlace,
} from '@/queries/anchorPlaces.queries';
import { ANCHOR_META, ANCHOR_ORDER } from '@/screens/houses/anchorMeta';

const SEARCH_DEBOUNCE_MS = 300;

export function AnchorPlacesSheet({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { data: anchors = [] } = useAnchorPlaces();
  const setAnchor = useSetAnchorPlace();
  const clearAnchor = useClearAnchorPlace();
  const [editing, setEditing] = useState<AnchorType | null>(null);

  const byType = useMemo(() => {
    const map = new Map<AnchorType, (typeof anchors)[number]>();
    for (const a of anchors) map.set(a.anchorType, a);
    return map;
  }, [anchors]);

  const handleConfirm = async (type: AnchorType, result: PlaceSearchResult) => {
    await setAnchor.mutateAsync({
      anchorType: type,
      address: placeToAddress(result),
      label: result.placeName,
    });
    setEditing(null);
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.dim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View testID="anchor-sheet" style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{editing ? `${ANCHOR_META[editing].label} 위치` : '내 직장 · 학교'}</Text>
              <Text style={styles.subtitle}>
                {editing
                  ? '이름으로 검색해 선택하세요'
                  : '등록하면 집 상세에서 통근·통학 거리를 알려드려요'}
              </Text>
            </View>
            <Pressable
              testID="anchor-sheet-close"
              accessibilityRole="button"
              accessibilityLabel="닫기"
              hitSlop={12}
              onPress={editing ? () => setEditing(null) : onClose}
            >
              <Ionicons name={editing ? 'arrow-back' : 'close'} size={22} color={colors.ink} />
            </Pressable>
          </View>

          {editing ? (
            <AnchorSearch
              anchorType={editing}
              busy={setAnchor.isPending}
              onConfirm={handleConfirm}
            />
          ) : (
            <View style={styles.rows}>
              {ANCHOR_ORDER.map((type) => {
                const place = byType.get(type);
                const meta = ANCHOR_META[type];
                return (
                  <View key={type} testID={`anchor-row-${type}`} style={styles.row}>
                    <View style={styles.rowIcon}>
                      <Ionicons name={meta.icon as never} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowLabel}>{meta.label}</Text>
                      {place ? (
                        <>
                          <Text style={styles.rowPlace} numberOfLines={1}>
                            {place.label ?? meta.label}
                          </Text>
                          <Text style={styles.rowAddress} numberOfLines={1}>
                            {place.address.roadAddress || place.address.jibunAddress}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.rowEmpty}>아직 등록 전이에요</Text>
                      )}
                    </View>
                    {place ? (
                      <View style={styles.rowActions}>
                        <Pressable
                          testID={`anchor-edit-${type}`}
                          accessibilityRole="button"
                          hitSlop={8}
                          onPress={() => setEditing(type)}
                          style={styles.smallAction}
                        >
                          <Text style={styles.smallActionText}>변경</Text>
                        </Pressable>
                        <Pressable
                          testID={`anchor-clear-${type}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${meta.label} 삭제`}
                          hitSlop={8}
                          onPress={() => clearAnchor.mutate(type)}
                          style={styles.smallAction}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.muted} />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        testID={`anchor-register-${type}`}
                        accessibilityRole="button"
                        onPress={() => setEditing(type)}
                        style={styles.registerButton}
                      >
                        <Text style={styles.registerText}>등록</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function AnchorSearch({
  anchorType,
  busy,
  onConfirm,
}: {
  anchorType: AnchorType;
  busy: boolean;
  onConfirm: (type: AnchorType, result: PlaceSearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PlaceSearchResult | null>(null);
  const reqId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 시 대기 중 타이머 정리.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // 디바운스 검색은 입력 핸들러에서 처리(이펙트 내 동기 setState 회피).
  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++reqId.current;
    timer.current = setTimeout(async () => {
      const found = await searchPlaces(q);
      if (id !== reqId.current) return; // 더 최신 검색이 있으면 폐기
      setResults(found);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
  };

  if (selected) {
    return (
      <View style={styles.previewWrap}>
        <View style={styles.previewCard}>
          <NaverMapView
            testID="anchor-preview-map"
            style={styles.previewMap}
            initialCamera={{
              latitude: selected.latitude,
              longitude: selected.longitude,
              zoom: 16,
            }}
            isShowCompass={false}
            isShowScaleBar={false}
            isShowZoomControls={false}
            isShowLocationButton={false}
          >
            <NaverMapMarkerOverlay
              latitude={selected.latitude}
              longitude={selected.longitude}
              anchor={{ x: 0.5, y: 1 }}
              caption={{ text: selected.placeName, textSize: 12 }}
            />
          </NaverMapView>
        </View>
        <Text style={styles.previewName}>{selected.placeName}</Text>
        <Text style={styles.previewAddress} numberOfLines={1}>
          {selected.roadAddressName || selected.addressName}
        </Text>
        <View style={styles.previewActions}>
          <Pressable
            testID="anchor-preview-back"
            accessibilityRole="button"
            onPress={() => setSelected(null)}
            style={[styles.previewButton, styles.previewButtonGhost]}
          >
            <Text style={styles.previewButtonGhostText}>다시 선택</Text>
          </Pressable>
          <Pressable
            testID="anchor-confirm-button"
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onConfirm(anchorType, selected)}
            style={[styles.previewButton, styles.previewButtonPrimary, busy && styles.previewButtonDisabled]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.previewButtonPrimaryText}>이 위치로 등록</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.searchWrap}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={colors.muted} />
        <TextInput
          testID="anchor-search-input"
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          placeholder={`${ANCHOR_META[anchorType].label} 이름 검색 (예: 연세대학교)`}
          placeholderTextColor={colors.inkMuted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searching ? <ActivityIndicator size="small" color={colors.muted} /> : null}
      </View>

      <ScrollView
        testID="anchor-search-results"
        keyboardShouldPersistTaps="handled"
        style={styles.resultList}
        contentContainerStyle={styles.resultContent}
      >
        {results.map((r, i) => (
          <Pressable
            key={`${r.placeName}-${i}`}
            testID={`anchor-result-${i}`}
            accessibilityRole="button"
            onPress={() => setSelected(r)}
            style={styles.resultRow}
          >
            <Text style={styles.resultName} numberOfLines={1}>
              {r.placeName}
            </Text>
            <Text style={styles.resultAddress} numberOfLines={1}>
              {r.roadAddressName || r.addressName}
            </Text>
          </Pressable>
        ))}
        {!searching && query.trim() && results.length === 0 ? (
          <Text style={styles.resultEmpty}>검색 결과가 없어요</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(14,26,20,0.35)',
  },
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
    maxHeight: '82%',
  },
  handle: {
    width: 40,
    height: 5,
    alignSelf: 'center',
    marginBottom: spacing.md,
    borderRadius: 3,
    backgroundColor: '#D8D5CD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading, color: colors.ink },
  subtitle: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  rows: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  rowIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowLabel: { ...typography.label, color: colors.ink },
  rowPlace: { ...typography.bodyBold, color: colors.ink, marginTop: 1 },
  rowAddress: { ...typography.caption, color: colors.inkMuted },
  rowEmpty: { ...typography.caption, color: colors.inkMuted, marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  smallAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallActionText: { ...typography.caption, color: colors.ink, fontWeight: '700' },
  registerButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  registerText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  searchWrap: { gap: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, minWidth: 0, ...typography.body, color: colors.ink, paddingVertical: 0 },
  resultList: { maxHeight: 320 },
  resultContent: { gap: 2 },
  resultRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  resultName: { ...typography.bodyBold, color: colors.ink },
  resultAddress: { ...typography.caption, color: colors.inkMuted, marginTop: 1 },
  resultEmpty: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  previewWrap: { gap: spacing.sm },
  previewCard: {
    height: 180,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  previewMap: { flex: 1 },
  previewName: { ...typography.bodyBold, color: colors.ink, marginTop: spacing.xs },
  previewAddress: { ...typography.caption, color: colors.inkMuted },
  previewActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  previewButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
  },
  previewButtonGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  previewButtonGhostText: { ...typography.bodyBold, color: colors.ink },
  previewButtonPrimary: { backgroundColor: colors.primary },
  previewButtonPrimaryText: { ...typography.bodyBold, color: colors.white },
  previewButtonDisabled: { opacity: 0.6 },
});
