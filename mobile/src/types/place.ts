import { Address } from './house';

// 거점(직장/학교) — 고정 슬롯: 사용자당 타입별 최대 1개.
export const ANCHOR_TYPES = ['WORKPLACE', 'SCHOOL'] as const;
export type AnchorType = (typeof ANCHOR_TYPES)[number];

export interface AnchorPlace {
  id: string;
  anchorType: AnchorType;
  /** 선택 별칭(장소명). 없으면 타입 라벨(직장/학교)로 표시. */
  label?: string;
  address: Address; // latitude/longitude 포함
  createdAt: string;
  updatedAt: string;
}

/**
 * 집↔거점 거리 표시 추상.
 * 도로 길찾기(driving) 성공 시 durationMin 포함, 실패 시 직선거리(straight-line) 폴백.
 */
export interface AnchorDistance {
  anchorType: AnchorType;
  km: number;
  source: 'driving' | 'straight-line';
  durationMin?: number; // driving일 때만
}
