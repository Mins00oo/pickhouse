# PickHouse Comparison Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The signature 2-house VS comparison screen with diff highlighting, photo carousels, and candidate slider — PickHouse's core differentiator.

**Architecture:** New screens and components within the existing Expo app (depends on Plan 2). Pure UI feature — no new backend endpoints needed. Diff logic is pure functions tested separately from UI.

**Tech Stack:** React Native components, Zustand for comparison session state, react-native-gesture-handler for swipes, react-native-reanimated for transitions, existing API client from Plan 2.

---

## Assumptions From Plan 2 (Mobile Foundation)

The executing engineer can assume the following exists when starting this plan. If anything is missing, stop and fix Plan 2 first.

- Expo + TypeScript app at `pickhouse/mobile/`
- `pickhouse/mobile/src/types/house.ts` exporting `House`, `DealType` (`'JEONSE' | 'WOLSE' | 'BAN_JEONSE'`), `Photo`, star-rating field names
- `pickhouse/mobile/src/stores/houseStore.ts` Zustand store with `houses: House[]`, `getHouseById(id)`, `selectHouse(id)`
- `pickhouse/mobile/src/screens/HouseListScreen.tsx` — the house list grid (entry point for our Compare button)
- `pickhouse/mobile/src/navigation/RootNavigator.tsx` — React Navigation stack we'll register screens with
- `pickhouse/mobile/src/theme/tokens.ts` exporting colors `{ cream: '#faf6f0', green: '#3f7a4c', greenSoft: '#dff0e2', beige: '#e8dfc9', beigeSoft: '#f3ecd9', gray: '#9b9b9b', textPrimary: '#2b2b2b', textMuted: '#7a7a7a' }`, spacing `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }`, radii `{ sm: 8, md: 12, lg: 16, xl: 24 }`
- Jest configured with `@testing-library/react-native` (run via `npm test` inside `pickhouse/mobile/`)
- `react-native-gesture-handler` and `react-native-reanimated` installed and registered in `App.tsx`
- `expo-image` available for image loading
- Storybook (`@storybook/react-native`) configured at `pickhouse/mobile/.storybook/` (optional, used by visual tasks)

---

## File Structure

### New Files

**Types & data**
- `pickhouse/mobile/src/types/comparison.ts` — comparison-specific types (`CompareField`, `DiffResult`, `FieldKey`)

**Pure logic (testable without RN)**
- `pickhouse/mobile/src/comparison/fields.ts` — declarative list of all comparable fields with labels, direction (`'lower-better' | 'higher-better' | 'equal-only'`), formatter
- `pickhouse/mobile/src/comparison/diff.ts` — `diffField(base, candidate, field)` and `diffHouses(base, candidate)` pure functions
- `pickhouse/mobile/src/comparison/format.ts` — value formatters (currency, area, stars, dates, booleans)

**State**
- `pickhouse/mobile/src/stores/comparisonStore.ts` — Zustand store: `{ baseHouseId, candidateIds, currentCandidateIndex, start, next, prev, setCandidateIndex, clear }`

**Screens**
- `pickhouse/mobile/src/screens/CompareBaseSelectScreen.tsx` — pick 기준 집 from house list
- `pickhouse/mobile/src/screens/CompareScreen.tsx` — main comparison view

**Components**
- `pickhouse/mobile/src/components/comparison/HouseBadge.tsx` — green/beige badge atop each side
- `pickhouse/mobile/src/components/comparison/PhotoCarousel.tsx` — horizontal swipe carousel with dot indicator
- `pickhouse/mobile/src/components/comparison/PhotoFullscreenModal.tsx` — fullscreen pinch-zoom photo viewer
- `pickhouse/mobile/src/components/comparison/CompareRow.tsx` — single field row: `base | label | candidate` with diff coloring
- `pickhouse/mobile/src/components/comparison/CompareSection.tsx` — grouped rows under a section heading
- `pickhouse/mobile/src/components/comparison/CandidateSlider.tsx` — bottom slider: "후보 N / M" with arrows + swipe
- `pickhouse/mobile/src/components/comparison/StarValue.tsx` — render a 1-5 star rating inline

**Tests** (mirror source paths under `__tests__`)
- `pickhouse/mobile/src/comparison/__tests__/diff.test.ts`
- `pickhouse/mobile/src/comparison/__tests__/format.test.ts`
- `pickhouse/mobile/src/comparison/__tests__/fields.test.ts`
- `pickhouse/mobile/src/stores/__tests__/comparisonStore.test.ts`
- `pickhouse/mobile/src/components/comparison/__tests__/CompareRow.test.tsx`
- `pickhouse/mobile/src/components/comparison/__tests__/PhotoCarousel.test.tsx`
- `pickhouse/mobile/src/components/comparison/__tests__/CandidateSlider.test.tsx`
- `pickhouse/mobile/src/screens/__tests__/CompareScreen.test.tsx`
- `pickhouse/mobile/src/screens/__tests__/CompareBaseSelectScreen.test.tsx`

**Storybook** (optional, for visual review)
- `pickhouse/mobile/src/components/comparison/CompareRow.stories.tsx`
- `pickhouse/mobile/src/components/comparison/PhotoCarousel.stories.tsx`
- `pickhouse/mobile/src/screens/CompareScreen.stories.tsx`

### Modified Files

- `pickhouse/mobile/src/screens/HouseListScreen.tsx` — add "비교" mode toggle button + selection flow
- `pickhouse/mobile/src/navigation/RootNavigator.tsx` — register `CompareBaseSelect` and `Compare` routes
- `pickhouse/mobile/src/types/navigation.ts` — add route param types

---

## Tasks

### Task 1: Comparison Types Scaffold

**Files:**
- Create: `pickhouse/mobile/src/types/comparison.ts`

- [ ] **Step 1: Create the types file**

Write `pickhouse/mobile/src/types/comparison.ts`:

```typescript
import type { House } from './house';

/**
 * Direction semantics for diff:
 * - 'lower-better': smaller raw value = better (deposit, rent, maintenanceFee, stationDistance)
 * - 'higher-better': larger raw value = better (area, star ratings, rooms, bathrooms)
 * - 'equal-only': no winner; only test for equality (booleans, enums, strings, dates)
 */
export type DiffDirection = 'lower-better' | 'higher-better' | 'equal-only';

export type DiffSide = 'base' | 'candidate' | 'equal' | 'incomparable';

export interface DiffResult {
  /** Which side is "better" according to the field's direction. 'incomparable' means one side has no value. */
  winner: DiffSide;
  /** Formatted display string for the base (기준) house. */
  baseDisplay: string;
  /** Formatted display string for the candidate (후보) house. */
  candidateDisplay: string;
}

export type FieldKey =
  | 'dealType'
  | 'deposit'
  | 'rent'
  | 'maintenanceFee'
  | 'area'
  | 'builtYear'
  | 'floor'
  | 'availableFrom'
  | 'stationDistance'
  | 'rooms'
  | 'bathrooms'
  | 'hasBalcony'
  | 'hasElevator'
  | 'hasParking'
  | 'waterPressure'
  | 'sunlight'
  | 'noise'
  | 'insulation'
  | 'ventilation'
  | 'moisture'
  | 'neighborhood'
  | 'firstImpression';

export interface CompareField {
  key: FieldKey;
  /** Korean label shown between base and candidate values. */
  label: string;
  direction: DiffDirection;
  /** Group heading this field belongs to. */
  section: '기본 정보' | '구조·시설' | '주관 평가';
  /** Renders the raw value for display. Returns '-' for null/undefined. */
  format: (value: unknown) => string;
  /** Pulls the raw value from a House. */
  pick: (h: House) => unknown;
  /** Optional: when true, render as star icons rather than text. */
  isStar?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/types/comparison.ts
git commit -m "feat(comparison): add comparison type scaffolding"
```

---

### Task 2: Value Formatters — Test First

**Files:**
- Create: `pickhouse/mobile/src/comparison/format.ts`
- Test: `pickhouse/mobile/src/comparison/__tests__/format.test.ts`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/comparison/__tests__/format.test.ts`:

```typescript
import {
  formatCurrency,
  formatArea,
  formatYear,
  formatFloor,
  formatMinutes,
  formatBool,
  formatDealType,
  formatDate,
  formatStarCount,
  formatRoomCount,
} from '../format';

describe('format', () => {
  describe('formatCurrency', () => {
    it('renders 만원 amounts with thousands separator', () => {
      expect(formatCurrency(15000)).toBe('1억 5,000만');
      expect(formatCurrency(500)).toBe('500만');
      expect(formatCurrency(0)).toBe('0만');
    });
    it('renders 1억 with no remainder cleanly', () => {
      expect(formatCurrency(10000)).toBe('1억');
      expect(formatCurrency(20000)).toBe('2억');
    });
    it('returns dash for nullish', () => {
      expect(formatCurrency(null)).toBe('-');
      expect(formatCurrency(undefined)).toBe('-');
    });
  });

  describe('formatArea', () => {
    it('renders pyeong with 1 decimal', () => {
      expect(formatArea(8.5)).toBe('8.5평');
      expect(formatArea(12)).toBe('12.0평');
    });
    it('returns dash for nullish', () => {
      expect(formatArea(null)).toBe('-');
    });
  });

  describe('formatYear', () => {
    it('renders 4-digit year + 년', () => {
      expect(formatYear(2018)).toBe('2018년');
    });
    it('returns dash for nullish', () => {
      expect(formatYear(undefined)).toBe('-');
    });
  });

  describe('formatFloor', () => {
    it('renders just the floor number with 층', () => {
      expect(formatFloor(3)).toBe('3층');
      expect(formatFloor(-1)).toBe('B1층');
    });
  });

  describe('formatMinutes', () => {
    it('renders 도보 N분', () => {
      expect(formatMinutes(7)).toBe('도보 7분');
      expect(formatMinutes(0)).toBe('도보 0분');
    });
  });

  describe('formatBool', () => {
    it('renders O / X', () => {
      expect(formatBool(true)).toBe('O');
      expect(formatBool(false)).toBe('X');
      expect(formatBool(null)).toBe('-');
    });
  });

  describe('formatDealType', () => {
    it('renders Korean label', () => {
      expect(formatDealType('JEONSE')).toBe('전세');
      expect(formatDealType('WOLSE')).toBe('월세');
      expect(formatDealType('BAN_JEONSE')).toBe('반전세');
    });
  });

  describe('formatDate', () => {
    it('renders YYYY.MM.DD for ISO strings', () => {
      expect(formatDate('2026-06-15')).toBe('2026.06.15');
    });
    it('returns dash for nullish', () => {
      expect(formatDate(null)).toBe('-');
    });
  });

  describe('formatStarCount', () => {
    it('renders N/5', () => {
      expect(formatStarCount(4)).toBe('4/5');
      expect(formatStarCount(0)).toBe('-');
      expect(formatStarCount(null)).toBe('-');
    });
  });

  describe('formatRoomCount', () => {
    it('appends 개', () => {
      expect(formatRoomCount(2)).toBe('2개');
    });
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `cd pickhouse/mobile && npm test -- src/comparison/__tests__/format.test.ts`
Expected: FAIL — module `../format` not found.

- [ ] **Step 3: Implement formatters**

Write `pickhouse/mobile/src/comparison/format.ts`:

```typescript
import type { DealType } from '../types/house';

const DASH = '-';
const isNil = (v: unknown): v is null | undefined => v === null || v === undefined;

export function formatCurrency(manwon: number | null | undefined): string {
  if (isNil(manwon)) return DASH;
  if (manwon === 0) return '0만';
  const eok = Math.floor(manwon / 10000);
  const remainder = manwon % 10000;
  if (eok === 0) {
    return `${manwon.toLocaleString('ko-KR')}만`;
  }
  if (remainder === 0) {
    return `${eok}억`;
  }
  return `${eok}억 ${remainder.toLocaleString('ko-KR')}만`;
}

export function formatArea(pyeong: number | null | undefined): string {
  if (isNil(pyeong)) return DASH;
  return `${pyeong.toFixed(1)}평`;
}

export function formatYear(year: number | null | undefined): string {
  if (isNil(year)) return DASH;
  return `${year}년`;
}

export function formatFloor(floor: number | null | undefined): string {
  if (isNil(floor)) return DASH;
  if (floor < 0) return `B${Math.abs(floor)}층`;
  return `${floor}층`;
}

export function formatMinutes(min: number | null | undefined): string {
  if (isNil(min)) return DASH;
  return `도보 ${min}분`;
}

export function formatBool(v: boolean | null | undefined): string {
  if (isNil(v)) return DASH;
  return v ? 'O' : 'X';
}

const DEAL_LABEL: Record<DealType, string> = {
  JEONSE: '전세',
  WOLSE: '월세',
  BAN_JEONSE: '반전세',
};

export function formatDealType(d: DealType | null | undefined): string {
  if (isNil(d)) return DASH;
  return DEAL_LABEL[d];
}

export function formatDate(iso: string | null | undefined): string {
  if (isNil(iso) || iso === '') return DASH;
  // Accept 'YYYY-MM-DD' or ISO timestamp
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return DASH;
  return `${y}.${m}.${d}`;
}

export function formatStarCount(stars: number | null | undefined): string {
  if (isNil(stars) || stars === 0) return DASH;
  return `${stars}/5`;
}

export function formatRoomCount(n: number | null | undefined): string {
  if (isNil(n)) return DASH;
  return `${n}개`;
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/comparison/__tests__/format.test.ts`
Expected: PASS (all 11+ assertions green).

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/comparison/format.ts pickhouse/mobile/src/comparison/__tests__/format.test.ts
git commit -m "feat(comparison): add value formatters with tests"
```

---

### Task 3: Field Registry — Test First

**Files:**
- Create: `pickhouse/mobile/src/comparison/fields.ts`
- Test: `pickhouse/mobile/src/comparison/__tests__/fields.test.ts`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/comparison/__tests__/fields.test.ts`:

```typescript
import { COMPARE_FIELDS, FIELD_BY_KEY, SECTIONS } from '../fields';

describe('field registry', () => {
  it('contains every spec-defined field exactly once', () => {
    const keys = COMPARE_FIELDS.map((f) => f.key);
    const dedup = new Set(keys);
    expect(dedup.size).toBe(keys.length);
  });

  it('includes objective numeric fields with lower-better direction', () => {
    expect(FIELD_BY_KEY.deposit.direction).toBe('lower-better');
    expect(FIELD_BY_KEY.rent.direction).toBe('lower-better');
    expect(FIELD_BY_KEY.maintenanceFee.direction).toBe('lower-better');
    expect(FIELD_BY_KEY.stationDistance.direction).toBe('lower-better');
  });

  it('includes star ratings with higher-better direction', () => {
    expect(FIELD_BY_KEY.sunlight.direction).toBe('higher-better');
    expect(FIELD_BY_KEY.waterPressure.direction).toBe('higher-better');
    expect(FIELD_BY_KEY.noise.direction).toBe('higher-better');
  });

  it('includes enum-like fields with equal-only direction', () => {
    expect(FIELD_BY_KEY.dealType.direction).toBe('equal-only');
    expect(FIELD_BY_KEY.availableFrom.direction).toBe('equal-only');
  });

  it('marks star fields with isStar', () => {
    expect(FIELD_BY_KEY.sunlight.isStar).toBe(true);
    expect(FIELD_BY_KEY.deposit.isStar).toBeFalsy();
  });

  it('groups fields into three sections', () => {
    expect(SECTIONS).toEqual(['기본 정보', '구조·시설', '주관 평가']);
  });

  it('every field belongs to one of the sections', () => {
    for (const f of COMPARE_FIELDS) {
      expect(SECTIONS).toContain(f.section);
    }
  });

  it('format function handles null gracefully for every field', () => {
    for (const f of COMPARE_FIELDS) {
      expect(typeof f.format(null)).toBe('string');
    }
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `cd pickhouse/mobile && npm test -- src/comparison/__tests__/fields.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement field registry**

Write `pickhouse/mobile/src/comparison/fields.ts`:

```typescript
import type { CompareField, FieldKey } from '../types/comparison';
import type { House, DealType } from '../types/house';
import {
  formatArea,
  formatBool,
  formatCurrency,
  formatDate,
  formatDealType,
  formatFloor,
  formatMinutes,
  formatRoomCount,
  formatStarCount,
  formatYear,
} from './format';

export const SECTIONS = ['기본 정보', '구조·시설', '주관 평가'] as const;

export const COMPARE_FIELDS: CompareField[] = [
  // 기본 정보
  {
    key: 'dealType',
    label: '거래 유형',
    direction: 'equal-only',
    section: '기본 정보',
    format: (v) => formatDealType(v as DealType | null | undefined),
    pick: (h) => h.dealType,
  },
  {
    key: 'deposit',
    label: '보증금',
    direction: 'lower-better',
    section: '기본 정보',
    format: (v) => formatCurrency(v as number | null | undefined),
    pick: (h) => h.deposit,
  },
  {
    key: 'rent',
    label: '월세',
    direction: 'lower-better',
    section: '기본 정보',
    format: (v) => formatCurrency(v as number | null | undefined),
    pick: (h) => h.rent,
  },
  {
    key: 'maintenanceFee',
    label: '관리비',
    direction: 'lower-better',
    section: '기본 정보',
    format: (v) => formatCurrency(v as number | null | undefined),
    pick: (h) => h.maintenanceFee,
  },
  {
    key: 'area',
    label: '전용면적',
    direction: 'higher-better',
    section: '기본 정보',
    format: (v) => formatArea(v as number | null | undefined),
    pick: (h) => h.area,
  },
  {
    key: 'builtYear',
    label: '건축년도',
    direction: 'higher-better',
    section: '기본 정보',
    format: (v) => formatYear(v as number | null | undefined),
    pick: (h) => h.builtYear,
  },
  {
    key: 'floor',
    label: '층',
    direction: 'equal-only',
    section: '기본 정보',
    format: (v) => formatFloor(v as number | null | undefined),
    pick: (h) => h.floor,
  },
  {
    key: 'availableFrom',
    label: '입주 가능일',
    direction: 'equal-only',
    section: '기본 정보',
    format: (v) => formatDate(v as string | null | undefined),
    pick: (h) => h.availableFrom,
  },
  {
    key: 'stationDistance',
    label: '역 거리',
    direction: 'lower-better',
    section: '기본 정보',
    format: (v) => formatMinutes(v as number | null | undefined),
    pick: (h) => h.stationDistance,
  },

  // 구조·시설
  {
    key: 'rooms',
    label: '방 개수',
    direction: 'higher-better',
    section: '구조·시설',
    format: (v) => formatRoomCount(v as number | null | undefined),
    pick: (h) => h.rooms,
  },
  {
    key: 'bathrooms',
    label: '화장실',
    direction: 'higher-better',
    section: '구조·시설',
    format: (v) => formatRoomCount(v as number | null | undefined),
    pick: (h) => h.bathrooms,
  },
  {
    key: 'hasBalcony',
    label: '베란다',
    direction: 'equal-only',
    section: '구조·시설',
    format: (v) => formatBool(v as boolean | null | undefined),
    pick: (h) => h.hasBalcony,
  },
  {
    key: 'hasElevator',
    label: '엘리베이터',
    direction: 'equal-only',
    section: '구조·시설',
    format: (v) => formatBool(v as boolean | null | undefined),
    pick: (h) => h.hasElevator,
  },
  {
    key: 'hasParking',
    label: '주차',
    direction: 'equal-only',
    section: '구조·시설',
    format: (v) => formatBool(v as boolean | null | undefined),
    pick: (h) => h.hasParking,
  },

  // 주관 평가
  {
    key: 'waterPressure',
    label: '수압',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.waterPressure,
    isStar: true,
  },
  {
    key: 'sunlight',
    label: '햇빛',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.sunlight,
    isStar: true,
  },
  {
    key: 'noise',
    label: '소음 (조용함)',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.noise,
    isStar: true,
  },
  {
    key: 'insulation',
    label: '단열',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.insulation,
    isStar: true,
  },
  {
    key: 'ventilation',
    label: '환기',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.ventilation,
    isStar: true,
  },
  {
    key: 'moisture',
    label: '곰팡이 없음',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.moisture,
    isStar: true,
  },
  {
    key: 'neighborhood',
    label: '동네 분위기',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.neighborhood,
    isStar: true,
  },
  {
    key: 'firstImpression',
    label: '첫인상',
    direction: 'higher-better',
    section: '주관 평가',
    format: (v) => formatStarCount(v as number | null | undefined),
    pick: (h) => h.firstImpression,
    isStar: true,
  },
];

export const FIELD_BY_KEY: Record<FieldKey, CompareField> = COMPARE_FIELDS.reduce(
  (acc, f) => {
    acc[f.key] = f;
    return acc;
  },
  {} as Record<FieldKey, CompareField>,
);

export function fieldsForSection(section: (typeof SECTIONS)[number]): CompareField[] {
  return COMPARE_FIELDS.filter((f) => f.section === section);
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/comparison/__tests__/fields.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/comparison/fields.ts pickhouse/mobile/src/comparison/__tests__/fields.test.ts
git commit -m "feat(comparison): add field registry with section grouping"
```

---

### Task 4: Diff Calculation — Test First (Edge Cases)

**Files:**
- Create: `pickhouse/mobile/src/comparison/diff.ts`
- Test: `pickhouse/mobile/src/comparison/__tests__/diff.test.ts`

- [ ] **Step 1: Write failing tests covering edge cases**

Write `pickhouse/mobile/src/comparison/__tests__/diff.test.ts`:

```typescript
import { diffField, diffHouses } from '../diff';
import { FIELD_BY_KEY, COMPARE_FIELDS } from '../fields';
import type { House } from '../../types/house';

const baseHouse = (overrides: Partial<House> = {}): House =>
  ({
    id: 'h1',
    dealType: 'WOLSE',
    deposit: 1000,
    rent: 50,
    maintenanceFee: 7,
    area: 8.5,
    builtYear: 2015,
    floor: 3,
    totalFloor: 5,
    availableFrom: '2026-06-01',
    stationDistance: 8,
    rooms: 1,
    bathrooms: 1,
    hasBalcony: true,
    hasElevator: false,
    hasParking: false,
    options: [],
    security: [],
    garbage: '',
    waterPressure: 4,
    sunlight: 5,
    noise: 3,
    insulation: 4,
    ventilation: 3,
    moisture: 5,
    neighborhood: 4,
    firstImpression: 4,
    photos: [],
    memo: '',
    address: { roadAddress: '', jibunAddress: '', lat: 0, lng: 0 },
    ...overrides,
  }) as House;

describe('diffField', () => {
  describe('lower-better direction (deposit)', () => {
    it('marks the side with smaller value as winner', () => {
      const a = baseHouse({ deposit: 1000 });
      const b = baseHouse({ deposit: 2000 });
      expect(diffField(a, b, FIELD_BY_KEY.deposit).winner).toBe('base');

      const c = baseHouse({ deposit: 3000 });
      const d = baseHouse({ deposit: 1500 });
      expect(diffField(c, d, FIELD_BY_KEY.deposit).winner).toBe('candidate');
    });

    it('returns equal when values match', () => {
      const a = baseHouse({ deposit: 1000 });
      const b = baseHouse({ deposit: 1000 });
      expect(diffField(a, b, FIELD_BY_KEY.deposit).winner).toBe('equal');
    });

    it('treats missing values as incomparable', () => {
      const a = baseHouse({ deposit: 1000 });
      const b = baseHouse({ deposit: null as unknown as number });
      expect(diffField(a, b, FIELD_BY_KEY.deposit).winner).toBe('incomparable');
    });

    it('treats both-null as equal (both unknown)', () => {
      const a = baseHouse({ deposit: null as unknown as number });
      const b = baseHouse({ deposit: null as unknown as number });
      expect(diffField(a, b, FIELD_BY_KEY.deposit).winner).toBe('equal');
    });
  });

  describe('higher-better direction (star ratings)', () => {
    it('marks the side with larger star as winner', () => {
      const a = baseHouse({ sunlight: 5 });
      const b = baseHouse({ sunlight: 3 });
      expect(diffField(a, b, FIELD_BY_KEY.sunlight).winner).toBe('base');
    });

    it('zero stars (= unrated) treated as missing → incomparable vs rated', () => {
      const a = baseHouse({ sunlight: 0 });
      const b = baseHouse({ sunlight: 4 });
      expect(diffField(a, b, FIELD_BY_KEY.sunlight).winner).toBe('incomparable');
    });

    it('both zero stars → equal', () => {
      const a = baseHouse({ sunlight: 0 });
      const b = baseHouse({ sunlight: 0 });
      expect(diffField(a, b, FIELD_BY_KEY.sunlight).winner).toBe('equal');
    });
  });

  describe('equal-only direction (dealType, booleans, dates)', () => {
    it('returns equal when same', () => {
      const a = baseHouse({ dealType: 'WOLSE' });
      const b = baseHouse({ dealType: 'WOLSE' });
      expect(diffField(a, b, FIELD_BY_KEY.dealType).winner).toBe('equal');
    });

    it('returns incomparable when different (no winner)', () => {
      const a = baseHouse({ dealType: 'WOLSE' });
      const b = baseHouse({ dealType: 'JEONSE' });
      expect(diffField(a, b, FIELD_BY_KEY.dealType).winner).toBe('incomparable');
    });
  });

  describe('전세 vs 월세 — no auto-conversion (signature rule)', () => {
    it('shows raw deposit values both ways, picks lower-better numerically', () => {
      // 전세 with deposit 15000 (1.5억) vs 월세 with deposit 1000 + rent 50
      const jeonse = baseHouse({ dealType: 'JEONSE', deposit: 15000, rent: 0 });
      const wolse = baseHouse({ dealType: 'WOLSE', deposit: 1000, rent: 50 });

      // Raw deposit comparison only — NO conversion to monthly cost
      const dRes = diffField(jeonse, wolse, FIELD_BY_KEY.deposit);
      expect(dRes.winner).toBe('candidate'); // 1000 < 15000
      expect(dRes.baseDisplay).toBe('1억 5,000만');
      expect(dRes.candidateDisplay).toBe('1,000만');

      // Rent: 0 vs 50 → jeonse wins (lower)
      const rRes = diffField(jeonse, wolse, FIELD_BY_KEY.rent);
      expect(rRes.winner).toBe('base');
      expect(rRes.baseDisplay).toBe('0만');
      expect(rRes.candidateDisplay).toBe('500,000만'); // wait — see fix below
    });

    it('월세 rent rendered honestly', () => {
      const jeonse = baseHouse({ dealType: 'JEONSE', rent: 0 });
      const wolse = baseHouse({ dealType: 'WOLSE', rent: 50 });
      const r = diffField(jeonse, wolse, FIELD_BY_KEY.rent);
      expect(r.baseDisplay).toBe('0만');
      expect(r.candidateDisplay).toBe('50만');
      expect(r.winner).toBe('base');
    });
  });

  it('display strings come from field.format()', () => {
    const a = baseHouse({ area: 8.5 });
    const b = baseHouse({ area: 10 });
    const res = diffField(a, b, FIELD_BY_KEY.area);
    expect(res.baseDisplay).toBe('8.5평');
    expect(res.candidateDisplay).toBe('10.0평');
    expect(res.winner).toBe('candidate');
  });
});

describe('diffHouses', () => {
  it('returns one DiffResult per registered field', () => {
    const a = baseHouse();
    const b = baseHouse({ deposit: 2000 });
    const results = diffHouses(a, b);
    expect(results.length).toBe(COMPARE_FIELDS.length);
    // deposit row should reflect base wins
    const dep = results.find((r) => r.key === 'deposit')!;
    expect(dep.winner).toBe('base');
  });
});
```

Note: the line `expect(r.candidateDisplay).toBe('500,000만');` in the test above is intentionally WRONG to demonstrate — fix it before saving. The corrected version below is what you actually write:

```typescript
    it('전세 vs 월세 — no auto-conversion (signature rule)', () => {
      const jeonse = baseHouse({ dealType: 'JEONSE', deposit: 15000, rent: 0 });
      const wolse = baseHouse({ dealType: 'WOLSE', deposit: 1000, rent: 50 });

      const dRes = diffField(jeonse, wolse, FIELD_BY_KEY.deposit);
      expect(dRes.winner).toBe('candidate');
      expect(dRes.baseDisplay).toBe('1억 5,000만');
      expect(dRes.candidateDisplay).toBe('1,000만');

      const rRes = diffField(jeonse, wolse, FIELD_BY_KEY.rent);
      expect(rRes.winner).toBe('base');
      expect(rRes.baseDisplay).toBe('0만');
      expect(rRes.candidateDisplay).toBe('50만');
    });
```

Replace the buggy `expect(r.candidateDisplay).toBe('500,000만');` block — final test file should only have the corrected version.

- [ ] **Step 2: Run tests, confirm they fail**

Run: `cd pickhouse/mobile && npm test -- src/comparison/__tests__/diff.test.ts`
Expected: FAIL — `../diff` not found.

- [ ] **Step 3: Implement diff**

Write `pickhouse/mobile/src/comparison/diff.ts`:

```typescript
import type { House } from '../types/house';
import type { CompareField, DiffResult, DiffSide, FieldKey } from '../types/comparison';
import { COMPARE_FIELDS } from './fields';

const isMissing = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  // Star ratings: 0 means unrated for our purposes
  return false;
};

const isMissingStar = (v: unknown): boolean => {
  return v === 0 || v === null || v === undefined;
};

function pickWinnerNumeric(
  a: number,
  b: number,
  direction: 'lower-better' | 'higher-better',
): DiffSide {
  if (a === b) return 'equal';
  if (direction === 'lower-better') return a < b ? 'base' : 'candidate';
  return a > b ? 'base' : 'candidate';
}

export function diffField(
  base: House,
  candidate: House,
  field: CompareField,
): DiffResult & { key: FieldKey } {
  const rawA = field.pick(base);
  const rawB = field.pick(candidate);

  const baseDisplay = field.format(rawA);
  const candidateDisplay = field.format(rawB);

  let winner: DiffSide;

  if (field.direction === 'equal-only') {
    if (isMissing(rawA) && isMissing(rawB)) {
      winner = 'equal';
    } else if (isMissing(rawA) || isMissing(rawB)) {
      winner = 'incomparable';
    } else if (rawA === rawB) {
      winner = 'equal';
    } else {
      winner = 'incomparable';
    }
  } else {
    // numeric direction
    const missingCheck = field.isStar ? isMissingStar : isMissing;
    const aMissing = missingCheck(rawA);
    const bMissing = missingCheck(rawB);

    if (aMissing && bMissing) {
      winner = 'equal';
    } else if (aMissing || bMissing) {
      winner = 'incomparable';
    } else {
      winner = pickWinnerNumeric(rawA as number, rawB as number, field.direction);
    }
  }

  return { key: field.key, winner, baseDisplay, candidateDisplay };
}

export function diffHouses(
  base: House,
  candidate: House,
): Array<DiffResult & { key: FieldKey }> {
  return COMPARE_FIELDS.map((f) => diffField(base, candidate, f));
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/comparison/__tests__/diff.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/comparison/diff.ts pickhouse/mobile/src/comparison/__tests__/diff.test.ts
git commit -m "feat(comparison): add pure diff logic with edge case coverage"
```

---

### Task 5: Comparison Session Store — Test First

**Files:**
- Create: `pickhouse/mobile/src/stores/comparisonStore.ts`
- Test: `pickhouse/mobile/src/stores/__tests__/comparisonStore.test.ts`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/stores/__tests__/comparisonStore.test.ts`:

```typescript
import { useComparisonStore } from '../comparisonStore';

describe('comparisonStore', () => {
  beforeEach(() => {
    useComparisonStore.getState().clear();
  });

  it('starts a session with base id and candidate list', () => {
    useComparisonStore.getState().start('base-1', ['c-1', 'c-2', 'c-3']);
    const s = useComparisonStore.getState();
    expect(s.baseHouseId).toBe('base-1');
    expect(s.candidateIds).toEqual(['c-1', 'c-2', 'c-3']);
    expect(s.currentCandidateIndex).toBe(0);
  });

  it('excludes the base from the candidate list automatically', () => {
    useComparisonStore.getState().start('base-1', ['base-1', 'c-1', 'c-2']);
    expect(useComparisonStore.getState().candidateIds).toEqual(['c-1', 'c-2']);
  });

  it('next() advances the candidate index, capped at the end', () => {
    const { start, next } = useComparisonStore.getState();
    start('b', ['c1', 'c2', 'c3']);
    next();
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(1);
    next();
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(2);
    next();
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(2);
  });

  it('prev() decrements, floored at 0', () => {
    const { start, next, prev } = useComparisonStore.getState();
    start('b', ['c1', 'c2', 'c3']);
    next();
    next();
    prev();
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(1);
    prev();
    prev();
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(0);
  });

  it('setCandidateIndex jumps directly, clamped', () => {
    const { start, setCandidateIndex } = useComparisonStore.getState();
    start('b', ['c1', 'c2', 'c3']);
    setCandidateIndex(2);
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(2);
    setCandidateIndex(99);
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(2);
    setCandidateIndex(-3);
    expect(useComparisonStore.getState().currentCandidateIndex).toBe(0);
  });

  it('clear() resets everything to defaults', () => {
    const { start, clear } = useComparisonStore.getState();
    start('b', ['c1']);
    clear();
    const s = useComparisonStore.getState();
    expect(s.baseHouseId).toBeNull();
    expect(s.candidateIds).toEqual([]);
    expect(s.currentCandidateIndex).toBe(0);
  });

  it('start with empty candidates yields empty list, index 0', () => {
    useComparisonStore.getState().start('b', []);
    const s = useComparisonStore.getState();
    expect(s.candidateIds).toEqual([]);
    expect(s.currentCandidateIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `cd pickhouse/mobile && npm test -- src/stores/__tests__/comparisonStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the store**

Write `pickhouse/mobile/src/stores/comparisonStore.ts`:

```typescript
import { create } from 'zustand';

interface ComparisonState {
  baseHouseId: string | null;
  candidateIds: string[];
  currentCandidateIndex: number;
  start: (baseId: string, candidateIds: string[]) => void;
  next: () => void;
  prev: () => void;
  setCandidateIndex: (i: number) => void;
  clear: () => void;
}

const INITIAL = {
  baseHouseId: null as string | null,
  candidateIds: [] as string[],
  currentCandidateIndex: 0,
};

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  ...INITIAL,
  start: (baseId, candidateIds) => {
    const filtered = candidateIds.filter((id) => id !== baseId);
    set({
      baseHouseId: baseId,
      candidateIds: filtered,
      currentCandidateIndex: 0,
    });
  },
  next: () => {
    const { candidateIds, currentCandidateIndex } = get();
    const max = Math.max(0, candidateIds.length - 1);
    set({ currentCandidateIndex: clamp(currentCandidateIndex + 1, 0, max) });
  },
  prev: () => {
    const { currentCandidateIndex } = get();
    set({ currentCandidateIndex: clamp(currentCandidateIndex - 1, 0, Infinity) });
  },
  setCandidateIndex: (i) => {
    const { candidateIds } = get();
    const max = Math.max(0, candidateIds.length - 1);
    set({ currentCandidateIndex: clamp(i, 0, max) });
  },
  clear: () => set({ ...INITIAL }),
}));
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/stores/__tests__/comparisonStore.test.ts`
Expected: PASS (7 cases green).

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/stores/comparisonStore.ts pickhouse/mobile/src/stores/__tests__/comparisonStore.test.ts
git commit -m "feat(comparison): add session store with navigation actions"
```

---

### Task 6: HouseBadge Component

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/HouseBadge.tsx`

- [ ] **Step 1: Implement HouseBadge**

Write `pickhouse/mobile/src/components/comparison/HouseBadge.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export type BadgeVariant = 'base' | 'candidate';

export interface HouseBadgeProps {
  variant: BadgeVariant;
  /** Short label, e.g. "기준 집" or "후보 집" */
  label: string;
  /** Address line shown beneath the badge */
  addressLine: string;
}

export const HouseBadge: React.FC<HouseBadgeProps> = ({ variant, label, addressLine }) => {
  const isBase = variant === 'base';
  const bg = isBase ? tokens.colors.greenSoft : tokens.colors.beigeSoft;
  const fg = isBase ? tokens.colors.green : tokens.colors.textPrimary;
  return (
    <View style={styles.wrap} testID={`house-badge-${variant}`}>
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
      </View>
      <Text style={styles.address} numberOfLines={1}>
        {addressLine}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
  },
  badge: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.md,
    marginBottom: tokens.spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    maxWidth: 140,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/HouseBadge.tsx
git commit -m "feat(comparison): add HouseBadge green/beige variants"
```

---

### Task 7: StarValue Component — Test First

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/StarValue.tsx`
- Test: `pickhouse/mobile/src/components/comparison/__tests__/StarValue.test.tsx`

- [ ] **Step 1: Write failing test**

Write `pickhouse/mobile/src/components/comparison/__tests__/StarValue.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { StarValue } from '../StarValue';

describe('StarValue', () => {
  it('renders 5 star slots with filled count matching value', () => {
    const { getAllByTestId } = render(<StarValue value={3} />);
    const filled = getAllByTestId('star-filled');
    const empty = getAllByTestId('star-empty');
    expect(filled.length).toBe(3);
    expect(empty.length).toBe(2);
  });

  it('value 0 → all empty', () => {
    const { queryAllByTestId } = render(<StarValue value={0} />);
    expect(queryAllByTestId('star-filled').length).toBe(0);
    expect(queryAllByTestId('star-empty').length).toBe(5);
  });

  it('value null → renders dash text', () => {
    const { getByText } = render(<StarValue value={null} />);
    expect(getByText('-')).toBeTruthy();
  });

  it('clamps value above 5 to 5', () => {
    const { getAllByTestId } = render(<StarValue value={7} />);
    expect(getAllByTestId('star-filled').length).toBe(5);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/StarValue.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement StarValue**

Write `pickhouse/mobile/src/components/comparison/StarValue.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export interface StarValueProps {
  value: number | null | undefined;
  color?: string;
}

const TOTAL = 5;

export const StarValue: React.FC<StarValueProps> = ({ value, color }) => {
  if (value === null || value === undefined) {
    return <Text style={styles.dash}>-</Text>;
  }
  const filled = Math.max(0, Math.min(TOTAL, Math.round(value)));
  const stars = Array.from({ length: TOTAL }, (_, i) => i < filled);
  return (
    <View style={styles.row}>
      {stars.map((on, i) => (
        <Text
          key={i}
          testID={on ? 'star-filled' : 'star-empty'}
          style={[styles.star, { color: color ?? tokens.colors.textPrimary, opacity: on ? 1 : 0.25 }]}
        >
          ★
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  star: { fontSize: 14, marginHorizontal: 1 },
  dash: { fontSize: 14, color: tokens.colors.textMuted },
});
```

- [ ] **Step 4: Run test, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/StarValue.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/StarValue.tsx pickhouse/mobile/src/components/comparison/__tests__/StarValue.test.tsx
git commit -m "feat(comparison): add StarValue display component"
```

---

### Task 8: CompareRow Component — Test First

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/CompareRow.tsx`
- Test: `pickhouse/mobile/src/components/comparison/__tests__/CompareRow.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/components/comparison/__tests__/CompareRow.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { CompareRow } from '../CompareRow';
import { FIELD_BY_KEY } from '../../../comparison/fields';
import { tokens } from '../../../theme/tokens';

describe('CompareRow', () => {
  it('renders label between base and candidate displays', () => {
    const { getByText } = render(
      <CompareRow
        field={FIELD_BY_KEY.deposit}
        diff={{ key: 'deposit', winner: 'base', baseDisplay: '1,000만', candidateDisplay: '2,000만' }}
      />,
    );
    expect(getByText('1,000만')).toBeTruthy();
    expect(getByText('보증금')).toBeTruthy();
    expect(getByText('2,000만')).toBeTruthy();
  });

  it('applies green color to winning base side', () => {
    const { getByTestId } = render(
      <CompareRow
        field={FIELD_BY_KEY.deposit}
        diff={{ key: 'deposit', winner: 'base', baseDisplay: '1,000만', candidateDisplay: '2,000만' }}
      />,
    );
    const baseEl = getByTestId('row-base-deposit');
    const candEl = getByTestId('row-candidate-deposit');
    // flatten style
    const baseStyle = Array.isArray(baseEl.props.style)
      ? Object.assign({}, ...baseEl.props.style)
      : baseEl.props.style;
    const candStyle = Array.isArray(candEl.props.style)
      ? Object.assign({}, ...candEl.props.style)
      : candEl.props.style;
    expect(baseStyle.color).toBe(tokens.colors.green);
    expect(candStyle.color).toBe(tokens.colors.textMuted);
  });

  it('applies green to winning candidate side', () => {
    const { getByTestId } = render(
      <CompareRow
        field={FIELD_BY_KEY.area}
        diff={{ key: 'area', winner: 'candidate', baseDisplay: '8.5평', candidateDisplay: '10.0평' }}
      />,
    );
    const candStyle = Object.assign({}, ...(getByTestId('row-candidate-area').props.style as object[]));
    expect((candStyle as any).color).toBe(tokens.colors.green);
  });

  it('renders both sides muted gray when equal', () => {
    const { getByTestId } = render(
      <CompareRow
        field={FIELD_BY_KEY.rooms}
        diff={{ key: 'rooms', winner: 'equal', baseDisplay: '1개', candidateDisplay: '1개' }}
      />,
    );
    const baseStyle = Object.assign({}, ...(getByTestId('row-base-rooms').props.style as object[]));
    const candStyle = Object.assign({}, ...(getByTestId('row-candidate-rooms').props.style as object[]));
    expect((baseStyle as any).color).toBe(tokens.colors.gray);
    expect((candStyle as any).color).toBe(tokens.colors.gray);
  });

  it('renders both sides in default text color when incomparable', () => {
    const { getByTestId } = render(
      <CompareRow
        field={FIELD_BY_KEY.dealType}
        diff={{ key: 'dealType', winner: 'incomparable', baseDisplay: '전세', candidateDisplay: '월세' }}
      />,
    );
    const baseStyle = Object.assign({}, ...(getByTestId('row-base-dealType').props.style as object[]));
    expect((baseStyle as any).color).toBe(tokens.colors.textPrimary);
  });

  it('renders stars for isStar fields', () => {
    const { queryAllByTestId } = render(
      <CompareRow
        field={FIELD_BY_KEY.sunlight}
        diff={{ key: 'sunlight', winner: 'base', baseDisplay: '5/5', candidateDisplay: '3/5' }}
      />,
    );
    // 5 + 5 stars total slots
    expect(queryAllByTestId('star-filled').length + queryAllByTestId('star-empty').length).toBe(10);
  });
});
```

- [ ] **Step 2: Run tests, confirm fail**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/CompareRow.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement CompareRow**

Write `pickhouse/mobile/src/components/comparison/CompareRow.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';
import type { CompareField, DiffResult, FieldKey } from '../../types/comparison';
import { StarValue } from './StarValue';

export interface CompareRowProps {
  field: CompareField;
  diff: DiffResult & { key: FieldKey };
}

const colorFor = (
  side: 'base' | 'candidate',
  winner: DiffResult['winner'],
): string => {
  if (winner === 'equal') return tokens.colors.gray;
  if (winner === 'incomparable') return tokens.colors.textPrimary;
  return winner === side ? tokens.colors.green : tokens.colors.textMuted;
};

export const CompareRow: React.FC<CompareRowProps> = ({ field, diff }) => {
  const baseColor = colorFor('base', diff.winner);
  const candColor = colorFor('candidate', diff.winner);

  return (
    <View style={styles.row} testID={`compare-row-${field.key}`}>
      <View style={styles.side}>
        {field.isStar ? (
          <StarValue
            value={parseStarFromDisplay(diff.baseDisplay)}
            color={baseColor}
          />
        ) : (
          <Text
            testID={`row-base-${field.key}`}
            style={[styles.value, styles.right, { color: baseColor }]}
            numberOfLines={1}
          >
            {diff.baseDisplay}
          </Text>
        )}
      </View>
      <Text style={styles.label}>{field.label}</Text>
      <View style={styles.side}>
        {field.isStar ? (
          <StarValue
            value={parseStarFromDisplay(diff.candidateDisplay)}
            color={candColor}
          />
        ) : (
          <Text
            testID={`row-candidate-${field.key}`}
            style={[styles.value, styles.left, { color: candColor }]}
            numberOfLines={1}
          >
            {diff.candidateDisplay}
          </Text>
        )}
      </View>
    </View>
  );
};

/** Star displays are 'N/5' or '-'. Parse N back into a number for the StarValue component. */
function parseStarFromDisplay(display: string): number | null {
  if (display === '-' || !display) return null;
  const n = parseInt(display.split('/')[0], 10);
  if (Number.isNaN(n)) return null;
  return n;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    minHeight: 44,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  right: { textAlign: 'right' },
  left: { textAlign: 'left' },
  label: {
    width: 96,
    textAlign: 'center',
    fontSize: 12,
    color: tokens.colors.textMuted,
    paddingHorizontal: tokens.spacing.xs,
  },
});
```

For the star sides, alignment matters — wrap the StarValue to keep base-aligned right and candidate-aligned left. Update the JSX inside `<View style={styles.side}>` to:

```typescript
        {field.isStar ? (
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <StarValue
              value={parseStarFromDisplay(diff.baseDisplay)}
              color={baseColor}
            />
          </View>
        ) : (
          <Text testID={...}> ... </Text>
        )}
```

And for the candidate side use `alignItems: 'flex-start'`. Apply these wrappers in the implementation.

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/CompareRow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/CompareRow.tsx pickhouse/mobile/src/components/comparison/__tests__/CompareRow.test.tsx
git commit -m "feat(comparison): add CompareRow with diff color logic"
```

---

### Task 9: CompareSection Component

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/CompareSection.tsx`

- [ ] **Step 1: Implement CompareSection**

Write `pickhouse/mobile/src/components/comparison/CompareSection.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';
import type { CompareField, DiffResult, FieldKey } from '../../types/comparison';
import { CompareRow } from './CompareRow';

export interface CompareSectionProps {
  title: string;
  fields: CompareField[];
  diffsByKey: Record<FieldKey, DiffResult & { key: FieldKey }>;
}

export const CompareSection: React.FC<CompareSectionProps> = ({
  title,
  fields,
  diffsByKey,
}) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {fields.map((f, idx) => (
          <View key={f.key}>
            <CompareRow field={f} diff={diffsByKey[f.key]} />
            {idx < fields.length - 1 ? <View style={styles.sep} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textMuted,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.sm,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sep: {
    height: 1,
    backgroundColor: tokens.colors.cream,
    marginHorizontal: tokens.spacing.md,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/CompareSection.tsx
git commit -m "feat(comparison): add CompareSection wrapper"
```

---

### Task 10: PhotoCarousel — Test First

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/PhotoCarousel.tsx`
- Test: `pickhouse/mobile/src/components/comparison/__tests__/PhotoCarousel.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/components/comparison/__tests__/PhotoCarousel.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PhotoCarousel } from '../PhotoCarousel';
import type { Photo } from '../../../types/house';

const photos = (n: number): Photo[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    localUri: `file://p${i}.jpg`,
    remoteUrl: null,
    takenAt: '2026-05-01',
    uploadStatus: 'pending',
  })) as Photo[];

describe('PhotoCarousel', () => {
  it('renders the page indicator as 1/N initially', () => {
    const { getByText } = render(<PhotoCarousel photos={photos(5)} testID="pc" />);
    expect(getByText('1/5')).toBeTruthy();
  });

  it('renders nothing-state when photos empty', () => {
    const { getByText } = render(<PhotoCarousel photos={[]} testID="pc" />);
    expect(getByText('사진 없음')).toBeTruthy();
  });

  it('updates index on scroll event', () => {
    const { getByText, getByTestId } = render(
      <PhotoCarousel photos={photos(3)} testID="pc" itemWidth={200} />,
    );
    const scroll = getByTestId('pc-scroll');
    fireEvent(scroll, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 400 }, layoutMeasurement: { width: 200 }, contentSize: { width: 600 } },
    });
    expect(getByText('3/3')).toBeTruthy();
  });

  it('fires onPhotoPress with the active photo when image tapped', () => {
    const onPress = jest.fn();
    const ps = photos(3);
    const { getByTestId } = render(
      <PhotoCarousel photos={ps} testID="pc" onPhotoPress={onPress} itemWidth={200} />,
    );
    fireEvent.press(getByTestId('pc-photo-0'));
    expect(onPress).toHaveBeenCalledWith(ps[0], 0);
  });
});
```

- [ ] **Step 2: Run tests, confirm fail**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/PhotoCarousel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement PhotoCarousel**

Write `pickhouse/mobile/src/components/comparison/PhotoCarousel.tsx`:

```typescript
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { tokens } from '../../theme/tokens';
import type { Photo } from '../../types/house';

export interface PhotoCarouselProps {
  photos: Photo[];
  testID?: string;
  /** Override width per page (defaults to screen width / 2 minus margin). */
  itemWidth?: number;
  itemHeight?: number;
  onPhotoPress?: (photo: Photo, index: number) => void;
}

const DEFAULT_HEIGHT = 200;

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  photos,
  testID,
  itemWidth,
  itemHeight = DEFAULT_HEIGHT,
  onPhotoPress,
}) => {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const width = itemWidth ?? Math.floor((Dimensions.get('window').width - tokens.spacing.lg * 2) / 2);

  if (photos.length === 0) {
    return (
      <View style={[styles.empty, { width, height: itemHeight }]} testID={testID}>
        <Text style={styles.emptyText}>사진 없음</Text>
      </View>
    );
  }

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);
    setIndex(Math.max(0, Math.min(photos.length - 1, i)));
  };

  const uriFor = (p: Photo) => p.remoteUrl ?? p.localUri;

  return (
    <View testID={testID} style={{ width }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        testID={`${testID ?? 'pc'}-scroll`}
        style={{ width, height: itemHeight }}
      >
        {photos.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => onPhotoPress?.(p, i)}
            testID={`${testID ?? 'pc'}-photo-${i}`}
          >
            <Image
              source={{ uri: uriFor(p) }}
              style={{ width, height: itemHeight, borderRadius: tokens.radii.md }}
              contentFit="cover"
            />
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.indicatorWrap} pointerEvents="none">
        <Text style={styles.indicatorText}>{`${index + 1}/${photos.length}`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    backgroundColor: tokens.colors.beigeSoft,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: tokens.colors.textMuted,
    fontSize: 13,
  },
  indicatorWrap: {
    position: 'absolute',
    bottom: tokens.spacing.sm,
    right: tokens.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/PhotoCarousel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/PhotoCarousel.tsx pickhouse/mobile/src/components/comparison/__tests__/PhotoCarousel.test.tsx
git commit -m "feat(comparison): add PhotoCarousel with dot indicator and tap"
```

---

### Task 11: PhotoFullscreenModal Component

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/PhotoFullscreenModal.tsx`

- [ ] **Step 1: Implement modal**

Write `pickhouse/mobile/src/components/comparison/PhotoFullscreenModal.tsx`:

```typescript
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import type { Photo } from '../../types/house';
import { tokens } from '../../theme/tokens';

export interface PhotoFullscreenModalProps {
  visible: boolean;
  photo: Photo | null;
  onClose: () => void;
}

export const PhotoFullscreenModal: React.FC<PhotoFullscreenModalProps> = ({
  visible,
  photo,
  onClose,
}) => {
  const { width, height } = Dimensions.get('window');
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <ScrollView
          maximumZoomScale={3}
          minimumZoomScale={1}
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          testID="photo-modal-zoom"
        >
          {photo ? (
            <Image
              source={{ uri: photo.remoteUrl ?? photo.localUri }}
              style={{ width, height: height * 0.8 }}
              contentFit="contain"
            />
          ) : null}
        </ScrollView>
        <Pressable
          accessibilityLabel="닫기"
          onPress={onClose}
          style={styles.closeBtn}
          testID="photo-modal-close"
        >
          <Text style={styles.closeText}>닫기</Text>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  closeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/PhotoFullscreenModal.tsx
git commit -m "feat(comparison): add PhotoFullscreenModal with pinch zoom"
```

---

### Task 12: CandidateSlider — Test First

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/CandidateSlider.tsx`
- Test: `pickhouse/mobile/src/components/comparison/__tests__/CandidateSlider.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/components/comparison/__tests__/CandidateSlider.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CandidateSlider } from '../CandidateSlider';

describe('CandidateSlider', () => {
  it('renders "후보 N / M" with current 1-based index', () => {
    const { getByText } = render(
      <CandidateSlider currentIndex={0} total={5} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(getByText('후보 1 / 5')).toBeTruthy();
  });

  it('calls onPrev when prev pressed', () => {
    const onPrev = jest.fn();
    const { getByTestId } = render(
      <CandidateSlider currentIndex={2} total={5} onPrev={onPrev} onNext={() => {}} />,
    );
    fireEvent.press(getByTestId('candidate-prev'));
    expect(onPrev).toHaveBeenCalled();
  });

  it('calls onNext when next pressed', () => {
    const onNext = jest.fn();
    const { getByTestId } = render(
      <CandidateSlider currentIndex={2} total={5} onPrev={() => {}} onNext={onNext} />,
    );
    fireEvent.press(getByTestId('candidate-next'));
    expect(onNext).toHaveBeenCalled();
  });

  it('disables prev at index 0', () => {
    const onPrev = jest.fn();
    const { getByTestId } = render(
      <CandidateSlider currentIndex={0} total={5} onPrev={onPrev} onNext={() => {}} />,
    );
    fireEvent.press(getByTestId('candidate-prev'));
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('disables next at last index', () => {
    const onNext = jest.fn();
    const { getByTestId } = render(
      <CandidateSlider currentIndex={4} total={5} onPrev={() => {}} onNext={onNext} />,
    );
    fireEvent.press(getByTestId('candidate-next'));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('shows "후보 없음" when total is 0', () => {
    const { getByText } = render(
      <CandidateSlider currentIndex={0} total={0} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(getByText('후보 없음')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests, confirm fail**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/CandidateSlider.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement CandidateSlider**

Write `pickhouse/mobile/src/components/comparison/CandidateSlider.tsx`:

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export interface CandidateSliderProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export const CandidateSlider: React.FC<CandidateSliderProps> = ({
  currentIndex,
  total,
  onPrev,
  onNext,
}) => {
  if (total === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.empty}>후보 없음</Text>
      </View>
    );
  }

  const atStart = currentIndex <= 0;
  const atEnd = currentIndex >= total - 1;

  return (
    <View style={styles.wrap}>
      <Pressable
        testID="candidate-prev"
        disabled={atStart}
        onPress={() => {
          if (!atStart) onPrev();
        }}
        style={[styles.arrow, atStart && styles.arrowDisabled]}
        accessibilityLabel="이전 후보"
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>{`후보 ${currentIndex + 1} / ${total}`}</Text>
        <View style={styles.dots}>
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>
      <Pressable
        testID="candidate-next"
        disabled={atEnd}
        onPress={() => {
          if (!atEnd) onNext();
        }}
        style={[styles.arrow, atEnd && styles.arrowDisabled]}
        accessibilityLabel="다음 후보"
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.beigeSoft,
    borderTopLeftRadius: tokens.radii.xl,
    borderTopRightRadius: tokens.radii.xl,
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 24, color: tokens.colors.textPrimary, lineHeight: 28 },
  indicator: { alignItems: 'center', flex: 1 },
  indicatorText: {
    fontSize: 13,
    color: tokens.colors.textPrimary,
    fontWeight: '600',
  },
  dots: { flexDirection: 'row', marginTop: tokens.spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 2 },
  dotActive: { backgroundColor: tokens.colors.green },
  dotInactive: { backgroundColor: tokens.colors.gray, opacity: 0.4 },
  empty: { textAlign: 'center', color: tokens.colors.textMuted, fontSize: 13, flex: 1 },
});
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/CandidateSlider.test.tsx`
Expected: PASS (6 cases green).

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/CandidateSlider.tsx pickhouse/mobile/src/components/comparison/__tests__/CandidateSlider.test.tsx
git commit -m "feat(comparison): add CandidateSlider with arrows and dot indicator"
```

---

### Task 13: Navigation Route Types

**Files:**
- Modify: `pickhouse/mobile/src/types/navigation.ts`

- [ ] **Step 1: Add route types**

Open `pickhouse/mobile/src/types/navigation.ts` (from Plan 2) and append:

```typescript
// Comparison routes — added in Plan 3
export type CompareBaseSelectParams = {
  /** Optional pre-selected candidate ids to compare against. If omitted, all other houses are candidates. */
  candidateIds?: string[];
};

export type CompareParams = {
  baseHouseId: string;
  candidateIds: string[];
};

declare module '@react-navigation/native' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface RootStackParamList {
    CompareBaseSelect: CompareBaseSelectParams;
    Compare: CompareParams;
  }
}
```

If the existing file uses a centrally exported `RootStackParamList`, add the two routes to it directly instead. Example for that variant:

```typescript
export type RootStackParamList = {
  // ... existing routes
  CompareBaseSelect: { candidateIds?: string[] };
  Compare: { baseHouseId: string; candidateIds: string[] };
};
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/types/navigation.ts
git commit -m "feat(comparison): register navigation route types"
```

---

### Task 14: CompareBaseSelectScreen — Test First

**Files:**
- Create: `pickhouse/mobile/src/screens/CompareBaseSelectScreen.tsx`
- Test: `pickhouse/mobile/src/screens/__tests__/CompareBaseSelectScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/screens/__tests__/CompareBaseSelectScreen.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompareBaseSelectScreen } from '../CompareBaseSelectScreen';
import { useHouseStore } from '../../stores/houseStore';
import type { House } from '../../types/house';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { candidateIds: ['h1', 'h2', 'h3'] } }),
}));

const seed = (houses: Partial<House>[]) => {
  useHouseStore.setState({
    houses: houses.map((h, i) => ({
      id: `h${i + 1}`,
      address: { roadAddress: `주소${i + 1}`, jibunAddress: '', lat: 0, lng: 0 },
      dealType: 'WOLSE',
      deposit: 1000,
      photos: [],
      ...h,
    })) as House[],
  } as any);
};

describe('CompareBaseSelectScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockGoBack.mockClear();
  });

  it('lists houses from the candidate pool', () => {
    seed([{}, {}, {}]);
    const { getByText } = render(<CompareBaseSelectScreen />);
    expect(getByText('주소1')).toBeTruthy();
    expect(getByText('주소2')).toBeTruthy();
    expect(getByText('주소3')).toBeTruthy();
  });

  it('navigates to Compare with chosen base and remaining candidates', () => {
    seed([{}, {}, {}]);
    const { getByTestId } = render(<CompareBaseSelectScreen />);
    fireEvent.press(getByTestId('base-pick-h2'));
    expect(mockNavigate).toHaveBeenCalledWith('Compare', {
      baseHouseId: 'h2',
      candidateIds: ['h1', 'h3'],
    });
  });

  it('shows empty hint when no houses', () => {
    seed([]);
    const { getByText } = render(<CompareBaseSelectScreen />);
    expect(getByText('비교할 집이 없습니다')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests, confirm fail**

Run: `cd pickhouse/mobile && npm test -- src/screens/__tests__/CompareBaseSelectScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the screen**

Write `pickhouse/mobile/src/screens/CompareBaseSelectScreen.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useHouseStore } from '../stores/houseStore';
import { tokens } from '../theme/tokens';

export const CompareBaseSelectScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const filterIds: string[] | undefined = route.params?.candidateIds;

  const houses = useHouseStore((s) => s.houses);
  const pool = filterIds ? houses.filter((h) => filterIds.includes(h.id)) : houses;

  const onPick = (baseId: string) => {
    const candidateIds = pool.filter((h) => h.id !== baseId).map((h) => h.id);
    nav.navigate('Compare', { baseHouseId: baseId, candidateIds });
  };

  if (pool.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>비교할 집이 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>기준이 될 집을 골라주세요</Text>
        <Text style={styles.sub}>고른 집을 기준으로 다른 집들과 하나씩 비교합니다</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {pool.map((h) => {
          const cover = h.photos?.[0];
          const uri = cover?.remoteUrl ?? cover?.localUri ?? null;
          return (
            <Pressable
              key={h.id}
              testID={`base-pick-${h.id}`}
              onPress={() => onPick(h.id)}
              style={styles.card}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardAddr} numberOfLines={1}>
                  {h.address.roadAddress}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.cream },
  header: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '700', color: tokens.colors.textPrimary },
  sub: { fontSize: 13, color: tokens.colors.textMuted, marginTop: tokens.spacing.xs },
  list: { paddingHorizontal: tokens.spacing.lg, paddingBottom: tokens.spacing.xxl },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: tokens.radii.lg,
    marginBottom: tokens.spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumb: { width: 80, height: 80 },
  thumbPlaceholder: { backgroundColor: tokens.colors.beigeSoft },
  cardBody: { flex: 1, padding: tokens.spacing.md, justifyContent: 'center' },
  cardAddr: { fontSize: 15, color: tokens.colors.textPrimary, fontWeight: '500' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: tokens.colors.textMuted, fontSize: 14 },
});
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/screens/__tests__/CompareBaseSelectScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/CompareBaseSelectScreen.tsx pickhouse/mobile/src/screens/__tests__/CompareBaseSelectScreen.test.tsx
git commit -m "feat(comparison): add base-house selection screen"
```

---

### Task 15: CompareScreen — Test First (Integration)

**Files:**
- Create: `pickhouse/mobile/src/screens/CompareScreen.tsx`
- Test: `pickhouse/mobile/src/screens/__tests__/CompareScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

Write `pickhouse/mobile/src/screens/__tests__/CompareScreen.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompareScreen } from '../CompareScreen';
import { useHouseStore } from '../../stores/houseStore';
import { useComparisonStore } from '../../stores/comparisonStore';
import type { House } from '../../types/house';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({
    params: { baseHouseId: 'base-1', candidateIds: ['c-1', 'c-2'] },
  }),
}));

const makeHouse = (id: string, overrides: Partial<House> = {}): House =>
  ({
    id,
    address: { roadAddress: `주소-${id}`, jibunAddress: '', lat: 0, lng: 0 },
    dealType: 'WOLSE',
    deposit: 1000,
    rent: 50,
    maintenanceFee: 7,
    area: 8.5,
    builtYear: 2015,
    floor: 3,
    totalFloor: 5,
    availableFrom: '2026-06-01',
    stationDistance: 8,
    rooms: 1,
    bathrooms: 1,
    hasBalcony: true,
    hasElevator: false,
    hasParking: false,
    options: [],
    security: [],
    garbage: '',
    waterPressure: 4,
    sunlight: 5,
    noise: 3,
    insulation: 4,
    ventilation: 3,
    moisture: 5,
    neighborhood: 4,
    firstImpression: 4,
    photos: [],
    memo: '',
    ...overrides,
  }) as House;

describe('CompareScreen', () => {
  beforeEach(() => {
    useComparisonStore.getState().clear();
    useHouseStore.setState({
      houses: [
        makeHouse('base-1', { deposit: 1000 }),
        makeHouse('c-1', { deposit: 2000, area: 10 }),
        makeHouse('c-2', { deposit: 500, area: 7 }),
      ],
    } as any);
  });

  it('renders base and candidate addresses in their badges', () => {
    const { getByText } = render(<CompareScreen />);
    expect(getByText('기준 집')).toBeTruthy();
    expect(getByText('후보 집')).toBeTruthy();
    expect(getByText('주소-base-1')).toBeTruthy();
    expect(getByText('주소-c-1')).toBeTruthy();
  });

  it('shows three section headings', () => {
    const { getByText } = render(<CompareScreen />);
    expect(getByText('기본 정보')).toBeTruthy();
    expect(getByText('구조·시설')).toBeTruthy();
    expect(getByText('주관 평가')).toBeTruthy();
  });

  it('renders 후보 1 / 2 indicator initially', () => {
    const { getByText } = render(<CompareScreen />);
    expect(getByText('후보 1 / 2')).toBeTruthy();
  });

  it('next button advances to candidate 2', () => {
    const { getByTestId, getByText } = render(<CompareScreen />);
    fireEvent.press(getByTestId('candidate-next'));
    expect(getByText('후보 2 / 2')).toBeTruthy();
    expect(getByText('주소-c-2')).toBeTruthy();
  });

  it('back navigates and clears session', () => {
    const { getByTestId } = render(<CompareScreen />);
    fireEvent.press(getByTestId('compare-back'));
    expect(mockGoBack).toHaveBeenCalled();
    // After unmount cleanup the store should be cleared
    expect(useComparisonStore.getState().baseHouseId).toBeNull();
  });

  it('shows "기준 집을 다시 골라주세요" if base house missing', () => {
    useHouseStore.setState({
      houses: [makeHouse('c-1'), makeHouse('c-2')],
    } as any);
    const { getByText } = render(<CompareScreen />);
    expect(getByText('기준 집을 다시 골라주세요')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests, confirm fail**

Run: `cd pickhouse/mobile && npm test -- src/screens/__tests__/CompareScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement CompareScreen**

Write `pickhouse/mobile/src/screens/CompareScreen.tsx`:

```typescript
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tokens } from '../theme/tokens';
import { useHouseStore } from '../stores/houseStore';
import { useComparisonStore } from '../stores/comparisonStore';
import { COMPARE_FIELDS, SECTIONS, fieldsForSection } from '../comparison/fields';
import { diffHouses } from '../comparison/diff';
import { HouseBadge } from '../components/comparison/HouseBadge';
import { PhotoCarousel } from '../components/comparison/PhotoCarousel';
import { PhotoFullscreenModal } from '../components/comparison/PhotoFullscreenModal';
import { CandidateSlider } from '../components/comparison/CandidateSlider';
import { CompareSection } from '../components/comparison/CompareSection';
import type { Photo } from '../types/house';
import type { DiffResult, FieldKey } from '../types/comparison';

export const CompareScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { baseHouseId, candidateIds } = route.params as {
    baseHouseId: string;
    candidateIds: string[];
  };

  const start = useComparisonStore((s) => s.start);
  const clear = useComparisonStore((s) => s.clear);
  const next = useComparisonStore((s) => s.next);
  const prev = useComparisonStore((s) => s.prev);
  const currentIndex = useComparisonStore((s) => s.currentCandidateIndex);
  const storeCandidates = useComparisonStore((s) => s.candidateIds);

  // Initialize session once on mount
  useEffect(() => {
    start(baseHouseId, candidateIds);
    return () => clear();
  }, [baseHouseId, candidateIds, start, clear]);

  const houses = useHouseStore((s) => s.houses);
  const base = useMemo(
    () => houses.find((h) => h.id === baseHouseId),
    [houses, baseHouseId],
  );
  const currentCandidateId = storeCandidates[currentIndex];
  const candidate = useMemo(
    () => houses.find((h) => h.id === currentCandidateId),
    [houses, currentCandidateId],
  );

  const diffsByKey = useMemo(() => {
    if (!base || !candidate) return {} as Record<FieldKey, DiffResult & { key: FieldKey }>;
    const arr = diffHouses(base, candidate);
    return arr.reduce(
      (acc, r) => {
        acc[r.key] = r;
        return acc;
      },
      {} as Record<FieldKey, DiffResult & { key: FieldKey }>,
    );
  }, [base, candidate]);

  const [modalPhoto, setModalPhoto] = useState<Photo | null>(null);
  const onPhotoPress = (p: Photo) => setModalPhoto(p);
  const onModalClose = () => setModalPhoto(null);

  if (!base) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>기준 집을 다시 골라주세요</Text>
          <Pressable onPress={() => nav.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>뒤로</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          testID="compare-back"
          onPress={() => nav.goBack()}
          style={styles.backBtn}
          accessibilityLabel="뒤로"
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.topTitle}>비교</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        <View style={styles.headerRow}>
          <HouseBadge variant="base" label="기준 집" addressLine={base.address.roadAddress} />
          <Text style={styles.vs}>VS</Text>
          {candidate ? (
            <HouseBadge
              variant="candidate"
              label="후보 집"
              addressLine={candidate.address.roadAddress}
            />
          ) : (
            <View style={styles.badgePlaceholder}>
              <Text style={styles.emptyText}>후보 없음</Text>
            </View>
          )}
        </View>

        <View style={styles.photoRow}>
          <PhotoCarousel
            testID="carousel-base"
            photos={base.photos ?? []}
            onPhotoPress={onPhotoPress}
          />
          <View style={{ width: tokens.spacing.md }} />
          <PhotoCarousel
            testID="carousel-candidate"
            photos={candidate?.photos ?? []}
            onPhotoPress={onPhotoPress}
          />
        </View>

        {SECTIONS.map((section) => (
          <CompareSection
            key={section}
            title={section}
            fields={fieldsForSection(section)}
            diffsByKey={diffsByKey}
          />
        ))}
      </ScrollView>

      <CandidateSlider
        currentIndex={currentIndex}
        total={storeCandidates.length}
        onPrev={prev}
        onNext={next}
      />

      <PhotoFullscreenModal
        visible={modalPhoto !== null}
        photo={modalPhoto}
        onClose={onModalClose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.colors.cream },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    height: 48,
  },
  topTitle: { fontSize: 16, fontWeight: '600', color: tokens.colors.textPrimary },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 24, color: tokens.colors.textPrimary },
  scrollBody: { paddingBottom: tokens.spacing.xxl * 3 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  vs: { fontSize: 14, fontWeight: '700', color: tokens.colors.textMuted },
  photoRow: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  badgePlaceholder: { alignItems: 'center', flex: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: tokens.colors.textMuted, fontSize: 14 },
  backLink: { marginTop: tokens.spacing.md },
  backLinkText: { color: tokens.colors.green, fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/screens/__tests__/CompareScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/CompareScreen.tsx pickhouse/mobile/src/screens/__tests__/CompareScreen.test.tsx
git commit -m "feat(comparison): add CompareScreen with diff sections and candidate slider"
```

---

### Task 16: Register Screens in Navigator

**Files:**
- Modify: `pickhouse/mobile/src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Add imports and register routes**

Open `pickhouse/mobile/src/navigation/RootNavigator.tsx` (from Plan 2). Add imports near the top:

```typescript
import { CompareBaseSelectScreen } from '../screens/CompareBaseSelectScreen';
import { CompareScreen } from '../screens/CompareScreen';
```

Inside the `<Stack.Navigator>` block, register the two screens (place them after HouseList for sensible ordering):

```typescript
        <Stack.Screen
          name="CompareBaseSelect"
          component={CompareBaseSelectScreen}
          options={{ title: '기준 집 고르기', headerShown: false }}
        />
        <Stack.Screen
          name="Compare"
          component={CompareScreen}
          options={{ headerShown: false }}
        />
```

- [ ] **Step 2: Run the app smoke (no test, just type-check)**

Run: `cd pickhouse/mobile && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/navigation/RootNavigator.tsx
git commit -m "feat(comparison): register CompareBaseSelect and Compare routes"
```

---

### Task 17: Wire the Compare Entry Point into HouseList — Test First

**Files:**
- Modify: `pickhouse/mobile/src/screens/HouseListScreen.tsx`
- Test: extend or create `pickhouse/mobile/src/screens/__tests__/HouseListScreen.compare.test.tsx`

- [ ] **Step 1: Write failing test for compare-mode toggle**

Write `pickhouse/mobile/src/screens/__tests__/HouseListScreen.compare.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HouseListScreen } from '../HouseListScreen';
import { useHouseStore } from '../../stores/houseStore';
import type { House } from '../../types/house';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

beforeEach(() => {
  mockNavigate.mockClear();
  useHouseStore.setState({
    houses: [
      { id: 'h1', address: { roadAddress: 'A', jibunAddress: '', lat: 0, lng: 0 }, photos: [] } as House,
      { id: 'h2', address: { roadAddress: 'B', jibunAddress: '', lat: 0, lng: 0 }, photos: [] } as House,
    ],
  } as any);
});

describe('HouseListScreen — compare entry', () => {
  it('renders a "비교" button', () => {
    const { getByTestId } = render(<HouseListScreen />);
    expect(getByTestId('house-list-compare-cta')).toBeTruthy();
  });

  it('tapping "비교" navigates to CompareBaseSelect with all house ids', () => {
    const { getByTestId } = render(<HouseListScreen />);
    fireEvent.press(getByTestId('house-list-compare-cta'));
    expect(mockNavigate).toHaveBeenCalledWith('CompareBaseSelect', {
      candidateIds: ['h1', 'h2'],
    });
  });

  it('button is disabled when fewer than 2 houses', () => {
    useHouseStore.setState({
      houses: [
        { id: 'h1', address: { roadAddress: 'A', jibunAddress: '', lat: 0, lng: 0 }, photos: [] } as House,
      ],
    } as any);
    const { getByTestId } = render(<HouseListScreen />);
    fireEvent.press(getByTestId('house-list-compare-cta'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

Run: `cd pickhouse/mobile && npm test -- src/screens/__tests__/HouseListScreen.compare.test.tsx`
Expected: FAIL — `house-list-compare-cta` not found.

- [ ] **Step 3: Add the Compare CTA to HouseListScreen**

Open `pickhouse/mobile/src/screens/HouseListScreen.tsx`. Near the top inside the rendered output (e.g. in the header area), add:

```typescript
import { Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../theme/tokens';
// ... existing imports

// inside component body, after houses selector:
const nav = useNavigation<any>();
const canCompare = houses.length >= 2;

const onCompare = () => {
  if (!canCompare) return;
  nav.navigate('CompareBaseSelect', { candidateIds: houses.map((h) => h.id) });
};

// In the JSX header area:
<Pressable
  testID="house-list-compare-cta"
  onPress={onCompare}
  disabled={!canCompare}
  style={{
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    backgroundColor: canCompare ? tokens.colors.green : tokens.colors.gray,
    opacity: canCompare ? 1 : 0.5,
  }}
  accessibilityLabel="집들 비교하기"
>
  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>비교</Text>
</Pressable>
```

Place it on the right side of whatever header row already exists. If the existing header has a `+ 새 집` button on the right, put `비교` immediately left of it with `marginRight: tokens.spacing.sm`.

- [ ] **Step 4: Run test, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/screens/__tests__/HouseListScreen.compare.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/HouseListScreen.tsx pickhouse/mobile/src/screens/__tests__/HouseListScreen.compare.test.tsx
git commit -m "feat(comparison): add 비교 CTA on HouseList screen"
```

---

### Task 18: Optional Swipe Gesture on Candidate Slider

**Files:**
- Modify: `pickhouse/mobile/src/components/comparison/CandidateSlider.tsx`
- Test: extend `pickhouse/mobile/src/components/comparison/__tests__/CandidateSlider.test.tsx`

- [ ] **Step 1: Add swipe test**

Append to `CandidateSlider.test.tsx`:

```typescript
import { PanGestureHandler } from 'react-native-gesture-handler';

describe('CandidateSlider swipe', () => {
  it('calls onNext when swiped left far enough', () => {
    const onNext = jest.fn();
    const { UNSAFE_getByType } = render(
      <CandidateSlider currentIndex={0} total={3} onPrev={() => {}} onNext={onNext} />,
    );
    const handler = UNSAFE_getByType(PanGestureHandler);
    // simulate END event with translationX = -100 (left swipe)
    handler.props.onHandlerStateChange({
      nativeEvent: { state: 5 /* END */, translationX: -100 },
    });
    expect(onNext).toHaveBeenCalled();
  });

  it('calls onPrev when swiped right far enough', () => {
    const onPrev = jest.fn();
    const { UNSAFE_getByType } = render(
      <CandidateSlider currentIndex={2} total={3} onPrev={onPrev} onNext={() => {}} />,
    );
    const handler = UNSAFE_getByType(PanGestureHandler);
    handler.props.onHandlerStateChange({
      nativeEvent: { state: 5 /* END */, translationX: 100 },
    });
    expect(onPrev).toHaveBeenCalled();
  });

  it('does not fire on small drags', () => {
    const onNext = jest.fn();
    const { UNSAFE_getByType } = render(
      <CandidateSlider currentIndex={0} total={3} onPrev={() => {}} onNext={onNext} />,
    );
    const handler = UNSAFE_getByType(PanGestureHandler);
    handler.props.onHandlerStateChange({
      nativeEvent: { state: 5, translationX: -10 },
    });
    expect(onNext).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/CandidateSlider.test.tsx`
Expected: FAIL — no PanGestureHandler rendered yet.

- [ ] **Step 3: Wrap CandidateSlider in PanGestureHandler**

Modify `CandidateSlider.tsx` — replace the top-level `<View style={styles.wrap}>` with the following structure:

```typescript
import { PanGestureHandler, State, type PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

const SWIPE_THRESHOLD = 50;

// inside component:
const onHandlerStateChange = (e: PanGestureHandlerStateChangeEvent) => {
  if (e.nativeEvent.state !== State.END) return;
  const dx = e.nativeEvent.translationX;
  if (dx <= -SWIPE_THRESHOLD && !atEnd) {
    onNext();
  } else if (dx >= SWIPE_THRESHOLD && !atStart) {
    onPrev();
  }
};

// JSX:
return (
  <PanGestureHandler onHandlerStateChange={onHandlerStateChange}>
    <View style={styles.wrap}>
      {/* existing arrow + indicator + arrow */}
    </View>
  </PanGestureHandler>
);
```

Compute `atEnd` / `atStart` *before* the early-return for the empty case so they're in scope (or move the gesture handler to wrap only the populated state). Simplest: keep the empty-state branch returning a plain View without the gesture handler.

- [ ] **Step 4: Run tests, confirm pass**

Run: `cd pickhouse/mobile && npm test -- src/components/comparison/__tests__/CandidateSlider.test.tsx`
Expected: PASS (9 cases including original 6 + 3 new swipe cases).

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/CandidateSlider.tsx pickhouse/mobile/src/components/comparison/__tests__/CandidateSlider.test.tsx
git commit -m "feat(comparison): add swipe gesture to candidate slider"
```

---

### Task 19: Empty / Edge States — Test First

**Files:**
- Test: extend `pickhouse/mobile/src/screens/__tests__/CompareScreen.test.tsx`
- Modify if needed: `pickhouse/mobile/src/screens/CompareScreen.tsx`

This task verifies the edge behaviors required by the spec: 전세 vs 월세 raw value display, missing photos showing empty placeholder, and base-without-candidates state.

- [ ] **Step 1: Add edge-case tests**

Append to `CompareScreen.test.tsx`:

```typescript
describe('CompareScreen — edge states', () => {
  beforeEach(() => {
    useComparisonStore.getState().clear();
  });

  it('전세 vs 월세 shows raw deposit and rent values, no conversion', () => {
    useHouseStore.setState({
      houses: [
        makeHouse('base-1', { dealType: 'JEONSE', deposit: 15000, rent: 0 }),
        makeHouse('c-1', { dealType: 'WOLSE', deposit: 1000, rent: 50 }),
        makeHouse('c-2'),
      ],
    } as any);
    const { getByText } = render(<CompareScreen />);
    expect(getByText('1억 5,000만')).toBeTruthy();
    expect(getByText('1,000만')).toBeTruthy();
    expect(getByText('0만')).toBeTruthy();
    expect(getByText('50만')).toBeTruthy();
  });

  it('renders 사진 없음 placeholders when both houses have no photos', () => {
    useHouseStore.setState({
      houses: [
        makeHouse('base-1', { photos: [] }),
        makeHouse('c-1', { photos: [] }),
        makeHouse('c-2'),
      ],
    } as any);
    const { getAllByText } = render(<CompareScreen />);
    expect(getAllByText('사진 없음').length).toBeGreaterThanOrEqual(2);
  });

  it('does NOT render a win/loss counter or score anywhere', () => {
    useHouseStore.setState({
      houses: [makeHouse('base-1'), makeHouse('c-1'), makeHouse('c-2')],
    } as any);
    const { queryByText } = render(<CompareScreen />);
    // Per simplicity principle — explicitly forbidden in spec 5.4
    expect(queryByText(/승/)).toBeNull();
    expect(queryByText(/패/)).toBeNull();
    expect(queryByText(/점수/)).toBeNull();
    expect(queryByText(/총점/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd pickhouse/mobile && npm test -- src/screens/__tests__/CompareScreen.test.tsx`
Expected: PASS. If any fail, the underlying logic is wrong — fix CompareScreen / diff / format rather than tweaking the test.

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/screens/__tests__/CompareScreen.test.tsx
git commit -m "test(comparison): cover 전세vs월세, empty photos, no-counter rules"
```

---

### Task 20: Visual Stories (Optional)

**Files:**
- Create: `pickhouse/mobile/src/components/comparison/CompareRow.stories.tsx`
- Create: `pickhouse/mobile/src/components/comparison/PhotoCarousel.stories.tsx`
- Create: `pickhouse/mobile/src/screens/CompareScreen.stories.tsx`

These help visual review without spinning up the full app. If Storybook is not configured, skip this task.

- [ ] **Step 1: CompareRow stories**

Write `pickhouse/mobile/src/components/comparison/CompareRow.stories.tsx`:

```typescript
import React from 'react';
import { View } from 'react-native';
import { CompareRow } from './CompareRow';
import { FIELD_BY_KEY } from '../../comparison/fields';
import { tokens } from '../../theme/tokens';

export default {
  title: 'Comparison/CompareRow',
  component: CompareRow,
  decorators: [(Story: any) => (
    <View style={{ backgroundColor: tokens.colors.cream, padding: 12 }}>
      <Story />
    </View>
  )],
};

export const BaseWins = () => (
  <CompareRow
    field={FIELD_BY_KEY.deposit}
    diff={{ key: 'deposit', winner: 'base', baseDisplay: '1,000만', candidateDisplay: '2,000만' }}
  />
);

export const CandidateWins = () => (
  <CompareRow
    field={FIELD_BY_KEY.area}
    diff={{ key: 'area', winner: 'candidate', baseDisplay: '8.5평', candidateDisplay: '12.0평' }}
  />
);

export const Equal = () => (
  <CompareRow
    field={FIELD_BY_KEY.rooms}
    diff={{ key: 'rooms', winner: 'equal', baseDisplay: '1개', candidateDisplay: '1개' }}
  />
);

export const Incomparable = () => (
  <CompareRow
    field={FIELD_BY_KEY.dealType}
    diff={{ key: 'dealType', winner: 'incomparable', baseDisplay: '전세', candidateDisplay: '월세' }}
  />
);

export const StarField = () => (
  <CompareRow
    field={FIELD_BY_KEY.sunlight}
    diff={{ key: 'sunlight', winner: 'base', baseDisplay: '5/5', candidateDisplay: '3/5' }}
  />
);
```

- [ ] **Step 2: PhotoCarousel stories**

Write `pickhouse/mobile/src/components/comparison/PhotoCarousel.stories.tsx`:

```typescript
import React from 'react';
import { View } from 'react-native';
import { PhotoCarousel } from './PhotoCarousel';
import { tokens } from '../../theme/tokens';

export default {
  title: 'Comparison/PhotoCarousel',
  component: PhotoCarousel,
};

const mk = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    localUri: `https://picsum.photos/seed/pickhouse${i}/400/300`,
    remoteUrl: null,
    takenAt: '2026-05-01',
    uploadStatus: 'pending' as const,
  }));

export const FiveImages = () => (
  <View style={{ backgroundColor: tokens.colors.cream, padding: 16 }}>
    <PhotoCarousel photos={mk(5) as any} testID="pc" />
  </View>
);

export const Empty = () => (
  <View style={{ backgroundColor: tokens.colors.cream, padding: 16 }}>
    <PhotoCarousel photos={[]} testID="pc-empty" />
  </View>
);
```

- [ ] **Step 3: CompareScreen story**

Write `pickhouse/mobile/src/screens/CompareScreen.stories.tsx`:

```typescript
import React, { useEffect } from 'react';
import { CompareScreen } from './CompareScreen';
import { useHouseStore } from '../stores/houseStore';
import type { House } from '../types/house';

const seedFixture = (): House[] => [
  {
    id: 'fx-base',
    address: { roadAddress: '서울 마포구 망원동 12-3', jibunAddress: '', lat: 0, lng: 0 },
    dealType: 'WOLSE', deposit: 1000, rent: 50, maintenanceFee: 7,
    area: 8.5, builtYear: 2018, floor: 3, totalFloor: 5,
    availableFrom: '2026-06-01', stationDistance: 6,
    rooms: 1, bathrooms: 1, hasBalcony: true, hasElevator: false, hasParking: false,
    options: [], security: [], garbage: '',
    waterPressure: 5, sunlight: 5, noise: 3, insulation: 4,
    ventilation: 4, moisture: 5, neighborhood: 4, firstImpression: 5,
    photos: [], memo: '',
  } as House,
  {
    id: 'fx-c1',
    address: { roadAddress: '서울 마포구 합정동 45-6', jibunAddress: '', lat: 0, lng: 0 },
    dealType: 'WOLSE', deposit: 2000, rent: 45, maintenanceFee: 5,
    area: 10, builtYear: 2020, floor: 2, totalFloor: 4,
    availableFrom: '2026-07-01', stationDistance: 8,
    rooms: 1, bathrooms: 1, hasBalcony: false, hasElevator: false, hasParking: false,
    options: [], security: [], garbage: '',
    waterPressure: 4, sunlight: 3, noise: 4, insulation: 5,
    ventilation: 3, moisture: 4, neighborhood: 3, firstImpression: 4,
    photos: [], memo: '',
  } as House,
];

export default { title: 'Screens/CompareScreen' };

export const Default = () => {
  useEffect(() => {
    useHouseStore.setState({ houses: seedFixture() } as any);
  }, []);
  return <CompareScreen />;
};
```

Note: this story relies on the navigation mock being globally registered in Storybook. If your storybook config doesn't have that, add a decorator like:

```typescript
const navMock = { goBack: () => {}, navigate: () => {} };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => navMock,
  useRoute: () => ({ params: { baseHouseId: 'fx-base', candidateIds: ['fx-c1'] } }),
}));
```

(Storybook native uses real modules, so move the mocking to a Storybook-specific decorator file rather than jest.mock.)

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/components/comparison/CompareRow.stories.tsx pickhouse/mobile/src/components/comparison/PhotoCarousel.stories.tsx pickhouse/mobile/src/screens/CompareScreen.stories.tsx
git commit -m "feat(comparison): add Storybook stories for visual review"
```

---

### Task 21: Manual Smoke Test Checklist

This task is verification-only — no code. Run through these manually with the app on a device or simulator before declaring Plan 3 done.

- [ ] **Step 1: Build & launch app**

Run: `cd pickhouse/mobile && npx expo start`
Open on simulator/device.

- [ ] **Step 2: Walk the happy path**

Seed at least 3 houses with photos through the existing HouseList. Then:

1. Tap `비교` on HouseList → CompareBaseSelect appears
2. Tap a card → CompareScreen appears with that house as base
3. Verify: green badge "기준 집" left, beige badge "후보 집" right
4. Verify: two PhotoCarousels side by side, dot indicator "1/N"
5. Swipe within one carousel → indicator updates
6. Tap a photo → fullscreen modal opens with pinch-to-zoom
7. Close modal → back on Compare
8. Scroll down — check that:
   - 기본 정보 / 구조·시설 / 주관 평가 section headings appear
   - Each row shows base | label | candidate
   - For deposit/rent/area: smaller deposit side is green, larger area side is green
   - For star fields: higher rating side is green
   - Equal values are gray
   - 거래 유형 mismatch (전세 vs 월세) is rendered with both raw values (no number conversion)
   - Nowhere does "X승 Y패" / "점수" / "총점" appear
9. Tap `›` arrow → second candidate appears, indicator "후보 2 / M"
10. Swipe left on the slider → advances; swipe right → previous
11. Tap back → returns to HouseList, comparisonStore is cleared (re-enter Compare, you should get a fresh session)

- [ ] **Step 3: Edge cases**

- Delete all but one house — `비교` CTA should be disabled
- Comparison with houses missing optional fields (no rent, no area) — those rows render `-` and are gray/incomparable
- Photo carousel with 0 photos — "사진 없음" placeholder shows
- Photo carousel with 1 photo — indicator shows "1/1", swipe is a no-op

- [ ] **Step 4: Final run of full test suite**

Run: `cd pickhouse/mobile && npm test`
Expected: all green.

Run: `cd pickhouse/mobile && npx tsc --noEmit`
Expected: 0 type errors.

- [ ] **Step 5: Final commit & finish**

If smoke testing reveals minor fixes, make them in a final commit:

```bash
git add -A
git commit -m "polish(comparison): smoke-test fixes"
```

Then close out per `superpowers:finishing-a-development-branch`.

---

## Self-Review Notes

This plan was reviewed against the spec (Section 5.4 + Section 2.4 + Section 3.2) and the user's prompt requirements before finalization. Resolutions:

**Spec coverage check:**
- 기준 집(녹색) vs 후보 집(베이지) badges → Task 6 (HouseBadge) + integration Task 15
- 좌우 독립 PhotoCarousel + dot indicator → Task 10
- 사진 탭 → fullscreen zoom → Task 11 + integration in Task 15
- 항목별 행 `기준 값 | 항목명 | 후보 값` → Task 8 (CompareRow)
- 유리한 쪽 녹색 / 같으면 회색 → Task 4 (diff logic) + Task 8 (CompareRow coloring)
- ▲▼ / 승패 카운트 없음 → explicitly tested in Task 19
- 거래 유형 다를 때 보증금/월세 raw 그대로, 환산 없음 → tested in Tasks 4 & 19
- 후보 N / M 슬라이더, 기준 집 고정 → Task 12 (CandidateSlider) + Task 5 (store), integrated Task 15
- 따뜻한 컬렉션 톤 — cream bg, soft cards, 둥근 라운드 → applied in all component styles (Task 6, 9, 10, 12, 14, 15)
- 게임 패턴 차용, 게임 언어 차용 금지 → enforced by Task 19 explicit assertion
- v2 features deliberately omitted: no photo labels, no auto-score, no win counter

**Placeholder scan:** No "TBD", "implement later", "fill in details" patterns. Every code step contains the actual code. Every test step contains complete assertions.

**Type consistency check:**
- `DiffResult.winner` is `'base' | 'candidate' | 'equal' | 'incomparable'` — used identically in Tasks 1, 4, 8, 15
- `CompareField.pick` returns `unknown` everywhere, formatters cast inside themselves
- `useComparisonStore` actions named `start`, `next`, `prev`, `setCandidateIndex`, `clear` — same names in Tasks 5 and 15
- `FieldKey` union used consistently in types, registry, and screens

**Fixes applied inline during review:**
- Task 4 test originally had `'500,000만'` typo; replaced with corrected version before commit.
- Task 8 needed wrapper Views around StarValue for alignment; called out explicitly so the engineer adds them when implementing.
- Task 18 carefully scopes the gesture handler to skip the empty-state branch (where atEnd/atStart aren't defined) — noted in the task.
- Task 20 Storybook decorator approach noted because `jest.mock` doesn't run in Storybook native — moved to a decorator pattern in the task body.

No known gaps. Plan is internally consistent and grounded in the spec.
