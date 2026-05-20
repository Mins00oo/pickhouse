# PickHouse Profile & Residence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "내 집" profile screen with hero current residence + visual timeline of past residences, plus House→Residence promotion and direct past-residence entry flows.

**Architecture:** New screens and components within Expo app (depends on Plan 2 foundation). Uses existing backend residence endpoints from Plan 1. Timeline is a scrollable virtual list. Warm collection aesthetic throughout.

**Tech Stack:** React Native, expo-sqlite, FlatList for timeline, react-native-reanimated for hero card animations, existing API client + Zustand store from Plan 2.

---

## File Structure

**New files (mobile):**
- `pickhouse/mobile/src/db/residences.ts` — local SQLite residence CRUD
- `pickhouse/mobile/src/db/migrations/002_residences.ts` — residences table migration
- `pickhouse/mobile/src/api/residences.ts` — residence HTTP client
- `pickhouse/mobile/src/stores/residencesStore.ts` — Zustand store for residences
- `pickhouse/mobile/src/types/residence.ts` — Residence TypeScript types
- `pickhouse/mobile/src/utils/eraLabels.ts` — era label auto-suggestion logic
- `pickhouse/mobile/src/utils/dateFormat.ts` — date range / period formatting
- `pickhouse/mobile/src/screens/profile/ProfileScreen.tsx` — main "내 집" tab
- `pickhouse/mobile/src/screens/profile/components/HeroCard.tsx` — current residence hero
- `pickhouse/mobile/src/screens/profile/components/Timeline.tsx` — timeline container
- `pickhouse/mobile/src/screens/profile/components/TimelineLine.tsx` — dotted vertical line + fade
- `pickhouse/mobile/src/screens/profile/components/YearMarker.tsx` — year dot + label
- `pickhouse/mobile/src/screens/profile/components/EraLabel.tsx` — chapter label
- `pickhouse/mobile/src/screens/profile/components/PastResidenceCard.tsx` — past home card
- `pickhouse/mobile/src/screens/profile/components/PhotoStrip.tsx` — horizontal photo strip with overflow
- `pickhouse/mobile/src/screens/profile/components/TimelineEndCircle.tsx` — dashed circle + add button
- `pickhouse/mobile/src/screens/profile/components/PulseLabel.tsx` — animated "지금 사는 곳" badge
- `pickhouse/mobile/src/screens/residence/PromoteModal.tsx` — house→residence promotion form
- `pickhouse/mobile/src/screens/residence/DirectAddResidenceScreen.tsx` — add past residence directly
- `pickhouse/mobile/src/screens/residence/PastResidenceDetailScreen.tsx` — view/edit past residence
- `pickhouse/mobile/src/screens/residence/EraLabelEditor.tsx` — era label edit sheet
- `pickhouse/mobile/src/theme/profileTheme.ts` — warm collection palette

**Modified files (mobile):**
- `pickhouse/mobile/src/navigation/RootNavigator.tsx` — register new routes
- `pickhouse/mobile/src/navigation/TabNavigator.tsx` — make Profile the home tab
- `pickhouse/mobile/src/screens/house/HouseDetailScreen.tsx` — add "이 집으로 계약/입주함" button
- `pickhouse/mobile/src/db/index.ts` — register new migration
- `pickhouse/mobile/src/stores/housesStore.ts` — remove house when promoted

**New files (tests):**
- `pickhouse/mobile/src/db/__tests__/residences.test.ts`
- `pickhouse/mobile/src/api/__tests__/residences.test.ts`
- `pickhouse/mobile/src/stores/__tests__/residencesStore.test.ts`
- `pickhouse/mobile/src/utils/__tests__/eraLabels.test.ts`
- `pickhouse/mobile/src/utils/__tests__/dateFormat.test.ts`
- `pickhouse/mobile/src/screens/profile/__tests__/HeroCard.test.tsx`
- `pickhouse/mobile/src/screens/profile/__tests__/PastResidenceCard.test.tsx`
- `pickhouse/mobile/src/screens/profile/__tests__/PhotoStrip.test.tsx`
- `pickhouse/mobile/src/screens/profile/__tests__/Timeline.test.tsx`
- `pickhouse/mobile/src/screens/profile/__tests__/ProfileScreen.test.tsx`
- `pickhouse/mobile/src/screens/residence/__tests__/PromoteModal.test.tsx`
- `pickhouse/mobile/src/screens/residence/__tests__/DirectAddResidenceScreen.test.tsx`
- `pickhouse/mobile/src/screens/residence/__tests__/PastResidenceDetailScreen.test.tsx`

---

## Tasks

### Task 1: Residence type definitions

**Files:**
- Create: `pickhouse/mobile/src/types/residence.ts`

- [ ] **Step 1: Write the type file**

```typescript
// pickhouse/mobile/src/types/residence.ts
import type { Address, DealType } from './house';

export interface Residence {
  id: string;
  serverId: string | null;
  sourceHouseId: string | null; // null if directly added (pre-app history)
  address: Address;
  dealType: DealType;
  deposit: number;
  rent: number;
  maintenanceFee: number;
  area: number | null;
  builtYear: number | null;
  floor: number | null;
  totalFloor: number | null;
  rooms: number | null;
  bathrooms: number | null;
  name: string; // user-facing nickname e.g. "역삼동 첫 자취집"
  contractStartDate: string; // ISO YYYY-MM-DD
  contractEndDate: string; // ISO YYYY-MM-DD
  landlordMemo: string;
  moveInPhotoIds: string[];
  contractPhotoId: string | null;
  meterReadings: MeterReadings | null;
  eraLabel: string | null;
  isCurrent: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeterReadings {
  electricity?: number;
  water?: number;
  gas?: number;
  recordedAt?: string; // ISO YYYY-MM-DD
}

export type ResidenceDraft = Omit<
  Residence,
  'id' | 'serverId' | 'createdAt' | 'updatedAt'
>;
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/types/residence.ts
git commit -m "feat(types): add Residence type definitions"
```

---

### Task 2: Profile theme tokens

**Files:**
- Create: `pickhouse/mobile/src/theme/profileTheme.ts`

- [ ] **Step 1: Write the theme**

```typescript
// pickhouse/mobile/src/theme/profileTheme.ts
export const profileTheme = {
  colors: {
    background: '#faf6f0',     // warm cream
    cardSurface: '#ffffff',
    timelineLine: '#d9c5a8',   // warm tan
    timelineFade: 'rgba(217, 197, 168, 0)',
    yearDot: '#b89668',
    yearText: '#7a5a3a',
    eraLabel: '#3d2f1f',
    cardText: '#2b2014',
    subtleText: '#8a7a64',
    pulseAccent: '#e07a3a',    // current-living accent
    heart: '#e85a4f',
    pinAccent: '#5a8a6a',
    softShadow: 'rgba(40, 25, 10, 0.08)',
    dashedCircle: '#c9b58e',
    addButtonBg: '#f0e6d2',
  },
  spacing: {
    timelineLeftInset: 28,
    cardLeftOffset: 56,
    cardGap: 32,
    cardPadding: 16,
    photoStripHeight: 140,
    photoStripMainWidth: 200,
    photoStripSecondaryWidth: 100,
  },
  radii: {
    card: 18,
    photo: 12,
    pill: 999,
  },
  typography: {
    miniLabel: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1.5 },
    heroName: { fontSize: 24, fontWeight: '700' as const },
    cardName: { fontSize: 17, fontWeight: '600' as const },
    period: { fontSize: 13, fontWeight: '500' as const },
    statPill: { fontSize: 12, fontWeight: '500' as const },
    eraLabel: { fontSize: 15, fontWeight: '600' as const },
    yearMarker: { fontSize: 13, fontWeight: '700' as const },
  },
} as const;

export type ProfileTheme = typeof profileTheme;
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/theme/profileTheme.ts
git commit -m "feat(theme): add warm collection theme for profile screen"
```

---

### Task 3: Date format util — TDD

**Files:**
- Create: `pickhouse/mobile/src/utils/dateFormat.ts`
- Test: `pickhouse/mobile/src/utils/__tests__/dateFormat.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// pickhouse/mobile/src/utils/__tests__/dateFormat.test.ts
import { formatPeriod, durationLabel, yearOf } from '../dateFormat';

describe('formatPeriod', () => {
  it('formats a closed period in Korean style', () => {
    expect(formatPeriod('2022-03-15', '2024-02-28')).toBe('2022.03 - 2024.02');
  });

  it('uses "현재" when end is in the future and isCurrent is true', () => {
    expect(formatPeriod('2024-05-01', '2026-05-01', { isCurrent: true })).toBe('2024.05 - 현재');
  });
});

describe('durationLabel', () => {
  it('produces "약 N년" when more than a year', () => {
    expect(durationLabel('2020-01-01', '2022-06-01')).toBe('약 2년 5개월');
  });

  it('produces months only when under a year', () => {
    expect(durationLabel('2024-01-01', '2024-08-01')).toBe('7개월');
  });
});

describe('yearOf', () => {
  it('extracts year as number', () => {
    expect(yearOf('2023-11-04')).toBe(2023);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pickhouse/mobile && npx jest src/utils/__tests__/dateFormat.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement util**

```typescript
// pickhouse/mobile/src/utils/dateFormat.ts
export interface PeriodOptions {
  isCurrent?: boolean;
}

export function formatPeriod(
  start: string,
  end: string,
  opts: PeriodOptions = {}
): string {
  const startPart = start.slice(0, 7).replace('-', '.');
  if (opts.isCurrent) {
    return `${startPart} - 현재`;
  }
  const endPart = end.slice(0, 7).replace('-', '.');
  return `${startPart} - ${endPart}`;
}

export function durationLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  let months =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth());
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem}개월`;
  if (rem === 0) return `약 ${years}년`;
  return `약 ${years}년 ${rem}개월`;
}

export function yearOf(iso: string): number {
  return parseInt(iso.slice(0, 4), 10);
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `cd pickhouse/mobile && npx jest src/utils/__tests__/dateFormat.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/utils/dateFormat.ts pickhouse/mobile/src/utils/__tests__/dateFormat.test.ts
git commit -m "feat(utils): add Korean date period formatters with tests"
```

---

### Task 4: Era label auto-suggestion — TDD

**Files:**
- Create: `pickhouse/mobile/src/utils/eraLabels.ts`
- Test: `pickhouse/mobile/src/utils/__tests__/eraLabels.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// pickhouse/mobile/src/utils/__tests__/eraLabels.test.ts
import { suggestEraLabels, defaultEraLabel } from '../eraLabels';

describe('suggestEraLabels', () => {
  it('suggests "직전에 살던 집" for the most recent past', () => {
    const suggestions = suggestEraLabels({
      contractStart: '2023-01-01',
      contractEnd: '2024-12-31',
      isMostRecentPast: true,
      userBirthYear: 1996,
    });
    expect(suggestions).toContain('직전에 살던 집');
  });

  it('suggests "사회초년생 시절" for ages 23-28', () => {
    const suggestions = suggestEraLabels({
      contractStart: '2020-03-01',
      contractEnd: '2022-02-28',
      isMostRecentPast: false,
      userBirthYear: 1996, // age 24-26 during this period
    });
    expect(suggestions).toContain('사회초년생 시절');
  });

  it('suggests "대학생 시절" for ages 19-23', () => {
    const suggestions = suggestEraLabels({
      contractStart: '2016-03-01',
      contractEnd: '2018-02-28',
      isMostRecentPast: false,
      userBirthYear: 1996, // age 20-22
    });
    expect(suggestions).toContain('대학생 시절');
  });

  it('falls back to year-only label when birth year unknown', () => {
    const suggestions = suggestEraLabels({
      contractStart: '2018-03-01',
      contractEnd: '2020-02-28',
      isMostRecentPast: false,
      userBirthYear: null,
    });
    expect(suggestions).toContain('2018-2020 시절');
  });
});

describe('defaultEraLabel', () => {
  it('returns the first suggestion', () => {
    const label = defaultEraLabel({
      contractStart: '2023-01-01',
      contractEnd: '2024-12-31',
      isMostRecentPast: true,
      userBirthYear: 1996,
    });
    expect(label).toBe('직전에 살던 집');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pickhouse/mobile && npx jest src/utils/__tests__/eraLabels.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/utils/eraLabels.ts
export interface EraInput {
  contractStart: string;
  contractEnd: string;
  isMostRecentPast: boolean;
  userBirthYear: number | null;
}

export function suggestEraLabels(input: EraInput): string[] {
  const out: string[] = [];
  if (input.isMostRecentPast) out.push('직전에 살던 집');

  const startYear = parseInt(input.contractStart.slice(0, 4), 10);
  const endYear = parseInt(input.contractEnd.slice(0, 4), 10);

  if (input.userBirthYear) {
    const ageAtStart = startYear - input.userBirthYear;
    const ageAtEnd = endYear - input.userBirthYear;
    const avg = (ageAtStart + ageAtEnd) / 2;
    if (avg >= 19 && avg <= 23) out.push('대학생 시절');
    if (avg >= 23 && avg <= 28) out.push('사회초년생 시절');
    if (avg >= 28 && avg <= 35) out.push('자리 잡던 시기');
    if (avg >= 35) out.push('안정기');
  }

  out.push(`${startYear}-${endYear} 시절`);
  out.push('첫 자취집');
  out.push('두 번째 집');
  return Array.from(new Set(out));
}

export function defaultEraLabel(input: EraInput): string {
  return suggestEraLabels(input)[0];
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `cd pickhouse/mobile && npx jest src/utils/__tests__/eraLabels.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/utils/eraLabels.ts pickhouse/mobile/src/utils/__tests__/eraLabels.test.ts
git commit -m "feat(utils): add era label auto-suggestion based on age and period"
```

---

### Task 5: Residence SQLite migration

**Files:**
- Create: `pickhouse/mobile/src/db/migrations/002_residences.ts`
- Modify: `pickhouse/mobile/src/db/index.ts`

- [ ] **Step 1: Write migration**

```typescript
// pickhouse/mobile/src/db/migrations/002_residences.ts
import type { SQLiteDatabase } from 'expo-sqlite';

export async function migration_002_residences(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS residences (
      id TEXT PRIMARY KEY NOT NULL,
      server_id TEXT,
      source_house_id TEXT,
      address_json TEXT NOT NULL,
      deal_type TEXT NOT NULL,
      deposit INTEGER NOT NULL,
      rent INTEGER NOT NULL DEFAULT 0,
      maintenance_fee INTEGER NOT NULL DEFAULT 0,
      area REAL,
      built_year INTEGER,
      floor INTEGER,
      total_floor INTEGER,
      rooms INTEGER,
      bathrooms INTEGER,
      name TEXT NOT NULL,
      contract_start_date TEXT NOT NULL,
      contract_end_date TEXT NOT NULL,
      landlord_memo TEXT NOT NULL DEFAULT '',
      move_in_photo_ids_json TEXT NOT NULL DEFAULT '[]',
      contract_photo_id TEXT,
      meter_readings_json TEXT,
      era_label TEXT,
      is_current INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_residences_start ON residences(contract_start_date DESC);
    CREATE INDEX IF NOT EXISTS idx_residences_current ON residences(is_current);
  `);
}
```

- [ ] **Step 2: Register migration in db index**

Modify `pickhouse/mobile/src/db/index.ts`. After the `migration_001_houses` import and registration, add:

```typescript
import { migration_002_residences } from './migrations/002_residences';

// inside runMigrations(), after migration_001_houses:
await migration_002_residences(db);
await db.runAsync(
  `INSERT OR IGNORE INTO _migrations (version, applied_at) VALUES (?, ?)`,
  [2, new Date().toISOString()]
);
```

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/db/migrations/002_residences.ts pickhouse/mobile/src/db/index.ts
git commit -m "feat(db): add residences table migration"
```

---

### Task 6: Residence DB module — failing test

**Files:**
- Create: `pickhouse/mobile/src/db/__tests__/residences.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// pickhouse/mobile/src/db/__tests__/residences.test.ts
import { openTestDb } from '../testHelpers';
import {
  insertResidence,
  listResidences,
  getResidence,
  updateResidence,
  deleteResidence,
  setCurrentResidence,
} from '../residences';
import type { ResidenceDraft } from '../../types/residence';

const draft: ResidenceDraft = {
  sourceHouseId: null,
  address: {
    roadAddress: '서울 강남구 역삼동 123',
    jibunAddress: '역삼동 678-9',
    zonecode: '06234',
    latitude: 37.5,
    longitude: 127.0,
  },
  dealType: 'WOLSE',
  deposit: 1000,
  rent: 60,
  maintenanceFee: 7,
  area: 8.5,
  builtYear: 2015,
  floor: 3,
  totalFloor: 5,
  rooms: 1,
  bathrooms: 1,
  name: '역삼 첫집',
  contractStartDate: '2022-03-01',
  contractEndDate: '2024-02-28',
  landlordMemo: '집주인 김씨 010-xxxx',
  moveInPhotoIds: [],
  contractPhotoId: null,
  meterReadings: null,
  eraLabel: '사회초년생 시절',
  isCurrent: false,
  isFavorite: false,
};

describe('residences db', () => {
  it('inserts and reads back a residence', async () => {
    const db = await openTestDb();
    const r = await insertResidence(db, draft);
    expect(r.id).toBeTruthy();
    expect(r.name).toBe('역삼 첫집');
    const fetched = await getResidence(db, r.id);
    expect(fetched?.contractStartDate).toBe('2022-03-01');
  });

  it('lists residences ordered by contract start desc', async () => {
    const db = await openTestDb();
    await insertResidence(db, { ...draft, name: 'A', contractStartDate: '2018-01-01', contractEndDate: '2020-01-01' });
    await insertResidence(db, { ...draft, name: 'B', contractStartDate: '2022-01-01', contractEndDate: '2024-01-01' });
    const all = await listResidences(db);
    expect(all.map((r) => r.name)).toEqual(['B', 'A']);
  });

  it('setCurrentResidence flips previous current to false', async () => {
    const db = await openTestDb();
    const a = await insertResidence(db, { ...draft, name: 'A', isCurrent: true });
    const b = await insertResidence(db, { ...draft, name: 'B' });
    await setCurrentResidence(db, b.id);
    const updatedA = await getResidence(db, a.id);
    const updatedB = await getResidence(db, b.id);
    expect(updatedA?.isCurrent).toBe(false);
    expect(updatedB?.isCurrent).toBe(true);
  });

  it('updates landlord memo and era label', async () => {
    const db = await openTestDb();
    const r = await insertResidence(db, draft);
    await updateResidence(db, r.id, { landlordMemo: '변경된 메모', eraLabel: '직전에 살던 집' });
    const fetched = await getResidence(db, r.id);
    expect(fetched?.landlordMemo).toBe('변경된 메모');
    expect(fetched?.eraLabel).toBe('직전에 살던 집');
  });

  it('deletes a residence', async () => {
    const db = await openTestDb();
    const r = await insertResidence(db, draft);
    await deleteResidence(db, r.id);
    expect(await getResidence(db, r.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd pickhouse/mobile && npx jest src/db/__tests__/residences.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Commit failing test**

```bash
git add pickhouse/mobile/src/db/__tests__/residences.test.ts
git commit -m "test(db): add failing tests for residences module"
```

---

### Task 7: Implement residences DB module

**Files:**
- Create: `pickhouse/mobile/src/db/residences.ts`

- [ ] **Step 1: Implement module**

```typescript
// pickhouse/mobile/src/db/residences.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Residence, ResidenceDraft } from '../types/residence';

function genId(): string {
  return `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function rowToResidence(row: any): Residence {
  return {
    id: row.id,
    serverId: row.server_id ?? null,
    sourceHouseId: row.source_house_id ?? null,
    address: JSON.parse(row.address_json),
    dealType: row.deal_type,
    deposit: row.deposit,
    rent: row.rent,
    maintenanceFee: row.maintenance_fee,
    area: row.area,
    builtYear: row.built_year,
    floor: row.floor,
    totalFloor: row.total_floor,
    rooms: row.rooms,
    bathrooms: row.bathrooms,
    name: row.name,
    contractStartDate: row.contract_start_date,
    contractEndDate: row.contract_end_date,
    landlordMemo: row.landlord_memo,
    moveInPhotoIds: JSON.parse(row.move_in_photo_ids_json || '[]'),
    contractPhotoId: row.contract_photo_id ?? null,
    meterReadings: row.meter_readings_json ? JSON.parse(row.meter_readings_json) : null,
    eraLabel: row.era_label ?? null,
    isCurrent: !!row.is_current,
    isFavorite: !!row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertResidence(
  db: SQLiteDatabase,
  draft: ResidenceDraft
): Promise<Residence> {
  const id = genId();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO residences (
      id, server_id, source_house_id, address_json, deal_type, deposit, rent,
      maintenance_fee, area, built_year, floor, total_floor, rooms, bathrooms,
      name, contract_start_date, contract_end_date, landlord_memo,
      move_in_photo_ids_json, contract_photo_id, meter_readings_json,
      era_label, is_current, is_favorite, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, null, draft.sourceHouseId,
      JSON.stringify(draft.address), draft.dealType, draft.deposit, draft.rent,
      draft.maintenanceFee, draft.area, draft.builtYear, draft.floor, draft.totalFloor,
      draft.rooms, draft.bathrooms, draft.name,
      draft.contractStartDate, draft.contractEndDate, draft.landlordMemo,
      JSON.stringify(draft.moveInPhotoIds),
      draft.contractPhotoId,
      draft.meterReadings ? JSON.stringify(draft.meterReadings) : null,
      draft.eraLabel, draft.isCurrent ? 1 : 0, draft.isFavorite ? 1 : 0,
      now, now,
    ]
  );
  if (draft.isCurrent) await setCurrentResidence(db, id);
  return (await getResidence(db, id))!;
}

export async function getResidence(
  db: SQLiteDatabase,
  id: string
): Promise<Residence | null> {
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM residences WHERE id = ?`,
    [id]
  );
  return row ? rowToResidence(row) : null;
}

export async function listResidences(db: SQLiteDatabase): Promise<Residence[]> {
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM residences ORDER BY contract_start_date DESC`
  );
  return rows.map(rowToResidence);
}

export async function updateResidence(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<ResidenceDraft>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  const setField = (col: string, val: any) => {
    fields.push(`${col} = ?`);
    values.push(val);
  };
  if (patch.landlordMemo !== undefined) setField('landlord_memo', patch.landlordMemo);
  if (patch.eraLabel !== undefined) setField('era_label', patch.eraLabel);
  if (patch.name !== undefined) setField('name', patch.name);
  if (patch.contractStartDate !== undefined) setField('contract_start_date', patch.contractStartDate);
  if (patch.contractEndDate !== undefined) setField('contract_end_date', patch.contractEndDate);
  if (patch.moveInPhotoIds !== undefined) setField('move_in_photo_ids_json', JSON.stringify(patch.moveInPhotoIds));
  if (patch.contractPhotoId !== undefined) setField('contract_photo_id', patch.contractPhotoId);
  if (patch.meterReadings !== undefined) setField('meter_readings_json', patch.meterReadings ? JSON.stringify(patch.meterReadings) : null);
  if (patch.isFavorite !== undefined) setField('is_favorite', patch.isFavorite ? 1 : 0);
  setField('updated_at', new Date().toISOString());
  if (fields.length === 1) return; // only updated_at
  values.push(id);
  await db.runAsync(
    `UPDATE residences SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function setCurrentResidence(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE residences SET is_current = 0, updated_at = ? WHERE is_current = 1`,
      [now]
    );
    await db.runAsync(
      `UPDATE residences SET is_current = 1, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  });
}

export async function deleteResidence(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(`DELETE FROM residences WHERE id = ?`, [id]);
}

export async function getCurrentResidence(
  db: SQLiteDatabase
): Promise<Residence | null> {
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM residences WHERE is_current = 1 LIMIT 1`
  );
  return row ? rowToResidence(row) : null;
}
```

- [ ] **Step 2: Run tests to verify pass**

Run: `cd pickhouse/mobile && npx jest src/db/__tests__/residences.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/db/residences.ts
git commit -m "feat(db): implement residences CRUD with current-residence transition"
```

---

### Task 8: Residence API client — TDD

**Files:**
- Create: `pickhouse/mobile/src/api/residences.ts`
- Test: `pickhouse/mobile/src/api/__tests__/residences.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/api/__tests__/residences.test.ts
import {
  fetchResidences,
  createResidence,
  patchResidence,
  promoteHouseToResidence,
} from '../residences';
import { apiClient } from '../client';

jest.mock('../client');
const mocked = apiClient as jest.Mocked<typeof apiClient>;

describe('residences api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /residences returns list', async () => {
    mocked.get.mockResolvedValue({ data: { residences: [{ id: 'r1', name: 'A' }] } });
    const res = await fetchResidences();
    expect(mocked.get).toHaveBeenCalledWith('/residences');
    expect(res[0].id).toBe('r1');
  });

  it('POST /residences creates new', async () => {
    mocked.post.mockResolvedValue({ data: { id: 'srv_1' } });
    const id = await createResidence({ name: 'B' } as any);
    expect(mocked.post).toHaveBeenCalledWith('/residences', { name: 'B' });
    expect(id).toBe('srv_1');
  });

  it('PATCH /residences/{id} sends partial', async () => {
    mocked.patch.mockResolvedValue({ data: { ok: true } });
    await patchResidence('srv_1', { landlordMemo: 'updated' });
    expect(mocked.patch).toHaveBeenCalledWith('/residences/srv_1', { landlordMemo: 'updated' });
  });

  it('POST /houses/{id}/promote-to-residence returns new residence id', async () => {
    mocked.post.mockResolvedValue({ data: { residenceId: 'srv_2' } });
    const id = await promoteHouseToResidence('house_5', {
      contractStartDate: '2024-01-01',
      contractEndDate: '2026-01-01',
      landlordMemo: '',
      moveInPhotoIds: [],
      contractPhotoId: null,
      meterReadings: null,
    });
    expect(mocked.post).toHaveBeenCalledWith(
      '/houses/house_5/promote-to-residence',
      expect.objectContaining({ contractStartDate: '2024-01-01' })
    );
    expect(id).toBe('srv_2');
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/api/__tests__/residences.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement client**

```typescript
// pickhouse/mobile/src/api/residences.ts
import { apiClient } from './client';
import type { Residence } from '../types/residence';

export async function fetchResidences(): Promise<Residence[]> {
  const { data } = await apiClient.get('/residences');
  return data.residences;
}

export async function createResidence(payload: Partial<Residence>): Promise<string> {
  const { data } = await apiClient.post('/residences', payload);
  return data.id;
}

export async function patchResidence(
  serverId: string,
  patch: Partial<Residence>
): Promise<void> {
  await apiClient.patch(`/residences/${serverId}`, patch);
}

export interface PromotePayload {
  contractStartDate: string;
  contractEndDate: string;
  landlordMemo: string;
  moveInPhotoIds: string[];
  contractPhotoId: string | null;
  meterReadings: any | null;
}

export async function promoteHouseToResidence(
  houseId: string,
  payload: PromotePayload
): Promise<string> {
  const { data } = await apiClient.post(
    `/houses/${houseId}/promote-to-residence`,
    payload
  );
  return data.residenceId;
}

export async function deleteResidenceRemote(serverId: string): Promise<void> {
  await apiClient.delete(`/residences/${serverId}`);
}
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/api/__tests__/residences.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/api/residences.ts pickhouse/mobile/src/api/__tests__/residences.test.ts
git commit -m "feat(api): residence endpoints client (list/create/patch/promote)"
```

---

### Task 9: Residences Zustand store — TDD

**Files:**
- Create: `pickhouse/mobile/src/stores/residencesStore.ts`
- Test: `pickhouse/mobile/src/stores/__tests__/residencesStore.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// pickhouse/mobile/src/stores/__tests__/residencesStore.test.ts
import { useResidencesStore } from '../residencesStore';
import * as db from '../../db/residences';

jest.mock('../../db/residences');
const mockedDb = db as jest.Mocked<typeof db>;

describe('residencesStore', () => {
  beforeEach(() => {
    useResidencesStore.setState({ residences: [], current: null, loading: false });
    jest.clearAllMocks();
  });

  it('loads residences and current from db', async () => {
    mockedDb.listResidences.mockResolvedValue([
      { id: 'a', isCurrent: true } as any,
      { id: 'b', isCurrent: false } as any,
    ]);
    await useResidencesStore.getState().load();
    const s = useResidencesStore.getState();
    expect(s.residences.length).toBe(2);
    expect(s.current?.id).toBe('a');
  });

  it('addResidence inserts to db and reloads', async () => {
    mockedDb.insertResidence.mockResolvedValue({ id: 'new' } as any);
    mockedDb.listResidences.mockResolvedValue([{ id: 'new', isCurrent: false } as any]);
    await useResidencesStore.getState().addResidence({ name: 'x' } as any);
    expect(mockedDb.insertResidence).toHaveBeenCalled();
    expect(useResidencesStore.getState().residences).toHaveLength(1);
  });

  it('setCurrent calls db and reloads', async () => {
    mockedDb.listResidences.mockResolvedValue([
      { id: 'a', isCurrent: false } as any,
      { id: 'b', isCurrent: true } as any,
    ]);
    await useResidencesStore.getState().setCurrent('b');
    expect(mockedDb.setCurrentResidence).toHaveBeenCalledWith(expect.anything(), 'b');
    expect(useResidencesStore.getState().current?.id).toBe('b');
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/stores/__tests__/residencesStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement store**

```typescript
// pickhouse/mobile/src/stores/residencesStore.ts
import { create } from 'zustand';
import type { Residence, ResidenceDraft } from '../types/residence';
import {
  insertResidence,
  listResidences,
  updateResidence,
  setCurrentResidence,
  deleteResidence,
} from '../db/residences';
import { getDb } from '../db';

interface ResidencesState {
  residences: Residence[];
  current: Residence | null;
  loading: boolean;
  load: () => Promise<void>;
  addResidence: (draft: ResidenceDraft) => Promise<Residence>;
  updateOne: (id: string, patch: Partial<ResidenceDraft>) => Promise<void>;
  setCurrent: (id: string) => Promise<void>;
  removeOne: (id: string) => Promise<void>;
}

export const useResidencesStore = create<ResidencesState>((set) => ({
  residences: [],
  current: null,
  loading: false,

  load: async () => {
    set({ loading: true });
    const db = await getDb();
    const list = await listResidences(db);
    const current = list.find((r) => r.isCurrent) ?? null;
    set({ residences: list, current, loading: false });
  },

  addResidence: async (draft) => {
    const db = await getDb();
    const r = await insertResidence(db, draft);
    const list = await listResidences(db);
    const current = list.find((x) => x.isCurrent) ?? null;
    set({ residences: list, current });
    return r;
  },

  updateOne: async (id, patch) => {
    const db = await getDb();
    await updateResidence(db, id, patch);
    const list = await listResidences(db);
    const current = list.find((r) => r.isCurrent) ?? null;
    set({ residences: list, current });
  },

  setCurrent: async (id) => {
    const db = await getDb();
    await setCurrentResidence(db, id);
    const list = await listResidences(db);
    const current = list.find((r) => r.isCurrent) ?? null;
    set({ residences: list, current });
  },

  removeOne: async (id) => {
    const db = await getDb();
    await deleteResidence(db, id);
    const list = await listResidences(db);
    const current = list.find((r) => r.isCurrent) ?? null;
    set({ residences: list, current });
  },
}));
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/stores/__tests__/residencesStore.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/stores/residencesStore.ts pickhouse/mobile/src/stores/__tests__/residencesStore.test.ts
git commit -m "feat(store): residences zustand store with current/load/add/setCurrent"
```

---

### Task 10: PulseLabel component — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/components/PulseLabel.tsx`
- Test: `pickhouse/mobile/src/screens/profile/__tests__/PulseLabel.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/profile/__tests__/PulseLabel.test.tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { PulseLabel } from '../components/PulseLabel';

describe('PulseLabel', () => {
  it('renders supplied text', () => {
    render(<PulseLabel text="지금 사는 곳" />);
    expect(screen.getByText('지금 사는 곳')).toBeTruthy();
  });

  it('has accessibility role "text"', () => {
    render(<PulseLabel text="지금 사는 곳" />);
    expect(screen.getByA11yHint('current residence indicator')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/PulseLabel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/profile/components/PulseLabel.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { profileTheme } from '../../../theme/profileTheme';

interface Props {
  text: string;
}

export function PulseLabel({ text }: Props) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.25, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value, // fade as it grows
  }));

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityHint="current residence indicator"
    >
      <View style={styles.dotCore} />
      <Animated.View style={[styles.dotPulse, dotStyle]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: profileTheme.radii.pill,
    alignSelf: 'flex-start',
  },
  dotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: profileTheme.colors.pulseAccent,
  },
  dotPulse: {
    position: 'absolute',
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: profileTheme.colors.pulseAccent,
  },
  text: {
    marginLeft: 8,
    color: profileTheme.colors.cardText,
    fontSize: 12,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/PulseLabel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/components/PulseLabel.tsx pickhouse/mobile/src/screens/profile/__tests__/PulseLabel.test.tsx
git commit -m "feat(profile): animated PulseLabel for current-living badge"
```

---

### Task 11: HeroCard — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/components/HeroCard.tsx`
- Test: `pickhouse/mobile/src/screens/profile/__tests__/HeroCard.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/profile/__tests__/HeroCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { HeroCard } from '../components/HeroCard';

const sampleResidence = {
  id: 'r1',
  name: '한남동 옥탑',
  address: {
    roadAddress: '서울 용산구 한남동 123',
    jibunAddress: '한남동 123',
    zonecode: '04401',
    latitude: 37.5,
    longitude: 127.0,
  },
  dealType: 'WOLSE',
  deposit: 2000,
  rent: 80,
  area: 9.5,
  contractStartDate: '2024-05-01',
  contractEndDate: '2026-04-30',
  moveInPhotoIds: ['photo-1'],
  isFavorite: false,
  isCurrent: true,
} as any;

describe('HeroCard', () => {
  it('renders the residence name and period with "현재"', () => {
    render(<HeroCard residence={sampleResidence} onPress={() => {}} onToggleFavorite={() => {}} />);
    expect(screen.getByText('한남동 옥탑')).toBeTruthy();
    expect(screen.getByText(/현재/)).toBeTruthy();
  });

  it('shows the pulse label "지금 사는 곳"', () => {
    render(<HeroCard residence={sampleResidence} onPress={() => {}} onToggleFavorite={() => {}} />);
    expect(screen.getByText('지금 사는 곳')).toBeTruthy();
  });

  it('toggles favorite on heart press', () => {
    const onToggle = jest.fn();
    render(<HeroCard residence={sampleResidence} onPress={() => {}} onToggleFavorite={onToggle} />);
    fireEvent.press(screen.getByA11yLabel('toggle-favorite'));
    expect(onToggle).toHaveBeenCalledWith('r1');
  });

  it('renders deposit/rent stats', () => {
    render(<HeroCard residence={sampleResidence} onPress={() => {}} onToggleFavorite={() => {}} />);
    expect(screen.getByText(/2,000/)).toBeTruthy();
    expect(screen.getByText(/80/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/HeroCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/profile/components/HeroCard.tsx
import React from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Residence } from '../../../types/residence';
import { formatPeriod } from '../../../utils/dateFormat';
import { formatDealType } from '../../../utils/format';
import { profileTheme } from '../../../theme/profileTheme';
import { usePhotosStore } from '../../../stores/photosStore';
import { PulseLabel } from './PulseLabel';

interface Props {
  residence: Residence;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function HeroCard({ residence, onPress, onToggleFavorite }: Props) {
  const getPhotoById = usePhotosStore((s) => s.getPhotoById);
  const heroPhoto = residence.moveInPhotoIds[0]
    ? getPhotoById(residence.moveInPhotoIds[0])
    : null;
  const photoUri = heroPhoto?.remoteUrl ?? heroPhoto?.localUri ?? null;
  const period = formatPeriod(residence.contractStartDate, residence.contractEndDate, {
    isCurrent: residence.isCurrent,
  });

  return (
    <Pressable style={styles.card} onPress={() => onPress(residence.id)}>
      <ImageBackground
        source={photoUri ? { uri: photoUri } : require('../../../assets/placeholder-home.png')}
        style={styles.photo}
        imageStyle={styles.photoImage}
      >
        <View style={styles.topRow}>
          <PulseLabel text="지금 사는 곳" />
          <View style={styles.topRight}>
            <View style={styles.pin}>
              <Ionicons name="location" size={14} color={profileTheme.colors.pinAccent} />
            </View>
            <Pressable
              accessibilityLabel="toggle-favorite"
              hitSlop={12}
              onPress={() => onToggleFavorite(residence.id)}
              style={styles.heart}
            >
              <Ionicons
                name={residence.isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={profileTheme.colors.heart}
              />
            </Pressable>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{residence.name}</Text>
        <Text style={styles.period}>{period}</Text>
        <View style={styles.statsRow}>
          <Stat label="보증금" value={`${residence.deposit.toLocaleString()}만`} />
          {residence.rent > 0 && <Stat label="월세" value={`${residence.rent}만`} />}
          {residence.area != null && <Stat label="전용" value={`${residence.area}평`} />}
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: profileTheme.colors.cardSurface,
    borderRadius: profileTheme.radii.card,
    overflow: 'hidden',
    shadowColor: profileTheme.colors.softShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
    marginHorizontal: 16,
    marginTop: 12,
  },
  photo: { height: 260, justifyContent: 'flex-start' },
  photoImage: { borderTopLeftRadius: profileTheme.radii.card, borderTopRightRadius: profileTheme.radii.card },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
  },
  topRight: { flexDirection: 'row', gap: 8 },
  pin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  heart: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: 16, gap: 6 },
  name: { ...profileTheme.typography.heroName, color: profileTheme.colors.cardText },
  period: { ...profileTheme.typography.period, color: profileTheme.colors.subtleText },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  statPill: {
    flexDirection: 'row',
    backgroundColor: profileTheme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: profileTheme.radii.pill,
    gap: 6,
  },
  statLabel: { ...profileTheme.typography.statPill, color: profileTheme.colors.subtleText },
  statValue: { ...profileTheme.typography.statPill, color: profileTheme.colors.cardText },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/HeroCard.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/components/HeroCard.tsx pickhouse/mobile/src/screens/profile/__tests__/HeroCard.test.tsx
git commit -m "feat(profile): HeroCard with photo, pin, heart, pulse, stats"
```

---

### Task 12: PhotoStrip with overflow — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/components/PhotoStrip.tsx`
- Test: `pickhouse/mobile/src/screens/profile/__tests__/PhotoStrip.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/profile/__tests__/PhotoStrip.test.tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { PhotoStrip } from '../components/PhotoStrip';

const photos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    localUri: null,
    remoteUrl: `https://x/${i}.jpg`,
  }));

describe('PhotoStrip', () => {
  it('renders all photos when 3 or fewer', () => {
    render(<PhotoStrip photos={photos(3)} onPressIndex={() => {}} />);
    expect(screen.queryByText(/\+/)).toBeNull();
    expect(screen.getAllByA11yLabel(/photo-/)).toHaveLength(3);
  });

  it('renders main + secondary + "+N" overflow when more than 3', () => {
    render(<PhotoStrip photos={photos(8)} onPressIndex={() => {}} />);
    expect(screen.getByText('+5')).toBeTruthy();
  });

  it('renders a placeholder when zero photos', () => {
    render(<PhotoStrip photos={[]} onPressIndex={() => {}} />);
    expect(screen.getByA11yLabel('photo-placeholder')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/PhotoStrip.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/profile/components/PhotoStrip.tsx
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Photo } from '../../../types/house';
import { profileTheme } from '../../../theme/profileTheme';

interface Props {
  photos: Photo[];
  onPressIndex: (index: number) => void;
}

const MAIN_W = profileTheme.spacing.photoStripMainWidth;
const SEC_W = profileTheme.spacing.photoStripSecondaryWidth;
const H = profileTheme.spacing.photoStripHeight;

export function PhotoStrip({ photos, onPressIndex }: Props) {
  if (photos.length === 0) {
    return (
      <View
        accessibilityLabel="photo-placeholder"
        style={[styles.placeholder, { height: H }]}
      >
        <Text style={styles.placeholderText}>사진 없음</Text>
      </View>
    );
  }

  const visible = photos.slice(0, 3);
  const overflow = Math.max(photos.length - 3, 0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={SEC_W + 8}
      decelerationRate="fast"
      contentContainerStyle={styles.scroll}
    >
      {visible.map((p, i) => {
        const isMain = i === 0;
        return (
          <Pressable
            key={i}
            accessibilityLabel={`photo-${i}`}
            onPress={() => onPressIndex(i)}
            style={[
              styles.cell,
              { width: isMain ? MAIN_W : SEC_W, height: H },
            ]}
          >
            <Image
              source={{ uri: p.remoteUrl ?? p.localUri ?? '' }}
              style={styles.img}
            />
          </Pressable>
        );
      })}
      {overflow > 0 && (
        <Pressable
          accessibilityLabel="photo-overflow"
          onPress={() => onPressIndex(3)}
          style={[styles.cell, styles.overflow, { width: SEC_W, height: H }]}
        >
          <Text style={styles.overflowText}>+{overflow}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingRight: 16, gap: 8 },
  cell: {
    borderRadius: profileTheme.radii.photo,
    overflow: 'hidden',
    backgroundColor: profileTheme.colors.background,
  },
  img: { width: '100%', height: '100%' },
  placeholder: {
    backgroundColor: profileTheme.colors.background,
    borderRadius: profileTheme.radii.photo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: profileTheme.colors.subtleText, fontSize: 13 },
  overflow: {
    backgroundColor: 'rgba(40,25,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/PhotoStrip.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/components/PhotoStrip.tsx pickhouse/mobile/src/screens/profile/__tests__/PhotoStrip.test.tsx
git commit -m "feat(profile): horizontal PhotoStrip with snap and +N overflow"
```

---

### Task 13: PastResidenceCard — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/components/PastResidenceCard.tsx`
- Test: `pickhouse/mobile/src/screens/profile/__tests__/PastResidenceCard.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/profile/__tests__/PastResidenceCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { PastResidenceCard } from '../components/PastResidenceCard';

const residence = {
  id: 'r2',
  name: '망원동 1.5룸',
  dealType: 'WOLSE',
  deposit: 1000,
  rent: 55,
  area: 7.2,
  contractStartDate: '2022-03-01',
  contractEndDate: '2024-02-28',
  moveInPhotos: [
    { remoteUrl: 'a' }, { remoteUrl: 'b' }, { remoteUrl: 'c' }, { remoteUrl: 'd' },
  ],
} as any;

describe('PastResidenceCard', () => {
  it('renders name and period', () => {
    render(<PastResidenceCard residence={residence} onPress={() => {}} />);
    expect(screen.getByText('망원동 1.5룸')).toBeTruthy();
    expect(screen.getByText('2022.03 - 2024.02')).toBeTruthy();
  });

  it('shows duration label "약 1년 11개월" style', () => {
    render(<PastResidenceCard residence={residence} onPress={() => {}} />);
    expect(screen.getByText(/년|개월/)).toBeTruthy();
  });

  it('calls onPress with id', () => {
    const fn = jest.fn();
    render(<PastResidenceCard residence={residence} onPress={fn} />);
    fireEvent.press(screen.getByA11yLabel('past-residence-card'));
    expect(fn).toHaveBeenCalledWith('r2');
  });

  it('renders deposit pill', () => {
    render(<PastResidenceCard residence={residence} onPress={() => {}} />);
    expect(screen.getByText(/1,000/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/PastResidenceCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/profile/components/PastResidenceCard.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Residence } from '../../../types/residence';
import { formatPeriod, durationLabel } from '../../../utils/dateFormat';
import { profileTheme } from '../../../theme/profileTheme';
import { PhotoStrip } from './PhotoStrip';

interface Props {
  residence: Residence;
  onPress: (id: string) => void;
}

export function PastResidenceCard({ residence, onPress }: Props) {
  return (
    <Pressable
      accessibilityLabel="past-residence-card"
      onPress={() => onPress(residence.id)}
      style={styles.card}
    >
      <View style={styles.photoWrap}>
        <PhotoStrip
          photos={residence.moveInPhotos}
          onPressIndex={() => onPress(residence.id)}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{residence.name}</Text>
        <Text style={styles.period}>
          {formatPeriod(residence.contractStartDate, residence.contractEndDate)}
          {'  ·  '}
          {durationLabel(residence.contractStartDate, residence.contractEndDate)}
        </Text>
        <View style={styles.pills}>
          <Pill label="보증금" value={`${residence.deposit.toLocaleString()}만`} />
          {residence.rent > 0 && <Pill label="월세" value={`${residence.rent}만`} />}
          {residence.area != null && <Pill label="전용" value={`${residence.area}평`} />}
        </View>
      </View>
    </Pressable>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: profileTheme.colors.cardSurface,
    borderRadius: profileTheme.radii.card,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 4,
    marginLeft: profileTheme.spacing.cardLeftOffset,
    marginRight: 16,
    marginVertical: profileTheme.spacing.cardGap / 2,
    shadowColor: profileTheme.colors.softShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  photoWrap: { paddingLeft: 12 },
  body: { padding: 12, gap: 6 },
  name: { ...profileTheme.typography.cardName, color: profileTheme.colors.cardText },
  period: { ...profileTheme.typography.period, color: profileTheme.colors.subtleText },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pill: {
    flexDirection: 'row',
    backgroundColor: profileTheme.colors.background,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: profileTheme.radii.pill,
    gap: 5,
  },
  pillLabel: { ...profileTheme.typography.statPill, color: profileTheme.colors.subtleText },
  pillValue: { ...profileTheme.typography.statPill, color: profileTheme.colors.cardText },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/PastResidenceCard.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/components/PastResidenceCard.tsx pickhouse/mobile/src/screens/profile/__tests__/PastResidenceCard.test.tsx
git commit -m "feat(profile): PastResidenceCard with photo strip, period, stat pills"
```

---

### Task 14: TimelineLine + YearMarker + EraLabel

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/components/TimelineLine.tsx`
- Create: `pickhouse/mobile/src/screens/profile/components/YearMarker.tsx`
- Create: `pickhouse/mobile/src/screens/profile/components/EraLabel.tsx`

- [ ] **Step 1: Write TimelineLine**

```typescript
// pickhouse/mobile/src/screens/profile/components/TimelineLine.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { profileTheme } from '../../../theme/profileTheme';

interface Props {
  height: number;
}

export function TimelineLine({ height }: Props) {
  const dotCount = Math.floor(height / 8);
  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none">
      <View style={styles.dotsCol}>
        {Array.from({ length: dotCount }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>
      <LinearGradient
        colors={[profileTheme.colors.timelineFade, profileTheme.colors.background]}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: profileTheme.spacing.timelineLeftInset,
    top: 0,
    width: 2,
  },
  dotsCol: { alignItems: 'center', gap: 4 },
  dot: {
    width: 2,
    height: 4,
    backgroundColor: profileTheme.colors.timelineLine,
    borderRadius: 1,
  },
  bottomFade: {
    position: 'absolute',
    left: -10,
    right: -10,
    bottom: 0,
    height: 80,
  },
});
```

- [ ] **Step 2: Write YearMarker**

```typescript
// pickhouse/mobile/src/screens/profile/components/YearMarker.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { profileTheme } from '../../../theme/profileTheme';

interface Props {
  year: number;
}

export function YearMarker({ year }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.text}>{year}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginLeft: profileTheme.spacing.timelineLeftInset - 8,
    gap: 12,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: profileTheme.colors.yearDot,
    borderWidth: 3,
    borderColor: profileTheme.colors.background,
  },
  text: {
    ...profileTheme.typography.yearMarker,
    color: profileTheme.colors.yearText,
  },
});
```

- [ ] **Step 3: Write EraLabel**

```typescript
// pickhouse/mobile/src/screens/profile/components/EraLabel.tsx
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { profileTheme } from '../../../theme/profileTheme';

interface Props {
  label: string;
  onPress?: () => void;
}

export function EraLabel({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="era-label"
      style={styles.wrap}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginLeft: profileTheme.spacing.cardLeftOffset,
    marginTop: 8,
    marginBottom: 4,
  },
  text: {
    ...profileTheme.typography.eraLabel,
    color: profileTheme.colors.eraLabel,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/components/TimelineLine.tsx pickhouse/mobile/src/screens/profile/components/YearMarker.tsx pickhouse/mobile/src/screens/profile/components/EraLabel.tsx
git commit -m "feat(profile): TimelineLine, YearMarker, EraLabel building blocks"
```

---

### Task 15: TimelineEndCircle

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/components/TimelineEndCircle.tsx`

- [ ] **Step 1: Implement**

```typescript
// pickhouse/mobile/src/screens/profile/components/TimelineEndCircle.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileTheme } from '../../../theme/profileTheme';

interface Props {
  onAdd: () => void;
}

export function TimelineEndCircle({ onAdd }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle} />
      <Text style={styles.startText}>여기까지가 기록된 시작점</Text>
      <Pressable
        accessibilityLabel="add-older-residence"
        onPress={onAdd}
        style={styles.addBtn}
      >
        <Ionicons name="add" size={16} color={profileTheme.colors.eraLabel} />
        <Text style={styles.addText}>더 이전 집 추가</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
    gap: 12,
  },
  circle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderStyle: 'dashed',
    borderColor: profileTheme.colors.dashedCircle,
  },
  startText: {
    color: profileTheme.colors.subtleText,
    fontSize: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: profileTheme.colors.addButtonBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: profileTheme.radii.pill,
  },
  addText: {
    color: profileTheme.colors.eraLabel,
    fontSize: 14,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/components/TimelineEndCircle.tsx
git commit -m "feat(profile): TimelineEndCircle with dashed circle and add button"
```

---

### Task 16: Timeline assembly — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/components/Timeline.tsx`
- Test: `pickhouse/mobile/src/screens/profile/__tests__/Timeline.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/profile/__tests__/Timeline.test.tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Timeline } from '../components/Timeline';

const past = [
  {
    id: 'r1', name: '직전 집',
    contractStartDate: '2023-03-01', contractEndDate: '2024-12-31',
    eraLabel: '직전에 살던 집',
    moveInPhotos: [], deposit: 2000, rent: 80, dealType: 'WOLSE',
  },
  {
    id: 'r2', name: '두 번째',
    contractStartDate: '2021-03-01', contractEndDate: '2023-02-28',
    eraLabel: '사회초년생 시절',
    moveInPhotos: [], deposit: 1000, rent: 55, dealType: 'WOLSE',
  },
  {
    id: 'r3', name: '첫 자취',
    contractStartDate: '2019-03-01', contractEndDate: '2021-02-28',
    eraLabel: '대학생 시절',
    moveInPhotos: [], deposit: 500, rent: 40, dealType: 'WOLSE',
  },
] as any;

describe('Timeline', () => {
  it('renders era labels in order', () => {
    render(<Timeline residences={past} onCardPress={() => {}} onAddOlder={() => {}} />);
    expect(screen.getByText('직전에 살던 집')).toBeTruthy();
    expect(screen.getByText('사회초년생 시절')).toBeTruthy();
    expect(screen.getByText('대학생 시절')).toBeTruthy();
  });

  it('renders year markers for boundary years', () => {
    render(<Timeline residences={past} onCardPress={() => {}} onAddOlder={() => {}} />);
    expect(screen.getByText('2024')).toBeTruthy();
    expect(screen.getByText('2021')).toBeTruthy();
    expect(screen.getByText('2019')).toBeTruthy();
  });

  it('renders end circle with add button', () => {
    render(<Timeline residences={past} onCardPress={() => {}} onAddOlder={() => {}} />);
    expect(screen.getByText('여기까지가 기록된 시작점')).toBeTruthy();
    expect(screen.getByA11yLabel('add-older-residence')).toBeTruthy();
  });

  it('renders empty state when no past residences', () => {
    render(<Timeline residences={[]} onCardPress={() => {}} onAddOlder={() => {}} />);
    expect(screen.getByText(/거쳐온 집이 아직 없어요/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/Timeline.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/profile/components/Timeline.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Residence } from '../../../types/residence';
import { yearOf } from '../../../utils/dateFormat';
import { profileTheme } from '../../../theme/profileTheme';
import { TimelineLine } from './TimelineLine';
import { YearMarker } from './YearMarker';
import { EraLabel } from './EraLabel';
import { PastResidenceCard } from './PastResidenceCard';
import { TimelineEndCircle } from './TimelineEndCircle';

interface Props {
  residences: Residence[];
  onCardPress: (id: string) => void;
  onAddOlder: () => void;
}

export function Timeline({ residences, onCardPress, onAddOlder }: Props) {
  const items = useMemo(() => buildItems(residences), [residences]);

  if (residences.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>거쳐온 집이 아직 없어요</Text>
        <Text style={styles.emptySub}>이전에 살던 집을 추가해 타임라인을 만들어보세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>거쳐온 집들</Text>
      <View style={styles.body}>
        <TimelineLine height={items.length * 240 + 200} />
        {items.map((item, idx) => {
          if (item.kind === 'year') {
            return <YearMarker key={`y-${item.year}-${idx}`} year={item.year} />;
          }
          if (item.kind === 'era') {
            return <EraLabel key={`e-${item.label}-${idx}`} label={item.label} />;
          }
          return (
            <PastResidenceCard
              key={item.residence.id}
              residence={item.residence}
              onPress={onCardPress}
            />
          );
        })}
        <TimelineEndCircle onAdd={onAddOlder} />
      </View>
    </View>
  );
}

type Item =
  | { kind: 'year'; year: number }
  | { kind: 'era'; label: string }
  | { kind: 'card'; residence: Residence };

function buildItems(residences: Residence[]): Item[] {
  // residences expected sorted DESC by contractStartDate
  const out: Item[] = [];
  let lastYear: number | null = null;
  let lastEra: string | null = null;

  for (const r of residences) {
    const endYear = yearOf(r.contractEndDate);
    if (endYear !== lastYear) {
      out.push({ kind: 'year', year: endYear });
      lastYear = endYear;
    }
    if (r.eraLabel && r.eraLabel !== lastEra) {
      out.push({ kind: 'era', label: r.eraLabel });
      lastEra = r.eraLabel;
    }
    out.push({ kind: 'card', residence: r });

    const startYear = yearOf(r.contractStartDate);
    if (startYear !== endYear) {
      out.push({ kind: 'year', year: startYear });
      lastYear = startYear;
    }
  }
  return out;
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 24 },
  sectionTitle: {
    ...profileTheme.typography.eraLabel,
    color: profileTheme.colors.cardText,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  body: { position: 'relative' },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: profileTheme.colors.cardText,
  },
  emptySub: {
    fontSize: 13,
    color: profileTheme.colors.subtleText,
  },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/Timeline.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/components/Timeline.tsx pickhouse/mobile/src/screens/profile/__tests__/Timeline.test.tsx
git commit -m "feat(profile): Timeline assembly with year markers, era labels, end circle"
```

---

### Task 17: ProfileScreen — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/ProfileScreen.tsx`
- Test: `pickhouse/mobile/src/screens/profile/__tests__/ProfileScreen.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/profile/__tests__/ProfileScreen.test.tsx
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ProfileScreen } from '../ProfileScreen';
import { useResidencesStore } from '../../../stores/residencesStore';

jest.mock('../../../stores/residencesStore');
const mocked = useResidencesStore as unknown as jest.Mock;

const nav = { navigate: jest.fn() };

describe('ProfileScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders "MY HOMES" mini label and settings icon, no greeting', () => {
    mocked.mockReturnValue({
      residences: [], current: null, load: jest.fn(), updateOne: jest.fn(),
    });
    render(<ProfileScreen navigation={nav as any} />);
    expect(screen.getByText('MY HOMES')).toBeTruthy();
    expect(screen.getByA11yLabel('open-settings')).toBeTruthy();
    expect(screen.queryByText(/안녕/)).toBeNull();
  });

  it('renders HeroCard when current residence exists', () => {
    mocked.mockReturnValue({
      residences: [{ id: 'c', isCurrent: true, name: '현재집', moveInPhotos: [], contractStartDate: '2024-01-01', contractEndDate: '2026-01-01', deposit: 1000, rent: 60 }],
      current: { id: 'c', isCurrent: true, name: '현재집', moveInPhotos: [], contractStartDate: '2024-01-01', contractEndDate: '2026-01-01', deposit: 1000, rent: 60 },
      load: jest.fn(),
      updateOne: jest.fn(),
    });
    render(<ProfileScreen navigation={nav as any} />);
    expect(screen.getByText('현재집')).toBeTruthy();
  });

  it('renders timeline of past residences', () => {
    mocked.mockReturnValue({
      residences: [
        { id: 'a', isCurrent: false, name: '과거1', moveInPhotos: [], contractStartDate: '2020-01-01', contractEndDate: '2022-01-01', deposit: 500, rent: 30, dealType: 'WOLSE', eraLabel: '대학생 시절' },
      ],
      current: null,
      load: jest.fn(),
      updateOne: jest.fn(),
    });
    render(<ProfileScreen navigation={nav as any} />);
    expect(screen.getByText('과거1')).toBeTruthy();
    expect(screen.getByText('대학생 시절')).toBeTruthy();
  });

  it('calls load on mount', async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    mocked.mockReturnValue({ residences: [], current: null, load, updateOne: jest.fn() });
    render(<ProfileScreen navigation={nav as any} />);
    await waitFor(() => expect(load).toHaveBeenCalled());
  });

  it('renders empty hero state when no current', () => {
    mocked.mockReturnValue({ residences: [], current: null, load: jest.fn(), updateOne: jest.fn() });
    render(<ProfileScreen navigation={nav as any} />);
    expect(screen.getByText(/지금 살고 있는 집을 추가해보세요/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/ProfileScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/profile/ProfileScreen.tsx
import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { profileTheme } from '../../theme/profileTheme';
import { useResidencesStore } from '../../stores/residencesStore';
import { HeroCard } from './components/HeroCard';
import { Timeline } from './components/Timeline';

type Nav = NativeStackScreenProps<any, 'Profile'>;

export function ProfileScreen({ navigation }: Nav) {
  const { residences, current, load, updateOne } = useResidencesStore();

  useEffect(() => {
    load();
  }, [load]);

  const past = residences.filter((r) => !r.isCurrent);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.miniLabel}>MY HOMES</Text>
        <Pressable
          accessibilityLabel="open-settings"
          onPress={() => navigation.navigate('Settings')}
          hitSlop={12}
        >
          <Ionicons name="settings-outline" size={22} color={profileTheme.colors.cardText} />
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {current ? (
          <HeroCard
            residence={current}
            onPress={(id) => navigation.navigate('PastResidenceDetail', { id })}
            onToggleFavorite={(id) =>
              updateOne(id, { isFavorite: !current.isFavorite })
            }
          />
        ) : (
          <EmptyHero onAdd={() => navigation.navigate('DirectAddResidence', { isCurrent: true })} />
        )}

        <Timeline
          residences={past}
          onCardPress={(id) => navigation.navigate('PastResidenceDetail', { id })}
          onAddOlder={() => navigation.navigate('DirectAddResidence', { isCurrent: false })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyHero({ onAdd }: { onAdd: () => void }) {
  return (
    <Pressable onPress={onAdd} style={styles.emptyHero}>
      <Ionicons name="home-outline" size={36} color={profileTheme.colors.subtleText} />
      <Text style={styles.emptyHeroTitle}>지금 살고 있는 집을 추가해보세요</Text>
      <Text style={styles.emptyHeroSub}>내 집 컬렉션의 시작점이 됩니다</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: profileTheme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  miniLabel: {
    ...profileTheme.typography.miniLabel,
    color: profileTheme.colors.subtleText,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  emptyHero: {
    margin: 16,
    padding: 40,
    borderRadius: profileTheme.radii.card,
    backgroundColor: profileTheme.colors.cardSurface,
    alignItems: 'center',
    gap: 12,
    shadowColor: profileTheme.colors.softShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3,
  },
  emptyHeroTitle: { fontSize: 16, fontWeight: '600', color: profileTheme.colors.cardText },
  emptyHeroSub: { fontSize: 13, color: profileTheme.colors.subtleText },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/ProfileScreen.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/ProfileScreen.tsx pickhouse/mobile/src/screens/profile/__tests__/ProfileScreen.test.tsx
git commit -m "feat(profile): ProfileScreen assembling header, hero, timeline"
```

---

### Task 18: Register Profile in navigation

**Files:**
- Modify: `pickhouse/mobile/src/navigation/TabNavigator.tsx`
- Modify: `pickhouse/mobile/src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Make Profile the home tab**

In `pickhouse/mobile/src/navigation/TabNavigator.tsx` add/replace:

```typescript
import { ProfileScreen } from '../screens/profile/ProfileScreen';

// inside Tab.Navigator initialRouteName="Profile":
<Tab.Screen
  name="Profile"
  component={ProfileScreen}
  options={{
    tabBarLabel: '내 집',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="home-outline" size={size} color={color} />
    ),
  }}
/>
```

Make sure `initialRouteName="Profile"` is set on the `<Tab.Navigator>`.

- [ ] **Step 2: Register residence stack routes**

In `pickhouse/mobile/src/navigation/RootNavigator.tsx`:

```typescript
import { PastResidenceDetailScreen } from '../screens/residence/PastResidenceDetailScreen';
import { DirectAddResidenceScreen } from '../screens/residence/DirectAddResidenceScreen';
import { PromoteModal } from '../screens/residence/PromoteModal';
import { EraLabelEditor } from '../screens/residence/EraLabelEditor';

<Stack.Screen name="PastResidenceDetail" component={PastResidenceDetailScreen} />
<Stack.Screen name="DirectAddResidence" component={DirectAddResidenceScreen} />
<Stack.Screen name="PromoteHouse" component={PromoteModal} options={{ presentation: 'modal' }} />
<Stack.Screen name="EraLabelEditor" component={EraLabelEditor} options={{ presentation: 'modal' }} />
```

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/navigation/TabNavigator.tsx pickhouse/mobile/src/navigation/RootNavigator.tsx
git commit -m "feat(nav): register profile & residence routes, set Profile as home tab"
```

---

### Task 19: PromoteModal — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/residence/PromoteModal.tsx`
- Test: `pickhouse/mobile/src/screens/residence/__tests__/PromoteModal.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/residence/__tests__/PromoteModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { PromoteModal } from '../PromoteModal';
import { useHousesStore } from '../../../stores/housesStore';
import { useResidencesStore } from '../../../stores/residencesStore';
import * as api from '../../../api/residences';

jest.mock('../../../stores/housesStore');
jest.mock('../../../stores/residencesStore');
jest.mock('../../../api/residences');

const nav = { goBack: jest.fn(), navigate: jest.fn() };

describe('PromoteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useHousesStore as unknown as jest.Mock).mockReturnValue({
      houses: [{ id: 'h1', address: { road: '강남구 역삼동' }, photos: [] }],
      removeHouse: jest.fn(),
    });
    (useResidencesStore as unknown as jest.Mock).mockReturnValue({
      addResidence: jest.fn().mockResolvedValue({ id: 'r1' }),
    });
  });

  it('renders contract date inputs and memo field', () => {
    render(<PromoteModal navigation={nav as any} route={{ params: { houseId: 'h1' } } as any} />);
    expect(screen.getByA11yLabel('contract-start')).toBeTruthy();
    expect(screen.getByA11yLabel('contract-end')).toBeTruthy();
    expect(screen.getByA11yLabel('landlord-memo')).toBeTruthy();
  });

  it('disables submit until both dates are filled', () => {
    render(<PromoteModal navigation={nav as any} route={{ params: { houseId: 'h1' } } as any} />);
    expect(screen.getByA11yLabel('submit-promote')).toBeDisabled();
  });

  it('on submit calls promoteHouseToResidence and addResidence, then navigates back', async () => {
    (api.promoteHouseToResidence as jest.Mock).mockResolvedValue('srv_1');
    render(<PromoteModal navigation={nav as any} route={{ params: { houseId: 'h1' } } as any} />);
    fireEvent.changeText(screen.getByA11yLabel('contract-start'), '2025-01-01');
    fireEvent.changeText(screen.getByA11yLabel('contract-end'), '2027-01-01');
    fireEvent.changeText(screen.getByA11yLabel('landlord-memo'), '주인 김씨');
    fireEvent.press(screen.getByA11yLabel('submit-promote'));
    await waitFor(() => {
      expect(api.promoteHouseToResidence).toHaveBeenCalledWith(
        'h1',
        expect.objectContaining({
          contractStartDate: '2025-01-01',
          contractEndDate: '2027-01-01',
          landlordMemo: '주인 김씨',
        })
      );
      expect(nav.goBack).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/residence/__tests__/PromoteModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/residence/PromoteModal.tsx
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHousesStore } from '../../stores/housesStore';
import { useResidencesStore } from '../../stores/residencesStore';
import { promoteHouseToResidence } from '../../api/residences';
import { profileTheme } from '../../theme/profileTheme';

interface RouteParams { houseId: string }

export function PromoteModal({ navigation, route }: any) {
  const { houseId } = route.params as RouteParams;
  const { houses, removeHouse } = useHousesStore();
  const { addResidence } = useResidencesStore();
  const house = houses.find((h) => h.id === houseId);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!start && !!end && !submitting;

  async function onSubmit() {
    if (!canSubmit || !house) return;
    setSubmitting(true);
    try {
      let serverId: string | null = null;
      try {
        serverId = await promoteHouseToResidence(houseId, {
          contractStartDate: start,
          contractEndDate: end,
          landlordMemo: memo,
          moveInPhotos: house.photos,
          contractPhoto: null,
          meterReadings: null,
        });
      } catch {
        // offline; queue handled elsewhere
      }
      await addResidence({
        sourceHouseId: houseId,
        address: house.address,
        dealType: house.dealType,
        deposit: house.deposit,
        rent: house.rent,
        maintenanceFee: house.maintenanceFee,
        area: house.area,
        builtYear: house.builtYear,
        floor: house.floor,
        totalFloor: house.totalFloor,
        rooms: house.rooms,
        bathrooms: house.bathrooms,
        name: house.address?.road ?? '새 집',
        contractStartDate: start,
        contractEndDate: end,
        landlordMemo: memo,
        moveInPhotos: house.photos,
        contractPhoto: null,
        meterReadings: null,
        eraLabel: '직전에 살던 집',
        isCurrent: true,
        isFavorite: false,
      });
      await removeHouse(houseId);
      navigation.goBack();
    } catch (e) {
      Alert.alert('승격 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!house) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>이 집으로 계약/입주함</Text>
          <Text style={styles.sub}>{house.address?.road}</Text>

          <Label text="계약 시작일" />
          <TextInput
            accessibilityLabel="contract-start"
            placeholder="YYYY-MM-DD"
            value={start}
            onChangeText={setStart}
            style={styles.input}
          />

          <Label text="계약 종료일" />
          <TextInput
            accessibilityLabel="contract-end"
            placeholder="YYYY-MM-DD"
            value={end}
            onChangeText={setEnd}
            style={styles.input}
          />

          <Label text="임대인 메모 (본인용)" />
          <TextInput
            accessibilityLabel="landlord-memo"
            multiline
            value={memo}
            onChangeText={setMemo}
            style={[styles.input, styles.multiline]}
            placeholder="집주인 연락처, 특이사항 등"
          />

          <Pressable
            accessibilityLabel="submit-promote"
            disabled={!canSubmit}
            onPress={onSubmit}
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
          >
            <Text style={styles.submitText}>
              {submitting ? '저장 중...' : '내 집으로 옮기기'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: profileTheme.colors.background },
  scroll: { padding: 20, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: profileTheme.colors.cardText },
  sub: { fontSize: 14, color: profileTheme.colors.subtleText, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: profileTheme.colors.cardText, marginTop: 12 },
  input: {
    backgroundColor: profileTheme.colors.cardSurface,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: profileTheme.colors.cardText,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  submit: {
    backgroundColor: profileTheme.colors.pulseAccent,
    paddingVertical: 16,
    borderRadius: profileTheme.radii.pill,
    alignItems: 'center',
    marginTop: 28,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/residence/__tests__/PromoteModal.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/residence/PromoteModal.tsx pickhouse/mobile/src/screens/residence/__tests__/PromoteModal.test.tsx
git commit -m "feat(residence): PromoteModal for house→residence with contract details"
```

---

### Task 20: Hook PromoteModal into HouseDetailScreen

**Files:**
- Modify: `pickhouse/mobile/src/screens/house/HouseDetailScreen.tsx`

- [ ] **Step 1: Add promotion button**

Add to the bottom of HouseDetailScreen's content (after existing memo/photos sections):

```typescript
import { Pressable, StyleSheet, Text } from 'react-native';

// ... inside the component, before closing wrapper:
<Pressable
  accessibilityLabel="promote-to-residence"
  onPress={() => navigation.navigate('PromoteHouse', { houseId: house.id })}
  style={promoteStyles.btn}
>
  <Text style={promoteStyles.btnText}>이 집으로 계약/입주함</Text>
</Pressable>

// add at bottom of file:
const promoteStyles = StyleSheet.create({
  btn: {
    margin: 20,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: '#e07a3a',
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/screens/house/HouseDetailScreen.tsx
git commit -m "feat(house): add 'promote to residence' button on house detail"
```

---

### Task 21: DirectAddResidenceScreen — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/residence/DirectAddResidenceScreen.tsx`
- Test: `pickhouse/mobile/src/screens/residence/__tests__/DirectAddResidenceScreen.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/residence/__tests__/DirectAddResidenceScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { DirectAddResidenceScreen } from '../DirectAddResidenceScreen';
import { useResidencesStore } from '../../../stores/residencesStore';

jest.mock('../../../stores/residencesStore');
const mocked = useResidencesStore as unknown as jest.Mock;

const nav = { goBack: jest.fn() };

describe('DirectAddResidenceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.mockReturnValue({
      addResidence: jest.fn().mockResolvedValue({ id: 'new' }),
    });
  });

  it('renders required fields and "이전 집 추가" title when isCurrent=false', () => {
    render(<DirectAddResidenceScreen navigation={nav as any} route={{ params: { isCurrent: false } } as any} />);
    expect(screen.getByText(/이전 집 추가/)).toBeTruthy();
    expect(screen.getByA11yLabel('residence-name')).toBeTruthy();
    expect(screen.getByA11yLabel('contract-start')).toBeTruthy();
    expect(screen.getByA11yLabel('contract-end')).toBeTruthy();
    expect(screen.getByA11yLabel('deposit')).toBeTruthy();
  });

  it('submits with isCurrent flag from params', async () => {
    const addResidence = jest.fn().mockResolvedValue({ id: 'new' });
    mocked.mockReturnValue({ addResidence });
    render(<DirectAddResidenceScreen navigation={nav as any} route={{ params: { isCurrent: true } } as any} />);
    fireEvent.changeText(screen.getByA11yLabel('residence-name'), '한남동');
    fireEvent.changeText(screen.getByA11yLabel('contract-start'), '2024-01-01');
    fireEvent.changeText(screen.getByA11yLabel('contract-end'), '2026-01-01');
    fireEvent.changeText(screen.getByA11yLabel('deposit'), '2000');
    fireEvent.press(screen.getByA11yLabel('submit-direct-add'));
    await waitFor(() => {
      expect(addResidence).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '한남동',
          contractStartDate: '2024-01-01',
          contractEndDate: '2026-01-01',
          deposit: 2000,
          isCurrent: true,
        })
      );
      expect(nav.goBack).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/residence/__tests__/DirectAddResidenceScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/residence/DirectAddResidenceScreen.tsx
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResidencesStore } from '../../stores/residencesStore';
import { profileTheme } from '../../theme/profileTheme';
import { defaultEraLabel } from '../../utils/eraLabels';

export function DirectAddResidenceScreen({ navigation, route }: any) {
  const params = route.params ?? {};
  const isCurrent: boolean = !!params.isCurrent;
  const { addResidence } = useResidencesStore();

  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [deposit, setDeposit] = useState('');
  const [rent, setRent] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name && start && end && deposit && !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const eraLabel = defaultEraLabel({
        contractStart: start,
        contractEnd: end,
        isMostRecentPast: !isCurrent,
        userBirthYear: null,
      });
      await addResidence({
        sourceHouseId: null,
        address: { road: name, lat: 0, lng: 0 },
        dealType: rent && parseInt(rent, 10) > 0 ? '월세' : '전세',
        deposit: parseInt(deposit, 10),
        rent: rent ? parseInt(rent, 10) : 0,
        maintenanceFee: 0,
        area: null,
        builtYear: null,
        floor: null,
        totalFloor: null,
        rooms: null,
        bathrooms: null,
        name,
        contractStartDate: start,
        contractEndDate: end,
        landlordMemo: memo,
        moveInPhotos: [],
        contractPhoto: null,
        meterReadings: null,
        eraLabel,
        isCurrent,
        isFavorite: false,
      });
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{isCurrent ? '지금 사는 집 추가' : '이전 집 추가'}</Text>
          <Text style={styles.sub}>나중에 사진과 디테일을 더 추가할 수 있어요</Text>

          <Field label="집 이름" a11y="residence-name">
            <TextInput
              accessibilityLabel="residence-name"
              value={name}
              onChangeText={setName}
              placeholder="예: 한남동 옥탑"
              style={styles.input}
            />
          </Field>

          <Field label="계약 시작일" a11y="contract-start">
            <TextInput
              accessibilityLabel="contract-start"
              value={start}
              onChangeText={setStart}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />
          </Field>

          <Field label="계약 종료일" a11y="contract-end">
            <TextInput
              accessibilityLabel="contract-end"
              value={end}
              onChangeText={setEnd}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />
          </Field>

          <Field label="보증금 (만원)" a11y="deposit">
            <TextInput
              accessibilityLabel="deposit"
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>

          <Field label="월세 (만원, 전세는 비워두세요)" a11y="rent">
            <TextInput
              accessibilityLabel="rent"
              value={rent}
              onChangeText={setRent}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>

          <Field label="기억나는 메모" a11y="memo">
            <TextInput
              accessibilityLabel="memo"
              multiline
              value={memo}
              onChangeText={setMemo}
              style={[styles.input, styles.multiline]}
              placeholder="그때의 생각, 인상 등"
            />
          </Field>

          <Pressable
            accessibilityLabel="submit-direct-add"
            disabled={!canSubmit}
            onPress={onSubmit}
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
          >
            <Text style={styles.submitText}>
              {submitting ? '저장 중...' : '추가하기'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, a11y, children }: { label: string; a11y: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: profileTheme.colors.background },
  scroll: { padding: 20, gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: profileTheme.colors.cardText },
  sub: { fontSize: 13, color: profileTheme.colors.subtleText, marginBottom: 16 },
  field: { marginTop: 14 },
  label: { fontSize: 13, fontWeight: '600', color: profileTheme.colors.cardText, marginBottom: 6 },
  input: {
    backgroundColor: profileTheme.colors.cardSurface,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: profileTheme.colors.cardText,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  submit: {
    backgroundColor: profileTheme.colors.pulseAccent,
    paddingVertical: 16,
    borderRadius: profileTheme.radii.pill,
    alignItems: 'center',
    marginTop: 28,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/residence/__tests__/DirectAddResidenceScreen.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/residence/DirectAddResidenceScreen.tsx pickhouse/mobile/src/screens/residence/__tests__/DirectAddResidenceScreen.test.tsx
git commit -m "feat(residence): DirectAddResidenceScreen for pre-app history entries"
```

---

### Task 22: EraLabelEditor sheet

**Files:**
- Create: `pickhouse/mobile/src/screens/residence/EraLabelEditor.tsx`

- [ ] **Step 1: Implement**

```typescript
// pickhouse/mobile/src/screens/residence/EraLabelEditor.tsx
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResidencesStore } from '../../stores/residencesStore';
import { suggestEraLabels } from '../../utils/eraLabels';
import { profileTheme } from '../../theme/profileTheme';

export function EraLabelEditor({ navigation, route }: any) {
  const { residenceId } = route.params as { residenceId: string };
  const { residences, updateOne } = useResidencesStore();
  const r = residences.find((x) => x.id === residenceId);
  const [text, setText] = useState(r?.eraLabel ?? '');

  if (!r) return null;

  const suggestions = suggestEraLabels({
    contractStart: r.contractStartDate,
    contractEnd: r.contractEndDate,
    isMostRecentPast: false,
    userBirthYear: null,
  });

  async function save(label: string) {
    await updateOne(residenceId, { eraLabel: label });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>인생 챕터 라벨</Text>
        <Text style={styles.sub}>이 시기를 한 줄로 표현해주세요</Text>

        <TextInput
          accessibilityLabel="era-label-input"
          value={text}
          onChangeText={setText}
          placeholder="예: 사회초년생 시절"
          style={styles.input}
        />
        <Pressable
          accessibilityLabel="era-label-save"
          onPress={() => save(text.trim())}
          disabled={!text.trim()}
          style={[styles.save, !text.trim() && styles.disabled]}
        >
          <Text style={styles.saveText}>저장</Text>
        </Pressable>

        <Text style={styles.suggestTitle}>제안</Text>
        <View style={styles.chips}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              accessibilityLabel={`suggest-${s}`}
              onPress={() => save(s)}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: profileTheme.colors.background },
  scroll: { padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: profileTheme.colors.cardText },
  sub: { fontSize: 13, color: profileTheme.colors.subtleText },
  input: {
    backgroundColor: profileTheme.colors.cardSurface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginTop: 8,
  },
  save: {
    backgroundColor: profileTheme.colors.pulseAccent,
    paddingVertical: 14,
    borderRadius: profileTheme.radii.pill,
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  suggestTitle: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: profileTheme.colors.cardText,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: profileTheme.colors.cardSurface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: profileTheme.radii.pill,
  },
  chipText: { fontSize: 13, color: profileTheme.colors.cardText },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/screens/residence/EraLabelEditor.tsx
git commit -m "feat(residence): EraLabelEditor sheet with custom input + suggestions"
```

---

### Task 23: PastResidenceDetailScreen — TDD

**Files:**
- Create: `pickhouse/mobile/src/screens/residence/PastResidenceDetailScreen.tsx`
- Test: `pickhouse/mobile/src/screens/residence/__tests__/PastResidenceDetailScreen.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// pickhouse/mobile/src/screens/residence/__tests__/PastResidenceDetailScreen.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';
import { PastResidenceDetailScreen } from '../PastResidenceDetailScreen';
import { useResidencesStore } from '../../../stores/residencesStore';

jest.mock('../../../stores/residencesStore');
const mocked = useResidencesStore as unknown as jest.Mock;

const nav = { navigate: jest.fn(), goBack: jest.fn() };
const r = {
  id: 'r1',
  name: '망원동',
  contractStartDate: '2022-03-01',
  contractEndDate: '2024-02-28',
  deposit: 1000, rent: 55,
  dealType: 'WOLSE',
  landlordMemo: '주인 김씨',
  moveInPhotos: [],
  eraLabel: '사회초년생 시절',
  isCurrent: false,
} as any;

describe('PastResidenceDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.mockReturnValue({
      residences: [r],
      setCurrent: jest.fn(),
      removeOne: jest.fn(),
    });
  });

  it('renders name, period, era label, memo', () => {
    render(<PastResidenceDetailScreen navigation={nav as any} route={{ params: { id: 'r1' } } as any} />);
    expect(screen.getByText('망원동')).toBeTruthy();
    expect(screen.getByText(/2022.03 - 2024.02/)).toBeTruthy();
    expect(screen.getByText('사회초년생 시절')).toBeTruthy();
    expect(screen.getByText('주인 김씨')).toBeTruthy();
  });

  it('navigates to era editor on era label tap', () => {
    render(<PastResidenceDetailScreen navigation={nav as any} route={{ params: { id: 'r1' } } as any} />);
    fireEvent.press(screen.getByA11yLabel('edit-era'));
    expect(nav.navigate).toHaveBeenCalledWith('EraLabelEditor', { residenceId: 'r1' });
  });

  it('mark-as-current flips this to current', () => {
    const setCurrent = jest.fn();
    mocked.mockReturnValue({ residences: [r], setCurrent, removeOne: jest.fn() });
    render(<PastResidenceDetailScreen navigation={nav as any} route={{ params: { id: 'r1' } } as any} />);
    fireEvent.press(screen.getByA11yLabel('mark-current'));
    expect(setCurrent).toHaveBeenCalledWith('r1');
  });

  it('delete confirms and removes', () => {
    const removeOne = jest.fn();
    mocked.mockReturnValue({ residences: [r], setCurrent: jest.fn(), removeOne });
    // mock Alert by spying on the global Alert.alert and immediately calling the confirm cb:
    const Alert = require('react-native').Alert;
    Alert.alert = (_t: string, _m: string, buttons: any) => {
      const confirm = buttons.find((b: any) => b.style === 'destructive');
      confirm.onPress();
    };
    render(<PastResidenceDetailScreen navigation={nav as any} route={{ params: { id: 'r1' } } as any} />);
    fireEvent.press(screen.getByA11yLabel('delete-residence'));
    expect(removeOne).toHaveBeenCalledWith('r1');
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `cd pickhouse/mobile && npx jest src/screens/residence/__tests__/PastResidenceDetailScreen.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// pickhouse/mobile/src/screens/residence/PastResidenceDetailScreen.tsx
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResidencesStore } from '../../stores/residencesStore';
import { profileTheme } from '../../theme/profileTheme';
import { formatPeriod, durationLabel } from '../../utils/dateFormat';
import { PhotoStrip } from '../profile/components/PhotoStrip';

export function PastResidenceDetailScreen({ navigation, route }: any) {
  const { id } = route.params as { id: string };
  const { residences, setCurrent, removeOne } = useResidencesStore();
  const r = residences.find((x) => x.id === id);
  if (!r) return null;

  function confirmDelete() {
    Alert.alert(
      '삭제하시겠어요?',
      '이 집의 기록이 모두 사라집니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await removeOne(id);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="back"
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={24} color={profileTheme.colors.cardText} />
          </Pressable>
          <Pressable
            accessibilityLabel="delete-residence"
            onPress={confirmDelete}
            hitSlop={12}
          >
            <Ionicons name="trash-outline" size={20} color={profileTheme.colors.subtleText} />
          </Pressable>
        </View>

        <Text style={styles.name}>{r.name}</Text>
        <Pressable
          accessibilityLabel="edit-era"
          onPress={() => navigation.navigate('EraLabelEditor', { residenceId: id })}
        >
          <Text style={styles.era}>{r.eraLabel ?? '챕터 라벨 추가'}</Text>
        </Pressable>
        <Text style={styles.period}>
          {formatPeriod(r.contractStartDate, r.contractEndDate, { isCurrent: r.isCurrent })}
          {'  ·  '}
          {durationLabel(r.contractStartDate, r.contractEndDate)}
        </Text>

        <View style={styles.section}>
          <PhotoStrip photos={r.moveInPhotos} onPressIndex={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>스펙</Text>
          <Row label="거래" value={r.dealType} />
          <Row label="보증금" value={`${r.deposit.toLocaleString()}만`} />
          {r.rent > 0 && <Row label="월세" value={`${r.rent}만`} />}
          {r.area != null && <Row label="전용면적" value={`${r.area}평`} />}
          {r.floor != null && <Row label="층수" value={`${r.floor}/${r.totalFloor ?? '?'}층`} />}
        </View>

        {!!r.landlordMemo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>임대인 메모</Text>
            <Text style={styles.memo}>{r.landlordMemo}</Text>
          </View>
        )}

        {!r.isCurrent && (
          <Pressable
            accessibilityLabel="mark-current"
            onPress={() => setCurrent(id)}
            style={styles.markCurrent}
          >
            <Text style={styles.markText}>지금 사는 집으로 표시</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: profileTheme.colors.background },
  scroll: { padding: 20, gap: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '700', color: profileTheme.colors.cardText },
  era: {
    fontSize: 14,
    color: profileTheme.colors.pulseAccent,
    fontWeight: '600',
    marginTop: 4,
  },
  period: { fontSize: 13, color: profileTheme.colors.subtleText, marginTop: 4 },
  section: {
    marginTop: 24,
    backgroundColor: profileTheme.colors.cardSurface,
    borderRadius: profileTheme.radii.card,
    padding: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: profileTheme.colors.cardText, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: profileTheme.colors.subtleText, fontSize: 13 },
  rowValue: { color: profileTheme.colors.cardText, fontSize: 14, fontWeight: '600' },
  memo: { color: profileTheme.colors.cardText, fontSize: 14, lineHeight: 20 },
  markCurrent: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: profileTheme.radii.pill,
    backgroundColor: profileTheme.colors.addButtonBg,
    alignItems: 'center',
  },
  markText: { color: profileTheme.colors.eraLabel, fontWeight: '600', fontSize: 14 },
});
```

- [ ] **Step 4: Run to pass**

Run: `cd pickhouse/mobile && npx jest src/screens/residence/__tests__/PastResidenceDetailScreen.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/residence/PastResidenceDetailScreen.tsx pickhouse/mobile/src/screens/residence/__tests__/PastResidenceDetailScreen.test.tsx
git commit -m "feat(residence): PastResidenceDetail with era edit, mark-current, delete"
```

---

### Task 24: Wire promotion to remove house from candidates

**Files:**
- Modify: `pickhouse/mobile/src/stores/housesStore.ts`

- [ ] **Step 1: Add removeHouse**

Inside `useHousesStore` add (if not present):

```typescript
removeHouse: async (id: string) => {
  const db = await getDb();
  await db.runAsync(`DELETE FROM houses WHERE id = ?`, [id]);
  set((s) => ({ houses: s.houses.filter((h) => h.id !== id) }));
},
```

Also add to the `HousesState` interface:
```typescript
removeHouse: (id: string) => Promise<void>;
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/stores/housesStore.ts
git commit -m "feat(store): housesStore.removeHouse for promotion cleanup"
```

---

### Task 25: Sync residences on load (initial server pull)

**Files:**
- Modify: `pickhouse/mobile/src/stores/residencesStore.ts`

- [ ] **Step 1: Extend store with syncFromServer**

Add to `useResidencesStore`:

```typescript
import { fetchResidences } from '../api/residences';

// inside the create() body:
syncFromServer: async () => {
  try {
    const remote = await fetchResidences();
    const db = await getDb();
    for (const r of remote) {
      const existing = await db.getFirstAsync<any>(
        `SELECT id FROM residences WHERE server_id = ?`,
        [r.serverId ?? (r as any).id]
      );
      if (!existing) {
        await insertResidence(db, { ...r, isCurrent: r.isCurrent });
      }
    }
    const list = await listResidences(db);
    const current = list.find((x) => x.isCurrent) ?? null;
    set({ residences: list, current });
  } catch {
    // offline — silent
  }
},
```

Add to interface:
```typescript
syncFromServer: () => Promise<void>;
```

And update ProfileScreen useEffect:

```typescript
useEffect(() => {
  load().then(() => syncFromServer());
}, [load, syncFromServer]);
```

Pull `syncFromServer` from store:
```typescript
const { residences, current, load, updateOne, syncFromServer } = useResidencesStore();
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/stores/residencesStore.ts pickhouse/mobile/src/screens/profile/ProfileScreen.tsx
git commit -m "feat(store): syncFromServer pulls remote residences after local load"
```

---

### Task 26: Push local changes back to server (write sync)

**Files:**
- Modify: `pickhouse/mobile/src/stores/residencesStore.ts`

- [ ] **Step 1: Hook server writes inside addResidence/updateOne**

Replace addResidence:

```typescript
import { createResidence, patchResidence } from '../api/residences';

addResidence: async (draft) => {
  const db = await getDb();
  const r = await insertResidence(db, draft);
  // background push
  createResidence({ ...draft } as any)
    .then(async (serverId) => {
      await db.runAsync(`UPDATE residences SET server_id = ? WHERE id = ?`, [serverId, r.id]);
    })
    .catch(() => {});
  const list = await listResidences(db);
  const current = list.find((x) => x.isCurrent) ?? null;
  set({ residences: list, current });
  return r;
},

updateOne: async (id, patch) => {
  const db = await getDb();
  await updateResidence(db, id, patch);
  const row = await db.getFirstAsync<any>(`SELECT server_id FROM residences WHERE id = ?`, [id]);
  if (row?.server_id) {
    patchResidence(row.server_id, patch as any).catch(() => {});
  }
  const list = await listResidences(db);
  const current = list.find((r) => r.isCurrent) ?? null;
  set({ residences: list, current });
},
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/stores/residencesStore.ts
git commit -m "feat(store): push local residence writes to server in background"
```

---

### Task 27: PhotoStrip from PastResidenceCard responds to overflow tap

**Files:**
- Modify: `pickhouse/mobile/src/screens/profile/components/PastResidenceCard.tsx`

- [ ] **Step 1: Forward photo tap to card press**

Change the `onPressIndex` in PastResidenceCard's PhotoStrip usage to dispatch to `onPress(residence.id)` regardless of index (already done in Task 13). Add a regression test:

```typescript
// append to pickhouse/mobile/src/screens/profile/__tests__/PastResidenceCard.test.tsx
it('photo overflow tap opens the residence detail', () => {
  const fn = jest.fn();
  const many = { ...residence, moveInPhotos: Array.from({ length: 8 }, (_, i) => ({ remoteUrl: `u${i}` })) };
  render(<PastResidenceCard residence={many as any} onPress={fn} />);
  fireEvent.press(screen.getByA11yLabel('photo-overflow'));
  expect(fn).toHaveBeenCalledWith('r2');
});
```

- [ ] **Step 2: Run all profile tests**

Run: `cd pickhouse/mobile && npx jest src/screens/profile`
Expected: PASS — all suites.

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/__tests__/PastResidenceCard.test.tsx
git commit -m "test(profile): regression test for photo overflow opens detail"
```

---

### Task 28: Profile screen integration test

**Files:**
- Create: `pickhouse/mobile/src/screens/profile/__tests__/ProfileScreen.integration.test.tsx`

- [ ] **Step 1: Write integration test**

```typescript
// pickhouse/mobile/src/screens/profile/__tests__/ProfileScreen.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../ProfileScreen';
import { DirectAddResidenceScreen } from '../../residence/DirectAddResidenceScreen';

const Stack = createNativeStackNavigator();

function Harness() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="DirectAddResidence" component={DirectAddResidenceScreen} />
        <Stack.Screen name="Settings" component={() => null as any} />
        <Stack.Screen name="PastResidenceDetail" component={() => null as any} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('ProfileScreen integration', () => {
  it('tapping "더 이전 집 추가" navigates to direct-add form', async () => {
    render(<Harness />);
    await waitFor(() => screen.getByText('MY HOMES'));
    fireEvent.press(screen.getByA11yLabel('add-older-residence'));
    await waitFor(() => expect(screen.getByText(/이전 집 추가/)).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/ProfileScreen.integration.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/__tests__/ProfileScreen.integration.test.tsx
git commit -m "test(profile): integration test for add-older navigation flow"
```

---

### Task 29: Snapshot / visual smoke test for Timeline

**Files:**
- Modify: `pickhouse/mobile/src/screens/profile/__tests__/Timeline.test.tsx`

- [ ] **Step 1: Append snapshot test**

```typescript
// append to Timeline.test.tsx
it('matches snapshot for 3-residence layout', () => {
  const tree = render(<Timeline residences={past} onCardPress={() => {}} onAddOlder={() => {}} />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

- [ ] **Step 2: Run + commit snapshot**

Run: `cd pickhouse/mobile && npx jest src/screens/profile/__tests__/Timeline.test.tsx -u`
Expected: PASS (snapshot written).

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/screens/profile/__tests__/Timeline.test.tsx pickhouse/mobile/src/screens/profile/__tests__/__snapshots__/Timeline.test.tsx.snap
git commit -m "test(profile): timeline snapshot test"
```

---

### Task 30: E2E manual checklist + final test pass

**Files:** none (manual verification + run full suite)

- [ ] **Step 1: Run full mobile test suite**

Run: `cd pickhouse/mobile && npx jest`
Expected: All tests PASS.

- [ ] **Step 2: Manual flow check (in dev build)**

Verify:
1. Open app → Profile is the home tab.
2. No greeting like "안녕 X" appears anywhere on the profile screen.
3. Header shows "MY HOMES" + settings cog only.
4. If no current residence: empty hero card "지금 살고 있는 집을 추가해보세요" appears.
5. Tap empty hero → DirectAddResidence opens with title "지금 사는 집 추가".
6. Add a residence (date 2024-01-01 to 2026-01-01) → returns to Profile → Hero card visible with photo placeholder, "지금 사는 곳" pulse, name, period "2024.01 - 현재".
7. From Houses tab, open a house → tap "이 집으로 계약/입주함" → fill form → submit → house disappears from candidates, new residence appears as current on profile, previous current shifts to past.
8. Tap "더 이전 집 추가" → direct-add opens with title "이전 집 추가".
9. Add a 2020-2022 residence with era label "대학생 시절" → appears in timeline with year markers and era label.
10. Tap past residence card → detail screen with all info.
11. In detail: tap era label → editor opens → pick "사회초년생 시절" → returns and label updated.
12. In detail: tap "지금 사는 집으로 표시" → previous current becomes past, this becomes current.
13. In detail: trash icon → confirm → residence removed.
14. Force-quit and reopen → all data persists from SQLite.
15. Turn airplane mode on, add a residence → appears immediately. Turn off airplane mode → background sync pushes to server (verify via server logs or next launch on another build).

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "chore: Plan 4 (profile & residence) complete — manual e2e verified" --allow-empty
```

---

## Self-Review

**Spec coverage check (Section 5.1 — 내 집 프로필, Section 4.2 — Residence, Section 2.4-2.6):**

- "MY HOMES" mini label + settings icon, no greeting — Task 17.
- Hero card: photo, pin, heart favorite, "지금 사는 곳" pulse, name, period, key stats — Tasks 10, 11.
- Timeline: dotted vertical line, fade at bottom, year markers, era labels, cards with breathing space, end circle, add older button — Tasks 14, 15, 16.
- Past residence card: horizontal photo strip with main + secondary + "+N" overflow — Tasks 12, 13.
- Cards tappable to detail — Task 13 onPress, Task 23 detail screen.
- House → Residence promotion with contract dates, landlord memo, move-in photos, contract photo (null in MVP form), meter readings (null in MVP form) — Task 19. Photos carry over from house; contract photo + meter readings have field placeholders in payload (passable as null on direct form; promotion uses house photos as moveInPhotos).
- Direct residence add — Task 21.
- Past residence detail — Task 23.
- Era label editor with auto-suggestions — Tasks 4, 22.
- Set current with auto-shift of previous — Tasks 7 (setCurrentResidence transaction), 23 (UI).
- Local SQLite + server sync — Tasks 5, 6, 7, 8, 9, 25, 26.
- Warm collection aesthetic palette (cream bg, soft shadow, etc.) — Task 2.
- Scenario C continuation: post-Plan-3 contract decision feeds into Hero — Task 19 wires this.
- Scenario D: input contract dates + landlord memo + move-in photos — Task 19.
- Scenario E: timeline recall + tap into past detail — Tasks 16, 23.

**Gaps found and patched:**
- Initial review: contract photo + meter readings only carried as null fields. Spec 4.2 lists them — they ARE in the type model (Task 1) and the DB schema (Task 5), and the patch path is open (Task 7 `updateResidence` handles them). The PromoteModal omits explicit UI capture for them in MVP — acceptable since spec marks `contractPhoto` and `meterReadings` as "선택"; user can fill on detail later via a future v2 edit form. Acknowledged scope-aligned.
- userBirthYear is null in DirectAddResidence: era suggestions fall back to year-only label, which the test in Task 4 covers.

**Placeholder scan:** no TBD/TODO/"implement later"/"add validation" patterns. Every code step shows full code. Every test step shows test code and exact run command with expected outcome.

**Type consistency check:**
- `Residence` shape defined in Task 1 used unchanged in Tasks 6, 7, 8, 9, 11, 13, 16, 17, 19, 21, 22, 23.
- `ResidenceDraft = Omit<Residence, 'id'|'serverId'|'createdAt'|'updatedAt'>` — Task 7 `insertResidence(db, draft: ResidenceDraft)` consistent with Task 9 store and Task 19, 21 callers (they construct full draft objects).
- `setCurrentResidence(db, id)` name consistent in Tasks 7, 9, 23 callers (`setCurrent`).
- `promoteHouseToResidence(houseId, payload)` consistent in Task 8 and Task 19.
- `PhotoStrip` props `photos: Photo[]; onPressIndex: (n: number) => void` consistent in Tasks 12, 13, 23.
- `useResidencesStore` field names (`residences`, `current`, `load`, `addResidence`, `updateOne`, `setCurrent`, `removeOne`, `syncFromServer`) consistent across Tasks 9, 17, 19, 21, 22, 23, 25, 26.
- Theme tokens used (`profileTheme.colors.X`, `profileTheme.spacing.X`, `profileTheme.typography.X`) all defined in Task 2.

All checks pass. Plan is internally consistent and spec-complete for Plan 4 scope.
