import { Address } from './house';

// 거점(직장/학교/기타) — 통근 기준지. 타입당 여러 개 등록 가능, '주 통근지'로 카드 표시 대상 지정.
export const ANCHOR_TYPES = ['WORKPLACE', 'SCHOOL', 'OTHER'] as const;
export type AnchorType = (typeof ANCHOR_TYPES)[number];

// 이동수단 — 통근시간 계산 기준. (자전거 제외)
export const TRANSPORT_MODES = ['TRANSIT', 'CAR', 'WALK'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export interface AnchorPlace {
  id: string;
  anchorType: AnchorType;
  /** 표시 이름(별칭). 없으면 타입 라벨(직장/학교/기타)로 표시. */
  label?: string;
  address: Address; // latitude/longitude 포함
  /** 통근시간 계산 기준 이동수단. */
  transport: TransportMode;
  /** 주 통근지 — 메인 카드에 이 장소까지의 시간을 표시(타입당 최대 1개). */
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 집↔거점 거리/시간 표시 추상.
 * - driving: 카카오 자동차 길찾기 실측(도로거리 + 차 시간).
 * - estimate: 직선거리 × 수단별 평균속도 추정(대중교통/도보, 또는 자동차 폴백).
 * - straight-line: 좌표만으로 계산한 직선거리(시간 없음).
 */
export interface AnchorDistance {
  anchorType: AnchorType;
  km: number;
  source: 'driving' | 'estimate' | 'straight-line';
  durationMin?: number;
  mode?: TransportMode;
}
