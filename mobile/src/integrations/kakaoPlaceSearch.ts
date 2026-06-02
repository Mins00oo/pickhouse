import { Address } from '@/types';
import type { MapCoordinate } from '@/screens/houses/houseMapUtils';

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

export interface PlaceSearchResult {
  placeName: string;
  roadAddressName: string;
  addressName: string;
  latitude: number; // y
  longitude: number; // x
  /** 카테고리 마지막 세그먼트 (예: '대학교', '회사'). */
  category?: string;
  /** origin 전달 시 그 지점으로부터의 거리(m). */
  distanceM?: number;
}

/** 'A > B > C' 또는 'A,B,C' 형태의 카테고리에서 마지막(가장 구체적) 세그먼트만 뽑는다. */
function categoryLeaf(raw?: string): string | undefined {
  if (!raw) return undefined;
  const parts = raw.split(/>|,/).map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : undefined;
}

/**
 * Kakao Local "키워드(장소 이름) 검색".
 * 직장/학교/기타를 이름으로 찾는다 — 결과에 좌표(x=경도, y=위도)가 함께 와서 별도 지오코딩이 필요 없다.
 * `origin`을 주면 거리순 정렬 + 결과별 거리(m)를 함께 받는다.
 *
 * 키 없음/빈 쿼리/네트워크 오류/응답 오류 → 빈 배열. **절대 throw 하지 않는다.**
 */
export async function searchPlaces(
  query: string,
  apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY,
  origin?: MapCoordinate,
): Promise<PlaceSearchResult[]> {
  if (!apiKey || !query.trim()) return [];
  try {
    let url = `${KAKAO_KEYWORD_URL}?query=${encodeURIComponent(query)}&size=15`;
    if (origin) {
      url += `&x=${origin.longitude}&y=${origin.latitude}&sort=distance`;
    }
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      documents?: {
        place_name?: string;
        category_name?: string;
        address_name?: string;
        road_address_name?: string;
        x?: string;
        y?: string;
        distance?: string;
      }[];
    };
    const docs = json?.documents ?? [];
    const results: PlaceSearchResult[] = [];
    for (const d of docs) {
      const longitude = Number(d.x);
      const latitude = Number(d.y);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      const distance = Number(d.distance);
      results.push({
        placeName: d.place_name ?? '',
        roadAddressName: d.road_address_name ?? '',
        addressName: d.address_name ?? '',
        latitude,
        longitude,
        ...(categoryLeaf(d.category_name) ? { category: categoryLeaf(d.category_name) } : {}),
        ...(Number.isFinite(distance) ? { distanceM: distance } : {}),
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
