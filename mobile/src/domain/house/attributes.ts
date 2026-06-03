// 집 속성 옵션·라벨의 단일 출처 (프론트 관리 enum — 추후 백엔드 코드화 대비).
// 거래유형 / 방구조 / 층유형 / 향 / 관리비항목 / 시설 의 코드↔라벨 매핑을 여기서만 정의한다.
import { DealType, Direction, FloorType, MaintenanceUtility, RoomType } from '@/types';

// ── 거래 유형 ────────────────────────────────────────────────
export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  JEONSE: '전세',
  WOLSE: '월세',
  BAN_JEONSE: '반전세',
};

/** 전체 거래유형 라벨 (전세/월세/반전세). */
export const dealTypeLabel = (dealType: DealType): string => DEAL_TYPE_LABELS[dealType];

/** 짧은 거래유형 라벨 — 반전세를 월세 계열로 묶어 2분류로 표기(뱃지/헤더용). */
export const dealTypeShortLabel = (dealType: DealType): string =>
  dealType === 'JEONSE' ? '전세' : '월세';

/** 위저드 거래유형 세그먼트 옵션(월세/전세 2분류 입력). */
export const WIZARD_DEAL_OPTIONS: { code: Exclude<DealType, 'BAN_JEONSE'>; label: string }[] = [
  { code: 'WOLSE', label: '월세' },
  { code: 'JEONSE', label: '전세' },
];

// ── 방 구조 ──────────────────────────────────────────────────
export const ROOM_TYPE_OPTIONS: { code: RoomType; label: string }[] = [
  { code: 'ONE_ROOM', label: '원룸' },
  { code: 'SEPARATED_ONE_ROOM', label: '분리형 원룸' },
  { code: 'ONE_AND_HALF', label: '1.5룸' },
  { code: 'TWO_ROOM', label: '투룸' },
  { code: 'THREE_ROOM_PLUS', label: '쓰리룸+' },
];

// ── 층 유형 ──────────────────────────────────────────────────
export const FLOOR_TYPE_OPTIONS: { code: FloorType; label: string }[] = [
  { code: 'GROUND', label: '지상' },
  { code: 'SEMI_BASEMENT', label: '반지하' },
  { code: 'ROOFTOP', label: '옥탑' },
];

// ── 향 ───────────────────────────────────────────────────────
export const DIRECTION_OPTIONS: { code: Direction; label: string }[] = [
  { code: 'SOUTH', label: '남향' },
  { code: 'SOUTHEAST', label: '남동향' },
  { code: 'SOUTHWEST', label: '남서향' },
  { code: 'EAST', label: '동향' },
  { code: 'WEST', label: '서향' },
  { code: 'NORTH', label: '북향' },
];

// ── 관리비 포함 항목 ─────────────────────────────────────────
export const MAINTENANCE_OPTIONS: { code: MaintenanceUtility; label: string }[] = [
  { code: 'WATER', label: '수도' },
  { code: 'ELECTRIC', label: '전기' },
  { code: 'GAS', label: '가스' },
  { code: 'INTERNET', label: '인터넷' },
];

export const roomTypeLabel = (c?: RoomType) => ROOM_TYPE_OPTIONS.find((o) => o.code === c)?.label;
export const floorTypeLabel = (c?: FloorType) =>
  FLOOR_TYPE_OPTIONS.find((o) => o.code === c)?.label;
export const directionLabel = (c?: Direction) => DIRECTION_OPTIONS.find((o) => o.code === c)?.label;
export const maintenanceLabel = (c: MaintenanceUtility) =>
  MAINTENANCE_OPTIONS.find((o) => o.code === c)?.label ?? c;

// ── 시설 ─────────────────────────────────────────────────────
// House의 boolean 필드 키. 위저드 스위치(긴 라벨)와 비교 화면(짧은 라벨) 모두 여기서 라벨/아이콘을 가져온다.
export const FACILITY_KEYS = ['hasElevator', 'hasParking', 'fullOption'] as const;
export type FacilityKey = (typeof FACILITY_KEYS)[number];

export const FACILITY_META: Record<FacilityKey, { label: string; shortLabel: string; icon: string }> = {
  hasElevator: { label: '엘리베이터', shortLabel: '엘베', icon: 'git-network-outline' },
  hasParking: { label: '주차 가능', shortLabel: '주차', icon: 'car-outline' },
  fullOption: { label: '풀옵션', shortLabel: '풀옵션', icon: 'home-outline' },
};
