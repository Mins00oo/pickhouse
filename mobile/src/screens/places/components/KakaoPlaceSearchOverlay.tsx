import { useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceSearchResult, searchPlaces } from '@/integrations/kakaoPlaceSearch';
import type { MapCoordinate } from '@/screens/houses/houseMapUtils';
import { formatKm } from '@/screens/houses/houseMapUtils';
import { colors } from '@/theme';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * 전체화면 카카오 장소(회사·학교 이름) 검색 오버레이.
 * 결과 = 장소명 + 카테고리 뱃지 + 도로명 주소 + (origin 있으면) 거리.
 */
export function KakaoPlaceSearchOverlay({
  origin,
  onClose,
  onPick,
}: {
  origin?: MapCoordinate;
  onClose: () => void;
  onPick: (result: PlaceSearchResult) => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const reqId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

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
      const found = await searchPlaces(q, undefined, origin);
      if (id !== reqId.current) return;
      setResults(found);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable
            testID="kakao-search-back"
            accessibilityRole="button"
            accessibilityLabel="닫기"
            hitSlop={10}
            onPress={onClose}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={colors.ink70} />
          </Pressable>
          <Text style={styles.title}>회사·학교 검색</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            testID="kakao-search-input"
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            placeholder="회사·학교 이름으로 검색"
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searching ? <ActivityIndicator size="small" color={colors.muted} /> : null}
        </View>

        <View style={styles.hintRow}>
          <Text style={styles.kakaoBadge}>kakao</Text>
          <Text style={styles.hintText}>카카오맵 장소 검색 기반</Text>
        </View>

        <ScrollView
          testID="kakao-search-results"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {results.map((r, i) => (
            <Pressable
              key={`${r.placeName}-${i}`}
              testID={`kakao-result-${i}`}
              accessibilityRole="button"
              onPress={() => onPick(r)}
              style={styles.resultRow}
            >
              <View style={styles.resultIcon}>
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>
              <View style={styles.resultMain}>
                <View style={styles.resultTitleLine}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {r.placeName}
                  </Text>
                  {typeof r.distanceM === 'number' ? (
                    <Text style={styles.resultDist}>{formatKm(r.distanceM / 1000)}</Text>
                  ) : null}
                </View>
                <View style={styles.resultSubLine}>
                  {r.category ? <Text style={styles.catBadge}>{r.category}</Text> : null}
                  <Text style={styles.resultAddr} numberOfLines={1}>
                    {r.roadAddressName || r.addressName}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
          {!searching && query.trim() && results.length === 0 ? (
            <Text style={styles.empty}>검색 결과가 없어요</Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '600', color: colors.inkStrong, paddingVertical: 0 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  kakaoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.kakaoYellow,
    color: colors.kakaoInk,
    fontSize: 9.5,
    fontWeight: '800',
  },
  hintText: { fontSize: 11, fontWeight: '500', color: colors.muted },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginTop: 1,
  },
  resultMain: { flex: 1, minWidth: 0 },
  resultTitleLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  resultName: { flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 },
  resultDist: { fontSize: 10.5, fontWeight: '500', color: colors.muted },
  resultSubLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  catBadge: {
    paddingHorizontal: 5,
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
  resultAddr: { flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: '500', color: colors.ink70 },
  empty: { textAlign: 'center', paddingVertical: 40, fontSize: 14, color: colors.muted },
});
