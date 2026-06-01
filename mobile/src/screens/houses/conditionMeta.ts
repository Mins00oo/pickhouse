// 컨디션 5키 메타데이터 (라벨 + 아이콘). 색/단계라벨은 @/theme 의 conditionColor/conditionLabel 사용.
export const CONDITION_KEYS = [
  'sunlight',
  'waterPressure',
  'moisture',
  'noise',
  'ventilation',
] as const;
export type ConditionKey = (typeof CONDITION_KEYS)[number];

// Ionicons 이름으로 매핑 (디자인의 sun/drop/mold/ear/wind 근사).
export const CONDITION_META: Record<ConditionKey, { label: string; icon: string }> = {
  sunlight: { label: '햇빛', icon: 'sunny-outline' },
  waterPressure: { label: '수압', icon: 'water-outline' },
  moisture: { label: '곰팡이', icon: 'rainy-outline' },
  noise: { label: '방음', icon: 'volume-high-outline' },
  ventilation: { label: '환기', icon: 'swap-horizontal-outline' },
};

/**
 * 컨디션 값을 1~3 단계로 정규화.
 * 신규 위저드 값은 이미 1~3 → 그대로 유지. 레거시 1~5 별점은 4·5를 3(좋음)으로 캡.
 * (재매핑이 아니라 상한 캡이어야 신규 3이 좋음으로 보존됨.)
 */
export function normalizeConditionLevel(v: number | undefined): 1 | 2 | 3 | undefined {
  if (v == null) return undefined;
  const r = Math.round(v);
  if (r <= 1) return 1;
  if (r >= 3) return 3;
  return 2;
}
