import { useQueries, useQuery } from '@tanstack/react-query';
import { MyPlaceDistance, MyPlace, House } from '@/types';
import { estimateCommute } from '@/integrations/commuteEstimate';
import {
  getMyPlaceCoordinate,
  getHouseCoordinate,
  type MapCoordinate,
} from '@/screens/houses/houseMapUtils';
import { useMyPlaces } from './myPlaces.queries';

type MyPlaceTarget = { myPlace: MyPlace; coord: MapCoordinate };

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const COMMUTE_STALE_MS = 1000 * 60 * 60; // 1h — 좌표/수단이 같으면 재계산 불필요.

/**
 * 집 ↔ 등록된 모든 내 장소의 거리/시간. 각 내 장소의 이동수단(transport)으로 계산.
 * 자동차는 카카오 실측, 그 외는 추정. **집 상세 화면(MyPlaceDistanceCard)에서 사용**.
 */
export function useMyPlaceDistances(house: House | null | undefined) {
  const { data: myPlaces = [] } = useMyPlaces();
  const houseCoord = house ? getHouseCoordinate(house) : null;

  const targets: MyPlaceTarget[] = [];
  for (const a of myPlaces) {
    const coord = getMyPlaceCoordinate(a);
    if (coord) targets.push({ myPlace: a, coord });
  }

  const keyPart = targets.map(
    (t) => `${t.myPlace.placeType}:${t.myPlace.transport}:${t.coord.latitude},${t.coord.longitude}`,
  );

  const query = useQuery({
    queryKey: ['myPlaceDistances', house?.id, houseCoord, keyPart],
    enabled: Boolean(houseCoord) && targets.length > 0,
    queryFn: async (): Promise<MyPlaceDistance[]> => {
      if (!houseCoord) return [];
      const out: MyPlaceDistance[] = [];
      for (const { myPlace, coord } of targets) {
        const r = await estimateCommute(myPlace.transport, houseCoord, coord, KAKAO_KEY);
        out.push({
          placeType: myPlace.placeType,
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

export interface PrimaryMyPlaces {
  work: MyPlace | null;
  school: MyPlace | null;
}

/**
 * 메인 카드용 통근시간 — 한 집에서 주 통근지(직장/학교)까지 분 단위.
 * 대중교통/도보는 즉시 추정(API 호출 없음), 자동차만 카카오 실측(보이는 집으로 제한 + 캐시).
 */
export function useHouseCommute(house: House, myPlaces: PrimaryMyPlaces): { work?: number; school?: number } {
  const houseCoord = getHouseCoordinate(house);
  const items = (
    [
      myPlaces.work ? { kind: 'work' as const, myPlace: myPlaces.work } : null,
      myPlaces.school ? { kind: 'school' as const, myPlace: myPlaces.school } : null,
    ].filter(Boolean) as { kind: 'work' | 'school'; myPlace: MyPlace }[]
  ).map((it) => ({ ...it, coord: getMyPlaceCoordinate(it.myPlace) }));

  const results = useQueries({
    queries: items.map(({ myPlace, coord }) => ({
      queryKey: ['commute', house.id, myPlace.id, myPlace.transport, houseCoord, coord],
      enabled: Boolean(houseCoord && coord),
      staleTime: COMMUTE_STALE_MS,
      queryFn: async () =>
        houseCoord && coord ? estimateCommute(myPlace.transport, houseCoord, coord, KAKAO_KEY) : null,
    })),
  });

  const out: { work?: number; school?: number } = {};
  items.forEach((item, i) => {
    const min = results[i]?.data?.durationMin;
    if (typeof min === 'number') out[item.kind] = min;
  });
  return out;
}
