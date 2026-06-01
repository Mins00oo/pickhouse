import { colors } from './colors';
import type { ConditionLevel } from '@/types';

// 컨디션 3단계 의미색/라벨 — 디자인의 clColor/clLabel(pickhouse-shared.jsx) 미러.
// 좋음(3)=green, 보통(2)=amber, 나쁨(1)=red, 미선택=muted.
export const conditionColor = (v?: ConditionLevel): string =>
  v === 3 ? colors.condGood : v === 2 ? colors.condMid : v === 1 ? colors.condBad : colors.inkMuted;

export const conditionLabel = (v?: ConditionLevel): string =>
  v === 3 ? '좋음' : v === 2 ? '보통' : v === 1 ? '나쁨' : '';
