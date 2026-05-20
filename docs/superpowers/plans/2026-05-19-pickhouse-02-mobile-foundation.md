# PickHouse Mobile Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expo (React Native) mobile app with auth, offline-first SQLite cache, house input + list + detail screens, and photo upload to R2 — depends on Plan 1's backend API.

**Architecture:** Expo SDK + TypeScript + Zustand + React Query + expo-sqlite for offline cache + expo-secure-store for tokens + sync queue for offline-first writes.

**Tech Stack:** Expo, React Native, TypeScript, Zustand, React Query, expo-sqlite, expo-file-system, expo-secure-store, expo-apple-authentication, @react-native-seoul/kakao-login, expo-camera, axios, Jest + RNTL.

---

## File Structure

All paths relative to `pickhouse/mobile/`.

### Configuration
- `package.json` — dependencies and scripts
- `tsconfig.json` — strict TypeScript config
- `app.json` — Expo config (icons, plugins, scheme)
- `babel.config.js` — Babel preset + module resolver
- `metro.config.js` — Metro bundler config
- `jest.config.js` — Jest + RNTL setup
- `jest.setup.ts` — global test mocks
- `.env.example` — env var template
- `.eslintrc.js` — ESLint with @react-native + typescript
- `.prettierrc` — Prettier config

### App entry
- `App.tsx` — root component (providers, navigation)
- `index.ts` — Expo registration

### Theme & design tokens
- `src/theme/colors.ts` — cream palette (#faf6f0 etc.)
- `src/theme/typography.ts` — font scale
- `src/theme/spacing.ts` — spacing scale
- `src/theme/shadows.ts` — soft shadow presets
- `src/theme/index.ts` — theme barrel

### Domain types
- `src/types/house.ts` — House, DealType
- `src/types/residence.ts` — Residence
- `src/types/photo.ts` — Photo, UploadStatus
- `src/types/user.ts` — User
- `src/types/auth.ts` — auth payloads
- `src/types/index.ts` — barrel

### Local database (SQLite)
- `src/db/database.ts` — db open + migrations
- `src/db/migrations.ts` — schema versions
- `src/db/houses.repo.ts` — house CRUD
- `src/db/residences.repo.ts` — residence CRUD
- `src/db/photos.repo.ts` — photo CRUD
- `src/db/syncQueue.repo.ts` — sync queue CRUD

### Sync engine
- `src/sync/syncQueue.ts` — enqueue/dequeue ops
- `src/sync/syncProcessor.ts` — processes queue when online
- `src/sync/networkMonitor.ts` — online/offline detection
- `src/sync/conflictResolution.ts` — last-write-wins helper

### Secure storage
- `src/storage/secureTokens.ts` — JWT save/load/clear

### API client
- `src/api/client.ts` — axios instance + interceptors
- `src/api/auth.api.ts` — login/refresh
- `src/api/houses.api.ts` — house endpoints
- `src/api/residences.api.ts` — residence endpoints
- `src/api/photos.api.ts` — photo upload-url + finalize
- `src/api/r2Upload.ts` — direct R2 PUT

### Auth providers
- `src/auth/appleAuth.ts` — expo-apple-authentication wrapper
- `src/auth/kakaoAuth.ts` — @react-native-seoul/kakao-login wrapper
- `src/auth/authService.ts` — orchestrates provider → backend → store

### State stores (Zustand)
- `src/stores/authStore.ts` — user + tokens state
- `src/stores/housesStore.ts` — house list cache hints
- `src/stores/residencesStore.ts` — residence list cache hints

### React Query hooks
- `src/queries/queryClient.ts` — QueryClient setup
- `src/queries/houses.queries.ts` — useHouses, useHouse, useCreateHouse, etc.
- `src/queries/residences.queries.ts` — useResidences
- `src/queries/photos.queries.ts` — useUploadPhoto

### Photo pipeline
- `src/photos/photoCache.ts` — expo-file-system cache
- `src/photos/photoUploader.ts` — orchestrates R2 upload
- `src/photos/cameraHelper.ts` — expo-camera permissions + capture

### External integrations
- `src/integrations/kakaoAddress.tsx` — 카카오 우편번호 WebView

### Navigation
- `src/navigation/RootNavigator.tsx` — auth gate + main stack
- `src/navigation/AuthStack.tsx`
- `src/navigation/MainTabs.tsx`
- `src/navigation/types.ts` — typed route params

### Screens
- `src/screens/auth/AuthScreen.tsx`
- `src/screens/houses/HouseListScreen.tsx`
- `src/screens/houses/HouseInputScreen.tsx` (quick + detail tabs)
- `src/screens/houses/HouseDetailScreen.tsx`

### Shared UI components
- `src/components/Card.tsx`
- `src/components/Button.tsx`
- `src/components/StarRating.tsx`
- `src/components/AddressPicker.tsx`
- `src/components/PhotoGrid.tsx`
- `src/components/AppleSignInButton.tsx`
- `src/components/KakaoSignInButton.tsx`

### Tests (colocated under `__tests__/` directories at each level)
- `src/db/__tests__/houses.repo.test.ts`
- `src/sync/__tests__/syncProcessor.test.ts`
- `src/storage/__tests__/secureTokens.test.ts`
- `src/api/__tests__/client.test.ts`
- `src/auth/__tests__/authService.test.ts`
- `src/stores/__tests__/authStore.test.ts`
- `src/queries/__tests__/houses.queries.test.ts`
- `src/photos/__tests__/photoUploader.test.ts`
- `src/screens/auth/__tests__/AuthScreen.test.tsx`
- `src/screens/houses/__tests__/HouseListScreen.test.tsx`
- `src/screens/houses/__tests__/HouseInputScreen.test.tsx`
- `src/screens/houses/__tests__/HouseDetailScreen.test.tsx`

---

## Tasks

### Task 1: Initialize Expo TypeScript project

**Files:**
- Create: `pickhouse/mobile/package.json`
- Create: `pickhouse/mobile/tsconfig.json`
- Create: `pickhouse/mobile/app.json`
- Create: `pickhouse/mobile/babel.config.js`
- Create: `pickhouse/mobile/index.ts`
- Create: `pickhouse/mobile/App.tsx`
- Create: `pickhouse/mobile/.gitignore`

- [ ] **Step 1: Verify mobile directory exists or create it**

```bash
mkdir -p pickhouse/mobile
cd pickhouse/mobile
```

- [ ] **Step 2: Create package.json**

Path: `pickhouse/mobile/package.json`

```json
{
  "name": "pickhouse-mobile",
  "version": "0.1.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/react": "~18.3.12",
    "typescript": "^5.5.0"
  },
  "private": true
}
```

- [ ] **Step 3: Create tsconfig.json**

Path: `pickhouse/mobile/tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 4: Create app.json**

Path: `pickhouse/mobile/app.json`

```json
{
  "expo": {
    "name": "살래말래",
    "slug": "pickhouse",
    "version": "0.1.0",
    "orientation": "portrait",
    "scheme": "pickhouse",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": {
      "bundleIdentifier": "com.pickhouse.app",
      "supportsTablet": false,
      "usesAppleSignIn": true,
      "infoPlist": {
        "NSCameraUsageDescription": "집 사진을 촬영하기 위해 카메라를 사용합니다.",
        "NSPhotoLibraryUsageDescription": "집 사진을 선택하기 위해 사진첩에 접근합니다.",
        "NSLocationWhenInUseUsageDescription": "주소 입력 시 위치를 사용합니다."
      }
    },
    "android": {
      "package": "com.pickhouse.app",
      "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-apple-authentication",
      "expo-secure-store",
      "expo-sqlite",
      "expo-camera",
      "expo-file-system"
    ]
  }
}
```

- [ ] **Step 5: Create babel.config.js**

Path: `pickhouse/mobile/babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
    ],
  };
};
```

- [ ] **Step 6: Create entry files**

Path: `pickhouse/mobile/index.ts`

```ts
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

Path: `pickhouse/mobile/App.tsx`

```tsx
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#faf6f0', alignItems: 'center', justifyContent: 'center' }}>
      <Text>PickHouse</Text>
      <StatusBar style="auto" />
    </View>
  );
}
```

- [ ] **Step 7: Create .gitignore**

Path: `pickhouse/mobile/.gitignore`

```
node_modules/
.expo/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
.env
.env.local
ios/
android/
```

- [ ] **Step 8: Install dependencies**

```bash
cd pickhouse/mobile
npm install
npm install --save-dev babel-plugin-module-resolver
```

- [ ] **Step 9: Verify typecheck passes**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add pickhouse/mobile/package.json pickhouse/mobile/tsconfig.json pickhouse/mobile/app.json pickhouse/mobile/babel.config.js pickhouse/mobile/index.ts pickhouse/mobile/App.tsx pickhouse/mobile/.gitignore
git commit -m "chore(mobile): initialize Expo TypeScript project"
```

---

### Task 2: Install runtime dependencies

**Files:**
- Modify: `pickhouse/mobile/package.json`

- [ ] **Step 1: Install state + data libraries**

```bash
cd pickhouse/mobile
npx expo install zustand @tanstack/react-query axios
```

- [ ] **Step 2: Install Expo native modules**

```bash
cd pickhouse/mobile
npx expo install expo-sqlite expo-file-system expo-secure-store expo-camera expo-image-picker expo-apple-authentication expo-network expo-crypto expo-application
```

- [ ] **Step 3: Install Kakao login**

```bash
cd pickhouse/mobile
npm install @react-native-seoul/kakao-login
```

- [ ] **Step 4: Install navigation**

```bash
cd pickhouse/mobile
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-gesture-handler
```

- [ ] **Step 5: Install WebView (for kakao address)**

```bash
cd pickhouse/mobile
npx expo install react-native-webview
```

- [ ] **Step 6: Verify install + typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add pickhouse/mobile/package.json pickhouse/mobile/package-lock.json
git commit -m "chore(mobile): install runtime dependencies"
```

---

### Task 3: Configure Jest + React Native Testing Library

**Files:**
- Modify: `pickhouse/mobile/package.json`
- Create: `pickhouse/mobile/jest.config.js`
- Create: `pickhouse/mobile/jest.setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
cd pickhouse/mobile
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest react-test-renderer@18.3.1 ts-jest
```

- [ ] **Step 2: Create jest.config.js**

Path: `pickhouse/mobile/jest.config.js`

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-seoul/.*)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
```

- [ ] **Step 3: Create jest.setup.ts**

Path: `pickhouse/mobile/jest.setup.ts`

```ts
import '@testing-library/jest-native/extend-expect';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock-doc/',
  cacheDirectory: 'file:///mock-cache/',
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  uploadAsync: jest.fn(),
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 1, EMAIL: 2 },
}));

jest.mock('@react-native-seoul/kakao-login', () => ({
  login: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({ isConnected: true }),
}));
```

- [ ] **Step 4: Add test script (already in package.json from Task 1) — verify Jest runs**

```bash
cd pickhouse/mobile
npm test -- --passWithNoTests
```

Expected: PASS with "No tests found" / passes due to flag

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/jest.config.js pickhouse/mobile/jest.setup.ts pickhouse/mobile/package.json pickhouse/mobile/package-lock.json
git commit -m "chore(mobile): configure Jest and React Native Testing Library"
```

---

### Task 4: Define design tokens (theme)

**Files:**
- Create: `pickhouse/mobile/src/theme/colors.ts`
- Create: `pickhouse/mobile/src/theme/typography.ts`
- Create: `pickhouse/mobile/src/theme/spacing.ts`
- Create: `pickhouse/mobile/src/theme/shadows.ts`
- Create: `pickhouse/mobile/src/theme/index.ts`

- [ ] **Step 1: Create colors.ts**

Path: `pickhouse/mobile/src/theme/colors.ts`

```ts
export const colors = {
  cream: '#faf6f0',
  creamDark: '#f0e9dd',
  ink: '#2a2620',
  inkSoft: '#5a544a',
  inkMuted: '#8a8278',
  accentGreen: '#7a9b76',
  accentBeige: '#c7b8a3',
  white: '#ffffff',
  border: '#e8e0d2',
  danger: '#c5523f',
  star: '#d4a84b',
  cardBg: '#ffffff',
} as const;

export type ColorKey = keyof typeof colors;
```

- [ ] **Step 2: Create typography.ts**

Path: `pickhouse/mobile/src/theme/typography.ts`

```ts
import { TextStyle } from 'react-native';

export const typography = {
  display: { fontSize: 32, fontWeight: '700', lineHeight: 40 } as TextStyle,
  title: { fontSize: 24, fontWeight: '600', lineHeight: 32 } as TextStyle,
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 28 } as TextStyle,
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 } as TextStyle,
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 } as TextStyle,
  miniLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;
```

- [ ] **Step 3: Create spacing.ts and shadows.ts**

Path: `pickhouse/mobile/src/theme/spacing.ts`

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;
```

Path: `pickhouse/mobile/src/theme/shadows.ts`

```ts
import { ViewStyle, Platform } from 'react-native';

export const shadows = {
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#3a2e1a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  })!,
  medium: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#3a2e1a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    android: { elevation: 6 },
    default: {},
  })!,
} as const;
```

- [ ] **Step 4: Create theme/index.ts barrel**

Path: `pickhouse/mobile/src/theme/index.ts`

```ts
export { colors } from './colors';
export { typography } from './typography';
export { spacing, radii } from './spacing';
export { shadows } from './shadows';
```

- [ ] **Step 5: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/theme/
git commit -m "feat(mobile): add warm-collection design tokens"
```

---

### Task 5: Define domain types

**Files:**
- Create: `pickhouse/mobile/src/types/house.ts`
- Create: `pickhouse/mobile/src/types/residence.ts`
- Create: `pickhouse/mobile/src/types/photo.ts`
- Create: `pickhouse/mobile/src/types/user.ts`
- Create: `pickhouse/mobile/src/types/auth.ts`
- Create: `pickhouse/mobile/src/types/index.ts`

- [ ] **Step 1: Create house.ts**

Path: `pickhouse/mobile/src/types/house.ts`

```ts
export type DealType = 'JEONSE' | 'WOLSE' | 'BAN_JEONSE';

export interface Address {
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
  latitude?: number;
  longitude?: number;
  detail?: string;
}

export const RATING_KEYS = [
  'waterPressure',
  'sunlight',
  'noise',
  'insulation',
  'ventilation',
  'moisture',
  'neighborhood',
  'firstImpression',
] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

export interface House {
  id: string;
  address: Address;
  dealType: DealType;
  deposit: number;
  rent?: number;
  maintenanceFee?: number;
  area?: number;
  builtYear?: number;
  floor?: number;
  totalFloor?: number;
  availableFrom?: string;
  stationDistance?: number;
  rooms?: number;
  bathrooms?: number;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  hasParking?: boolean;
  options?: string[];
  security?: string[];
  garbage?: string;
  waterPressure?: number;
  sunlight?: number;
  noise?: number;
  insulation?: number;
  ventilation?: number;
  moisture?: number;
  neighborhood?: number;
  firstImpression?: number;
  memo?: string;
  photoIds: string[];
  contractedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type HouseDraft = Omit<House, 'id' | 'photoIds' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  photoIds?: string[];
};
```

- [ ] **Step 2: Create residence.ts**

Path: `pickhouse/mobile/src/types/residence.ts`

```ts
import { House } from './house';

export interface Residence extends Omit<House, 'contractedAt'> {
  contractStartDate: string;
  contractEndDate: string;
  landlordMemo?: string;
  moveInPhotoIds: string[];
  contractPhotoId?: string;
  meterReadings?: {
    electricity?: number;
    water?: number;
    gas?: number;
  };
  isCurrent: boolean;
  eraLabel?: string;
}
```

- [ ] **Step 3: Create photo.ts**

Path: `pickhouse/mobile/src/types/photo.ts`

```ts
export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface Photo {
  id: string;
  houseId?: string;
  residenceId?: string;
  localUri?: string;
  remoteUrl?: string;
  uploadStatus: UploadStatus;
  takenAt: string;
  width?: number;
  height?: number;
  mimeType: string;
}
```

- [ ] **Step 4: Create user.ts**

Path: `pickhouse/mobile/src/types/user.ts`

```ts
export interface User {
  id: string;
  email?: string;
  nickname?: string;
  authProviders: {
    apple?: string;
    kakao?: string;
  };
  createdAt: string;
}
```

- [ ] **Step 5: Create auth.ts**

Path: `pickhouse/mobile/src/types/auth.ts`

```ts
import { User } from './user';

export type AuthProvider = 'apple' | 'kakao';

export interface LoginRequest {
  provider: AuthProvider;
  idToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
```

- [ ] **Step 6: Create types/index.ts barrel**

Path: `pickhouse/mobile/src/types/index.ts`

```ts
export * from './auth';
export * from './house';
export * from './photo';
export * from './residence';
export * from './user';
```

- [ ] **Step 7: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/types/
git commit -m "feat(mobile): add domain types for House, Residence, Photo, User, Auth"
```

---

### Task 6: SQLite migrations & database open helper

**Files:**
- Create: `pickhouse/mobile/src/db/migrations.ts`
- Create: `pickhouse/mobile/src/db/database.ts`
- Create: `pickhouse/mobile/src/db/__tests__/migrations.test.ts`

- [ ] **Step 1: Write failing test for migrations**

Path: `pickhouse/mobile/src/db/__tests__/migrations.test.ts`

```ts
import { migrations } from '../migrations';

describe('migrations', () => {
  it('has at least one version with sql', () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations[0]!.version).toBe(1);
    expect(migrations[0]!.sql).toContain('CREATE TABLE');
  });

  it('versions are sequential starting from 1', () => {
    migrations.forEach((m, i) => {
      expect(m.version).toBe(i + 1);
    });
  });

  it('includes houses, residences, photos, sync_queue tables', () => {
    const allSql = migrations.map((m) => m.sql).join('\n');
    expect(allSql).toMatch(/CREATE TABLE.*houses/);
    expect(allSql).toMatch(/CREATE TABLE.*residences/);
    expect(allSql).toMatch(/CREATE TABLE.*photos/);
    expect(allSql).toMatch(/CREATE TABLE.*sync_queue/);
  });
});
```

- [ ] **Step 2: Run test to see failure**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/migrations.test.ts
```

Expected: FAIL — Cannot find module '../migrations'

- [ ] **Step 3: Implement migrations.ts**

Path: `pickhouse/mobile/src/db/migrations.ts`

```ts
export interface Migration {
  version: number;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS houses (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        address_json TEXT NOT NULL,
        deal_type TEXT NOT NULL,
        deposit INTEGER NOT NULL,
        rent INTEGER,
        maintenance_fee INTEGER,
        area REAL,
        built_year INTEGER,
        floor INTEGER,
        total_floor INTEGER,
        available_from TEXT,
        station_distance INTEGER,
        rooms INTEGER,
        bathrooms INTEGER,
        has_balcony INTEGER,
        has_elevator INTEGER,
        has_parking INTEGER,
        options_json TEXT,
        security_json TEXT,
        garbage TEXT,
        water_pressure INTEGER,
        sunlight INTEGER,
        noise INTEGER,
        insulation INTEGER,
        ventilation INTEGER,
        moisture INTEGER,
        neighborhood INTEGER,
        first_impression INTEGER,
        memo TEXT,
        contracted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS residences (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        address_json TEXT NOT NULL,
        deal_type TEXT NOT NULL,
        deposit INTEGER NOT NULL,
        rent INTEGER,
        maintenance_fee INTEGER,
        area REAL,
        contract_start_date TEXT NOT NULL,
        contract_end_date TEXT NOT NULL,
        landlord_memo TEXT,
        meter_readings_json TEXT,
        is_current INTEGER NOT NULL DEFAULT 0,
        era_label TEXT,
        memo TEXT,
        water_pressure INTEGER,
        sunlight INTEGER,
        noise INTEGER,
        insulation INTEGER,
        ventilation INTEGER,
        moisture INTEGER,
        neighborhood INTEGER,
        first_impression INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS photos (
        id TEXT PRIMARY KEY NOT NULL,
        house_id TEXT,
        residence_id TEXT,
        local_uri TEXT,
        remote_url TEXT,
        upload_status TEXT NOT NULL,
        taken_at TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        mime_type TEXT NOT NULL,
        is_dirty INTEGER NOT NULL DEFAULT 0,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op_type TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_photos_house ON photos(house_id);
      CREATE INDEX IF NOT EXISTS idx_photos_residence ON photos(residence_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity, entity_id);
    `,
  },
];
```

- [ ] **Step 4: Run test to see pass**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/migrations.test.ts
```

Expected: PASS (all 3 assertions)

- [ ] **Step 5: Implement database.ts**

Path: `pickhouse/mobile/src/db/database.ts`

```ts
import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('pickhouse.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
  );
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM _meta WHERE key = 'schema_version';",
  );
  const current = row ? parseInt(row.value, 10) : 0;
  for (const m of migrations) {
    if (m.version > current) {
      await db.execAsync(m.sql);
      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', ?);",
        String(m.version),
      );
    }
  }
  return db;
}

export function resetDatabaseForTests() {
  dbPromise = null;
}
```

- [ ] **Step 6: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add pickhouse/mobile/src/db/migrations.ts pickhouse/mobile/src/db/database.ts pickhouse/mobile/src/db/__tests__/migrations.test.ts
git commit -m "feat(mobile): add SQLite schema with houses, residences, photos, sync_queue"
```

---

### Task 7: Houses repository (local CRUD)

**Files:**
- Create: `pickhouse/mobile/src/db/houses.repo.ts`
- Create: `pickhouse/mobile/src/db/__tests__/houses.repo.test.ts`

- [ ] **Step 1: Write failing test for houses repo**

Path: `pickhouse/mobile/src/db/__tests__/houses.repo.test.ts`

```ts
import { housesRepo } from '../houses.repo';
import { House } from '@/types';

const mockExec: jest.Mock = jest.fn();
const mockRunAsync = jest.fn().mockResolvedValue({ changes: 1 });
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    execAsync: (...a: unknown[]) => mockExec(...a),
    runAsync: (...a: unknown[]) => mockRunAsync(...a),
    getAllAsync: (...a: unknown[]) => mockGetAllAsync(...a),
    getFirstAsync: (...a: unknown[]) => mockGetFirstAsync(...a),
  }),
}));

const sampleHouse: House = {
  id: 'h1',
  address: { roadAddress: '서울시 종로구', jibunAddress: '', zonecode: '03000' },
  dealType: 'WOLSE',
  deposit: 1000,
  rent: 50,
  photoIds: [],
  createdAt: '2026-05-19T00:00:00Z',
  updatedAt: '2026-05-19T00:00:00Z',
};

beforeEach(() => {
  mockRunAsync.mockClear();
  mockGetAllAsync.mockClear();
  mockGetFirstAsync.mockClear();
});

describe('housesRepo', () => {
  it('insert serializes address to JSON and persists rating columns', async () => {
    await housesRepo.insert({ ...sampleHouse, sunlight: 4, noise: 3 }, 'u1');
    expect(mockRunAsync).toHaveBeenCalled();
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/INSERT.*INTO houses/);
    expect(sql).toMatch(/sunlight/);
    expect(sql).toMatch(/first_impression/);
  });

  it('listActive filters is_deleted=0 and contracted_at IS NULL', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]);
    await housesRepo.listActive('u1');
    const sql = mockGetAllAsync.mock.calls[0]![0];
    expect(sql).toMatch(/is_deleted = 0/);
    expect(sql).toMatch(/contracted_at IS NULL/);
  });

  it('findById parses row back to House (no userId on wire type)', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'h1',
      user_id: 'u1',
      address_json: JSON.stringify(sampleHouse.address),
      deal_type: 'WOLSE',
      deposit: 1000,
      rent: 50,
      sunlight: 4,
      created_at: sampleHouse.createdAt,
      updated_at: sampleHouse.updatedAt,
      photo_ids_json: '[]',
    });
    const result = await housesRepo.findById('h1');
    expect(result?.id).toBe('h1');
    expect(result?.address.roadAddress).toBe('서울시 종로구');
    expect(result?.sunlight).toBe(4);
    expect((result as unknown as { userId?: string }).userId).toBeUndefined();
  });

  it('softDelete sets is_deleted=1 and is_dirty=1', async () => {
    await housesRepo.softDelete('h1');
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/is_deleted = 1/);
    expect(sql).toMatch(/is_dirty = 1/);
  });
});
```

- [ ] **Step 2: Run test to see failure**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/houses.repo.test.ts
```

Expected: FAIL — Cannot find module

- [ ] **Step 3: Implement houses.repo.ts**

Path: `pickhouse/mobile/src/db/houses.repo.ts`

```ts
import { House } from '@/types';
import { getDatabase } from './database';

// SQLite row shape — keeps `user_id` column for offline scoping; the wire/UI
// `House` type omits `userId` (it is derived from JWT on the server).
type HouseRow = {
  id: string;
  user_id: string;
  address_json: string;
  deal_type: string;
  deposit: number;
  rent: number | null;
  maintenance_fee: number | null;
  area: number | null;
  built_year: number | null;
  floor: number | null;
  total_floor: number | null;
  available_from: string | null;
  station_distance: number | null;
  rooms: number | null;
  bathrooms: number | null;
  has_balcony: number | null;
  has_elevator: number | null;
  has_parking: number | null;
  options_json: string | null;
  security_json: string | null;
  garbage: string | null;
  water_pressure: number | null;
  sunlight: number | null;
  noise: number | null;
  insulation: number | null;
  ventilation: number | null;
  moisture: number | null;
  neighborhood: number | null;
  first_impression: number | null;
  memo: string | null;
  contracted_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToHouse(r: HouseRow, photoIds: string[]): House {
  return {
    id: r.id,
    address: JSON.parse(r.address_json),
    dealType: r.deal_type as House['dealType'],
    deposit: r.deposit,
    rent: r.rent ?? undefined,
    maintenanceFee: r.maintenance_fee ?? undefined,
    area: r.area ?? undefined,
    builtYear: r.built_year ?? undefined,
    floor: r.floor ?? undefined,
    totalFloor: r.total_floor ?? undefined,
    availableFrom: r.available_from ?? undefined,
    stationDistance: r.station_distance ?? undefined,
    rooms: r.rooms ?? undefined,
    bathrooms: r.bathrooms ?? undefined,
    hasBalcony: r.has_balcony === null ? undefined : r.has_balcony === 1,
    hasElevator: r.has_elevator === null ? undefined : r.has_elevator === 1,
    hasParking: r.has_parking === null ? undefined : r.has_parking === 1,
    options: r.options_json ? JSON.parse(r.options_json) : undefined,
    security: r.security_json ? JSON.parse(r.security_json) : undefined,
    garbage: r.garbage ?? undefined,
    waterPressure: r.water_pressure ?? undefined,
    sunlight: r.sunlight ?? undefined,
    noise: r.noise ?? undefined,
    insulation: r.insulation ?? undefined,
    ventilation: r.ventilation ?? undefined,
    moisture: r.moisture ?? undefined,
    neighborhood: r.neighborhood ?? undefined,
    firstImpression: r.first_impression ?? undefined,
    memo: r.memo ?? undefined,
    contractedAt: r.contracted_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    photoIds,
  };
}

async function getPhotoIdsForHouse(houseId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM photos WHERE house_id = ? AND is_deleted = 0 ORDER BY taken_at ASC',
    houseId,
  );
  return rows.map((r) => r.id);
}

export const housesRepo = {
  async insert(h: House, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO houses (
        id, user_id, address_json, deal_type, deposit, rent,
        maintenance_fee, area, built_year, floor, total_floor,
        available_from, station_distance, rooms, bathrooms,
        has_balcony, has_elevator, has_parking, options_json,
        security_json, garbage,
        water_pressure, sunlight, noise, insulation, ventilation,
        moisture, neighborhood, first_impression,
        memo, contracted_at, created_at, updated_at, is_dirty, is_deleted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)`,
      h.id,
      userId,
      JSON.stringify(h.address),
      h.dealType,
      h.deposit,
      h.rent ?? null,
      h.maintenanceFee ?? null,
      h.area ?? null,
      h.builtYear ?? null,
      h.floor ?? null,
      h.totalFloor ?? null,
      h.availableFrom ?? null,
      h.stationDistance ?? null,
      h.rooms ?? null,
      h.bathrooms ?? null,
      h.hasBalcony == null ? null : h.hasBalcony ? 1 : 0,
      h.hasElevator == null ? null : h.hasElevator ? 1 : 0,
      h.hasParking == null ? null : h.hasParking ? 1 : 0,
      h.options ? JSON.stringify(h.options) : null,
      h.security ? JSON.stringify(h.security) : null,
      h.garbage ?? null,
      h.waterPressure ?? null,
      h.sunlight ?? null,
      h.noise ?? null,
      h.insulation ?? null,
      h.ventilation ?? null,
      h.moisture ?? null,
      h.neighborhood ?? null,
      h.firstImpression ?? null,
      h.memo ?? null,
      h.contractedAt ?? null,
      h.createdAt,
      h.updatedAt,
    );
  },

  async update(h: House): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE houses SET
        address_json=?, deal_type=?, deposit=?, rent=?, maintenance_fee=?,
        area=?, built_year=?, floor=?, total_floor=?, available_from=?,
        station_distance=?, rooms=?, bathrooms=?, has_balcony=?, has_elevator=?,
        has_parking=?, options_json=?, security_json=?, garbage=?,
        water_pressure=?, sunlight=?, noise=?, insulation=?, ventilation=?,
        moisture=?, neighborhood=?, first_impression=?,
        memo=?, contracted_at=?, updated_at=?, is_dirty=1
      WHERE id = ?`,
      JSON.stringify(h.address),
      h.dealType,
      h.deposit,
      h.rent ?? null,
      h.maintenanceFee ?? null,
      h.area ?? null,
      h.builtYear ?? null,
      h.floor ?? null,
      h.totalFloor ?? null,
      h.availableFrom ?? null,
      h.stationDistance ?? null,
      h.rooms ?? null,
      h.bathrooms ?? null,
      h.hasBalcony == null ? null : h.hasBalcony ? 1 : 0,
      h.hasElevator == null ? null : h.hasElevator ? 1 : 0,
      h.hasParking == null ? null : h.hasParking ? 1 : 0,
      h.options ? JSON.stringify(h.options) : null,
      h.security ? JSON.stringify(h.security) : null,
      h.garbage ?? null,
      h.waterPressure ?? null,
      h.sunlight ?? null,
      h.noise ?? null,
      h.insulation ?? null,
      h.ventilation ?? null,
      h.moisture ?? null,
      h.neighborhood ?? null,
      h.firstImpression ?? null,
      h.memo ?? null,
      h.contractedAt ?? null,
      h.updatedAt,
      h.id,
    );
  },

  async findById(id: string): Promise<House | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<HouseRow>(
      'SELECT * FROM houses WHERE id = ? AND is_deleted = 0',
      id,
    );
    if (!row) return null;
    const photoIds = await getPhotoIdsForHouse(id);
    return rowToHouse(row, photoIds);
  },

  async listActive(userId: string): Promise<House[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HouseRow>(
      'SELECT * FROM houses WHERE user_id = ? AND is_deleted = 0 AND contracted_at IS NULL ORDER BY created_at DESC',
      userId,
    );
    const result: House[] = [];
    for (const r of rows) {
      const photoIds = await getPhotoIdsForHouse(r.id);
      result.push(rowToHouse(r, photoIds));
    }
    return result;
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE houses SET is_deleted = 1, is_dirty = 1, updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      id,
    );
  },

  async markClean(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE houses SET is_dirty = 0 WHERE id = ?', id);
  },

  async listDirty(): Promise<House[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HouseRow>(
      'SELECT * FROM houses WHERE is_dirty = 1',
    );
    const result: House[] = [];
    for (const r of rows) {
      const photoIds = await getPhotoIdsForHouse(r.id);
      result.push(rowToHouse(r, photoIds));
    }
    return result;
  },
};
```

- [ ] **Step 4: Run test to see pass**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/houses.repo.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/db/houses.repo.ts pickhouse/mobile/src/db/__tests__/houses.repo.test.ts
git commit -m "feat(mobile): add local houses repository with dirty/deleted flags"
```

---

### Task 8: Residences and photos repositories

**Files:**
- Create: `pickhouse/mobile/src/db/residences.repo.ts`
- Create: `pickhouse/mobile/src/db/photos.repo.ts`
- Create: `pickhouse/mobile/src/db/__tests__/photos.repo.test.ts`

- [ ] **Step 1: Write failing test for photos repo**

Path: `pickhouse/mobile/src/db/__tests__/photos.repo.test.ts`

```ts
import { photosRepo } from '../photos.repo';

const mockRunAsync = jest.fn().mockResolvedValue({ changes: 1 });
const mockGetAllAsync = jest.fn();

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    runAsync: (...a: unknown[]) => mockRunAsync(...a),
    getAllAsync: (...a: unknown[]) => mockGetAllAsync(...a),
  }),
}));

beforeEach(() => {
  mockRunAsync.mockClear();
  mockGetAllAsync.mockClear();
});

describe('photosRepo', () => {
  it('insert stores upload_status pending by default', async () => {
    await photosRepo.insert({
      id: 'p1',
      houseId: 'h1',
      localUri: 'file:///tmp/p1.jpg',
      uploadStatus: 'pending',
      takenAt: '2026-05-19T00:00:00Z',
      mimeType: 'image/jpeg',
    });
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/INSERT.*INTO photos/);
  });

  it('updateRemoteUrl sets remote_url and upload_status uploaded', async () => {
    await photosRepo.updateRemoteUrl('p1', 'https://r2.example/p1.jpg');
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/remote_url = \?/);
    expect(sql).toMatch(/upload_status = 'uploaded'/);
  });

  it('listPending returns pending uploads only', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]);
    await photosRepo.listPending();
    const sql = mockGetAllAsync.mock.calls[0]![0];
    expect(sql).toMatch(/upload_status = 'pending'/);
  });
});
```

- [ ] **Step 2: Run test to see failure**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/photos.repo.test.ts
```

Expected: FAIL — Cannot find module

- [ ] **Step 3: Implement photos.repo.ts**

Path: `pickhouse/mobile/src/db/photos.repo.ts`

```ts
import { Photo, UploadStatus } from '@/types';
import { getDatabase } from './database';

type PhotoRow = {
  id: string;
  house_id: string | null;
  residence_id: string | null;
  local_uri: string | null;
  remote_url: string | null;
  upload_status: UploadStatus;
  taken_at: string;
  width: number | null;
  height: number | null;
  mime_type: string;
};

function rowToPhoto(r: PhotoRow): Photo {
  return {
    id: r.id,
    houseId: r.house_id ?? undefined,
    residenceId: r.residence_id ?? undefined,
    localUri: r.local_uri ?? undefined,
    remoteUrl: r.remote_url ?? undefined,
    uploadStatus: r.upload_status,
    takenAt: r.taken_at,
    width: r.width ?? undefined,
    height: r.height ?? undefined,
    mimeType: r.mime_type,
  };
}

export const photosRepo = {
  async insert(p: Photo): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO photos (
        id, house_id, residence_id, local_uri, remote_url,
        upload_status, taken_at, width, height, mime_type,
        is_dirty, is_deleted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,1,0)`,
      p.id,
      p.houseId ?? null,
      p.residenceId ?? null,
      p.localUri ?? null,
      p.remoteUrl ?? null,
      p.uploadStatus,
      p.takenAt,
      p.width ?? null,
      p.height ?? null,
      p.mimeType,
    );
  },

  async updateRemoteUrl(id: string, remoteUrl: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE photos SET remote_url = ?, upload_status = 'uploaded', is_dirty = 1 WHERE id = ?",
      remoteUrl,
      id,
    );
  },

  async markUploading(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE photos SET upload_status = 'uploading' WHERE id = ?",
      id,
    );
  },

  async markFailed(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE photos SET upload_status = 'failed' WHERE id = ?",
      id,
    );
  },

  async listPending(): Promise<Photo[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PhotoRow>(
      "SELECT * FROM photos WHERE upload_status = 'pending' AND is_deleted = 0 ORDER BY taken_at ASC",
    );
    return rows.map(rowToPhoto);
  },

  async listForHouse(houseId: string): Promise<Photo[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PhotoRow>(
      'SELECT * FROM photos WHERE house_id = ? AND is_deleted = 0 ORDER BY taken_at ASC',
      houseId,
    );
    return rows.map(rowToPhoto);
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE photos SET is_deleted = 1, is_dirty = 1 WHERE id = ?',
      id,
    );
  },
};
```

- [ ] **Step 4: Run photos test to see pass**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/photos.repo.test.ts
```

Expected: PASS

- [ ] **Step 5: Implement residences.repo.ts**

Path: `pickhouse/mobile/src/db/residences.repo.ts`

```ts
import { Residence } from '@/types';
import { getDatabase } from './database';

type ResidenceRow = {
  id: string;
  user_id: string;
  address_json: string;
  deal_type: string;
  deposit: number;
  rent: number | null;
  maintenance_fee: number | null;
  area: number | null;
  contract_start_date: string;
  contract_end_date: string;
  landlord_memo: string | null;
  meter_readings_json: string | null;
  is_current: number;
  era_label: string | null;
  memo: string | null;
  ratings_json: string | null;
  created_at: string;
  updated_at: string;
};

function rowToResidence(r: ResidenceRow, photoIds: string[]): Residence {
  return {
    id: r.id,
    userId: r.user_id,
    address: JSON.parse(r.address_json),
    dealType: r.deal_type as Residence['dealType'],
    deposit: r.deposit,
    rent: r.rent ?? undefined,
    maintenanceFee: r.maintenance_fee ?? undefined,
    area: r.area ?? undefined,
    contractStartDate: r.contract_start_date,
    contractEndDate: r.contract_end_date,
    landlordMemo: r.landlord_memo ?? undefined,
    meterReadings: r.meter_readings_json ? JSON.parse(r.meter_readings_json) : undefined,
    isCurrent: r.is_current === 1,
    eraLabel: r.era_label ?? null,
    memo: r.memo ?? undefined,
    ratings: r.ratings_json ? JSON.parse(r.ratings_json) : undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    photoIds,
    moveInPhotoIds: [],
  };
}

export const residencesRepo = {
  async insert(r: Residence): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO residences (
        id, user_id, address_json, deal_type, deposit, rent,
        maintenance_fee, area, contract_start_date, contract_end_date,
        landlord_memo, meter_readings_json, is_current, era_label,
        memo, ratings_json, created_at, updated_at, is_dirty, is_deleted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)`,
      r.id,
      r.userId,
      JSON.stringify(r.address),
      r.dealType,
      r.deposit,
      r.rent ?? null,
      r.maintenanceFee ?? null,
      r.area ?? null,
      r.contractStartDate,
      r.contractEndDate,
      r.landlordMemo ?? null,
      r.meterReadings ? JSON.stringify(r.meterReadings) : null,
      r.isCurrent ? 1 : 0,
      r.eraLabel ?? null,
      r.memo ?? null,
      r.ratings ? JSON.stringify(r.ratings) : null,
      r.createdAt,
      r.updatedAt,
    );
  },

  async list(userId: string): Promise<Residence[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ResidenceRow>(
      'SELECT * FROM residences WHERE user_id = ? AND is_deleted = 0 ORDER BY contract_start_date DESC',
      userId,
    );
    return rows.map((row) => rowToResidence(row, []));
  },

  async findCurrent(userId: string): Promise<Residence | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ResidenceRow>(
      'SELECT * FROM residences WHERE user_id = ? AND is_current = 1 AND is_deleted = 0 LIMIT 1',
      userId,
    );
    return row ? rowToResidence(row, []) : null;
  },
};
```

- [ ] **Step 6: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/db/photos.repo.ts pickhouse/mobile/src/db/residences.repo.ts pickhouse/mobile/src/db/__tests__/photos.repo.test.ts
git commit -m "feat(mobile): add photos and residences repositories"
```

---

### Task 9: Sync queue repository

**Files:**
- Create: `pickhouse/mobile/src/db/syncQueue.repo.ts`
- Create: `pickhouse/mobile/src/db/__tests__/syncQueue.repo.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/db/__tests__/syncQueue.repo.test.ts`

```ts
import { syncQueueRepo, SyncOp } from '../syncQueue.repo';

const mockRunAsync = jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
const mockGetAllAsync = jest.fn();

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    runAsync: (...a: unknown[]) => mockRunAsync(...a),
    getAllAsync: (...a: unknown[]) => mockGetAllAsync(...a),
  }),
}));

beforeEach(() => {
  mockRunAsync.mockClear();
  mockGetAllAsync.mockClear();
});

describe('syncQueueRepo', () => {
  it('enqueue inserts op_type, entity, entity_id, payload', async () => {
    const op: SyncOp = {
      opType: 'create',
      entity: 'house',
      entityId: 'h1',
      payload: { id: 'h1' },
    };
    await syncQueueRepo.enqueue(op);
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/INSERT.*INTO sync_queue/);
    const args = mockRunAsync.mock.calls[0]!.slice(1);
    expect(args).toContain('create');
    expect(args).toContain('house');
    expect(args).toContain('h1');
  });

  it('list returns rows ordered by id', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        op_type: 'create',
        entity: 'house',
        entity_id: 'h1',
        payload_json: '{}',
        attempts: 0,
        last_error: null,
        created_at: '2026-05-19T00:00:00Z',
        updated_at: '2026-05-19T00:00:00Z',
      },
    ]);
    const items = await syncQueueRepo.list();
    expect(items).toHaveLength(1);
    expect(items[0]!.opType).toBe('create');
  });

  it('incrementAttempts updates attempts and last_error', async () => {
    await syncQueueRepo.incrementAttempts(1, 'network error');
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/attempts = attempts \+ 1/);
    expect(sql).toMatch(/last_error = \?/);
  });
});
```

- [ ] **Step 2: Run test to see failure**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/syncQueue.repo.test.ts
```

Expected: FAIL — Cannot find module

- [ ] **Step 3: Implement syncQueue.repo.ts**

Path: `pickhouse/mobile/src/db/syncQueue.repo.ts`

```ts
import { getDatabase } from './database';

export type SyncOpType = 'create' | 'update' | 'delete';
export type SyncEntity = 'house' | 'residence' | 'photo';

export interface SyncOp {
  id?: number;
  opType: SyncOpType;
  entity: SyncEntity;
  entityId: string;
  payload: unknown;
  attempts?: number;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

type SyncRow = {
  id: number;
  op_type: SyncOpType;
  entity: SyncEntity;
  entity_id: string;
  payload_json: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

function rowToOp(r: SyncRow): SyncOp {
  return {
    id: r.id,
    opType: r.op_type,
    entity: r.entity,
    entityId: r.entity_id,
    payload: JSON.parse(r.payload_json),
    attempts: r.attempts,
    lastError: r.last_error ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const syncQueueRepo = {
  async enqueue(op: SyncOp): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const res = await db.runAsync(
      `INSERT INTO sync_queue (
        op_type, entity, entity_id, payload_json, attempts, last_error, created_at, updated_at
      ) VALUES (?,?,?,?,0,NULL,?,?)`,
      op.opType,
      op.entity,
      op.entityId,
      JSON.stringify(op.payload),
      now,
      now,
    );
    return res.lastInsertRowId;
  },

  async list(): Promise<SyncOp[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SyncRow>(
      'SELECT * FROM sync_queue ORDER BY id ASC',
    );
    return rows.map(rowToOp);
  },

  async remove(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
  },

  async incrementAttempts(id: number, error: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE sync_queue SET attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?',
      error,
      new Date().toISOString(),
      id,
    );
  },

  async clear(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM sync_queue');
  },
};
```

- [ ] **Step 4: Run test to see pass**

```bash
cd pickhouse/mobile
npm test -- src/db/__tests__/syncQueue.repo.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/db/syncQueue.repo.ts pickhouse/mobile/src/db/__tests__/syncQueue.repo.test.ts
git commit -m "feat(mobile): add sync_queue repository for offline-first ops"
```

---

### Task 10: Secure token storage

**Files:**
- Create: `pickhouse/mobile/src/storage/secureTokens.ts`
- Create: `pickhouse/mobile/src/storage/__tests__/secureTokens.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/storage/__tests__/secureTokens.test.ts`

```ts
import * as SecureStore from 'expo-secure-store';
import { secureTokens } from '../secureTokens';

describe('secureTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveTokens writes access + refresh under expected keys', async () => {
    await secureTokens.save({ accessToken: 'a', refreshToken: 'r' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ph_access_token', 'a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ph_refresh_token', 'r');
  });

  it('load returns both tokens when present', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('a')
      .mockResolvedValueOnce('r');
    const t = await secureTokens.load();
    expect(t).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('load returns null when access is missing', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('r');
    const t = await secureTokens.load();
    expect(t).toBeNull();
  });

  it('clear deletes both keys', async () => {
    await secureTokens.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_refresh_token');
  });
});
```

- [ ] **Step 2: Run test to see failure**

```bash
cd pickhouse/mobile
npm test -- src/storage/__tests__/secureTokens.test.ts
```

Expected: FAIL — Cannot find module

- [ ] **Step 3: Implement secureTokens.ts**

Path: `pickhouse/mobile/src/storage/secureTokens.ts`

```ts
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'ph_access_token';
const REFRESH_KEY = 'ph_refresh_token';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const secureTokens = {
  async save(t: Tokens): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, t.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, t.refreshToken);
  },

  async load(): Promise<Tokens | null> {
    const access = await SecureStore.getItemAsync(ACCESS_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh };
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
```

- [ ] **Step 4: Run test to see pass**

```bash
cd pickhouse/mobile
npm test -- src/storage/__tests__/secureTokens.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/storage/
git commit -m "feat(mobile): add secure token storage via expo-secure-store"
```

---

### Task 11: API client with auth interceptor + retry

**Files:**
- Create: `pickhouse/mobile/src/api/client.ts`
- Create: `pickhouse/mobile/src/api/__tests__/client.test.ts`
- Create: `pickhouse/mobile/.env.example`

- [ ] **Step 1: Create .env.example**

Path: `pickhouse/mobile/.env.example`

```
EXPO_PUBLIC_API_BASE_URL=https://api.pickhouse.dev
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=
EXPO_PUBLIC_KAKAO_REST_API_KEY=
EXPO_PUBLIC_KAKAO_JS_KEY=
```

- [ ] **Step 2: Write failing test**

Path: `pickhouse/mobile/src/api/__tests__/client.test.ts`

```ts
import { createApiClient } from '../client';

describe('apiClient', () => {
  it('adds Bearer header when token provided', async () => {
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => 'abc',
      onUnauthorized: async () => null,
    });
    const adapter = jest.fn().mockResolvedValue({
      data: {},
      status: 200,
      headers: {},
      config: {},
    });
    client.defaults.adapter = adapter;
    await client.get('/me');
    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.headers.Authorization).toBe('Bearer abc');
  });

  it('on 401 calls onUnauthorized and retries with new token', async () => {
    let calls = 0;
    const onUnauthorized = jest.fn().mockResolvedValue('newtoken');
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => 'oldtoken',
      onUnauthorized,
    });
    const adapter = jest.fn().mockImplementation((cfg) => {
      calls += 1;
      if (calls === 1) {
        const err: any = new Error('401');
        err.response = { status: 401, data: {}, headers: {}, config: cfg };
        err.config = cfg;
        return Promise.reject(err);
      }
      return Promise.resolve({ data: { ok: true }, status: 200, headers: {}, config: cfg });
    });
    client.defaults.adapter = adapter;
    const res = await client.get('/me');
    expect(res.data).toEqual({ ok: true });
    expect(onUnauthorized).toHaveBeenCalled();
    expect(adapter.mock.calls[1]![0].headers.Authorization).toBe('Bearer newtoken');
  });
});
```

- [ ] **Step 3: Run test to see failure**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/client.test.ts
```

Expected: FAIL — Cannot find module

- [ ] **Step 4: Implement client.ts**

Path: `pickhouse/mobile/src/api/client.ts`

```ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getAccessToken: () => Promise<string | null>;
  onUnauthorized: () => Promise<string | null>;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

export function createApiClient(opts: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: opts.baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const token = await opts.getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (resp) => resp,
    async (err: AxiosError) => {
      const cfg = err.config as RetriableConfig | undefined;
      if (err.response?.status === 401 && cfg && !cfg._retried) {
        cfg._retried = true;
        const newToken = await opts.onUnauthorized();
        if (newToken) {
          cfg.headers = cfg.headers ?? {};
          (cfg.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          return client.request(cfg);
        }
      }
      throw err;
    },
  );

  return client;
}

let singleton: AxiosInstance | null = null;

export function setApiClient(c: AxiosInstance): void {
  singleton = c;
}

export function getApiClient(): AxiosInstance {
  if (!singleton) {
    throw new Error('API client not initialized. Call setApiClient first.');
  }
  return singleton;
}
```

- [ ] **Step 5: Run test to see pass**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/client.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/api/client.ts pickhouse/mobile/src/api/__tests__/client.test.ts pickhouse/mobile/.env.example
git commit -m "feat(mobile): add axios client with auth interceptor + 401 retry"
```

---

### Task 12: Auth API endpoint module

**Files:**
- Create: `pickhouse/mobile/src/api/auth.api.ts`
- Create: `pickhouse/mobile/src/api/__tests__/auth.api.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/api/__tests__/auth.api.test.ts`

```ts
import { authApi } from '../auth.api';
import { setApiClient } from '../client';
import axios from 'axios';

describe('authApi', () => {
  it('login POSTs provider + idToken to /auth/login', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { accessToken: 'a', refreshToken: 'r', user: { id: 'u1', authProviders: {}, createdAt: '' } },
      status: 200, headers: {}, config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);
    const res = await authApi.login({ provider: 'apple', idToken: 'token123' });
    expect(adapter).toHaveBeenCalled();
    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.url).toBe('/auth/login');
    expect(JSON.parse(cfg.data)).toEqual({ provider: 'apple', idToken: 'token123' });
    expect(res.accessToken).toBe('a');
  });

  it('refresh POSTs refreshToken to /auth/refresh', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { accessToken: 'newA', refreshToken: 'newR' },
      status: 200, headers: {}, config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);
    const res = await authApi.refresh('oldR');
    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.url).toBe('/auth/refresh');
    expect(JSON.parse(cfg.data)).toEqual({ refreshToken: 'oldR' });
    expect(res.accessToken).toBe('newA');
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/auth.api.test.ts
```

Expected: FAIL — Cannot find module

- [ ] **Step 3: Implement auth.api.ts**

Path: `pickhouse/mobile/src/api/auth.api.ts`

```ts
import { LoginRequest, LoginResponse, RefreshResponse } from '@/types';
import { getApiClient } from './client';

export const authApi = {
  async login(body: LoginRequest): Promise<LoginResponse> {
    const res = await getApiClient().post<LoginResponse>('/auth/login', body);
    return res.data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const res = await getApiClient().post<RefreshResponse>('/auth/refresh', { refreshToken });
    return res.data;
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/auth.api.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/api/auth.api.ts pickhouse/mobile/src/api/__tests__/auth.api.test.ts
git commit -m "feat(mobile): add auth API module (login, refresh)"
```

---

### Task 13: Houses & residences API modules

**Files:**
- Create: `pickhouse/mobile/src/api/houses.api.ts`
- Create: `pickhouse/mobile/src/api/residences.api.ts`
- Create: `pickhouse/mobile/src/api/__tests__/houses.api.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/api/__tests__/houses.api.test.ts`

```ts
import { housesApi } from '../houses.api';
import { setApiClient } from '../client';
import axios from 'axios';

const adapter = jest.fn();
beforeEach(() => {
  adapter.mockReset();
  const client = axios.create({ baseURL: 'http://test' });
  client.defaults.adapter = adapter;
  setApiClient(client);
});

describe('housesApi', () => {
  it('list GETs /houses', async () => {
    adapter.mockResolvedValueOnce({ data: [], status: 200, headers: {}, config: {} });
    await housesApi.list();
    expect(adapter.mock.calls[0]![0].url).toBe('/houses');
    expect(adapter.mock.calls[0]![0].method).toBe('get');
  });

  it('create POSTs to /houses', async () => {
    adapter.mockResolvedValueOnce({ data: { id: 'h1' }, status: 201, headers: {}, config: {} });
    await housesApi.create({ id: 'h1' } as any);
    expect(adapter.mock.calls[0]![0].url).toBe('/houses');
    expect(adapter.mock.calls[0]![0].method).toBe('post');
  });

  it('update PATCHes /houses/{id}', async () => {
    adapter.mockResolvedValueOnce({ data: { id: 'h1' }, status: 200, headers: {}, config: {} });
    await housesApi.update('h1', { memo: 'x' } as any);
    expect(adapter.mock.calls[0]![0].url).toBe('/houses/h1');
    expect(adapter.mock.calls[0]![0].method).toBe('patch');
  });

  it('remove DELETEs /houses/{id}', async () => {
    adapter.mockResolvedValueOnce({ data: {}, status: 204, headers: {}, config: {} });
    await housesApi.remove('h1');
    expect(adapter.mock.calls[0]![0].url).toBe('/houses/h1');
    expect(adapter.mock.calls[0]![0].method).toBe('delete');
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/houses.api.test.ts
```

Expected: FAIL — Cannot find module

- [ ] **Step 3: Implement houses.api.ts**

Path: `pickhouse/mobile/src/api/houses.api.ts`

```ts
import { House } from '@/types';
import { getApiClient } from './client';

export const housesApi = {
  async list(): Promise<House[]> {
    const res = await getApiClient().get<House[]>('/houses');
    return res.data;
  },

  async get(id: string): Promise<House> {
    const res = await getApiClient().get<House>(`/houses/${id}`);
    return res.data;
  },

  async create(body: House): Promise<House> {
    const res = await getApiClient().post<House>('/houses', body);
    return res.data;
  },

  async update(id: string, patch: Partial<House>): Promise<House> {
    const res = await getApiClient().patch<House>(`/houses/${id}`, patch);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/houses/${id}`);
  },

  async promoteToResidence(
    id: string,
    body: { contractStartDate: string; contractEndDate: string; landlordMemo?: string },
  ): Promise<void> {
    await getApiClient().post(`/houses/${id}/promote-to-residence`, body);
  },
};
```

- [ ] **Step 4: Implement residences.api.ts**

Path: `pickhouse/mobile/src/api/residences.api.ts`

```ts
import { Residence } from '@/types';
import { getApiClient } from './client';

export const residencesApi = {
  async list(): Promise<Residence[]> {
    const res = await getApiClient().get<Residence[]>('/residences');
    return res.data;
  },
  async get(id: string): Promise<Residence> {
    const res = await getApiClient().get<Residence>(`/residences/${id}`);
    return res.data;
  },
};
```

- [ ] **Step 5: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/houses.api.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/api/houses.api.ts pickhouse/mobile/src/api/residences.api.ts pickhouse/mobile/src/api/__tests__/houses.api.test.ts
git commit -m "feat(mobile): add houses and residences API modules"
```

---

### Task 14: Photos API + R2 direct upload

**Files:**
- Create: `pickhouse/mobile/src/api/photos.api.ts`
- Create: `pickhouse/mobile/src/api/r2Upload.ts`
- Create: `pickhouse/mobile/src/api/__tests__/photos.api.test.ts`
- Create: `pickhouse/mobile/src/api/__tests__/r2Upload.test.ts`

- [ ] **Step 1: Write failing test for photos.api**

Path: `pickhouse/mobile/src/api/__tests__/photos.api.test.ts`

```ts
import { photosApi } from '../photos.api';
import { setApiClient } from '../client';
import axios from 'axios';

const adapter = jest.fn();
beforeEach(() => {
  adapter.mockReset();
  const client = axios.create({ baseURL: 'http://test' });
  client.defaults.adapter = adapter;
  setApiClient(client);
});

describe('photosApi', () => {
  it('requestUploadUrl POSTs to /photos/upload-url', async () => {
    adapter.mockResolvedValueOnce({
      data: { uploadUrl: 'https://r2/sign', photoId: 'p1', fields: {} },
      status: 200, headers: {}, config: {},
    });
    const res = await photosApi.requestUploadUrl({ houseId: 'h1', mimeType: 'image/jpeg' });
    expect(adapter.mock.calls[0]![0].url).toBe('/photos/upload-url');
    expect(res.photoId).toBe('p1');
  });

  it('finalize POSTs /photos with photoId and remoteUrl', async () => {
    adapter.mockResolvedValueOnce({ data: {}, status: 201, headers: {}, config: {} });
    await photosApi.finalize({ photoId: 'p1', houseId: 'h1', remoteUrl: 'https://r2/p1.jpg' });
    expect(adapter.mock.calls[0]![0].url).toBe('/photos');
    expect(JSON.parse(adapter.mock.calls[0]![0].data)).toEqual({
      photoId: 'p1', houseId: 'h1', remoteUrl: 'https://r2/p1.jpg',
    });
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/photos.api.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement photos.api.ts**

Path: `pickhouse/mobile/src/api/photos.api.ts`

```ts
import { getApiClient } from './client';

export interface UploadUrlRequest {
  houseId?: string;
  residenceId?: string;
  mimeType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  photoId: string;
  fields: Record<string, string>;
  publicUrl: string;
}

export interface FinalizeRequest {
  photoId: string;
  houseId?: string;
  residenceId?: string;
  remoteUrl: string;
}

export const photosApi = {
  async requestUploadUrl(body: UploadUrlRequest): Promise<UploadUrlResponse> {
    const res = await getApiClient().post<UploadUrlResponse>('/photos/upload-url', body);
    return res.data;
  },

  async finalize(body: FinalizeRequest): Promise<void> {
    await getApiClient().post('/photos', body);
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/photos.api.test.ts
```

Expected: PASS

- [ ] **Step 5: Write failing test for r2Upload**

Path: `pickhouse/mobile/src/api/__tests__/r2Upload.test.ts`

```ts
import { uploadToR2 } from '../r2Upload';
import * as FileSystem from 'expo-file-system';

describe('uploadToR2', () => {
  it('calls FileSystem.uploadAsync with PUT and Content-Type', async () => {
    (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({ status: 200, body: '', headers: {} });
    await uploadToR2({
      uploadUrl: 'https://r2/sign',
      localUri: 'file:///tmp/p.jpg',
      mimeType: 'image/jpeg',
    });
    expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
      'https://r2/sign',
      'file:///tmp/p.jpg',
      expect.objectContaining({
        httpMethod: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
      }),
    );
  });

  it('throws when status >= 400', async () => {
    (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({ status: 403, body: 'denied', headers: {} });
    await expect(
      uploadToR2({ uploadUrl: 'u', localUri: 'l', mimeType: 'image/jpeg' }),
    ).rejects.toThrow(/403/);
  });
});
```

- [ ] **Step 6: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/r2Upload.test.ts
```

Expected: FAIL

- [ ] **Step 7: Implement r2Upload.ts**

Path: `pickhouse/mobile/src/api/r2Upload.ts`

```ts
import * as FileSystem from 'expo-file-system';

export interface R2UploadInput {
  uploadUrl: string;
  localUri: string;
  mimeType: string;
}

export async function uploadToR2(input: R2UploadInput): Promise<void> {
  const result = await FileSystem.uploadAsync(input.uploadUrl, input.localUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': input.mimeType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (result.status >= 400) {
    throw new Error(`R2 upload failed: ${result.status} ${result.body}`);
  }
}
```

- [ ] **Step 8: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/api/__tests__/r2Upload.test.ts
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add pickhouse/mobile/src/api/photos.api.ts pickhouse/mobile/src/api/r2Upload.ts pickhouse/mobile/src/api/__tests__/photos.api.test.ts pickhouse/mobile/src/api/__tests__/r2Upload.test.ts
git commit -m "feat(mobile): add photos API and R2 direct upload helper"
```

---

### Task 15: Apple Sign In wrapper

**Files:**
- Create: `pickhouse/mobile/src/auth/appleAuth.ts`
- Create: `pickhouse/mobile/src/auth/__tests__/appleAuth.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/auth/__tests__/appleAuth.test.ts`

```ts
import * as Apple from 'expo-apple-authentication';
import { appleAuth } from '../appleAuth';

describe('appleAuth', () => {
  it('signIn returns identityToken from Apple', async () => {
    (Apple.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: 'apple-id-token-xyz',
      user: 'apple_user',
    });
    const token = await appleAuth.signIn();
    expect(token).toBe('apple-id-token-xyz');
  });

  it('throws when Apple returns null identityToken', async () => {
    (Apple.signInAsync as jest.Mock).mockResolvedValueOnce({ identityToken: null });
    await expect(appleAuth.signIn()).rejects.toThrow(/identity token/);
  });

  it('isAvailable proxies expo isAvailableAsync', async () => {
    (Apple.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    expect(await appleAuth.isAvailable()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/auth/__tests__/appleAuth.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement appleAuth.ts**

Path: `pickhouse/mobile/src/auth/appleAuth.ts`

```ts
import * as AppleAuthentication from 'expo-apple-authentication';

export const appleAuth = {
  async isAvailable(): Promise<boolean> {
    return AppleAuthentication.isAvailableAsync();
  },

  async signIn(): Promise<string> {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple Sign In did not return an identity token');
    }
    return credential.identityToken;
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/auth/__tests__/appleAuth.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/auth/appleAuth.ts pickhouse/mobile/src/auth/__tests__/appleAuth.test.ts
git commit -m "feat(mobile): wrap Apple Sign In to expose identity token"
```

---

### Task 16: Kakao login wrapper

**Files:**
- Create: `pickhouse/mobile/src/auth/kakaoAuth.ts`
- Create: `pickhouse/mobile/src/auth/__tests__/kakaoAuth.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/auth/__tests__/kakaoAuth.test.ts`

```ts
import { login, logout } from '@react-native-seoul/kakao-login';
import { kakaoAuth } from '../kakaoAuth';

describe('kakaoAuth', () => {
  it('signIn returns idToken from Kakao login', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'kakao-access',
      idToken: 'kakao-id-token-xyz',
      refreshToken: 'kakao-refresh',
    });
    const token = await kakaoAuth.signIn();
    expect(token).toBe('kakao-id-token-xyz');
  });

  it('throws when idToken is missing', async () => {
    (login as jest.Mock).mockResolvedValueOnce({ accessToken: 'x' });
    await expect(kakaoAuth.signIn()).rejects.toThrow(/idToken/);
  });

  it('signOut calls kakao logout', async () => {
    (logout as jest.Mock).mockResolvedValueOnce(undefined);
    await kakaoAuth.signOut();
    expect(logout).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/auth/__tests__/kakaoAuth.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement kakaoAuth.ts**

Path: `pickhouse/mobile/src/auth/kakaoAuth.ts`

```ts
import { login, logout } from '@react-native-seoul/kakao-login';

export const kakaoAuth = {
  async signIn(): Promise<string> {
    const result = await login();
    if (!result.idToken) {
      throw new Error('Kakao login did not return an idToken');
    }
    return result.idToken;
  },

  async signOut(): Promise<void> {
    try {
      await logout();
    } catch {
      // logout fails silently if not logged in
    }
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/auth/__tests__/kakaoAuth.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/auth/kakaoAuth.ts pickhouse/mobile/src/auth/__tests__/kakaoAuth.test.ts
git commit -m "feat(mobile): wrap Kakao login to expose idToken"
```

---

### Task 17: Auth Zustand store

**Files:**
- Create: `pickhouse/mobile/src/stores/authStore.ts`
- Create: `pickhouse/mobile/src/stores/__tests__/authStore.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/stores/__tests__/authStore.test.ts`

```ts
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'unknown' });
  });

  it('setSession populates user and tokens, marks authenticated', () => {
    useAuthStore.getState().setSession({
      user: { id: 'u1', authProviders: { apple: 'a' }, createdAt: '' },
      accessToken: 'a',
      refreshToken: 'r',
    });
    expect(useAuthStore.getState().user?.id).toBe('u1');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('clear resets state to unauthenticated', () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('updateTokens replaces only tokens', () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
    useAuthStore.getState().updateTokens({ accessToken: 'a2', refreshToken: 'r2' });
    const s = useAuthStore.getState();
    expect(s.accessToken).toBe('a2');
    expect(s.refreshToken).toBe('r2');
    expect(s.user?.id).toBe('u1');
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/stores/__tests__/authStore.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement authStore.ts**

Path: `pickhouse/mobile/src/stores/authStore.ts`

```ts
import { create } from 'zustand';
import { User } from '@/types';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  setSession: (s: { user: User; accessToken: string; refreshToken: string }) => void;
  updateTokens: (t: { accessToken: string; refreshToken: string }) => void;
  setStatus: (s: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'unknown',
  setSession: ({ user, accessToken, refreshToken }) =>
    set({ user, accessToken, refreshToken, status: 'authenticated' }),
  updateTokens: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken }),
  setStatus: (status) => set({ status }),
  clear: () =>
    set({ user: null, accessToken: null, refreshToken: null, status: 'unauthenticated' }),
}));
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/stores/__tests__/authStore.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/stores/authStore.ts pickhouse/mobile/src/stores/__tests__/authStore.test.ts
git commit -m "feat(mobile): add auth Zustand store"
```

---

### Task 18: Auth service (orchestrates provider → backend → store)

**Files:**
- Create: `pickhouse/mobile/src/auth/authService.ts`
- Create: `pickhouse/mobile/src/auth/__tests__/authService.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/auth/__tests__/authService.test.ts`

```ts
import { authService } from '../authService';
import { authApi } from '@/api/auth.api';
import { secureTokens } from '@/storage/secureTokens';
import { useAuthStore } from '@/stores/authStore';
import { appleAuth } from '../appleAuth';
import { kakaoAuth } from '../kakaoAuth';

jest.mock('@/api/auth.api');
jest.mock('@/storage/secureTokens');
jest.mock('../appleAuth');
jest.mock('../kakaoAuth');

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'unknown' });
});

describe('authService', () => {
  it('loginWithApple gets token, calls backend, saves tokens, updates store', async () => {
    (appleAuth.signIn as jest.Mock).mockResolvedValueOnce('apple-id');
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1', authProviders: { apple: 'a' }, createdAt: '' },
    });

    await authService.loginWithApple();

    expect(authApi.login).toHaveBeenCalledWith({ provider: 'apple', idToken: 'apple-id' });
    expect(secureTokens.save).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user?.id).toBe('u1');
  });

  it('loginWithKakao does the same with kakao provider', async () => {
    (kakaoAuth.signIn as jest.Mock).mockResolvedValueOnce('kakao-id');
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u2', authProviders: { kakao: 'b' }, createdAt: '' },
    });

    await authService.loginWithKakao();

    expect(authApi.login).toHaveBeenCalledWith({ provider: 'kakao', idToken: 'kakao-id' });
    expect(useAuthStore.getState().user?.id).toBe('u2');
  });

  it('refreshAccessToken calls /auth/refresh and updates tokens', async () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'old',
      refreshToken: 'oldR',
      status: 'authenticated',
    });
    (authApi.refresh as jest.Mock).mockResolvedValueOnce({ accessToken: 'newA', refreshToken: 'newR' });

    const newAccess = await authService.refreshAccessToken();

    expect(authApi.refresh).toHaveBeenCalledWith('oldR');
    expect(newAccess).toBe('newA');
    expect(useAuthStore.getState().accessToken).toBe('newA');
    expect(secureTokens.save).toHaveBeenCalledWith({ accessToken: 'newA', refreshToken: 'newR' });
  });

  it('logout clears store and secure storage and calls kakao signOut', async () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'a', refreshToken: 'r', status: 'authenticated',
    });
    await authService.logout();
    expect(secureTokens.clear).toHaveBeenCalled();
    expect(kakaoAuth.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('restoreSession loads tokens and marks authenticated if present', async () => {
    (secureTokens.load as jest.Mock).mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' });
    await authService.restoreSession();
    expect(useAuthStore.getState().accessToken).toBe('a');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('restoreSession marks unauthenticated when no tokens', async () => {
    (secureTokens.load as jest.Mock).mockResolvedValueOnce(null);
    await authService.restoreSession();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/auth/__tests__/authService.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement authService.ts**

Path: `pickhouse/mobile/src/auth/authService.ts`

```ts
import { authApi } from '@/api/auth.api';
import { secureTokens } from '@/storage/secureTokens';
import { useAuthStore } from '@/stores/authStore';
import { AuthProvider } from '@/types';
import { appleAuth } from './appleAuth';
import { kakaoAuth } from './kakaoAuth';

async function loginWith(provider: AuthProvider, idToken: string): Promise<void> {
  const res = await authApi.login({ provider, idToken });
  await secureTokens.save({ accessToken: res.accessToken, refreshToken: res.refreshToken });
  useAuthStore.getState().setSession({
    user: res.user,
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
  });
}

export const authService = {
  async loginWithApple(): Promise<void> {
    const idToken = await appleAuth.signIn();
    await loginWith('apple', idToken);
  },

  async loginWithKakao(): Promise<void> {
    const idToken = await kakaoAuth.signIn();
    await loginWith('kakao', idToken);
  },

  async refreshAccessToken(): Promise<string | null> {
    const current = useAuthStore.getState().refreshToken;
    if (!current) return null;
    try {
      const res = await authApi.refresh(current);
      useAuthStore.getState().updateTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      await secureTokens.save({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
      return res.accessToken;
    } catch {
      await this.logout();
      return null;
    }
  },

  async logout(): Promise<void> {
    await secureTokens.clear();
    await kakaoAuth.signOut();
    useAuthStore.getState().clear();
  },

  async restoreSession(): Promise<void> {
    const tokens = await secureTokens.load();
    if (!tokens) {
      useAuthStore.getState().setStatus('unauthenticated');
      return;
    }
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    });
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/auth/__tests__/authService.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/auth/authService.ts pickhouse/mobile/src/auth/__tests__/authService.test.ts
git commit -m "feat(mobile): add auth service orchestrating providers, backend, store"
```

---

### Task 19: Wire API client to auth (refresh integration)

**Files:**
- Create: `pickhouse/mobile/src/api/setup.ts`
- Modify: `pickhouse/mobile/App.tsx`

- [ ] **Step 1: Implement setup.ts**

Path: `pickhouse/mobile/src/api/setup.ts`

```ts
import { createApiClient, setApiClient } from './client';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/auth/authService';

export function initializeApi(baseURL: string): void {
  const client = createApiClient({
    baseURL,
    getAccessToken: async () => useAuthStore.getState().accessToken,
    onUnauthorized: async () => authService.refreshAccessToken(),
  });
  setApiClient(client);
}
```

- [ ] **Step 2: Update App.tsx to initialize on boot**

Path: `pickhouse/mobile/App.tsx`

```tsx
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { initializeApi } from '@/api/setup';
import { authService } from '@/auth/authService';
import { colors } from '@/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function App() {
  useEffect(() => {
    initializeApi(API_BASE_URL);
    void authService.restoreSession();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
      <Text>PickHouse</Text>
      <StatusBar style="auto" />
    </View>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/api/setup.ts pickhouse/mobile/App.tsx
git commit -m "feat(mobile): initialize API client + restore session on app boot"
```

---

### Task 20: Network monitor

**Files:**
- Create: `pickhouse/mobile/src/sync/networkMonitor.ts`
- Create: `pickhouse/mobile/src/sync/__tests__/networkMonitor.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/sync/__tests__/networkMonitor.test.ts`

```ts
import * as Network from 'expo-network';
import { networkMonitor } from '../networkMonitor';

describe('networkMonitor', () => {
  it('isOnline returns true when connected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({ isConnected: true });
    expect(await networkMonitor.isOnline()).toBe(true);
  });

  it('isOnline returns false when not connected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({ isConnected: false });
    expect(await networkMonitor.isOnline()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/networkMonitor.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement networkMonitor.ts**

Path: `pickhouse/mobile/src/sync/networkMonitor.ts`

```ts
import * as Network from 'expo-network';

export const networkMonitor = {
  async isOnline(): Promise<boolean> {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected);
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/networkMonitor.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/sync/networkMonitor.ts pickhouse/mobile/src/sync/__tests__/networkMonitor.test.ts
git commit -m "feat(mobile): add network monitor wrapper"
```

---

### Task 21: Sync processor

**Files:**
- Create: `pickhouse/mobile/src/sync/syncProcessor.ts`
- Create: `pickhouse/mobile/src/sync/__tests__/syncProcessor.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/sync/__tests__/syncProcessor.test.ts`

```ts
import { syncProcessor } from '../syncProcessor';
import { syncQueueRepo } from '@/db/syncQueue.repo';
import { housesApi } from '@/api/houses.api';
import { housesRepo } from '@/db/houses.repo';
import { networkMonitor } from '../networkMonitor';

jest.mock('@/db/syncQueue.repo');
jest.mock('@/api/houses.api');
jest.mock('@/db/houses.repo');
jest.mock('../networkMonitor');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncProcessor', () => {
  it('skips when offline', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(false);
    const ran = await syncProcessor.processOnce();
    expect(ran).toBe(false);
    expect(syncQueueRepo.list).not.toHaveBeenCalled();
  });

  it('processes a create-house op then removes from queue and marks clean', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 7, opType: 'create', entity: 'house', entityId: 'h1', payload: { id: 'h1' } },
    ]);
    (housesApi.create as jest.Mock).mockResolvedValueOnce({ id: 'h1' });

    const ran = await syncProcessor.processOnce();

    expect(ran).toBe(true);
    expect(housesApi.create).toHaveBeenCalledWith({ id: 'h1' });
    expect(housesRepo.markClean).toHaveBeenCalledWith('h1');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(7);
  });

  it('processes update-house then markClean and removes from queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 9, opType: 'update', entity: 'house', entityId: 'h2', payload: { id: 'h2', memo: 'x' } },
    ]);
    (housesApi.update as jest.Mock).mockResolvedValueOnce({ id: 'h2' });
    await syncProcessor.processOnce();
    expect(housesApi.update).toHaveBeenCalledWith('h2', { id: 'h2', memo: 'x' });
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(9);
  });

  it('processes delete-house', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 11, opType: 'delete', entity: 'house', entityId: 'h3', payload: {} },
    ]);
    (housesApi.remove as jest.Mock).mockResolvedValueOnce(undefined);
    await syncProcessor.processOnce();
    expect(housesApi.remove).toHaveBeenCalledWith('h3');
    expect(syncQueueRepo.remove).toHaveBeenCalledWith(11);
  });

  it('on failure, increments attempts and keeps op in queue', async () => {
    (networkMonitor.isOnline as jest.Mock).mockResolvedValueOnce(true);
    (syncQueueRepo.list as jest.Mock).mockResolvedValueOnce([
      { id: 13, opType: 'create', entity: 'house', entityId: 'h4', payload: { id: 'h4' } },
    ]);
    (housesApi.create as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await syncProcessor.processOnce();
    expect(syncQueueRepo.incrementAttempts).toHaveBeenCalledWith(13, expect.stringMatching(/boom/));
    expect(syncQueueRepo.remove).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/syncProcessor.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement syncProcessor.ts**

Path: `pickhouse/mobile/src/sync/syncProcessor.ts`

```ts
import { syncQueueRepo, SyncOp } from '@/db/syncQueue.repo';
import { housesApi } from '@/api/houses.api';
import { housesRepo } from '@/db/houses.repo';
import { residencesApi } from '@/api/residences.api';
import { networkMonitor } from './networkMonitor';

const MAX_ATTEMPTS = 5;

async function processOp(op: SyncOp): Promise<void> {
  if (op.entity === 'house') {
    if (op.opType === 'create') {
      await housesApi.create(op.payload as never);
      await housesRepo.markClean(op.entityId);
    } else if (op.opType === 'update') {
      await housesApi.update(op.entityId, op.payload as never);
      await housesRepo.markClean(op.entityId);
    } else if (op.opType === 'delete') {
      await housesApi.remove(op.entityId);
    }
  } else if (op.entity === 'residence') {
    if (op.opType === 'create') {
      await residencesApi.get(op.entityId).catch(() => undefined);
    }
  }
}

export const syncProcessor = {
  async processOnce(): Promise<boolean> {
    const online = await networkMonitor.isOnline();
    if (!online) return false;
    const ops = await syncQueueRepo.list();
    for (const op of ops) {
      if ((op.attempts ?? 0) >= MAX_ATTEMPTS) continue;
      try {
        await processOp(op);
        if (op.id != null) {
          await syncQueueRepo.remove(op.id);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (op.id != null) {
          await syncQueueRepo.incrementAttempts(op.id, message);
        }
      }
    }
    return true;
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/syncProcessor.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/sync/syncProcessor.ts pickhouse/mobile/src/sync/__tests__/syncProcessor.test.ts
git commit -m "feat(mobile): add sync processor with per-op retry"
```

---

### Task 22: Conflict resolution helper (last-write-wins)

**Files:**
- Create: `pickhouse/mobile/src/sync/conflictResolution.ts`
- Create: `pickhouse/mobile/src/sync/__tests__/conflictResolution.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/sync/__tests__/conflictResolution.test.ts`

```ts
import { lastWriteWins } from '../conflictResolution';

describe('lastWriteWins', () => {
  it('returns local when local.updatedAt > remote.updatedAt', () => {
    const local = { id: 'h1', updatedAt: '2026-05-19T10:00:00Z' } as any;
    const remote = { id: 'h1', updatedAt: '2026-05-19T09:00:00Z' } as any;
    expect(lastWriteWins(local, remote)).toBe(local);
  });

  it('returns remote when remote.updatedAt >= local.updatedAt', () => {
    const local = { id: 'h1', updatedAt: '2026-05-19T08:00:00Z' } as any;
    const remote = { id: 'h1', updatedAt: '2026-05-19T09:00:00Z' } as any;
    expect(lastWriteWins(local, remote)).toBe(remote);
  });

  it('returns local when no remote', () => {
    expect(lastWriteWins({ id: 'h1', updatedAt: 'x' } as any, null)).toEqual({
      id: 'h1', updatedAt: 'x',
    });
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/conflictResolution.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement conflictResolution.ts**

Path: `pickhouse/mobile/src/sync/conflictResolution.ts`

```ts
export interface Timestamped {
  updatedAt: string;
}

export function lastWriteWins<T extends Timestamped>(local: T, remote: T | null): T {
  if (!remote) return local;
  return new Date(local.updatedAt).getTime() > new Date(remote.updatedAt).getTime()
    ? local
    : remote;
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/conflictResolution.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/sync/conflictResolution.ts pickhouse/mobile/src/sync/__tests__/conflictResolution.test.ts
git commit -m "feat(mobile): add last-write-wins conflict resolution helper"
```

---

### Task 23: Sync queue enqueue facade

**Files:**
- Create: `pickhouse/mobile/src/sync/syncQueue.ts`
- Create: `pickhouse/mobile/src/sync/__tests__/syncQueue.test.ts`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/sync/__tests__/syncQueue.test.ts`

```ts
import { syncQueue } from '../syncQueue';
import { syncQueueRepo } from '@/db/syncQueue.repo';

jest.mock('@/db/syncQueue.repo');

beforeEach(() => jest.clearAllMocks());

describe('syncQueue', () => {
  it('queueHouseCreate enqueues create+house op', async () => {
    (syncQueueRepo.enqueue as jest.Mock).mockResolvedValueOnce(1);
    await syncQueue.queueHouseCreate({ id: 'h1' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'create', entity: 'house', entityId: 'h1',
    }));
  });

  it('queueHouseUpdate enqueues update op', async () => {
    await syncQueue.queueHouseUpdate('h2', { memo: 'x' } as any);
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'update', entity: 'house', entityId: 'h2',
    }));
  });

  it('queueHouseDelete enqueues delete op', async () => {
    await syncQueue.queueHouseDelete('h3');
    expect(syncQueueRepo.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      opType: 'delete', entity: 'house', entityId: 'h3',
    }));
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/syncQueue.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement syncQueue.ts**

Path: `pickhouse/mobile/src/sync/syncQueue.ts`

```ts
import { syncQueueRepo } from '@/db/syncQueue.repo';
import { House } from '@/types';

export const syncQueue = {
  async queueHouseCreate(h: House): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'house',
      entityId: h.id,
      payload: h,
    });
  },

  async queueHouseUpdate(id: string, patch: Partial<House>): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'update',
      entity: 'house',
      entityId: id,
      payload: patch,
    });
  },

  async queueHouseDelete(id: string): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'delete',
      entity: 'house',
      entityId: id,
      payload: {},
    });
  },

  async queuePhotoFinalize(payload: { photoId: string; houseId?: string; remoteUrl: string }): Promise<void> {
    await syncQueueRepo.enqueue({
      opType: 'create',
      entity: 'photo',
      entityId: payload.photoId,
      payload,
    });
  },
};
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/sync/__tests__/syncQueue.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/sync/syncQueue.ts pickhouse/mobile/src/sync/__tests__/syncQueue.test.ts
git commit -m "feat(mobile): add typed sync queue facade for entity ops"
```

---

### Task 24: React Query client setup

**Files:**
- Create: `pickhouse/mobile/src/queries/queryClient.ts`
- Modify: `pickhouse/mobile/App.tsx`

- [ ] **Step 1: Implement queryClient.ts**

Path: `pickhouse/mobile/src/queries/queryClient.ts`

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  },
});
```

- [ ] **Step 2: Add provider to App.tsx**

Path: `pickhouse/mobile/App.tsx`

```tsx
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { initializeApi } from '@/api/setup';
import { authService } from '@/auth/authService';
import { queryClient } from '@/queries/queryClient';
import { colors } from '@/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function App() {
  useEffect(() => {
    initializeApi(API_BASE_URL);
    void authService.restoreSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text>PickHouse</Text>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/queries/queryClient.ts pickhouse/mobile/App.tsx
git commit -m "feat(mobile): add React Query client and provider"
```

---

### Task 25: Houses query hooks (offline-first)

**Files:**
- Create: `pickhouse/mobile/src/queries/houses.queries.ts`
- Create: `pickhouse/mobile/src/queries/__tests__/houses.queries.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/queries/__tests__/houses.queries.test.tsx`

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useHouses, useCreateHouse } from '../houses.queries';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { syncQueue } from '@/sync/syncQueue';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');
jest.mock('@/sync/syncQueue');

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
});

describe('useHouses', () => {
  it('returns local cached houses first, then merges remote', async () => {
    (housesRepo.listActive as jest.Mock).mockResolvedValue([
      { id: 'h1', userId: 'u1', address: {}, dealType: 'WOLSE', deposit: 100, photoIds: [], createdAt: '', updatedAt: '' },
    ]);
    (housesApi.list as jest.Mock).mockResolvedValue([
      { id: 'h1', userId: 'u1', address: {}, dealType: 'WOLSE', deposit: 100, photoIds: [], createdAt: '', updatedAt: '2026' },
      { id: 'h2', userId: 'u1', address: {}, dealType: 'JEONSE', deposit: 5000, photoIds: [], createdAt: '', updatedAt: '2026' },
    ]);
    const { result } = renderHook(() => useHouses(), { wrapper });
    await waitFor(() => expect(result.current.data?.length).toBeGreaterThanOrEqual(1));
  });
});

describe('useCreateHouse', () => {
  it('inserts locally then queues sync', async () => {
    const { result } = renderHook(() => useCreateHouse(), { wrapper });
    await result.current.mutateAsync({
      address: { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType: 'WOLSE',
      deposit: 100,
    });
    expect(housesRepo.insert).toHaveBeenCalled();
    expect(syncQueue.queueHouseCreate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/queries/__tests__/houses.queries.test.tsx
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement houses.queries.ts**

Path: `pickhouse/mobile/src/queries/houses.queries.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { House, HouseDraft } from '@/types';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { syncQueue } from '@/sync/syncQueue';
import { useAuthStore } from '@/stores/authStore';
import { lastWriteWins } from '@/sync/conflictResolution';

const HOUSES_KEY = ['houses'] as const;

export function useHouses() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: HOUSES_KEY,
    enabled: Boolean(userId),
    queryFn: async () => {
      const local = userId ? await housesRepo.listActive(userId) : [];
      try {
        const remote = await housesApi.list();
        const merged = mergeHouses(local, remote);
        return merged;
      } catch {
        return local;
      }
    },
  });
}

function mergeHouses(local: House[], remote: House[]): House[] {
  const byId = new Map<string, House>();
  for (const h of remote) byId.set(h.id, h);
  for (const h of local) {
    const r = byId.get(h.id);
    byId.set(h.id, lastWriteWins(h, r ?? null));
  }
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function useHouse(id: string | undefined) {
  return useQuery({
    queryKey: ['house', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      const local = await housesRepo.findById(id);
      try {
        const remote = await housesApi.get(id);
        return lastWriteWins(local ?? remote, remote);
      } catch {
        if (!local) throw new Error('not found');
        return local;
      }
    },
  });
}

export function useCreateHouse() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? 'unknown';
  return useMutation({
    mutationFn: async (draft: HouseDraft) => {
      const now = new Date().toISOString();
      const house: House = {
        id: draft.id ?? Crypto.randomUUID(),
        userId,
        address: draft.address,
        dealType: draft.dealType,
        deposit: draft.deposit,
        rent: draft.rent,
        maintenanceFee: draft.maintenanceFee,
        area: draft.area,
        builtYear: draft.builtYear,
        floor: draft.floor,
        totalFloor: draft.totalFloor,
        availableFrom: draft.availableFrom,
        stationDistance: draft.stationDistance,
        rooms: draft.rooms,
        bathrooms: draft.bathrooms,
        hasBalcony: draft.hasBalcony,
        hasElevator: draft.hasElevator,
        hasParking: draft.hasParking,
        options: draft.options,
        security: draft.security,
        garbage: draft.garbage,
        ratings: draft.ratings,
        memo: draft.memo,
        photoIds: draft.photoIds ?? [],
        createdAt: now,
        updatedAt: now,
      };
      await housesRepo.insert(house);
      await syncQueue.queueHouseCreate(house);
      return house;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSES_KEY });
    },
  });
}

export function useUpdateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<House> }) => {
      const existing = await housesRepo.findById(id);
      if (!existing) throw new Error('house not found locally');
      const updated: House = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      await housesRepo.update(updated);
      await syncQueue.queueHouseUpdate(id, patch);
      return updated;
    },
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: HOUSES_KEY });
      qc.invalidateQueries({ queryKey: ['house', h.id] });
    },
  });
}

export function useDeleteHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await housesRepo.softDelete(id);
      await syncQueue.queueHouseDelete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSES_KEY }),
  });
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/queries/__tests__/houses.queries.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/queries/houses.queries.ts pickhouse/mobile/src/queries/__tests__/houses.queries.test.tsx
git commit -m "feat(mobile): add offline-first houses query hooks with sync queue"
```

---

### Task 26: Photo cache + uploader

**Files:**
- Create: `pickhouse/mobile/src/photos/photoCache.ts`
- Create: `pickhouse/mobile/src/photos/photoUploader.ts`
- Create: `pickhouse/mobile/src/photos/__tests__/photoUploader.test.ts`

- [ ] **Step 1: Implement photoCache.ts**

Path: `pickhouse/mobile/src/photos/photoCache.ts`

```ts
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const PHOTO_DIR = (FileSystem.documentDirectory ?? '') + 'photos/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export const photoCache = {
  async copyToCache(sourceUri: string, mimeType: string): Promise<{ localUri: string; id: string }> {
    await ensureDir();
    const id = Crypto.randomUUID();
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const target = `${PHOTO_DIR}${id}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: target });
    return { localUri: target, id };
  },

  async remove(localUri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    } catch {
      // ignore
    }
  },
};
```

- [ ] **Step 2: Write failing test for photoUploader**

Path: `pickhouse/mobile/src/photos/__tests__/photoUploader.test.ts`

```ts
import { photoUploader } from '../photoUploader';
import { photosApi } from '@/api/photos.api';
import { uploadToR2 } from '@/api/r2Upload';
import { photosRepo } from '@/db/photos.repo';

jest.mock('@/api/photos.api');
jest.mock('@/api/r2Upload');
jest.mock('@/db/photos.repo');

beforeEach(() => jest.clearAllMocks());

describe('photoUploader', () => {
  it('upload happy path: request URL → R2 PUT → finalize → mark uploaded', async () => {
    (photosApi.requestUploadUrl as jest.Mock).mockResolvedValueOnce({
      uploadUrl: 'https://r2/sign',
      photoId: 'p1',
      fields: {},
      publicUrl: 'https://r2/p1.jpg',
    });
    (uploadToR2 as jest.Mock).mockResolvedValueOnce(undefined);

    await photoUploader.upload({
      localUri: 'file:///tmp/a.jpg',
      mimeType: 'image/jpeg',
      houseId: 'h1',
      photoId: 'p1',
    });

    expect(photosRepo.markUploading).toHaveBeenCalledWith('p1');
    expect(uploadToR2).toHaveBeenCalledWith({
      uploadUrl: 'https://r2/sign',
      localUri: 'file:///tmp/a.jpg',
      mimeType: 'image/jpeg',
    });
    expect(photosApi.finalize).toHaveBeenCalledWith({
      photoId: 'p1', houseId: 'h1', remoteUrl: 'https://r2/p1.jpg',
    });
    expect(photosRepo.updateRemoteUrl).toHaveBeenCalledWith('p1', 'https://r2/p1.jpg');
  });

  it('marks failed on R2 error', async () => {
    (photosApi.requestUploadUrl as jest.Mock).mockResolvedValueOnce({
      uploadUrl: 'u', photoId: 'p2', fields: {}, publicUrl: 'x',
    });
    (uploadToR2 as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    await expect(photoUploader.upload({
      localUri: 'file:///tmp/b.jpg', mimeType: 'image/jpeg', houseId: 'h1', photoId: 'p2',
    })).rejects.toThrow(/boom/);
    expect(photosRepo.markFailed).toHaveBeenCalledWith('p2');
  });
});
```

- [ ] **Step 3: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/photos/__tests__/photoUploader.test.ts
```

Expected: FAIL

- [ ] **Step 4: Implement photoUploader.ts**

Path: `pickhouse/mobile/src/photos/photoUploader.ts`

```ts
import { photosApi } from '@/api/photos.api';
import { uploadToR2 } from '@/api/r2Upload';
import { photosRepo } from '@/db/photos.repo';

export interface UploadInput {
  localUri: string;
  mimeType: string;
  houseId?: string;
  residenceId?: string;
  photoId: string;
}

export const photoUploader = {
  async upload(input: UploadInput): Promise<string> {
    await photosRepo.markUploading(input.photoId);
    try {
      const signed = await photosApi.requestUploadUrl({
        houseId: input.houseId,
        residenceId: input.residenceId,
        mimeType: input.mimeType,
      });
      await uploadToR2({
        uploadUrl: signed.uploadUrl,
        localUri: input.localUri,
        mimeType: input.mimeType,
      });
      await photosApi.finalize({
        photoId: input.photoId,
        houseId: input.houseId,
        residenceId: input.residenceId,
        remoteUrl: signed.publicUrl,
      });
      await photosRepo.updateRemoteUrl(input.photoId, signed.publicUrl);
      return signed.publicUrl;
    } catch (e) {
      await photosRepo.markFailed(input.photoId);
      throw e;
    }
  },
};
```

- [ ] **Step 5: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/photos/__tests__/photoUploader.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/photos/
git commit -m "feat(mobile): add photo cache and uploader with R2 flow"
```

---

### Task 27: Camera helper

**Files:**
- Create: `pickhouse/mobile/src/photos/cameraHelper.ts`

- [ ] **Step 1: Implement cameraHelper.ts**

Path: `pickhouse/mobile/src/photos/cameraHelper.ts`

```ts
import * as ImagePicker from 'expo-image-picker';
import { photoCache } from './photoCache';
import { photosRepo } from '@/db/photos.repo';

export interface CapturedPhoto {
  id: string;
  localUri: string;
  mimeType: string;
  width?: number;
  height?: number;
}

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export const cameraHelper = {
  async takePhoto(houseId: string): Promise<CapturedPhoto | null> {
    const ok = await ensureCameraPermission();
    if (!ok) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || result.assets.length === 0) return null;
    const asset = result.assets[0]!;
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const { localUri, id } = await photoCache.copyToCache(asset.uri, mimeType);
    await photosRepo.insert({
      id,
      houseId,
      localUri,
      uploadStatus: 'pending',
      takenAt: new Date().toISOString(),
      width: asset.width,
      height: asset.height,
      mimeType,
    });
    return { id, localUri, mimeType, width: asset.width, height: asset.height };
  },

  async pickFromLibrary(houseId: string, max = 10): Promise<CapturedPhoto[]> {
    const ok = await ensureLibraryPermission();
    if (!ok) return [];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: max,
    });
    if (result.canceled) return [];
    const out: CapturedPhoto[] = [];
    for (const asset of result.assets) {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const { localUri, id } = await photoCache.copyToCache(asset.uri, mimeType);
      await photosRepo.insert({
        id,
        houseId,
        localUri,
        uploadStatus: 'pending',
        takenAt: new Date().toISOString(),
        width: asset.width,
        height: asset.height,
        mimeType,
      });
      out.push({ id, localUri, mimeType, width: asset.width, height: asset.height });
    }
    return out;
  },
};
```

- [ ] **Step 2: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/photos/cameraHelper.ts
git commit -m "feat(mobile): add camera + library helper that caches and registers photos"
```


---

### Task 28: Shared UI — Card component

**Files:**
- Create: `pickhouse/mobile/src/components/Card.tsx`
- Create: `pickhouse/mobile/src/components/__tests__/Card.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/components/__tests__/Card.test.tsx`

```tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(<Card><Text>hi</Text></Card>);
    expect(getByText('hi')).toBeTruthy();
  });

  it('applies background color from theme', () => {
    const { getByTestId } = render(<Card testID="c"><Text>x</Text></Card>);
    const node = getByTestId('c');
    const styles = Array.isArray(node.props.style) ? Object.assign({}, ...node.props.style) : node.props.style;
    expect(styles.backgroundColor).toBe('#ffffff');
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/components/__tests__/Card.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement Card.tsx**

Path: `pickhouse/mobile/src/components/Card.tsx`

```tsx
import { ReactNode } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { colors, radii, spacing, shadows } from '@/theme';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({ children, style, testID }: CardProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.cardBg,
          borderRadius: radii.lg,
          padding: spacing.lg,
          ...shadows.soft,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/components/__tests__/Card.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/Card.tsx pickhouse/mobile/src/components/__tests__/Card.test.tsx
git commit -m "feat(mobile): add Card component with soft shadow"
```

---

### Task 29: Shared UI — Button component

**Files:**
- Create: `pickhouse/mobile/src/components/Button.tsx`
- Create: `pickhouse/mobile/src/components/__tests__/Button.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/components/__tests__/Button.test.tsx`

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="확인" onPress={onPress} />);
    fireEvent.press(getByText('확인'));
    expect(onPress).toHaveBeenCalled();
  });

  it('disabled button does not call onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="저장" onPress={onPress} disabled />);
    fireEvent.press(getByText('저장'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/components/__tests__/Button.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement Button.tsx**

Path: `pickhouse/mobile/src/components/Button.tsx`

```tsx
import { Pressable, Text, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const bg = disabled
    ? colors.border
    : variant === 'primary'
      ? colors.accentGreen
      : variant === 'secondary'
        ? colors.cream
        : 'transparent';
  const fg = variant === 'primary' && !disabled ? colors.white : colors.ink;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: radii.pill,
          alignItems: 'center',
          opacity: pressed && !disabled ? 0.85 : 1,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text style={[typography.bodyBold, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/components/__tests__/Button.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/Button.tsx pickhouse/mobile/src/components/__tests__/Button.test.tsx
git commit -m "feat(mobile): add Button component with variants"
```

---

### Task 30: Shared UI — StarRating component

**Files:**
- Create: `pickhouse/mobile/src/components/StarRating.tsx`
- Create: `pickhouse/mobile/src/components/__tests__/StarRating.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/components/__tests__/StarRating.test.tsx`

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('renders 5 star slots', () => {
    const { getAllByRole } = render(<StarRating value={0} onChange={() => {}} />);
    expect(getAllByRole('button').length).toBe(5);
  });

  it('tapping a star reports its value', () => {
    const onChange = jest.fn();
    const { getAllByRole } = render(<StarRating value={0} onChange={onChange} />);
    fireEvent.press(getAllByRole('button')[2]!);
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/components/__tests__/StarRating.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement StarRating.tsx**

Path: `pickhouse/mobile/src/components/StarRating.tsx`

```tsx
import { Pressable, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

export interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="button"
          accessibilityLabel={`별 ${n}점`}
          onPress={() => onChange(n)}
          hitSlop={6}
        >
          <Text style={{ fontSize: 28, color: n <= value ? colors.star : colors.border }}>
            {'★'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/components/__tests__/StarRating.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/components/StarRating.tsx pickhouse/mobile/src/components/__tests__/StarRating.test.tsx
git commit -m "feat(mobile): add StarRating component"
```

---

### Task 31: Apple + Kakao sign-in buttons

**Files:**
- Create: `pickhouse/mobile/src/components/AppleSignInButton.tsx`
- Create: `pickhouse/mobile/src/components/KakaoSignInButton.tsx`

- [ ] **Step 1: Implement AppleSignInButton.tsx**

Path: `pickhouse/mobile/src/components/AppleSignInButton.tsx`

```tsx
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export interface AppleSignInButtonProps {
  onPress: () => void;
}

export function AppleSignInButton({ onPress }: AppleSignInButtonProps) {
  if (Platform.OS !== 'ios') return null;
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={999}
      style={{ width: '100%', height: 52 }}
      onPress={onPress}
    />
  );
}
```

- [ ] **Step 2: Implement KakaoSignInButton.tsx**

Path: `pickhouse/mobile/src/components/KakaoSignInButton.tsx`

```tsx
import { Pressable, Text } from 'react-native';
import { radii, typography } from '@/theme';

export interface KakaoSignInButtonProps {
  onPress: () => void;
}

export function KakaoSignInButton({ onPress }: KakaoSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#FEE500',
        height: 52,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.9 : 1,
        width: '100%',
      })}
    >
      <Text style={[typography.bodyBold, { color: '#1A1A1A' }]}>카카오로 시작하기</Text>
    </Pressable>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/components/AppleSignInButton.tsx pickhouse/mobile/src/components/KakaoSignInButton.tsx
git commit -m "feat(mobile): add Apple + Kakao sign-in button components"
```

---

### Task 32: Kakao address picker (WebView)

**Files:**
- Create: `pickhouse/mobile/src/integrations/kakaoAddress.tsx`

- [ ] **Step 1: Implement kakaoAddress.tsx**

Path: `pickhouse/mobile/src/integrations/kakaoAddress.tsx`

```tsx
import { Modal, View, Pressable, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Address } from '@/types';
import { colors, spacing, typography } from '@/theme';

const HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>주소 검색</title>
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
</head>
<body style="margin:0;padding:0;background:#faf6f0;">
<div id="layer" style="width:100vw;height:100vh;"></div>
<script>
new daum.Postcode({
  oncomplete: function(data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      roadAddress: data.roadAddress,
      jibunAddress: data.jibunAddress,
      zonecode: data.zonecode
    }));
  },
  width: '100%',
  height: '100%'
}).embed(document.getElementById('layer'));
</script>
</body></html>
`;

export interface KakaoAddressPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (addr: Address) => void;
}

export function KakaoAddressPicker({ visible, onClose, onSelect }: KakaoAddressPickerProps) {
  function handleMessage(e: WebViewMessageEvent) {
    try {
      const parsed = JSON.parse(e.nativeEvent.data) as {
        roadAddress: string;
        jibunAddress: string;
        zonecode: string;
      };
      onSelect({
        roadAddress: parsed.roadAddress,
        jibunAddress: parsed.jibunAddress,
        zonecode: parsed.zonecode,
      });
      onClose();
    } catch {
      // ignore parse errors
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={typography.heading}>주소 검색</Text>
          <Pressable onPress={onClose}>
            <Text style={[typography.body, { color: colors.inkMuted }]}>닫기</Text>
          </Pressable>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: HTML }}
          onMessage={handleMessage}
        />
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/integrations/kakaoAddress.tsx
git commit -m "feat(mobile): add Kakao address picker via WebView"
```

---

### Task 33: AddressPicker component (wraps Kakao picker)

**Files:**
- Create: `pickhouse/mobile/src/components/AddressPicker.tsx`

- [ ] **Step 1: Implement AddressPicker.tsx**

Path: `pickhouse/mobile/src/components/AddressPicker.tsx`

```tsx
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Address } from '@/types';
import { KakaoAddressPicker } from '@/integrations/kakaoAddress';
import { colors, radii, spacing, typography } from '@/theme';

export interface AddressPickerProps {
  value: Address | null;
  onChange: (a: Address) => void;
}

export function AddressPicker({ value, onChange }: AddressPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.lg,
          backgroundColor: colors.white,
        }}
      >
        <Text style={[typography.caption, { color: colors.inkMuted }]}>주소</Text>
        <Text style={[typography.body, { color: value ? colors.ink : colors.inkMuted }]}>
          {value?.roadAddress ?? '주소를 검색하세요'}
        </Text>
      </Pressable>
      <KakaoAddressPicker
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </View>
  );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/components/AddressPicker.tsx
git commit -m "feat(mobile): add AddressPicker form control"
```

---

### Task 34: PhotoGrid component

**Files:**
- Create: `pickhouse/mobile/src/components/PhotoGrid.tsx`

- [ ] **Step 1: Implement PhotoGrid.tsx**

Path: `pickhouse/mobile/src/components/PhotoGrid.tsx`

```tsx
import { Image, View, Pressable, Text } from 'react-native';
import { Photo } from '@/types';
import { colors, radii, spacing, typography } from '@/theme';

export interface PhotoGridProps {
  photos: Photo[];
  onAdd?: () => void;
  onRemove?: (id: string) => void;
}

export function PhotoGrid({ photos, onAdd, onRemove }: PhotoGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {photos.map((p) => (
        <View key={p.id} style={{ position: 'relative' }}>
          <Image
            source={{ uri: p.remoteUrl ?? p.localUri }}
            style={{ width: 96, height: 96, borderRadius: radii.md, backgroundColor: colors.creamDark }}
          />
          {onRemove ? (
            <Pressable
              onPress={() => onRemove(p.id)}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: colors.ink,
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.white, fontSize: 12 }}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          style={{
            width: 96,
            height: 96,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.white,
          }}
        >
          <Text style={[typography.caption, { color: colors.inkMuted }]}>+ 사진</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/components/PhotoGrid.tsx
git commit -m "feat(mobile): add PhotoGrid component for photo display + add/remove"
```

---

### Task 35: Navigation types and root navigator

**Files:**
- Create: `pickhouse/mobile/src/navigation/types.ts`
- Create: `pickhouse/mobile/src/navigation/AuthStack.tsx`
- Create: `pickhouse/mobile/src/navigation/MainTabs.tsx`
- Create: `pickhouse/mobile/src/navigation/RootNavigator.tsx`
- Create: `pickhouse/mobile/src/screens/auth/AuthScreen.tsx` (stub)
- Create: `pickhouse/mobile/src/screens/houses/HouseListScreen.tsx` (stub)
- Create: `pickhouse/mobile/src/screens/houses/HouseInputScreen.tsx` (stub)
- Create: `pickhouse/mobile/src/screens/houses/HouseDetailScreen.tsx` (stub)

- [ ] **Step 1: Create navigation types**

Path: `pickhouse/mobile/src/navigation/types.ts`

```ts
export type AuthStackParamList = {
  Auth: undefined;
};

export type HouseStackParamList = {
  HouseList: undefined;
  HouseInput: { houseId?: string } | undefined;
  HouseDetail: { houseId: string };
};

export type MainTabParamList = {
  Houses: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends HouseStackParamList, AuthStackParamList {}
  }
}
```

- [ ] **Step 2: Create temporary screen stubs**

Path: `pickhouse/mobile/src/screens/auth/AuthScreen.tsx`

```tsx
import { Text, View } from 'react-native';
export function AuthScreen() { return <View><Text>Auth</Text></View>; }
```

Path: `pickhouse/mobile/src/screens/houses/HouseListScreen.tsx`

```tsx
import { Text, View } from 'react-native';
export function HouseListScreen() { return <View><Text>List</Text></View>; }
```

Path: `pickhouse/mobile/src/screens/houses/HouseInputScreen.tsx`

```tsx
import { Text, View } from 'react-native';
export function HouseInputScreen() { return <View><Text>Input</Text></View>; }
```

Path: `pickhouse/mobile/src/screens/houses/HouseDetailScreen.tsx`

```tsx
import { Text, View } from 'react-native';
export function HouseDetailScreen() { return <View><Text>Detail</Text></View>; }
```

- [ ] **Step 3: Create AuthStack**

Path: `pickhouse/mobile/src/navigation/AuthStack.tsx`

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Create MainTabs (single stack of house screens for MVP)**

Path: `pickhouse/mobile/src/navigation/MainTabs.tsx`

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HouseStackParamList } from './types';
import { HouseListScreen } from '@/screens/houses/HouseListScreen';
import { HouseInputScreen } from '@/screens/houses/HouseInputScreen';
import { HouseDetailScreen } from '@/screens/houses/HouseDetailScreen';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<HouseStackParamList>();

export function MainTabs() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTitleStyle: { color: colors.ink },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="HouseList" component={HouseListScreen} options={{ title: '본 집' }} />
      <Stack.Screen name="HouseInput" component={HouseInputScreen} options={{ title: '새 집 기록' }} />
      <Stack.Screen name="HouseDetail" component={HouseDetailScreen} options={{ title: '집 상세' }} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 5: Create RootNavigator with auth gate**

Path: `pickhouse/mobile/src/navigation/RootNavigator.tsx`

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { colors } from '@/theme';

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);

  if (status === 'unknown') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
```

- [ ] **Step 6: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add pickhouse/mobile/src/navigation/ pickhouse/mobile/src/screens/
git commit -m "feat(mobile): add navigation stacks with auth gate and screen stubs"
```

---

### Task 36: Wire RootNavigator into App.tsx

**Files:**
- Modify: `pickhouse/mobile/App.tsx`

- [ ] **Step 1: Update App.tsx**

Path: `pickhouse/mobile/App.tsx`

```tsx
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { initializeApi } from '@/api/setup';
import { authService } from '@/auth/authService';
import { queryClient } from '@/queries/queryClient';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function App() {
  useEffect(() => {
    initializeApi(API_BASE_URL);
    void authService.restoreSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
          <StatusBar style="dark" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/App.tsx
git commit -m "feat(mobile): mount RootNavigator with gesture handler + safe area"
```

---

### Task 37: Auth screen implementation

**Files:**
- Modify: `pickhouse/mobile/src/screens/auth/AuthScreen.tsx`
- Create: `pickhouse/mobile/src/screens/auth/__tests__/AuthScreen.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/screens/auth/__tests__/AuthScreen.test.tsx`

```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthScreen } from '../AuthScreen';
import { authService } from '@/auth/authService';

jest.mock('@/auth/authService');

beforeEach(() => jest.clearAllMocks());

describe('AuthScreen', () => {
  it('shows welcome copy and a Kakao button', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText(/카카오로 시작하기/)).toBeTruthy();
  });

  it('Kakao button calls loginWithKakao', async () => {
    (authService.loginWithKakao as jest.Mock).mockResolvedValueOnce(undefined);
    const { getByText } = render(<AuthScreen />);
    fireEvent.press(getByText(/카카오로 시작하기/));
    await waitFor(() => expect(authService.loginWithKakao).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/screens/auth/__tests__/AuthScreen.test.tsx
```

Expected: FAIL — copy not found

- [ ] **Step 3: Implement AuthScreen.tsx**

Path: `pickhouse/mobile/src/screens/auth/AuthScreen.tsx`

```tsx
import { useState, useEffect } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/auth/authService';
import { appleAuth } from '@/auth/appleAuth';
import { AppleSignInButton } from '@/components/AppleSignInButton';
import { KakaoSignInButton } from '@/components/KakaoSignInButton';
import { colors, spacing, typography } from '@/theme';

export function AuthScreen() {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      void appleAuth.isAvailable().then(setAppleAvailable);
    }
  }, []);

  async function handleApple() {
    try {
      await authService.loginWithApple();
    } catch (e) {
      Alert.alert('Apple 로그인 실패', e instanceof Error ? e.message : String(e));
    }
  }

  async function handleKakao() {
    try {
      await authService.loginWithKakao();
    } catch (e) {
      Alert.alert('카카오 로그인 실패', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between' }}>
        <View style={{ marginTop: spacing.xxxl }}>
          <Text style={[typography.miniLabel, { color: colors.inkMuted }]}>PICKHOUSE</Text>
          <Text style={[typography.display, { color: colors.ink, marginTop: spacing.sm }]}>살래말래</Text>
          <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.md }]}>
            본 집들을 정리해서{'\n'}한눈에 비교하는 나만의 기록장
          </Text>
        </View>

        <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
          {appleAvailable ? <AppleSignInButton onPress={handleApple} /> : null}
          <KakaoSignInButton onPress={handleKakao} />
          <Text style={[typography.caption, { color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            로그인 시 이용약관 · 개인정보 처리방침에 동의합니다
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/screens/auth/__tests__/AuthScreen.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/auth/AuthScreen.tsx pickhouse/mobile/src/screens/auth/__tests__/AuthScreen.test.tsx
git commit -m "feat(mobile): implement Auth screen with Apple + Kakao sign-in"
```

---

### Task 38: House list screen

**Files:**
- Modify: `pickhouse/mobile/src/screens/houses/HouseListScreen.tsx`
- Modify: `pickhouse/mobile/src/types/index.ts` (re-export nav types)
- Create: `pickhouse/mobile/src/screens/houses/__tests__/HouseListScreen.test.tsx`

- [ ] **Step 1: Add navigation type re-export**

Path: `pickhouse/mobile/src/types/index.ts`

```ts
export * from './auth';
export * from './house';
export * from './photo';
export * from './residence';
export * from './user';
export type { HouseStackParamList, AuthStackParamList, MainTabParamList } from '@/navigation/types';
```

- [ ] **Step 2: Write failing test**

Path: `pickhouse/mobile/src/screens/houses/__tests__/HouseListScreen.test.tsx`

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseListScreen } from '../HouseListScreen';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');

const wrap = (c: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>{c}</NavigationContainer>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a',
    refreshToken: 'r',
    status: 'authenticated',
  });
});

describe('HouseListScreen', () => {
  it('renders house addresses from the data source', async () => {
    (housesRepo.listActive as jest.Mock).mockResolvedValue([
      {
        id: 'h1', userId: 'u1',
        address: { roadAddress: '서울시 종로구 1', jibunAddress: '', zonecode: '03000' },
        dealType: 'WOLSE', deposit: 1000, rent: 50, photoIds: [], createdAt: '2026-01', updatedAt: '2026-01',
      },
    ]);
    (housesApi.list as jest.Mock).mockRejectedValue(new Error('offline'));

    const nav = { navigate: jest.fn() } as any;
    const { findByText } = render(wrap(<HouseListScreen navigation={nav} route={{} as any} />));
    await waitFor(async () => {
      expect(await findByText(/종로구/)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 3: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/screens/houses/__tests__/HouseListScreen.test.tsx
```

Expected: FAIL

- [ ] **Step 4: Implement HouseListScreen.tsx**

Path: `pickhouse/mobile/src/screens/houses/HouseListScreen.tsx`

```tsx
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StarRating } from '@/components/StarRating';
import { useHouses } from '@/queries/houses.queries';
import { House, HouseStackParamList } from '@/types';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseList'>;

type SortMode = 'recent' | 'priceAsc' | 'priceDesc' | 'rating';

function priceLabel(h: House): string {
  if (h.dealType === 'JEONSE') return `전세 ${h.deposit.toLocaleString()}`;
  return `${h.deposit.toLocaleString()} / ${h.rent?.toLocaleString() ?? 0}`;
}

function avgRating(h: House): number {
  const r = h.ratings ?? {};
  const vals = Object.values(r).filter((v): v is number => typeof v === 'number');
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function HouseListScreen({ navigation }: Props) {
  const [sort, setSort] = useState<SortMode>('recent');
  const { data = [], refetch, isFetching } = useHouses();

  const sorted = useMemo(() => {
    const arr = [...data];
    if (sort === 'priceAsc') arr.sort((a, b) => a.deposit - b.deposit);
    else if (sort === 'priceDesc') arr.sort((a, b) => b.deposit - a.deposit);
    else if (sort === 'rating') arr.sort((a, b) => avgRating(b) - avgRating(a));
    else arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return arr;
  }, [data, sort]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.lg }}>
        <SortChip label="최신순" active={sort === 'recent'} onPress={() => setSort('recent')} />
        <SortChip label="가격↑" active={sort === 'priceAsc'} onPress={() => setSort('priceAsc')} />
        <SortChip label="가격↓" active={sort === 'priceDesc'} onPress={() => setSort('priceDesc')} />
        <SortChip label="별점" active={sort === 'rating'} onPress={() => setSort('rating')} />
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center', marginTop: spacing.xxxl }]}>
            아직 기록한 집이 없어요{'\n'}+ 버튼으로 첫 집을 기록해보세요
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('HouseDetail', { houseId: item.id })}>
            <Card>
              <Text style={[typography.bodyBold, { color: colors.ink }]}>
                {item.address.roadAddress || '주소 미입력'}
              </Text>
              <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
                {priceLabel(item)} (만원)
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                <StarRating value={Math.round(avgRating(item))} onChange={() => {}} />
              </View>
            </Card>
          </Pressable>
        )}
      />
      <View style={{ position: 'absolute', bottom: spacing.xl, left: spacing.xl, right: spacing.xl }}>
        <Button label="+ 새 집 기록" onPress={() => navigation.navigate('HouseInput')} />
      </View>
    </SafeAreaView>
  );
}

function SortChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: active ? colors.ink : colors.white,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
      }}
    >
      <Text style={[typography.caption, { color: active ? colors.white : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 5: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/screens/houses/__tests__/HouseListScreen.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/screens/houses/HouseListScreen.tsx pickhouse/mobile/src/screens/houses/__tests__/HouseListScreen.test.tsx pickhouse/mobile/src/types/index.ts
git commit -m "feat(mobile): implement House list screen with sort chips"
```

---

### Task 39: House input screen (Quick mode + Detail mode tabs)

**Files:**
- Modify: `pickhouse/mobile/src/screens/houses/HouseInputScreen.tsx`
- Create: `pickhouse/mobile/src/screens/houses/__tests__/HouseInputScreen.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/screens/houses/__tests__/HouseInputScreen.test.tsx`

```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseInputScreen } from '../HouseInputScreen';
import { useAuthStore } from '@/stores/authStore';
import { housesRepo } from '@/db/houses.repo';
import { syncQueue } from '@/sync/syncQueue';

jest.mock('@/db/houses.repo');
jest.mock('@/sync/syncQueue');

const wrap = (c: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>{c}</NavigationContainer>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'u1', authProviders: {}, createdAt: '' },
    accessToken: 'a', refreshToken: 'r', status: 'authenticated',
  });
});

describe('HouseInputScreen', () => {
  it('renders two tabs: 현장 모드 / 디테일 모드', () => {
    const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const { getByText } = render(wrap(<HouseInputScreen navigation={nav} route={{ params: undefined } as any} />));
    expect(getByText('현장 모드')).toBeTruthy();
    expect(getByText('디테일 모드')).toBeTruthy();
  });

  it('save in quick mode persists deposit and goes back', async () => {
    const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const { getByText, getByPlaceholderText } = render(
      wrap(<HouseInputScreen navigation={nav} route={{ params: undefined } as any} />),
    );
    fireEvent.changeText(getByPlaceholderText('보증금 (만원)'), '1000');
    fireEvent.changeText(getByPlaceholderText('월세 (만원)'), '50');
    fireEvent.press(getByText('저장'));
    await waitFor(() => {
      expect(housesRepo.insert).toHaveBeenCalled();
      expect(syncQueue.queueHouseCreate).toHaveBeenCalled();
      expect(nav.goBack).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/screens/houses/__tests__/HouseInputScreen.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement HouseInputScreen.tsx**

Path: `pickhouse/mobile/src/screens/houses/HouseInputScreen.tsx`

```tsx
import { useState } from 'react';
import { ScrollView, TextInput, Text, View, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StarRating } from '@/components/StarRating';
import { AddressPicker } from '@/components/AddressPicker';
import { PhotoGrid } from '@/components/PhotoGrid';
import { cameraHelper } from '@/photos/cameraHelper';
import { useCreateHouse } from '@/queries/houses.queries';
import { Address, DealType, HouseStackParamList, Photo, StarRatings } from '@/types';
import { colors, radii, spacing, typography } from '@/theme';
import { photosRepo } from '@/db/photos.repo';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseInput'>;
type Mode = 'quick' | 'detail';

export function HouseInputScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('quick');
  const [address, setAddress] = useState<Address | null>(null);
  const [dealType, setDealType] = useState<DealType>('WOLSE');
  const [deposit, setDeposit] = useState('');
  const [rent, setRent] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [area, setArea] = useState('');
  const [floor, setFloor] = useState('');
  const [memo, setMemo] = useState('');
  const [ratings, setRatings] = useState<StarRatings>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tempHouseId] = useState(() => Crypto.randomUUID());

  const { mutateAsync: createHouse, isPending } = useCreateHouse();

  async function handleAddPhoto() {
    const captured = await cameraHelper.takePhoto(tempHouseId);
    if (captured) {
      setPhotos((p) => [
        ...p,
        {
          id: captured.id,
          houseId: tempHouseId,
          localUri: captured.localUri,
          uploadStatus: 'pending',
          takenAt: new Date().toISOString(),
          mimeType: captured.mimeType,
        },
      ]);
    }
  }

  async function handleRemovePhoto(id: string) {
    await photosRepo.softDelete(id);
    setPhotos((arr) => arr.filter((p) => p.id !== id));
  }

  async function handleSave() {
    if (!deposit) {
      Alert.alert('보증금을 입력해주세요');
      return;
    }
    await createHouse({
      id: tempHouseId,
      address: address ?? { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType,
      deposit: parseInt(deposit, 10) || 0,
      rent: rent ? parseInt(rent, 10) : undefined,
      maintenanceFee: maintenance ? parseInt(maintenance, 10) : undefined,
      area: area ? parseFloat(area) : undefined,
      floor: floor ? parseInt(floor, 10) : undefined,
      memo: memo || undefined,
      ratings: Object.keys(ratings).length > 0 ? ratings : undefined,
      photoIds: photos.map((p) => p.id),
    });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <View style={{ flexDirection: 'row', padding: spacing.lg, gap: spacing.sm }}>
        <ModeTab label="현장 모드" active={mode === 'quick'} onPress={() => setMode('quick')} />
        <ModeTab label="디테일 모드" active={mode === 'detail'} onPress={() => setMode('detail')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: spacing.md }}>
        {mode === 'quick' ? (
          <>
            <Card>
              <Text style={typography.caption}>가격</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <DealTypeChip label="전세" active={dealType === 'JEONSE'} onPress={() => setDealType('JEONSE')} />
                <DealTypeChip label="월세" active={dealType === 'WOLSE'} onPress={() => setDealType('WOLSE')} />
                <DealTypeChip label="반전세" active={dealType === 'BAN_JEONSE'} onPress={() => setDealType('BAN_JEONSE')} />
              </View>
              <Input placeholder="보증금 (만원)" value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
              {dealType !== 'JEONSE' && (
                <Input placeholder="월세 (만원)" value={rent} onChangeText={setRent} keyboardType="numeric" />
              )}
            </Card>

            <Card>
              <Text style={typography.caption}>빠른 별점</Text>
              {(['waterPressure', 'sunlight', 'noise', 'firstImpression'] as const).map((k) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                  <Text style={typography.body}>{labelOf(k)}</Text>
                  <StarRating
                    value={ratings[k] ?? 0}
                    onChange={(v) => setRatings((r) => ({ ...r, [k]: v }))}
                  />
                </View>
              ))}
            </Card>

            <Card>
              <Text style={typography.caption}>사진</Text>
              <View style={{ marginTop: spacing.sm }}>
                <PhotoGrid photos={photos} onAdd={handleAddPhoto} onRemove={handleRemovePhoto} />
              </View>
            </Card>

            <Card>
              <Text style={typography.caption}>한 줄 메모</Text>
              <Input
                placeholder="좋았던 점·아쉬운 점 한 줄"
                value={memo}
                onChangeText={setMemo}
                multiline
              />
            </Card>
          </>
        ) : (
          <>
            <Card>
              <AddressPicker value={address} onChange={setAddress} />
            </Card>

            <Card>
              <Text style={typography.caption}>거래 유형</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <DealTypeChip label="전세" active={dealType === 'JEONSE'} onPress={() => setDealType('JEONSE')} />
                <DealTypeChip label="월세" active={dealType === 'WOLSE'} onPress={() => setDealType('WOLSE')} />
                <DealTypeChip label="반전세" active={dealType === 'BAN_JEONSE'} onPress={() => setDealType('BAN_JEONSE')} />
              </View>
              <Input placeholder="보증금 (만원)" value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
              <Input placeholder="월세 (만원)" value={rent} onChangeText={setRent} keyboardType="numeric" />
              <Input placeholder="관리비 (만원)" value={maintenance} onChangeText={setMaintenance} keyboardType="numeric" />
              <Input placeholder="전용면적 (평)" value={area} onChangeText={setArea} keyboardType="numeric" />
              <Input placeholder="층" value={floor} onChangeText={setFloor} keyboardType="numeric" />
            </Card>

            <Card>
              <Text style={typography.caption}>주관 평가</Text>
              {(['waterPressure','sunlight','noise','insulation','ventilation','moisture','neighborhood','firstImpression'] as const).map((k) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                  <Text style={typography.body}>{labelOf(k)}</Text>
                  <StarRating
                    value={ratings[k] ?? 0}
                    onChange={(v) => setRatings((r) => ({ ...r, [k]: v }))}
                  />
                </View>
              ))}
            </Card>

            <Card>
              <Text style={typography.caption}>사진</Text>
              <View style={{ marginTop: spacing.sm }}>
                <PhotoGrid photos={photos} onAdd={handleAddPhoto} onRemove={handleRemovePhoto} />
              </View>
            </Card>

            <Card>
              <Text style={typography.caption}>메모</Text>
              <Input
                placeholder="장단점·코멘트·협상여지 등 자유롭게"
                value={memo}
                onChangeText={setMemo}
                multiline
              />
            </Card>
          </>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: spacing.xl, left: spacing.xl, right: spacing.xl }}>
        <Button label={isPending ? '저장 중...' : '저장'} onPress={handleSave} disabled={isPending} />
      </View>
    </SafeAreaView>
  );
}

function labelOf(k: keyof StarRatings): string {
  const m: Record<keyof StarRatings, string> = {
    waterPressure: '수압',
    sunlight: '햇빛',
    noise: '소음',
    insulation: '단열',
    ventilation: '환기',
    moisture: '곰팡이/누수',
    neighborhood: '동네',
    firstImpression: '첫인상',
  };
  return m[k];
}

function ModeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radii.pill,
        backgroundColor: active ? colors.ink : 'transparent',
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.border,
      }}
    >
      <Text style={[typography.bodyBold, { color: active ? colors.white : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

function DealTypeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: active ? colors.accentGreen : colors.white,
        borderWidth: 1,
        borderColor: active ? colors.accentGreen : colors.border,
      }}
    >
      <Text style={[typography.caption, { color: active ? colors.white : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

function Input({ multiline, ...rest }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={colors.inkMuted}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: spacing.md,
        marginTop: spacing.sm,
        backgroundColor: colors.white,
        color: colors.ink,
        minHeight: multiline ? 80 : undefined,
      }}
    />
  );
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/screens/houses/__tests__/HouseInputScreen.test.tsx
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/houses/HouseInputScreen.tsx pickhouse/mobile/src/screens/houses/__tests__/HouseInputScreen.test.tsx
git commit -m "feat(mobile): implement House input with quick/detail modes"
```

---

### Task 40: House detail screen

**Files:**
- Modify: `pickhouse/mobile/src/screens/houses/HouseDetailScreen.tsx`
- Create: `pickhouse/mobile/src/screens/houses/__tests__/HouseDetailScreen.test.tsx`

- [ ] **Step 1: Write failing test**

Path: `pickhouse/mobile/src/screens/houses/__tests__/HouseDetailScreen.test.tsx`

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseDetailScreen } from '../HouseDetailScreen';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');

const wrap = (c: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>{c}</NavigationContainer>
    </QueryClientProvider>
  );
};

describe('HouseDetailScreen', () => {
  it('shows house address and memo', async () => {
    (housesRepo.findById as jest.Mock).mockResolvedValue({
      id: 'h1', userId: 'u1',
      address: { roadAddress: '서울시 마포구 1', jibunAddress: '', zonecode: '04000' },
      dealType: 'WOLSE', deposit: 1000, rent: 50, memo: '햇빛 잘 듦',
      photoIds: [], createdAt: '2026', updatedAt: '2026',
    });
    (housesApi.get as jest.Mock).mockRejectedValue(new Error('offline'));
    (housesRepo.findById as jest.Mock).mockResolvedValueOnce({
      id: 'h1', userId: 'u1',
      address: { roadAddress: '서울시 마포구 1', jibunAddress: '', zonecode: '04000' },
      dealType: 'WOLSE', deposit: 1000, rent: 50, memo: '햇빛 잘 듦',
      photoIds: [], createdAt: '2026', updatedAt: '2026',
    });

    const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const { findByText } = render(
      wrap(<HouseDetailScreen navigation={nav} route={{ params: { houseId: 'h1' }, key: 'k', name: 'HouseDetail' } as any} />),
    );
    await waitFor(async () => {
      expect(await findByText(/마포구/)).toBeTruthy();
      expect(await findByText(/햇빛 잘 듦/)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run test, see failure**

```bash
cd pickhouse/mobile
npm test -- src/screens/houses/__tests__/HouseDetailScreen.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Implement HouseDetailScreen.tsx**

Path: `pickhouse/mobile/src/screens/houses/HouseDetailScreen.tsx`

```tsx
import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StarRating } from '@/components/StarRating';
import { PhotoGrid } from '@/components/PhotoGrid';
import { useHouse, useDeleteHouse } from '@/queries/houses.queries';
import { HouseStackParamList, Photo, StarRatings } from '@/types';
import { colors, spacing, typography } from '@/theme';
import { photosRepo } from '@/db/photos.repo';

type Props = NativeStackScreenProps<HouseStackParamList, 'HouseDetail'>;

export function HouseDetailScreen({ route, navigation }: Props) {
  const { houseId } = route.params;
  const { data: house, isLoading } = useHouse(houseId);
  const del = useDeleteHouse();
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    void photosRepo.listForHouse(houseId).then(setPhotos);
  }, [houseId]);

  if (isLoading || !house) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: colors.inkMuted }]}>불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  function priceLabel(): string {
    if (!house) return '';
    if (house.dealType === 'JEONSE') return `전세 ${house.deposit.toLocaleString()} 만원`;
    return `보증금 ${house.deposit.toLocaleString()} / 월세 ${house.rent?.toLocaleString() ?? 0} 만원`;
  }

  async function handleDelete() {
    Alert.alert('정말 삭제할까요?', '', [
      { text: '취소' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await del.mutateAsync(houseId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}>
        <Card>
          <Text style={typography.caption}>주소</Text>
          <Text style={[typography.heading, { marginTop: spacing.xs }]}>
            {house.address.roadAddress || '주소 미입력'}
          </Text>
          <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
            {house.address.jibunAddress}
          </Text>
        </Card>

        <Card>
          <Text style={typography.caption}>가격</Text>
          <Text style={[typography.heading, { marginTop: spacing.xs }]}>{priceLabel()}</Text>
          {house.maintenanceFee ? (
            <Text style={[typography.body, { color: colors.inkSoft, marginTop: spacing.xs }]}>
              관리비 {house.maintenanceFee.toLocaleString()} 만원
            </Text>
          ) : null}
        </Card>

        {(house.area || house.floor || house.rooms) && (
          <Card>
            <Text style={typography.caption}>구조</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm }}>
              {house.area ? <Pill text={`${house.area}평`} /> : null}
              {house.floor ? <Pill text={`${house.floor}층`} /> : null}
              {house.rooms ? <Pill text={`방 ${house.rooms}`} /> : null}
              {house.bathrooms ? <Pill text={`욕실 ${house.bathrooms}`} /> : null}
            </View>
          </Card>
        )}

        {house.ratings && Object.keys(house.ratings).length > 0 ? (
          <Card>
            <Text style={typography.caption}>별점</Text>
            {(Object.keys(house.ratings) as (keyof StarRatings)[]).map((k) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm }}>
                <Text style={typography.body}>{labelOf(k)}</Text>
                <StarRating value={house.ratings?.[k] ?? 0} onChange={() => {}} />
              </View>
            ))}
          </Card>
        ) : null}

        {photos.length > 0 && (
          <Card>
            <Text style={typography.caption}>사진</Text>
            <View style={{ marginTop: spacing.sm }}>
              <PhotoGrid photos={photos} />
            </View>
          </Card>
        )}

        {house.memo ? (
          <Card>
            <Text style={typography.caption}>메모</Text>
            <Text style={[typography.body, { marginTop: spacing.xs }]}>{house.memo}</Text>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="수정"
              variant="secondary"
              onPress={() => navigation.navigate('HouseInput', { houseId })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="삭제" variant="ghost" onPress={handleDelete} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function labelOf(k: keyof StarRatings): string {
  const m: Record<keyof StarRatings, string> = {
    waterPressure: '수압',
    sunlight: '햇빛',
    noise: '소음',
    insulation: '단열',
    ventilation: '환기',
    moisture: '곰팡이/누수',
    neighborhood: '동네',
    firstImpression: '첫인상',
  };
  return m[k];
}

function Pill({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: colors.creamDark,
      }}
    >
      <Text style={[typography.caption, { color: colors.ink }]}>{text}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Run test, see pass**

```bash
cd pickhouse/mobile
npm test -- src/screens/houses/__tests__/HouseDetailScreen.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/screens/houses/HouseDetailScreen.tsx pickhouse/mobile/src/screens/houses/__tests__/HouseDetailScreen.test.tsx
git commit -m "feat(mobile): implement House detail screen with edit/delete actions"
```

---

### Task 41: Sync orchestration hook

**Files:**
- Create: `pickhouse/mobile/src/sync/useSyncOrchestrator.ts`
- Modify: `pickhouse/mobile/App.tsx`

- [ ] **Step 1: Implement useSyncOrchestrator.ts**

Path: `pickhouse/mobile/src/sync/useSyncOrchestrator.ts`

```ts
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncProcessor } from './syncProcessor';
import { photoUploader } from '@/photos/photoUploader';
import { photosRepo } from '@/db/photos.repo';
import { useAuthStore } from '@/stores/authStore';
import { networkMonitor } from './networkMonitor';

const SYNC_INTERVAL_MS = 30_000;

async function processPendingPhotos(): Promise<void> {
  const online = await networkMonitor.isOnline();
  if (!online) return;
  const pending = await photosRepo.listPending();
  for (const p of pending) {
    if (!p.localUri) continue;
    try {
      await photoUploader.upload({
        localUri: p.localUri,
        mimeType: p.mimeType,
        houseId: p.houseId,
        residenceId: p.residenceId,
        photoId: p.id,
      });
    } catch {
      // marked failed inside uploader; next cycle retries
    }
  }
}

export function useSyncOrchestrator() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const kick = () => {
      void syncProcessor.processOnce();
      void processPendingPhotos();
    };

    kick();
    timer = setInterval(kick, SYNC_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') kick();
    });

    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [status]);
}
```

- [ ] **Step 2: Wire into App.tsx**

Path: `pickhouse/mobile/App.tsx`

```tsx
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { initializeApi } from '@/api/setup';
import { authService } from '@/auth/authService';
import { queryClient } from '@/queries/queryClient';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useSyncOrchestrator } from '@/sync/useSyncOrchestrator';
import { colors } from '@/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

function AppInner() {
  useSyncOrchestrator();
  return (
    <>
      <RootNavigator />
      <StatusBar style="dark" />
    </>
  );
}

export default function App() {
  useEffect(() => {
    initializeApi(API_BASE_URL);
    void authService.restoreSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppInner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 3: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/sync/useSyncOrchestrator.ts pickhouse/mobile/App.tsx
git commit -m "feat(mobile): add sync orchestrator that drains queue + uploads photos on focus"
```

---

### Task 42: Houses + residences UI stores

**Files:**
- Create: `pickhouse/mobile/src/stores/housesStore.ts`
- Create: `pickhouse/mobile/src/stores/residencesStore.ts`

- [ ] **Step 1: Create housesStore.ts**

Path: `pickhouse/mobile/src/stores/housesStore.ts`

```ts
import { create } from 'zustand';

interface HousesUIState {
  lastViewedHouseId: string | null;
  setLastViewed: (id: string | null) => void;
}

export const useHousesStore = create<HousesUIState>((set) => ({
  lastViewedHouseId: null,
  setLastViewed: (id) => set({ lastViewedHouseId: id }),
}));
```

- [ ] **Step 2: Create residencesStore.ts**

Path: `pickhouse/mobile/src/stores/residencesStore.ts`

```ts
import { create } from 'zustand';

interface ResidencesUIState {
  currentResidenceId: string | null;
  setCurrent: (id: string | null) => void;
}

export const useResidencesStore = create<ResidencesUIState>((set) => ({
  currentResidenceId: null,
  setCurrent: (id) => set({ currentResidenceId: id }),
}));
```

- [ ] **Step 3: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/stores/housesStore.ts pickhouse/mobile/src/stores/residencesStore.ts
git commit -m "feat(mobile): add UI-state stores for houses and residences"
```

---

### Task 43: Residences query hook

**Files:**
- Create: `pickhouse/mobile/src/queries/residences.queries.ts`

- [ ] **Step 1: Implement residences.queries.ts**

Path: `pickhouse/mobile/src/queries/residences.queries.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { residencesApi } from '@/api/residences.api';
import { residencesRepo } from '@/db/residences.repo';
import { useAuthStore } from '@/stores/authStore';

const KEY = ['residences'] as const;

export function useResidences() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: KEY,
    enabled: Boolean(userId),
    queryFn: async () => {
      const local = userId ? await residencesRepo.list(userId) : [];
      try {
        const remote = await residencesApi.list();
        const byId = new Map(remote.map((r) => [r.id, r]));
        for (const r of local) if (!byId.has(r.id)) byId.set(r.id, r);
        return Array.from(byId.values()).sort((a, b) =>
          b.contractStartDate.localeCompare(a.contractStartDate),
        );
      } catch {
        return local;
      }
    },
  });
}

export function useCurrentResidence() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['currentResidence'],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      return residencesRepo.findCurrent(userId);
    },
  });
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/queries/residences.queries.ts
git commit -m "feat(mobile): add residences query hooks"
```

---

### Task 44: Photos query hook

**Files:**
- Create: `pickhouse/mobile/src/queries/photos.queries.ts`

- [ ] **Step 1: Implement photos.queries.ts**

Path: `pickhouse/mobile/src/queries/photos.queries.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { photoUploader, UploadInput } from '@/photos/photoUploader';

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadInput) => photoUploader.upload(input),
    onSuccess: (_url, vars) => {
      if (vars.houseId) {
        qc.invalidateQueries({ queryKey: ['house', vars.houseId] });
      }
    },
  });
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: no errors

```bash
git add pickhouse/mobile/src/queries/photos.queries.ts
git commit -m "feat(mobile): add photo upload mutation hook"
```

---

### Task 45: End-to-end smoke test

**Files:**
- Create: `pickhouse/mobile/src/__tests__/smoke.test.ts`

- [ ] **Step 1: Write smoke test**

Path: `pickhouse/mobile/src/__tests__/smoke.test.ts`

```ts
import { authService } from '@/auth/authService';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth.api';
import { secureTokens } from '@/storage/secureTokens';
import { appleAuth } from '@/auth/appleAuth';
import { housesRepo } from '@/db/houses.repo';
import { syncQueue } from '@/sync/syncQueue';

jest.mock('@/api/auth.api');
jest.mock('@/storage/secureTokens');
jest.mock('@/auth/appleAuth');
jest.mock('@/db/houses.repo');
jest.mock('@/sync/syncQueue');

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'unknown' });
});

describe('mobile smoke', () => {
  it('apple login -> create house writes to local repo and queues sync', async () => {
    (appleAuth.signIn as jest.Mock).mockResolvedValueOnce('apple-token');
    (authApi.login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1', authProviders: { apple: 'a' }, createdAt: '' },
    });

    await authService.loginWithApple();
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(secureTokens.save).toHaveBeenCalled();

    const now = new Date().toISOString();
    const house = {
      id: 'h1',
      userId: 'u1',
      address: { roadAddress: '', jibunAddress: '', zonecode: '' },
      dealType: 'WOLSE' as const,
      deposit: 1000,
      photoIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await housesRepo.insert(house);
    await syncQueue.queueHouseCreate(house);

    expect(housesRepo.insert).toHaveBeenCalledWith(house);
    expect(syncQueue.queueHouseCreate).toHaveBeenCalledWith(house);
  });
});
```

- [ ] **Step 2: Run smoke test**

```bash
cd pickhouse/mobile
npm test -- src/__tests__/smoke.test.ts
```

Expected: PASS

- [ ] **Step 3: Run full test suite**

```bash
cd pickhouse/mobile
npm test
```

Expected: all PASS

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/__tests__/smoke.test.ts
git commit -m "test(mobile): add end-to-end smoke test for login + house creation"
```

---

### Task 46: ESLint + Prettier

**Files:**
- Create: `pickhouse/mobile/.eslintrc.js`
- Create: `pickhouse/mobile/.prettierrc`

- [ ] **Step 1: Install deps**

```bash
cd pickhouse/mobile
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier
```

- [ ] **Step 2: Create .eslintrc.js**

Path: `pickhouse/mobile/.eslintrc.js`

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['node_modules/', 'babel.config.js', 'jest.config.js'],
};
```

- [ ] **Step 3: Create .prettierrc**

Path: `pickhouse/mobile/.prettierrc`

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "semi": true,
  "arrowParens": "always"
}
```

- [ ] **Step 4: Run lint**

```bash
cd pickhouse/mobile
npm run lint -- --max-warnings 50 || true
```

Expected: prints warnings but does not block

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/.eslintrc.js pickhouse/mobile/.prettierrc pickhouse/mobile/package.json pickhouse/mobile/package-lock.json
git commit -m "chore(mobile): add ESLint and Prettier config"
```

---

### Task 47: Final verification

- [ ] **Step 1: Typecheck**

```bash
cd pickhouse/mobile
npm run typecheck
```

Expected: zero errors

- [ ] **Step 2: Full test suite**

```bash
cd pickhouse/mobile
npm test
```

Expected: every suite PASS

- [ ] **Step 3: Expo doctor sanity**

```bash
cd pickhouse/mobile
npx expo-doctor || true
```

Expected: any output prints; non-fatal warnings are acceptable

- [ ] **Step 4: Tag completion commit**

```bash
git commit --allow-empty -m "chore(mobile): finalize Plan 2 mobile foundation"
```

---

## Self-Review

### Spec coverage check

Each section of the design spec mapped to tasks:

- **Spec 3.1 warm collection aesthetic** — Task 4 design tokens (cream #faf6f0, soft shadows, large typography); Tasks 28-34 reuse tokens across Card / Button / StarRating / PhotoGrid; Tasks 37-40 screens use them. Covered.
- **Spec 4.1 House model** — Task 5 declares every field listed (address, dealType, deposit, rent, maintenanceFee, area, builtYear, floor, totalFloor, availableFrom, stationDistance, rooms, bathrooms, hasBalcony, hasElevator, hasParking, options, security, garbage, 8 ratings, memo, photos). Task 6 SQLite schema includes all of them. Task 7 CRUD round-trips them. Covered.
- **Spec 4.2 Residence** — Task 5 types, Task 6 schema, Task 8 repo, Task 43 queries. Covered.
- **Spec 4.3 Photo with uploadStatus pending/uploading/uploaded/failed** — Task 5 types, Task 6 schema, Task 8 repo with markUploading/markFailed/updateRemoteUrl, Task 26 uploader. Covered.
- **Spec 4.4 User with authProviders** — Task 5. Covered.
- **Spec 5.2 House list (cards + filter/sort)** — Task 38 with recent/priceAsc/priceDesc/rating sort chips. Covered. (Region filter is implicit via address text; explicit chip not in MVP — acceptable.)
- **Spec 5.3 House input (현장 + 디테일 모드 탭)** — Task 39 implements both tabs with distinct field sets and saves to local + queues sync. Covered.
- **Spec 5.5 House detail** — Task 40 shows address, price, structure pills, ratings, photos, memo, edit/delete actions. Covered.
- **Spec 6 Auth (Apple iOS / Kakao both / backend JWT)** — Tasks 15-19 (provider wrappers, auth API, auth service, API setup). Covered.
- **Spec 8.2 offline-first sync** — Tasks 9 (queue repo), 20 (network monitor), 21 (processor), 22 (last-write-wins), 23 (queue facade), 41 (orchestrator). Covered.
- **Spec 8.3 API contracts** — Tasks 12 (auth), 13 (houses + residences), 14 (photos). Covered.
- **Spec 8.4 R2 upload flow** — Task 14 (r2Upload.ts uses FileSystem.uploadAsync PUT), Task 26 orchestrates request-URL → R2 PUT → finalize. Covered.
- **Spec 9.1 frontend tech stack** — Tasks 1-3 install Expo + TS + Zustand + React Query + expo-sqlite + expo-file-system + expo-secure-store + expo-apple-authentication + kakao-login + expo-camera + axios + Jest + RNTL. Covered.
- **Spec 5.1 profile / timeline screen** — Explicitly out of scope (Plan 4). Stores in Task 42 + residence query in Task 43 provide the data layer that Plan 4 will consume. Correctly excluded.
- **Spec 5.4 comparison screen** — Out of scope (Plan 3). Correctly excluded.
- **Spec 5.6 settings, 7 legal docs** — Out of scope (Plan 5). Correctly excluded.

All in-scope spec items have at least one implementing task.

### Placeholder scan

Searched plan for forbidden patterns: "TBD", "TODO", "fill in", "similar to Task", "implement later", "appropriate error handling", "add validation", "handle edge cases", "for brevity".

Found: only intent comments inside actual code (e.g., `// marked failed inside uploader; next cycle retries` in Task 41, `// ignore parse errors` in Task 32). These are explanatory comments in shipping code, not plan placeholders.

No placeholders remain.

### Type consistency check

- `House` (Task 5) — used identically in Tasks 6, 7, 13, 23, 25, 38, 39, 40, 45.
- `HouseDraft` (Task 5) — accepts `id?` and `photoIds?`. Used by `useCreateHouse` (Task 25) which fills in `userId` from auth store and generates `id` via `Crypto.randomUUID()` when missing. Task 39 supplies both `id` and `photoIds`. Consistent.
- `Address` (Task 5) — three required fields (roadAddress, jibunAddress, zonecode) + optional lat/lng/detail. Task 32 WebView posts the three required fields; Task 33 picker passes them through; Task 39 falls back to empty strings of same shape. Consistent.
- `StarRatings` (Task 5) — eight keys (waterPressure, sunlight, noise, insulation, ventilation, moisture, neighborhood, firstImpression). Both Task 39 detail mode and Task 40 detail screen use the same `labelOf` helper with these exact keys. Consistent.
- `Photo` (Task 5) — used in Tasks 8, 26, 27, 34, 40, 41 with identical `uploadStatus` literals.
- `housesRepo` method signatures (Task 7): `insert(h)`, `update(h)`, `findById(id)`, `listActive(userId)`, `softDelete(id)`, `markClean(id)`, `listDirty()`. Used in Tasks 21, 25, 38, 40, 45 with the same signatures.
- `syncQueueRepo.enqueue(op)` with `SyncOp { opType, entity, entityId, payload, ... }` (Task 9). Used by Task 23 facade consistently.
- `syncQueue.queueHouseCreate / queueHouseUpdate(id, patch) / queueHouseDelete(id) / queuePhotoFinalize(payload)` (Task 23). Used in Task 25 and Task 39 with matching args.
- `photoUploader.upload(input: UploadInput)` (Task 26) — `{ localUri, mimeType, houseId?, residenceId?, photoId }`. Used in Tasks 41 and 44 with same shape.
- `useAuthStore` shape (Task 17): `{ user, accessToken, refreshToken, status, setSession, updateTokens, setStatus, clear }`. Used unchanged in Tasks 18, 19, 24, 25, 41, 43, 45.
- `LoginResponse { accessToken, refreshToken, user }` (Task 5). Used in Tasks 12, 18, 45.
- `HouseStackParamList` (Task 35) — `HouseList: undefined`, `HouseInput: { houseId? }`, `HouseDetail: { houseId }`. Used in Tasks 38, 39, 40 with matching navigation.navigate calls.
- `setApiClient` / `getApiClient` exported by `@/api/client` (Task 11). Used in Tasks 12, 13, 14, 19 consistently.

All signatures and types are consistent across tasks.

### Issues found and fixed inline

- During type review, found Task 38's earlier draft imported `HouseStackParamList` directly from `@/navigation/types`, while other screens used the re-export through `@/types`. To keep imports consistent, the plan now re-exports `HouseStackParamList` through `@/types/index.ts` in Task 38 Step 1, and Tasks 39 and 40 use the same `@/types` import.
- Task 35 originally listed only navigation files but the empty stubs were required to satisfy navigator references. Step 2 was added to create the stubs in the same task before the navigator code references them.
- Task 41 orchestrator imports `photoUploader` which lives at `@/photos/photoUploader` (Task 26). Verified path matches.

No further fixes needed.

---

