export type DealType = 'JEONSE' | 'WOLSE' | 'BAN_JEONSE';

export interface Address {
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
  latitude?: number;
  longitude?: number;
  detail?: string;
}

export const RATING_KEYS = [
  'waterPressure',
  'sunlight',
  'noise',
  'insulation',
  'ventilation',
  'moisture',
  'neighborhood',
  'firstImpression',
] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

// 방 구조 — DB에는 영문 코드 저장, 라벨 매핑은 UI에서.
export const ROOM_TYPES = [
  'ONE_ROOM', // 원룸
  'SEPARATED_ONE_ROOM', // 분리형 원룸
  'ONE_AND_HALF', // 1.5룸
  'TWO_ROOM', // 투룸
  'THREE_ROOM_PLUS', // 쓰리룸+
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

// 층 유형 — 지상 / 반지하 / 옥탑
export const FLOOR_TYPES = ['GROUND', 'SEMI_BASEMENT', 'ROOFTOP'] as const;
export type FloorType = (typeof FLOOR_TYPES)[number];

// 향 — 남/남동/남서/동/서/북
export const DIRECTIONS = [
  'SOUTH',
  'SOUTHEAST',
  'SOUTHWEST',
  'EAST',
  'WEST',
  'NORTH',
] as const;
export type Direction = (typeof DIRECTIONS)[number];

// 관리비 포함 가능 항목 — 수도/전기/가스/인터넷
export const MAINTENANCE_UTILITIES = ['WATER', 'ELECTRIC', 'GAS', 'INTERNET'] as const;
export type MaintenanceUtility = (typeof MAINTENANCE_UTILITIES)[number];

/** 컨디션 3단계: 1=나쁨, 2=보통, 3=좋음 */
export type ConditionLevel = 1 | 2 | 3;

export interface House {
  id: string;
  address: Address;
  dealType: DealType;
  deposit: number;
  rent?: number;
  maintenanceFee?: number;
  area?: number; // 단위: 평(pyeong)
  builtYear?: number;
  floor?: number;
  totalFloor?: number;
  availableFrom?: string;
  stationDistance?: number;
  rooms?: number;
  bathrooms?: number;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  hasParking?: boolean;
  options?: string[];
  security?: string[];
  garbage?: string;
  waterPressure?: number;
  sunlight?: number;
  noise?: number;
  insulation?: number;
  ventilation?: number;
  moisture?: number;
  neighborhood?: number;
  firstImpression?: number;
  memo?: string;
  // ── 집 추가 위저드 신규 필드 ──
  nickname?: string; // 집 별칭 (위저드에서 필수, 타입상 옵셔널)
  visitedAt?: string; // 방문일 (ISO), 기본 오늘
  roomType?: RoomType; // 방 구조 (숫자 rooms와 별개)
  floorType?: FloorType; // 지상/반지하/옥탑
  direction?: Direction; // 향
  maintenanceIncludes?: MaintenanceUtility[]; // 관리비 포함 항목
  utilityEstimates?: Partial<Record<'WATER' | 'ELECTRIC' | 'GAS', number>>; // 별도 납부 월 예상(만원)
  fullOption?: boolean; // 풀옵션(빌트인)
  photoIds: string[];
  contractedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type HouseDraft = Omit<House, 'id' | 'photoIds' | 'createdAt' | 'updatedAt'>;

export type HouseRequestFields = Omit<House, 'id' | 'photoIds' | 'createdAt' | 'updatedAt'>;

export type CreateHouseRequest = Omit<HouseRequestFields, 'rent'> & {
  rent: number;
};

export type UpdateHouseRequest = Partial<CreateHouseRequest>;
