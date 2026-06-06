import { MyPlaceDistance, MyPlace, House } from '@/types';
import { dealTypeLabel } from '@/domain/house';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export const DEFAULT_MAP_CENTER: MapCoordinate = {
  latitude: 37.5563,
  longitude: 126.9236,
};

export function getHouseCoordinate(house: House): MapCoordinate | null {
  const { latitude, longitude } = house.address;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export function getMyPlaceCoordinate(myPlace: MyPlace): MapCoordinate | null {
  const { latitude, longitude } = myPlace.address;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

/** 두 좌표 간 직선거리(km) — 하버사인. */
export function haversineKm(a: MapCoordinate, b: MapCoordinate): number {
  const R = 6371; // 지구 반지름(km)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** km 표시: 1km 미만은 m 단위(반올림 10m), 그 이상은 소수 1자리 km. */
export function formatKm(km: number): string {
  if (km < 1) {
    const m = Math.round((km * 1000) / 10) * 10;
    return `${m}m`;
  }
  return `${km.toFixed(1)}km`;
}

/** 거리 + 소요시간 한 줄. driving=차 N분, estimate=약 N분, straight-line="직선거리 약". */
export function formatMyPlaceDistance(d: MyPlaceDistance): string {
  const dist = formatKm(d.km);
  if (d.source === 'driving') {
    if (typeof d.durationMin === 'number') return `${dist} · 차 ${d.durationMin}분`;
    return dist;
  }
  if (d.source === 'estimate') {
    if (typeof d.durationMin === 'number') return `${dist} · 약 ${d.durationMin}분`;
    return `약 ${dist}`;
  }
  return `직선거리 약 ${dist}`;
}

/**
 * 메인 카드에 표시할 '주 통근지' 추출 — 타입별 isPrimary 장소.
 * 기타(OTHER)는 카드에 표시하지 않으므로 무시한다.
 */
export function pickPrimaryMyPlaces(places: MyPlace[]): {
  work: MyPlace | null;
  school: MyPlace | null;
} {
  const work = places.find((p) => p.placeType === 'WORKPLACE' && p.isPrimary) ?? null;
  const school = places.find((p) => p.placeType === 'SCHOOL' && p.isPrimary) ?? null;
  return { work, school };
}

/** 주 통근지 직장/학교 유무에서 카드 통근 표시 모드를 파생. */
export function deriveCommuteMode(places: MyPlace[]): 'none' | 'work' | 'school' | 'both' {
  const { work, school } = pickPrimaryMyPlaces(places);
  if (work && school) return 'both';
  if (work) return 'work';
  if (school) return 'school';
  return 'none';
}

export function getHouseTitle(house: House): string {
  const detail = house.address.detail?.trim();
  if (detail) return detail;
  return house.address.roadAddress?.trim() || house.address.jibunAddress?.trim() || '주소 미입력';
}

export function getHouseSubtitle(house: House): string {
  const detail = house.address.detail?.trim();
  const road = house.address.roadAddress?.trim();
  const jibun = house.address.jibunAddress?.trim();

  if (detail && road) return road;
  if (detail && jibun) return jibun;
  if (road && jibun && road !== jibun) return jibun;
  if (house.address.zonecode) return `우편번호 ${house.address.zonecode}`;
  return '주소 정보 없음';
}

export function getDealTypeLabel(house: House): string {
  return dealTypeLabel(house.dealType);
}

export function formatHousePrice(house: House): string {
  const deposit = house.deposit.toLocaleString('ko-KR');
  if (house.dealType === 'JEONSE') return `전세 ${deposit}`;

  const rent = (house.rent ?? 0).toLocaleString('ko-KR');
  return `${getDealTypeLabel(house)} ${deposit} / ${rent}`;
}

export function formatDepositShort(amount: number): string {
  if (amount >= 10000) {
    const eok = amount / 10000;
    return Number.isInteger(eok) ? `${eok}억` : `${eok.toFixed(1)}억`;
  }
  return amount.toLocaleString('ko-KR');
}

export function formatHousePriceShort(house: House): string {
  if (house.dealType === 'JEONSE') return `전세 ${formatDepositShort(house.deposit)}`;
  return `${formatDepositShort(house.deposit)}/${house.rent ?? 0}`;
}

/** raw 숫자 문자열 → 천단위 콤마 표시 (예: '100000000' → '100,000,000'). 빈 문자열은 그대로. */
export function formatThousands(raw: string): string {
  if (!raw) return '';
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return n.toLocaleString('ko-KR');
}

export function getHouseMeta(house: House): string {
  const parts: string[] = [];
  if (typeof house.area === 'number') parts.push(`${house.area}평`);
  if (typeof house.floor === 'number' && typeof house.totalFloor === 'number') {
    parts.push(`${house.floor}/${house.totalFloor}층`);
  } else if (typeof house.floor === 'number') {
    parts.push(`${house.floor}층`);
  }
  if (typeof house.rooms === 'number') parts.push(`방 ${house.rooms}`);
  return parts.join(' · ');
}

export function getVisitedLabel(house: House): string {
  const date = new Date(house.createdAt);
  if (Number.isNaN(date.getTime())) return '기록일 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

export function filterHousesByKeyword(houses: House[], keyword: string): House[] {
  const query = keyword.trim().toLocaleLowerCase('ko-KR');
  if (!query) return houses;

  return houses.filter((house) => {
    const fields = [
      house.address.detail,
      house.address.roadAddress,
      house.address.jibunAddress,
      house.address.zonecode,
    ];

    return fields.some((field) => field?.toLocaleLowerCase('ko-KR').includes(query));
  });
}

export function isHouseInRegion(house: House, region: MapRegion): boolean {
  const coordinate = getHouseCoordinate(house);
  if (!coordinate) return false;

  const north = region.latitude + region.latitudeDelta;
  const south = region.latitude;
  const east = region.longitude + region.longitudeDelta;
  const west = region.longitude;

  return (
    coordinate.latitude >= south &&
    coordinate.latitude <= north &&
    coordinate.longitude >= west &&
    coordinate.longitude <= east
  );
}

export function filterHousesByRegion(houses: House[], region: MapRegion | null): House[] {
  const housesWithCoordinates = houses.filter((house) => Boolean(getHouseCoordinate(house)));
  if (!region) return housesWithCoordinates;
  return housesWithCoordinates.filter((house) => isHouseInRegion(house, region));
}

export function sortHousesForMapSheet(houses: House[], selectedHouseId: string | null): House[] {
  return [...houses].sort((a, b) => {
    if (a.id === selectedHouseId) return -1;
    if (b.id === selectedHouseId) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
