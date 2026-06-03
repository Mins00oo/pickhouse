import { colors } from '@/theme';

// 집 아이덴티티 색 — 왼쪽 A=그린, 오른쪽 B=코랄(디자인 CA/CB).
export const COMPARE_COLOR_A = colors.primary;
export const COMPARE_COLOR_B = colors.coral;

export type CompareSide = 'l' | 'r';

/** 두 값 중 어느 쪽이 큰가 — 'l' | 'r' | null(동일/판단 불가). 디자인 hi() 미러. */
export function higherSide(left?: number, right?: number): CompareSide | null {
  if (typeof left !== 'number' || typeof right !== 'number') return null;
  if (left === right) return null;
  return left > right ? 'l' : 'r';
}
