import { TransportMode } from '@/types';
import { haversineKm, type MapCoordinate } from '@/screens/houses/houseMapUtils';
import { routeDistance } from './kakaoDirections';

export interface CommuteResult {
  km: number;
  durationMin: number;
  source: 'driving' | 'estimate';
  mode: TransportMode;
}

// 수단별 평균 속도(km/h) + 도로 우회 계수.
// 직선거리를 실제 이동거리에 가깝게 보정한 뒤 평균 속도로 시간을 추정한다.
const ESTIMATE: Record<TransportMode, { speedKmh: number; detour: number }> = {
  CAR: { speedKmh: 25, detour: 1.3 }, // 도심 평균(신호 포함)
  TRANSIT: { speedKmh: 20, detour: 1.3 }, // 대중교통(대기·환승 포함 평균)
  WALK: { speedKmh: 4.5, detour: 1.2 },
};

function estimate(mode: TransportMode, origin: MapCoordinate, dest: MapCoordinate): CommuteResult {
  const straight = haversineKm(origin, dest);
  const { speedKmh, detour } = ESTIMATE[mode];
  const km = straight * detour;
  const durationMin = Math.max(1, Math.round((km / speedKmh) * 60));
  return { km, durationMin, source: 'estimate', mode };
}

/**
 * 집↔내 장소 통근시간/거리.
 * - 자동차(CAR): 카카오 자동차 길찾기 실측(도로거리 + 차 시간). 미가용 시 직선거리 추정으로 폴백.
 * - 대중교통/도보(TRANSIT/WALK): 직선거리 × 수단별 속도 추정(무료 길찾기 API가 자동차만 지원).
 */
export async function estimateCommute(
  mode: TransportMode,
  origin: MapCoordinate,
  dest: MapCoordinate,
  apiKey?: string,
): Promise<CommuteResult> {
  if (mode === 'CAR') {
    const route = await routeDistance(origin, dest, apiKey);
    if (route) {
      return {
        km: route.distanceM / 1000,
        durationMin: Math.max(1, Math.round(route.durationSec / 60)),
        source: 'driving',
        mode: 'CAR',
      };
    }
    return estimate('CAR', origin, dest);
  }
  return estimate(mode, origin, dest);
}
