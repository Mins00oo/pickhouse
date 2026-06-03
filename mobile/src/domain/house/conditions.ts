// 컨디션 + 햇빛↔향 매핑의 단일 출처.
// 색/입력레벨라벨은 theme(conditionColor/conditionLabel)이 owner이고 여기서 re-export.
import { Direction } from '@/types';
import { conditionColor, conditionLabel } from '@/theme';

export { conditionColor, conditionLabel };

// 표시용 5키 — 화면(상세/홈/비교)에서 보여주는 컨디션 항목. 햇빛(sunlight)은 향으로 렌더.
export const CONDITION_KEYS = [
  'sunlight',
  'waterPressure',
  'moisture',
  'noise',
  'ventilation',
] as const;
export type ConditionKey = (typeof CONDITION_KEYS)[number];

// 입력용 4키 — 위저드 컨디션 체크. 햇빛은 향(DirectionPicker)으로 따로 입력하므로 제외.
export const INPUT_CONDITION_KEYS = ['waterPressure', 'moisture', 'noise', 'ventilation'] as const;
export type InputConditionKey = (typeof INPUT_CONDITION_KEYS)[number];

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

/**
 * 항목별 컨디션 어휘 — 디자인의 CL_LABELS(pickhouse-shared.jsx) 미러.
 * 1=나쁨 / 2=보통 / 3=좋음. 모든 화면에서 generic 좋음/보통/나쁨 대신 이 단어를 쓴다.
 * 햇빛(sunlight)은 향(direction) 문자열을 직접 표시하므로 여기서 제외.
 */
const CONDITION_VALUE_WORDS: Record<InputConditionKey, Record<1 | 2 | 3, string>> = {
  waterPressure: { 1: '약함', 2: '보통', 3: '강함' },
  moisture: { 1: '있음', 2: '약간', 3: '없음' },
  noise: { 1: '나쁨', 2: '보통', 3: '좋음' },
  ventilation: { 1: '안 됨', 2: '보통', 3: '잘 됨' },
};

/** 항목별 컨디션 단어. sunlight는 향 문자열을 직접 표시하므로 ''. 값 없으면 '—'. */
export function conditionValueLabel(key: ConditionKey, level: 1 | 2 | 3 | undefined): string {
  if (key === 'sunlight') return '';
  if (level == null) return '—';
  return CONDITION_VALUE_WORDS[key][level];
}

/**
 * 향 → 햇빛 색 레벨(1~3). 남향 계열=좋음(3), 동·서=보통(2), 북향=주의(1). 미입력은 보통.
 * 햇빛↔향 통일의 핵심 브리지 — 햇빛 행의 색을 conditionColor(directionColorLevel(dir))로 칠한다.
 */
export function directionColorLevel(direction?: Direction): 1 | 2 | 3 {
  if (!direction) return 2;
  if (direction === 'NORTH') return 1;
  if (direction === 'SOUTH' || direction === 'SOUTHEAST' || direction === 'SOUTHWEST') return 3;
  return 2; // EAST / WEST
}
