import { MapCoordinate } from '@/screens/houses/houseMapUtils';

const KAKAO_DIRECTIONS_URL = 'https://apis-navi.kakaomobility.com/v1/directions';

export interface RouteSummary {
  distanceM: number; // 도로 거리(미터)
  durationSec: number; // 차 소요시간(초)
}

/**
 * Kakao Mobility "자동차 길찾기" — 출발/도착 좌표로 실제 도로 거리·소요시간을 구한다.
 * (지오코딩과 같은 KakaoAK REST 키 재사용. "카카오맵 활성화"와 별개 서비스일 수 있어
 * 미가용 시 401/403 → null 폴백되며, 호출부에서 직선거리로 대체한다.)
 *
 * origin/destination 포맷은 "경도,위도"(lng,lat).
 * 키 없음/네트워크 오류/result_code≠0/빈 결과 → null. **절대 throw 하지 않는다.**
 */
export async function routeDistance(
  origin: MapCoordinate,
  dest: MapCoordinate,
  apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
): Promise<RouteSummary | null> {
  if (!apiKey) return null;
  try {
    const o = `${origin.longitude},${origin.latitude}`;
    const d = `${dest.longitude},${dest.latitude}`;
    const url = `${KAKAO_DIRECTIONS_URL}?origin=${o}&destination=${d}`;
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      routes?: {
        result_code?: number;
        summary?: { distance?: number; duration?: number };
      }[];
    };
    const route = json?.routes?.[0];
    if (!route || (route.result_code != null && route.result_code !== 0)) return null;
    const distanceM = Number(route.summary?.distance);
    const durationSec = Number(route.summary?.duration);
    if (!Number.isFinite(distanceM) || !Number.isFinite(durationSec)) return null;
    return { distanceM, durationSec };
  } catch {
    return null;
  }
}
