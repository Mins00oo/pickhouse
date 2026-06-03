import { Direction, House } from '@/types';
import { colors } from '@/theme';

// 집 아이덴티티 색 — 왼쪽 A=그린, 오른쪽 B=코랄(디자인 CA/CB).
export const COMPARE_COLOR_A = colors.primary;
export const COMPARE_COLOR_B = colors.coral;

export type CompareSide = 'l' | 'r';

/**
 * 향 → 햇빛 색 레벨(디자인 dirLevel 미러).
 * 남향 계열=좋음(3), 동·서=보통(2), 북향=주의(1). 미입력은 보통 취급.
 */
export function directionColorLevel(direction?: Direction): 1 | 2 | 3 {
  if (!direction) return 2;
  if (direction === 'NORTH') return 1;
  if (direction === 'SOUTH' || direction === 'SOUTHEAST' || direction === 'SOUTHWEST') return 3;
  return 2; // EAST / WEST
}

/** 두 값 중 어느 쪽이 큰가 — 'l' | 'r' | null(동일/판단 불가). 디자인 hi() 미러. */
export function higherSide(left?: number, right?: number): CompareSide | null {
  if (typeof left !== 'number' || typeof right !== 'number') return null;
  if (left === right) return null;
  return left > right ? 'l' : 'r';
}

/** 거래유형 짧은 라벨(헤더/뱃지용). 반전세도 월세 계열로 묶어 표기. */
export function dealTypeShort(house: House): string {
  return house.dealType === 'JEONSE' ? '전세' : '월세';
}
