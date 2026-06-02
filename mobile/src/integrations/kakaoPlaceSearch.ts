import { Address } from '@/types';

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

export interface PlaceSearchResult {
  placeName: string;
  roadAddressName: string;
  addressName: string;
  latitude: number; // y
  longitude: number; // x
}

/**
 * Kakao Local "키워드(장소 이름) 검색".
 * 직장/학교를 이름으로 찾는다 — 결과에 좌표(x=경도, y=위도)가 함께 와서
 * 별도 지오코딩이 필요 없다.
 *
 * 키(`apiKey`)는 테스트 주입을 위해 기본 파라미터로 받는다(kakaoGeocode 패턴).
 * 키 없음/빈 쿼리/네트워크 오류/응답 오류 → 빈 배열. **절대 throw 하지 않는다.**
 * 공유 axios 가 아닌 `fetch` 사용(Kakao 전용 `KakaoAK` 헤더).
 */
export async function searchPlaces(
  query: string,
  apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
): Promise<PlaceSearchResult[]> {
  if (!apiKey || !query.trim()) return [];
  try {
    const url = `${KAKAO_KEYWORD_URL}?query=${encodeURIComponent(query)}&size=15`;
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      documents?: {
        place_name?: string;
        address_name?: string;
        road_address_name?: string;
        x?: string;
        y?: string;
      }[];
    };
    const docs = json?.documents ?? [];
    const results: PlaceSearchResult[] = [];
    for (const d of docs) {
      const longitude = Number(d.x);
      const latitude = Number(d.y);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      results.push({
        placeName: d.place_name ?? '',
        roadAddressName: d.road_address_name ?? '',
        addressName: d.address_name ?? '',
        latitude,
        longitude,
      });
    }
    return results;
  } catch {
    return [];
  }
}

/** 검색 결과 → 우리 Address(좌표 포함). 우편번호는 키워드 검색에 없어 빈 문자열. */
export function placeToAddress(p: PlaceSearchResult): Address {
  return {
    roadAddress: p.roadAddressName || p.addressName,
    jibunAddress: p.addressName,
    zonecode: '',
    latitude: p.latitude,
    longitude: p.longitude,
  };
}
