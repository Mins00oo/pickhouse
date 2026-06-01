import { Address } from '@/types';

export interface GeoCoord {
  latitude: number;
  longitude: number;
}

const KAKAO_LOCAL_URL = 'https://dapi.kakao.com/v2/local/search/address.json';

/**
 * Kakao Local "주소 → 좌표" 지오코딩.
 * Daum 우편번호 검색은 좌표를 주지 않으므로, 선택된 주소를 좌표로 변환해
 * 메인 지도에 핀을 띄울 수 있게 한다.
 *
 * 키(`apiKey`)는 테스트 주입을 위해 기본 파라미터로 받는다(baseUrl.ts 패턴).
 * 키 없음/네트워크 오류/빈 결과/비유한 좌표 → null. **절대 throw 하지 않는다**
 * (저장 흐름을 막지 않기 위해).
 *
 * 공유 axios 클라이언트가 아닌 `fetch`를 쓴다 — 앱 Bearer 토큰을 Kakao로
 * 보내면 안 되고, Kakao는 자체 `KakaoAK` 헤더를 쓰기 때문.
 */
export async function geocodeAddress(
  query: string,
  apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
): Promise<GeoCoord | null> {
  if (!apiKey || !query) return null;
  try {
    const url = `${KAKAO_LOCAL_URL}?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (!res.ok) return null;
    const json = (await res.json()) as { documents?: { x?: string; y?: string }[] };
    const doc = json?.documents?.[0];
    if (!doc) return null;
    const longitude = Number(doc.x); // Kakao: x = 경도(lng)
    const latitude = Number(doc.y); //        y = 위도(lat)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

/** 주소에 좌표를 채워 새 Address 를 반환. 실패 시 원본 주소를 그대로 반환. */
export async function attachCoords(addr: Address, apiKey?: string): Promise<Address> {
  const coord = await geocodeAddress(addr.roadAddress || addr.jibunAddress, apiKey);
  return coord ? { ...addr, latitude: coord.latitude, longitude: coord.longitude } : addr;
}
