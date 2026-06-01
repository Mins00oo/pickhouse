import { Direction, FloorType, MaintenanceUtility, RoomType } from '@/types';

// 저장은 영문 코드, 표시는 한글 라벨. (코드↔라벨 단일 출처)
export const ROOM_TYPE_OPTIONS: { code: RoomType; label: string }[] = [
  { code: 'ONE_ROOM', label: '원룸' },
  { code: 'SEPARATED_ONE_ROOM', label: '분리형 원룸' },
  { code: 'ONE_AND_HALF', label: '1.5룸' },
  { code: 'TWO_ROOM', label: '투룸' },
  { code: 'THREE_ROOM_PLUS', label: '쓰리룸+' },
];

export const FLOOR_TYPE_OPTIONS: { code: FloorType; label: string }[] = [
  { code: 'GROUND', label: '지상' },
  { code: 'SEMI_BASEMENT', label: '반지하' },
  { code: 'ROOFTOP', label: '옥탑' },
];

export const DIRECTION_OPTIONS: { code: Direction; label: string }[] = [
  { code: 'SOUTH', label: '남향' },
  { code: 'SOUTHEAST', label: '남동향' },
  { code: 'SOUTHWEST', label: '남서향' },
  { code: 'EAST', label: '동향' },
  { code: 'WEST', label: '서향' },
  { code: 'NORTH', label: '북향' },
];

export const MAINTENANCE_OPTIONS: { code: MaintenanceUtility; label: string }[] = [
  { code: 'WATER', label: '수도' },
  { code: 'ELECTRIC', label: '전기' },
  { code: 'GAS', label: '가스' },
  { code: 'INTERNET', label: '인터넷' },
];

export const roomTypeLabel = (c?: RoomType) => ROOM_TYPE_OPTIONS.find((o) => o.code === c)?.label;
export const floorTypeLabel = (c?: FloorType) => FLOOR_TYPE_OPTIONS.find((o) => o.code === c)?.label;
export const directionLabel = (c?: Direction) => DIRECTION_OPTIONS.find((o) => o.code === c)?.label;
export const maintenanceLabel = (c: MaintenanceUtility) =>
  MAINTENANCE_OPTIONS.find((o) => o.code === c)?.label ?? c;
