import { useQuery } from '@tanstack/react-query';
import { AnchorDistance, AnchorPlace, House } from '@/types';
import { routeDistance } from '@/integrations/kakaoDirections';
import {
  getAnchorCoordinate,
  getHouseCoordinate,
  haversineKm,
  type MapCoordinate,
} from '@/screens/houses/houseMapUtils';
import { useAnchorPlaces } from './anchorPlaces.queries';

type AnchorTarget = { anchor: AnchorPlace; coord: MapCoordinate };

/**
 * 집 ↔ 등록된 거점(직장/학교)의 거리.
 * 카카오 자동차 길찾기(도로 거리 + 차 시간)를 우선 쓰고, 실패하면 직선거리로 폴백.
 * 거점은 최대 2개이므로 호출당 ≤2 요청 — **집 상세 화면 1곳에서만 사용**한다.
 */
export function useAnchorDistances(house: House | null | undefined) {
  const { data: anchors = [] } = useAnchorPlaces();
  const houseCoord = house ? getHouseCoordinate(house) : null;

  // 좌표가 잡힌 거점만 대상. queryKey에 좌표를 넣어 캐싱.
  const targets: AnchorTarget[] = [];
  for (const a of anchors) {
    const coord = getAnchorCoordinate(a);
    if (coord) targets.push({ anchor: a, coord });
  }

  const keyPart = targets.map(
    (t) => `${t.anchor.anchorType}:${t.coord.latitude},${t.coord.longitude}`,
  );

  const query = useQuery({
    queryKey: ['anchorDistances', house?.id, houseCoord, keyPart],
    enabled: Boolean(houseCoord) && targets.length > 0,
    queryFn: async (): Promise<AnchorDistance[]> => {
      if (!houseCoord) return [];
      const out: AnchorDistance[] = [];
      for (const { anchor, coord } of targets) {
        const route = await routeDistance(houseCoord, coord);
        if (route) {
          out.push({
            anchorType: anchor.anchorType,
            km: route.distanceM / 1000,
            source: 'driving',
            durationMin: Math.max(1, Math.round(route.durationSec / 60)),
          });
        } else {
          out.push({
            anchorType: anchor.anchorType,
            km: haversineKm(houseCoord, coord),
            source: 'straight-line',
          });
        }
      }
      return out;
    },
  });

  return { distances: query.data ?? [], isLoading: query.isLoading && targets.length > 0 };
}
