import { useQueries, useQuery } from '@tanstack/react-query';
import { AnchorDistance, AnchorPlace, House } from '@/types';
import { estimateCommute } from '@/integrations/commuteEstimate';
import {
  getAnchorCoordinate,
  getHouseCoordinate,
  type MapCoordinate,
} from '@/screens/houses/houseMapUtils';
import { useAnchorPlaces } from './anchorPlaces.queries';

type AnchorTarget = { anchor: AnchorPlace; coord: MapCoordinate };

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const COMMUTE_STALE_MS = 1000 * 60 * 60; // 1h — 좌표/수단이 같으면 재계산 불필요.

/**
 * 집 ↔ 등록된 모든 거점의 거리/시간. 각 거점의 이동수단(transport)으로 계산.
 * 자동차는 카카오 실측, 그 외는 추정. **집 상세 화면(AnchorDistanceCard)에서 사용**.
 */
export function useAnchorDistances(house: House | null | undefined) {
  const { data: anchors = [] } = useAnchorPlaces();
  const houseCoord = house ? getHouseCoordinate(house) : null;

  const targets: AnchorTarget[] = [];
  for (const a of anchors) {
    const coord = getAnchorCoordinate(a);
    if (coord) targets.push({ anchor: a, coord });
  }

  const keyPart = targets.map(
    (t) => `${t.anchor.anchorType}:${t.anchor.transport}:${t.coord.latitude},${t.coord.longitude}`,
  );

  const query = useQuery({
    queryKey: ['anchorDistances', house?.id, houseCoord, keyPart],
    enabled: Boolean(houseCoord) && targets.length > 0,
    queryFn: async (): Promise<AnchorDistance[]> => {
      if (!houseCoord) return [];
      const out: AnchorDistance[] = [];
      for (const { anchor, coord } of targets) {
        const r = await estimateCommute(anchor.transport, houseCoord, coord, KAKAO_KEY);
        out.push({
          anchorType: anchor.anchorType,
          km: r.km,
          source: r.source,
          durationMin: r.durationMin,
          mode: r.mode,
        });
      }
      return out;
    },
  });

  return { distances: query.data ?? [], isLoading: query.isLoading && targets.length > 0 };
}

export interface PrimaryAnchors {
  work: AnchorPlace | null;
  school: AnchorPlace | null;
}

/**
 * 메인 카드용 통근시간 — 한 집에서 주 통근지(직장/학교)까지 분 단위.
 * 대중교통/도보는 즉시 추정(API 호출 없음), 자동차만 카카오 실측(보이는 집으로 제한 + 캐시).
 */
export function useHouseCommute(house: House, anchors: PrimaryAnchors): { work?: number; school?: number } {
  const houseCoord = getHouseCoordinate(house);
  const items = (
    [
      anchors.work ? { kind: 'work' as const, anchor: anchors.work } : null,
      anchors.school ? { kind: 'school' as const, anchor: anchors.school } : null,
    ].filter(Boolean) as { kind: 'work' | 'school'; anchor: AnchorPlace }[]
  ).map((it) => ({ ...it, coord: getAnchorCoordinate(it.anchor) }));

  const results = useQueries({
    queries: items.map(({ anchor, coord }) => ({
      queryKey: ['commute', house.id, anchor.id, anchor.transport, houseCoord, coord],
      enabled: Boolean(houseCoord && coord),
      staleTime: COMMUTE_STALE_MS,
      queryFn: async () =>
        houseCoord && coord ? estimateCommute(anchor.transport, houseCoord, coord, KAKAO_KEY) : null,
    })),
  });

  const out: { work?: number; school?: number } = {};
  items.forEach((item, i) => {
    const min = results[i]?.data?.durationMin;
    if (typeof min === 'number') out[item.kind] = min;
  });
  return out;
}
