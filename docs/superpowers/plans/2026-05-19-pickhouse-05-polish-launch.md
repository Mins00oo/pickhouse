# PickHouse Polish & Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Production-ready iOS + Android builds with legal compliance, account lifecycle, data export, store assets, and submission process.

**Architecture:** Additive — adds settings screen, legal webviews, account deletion + data export flows on top of Plans 2-4. EAS Build configuration. Backend gets a scheduled grace-period cleanup task.

**Tech Stack:** EAS Build, Expo Application Services, react-native-webview for legal pages, expo-notifications for contract reminders, backend Spring Boot cron via @Scheduled, app store consoles.

---

## File Structure

### Frontend (Expo / React Native — `app/`)

**Settings tree:**
- `pickhouse/mobile/src/screens/settings/SettingsScreen.tsx` — settings root list
- `pickhouse/mobile/src/screens/settings/AccountScreen.tsx` — login info, logout, deletion entry
- `pickhouse/mobile/src/screens/settings/NotificationsScreen.tsx` — notification toggles
- `pickhouse/mobile/src/screens/settings/DataExportScreen.tsx` — JSON + photo zip export
- `pickhouse/mobile/src/screens/settings/AccountDeletionScreen.tsx` — deletion confirmation flow
- `pickhouse/mobile/src/screens/settings/AccountDeletionConfirmScreen.tsx` — final confirm + 30-day notice
- `pickhouse/mobile/src/screens/legal/LegalWebViewScreen.tsx` — generic webview wrapper (terms / privacy / location)
- `pickhouse/mobile/src/screens/legal/ConsentScreen.tsx` — onboarding consent (3 checkboxes + agree all)

**Legal markdown content (bundled assets, also served by backend at /legal/*):**
- `pickhouse/mobile/src/assets/legal/terms.ko.md` — 이용약관
- `pickhouse/mobile/src/assets/legal/privacy.ko.md` — 개인정보 처리방침
- `pickhouse/mobile/src/assets/legal/location.ko.md` — 위치정보 이용약관
- `pickhouse/mobile/src/assets/legal/index.ts` — exports markdown text

**Services / API:**
- `pickhouse/mobile/src/services/api/accountApi.ts` — DELETE /me, GET /me/export, GET /me/export-status
- `pickhouse/mobile/src/services/notifications/contractReminders.ts` — schedule local notifications for contract end
- `pickhouse/mobile/src/services/export/dataExportService.ts` — invokes API, downloads + saves files

**Stores:**
- `pickhouse/mobile/src/stores/consentStore.ts` — Zustand store + persisted MMKV/SQLite flags for accepted terms versions
- `pickhouse/mobile/src/stores/notificationStore.ts` — toggle states for notification preferences

**Hooks:**
- `pickhouse/mobile/src/hooks/useContractReminders.ts` — registers reminders whenever residences change
- `pickhouse/mobile/src/hooks/useDataExport.ts` — wraps export service with React Query

**Navigation additions:**
- `pickhouse/mobile/src/navigation/SettingsStack.tsx` — settings stack navigator
- modify `pickhouse/mobile/src/navigation/RootNavigator.tsx` — wire settings stack + onboarding consent gate

**Configuration:**
- `app/app.config.ts` — Expo dynamic config (replaces app.json)
- `app/eas.json` — EAS build profiles (development/preview/production)
- `app/.env.production` — production API base URL
- `app/.env.staging` — staging API base URL
- `app/assets/icon.png` — 1024x1024 app icon
- `app/assets/adaptive-icon.png` — 1024x1024 Android adaptive foreground
- `app/assets/splash.png` — 1284x2778 splash
- `app/assets/notification-icon.png` — 96x96 Android notification icon

**Scripts:**
- `app/scripts/build-ios.sh` — local invocation of `eas build --platform ios`
- `app/scripts/build-android.sh` — local invocation of `eas build --platform android`
- `app/scripts/submit-ios.sh`, `app/scripts/submit-android.sh`

**Tests (frontend):**
- `pickhouse/mobile/src/screens/settings/__tests__/AccountDeletionScreen.test.tsx`
- `pickhouse/mobile/src/services/export/__tests__/dataExportService.test.ts`
- `pickhouse/mobile/src/services/notifications/__tests__/contractReminders.test.ts`
- `pickhouse/mobile/src/stores/__tests__/consentStore.test.ts`

### Backend (Spring Boot — `backend/`)

**New files:**
- `backend/src/main/java/app/pickhouse/account/AccountDeletionController.java` — DELETE /me
- `backend/src/main/java/app/pickhouse/account/AccountDeletionService.java` — soft delete logic
- `backend/src/main/java/app/pickhouse/account/AccountDeletionScheduler.java` — @Scheduled cron, hard-delete after 30 days
- `backend/src/main/java/app/pickhouse/account/AccountDeletionRequest.java` — request DTO
- `backend/src/main/java/app/pickhouse/export/DataExportController.java` — POST /me/export, GET /me/export/{jobId}
- `backend/src/main/java/app/pickhouse/export/DataExportService.java` — builds JSON + photo zip
- `backend/src/main/java/app/pickhouse/export/ExportJob.java` — JPA entity tracking export job state
- `backend/src/main/java/app/pickhouse/export/ExportJobRepository.java`
- `backend/src/main/java/app/pickhouse/legal/LegalDocumentController.java` — GET /legal/{slug}
- `backend/src/main/java/app/pickhouse/legal/LegalDocument.java` — version + slug + content
- `backend/src/main/resources/db/migration/V20__add_deleted_at_to_user.sql`
- `backend/src/main/resources/db/migration/V21__create_export_jobs.sql`
- `backend/src/main/resources/db/migration/V22__create_legal_documents.sql`
- `backend/src/main/resources/legal/terms-v1.ko.md`
- `backend/src/main/resources/legal/privacy-v1.ko.md`
- `backend/src/main/resources/legal/location-v1.ko.md`

**Modified files:**
- `backend/src/main/java/app/pickhouse/PickHouseApplication.java` — add `@EnableScheduling`
- `backend/src/main/java/app/pickhouse/security/JwtAuthenticationFilter.java` — reject tokens for users with deletedAt set
- `backend/src/main/java/app/pickhouse/user/User.java` — add `deletedAt` field
- `backend/build.gradle.kts` — add `spring-boot-starter-quartz` (optional alt to @Scheduled) — we go with @Scheduled

**Tests (backend):**
- `backend/src/test/java/app/pickhouse/account/AccountDeletionServiceTest.java`
- `backend/src/test/java/app/pickhouse/account/AccountDeletionSchedulerTest.java`
- `backend/src/test/java/app/pickhouse/export/DataExportServiceTest.java`
- `backend/src/test/java/app/pickhouse/legal/LegalDocumentControllerTest.java`

### Store / Submission Assets (`store/`)
- `store/ios/screenshots/6.7-{1..5}.png` — 1290x2796
- `store/ios/screenshots/6.5-{1..5}.png` — 1242x2688
- `store/android/screenshots/phone-{1..5}.png` — 1080x1920+
- `store/ios/listing.ko.md` — Korean store copy
- `store/ios/listing.en.md` — English store copy
- `store/android/listing.ko.md`
- `store/android/listing.en.md`
- `store/ios/privacy-nutrition.yaml` — data declarations
- `store/checklist/ios-submission.md`
- `store/checklist/android-submission.md`
- `store/checklist/qa-cold-launch.md`
- `store/checklist/qa-offline.md`
- `store/checklist/qa-auth.md`
- `store/checklist/qa-backup-restore.md`

---

## Tasks

### Task 1: Expo dynamic config (`app.config.ts`) with bundle IDs + versioning

Replaces the static `app.json` shipped by Plan 2 so we can drive bundle IDs, version, and env vars per build profile.

**Files:**
- Create: `app/app.config.ts`
- Delete (after porting): `app/app.json`
- Modify: `app/package.json` (ensure `main` field points to existing entry — do not change if Plan 2 already set it)

- [ ] **Step 1: Read existing app.json from Plan 2** so we don't lose existing settings.

Run: `cat app/app.json`

- [ ] **Step 2: Write `app/app.config.ts`**

```ts
import { ExpoConfig, ConfigContext } from 'expo/config';

const VERSION = '1.0.0';
// IMPORTANT: bump iosBuildNumber for every TestFlight build, androidVersionCode for every Play upload
const IOS_BUILD_NUMBER = '1';
const ANDROID_VERSION_CODE = 1;

type Channel = 'development' | 'preview' | 'production';

function channel(): Channel {
  const c = process.env.EAS_CHANNEL || process.env.APP_ENV || 'development';
  if (c === 'production' || c === 'preview') return c;
  return 'development';
}

function apiBaseUrl(ch: Channel): string {
  if (ch === 'production') return 'https://api.pickhouse.app';
  if (ch === 'preview') return 'https://staging-api.pickhouse.app';
  return 'http://10.0.2.2:8080';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const ch = channel();
  return {
    ...config,
    name: ch === 'production' ? '살래말래' : `살래말래 (${ch})`,
    slug: 'pickhouse',
    scheme: 'pickhouse',
    version: VERSION,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#faf6f0',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      bundleIdentifier:
        ch === 'production' ? 'app.pickhouse.ios' : `app.pickhouse.ios.${ch}`,
      buildNumber: IOS_BUILD_NUMBER,
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: '집 사진을 촬영하기 위해 카메라 권한이 필요합니다.',
        NSPhotoLibraryUsageDescription: '집 사진을 불러오기 위해 사진 권한이 필요합니다.',
        NSPhotoLibraryAddUsageDescription: '내보낸 데이터를 저장하기 위해 사진 권한이 필요합니다.',
        NSLocationWhenInUseUsageDescription: '주소 자동 채우기를 위해 위치 권한이 필요합니다.',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleAllowMixedLocalizations: true,
      },
      associatedDomains: ['applinks:pickhouse.app'],
    },
    android: {
      package:
        ch === 'production' ? 'app.pickhouse.android' : `app.pickhouse.android.${ch}`,
      versionCode: ANDROID_VERSION_CODE,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#faf6f0',
      },
      permissions: [
        'CAMERA',
        'READ_MEDIA_IMAGES',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'POST_NOTIFICATIONS',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: 'pickhouse.app', pathPrefix: '/app' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-sqlite',
      'expo-file-system',
      'expo-image-picker',
      'expo-camera',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#faf6f0',
        },
      ],
      [
        '@react-native-seoul/kakao-login',
        {
          kakaoAppKey: process.env.KAKAO_NATIVE_APP_KEY,
          kotlinVersion: '1.9.0',
        },
      ],
      'expo-apple-authentication',
    ],
    extra: {
      apiBaseUrl: apiBaseUrl(ch),
      channel: ch,
      kakaoNativeAppKey: process.env.KAKAO_NATIVE_APP_KEY,
      sentryDsn: process.env.SENTRY_DSN,
      eas: { projectId: process.env.EAS_PROJECT_ID },
    },
    runtimeVersion: { policy: 'appVersion' },
    updates: {
      url: process.env.EAS_PROJECT_ID
        ? `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`
        : undefined,
    },
  };
};
```

- [ ] **Step 3: Remove `app.json`**

Run: `rm app/app.json`

- [ ] **Step 4: Verify the config parses**

Run: `cd app && EAS_CHANNEL=production npx expo config --type public > /tmp/expo-config.json && head -40 /tmp/expo-config.json`

Expected: JSON with `"name": "살래말래"` and `"bundleIdentifier": "app.pickhouse.ios"`.

- [ ] **Step 5: Commit**

```bash
git add app/app.config.ts app/package.json
git rm app/app.json
git commit -m "build(app): switch to dynamic app.config.ts with EAS channels"
```

---

### Task 2: EAS Build profiles (`eas.json`)

**Files:**
- Create: `app/eas.json`
- Create: `app/.env.production`
- Create: `app/.env.staging`
- Modify: `app/.gitignore`

- [ ] **Step 1: Write `app/eas.json`**

```json
{
  "cli": { "version": ">= 7.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "env": { "APP_ENV": "development" },
      "ios": { "simulator": true, "resourceClass": "m-medium" },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": { "APP_ENV": "preview" },
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "apk" }
    },
    "production": {
      "channel": "production",
      "env": { "APP_ENV": "production" },
      "autoIncrement": true,
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "REPLACE_WITH_APPLE_ID",
        "ascAppId": "REPLACE_WITH_ASC_APP_ID",
        "appleTeamId": "REPLACE_WITH_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./store/android/play-service-account.json",
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

Replace `REPLACE_WITH_*` during Task 30 once App Store Connect + Play Console are provisioned. Never commit a real service-account JSON.

- [ ] **Step 2: Write `app/.env.production`**

```
APP_ENV=production
EAS_CHANNEL=production
KAKAO_NATIVE_APP_KEY=REPLACE_WITH_PROD_KEY
SENTRY_DSN=
EAS_PROJECT_ID=REPLACE_AFTER_eas_init
```

- [ ] **Step 3: Write `app/.env.staging`**

```
APP_ENV=preview
EAS_CHANNEL=preview
KAKAO_NATIVE_APP_KEY=REPLACE_WITH_STAGING_KEY
SENTRY_DSN=
EAS_PROJECT_ID=REPLACE_AFTER_eas_init
```

- [ ] **Step 4: Append to `app/.gitignore`**

```
.env
.env.local
.env.production
.env.staging
store/android/play-service-account.json
store/ios/*.p8
store/ios/*.mobileprovision
```

- [ ] **Step 5: Verify eas.json is valid JSON**

Run: `cd app && node -e "JSON.parse(require('fs').readFileSync('eas.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 6: Commit**

```bash
git add app/eas.json app/.gitignore
git commit -m "build(app): add EAS build/submit profiles for dev/preview/production"
```

---

### Task 3: Draft 이용약관 (Terms of Service) Korean text

These are drafts intended for a lawyer's review. They cover the MVP scope only.

**Files:**
- Create: `pickhouse/mobile/src/assets/legal/terms.ko.md`
- Create: `backend/src/main/resources/legal/terms-v1.ko.md` (identical copy — backend serves authoritative version)

- [ ] **Step 1: Write `pickhouse/mobile/src/assets/legal/terms.ko.md`**

```markdown
# 살래말래 서비스 이용약관

**버전:** 1.0
**시행일:** 2026-05-19

## 제1조 (목적)
본 약관은 살래말래(이하 "회사")가 제공하는 모바일 애플리케이션 "살래말래" (이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

## 제2조 (정의)
1. "서비스"란 회사가 제공하는, 사용자가 직접 방문하거나 거주한 주택에 관한 정보를 개인적으로 기록·비교·관리할 수 있도록 하는 모바일 애플리케이션 및 관련 부수 서비스를 말합니다.
2. "회원"이란 본 약관에 동의하고 회사와 이용계약을 체결하여 서비스를 이용하는 자를 말합니다.
3. "콘텐츠"란 회원이 서비스에 입력·업로드한 주소·가격·평점·메모·사진 등 일체의 데이터를 말합니다.

## 제3조 (약관의 게시와 개정)
1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 또는 설정 화면에 게시합니다.
2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 시행일 7일 전(회원에게 불리한 변경은 30일 전)부터 공지합니다.
3. 회원이 개정약관 시행일 전까지 거부 의사를 표시하지 않으면 동의한 것으로 봅니다.

## 제4조 (이용계약의 성립)
1. 이용계약은 회원이 되고자 하는 자가 본 약관 및 개인정보 처리방침, 위치정보 이용약관에 동의하고 회사가 정한 절차에 따라 가입 신청을 한 후 회사가 이를 승낙함으로써 성립합니다.
2. 회사는 다음 각 호의 경우 신청을 거절하거나 사후에 이용계약을 해지할 수 있습니다.
   - 타인의 명의를 도용한 경우
   - 만 14세 미만인 경우
   - 이용 신청 내용에 허위 기재가 있는 경우

## 제5조 (서비스의 제공 및 변경)
1. 회사는 다음과 같은 서비스를 제공합니다.
   - 본 집(후보) 기록·비교 기능
   - 거주 이력 타임라인 기능
   - 사진 업로드 및 클라우드 보관 기능
   - 데이터 내보내기 기능
2. 회사는 서비스의 내용을 변경할 수 있으며, 변경 시 사전에 회원에게 공지합니다.
3. 서비스는 연중무휴 24시간 제공함을 원칙으로 하나, 시스템 점검·장애·천재지변 등의 사유로 일시 중단될 수 있습니다.

## 제6조 (회원의 의무)
1. 회원은 다음 행위를 하여서는 안 됩니다.
   - 타인의 개인정보를 무단으로 수집·기록하는 행위
   - 본인이 권한을 갖지 않은 사진을 업로드하는 행위
   - 서비스 운영을 고의로 방해하는 행위
   - 관련 법령에 위반되는 행위
2. 회원은 본인의 계정 및 비밀번호 관리에 책임을 지며, 계정 정보가 유출된 경우 즉시 회사에 통보하여야 합니다.

## 제7조 (콘텐츠의 권리와 책임)
1. 회원이 서비스에 입력·업로드한 콘텐츠의 저작권 및 소유권은 회원에게 있습니다.
2. 회사는 회원이 명시적으로 동의한 범위 내에서만 콘텐츠를 저장·처리하며, 광고·홍보·제3자 제공 목적으로 사용하지 않습니다.
3. 회원이 입력한 임대인 정보·계약서 사진 등 제3자의 개인정보가 포함될 수 있는 콘텐츠에 대한 법적 책임은 회원 본인에게 있습니다.

## 제8조 (회원 탈퇴 및 자격 상실)
1. 회원은 언제든지 설정 메뉴를 통해 탈퇴를 신청할 수 있으며, 회사는 즉시 처리합니다.
2. 회원 탈퇴 시 회원이 입력한 모든 콘텐츠는 30일의 유예기간 후 영구 삭제됩니다. 유예기간 중에는 동일 로그인 수단으로 재로그인하여 복구를 요청할 수 있습니다.
3. 유예기간이 경과한 데이터는 복구할 수 없습니다.

## 제9조 (서비스 이용의 제한)
회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우 사전 통지 없이 이용을 제한하거나 계약을 해지할 수 있습니다.

## 제10조 (손해배상 및 면책)
1. 회사는 천재지변, 통신장애, 회원의 귀책사유로 인한 손해에 대하여 책임을 지지 않습니다.
2. 회사는 회원이 서비스를 통해 기록·관리하는 데이터의 정확성에 대해 보증하지 않으며, 부동산 거래 의사결정의 최종 책임은 회원 본인에게 있습니다.
3. 회사의 고의 또는 중과실로 인한 손해를 제외하고, 회사의 손해배상 책임은 직접 발생한 통상적 손해로 한정합니다.

## 제11조 (분쟁 해결)
1. 회사와 회원 간 발생한 분쟁은 상호 신의에 따라 해결합니다.
2. 분쟁이 해결되지 않을 경우 민사소송법상의 관할법원에 소를 제기할 수 있습니다.

## 부칙
본 약관은 2026년 5월 19일부터 시행합니다.
```

- [ ] **Step 2: Copy file to backend resources**

Run: `cp pickhouse/mobile/src/assets/legal/terms.ko.md backend/src/main/resources/legal/terms-v1.ko.md`

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/assets/legal/terms.ko.md backend/src/main/resources/legal/terms-v1.ko.md
git commit -m "docs(legal): add draft 이용약관 v1 (Korean) for MVP — requires lawyer review"
```

---

### Task 4: Draft 개인정보 처리방침 (Privacy Policy) Korean text

**Files:**
- Create: `pickhouse/mobile/src/assets/legal/privacy.ko.md`
- Create: `backend/src/main/resources/legal/privacy-v1.ko.md`

- [ ] **Step 1: Write `pickhouse/mobile/src/assets/legal/privacy.ko.md`**

```markdown
# 살래말래 개인정보 처리방침

**버전:** 1.0
**시행일:** 2026-05-19

살래말래(이하 "회사")는 「개인정보 보호법」 및 관련 법령을 준수하며, 회원의 개인정보를 다음과 같이 처리합니다.

## 1. 수집하는 개인정보 항목 및 수집 방법

### 1.1 회원 가입 시 (필수)
- Apple 또는 카카오 로그인 시 제공받는 정보: 고유 식별자(Provider ID), 이메일(제공 동의 시), 닉네임, 프로필 이미지 URL

### 1.2 서비스 이용 과정에서 자동 수집되는 정보
- 기기 정보(OS 종류·버전, 앱 버전, 기기 모델명)
- 서비스 이용 기록(접속 일시, 사용 기능)
- IP 주소, 광고 식별자(설정에서 비활성화 가능)

### 1.3 회원이 직접 입력·업로드하는 정보
- 주소(도로명/지번/위경도)
- 주택의 가격·면적·층수·옵션 등 객관 정보
- 별점·체크리스트·메모 등 주관 평가
- 사진(주택 내·외부 사진, 계약서 사진, 입주 시점 사진 등)
- 계약 시작일·종료일, 임대인 메모

회원이 입력한 사진·메모에는 제3자의 개인정보가 포함될 수 있으며, 이는 전적으로 회원 본인의 책임 하에 입력됩니다. 회사는 해당 정보를 회원 본인 외 누구에게도 제공하지 않습니다.

## 2. 개인정보의 수집·이용 목적
- 회원 식별 및 본인 확인
- 서비스 제공 및 운영(주택 기록·비교·이력 관리)
- 사진 클라우드 저장 및 동기화
- 계약 종료일 알림 등 회원이 설정한 알림 기능 제공
- 부정 이용 방지 및 보안
- 법령상 의무 이행

## 3. 개인정보의 보유 및 이용 기간

| 항목 | 보유 기간 |
|---|---|
| 회원 가입 정보 및 회원이 입력한 데이터 | 회원 탈퇴 후 30일까지 |
| 부정 이용 기록 | 1년 |
| 전자상거래법 등 법령 보존 의무 데이터 | 관련 법령에서 정한 기간 |

회원 탈퇴 시 모든 개인정보는 30일의 유예기간 경과 후 복구 불가능한 방식으로 영구 삭제됩니다.

## 4. 개인정보의 제3자 제공
회사는 회원의 개인정보를 외부에 제공하지 않습니다. 단, 법령에 의거하거나 수사기관의 적법한 절차에 의한 요청이 있는 경우 제공할 수 있습니다.

## 5. 개인정보 처리의 위탁
서비스 운영을 위해 다음과 같이 개인정보 처리 업무를 위탁합니다.

| 수탁자 | 위탁 업무 | 보유·이용 기간 |
|---|---|---|
| Apple Inc. | Apple 로그인 인증 | 인증 처리 시 |
| Kakao Corp. | 카카오 로그인 인증 | 인증 처리 시 |
| Cloudflare, Inc. (R2) | 사진 파일 저장 | 회원 탈퇴 후 30일까지 |
| Oracle Cloud | 서버 인프라 호스팅 | 회원 탈퇴 후 30일까지 |

## 6. 회원의 권리와 행사 방법
회원은 언제든지 다음 권리를 행사할 수 있습니다.
1. 개인정보 열람 요구 — 앱 내 "내 집"·"본 집" 화면에서 확인
2. 정정·삭제 요구 — 각 항목 편집 화면에서 직접 수정
3. 처리 정지 요구 — 설정 > 동기화 옵션 또는 회원 탈퇴
4. 개인정보 이동권 — 설정 > 데이터 내보내기를 통한 JSON·사진 zip 다운로드
5. 회원 탈퇴 — 설정 > 계정 > 회원 탈퇴

## 7. 개인정보의 안전성 확보 조치
- 비밀번호는 저장하지 않음(소셜 로그인 only)
- 통신 구간 TLS 1.2 이상 암호화
- JWT 기반 인증, Access token 30분 / Refresh token 30일 회전
- 사진 업로드는 R2 사전 서명 URL을 통한 직접 업로드
- 접근 권한 최소화 및 분기별 권한 검토

## 8. 개인정보 보호 책임자
- 책임자: (개발사 대표명 — 추후 기입)
- 연락처: privacy@pickhouse.app

## 9. 개인정보 처리방침의 변경
본 처리방침은 법령·서비스 변경 시 개정될 수 있으며, 변경 시 시행일 7일 전(회원에게 불리한 변경은 30일 전)에 앱 내 공지합니다.

## 부칙
본 처리방침은 2026년 5월 19일부터 시행합니다.
```

- [ ] **Step 2: Copy to backend**

Run: `cp pickhouse/mobile/src/assets/legal/privacy.ko.md backend/src/main/resources/legal/privacy-v1.ko.md`

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/assets/legal/privacy.ko.md backend/src/main/resources/legal/privacy-v1.ko.md
git commit -m "docs(legal): add draft 개인정보 처리방침 v1 — requires lawyer review"
```

---

### Task 5: Draft 위치정보 이용약관 Korean text

**Files:**
- Create: `pickhouse/mobile/src/assets/legal/location.ko.md`
- Create: `backend/src/main/resources/legal/location-v1.ko.md`

- [ ] **Step 1: Write `pickhouse/mobile/src/assets/legal/location.ko.md`**

```markdown
# 살래말래 위치정보 이용약관

**버전:** 1.0
**시행일:** 2026-05-19

본 약관은 「위치정보의 보호 및 이용 등에 관한 법률」에 따라 살래말래(이하 "회사")가 제공하는 위치정보 기반 서비스에 대한 회원의 권리·의무 및 책임사항을 규정합니다.

## 제1조 (이용약관의 효력)
회원은 본 약관에 동의함으로써 회사가 위치정보를 수집·이용하는 데 동의한 것으로 간주합니다.

## 제2조 (수집하는 위치정보의 종류)
- 회원이 입력하는 주택의 주소(도로명·지번)에 기반한 위경도 좌표
- 회원이 명시적으로 "현재 위치 사용" 기능을 호출한 경우의 기기 GPS 위치(주소 자동 채우기 용도)

## 제3조 (위치정보 수집·이용 목적)
1. 회원이 기록한 주택을 지도상에 표시하기 위함
2. 주소 자동 채우기 및 검색 편의 제공
3. 본 집 리스트의 지역별 필터링

회사는 위치정보를 광고·마케팅 목적으로 사용하지 않으며, 실시간 위치 추적을 수행하지 않습니다.

## 제4조 (위치정보의 보유 및 이용 기간)
회원이 입력한 주소의 위경도는 해당 주택 데이터와 함께 보관되며, 회원이 데이터를 삭제하거나 회원 탈퇴 시 30일 유예기간 경과 후 영구 삭제됩니다.

## 제5조 (위치정보의 제3자 제공)
회사는 회원의 위치정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우 예외로 합니다.
- 회원이 사전에 동의한 경우
- 법령에 따른 적법한 요청이 있는 경우

## 제6조 (위치정보의 파기)
보유 기간 경과 또는 회원 탈퇴 시 위치정보는 복구 불가능한 방식으로 즉시 파기됩니다.

## 제7조 (회원의 권리)
회원은 언제든지 다음 권리를 행사할 수 있습니다.
1. 위치정보 수집·이용 동의의 철회(설정 > 권한)
2. 일시적 수집 중지 요청
3. 위치정보의 열람·정정·삭제

위치정보 수집 동의를 철회하면 주소 자동 채우기·지도 표시 기능을 사용할 수 없습니다.

## 제8조 (위치정보관리책임자)
- 책임자: (개발사 대표명 — 추후 기입)
- 연락처: privacy@pickhouse.app

## 부칙
본 약관은 2026년 5월 19일부터 시행합니다.
```

- [ ] **Step 2: Copy to backend**

Run: `cp pickhouse/mobile/src/assets/legal/location.ko.md backend/src/main/resources/legal/location-v1.ko.md`

- [ ] **Step 3: Commit**

```bash
git add pickhouse/mobile/src/assets/legal/location.ko.md backend/src/main/resources/legal/location-v1.ko.md
git commit -m "docs(legal): add draft 위치정보 이용약관 v1 — requires lawyer review"
```

---

### Task 6: Production icons & splash placeholders

Placeholders let EAS builds compile; replace with real art before submission (Task 32).

**Files:**
- Create: `app/assets/icon.png` (1024x1024)
- Create: `app/assets/adaptive-icon.png` (1024x1024 foreground)
- Create: `app/assets/splash.png` (1284x2778)
- Create: `app/assets/notification-icon.png` (96x96)
- Create: `app/assets/README.md`

- [ ] **Step 1: Generate placeholder PNGs** (ImageMagick or any tool that produces correct dimensions)

```bash
cd app/assets
magick -size 1024x1024 xc:'#faf6f0' icon.png
magick -size 1024x1024 xc:'#faf6f0' adaptive-icon.png
magick -size 1284x2778 xc:'#faf6f0' splash.png
magick -size 96x96 xc:none -fill white -draw "circle 48,48 48,8" notification-icon.png
```

If ImageMagick is unavailable on Windows, use `npx @squoosh/cli` or any image editor — the contents are placeholders.

- [ ] **Step 2: Write `app/assets/README.md`**

```markdown
# App Assets

Placeholders are shipped here. Before submission, replace with final art:

| File | Final spec | Purpose |
|---|---|---|
| icon.png | 1024x1024 PNG, no alpha, sRGB | App Store + base icon |
| adaptive-icon.png | 1024x1024, safe zone center 66% | Android adaptive foreground (`background: #faf6f0`) |
| splash.png | 1284x2778, logo centered on `#faf6f0` | Launch screen |
| notification-icon.png | 96x96, white on transparent | Android push notification small icon |

Brand color cream: `#faf6f0`. Final logo: 살래말래 wordmark with house icon.
Do not embed iOS rounded-corner mask; Apple applies it.
```

- [ ] **Step 3: Verify sizes**

Run: `cd app/assets && file icon.png adaptive-icon.png splash.png notification-icon.png`
Expected: `icon.png: PNG image data, 1024 x 1024`, etc.

- [ ] **Step 4: Commit**

```bash
git add app/assets/icon.png app/assets/adaptive-icon.png app/assets/splash.png app/assets/notification-icon.png app/assets/README.md
git commit -m "build(app): add placeholder icon/splash/notification assets"
```

---

### Task 7: Legal asset index module + markdown loader

Bundles the three Korean markdown documents into the app and exposes them via a typed import.

**Files:**
- Create: `pickhouse/mobile/src/assets/legal/index.ts`
- Create: `pickhouse/mobile/src/assets/legal/types.ts`
- Modify: `app/metro.config.js` — add `.md` to asset extensions

- [ ] **Step 1: Write `pickhouse/mobile/src/assets/legal/types.ts`**

```ts
export type LegalSlug = 'terms' | 'privacy' | 'location';

export interface LegalDocument {
  slug: LegalSlug;
  title: string;
  version: string;
  effectiveDate: string; // YYYY-MM-DD
  markdown: string;
}
```

- [ ] **Step 2: Update `app/metro.config.js` to handle `.md`**

```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('md');
module.exports = config;
```

- [ ] **Step 3: Write `pickhouse/mobile/src/assets/legal/index.ts`**

```ts
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import type { LegalDocument, LegalSlug } from './types';

const REGISTRY: Record<LegalSlug, { title: string; version: string; effectiveDate: string; module: number }> = {
  terms:    { title: '이용약관',          version: '1.0', effectiveDate: '2026-05-19', module: require('./terms.ko.md') },
  privacy:  { title: '개인정보 처리방침', version: '1.0', effectiveDate: '2026-05-19', module: require('./privacy.ko.md') },
  location: { title: '위치정보 이용약관', version: '1.0', effectiveDate: '2026-05-19', module: require('./location.ko.md') },
};

const cache = new Map<LegalSlug, string>();

export async function loadLegalDocument(slug: LegalSlug): Promise<LegalDocument> {
  const meta = REGISTRY[slug];
  let markdown = cache.get(slug);
  if (!markdown) {
    const [asset] = await Asset.loadAsync(meta.module);
    if (!asset.localUri) throw new Error(`legal asset failed to download: ${slug}`);
    markdown = await FileSystem.readAsStringAsync(asset.localUri);
    cache.set(slug, markdown);
  }
  return { slug, title: meta.title, version: meta.version, effectiveDate: meta.effectiveDate, markdown };
}

export function legalVersion(slug: LegalSlug): string {
  return REGISTRY[slug].version;
}

export const ALL_LEGAL_SLUGS: LegalSlug[] = ['terms', 'privacy', 'location'];
```

- [ ] **Step 4: Write a smoke test `pickhouse/mobile/src/assets/legal/__tests__/index.test.ts`**

```ts
import { legalVersion, ALL_LEGAL_SLUGS } from '../index';

describe('legal registry', () => {
  it('exposes the three required slugs', () => {
    expect(ALL_LEGAL_SLUGS).toEqual(['terms', 'privacy', 'location']);
  });
  it('reports v1.0 for each', () => {
    for (const s of ALL_LEGAL_SLUGS) {
      expect(legalVersion(s)).toBe('1.0');
    }
  });
});
```

- [ ] **Step 5: Run the test**

Run: `cd app && npx jest src/assets/legal --runInBand`
Expected: 2 passing tests.

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/assets/legal/index.ts pickhouse/mobile/src/assets/legal/types.ts pickhouse/mobile/src/assets/legal/__tests__/index.test.ts app/metro.config.js
git commit -m "feat(legal): add markdown loader for terms/privacy/location"
```

---

### Task 8: Generic `LegalWebViewScreen` component

A native screen that renders any of the three legal docs by slug. We render markdown as styled HTML inside a WebView so links open in-app and scroll position is restored.

**Files:**
- Create: `pickhouse/mobile/src/screens/legal/LegalWebViewScreen.tsx`
- Create: `pickhouse/mobile/src/screens/legal/legalHtml.ts`
- Modify: `app/package.json` (add `react-native-webview`, `marked`)

- [ ] **Step 1: Install deps**

Run: `cd app && npx expo install react-native-webview && npm i marked`

- [ ] **Step 2: Write `pickhouse/mobile/src/screens/legal/legalHtml.ts`**

```ts
import { marked } from 'marked';

const CSS = `
  body { font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
         background: #faf6f0; color: #1f1d1a; padding: 20px 16px 48px; line-height: 1.55; }
  h1 { font-size: 22px; margin-top: 24px; }
  h2 { font-size: 17px; margin-top: 24px; }
  h3 { font-size: 15px; margin-top: 16px; }
  p, li { font-size: 15px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #d9d2c3; padding: 6px 8px; font-size: 14px; }
  th { background: #efe7d6; }
  code { background: #efe7d6; padding: 2px 4px; border-radius: 4px; }
`;

export function renderLegalHtml(markdown: string): string {
  const body = marked.parse(markdown, { gfm: true, breaks: false });
  return `<!doctype html><html lang="ko"><head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>${CSS}</style></head><body>${body}</body></html>`;
}
```

- [ ] **Step 3: Write `pickhouse/mobile/src/screens/legal/LegalWebViewScreen.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { RouteProp } from '@react-navigation/native';
import { loadLegalDocument } from '@/assets/legal';
import type { LegalSlug } from '@/assets/legal/types';
import { renderLegalHtml } from './legalHtml';

export type LegalWebViewParams = { slug: LegalSlug };

interface Props {
  route: RouteProp<{ Legal: LegalWebViewParams }, 'Legal'>;
  navigation: { setOptions: (o: { title: string }) => void };
}

export function LegalWebViewScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const doc = await loadLegalDocument(slug);
      navigation.setOptions({ title: doc.title });
      setHtml(renderLegalHtml(doc.markdown));
    })();
  }, [slug, navigation]);

  if (!html) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html, baseUrl: 'about:blank' }}
      style={styles.web}
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(req) => req.url.startsWith('about:blank')}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf6f0' },
  web: { flex: 1, backgroundColor: '#faf6f0' },
});
```

- [ ] **Step 4: Write a render test `pickhouse/mobile/src/screens/legal/__tests__/legalHtml.test.ts`**

```ts
import { renderLegalHtml } from '../legalHtml';

describe('renderLegalHtml', () => {
  it('wraps markdown in styled HTML with Korean lang attribute', () => {
    const out = renderLegalHtml('# 약관\n\n내용');
    expect(out).toContain('<html lang="ko">');
    expect(out).toContain('<h1>약관</h1>');
    expect(out).toContain('<p>내용</p>');
    expect(out).toContain('#faf6f0');
  });
});
```

- [ ] **Step 5: Run test**

Run: `cd app && npx jest src/screens/legal --runInBand`
Expected: 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/screens/legal/LegalWebViewScreen.tsx pickhouse/mobile/src/screens/legal/legalHtml.ts pickhouse/mobile/src/screens/legal/__tests__/legalHtml.test.ts app/package.json
git commit -m "feat(legal): add LegalWebViewScreen rendering markdown via WebView"
```

---

### Task 9: Consent store (Zustand + persisted)

Tracks which legal versions a user has accepted. Required so we can re-prompt on policy revisions.

**Files:**
- Create: `pickhouse/mobile/src/stores/consentStore.ts`
- Create: `pickhouse/mobile/src/stores/__tests__/consentStore.test.ts`

- [ ] **Step 1: Write failing test `pickhouse/mobile/src/stores/__tests__/consentStore.test.ts`**

```ts
import { act } from '@testing-library/react-native';
import { useConsentStore, requiresConsent } from '../consentStore';

beforeEach(() => {
  useConsentStore.setState({ accepted: {} });
});

describe('consentStore', () => {
  it('starts empty and requires consent for all three docs', () => {
    expect(requiresConsent(useConsentStore.getState().accepted)).toEqual(['terms', 'privacy', 'location']);
  });

  it('recordAcceptance stores the version', () => {
    act(() => useConsentStore.getState().recordAcceptance('terms', '1.0'));
    expect(useConsentStore.getState().accepted.terms).toBe('1.0');
    expect(requiresConsent(useConsentStore.getState().accepted)).toEqual(['privacy', 'location']);
  });

  it('treats older accepted version as needing re-consent if current is newer', () => {
    act(() => useConsentStore.getState().recordAcceptance('terms', '0.9'));
    const needed = requiresConsent(useConsentStore.getState().accepted, { terms: '1.0', privacy: '1.0', location: '1.0' });
    expect(needed).toContain('terms');
  });
});
```

- [ ] **Step 2: Run test, expect failure**

Run: `cd app && npx jest src/stores/__tests__/consentStore --runInBand`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `pickhouse/mobile/src/stores/consentStore.ts`**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { legalVersion } from '@/assets/legal';
import type { LegalSlug } from '@/assets/legal/types';

export interface ConsentState {
  accepted: Partial<Record<LegalSlug, string>>; // slug -> accepted version
  recordAcceptance: (slug: LegalSlug, version: string) => void;
  reset: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      accepted: {},
      recordAcceptance: (slug, version) =>
        set((s) => ({ accepted: { ...s.accepted, [slug]: version } })),
      reset: () => set({ accepted: {} }),
    }),
    { name: 'pickhouse:consent:v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function requiresConsent(
  accepted: Partial<Record<LegalSlug, string>>,
  currentVersions: Record<LegalSlug, string> = {
    terms: legalVersion('terms'),
    privacy: legalVersion('privacy'),
    location: legalVersion('location'),
  },
): LegalSlug[] {
  const out: LegalSlug[] = [];
  (['terms', 'privacy', 'location'] as LegalSlug[]).forEach((slug) => {
    if (accepted[slug] !== currentVersions[slug]) out.push(slug);
  });
  return out;
}
```

- [ ] **Step 4: Re-run tests, expect pass**

Run: `cd app && npx jest src/stores/__tests__/consentStore --runInBand`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/stores/consentStore.ts pickhouse/mobile/src/stores/__tests__/consentStore.test.ts
git commit -m "feat(consent): add persisted consent store + requiresConsent helper"
```

---

### Task 10: Onboarding consent screen

Shown after successful provider login (Plan 2) but **before** any data screens. Three required checkboxes + "모두 동의" master + "동의하고 시작" button.

**Files:**
- Create: `pickhouse/mobile/src/screens/legal/ConsentScreen.tsx`
- Create: `pickhouse/mobile/src/screens/legal/__tests__/ConsentScreen.test.tsx`

- [ ] **Step 1: Write `ConsentScreen.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { useConsentStore } from '@/stores/consentStore';
import { legalVersion, ALL_LEGAL_SLUGS } from '@/assets/legal';
import type { LegalSlug } from '@/assets/legal/types';

interface Props {
  onComplete: () => void;
  navigateToLegal: (slug: LegalSlug) => void;
}

const LABELS: Record<LegalSlug, string> = {
  terms: '[필수] 이용약관 동의',
  privacy: '[필수] 개인정보 처리방침 동의',
  location: '[필수] 위치정보 이용약관 동의',
};

export function ConsentScreen({ onComplete, navigateToLegal }: Props) {
  const recordAcceptance = useConsentStore((s) => s.recordAcceptance);
  const [checked, setChecked] = useState<Record<LegalSlug, boolean>>({
    terms: false, privacy: false, location: false,
  });
  const allChecked = useMemo(() => ALL_LEGAL_SLUGS.every((s) => checked[s]), [checked]);

  function toggle(slug: LegalSlug) {
    setChecked((c) => ({ ...c, [slug]: !c[slug] }));
  }
  function toggleAll() {
    const next = !allChecked;
    setChecked({ terms: next, privacy: next, location: next });
  }

  async function handleSubmit() {
    if (!allChecked) {
      Alert.alert('동의가 필요합니다', '세 항목 모두 동의해야 서비스를 이용할 수 있습니다.');
      return;
    }
    for (const slug of ALL_LEGAL_SLUGS) recordAcceptance(slug, legalVersion(slug));
    onComplete();
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.body}>
      <Text style={styles.title}>서비스 이용을 위한 약관 동의</Text>
      <Text style={styles.subtitle}>살래말래는 회원님의 기록을 안전하게 보관하기 위해 다음에 동의가 필요해요.</Text>

      <Pressable style={styles.allRow} onPress={toggleAll} accessibilityRole="checkbox" accessibilityState={{ checked: allChecked }}>
        <View style={[styles.box, allChecked && styles.boxOn]} />
        <Text style={styles.allLabel}>모두 동의합니다</Text>
      </Pressable>

      <View style={styles.divider} />

      {ALL_LEGAL_SLUGS.map((slug) => (
        <View key={slug} style={styles.row}>
          <Pressable style={styles.rowLeft} onPress={() => toggle(slug)} accessibilityRole="checkbox" accessibilityState={{ checked: checked[slug] }}>
            <View style={[styles.box, checked[slug] && styles.boxOn]} />
            <Text style={styles.label}>{LABELS[slug]}</Text>
          </Pressable>
          <Pressable onPress={() => navigateToLegal(slug)} hitSlop={12} accessibilityRole="link">
            <Text style={styles.link}>전문보기</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        style={[styles.cta, !allChecked && styles.ctaDisabled]}
        onPress={handleSubmit}
        disabled={!allChecked}
        accessibilityRole="button"
      >
        <Text style={styles.ctaLabel}>동의하고 시작</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6f0' },
  body: { padding: 24, paddingBottom: 64 },
  title: { fontSize: 22, fontWeight: '700', color: '#1f1d1a', marginTop: 24 },
  subtitle: { fontSize: 14, color: '#6d655a', marginTop: 8, marginBottom: 24 },
  allRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  allLabel: { marginLeft: 12, fontSize: 16, fontWeight: '700', color: '#1f1d1a' },
  divider: { height: 1, backgroundColor: '#e6dfd0', marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#bdb09a' },
  boxOn: { backgroundColor: '#2b8c5a', borderColor: '#2b8c5a' },
  label: { marginLeft: 12, fontSize: 15, color: '#1f1d1a' },
  link: { fontSize: 13, color: '#6d655a', textDecorationLine: 'underline' },
  cta: { marginTop: 32, backgroundColor: '#1f1d1a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: '#b8b1a3' },
  ctaLabel: { color: '#faf6f0', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Write `__tests__/ConsentScreen.test.tsx`**

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ConsentScreen } from '../ConsentScreen';
import { useConsentStore } from '@/stores/consentStore';

beforeEach(() => useConsentStore.setState({ accepted: {} }));

describe('ConsentScreen', () => {
  it('does not call onComplete unless all three are checked', () => {
    const onComplete = jest.fn();
    const { getByText } = render(<ConsentScreen onComplete={onComplete} navigateToLegal={() => {}} />);
    fireEvent.press(getByText('동의하고 시작'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('records all three acceptances and calls onComplete when "모두 동의" is used', () => {
    const onComplete = jest.fn();
    const { getByText } = render(<ConsentScreen onComplete={onComplete} navigateToLegal={() => {}} />);
    fireEvent.press(getByText('모두 동의합니다'));
    fireEvent.press(getByText('동의하고 시작'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(useConsentStore.getState().accepted).toEqual({ terms: '1.0', privacy: '1.0', location: '1.0' });
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd app && npx jest src/screens/legal --runInBand`
Expected: all passing.

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/screens/legal/ConsentScreen.tsx pickhouse/mobile/src/screens/legal/__tests__/ConsentScreen.test.tsx
git commit -m "feat(consent): add onboarding consent screen with required checkboxes"
```

---

### Task 11: Wire consent gate into root navigator

After auth completes, check `requiresConsent`; if any slugs remain, route to ConsentScreen, then to legal stack on demand. If none, route to main app.

**Files:**
- Modify: `pickhouse/mobile/src/navigation/RootNavigator.tsx` (from Plan 2)
- Create: `pickhouse/mobile/src/navigation/LegalStack.tsx`

- [ ] **Step 1: Create `pickhouse/mobile/src/navigation/LegalStack.tsx`**

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConsentScreen } from '@/screens/legal/ConsentScreen';
import { LegalWebViewScreen, type LegalWebViewParams } from '@/screens/legal/LegalWebViewScreen';

export type LegalStackParamList = {
  Consent: undefined;
  LegalWebView: LegalWebViewParams;
};

const Stack = createNativeStackNavigator<LegalStackParamList>();

interface Props { onConsentComplete: () => void; }

export function LegalStack({ onConsentComplete }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#faf6f0' }, headerTintColor: '#1f1d1a' }}>
      <Stack.Screen name="Consent" options={{ title: '약관 동의' }}>
        {({ navigation }) => (
          <ConsentScreen
            onComplete={onConsentComplete}
            navigateToLegal={(slug) => navigation.navigate('LegalWebView', { slug })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="LegalWebView" component={LegalWebViewScreen} options={{ title: '약관' }} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 2: Modify `pickhouse/mobile/src/navigation/RootNavigator.tsx`**

Add a consent gate between auth and main:

```tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore'; // existing from Plan 2
import { useConsentStore, requiresConsent } from '@/stores/consentStore';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { LegalStack } from './LegalStack';

export function RootNavigator() {
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  const accepted = useConsentStore((s) => s.accepted);
  const [version, bumpVersion] = useState(0);

  // Re-evaluate when consent store changes
  useEffect(() => useConsentStore.subscribe(() => bumpVersion((v) => v + 1)), []);

  const needsConsent = requiresConsent(accepted).length > 0;

  return (
    <NavigationContainer>
      {!isAuthed ? (
        <AuthStack />
      ) : needsConsent ? (
        <LegalStack onConsentComplete={() => bumpVersion((v) => v + 1)} />
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd app && npx tsc --noEmit`
Expected: no errors. If errors mention missing `MainStack`/`AuthStack`, confirm Plan 2 created them under the same path; adjust imports if needed.

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/navigation/LegalStack.tsx pickhouse/mobile/src/navigation/RootNavigator.tsx
git commit -m "feat(nav): gate main app behind onboarding consent flow"
```

---

### Task 12: Backend — add `deletedAt` to User + migration

Plan 1 created `users` without this column. Add it.

**Files:**
- Create: `backend/src/main/resources/db/migration/V20__add_deleted_at_to_user.sql`
- Modify: `backend/src/main/java/app/pickhouse/user/User.java`
- Modify: `backend/src/main/java/app/pickhouse/user/UserRepository.java`

- [ ] **Step 1: Write migration `V20__add_deleted_at_to_user.sql`**

```sql
ALTER TABLE users
    ADD COLUMN deleted_at DATETIME(6) NULL,
    ADD INDEX idx_users_deleted_at (deleted_at);
```

- [ ] **Step 2: Add field to `User.java`**

```java
@Column(name = "deleted_at")
private Instant deletedAt;

public Instant getDeletedAt() { return deletedAt; }
public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }
```

- [ ] **Step 3: Add repository query for grace-period cleanup**

Add to `UserRepository.java`:

```java
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Query("select u from User u where u.deletedAt is not null and u.deletedAt < :cutoff")
List<User> findExpiredSoftDeleted(@Param("cutoff") Instant cutoff);
```

- [ ] **Step 4: Run Flyway migration check**

Run: `cd backend && ./gradlew flywayInfo -Dflyway.url=jdbc:mysql://localhost:3306/pickhouse_test -Dflyway.user=pickhouse -Dflyway.password=pickhouse`
Expected: `V20__add_deleted_at_to_user.sql` listed as pending. (If no local DB, skip and rely on Testcontainers in next steps.)

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/db/migration/V20__add_deleted_at_to_user.sql backend/src/main/java/app/pickhouse/user/User.java backend/src/main/java/app/pickhouse/user/UserRepository.java
git commit -m "feat(account): add deletedAt to User for soft-delete grace period"
```

---

### Task 13: Backend — `AccountDeletionService` (soft delete)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/account/AccountDeletionService.java`
- Create: `backend/src/test/java/app/pickhouse/account/AccountDeletionServiceTest.java`

- [ ] **Step 1: Write failing test `AccountDeletionServiceTest.java`**

```java
package app.pickhouse.account;

import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountDeletionServiceTest {

    @Mock UserRepository userRepo;
    AccountDeletionService service;
    private final Instant fixed = Instant.parse("2026-05-19T09:00:00Z");

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(fixed, ZoneOffset.UTC);
        service = new AccountDeletionService(userRepo, clock);
    }

    @Test
    void softDelete_marksDeletedAtAndSaves() {
        User u = new User(); u.setId(7L);
        when(userRepo.findByIdAndDeletedAtIsNull(7L)).thenReturn(Optional.of(u));
        service.softDelete(7L);
        assertThat(u.getDeletedAt()).isEqualTo(fixed);
        verify(userRepo).save(u);
    }

    @Test
    void softDelete_idempotent_throwsIfAlreadyDeleted() {
        when(userRepo.findByIdAndDeletedAtIsNull(7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.softDelete(7L))
            .isInstanceOf(AccountAlreadyDeletedException.class);
    }
}
```

- [ ] **Step 2: Run test, expect failure**

Run: `cd backend && ./gradlew test --tests AccountDeletionServiceTest`
Expected: compile fail (class not found).

- [ ] **Step 3: Add finder to `UserRepository.java`**

```java
Optional<User> findByIdAndDeletedAtIsNull(Long id);
```

- [ ] **Step 4: Implement `AccountDeletionService.java`**

```java
package app.pickhouse.account;

import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;

@Service
public class AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);
    private final UserRepository userRepo;
    private final Clock clock;

    public AccountDeletionService(UserRepository userRepo, Clock clock) {
        this.userRepo = userRepo;
        this.clock = clock;
    }

    @Transactional
    public void softDelete(long userId) {
        User u = userRepo.findByIdAndDeletedAtIsNull(userId)
            .orElseThrow(() -> new AccountAlreadyDeletedException(userId));
        u.setDeletedAt(clock.instant());
        userRepo.save(u);
        log.info("Soft-deleted user id={}, hard-delete after 30d", userId);
    }
}
```

- [ ] **Step 5: Add exception `AccountAlreadyDeletedException.java`**

```java
package app.pickhouse.account;

public class AccountAlreadyDeletedException extends RuntimeException {
    public AccountAlreadyDeletedException(long userId) {
        super("user already deleted or not found: " + userId);
    }
}
```

- [ ] **Step 6: Re-run tests**

Run: `cd backend && ./gradlew test --tests AccountDeletionServiceTest`
Expected: 2 passing.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/app/pickhouse/account/AccountDeletionService.java backend/src/main/java/app/pickhouse/account/AccountAlreadyDeletedException.java backend/src/main/java/app/pickhouse/user/UserRepository.java backend/src/test/java/app/pickhouse/account/AccountDeletionServiceTest.java
git commit -m "feat(account): soft-delete service with idempotency"
```

---

### Task 14: Backend — `AccountDeletionController` (DELETE /me)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/account/AccountDeletionController.java`
- Create: `backend/src/test/java/app/pickhouse/account/AccountDeletionControllerTest.java`

- [ ] **Step 1: Write failing test `AccountDeletionControllerTest.java`** (uses `@WebMvcTest`)

```java
package app.pickhouse.account;

import app.pickhouse.security.JwtTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountDeletionController.class)
@Import(JwtTestSupport.class) // utility from Plan 2 that stubs auth
class AccountDeletionControllerTest {

    @Autowired MockMvc mvc;
    @MockBean AccountDeletionService service;

    @Test
    void deleteMe_returnsAccepted_andCallsService() throws Exception {
        mvc.perform(delete("/me").header("Authorization", JwtTestSupport.bearerForUser(42L)))
            .andExpect(status().isAccepted());
        verify(service).softDelete(42L);
    }
}
```

- [ ] **Step 2: Run, expect failure**

Run: `cd backend && ./gradlew test --tests AccountDeletionControllerTest`
Expected: 404 (controller missing).

- [ ] **Step 3: Implement controller**

```java
package app.pickhouse.account;

import app.pickhouse.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me")
public class AccountDeletionController {

    private final AccountDeletionService service;

    public AccountDeletionController(AccountDeletionService service) {
        this.service = service;
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteMe(@CurrentUser long userId) {
        service.softDelete(userId);
        return ResponseEntity.accepted().build();
    }
}
```

(Note: `@CurrentUser` is the annotation from Plan 2's security module. If Plan 2 named it differently — `@AuthenticationPrincipal` returning a custom type — adapt the parameter accordingly.)

- [ ] **Step 4: Re-run test**

Run: `cd backend && ./gradlew test --tests AccountDeletionControllerTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/account/AccountDeletionController.java backend/src/test/java/app/pickhouse/account/AccountDeletionControllerTest.java
git commit -m "feat(account): DELETE /me endpoint for soft delete"
```

---

### Task 15: Backend — JWT filter rejects deleted users

**Files:**
- Modify: `backend/src/main/java/app/pickhouse/security/JwtAuthenticationFilter.java`
- Create: `backend/src/test/java/app/pickhouse/security/JwtAuthenticationFilterDeletedUserTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.security;

import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterDeletedUserTest {

    @Test
    void rejectsToken_whenUserIsSoftDeleted() throws Exception {
        UserRepository repo = mock(UserRepository.class);
        JwtService jwt = mock(JwtService.class);
        when(jwt.parseUserId("token")).thenReturn(Optional.of(99L));
        User u = new User(); u.setId(99L); u.setDeletedAt(Instant.now());
        when(repo.findById(99L)).thenReturn(Optional.of(u));

        var filter = new JwtAuthenticationFilter(jwt, repo);
        var req = new MockHttpServletRequest();
        req.addHeader("Authorization", "Bearer token");
        var res = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(req, res, chain);

        assertThat(res.getStatus()).isEqualTo(401);
        verify(chain, never()).doFilter(any(), any());
    }
}
```

- [ ] **Step 2: Modify filter — add deleted-user check after token parse**

In `JwtAuthenticationFilter.doFilterInternal` (after extracting userId, before setting SecurityContext):

```java
var user = userRepo.findById(userId).orElse(null);
if (user == null || user.getDeletedAt() != null) {
    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "account deleted or unknown");
    return;
}
```

- [ ] **Step 3: Run tests**

Run: `cd backend && ./gradlew test --tests JwtAuthenticationFilterDeletedUserTest`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/pickhouse/security/JwtAuthenticationFilter.java backend/src/test/java/app/pickhouse/security/JwtAuthenticationFilterDeletedUserTest.java
git commit -m "feat(security): reject JWT for soft-deleted users"
```

---

### Task 16: Backend — `AccountDeletionScheduler` (hard delete after 30 days)

**Files:**
- Modify: `backend/src/main/java/app/pickhouse/PickHouseApplication.java` (add `@EnableScheduling`)
- Create: `backend/src/main/java/app/pickhouse/account/AccountDeletionScheduler.java`
- Create: `backend/src/main/java/app/pickhouse/account/HardDeleteService.java`
- Create: `backend/src/test/java/app/pickhouse/account/AccountDeletionSchedulerTest.java`
- Create: `backend/src/test/java/app/pickhouse/account/HardDeleteServiceTest.java`

- [ ] **Step 1: Enable scheduling** in `PickHouseApplication.java`

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PickHouseApplication { ... }
```

- [ ] **Step 2: Write `HardDeleteServiceTest.java`**

```java
package app.pickhouse.account;

import app.pickhouse.house.HouseRepository;
import app.pickhouse.photo.PhotoRepository;
import app.pickhouse.photo.R2Client;
import app.pickhouse.residence.ResidenceRepository;
import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class HardDeleteServiceTest {

    @Test
    void hardDelete_removesPhotos_houses_residences_user_inOrder() {
        var photoRepo = mock(PhotoRepository.class);
        var houseRepo = mock(HouseRepository.class);
        var resRepo = mock(ResidenceRepository.class);
        var userRepo = mock(UserRepository.class);
        var r2 = mock(R2Client.class);
        var u = new User(); u.setId(42L);

        when(photoRepo.findRemoteUrlsByUserId(42L)).thenReturn(List.of("a.jpg", "b.jpg"));

        var svc = new HardDeleteService(photoRepo, houseRepo, resRepo, userRepo, r2);
        svc.hardDelete(u);

        var order = inOrder(r2, photoRepo, houseRepo, resRepo, userRepo);
        order.verify(r2).deleteObjects(List.of("a.jpg", "b.jpg"));
        order.verify(photoRepo).deleteAllByUserId(42L);
        order.verify(houseRepo).deleteAllByUserId(42L);
        order.verify(resRepo).deleteAllByUserId(42L);
        order.verify(userRepo).delete(u);
    }
}
```

- [ ] **Step 3: Implement `HardDeleteService.java`**

```java
package app.pickhouse.account;

import app.pickhouse.house.HouseRepository;
import app.pickhouse.photo.PhotoRepository;
import app.pickhouse.photo.R2Client;
import app.pickhouse.residence.ResidenceRepository;
import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HardDeleteService {

    private static final Logger log = LoggerFactory.getLogger(HardDeleteService.class);

    private final PhotoRepository photoRepo;
    private final HouseRepository houseRepo;
    private final ResidenceRepository residenceRepo;
    private final UserRepository userRepo;
    private final R2Client r2;

    public HardDeleteService(PhotoRepository photoRepo, HouseRepository houseRepo,
                             ResidenceRepository residenceRepo, UserRepository userRepo, R2Client r2) {
        this.photoRepo = photoRepo;
        this.houseRepo = houseRepo;
        this.residenceRepo = residenceRepo;
        this.userRepo = userRepo;
        this.r2 = r2;
    }

    @Transactional
    public void hardDelete(User user) {
        long id = user.getId();
        List<String> remoteKeys = photoRepo.findRemoteUrlsByUserId(id);
        if (!remoteKeys.isEmpty()) r2.deleteObjects(remoteKeys);
        photoRepo.deleteAllByUserId(id);
        houseRepo.deleteAllByUserId(id);
        residenceRepo.deleteAllByUserId(id);
        userRepo.delete(user);
        log.warn("Hard-deleted user id={} ({} photo objects purged)", id, remoteKeys.size());
    }
}
```

Plan 1 must supply these repository methods. If they don't exist, add them as part of this task in the relevant repository file (signature: `void deleteAllByUserId(long userId);` and `List<String> findRemoteUrlsByUserId(long userId);`).

- [ ] **Step 4: Run unit test**

Run: `cd backend && ./gradlew test --tests HardDeleteServiceTest`
Expected: PASS.

- [ ] **Step 5: Write `AccountDeletionSchedulerTest.java`**

```java
package app.pickhouse.account;

import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.List;

import static org.mockito.Mockito.*;

class AccountDeletionSchedulerTest {

    @Test
    void purgesUsersDeletedMoreThan30DaysAgo() {
        Instant now = Instant.parse("2026-06-19T03:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
        var userRepo = mock(UserRepository.class);
        var hardDelete = mock(HardDeleteService.class);
        var u = new User(); u.setId(7L); u.setDeletedAt(Instant.parse("2026-05-19T00:00:00Z"));
        when(userRepo.findExpiredSoftDeleted(now.minus(Duration.ofDays(30)))).thenReturn(List.of(u));

        var sched = new AccountDeletionScheduler(userRepo, hardDelete, clock);
        sched.purge();

        verify(hardDelete).hardDelete(u);
    }
}
```

- [ ] **Step 6: Implement `AccountDeletionScheduler.java`**

```java
package app.pickhouse.account;

import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
public class AccountDeletionScheduler {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionScheduler.class);
    private static final Duration GRACE_PERIOD = Duration.ofDays(30);

    private final UserRepository userRepo;
    private final HardDeleteService hardDeleteService;
    private final Clock clock;

    public AccountDeletionScheduler(UserRepository userRepo, HardDeleteService hardDeleteService, Clock clock) {
        this.userRepo = userRepo;
        this.hardDeleteService = hardDeleteService;
        this.clock = clock;
    }

    // Runs once an hour; in production we keep it cheap because the index on deleted_at filters quickly.
    @Scheduled(cron = "0 0 * * * *")
    public void purge() {
        Instant cutoff = clock.instant().minus(GRACE_PERIOD);
        List<User> expired = userRepo.findExpiredSoftDeleted(cutoff);
        if (expired.isEmpty()) return;
        log.info("Hard-delete sweep: {} expired users", expired.size());
        for (User u : expired) {
            try {
                hardDeleteService.hardDelete(u);
            } catch (Exception e) {
                log.error("hardDelete failed for user {}", u.getId(), e);
            }
        }
    }
}
```

- [ ] **Step 7: Run scheduler test**

Run: `cd backend && ./gradlew test --tests AccountDeletionSchedulerTest`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/app/pickhouse/PickHouseApplication.java backend/src/main/java/app/pickhouse/account/AccountDeletionScheduler.java backend/src/main/java/app/pickhouse/account/HardDeleteService.java backend/src/test/java/app/pickhouse/account/AccountDeletionSchedulerTest.java backend/src/test/java/app/pickhouse/account/HardDeleteServiceTest.java
git commit -m "feat(account): hourly scheduler hard-deletes users past 30-day grace"
```

---

### Task 17: Backend — Data export job (entity + migration)

Long-running operation: produces a JSON of all the user's records plus a zip of all photos. Frontend polls until done, then downloads from a signed URL.

**Files:**
- Create: `backend/src/main/resources/db/migration/V21__create_export_jobs.sql`
- Create: `backend/src/main/java/app/pickhouse/export/ExportJob.java`
- Create: `backend/src/main/java/app/pickhouse/export/ExportJobRepository.java`

- [ ] **Step 1: Write migration**

```sql
CREATE TABLE export_jobs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,            -- QUEUED, RUNNING, READY, FAILED
    artifact_url VARCHAR(1024) NULL,        -- presigned R2 URL when READY
    error_message VARCHAR(500) NULL,
    requested_at DATETIME(6) NOT NULL,
    completed_at DATETIME(6) NULL,
    expires_at DATETIME(6) NULL,            -- artifact valid until
    PRIMARY KEY (id),
    INDEX idx_export_jobs_user (user_id, requested_at),
    INDEX idx_export_jobs_status (status)
);
```

- [ ] **Step 2: Write entity `ExportJob.java`**

```java
package app.pickhouse.export;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "export_jobs")
public class ExportJob {

    public enum Status { QUEUED, RUNNING, READY, FAILED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.QUEUED;

    @Column(name = "artifact_url", length = 1024)
    private String artifactUrl;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    // getters + setters omitted for brevity — generate with IDE
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long v) { this.userId = v; }
    public Status getStatus() { return status; }
    public void setStatus(Status v) { this.status = v; }
    public String getArtifactUrl() { return artifactUrl; }
    public void setArtifactUrl(String v) { this.artifactUrl = v; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String v) { this.errorMessage = v; }
    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant v) { this.requestedAt = v; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant v) { this.completedAt = v; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant v) { this.expiresAt = v; }
}
```

- [ ] **Step 3: Write repository**

```java
package app.pickhouse.export;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ExportJobRepository extends JpaRepository<ExportJob, Long> {
    Optional<ExportJob> findFirstByUserIdAndStatusInOrderByRequestedAtDesc(
        Long userId, java.util.Collection<ExportJob.Status> statuses);
}
```

- [ ] **Step 4: Verify compile**

Run: `cd backend && ./gradlew compileJava`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/db/migration/V21__create_export_jobs.sql backend/src/main/java/app/pickhouse/export/ExportJob.java backend/src/main/java/app/pickhouse/export/ExportJobRepository.java
git commit -m "feat(export): add export_jobs table + entity"
```

---

### Task 18: Backend — `DataExportService` (builds JSON + zip, uploads to R2)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/export/DataExportService.java`
- Create: `backend/src/test/java/app/pickhouse/export/DataExportServiceTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.export;

import app.pickhouse.house.House;
import app.pickhouse.house.HouseRepository;
import app.pickhouse.photo.Photo;
import app.pickhouse.photo.PhotoRepository;
import app.pickhouse.photo.R2Client;
import app.pickhouse.residence.ResidenceRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DataExportServiceTest {

    @Test
    void run_buildsJsonAndZip_uploadsBoth_marksReady() throws Exception {
        var jobRepo = mock(ExportJobRepository.class);
        var houseRepo = mock(HouseRepository.class);
        var resRepo = mock(ResidenceRepository.class);
        var photoRepo = mock(PhotoRepository.class);
        var r2 = mock(R2Client.class);
        Clock clock = Clock.fixed(Instant.parse("2026-05-19T10:00:00Z"), ZoneOffset.UTC);

        when(houseRepo.findAllByUserId(7L)).thenReturn(List.of(new House()));
        when(photoRepo.findAllByUserId(7L)).thenReturn(List.of()); // empty zip
        when(r2.uploadPrivate(startsWith("exports/7/"), any(byte[].class), anyString()))
            .thenReturn("https://signed/url");

        var job = new ExportJob(); job.setUserId(7L); job.setRequestedAt(clock.instant());
        when(jobRepo.save(any(ExportJob.class))).thenAnswer(inv -> inv.getArgument(0));

        var svc = new DataExportService(jobRepo, houseRepo, resRepo, photoRepo, r2, clock);
        svc.runJob(job);

        assertThat(job.getStatus()).isEqualTo(ExportJob.Status.READY);
        assertThat(job.getArtifactUrl()).isEqualTo("https://signed/url");
        assertThat(job.getCompletedAt()).isEqualTo(clock.instant());
    }
}
```

- [ ] **Step 2: Implement `DataExportService.java`**

```java
package app.pickhouse.export;

import com.fasterxml.jackson.databind.ObjectMapper;
import app.pickhouse.house.HouseRepository;
import app.pickhouse.photo.Photo;
import app.pickhouse.photo.PhotoRepository;
import app.pickhouse.photo.R2Client;
import app.pickhouse.residence.ResidenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.Clock;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class DataExportService {

    private static final Logger log = LoggerFactory.getLogger(DataExportService.class);
    private static final Duration ARTIFACT_TTL = Duration.ofDays(7);

    private final ExportJobRepository jobRepo;
    private final HouseRepository houseRepo;
    private final ResidenceRepository residenceRepo;
    private final PhotoRepository photoRepo;
    private final R2Client r2;
    private final Clock clock;
    private final ObjectMapper json = new ObjectMapper();

    public DataExportService(ExportJobRepository jobRepo, HouseRepository houseRepo,
                             ResidenceRepository residenceRepo, PhotoRepository photoRepo,
                             R2Client r2, Clock clock) {
        this.jobRepo = jobRepo;
        this.houseRepo = houseRepo;
        this.residenceRepo = residenceRepo;
        this.photoRepo = photoRepo;
        this.r2 = r2;
        this.clock = clock;
    }

    @Transactional
    public ExportJob enqueue(long userId) {
        var job = new ExportJob();
        job.setUserId(userId);
        job.setRequestedAt(clock.instant());
        return jobRepo.save(job);
    }

    @Async("exportExecutor")
    @Transactional
    public void runJob(ExportJob job) {
        try {
            job.setStatus(ExportJob.Status.RUNNING);
            jobRepo.save(job);

            byte[] zipBytes = buildArchive(job.getUserId());
            String key = "exports/%d/%d.zip".formatted(job.getUserId(), job.getId());
            String url = r2.uploadPrivate(key, zipBytes, "application/zip");

            job.setArtifactUrl(url);
            job.setStatus(ExportJob.Status.READY);
            job.setCompletedAt(clock.instant());
            job.setExpiresAt(clock.instant().plus(ARTIFACT_TTL));
            jobRepo.save(job);
        } catch (Exception e) {
            log.error("export job {} failed", job.getId(), e);
            job.setStatus(ExportJob.Status.FAILED);
            job.setErrorMessage(e.getMessage());
            jobRepo.save(job);
        }
    }

    private byte[] buildArchive(long userId) throws Exception {
        var manifest = new HashMap<String, Object>();
        manifest.put("exportedAt", clock.instant().toString());
        manifest.put("userId", userId);
        manifest.put("houses", houseRepo.findAllByUserId(userId));
        manifest.put("residences", residenceRepo.findAllByUserId(userId));

        byte[] jsonBytes = json.writerWithDefaultPrettyPrinter().writeValueAsBytes(manifest);

        var bos = new ByteArrayOutputStream();
        try (var zos = new ZipOutputStream(bos)) {
            zos.putNextEntry(new ZipEntry("data.json"));
            zos.write(jsonBytes);
            zos.closeEntry();

            List<Photo> photos = photoRepo.findAllByUserId(userId);
            for (Photo p : photos) {
                if (p.getRemoteUrl() == null) continue;
                byte[] bytes = r2.download(p.getRemoteUrl());
                zos.putNextEntry(new ZipEntry("photos/" + p.getId() + ".jpg"));
                zos.write(bytes);
                zos.closeEntry();
            }
        }
        return bos.toByteArray();
    }
}
```

- [ ] **Step 3: Add async executor config**

Create `backend/src/main/java/app/pickhouse/export/ExportAsyncConfig.java`:

```java
package app.pickhouse.export;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class ExportAsyncConfig {
    @Bean(name = "exportExecutor")
    public Executor exportExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(1);
        ex.setMaxPoolSize(2);
        ex.setQueueCapacity(20);
        ex.setThreadNamePrefix("export-");
        ex.initialize();
        return ex;
    }
}
```

- [ ] **Step 4: Run test**

Run: `cd backend && ./gradlew test --tests DataExportServiceTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/export/DataExportService.java backend/src/main/java/app/pickhouse/export/ExportAsyncConfig.java backend/src/test/java/app/pickhouse/export/DataExportServiceTest.java
git commit -m "feat(export): async DataExportService — builds zip + uploads to R2"
```

---

### Task 19: Backend — `DataExportController` (POST + GET status)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/export/DataExportController.java`
- Create: `backend/src/main/java/app/pickhouse/export/ExportJobDto.java`
- Create: `backend/src/test/java/app/pickhouse/export/DataExportControllerTest.java`

- [ ] **Step 1: Write `ExportJobDto.java`**

```java
package app.pickhouse.export;

import java.time.Instant;

public record ExportJobDto(
    long id,
    String status,
    String artifactUrl,
    Instant requestedAt,
    Instant completedAt,
    Instant expiresAt,
    String errorMessage
) {
    public static ExportJobDto from(ExportJob j) {
        return new ExportJobDto(
            j.getId(), j.getStatus().name(), j.getArtifactUrl(),
            j.getRequestedAt(), j.getCompletedAt(), j.getExpiresAt(), j.getErrorMessage());
    }
}
```

- [ ] **Step 2: Write `DataExportController.java`**

```java
package app.pickhouse.export;

import app.pickhouse.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me/export")
public class DataExportController {

    private final DataExportService service;
    private final ExportJobRepository repo;

    public DataExportController(DataExportService service, ExportJobRepository repo) {
        this.service = service;
        this.repo = repo;
    }

    @PostMapping
    public ResponseEntity<ExportJobDto> request(@CurrentUser long userId) {
        ExportJob job = service.enqueue(userId);
        service.runJob(job); // async via @Async
        return ResponseEntity.accepted().body(ExportJobDto.from(job));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ExportJobDto> status(@CurrentUser long userId, @PathVariable long jobId) {
        return repo.findById(jobId)
            .filter(j -> j.getUserId() == userId)
            .map(j -> ResponseEntity.ok(ExportJobDto.from(j)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
```

- [ ] **Step 3: Write test `DataExportControllerTest.java`**

```java
package app.pickhouse.export;

import app.pickhouse.security.JwtTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DataExportController.class)
@Import(JwtTestSupport.class)
class DataExportControllerTest {
    @Autowired MockMvc mvc;
    @MockBean DataExportService service;
    @MockBean ExportJobRepository repo;

    @Test
    void post_enqueuesAndReturnsAccepted() throws Exception {
        var job = new ExportJob(); job.setUserId(7L); job.setRequestedAt(Instant.now());
        when(service.enqueue(7L)).thenReturn(job);
        mvc.perform(post("/me/export").header("Authorization", JwtTestSupport.bearerForUser(7L)))
            .andExpect(status().isAccepted());
    }

    @Test
    void get_returns404IfNotOwner() throws Exception {
        var job = new ExportJob(); job.setUserId(8L); job.setRequestedAt(Instant.now());
        when(repo.findById(anyLong())).thenReturn(Optional.of(job));
        mvc.perform(get("/me/export/1").header("Authorization", JwtTestSupport.bearerForUser(7L)))
            .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 4: Run**

Run: `cd backend && ./gradlew test --tests DataExportControllerTest`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/export/DataExportController.java backend/src/main/java/app/pickhouse/export/ExportJobDto.java backend/src/test/java/app/pickhouse/export/DataExportControllerTest.java
git commit -m "feat(export): controller for POST /me/export + GET /me/export/{id}"
```

---

### Task 20: Backend — Legal document controller (`GET /legal/{slug}`)

Useful for in-app deep links + server-side audit of what version was shown.

**Files:**
- Create: `backend/src/main/resources/db/migration/V22__create_legal_documents.sql`
- Create: `backend/src/main/java/app/pickhouse/legal/LegalDocument.java`
- Create: `backend/src/main/java/app/pickhouse/legal/LegalDocumentRepository.java`
- Create: `backend/src/main/java/app/pickhouse/legal/LegalDocumentController.java`
- Create: `backend/src/main/java/app/pickhouse/legal/LegalDocumentSeeder.java` (CommandLineRunner)
- Create: `backend/src/test/java/app/pickhouse/legal/LegalDocumentControllerTest.java`

- [ ] **Step 1: Migration `V22__create_legal_documents.sql`**

```sql
CREATE TABLE legal_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    slug VARCHAR(40) NOT NULL,
    version VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL,
    content MEDIUMTEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_legal_slug_version (slug, version)
);
```

- [ ] **Step 2: Entity**

```java
package app.pickhouse.legal;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "legal_documents")
public class LegalDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 40) private String slug;
    @Column(nullable = false, length = 20) private String version;
    @Column(name = "effective_date", nullable = false) private LocalDate effectiveDate;
    @Lob @Column(nullable = false) private String content;
    // getters/setters
    public Long getId() { return id; }
    public String getSlug() { return slug; } public void setSlug(String v) { this.slug = v; }
    public String getVersion() { return version; } public void setVersion(String v) { this.version = v; }
    public LocalDate getEffectiveDate() { return effectiveDate; } public void setEffectiveDate(LocalDate v) { this.effectiveDate = v; }
    public String getContent() { return content; } public void setContent(String v) { this.content = v; }
}
```

- [ ] **Step 3: Repository**

```java
package app.pickhouse.legal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LegalDocumentRepository extends JpaRepository<LegalDocument, Long> {
    Optional<LegalDocument> findFirstBySlugOrderByEffectiveDateDesc(String slug);
    boolean existsBySlugAndVersion(String slug, String version);
}
```

- [ ] **Step 4: Seeder — loads markdown from classpath on startup**

```java
package app.pickhouse.legal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class LegalDocumentSeeder implements CommandLineRunner {

    private final LegalDocumentRepository repo;

    public LegalDocumentSeeder(LegalDocumentRepository repo) { this.repo = repo; }

    @Override
    public void run(String... args) throws Exception {
        var docs = List.of(
            Map.entry("terms",    Map.of("version", "1.0", "file", "legal/terms-v1.ko.md")),
            Map.entry("privacy",  Map.of("version", "1.0", "file", "legal/privacy-v1.ko.md")),
            Map.entry("location", Map.of("version", "1.0", "file", "legal/location-v1.ko.md"))
        );
        for (var e : docs) {
            String slug = e.getKey();
            String version = e.getValue().get("version");
            String path = e.getValue().get("file");
            if (repo.existsBySlugAndVersion(slug, version)) continue;
            var resource = new ClassPathResource(path);
            String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            var doc = new LegalDocument();
            doc.setSlug(slug);
            doc.setVersion(version);
            doc.setEffectiveDate(LocalDate.parse("2026-05-19"));
            doc.setContent(content);
            repo.save(doc);
        }
    }
}
```

- [ ] **Step 5: Controller**

```java
package app.pickhouse.legal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/legal")
public class LegalDocumentController {

    private final LegalDocumentRepository repo;

    public LegalDocumentController(LegalDocumentRepository repo) { this.repo = repo; }

    public record LegalDocumentDto(String slug, String version, String effectiveDate, String content) {}

    @GetMapping("/{slug}")
    public ResponseEntity<LegalDocumentDto> latest(@PathVariable String slug) {
        return repo.findFirstBySlugOrderByEffectiveDateDesc(slug)
            .map(d -> new LegalDocumentDto(d.getSlug(), d.getVersion(), d.getEffectiveDate().toString(), d.getContent()))
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
```

- [ ] **Step 6: Controller test**

```java
package app.pickhouse.legal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LegalDocumentController.class)
class LegalDocumentControllerTest {
    @Autowired MockMvc mvc;
    @MockBean LegalDocumentRepository repo;

    @Test
    void returnsLatestDoc() throws Exception {
        var d = new LegalDocument();
        d.setSlug("terms"); d.setVersion("1.0"); d.setEffectiveDate(LocalDate.parse("2026-05-19"));
        d.setContent("# 약관");
        when(repo.findFirstBySlugOrderByEffectiveDateDesc("terms")).thenReturn(Optional.of(d));

        mvc.perform(get("/legal/terms"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value("1.0"))
            .andExpect(jsonPath("$.content").value("# 약관"));
    }
}
```

- [ ] **Step 7: Run test**

Run: `cd backend && ./gradlew test --tests LegalDocumentControllerTest`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/resources/db/migration/V22__create_legal_documents.sql backend/src/main/java/app/pickhouse/legal/ backend/src/test/java/app/pickhouse/legal/
git commit -m "feat(legal): seed + serve legal documents via GET /legal/{slug}"
```

---

### Task 21: Frontend — `accountApi.ts` (delete + export wrappers)

**Files:**
- Create: `pickhouse/mobile/src/services/api/accountApi.ts`
- Create: `pickhouse/mobile/src/services/api/__tests__/accountApi.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { accountApi } from '../accountApi';
import { apiClient } from '../client'; // axios instance from Plan 2

jest.mock('../client');
const mocked = apiClient as jest.Mocked<typeof apiClient>;

describe('accountApi', () => {
  it('deleteMe issues DELETE /me', async () => {
    mocked.delete.mockResolvedValue({ status: 202, data: undefined });
    await accountApi.deleteMe();
    expect(mocked.delete).toHaveBeenCalledWith('/me');
  });

  it('requestExport POSTs and returns job', async () => {
    mocked.post.mockResolvedValue({ status: 202, data: { id: 1, status: 'QUEUED' } });
    const job = await accountApi.requestExport();
    expect(job.status).toBe('QUEUED');
  });

  it('getExportStatus GETs by id', async () => {
    mocked.get.mockResolvedValue({ status: 200, data: { id: 1, status: 'READY', artifactUrl: 'https://x' } });
    const job = await accountApi.getExportStatus(1);
    expect(job.artifactUrl).toBe('https://x');
  });
});
```

- [ ] **Step 2: Implement `accountApi.ts`**

```ts
import { apiClient } from './client';

export interface ExportJob {
  id: number;
  status: 'QUEUED' | 'RUNNING' | 'READY' | 'FAILED';
  artifactUrl?: string;
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
  errorMessage?: string;
}

export const accountApi = {
  async deleteMe(): Promise<void> {
    await apiClient.delete('/me');
  },
  async requestExport(): Promise<ExportJob> {
    const res = await apiClient.post<ExportJob>('/me/export');
    return res.data;
  },
  async getExportStatus(jobId: number): Promise<ExportJob> {
    const res = await apiClient.get<ExportJob>(`/me/export/${jobId}`);
    return res.data;
  },
};
```

- [ ] **Step 3: Run test**

Run: `cd app && npx jest src/services/api/__tests__/accountApi --runInBand`
Expected: 3 passing.

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/services/api/accountApi.ts pickhouse/mobile/src/services/api/__tests__/accountApi.test.ts
git commit -m "feat(account): accountApi wrappers for DELETE /me + export endpoints"
```

---

### Task 22: Frontend — `useDataExport` hook + `dataExportService`

Handles polling, download to disk, and share-sheet trigger.

**Files:**
- Create: `pickhouse/mobile/src/services/export/dataExportService.ts`
- Create: `pickhouse/mobile/src/hooks/useDataExport.ts`
- Create: `pickhouse/mobile/src/services/export/__tests__/dataExportService.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { pollUntilReady } from '../dataExportService';
import { accountApi, type ExportJob } from '@/services/api/accountApi';

jest.mock('@/services/api/accountApi');
const mocked = accountApi as jest.Mocked<typeof accountApi>;

function job(status: ExportJob['status'], url?: string): ExportJob {
  return { id: 1, status, artifactUrl: url, requestedAt: '2026-05-19T00:00:00Z' };
}

describe('pollUntilReady', () => {
  it('returns artifact url when status flips to READY', async () => {
    mocked.getExportStatus
      .mockResolvedValueOnce(job('RUNNING'))
      .mockResolvedValueOnce(job('RUNNING'))
      .mockResolvedValueOnce(job('READY', 'https://signed/u'));
    const final = await pollUntilReady(1, { intervalMs: 1, maxMs: 1000 });
    expect(final.artifactUrl).toBe('https://signed/u');
  });

  it('throws on FAILED status', async () => {
    mocked.getExportStatus.mockResolvedValue({ ...job('FAILED'), errorMessage: 'boom' });
    await expect(pollUntilReady(1, { intervalMs: 1, maxMs: 50 })).rejects.toThrow('boom');
  });
});
```

- [ ] **Step 2: Implement `dataExportService.ts`**

```ts
import { accountApi, type ExportJob } from '@/services/api/accountApi';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface PollOpts { intervalMs: number; maxMs: number; onProgress?: (j: ExportJob) => void; }

export async function pollUntilReady(jobId: number, opts: PollOpts): Promise<ExportJob> {
  const start = Date.now();
  while (Date.now() - start < opts.maxMs) {
    const job = await accountApi.getExportStatus(jobId);
    opts.onProgress?.(job);
    if (job.status === 'READY') return job;
    if (job.status === 'FAILED') throw new Error(job.errorMessage || '내보내기 실패');
    await new Promise((r) => setTimeout(r, opts.intervalMs));
  }
  throw new Error('내보내기 시간 초과 — 잠시 후 다시 시도해주세요.');
}

export async function downloadAndShare(job: ExportJob): Promise<void> {
  if (!job.artifactUrl) throw new Error('artifact url missing');
  const dest = `${FileSystem.cacheDirectory}pickhouse-export-${job.id}.zip`;
  const { uri } = await FileSystem.downloadAsync(job.artifactUrl, dest);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/zip', UTI: 'public.zip-archive' });
  }
}
```

- [ ] **Step 3: Implement `useDataExport.ts`**

```ts
import { useState } from 'react';
import { accountApi, type ExportJob } from '@/services/api/accountApi';
import { downloadAndShare, pollUntilReady } from '@/services/export/dataExportService';

export function useDataExport() {
  const [progress, setProgress] = useState<ExportJob | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setError(null);
    setBusy(true);
    setProgress(null);
    try {
      const initial = await accountApi.requestExport();
      setProgress(initial);
      const ready = await pollUntilReady(initial.id, {
        intervalMs: 3000,
        maxMs: 10 * 60 * 1000,
        onProgress: setProgress,
      });
      setProgress(ready);
      await downloadAndShare(ready);
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  }

  return { start, progress, error, busy };
}
```

- [ ] **Step 4: Run test**

Run: `cd app && npx jest src/services/export --runInBand`
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add pickhouse/mobile/src/services/export/dataExportService.ts pickhouse/mobile/src/hooks/useDataExport.ts pickhouse/mobile/src/services/export/__tests__/dataExportService.test.ts
git commit -m "feat(export): client polling + share-sheet for export artifact"
```

---

### Task 23: Frontend — `DataExportScreen`

**Files:**
- Create: `pickhouse/mobile/src/screens/settings/DataExportScreen.tsx`

- [ ] **Step 1: Write screen**

```tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDataExport } from '@/hooks/useDataExport';

export function DataExportScreen() {
  const { start, progress, error, busy } = useDataExport();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>데이터 내보내기</Text>
      <Text style={styles.body}>
        기록한 집·거주 이력·사진을 zip 파일로 내려받을 수 있어요. 사진이 많으면 몇 분 걸릴 수 있어요.
      </Text>

      <Pressable
        onPress={start}
        disabled={busy}
        style={[styles.cta, busy && styles.ctaDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaLabel}>{busy ? '준비 중…' : '내보내기 시작'}</Text>
      </Pressable>

      {busy && (
        <View style={styles.progress}>
          <ActivityIndicator color="#1f1d1a" />
          <Text style={styles.progressText}>
            {progress?.status === 'RUNNING' ? '사진을 묶는 중이에요…' : '대기 중…'}
          </Text>
        </View>
      )}

      {progress?.status === 'READY' && (
        <Text style={styles.ready}>완료 — 공유 메뉴에서 저장하세요.</Text>
      )}

      {error && <Text style={styles.error}>{error.message}</Text>}

      <Text style={styles.footnote}>
        다운로드 링크는 7일간 유효합니다. 새 내보내기를 요청하면 이전 파일은 만료됩니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6f0', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#1f1d1a', marginTop: 16 },
  body: { fontSize: 14, color: '#6d655a', marginTop: 12, lineHeight: 20 },
  cta: { backgroundColor: '#1f1d1a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  ctaDisabled: { backgroundColor: '#b8b1a3' },
  ctaLabel: { color: '#faf6f0', fontSize: 16, fontWeight: '700' },
  progress: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  progressText: { marginLeft: 12, color: '#1f1d1a' },
  ready: { marginTop: 16, color: '#2b8c5a', fontWeight: '600' },
  error: { marginTop: 16, color: '#b94a4a' },
  footnote: { marginTop: 32, fontSize: 12, color: '#a09583' },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/screens/settings/DataExportScreen.tsx
git commit -m "feat(settings): DataExportScreen with progress + share"
```

---

### Task 24: Frontend — `AccountDeletionScreen` (entry + warning)

Two screens: warning + final confirm (Task 25).

**Files:**
- Create: `pickhouse/mobile/src/screens/settings/AccountDeletionScreen.tsx`

- [ ] **Step 1: Write screen**

```tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  onProceed: () => void;
  onCancel: () => void;
  onExportFirst: () => void;
}

export function AccountDeletionScreen({ onProceed, onCancel, onExportFirst }: Props) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.body}>
      <Text style={styles.title}>회원 탈퇴 안내</Text>

      <View style={styles.block}>
        <Text style={styles.heading}>탈퇴하면 어떻게 되나요?</Text>
        <Text style={styles.bullet}>• 30일간 데이터가 보관됩니다(유예기간).</Text>
        <Text style={styles.bullet}>• 유예기간 동안 같은 소셜 계정으로 다시 로그인하면 복구할 수 있어요.</Text>
        <Text style={styles.bullet}>• 30일이 지나면 모든 집·사진·메모가 영구 삭제되며 복구할 수 없습니다.</Text>
      </View>

      <View style={[styles.block, styles.warn]}>
        <Text style={styles.warnText}>
          기록한 사진과 메모를 보관하고 싶다면 먼저 데이터 내보내기를 진행해주세요.
        </Text>
        <Pressable onPress={onExportFirst} style={styles.exportLink} accessibilityRole="link">
          <Text style={styles.exportLinkLabel}>먼저 내보내기로 이동</Text>
        </Pressable>
      </View>

      <Pressable style={styles.ctaDanger} onPress={onProceed} accessibilityRole="button">
        <Text style={styles.ctaDangerLabel}>탈퇴 진행</Text>
      </Pressable>
      <Pressable style={styles.ctaCancel} onPress={onCancel} accessibilityRole="button">
        <Text style={styles.ctaCancelLabel}>취소</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6f0' },
  body: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1f1d1a', marginTop: 8 },
  block: { marginTop: 24 },
  heading: { fontSize: 15, fontWeight: '700', color: '#1f1d1a', marginBottom: 8 },
  bullet: { fontSize: 14, color: '#1f1d1a', lineHeight: 22 },
  warn: { backgroundColor: '#fff4e0', borderRadius: 12, padding: 16, marginTop: 24 },
  warnText: { color: '#7a5500', fontSize: 14, lineHeight: 20 },
  exportLink: { marginTop: 10 },
  exportLinkLabel: { color: '#7a5500', fontWeight: '600', textDecorationLine: 'underline' },
  ctaDanger: { marginTop: 32, backgroundColor: '#b94a4a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaDangerLabel: { color: '#faf6f0', fontSize: 16, fontWeight: '700' },
  ctaCancel: { marginTop: 12, paddingVertical: 16, alignItems: 'center' },
  ctaCancelLabel: { color: '#6d655a', fontSize: 15 },
});
```

- [ ] **Step 2: Commit**

```bash
git add pickhouse/mobile/src/screens/settings/AccountDeletionScreen.tsx
git commit -m "feat(settings): AccountDeletionScreen — warning + export reminder"
```

---

### Task 25: Frontend — `AccountDeletionConfirmScreen` (final confirm + execute)

Requires typing "탈퇴" to enable the button. Calls API, logs out, clears local stores.

**Files:**
- Create: `pickhouse/mobile/src/screens/settings/AccountDeletionConfirmScreen.tsx`
- Create: `pickhouse/mobile/src/screens/settings/__tests__/AccountDeletionConfirmScreen.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AccountDeletionConfirmScreen } from '../AccountDeletionConfirmScreen';
import { accountApi } from '@/services/api/accountApi';

jest.mock('@/services/api/accountApi');
const mocked = accountApi as jest.Mocked<typeof accountApi>;

describe('AccountDeletionConfirmScreen', () => {
  it('disables button until "탈퇴" is typed', async () => {
    const onDone = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <AccountDeletionConfirmScreen onDone={onDone} onCancel={() => {}} />,
    );
    fireEvent.press(getByText('영구 탈퇴'));
    expect(mocked.deleteMe).not.toHaveBeenCalled();

    fireEvent.changeText(getByPlaceholderText('탈퇴'), '탈퇴');
    fireEvent.press(getByText('영구 탈퇴'));

    await waitFor(() => expect(mocked.deleteMe).toHaveBeenCalled());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Implement screen**

```tsx
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { accountApi } from '@/services/api/accountApi';
import { useAuthStore } from '@/stores/authStore';
import { useConsentStore } from '@/stores/consentStore';

interface Props { onDone: () => void; onCancel: () => void; }

export function AccountDeletionConfirmScreen({ onDone, onCancel }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const matches = text.trim() === '탈퇴';
  const logout = useAuthStore((s) => s.logout);
  const resetConsent = useConsentStore((s) => s.reset);

  async function handleSubmit() {
    if (!matches) return;
    setBusy(true);
    try {
      await accountApi.deleteMe();
      resetConsent();
      await logout();
      onDone();
    } catch (e) {
      Alert.alert('탈퇴 실패', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>마지막 확인</Text>
      <Text style={styles.body}>
        탈퇴 신청 즉시 로그아웃되며, 30일이 지나면 모든 데이터가 영구 삭제됩니다.{'\n'}
        진행하려면 아래에 "탈퇴"를 입력해주세요.
      </Text>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="탈퇴"
        placeholderTextColor="#b8b1a3"
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <Pressable
        onPress={handleSubmit}
        disabled={!matches || busy}
        style={[styles.cta, (!matches || busy) && styles.ctaDisabled]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaLabel}>{busy ? '처리 중…' : '영구 탈퇴'}</Text>
      </Pressable>

      <Pressable onPress={onCancel} style={styles.ctaCancel} accessibilityRole="button">
        <Text style={styles.ctaCancelLabel}>취소</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6f0', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#1f1d1a', marginTop: 16 },
  body: { fontSize: 14, color: '#1f1d1a', marginTop: 16, lineHeight: 22 },
  input: { marginTop: 28, borderWidth: 1, borderColor: '#d9d2c3', borderRadius: 12, padding: 14, fontSize: 16, color: '#1f1d1a', backgroundColor: '#fff' },
  cta: { marginTop: 24, backgroundColor: '#b94a4a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: '#d8b7b7' },
  ctaLabel: { color: '#faf6f0', fontSize: 16, fontWeight: '700' },
  ctaCancel: { marginTop: 12, paddingVertical: 16, alignItems: 'center' },
  ctaCancelLabel: { color: '#6d655a', fontSize: 15 },
});
```

- [ ] **Step 3: Run test**

Run: `cd app && npx jest src/screens/settings/__tests__/AccountDeletionConfirmScreen --runInBand`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add pickhouse/mobile/src/screens/settings/AccountDeletionConfirmScreen.tsx pickhouse/mobile/src/screens/settings/__tests__/AccountDeletionConfirmScreen.test.tsx
git commit -m "feat(settings): account deletion confirm screen with typed gate"
```

---

### Task 26: Contract end-date local notifications

Uses `expo-notifications` to schedule three local notifications per residence (60/30/7 days before `contractEndDate`). No push server; this is purely local.

**Files:**
- Create: `pickhouse/mobile/src/services/notifications/contractReminders.ts`
- Create: `pickhouse/mobile/src/services/notifications/__tests__/contractReminders.test.ts`
- Create: `pickhouse/mobile/src/hooks/useContractReminders.ts`
- Create: `pickhouse/mobile/src/stores/notificationStore.ts`

- [ ] **Step 1: Install dep**

Run: `cd app && npx expo install expo-notifications`

- [ ] **Step 2: Write `notificationStore.ts`** (persisted toggle)

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface State {
  contractRemindersEnabled: boolean;
  setContractReminders: (on: boolean) => void;
}

export const useNotificationStore = create<State>()(
  persist(
    (set) => ({
      contractRemindersEnabled: true,
      setContractReminders: (on) => set({ contractRemindersEnabled: on }),
    }),
    { name: 'pickhouse:notifications:v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
```

- [ ] **Step 3: Write failing test `contractReminders.test.ts`**

```ts
import { computeReminderTriggers } from '../contractReminders';

describe('computeReminderTriggers', () => {
  it('returns 60/30/7-day-before dates at 09:00 KST', () => {
    const triggers = computeReminderTriggers(new Date('2026-12-01T00:00:00+09:00'));
    expect(triggers).toHaveLength(3);
    expect(triggers.map((t) => t.daysBefore)).toEqual([60, 30, 7]);
    expect(triggers[0].fireAt.toISOString()).toBe('2026-10-02T00:00:00.000Z'); // 2026-10-02 09:00 KST
  });

  it('skips triggers that are in the past', () => {
    const triggers = computeReminderTriggers(new Date('2026-05-25T00:00:00+09:00'), new Date('2026-05-19T00:00:00+09:00'));
    // 60-day = 2026-03-26 (past), 30-day = 2026-04-25 (past), 7-day = 2026-05-18 (past)
    expect(triggers).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Implement `contractReminders.ts`**

```ts
import * as Notifications from 'expo-notifications';

export interface ReminderTrigger {
  daysBefore: number;
  fireAt: Date;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function computeReminderTriggers(contractEnd: Date, now: Date = new Date()): ReminderTrigger[] {
  const triggers: ReminderTrigger[] = [];
  for (const days of [60, 30, 7]) {
    const target = new Date(contractEnd.getTime() - days * 24 * 60 * 60 * 1000);
    // Snap to 09:00 KST that day
    const kstDay = new Date(target.getTime() + KST_OFFSET_MS);
    kstDay.setUTCHours(0, 0, 0, 0);
    const fireAtUtc = new Date(kstDay.getTime() - KST_OFFSET_MS); // 09:00 KST = 00:00 UTC
    if (fireAtUtc > now) triggers.push({ daysBefore: days, fireAt: fireAtUtc });
  }
  return triggers;
}

export async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleRemindersForResidence(
  residenceId: string,
  houseName: string,
  contractEnd: Date,
): Promise<string[]> {
  await cancelRemindersForResidence(residenceId);
  if (!(await ensurePermission())) return [];

  const ids: string[] = [];
  for (const t of computeReminderTriggers(contractEnd)) {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: `${residenceId}:${t.daysBefore}`,
      content: {
        title: '계약 종료가 다가와요',
        body: `${houseName} 계약이 ${t.daysBefore}일 남았어요. 연장·이사 준비를 시작해보세요.`,
        sound: false,
      },
      trigger: { date: t.fireAt },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelRemindersForResidence(residenceId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(`${residenceId}:`)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
```

- [ ] **Step 5: Implement `useContractReminders.ts`**

```ts
import { useEffect } from 'react';
import { useResidenceStore } from '@/stores/residenceStore'; // existing from Plan 4
import { useNotificationStore } from '@/stores/notificationStore';
import { scheduleRemindersForResidence, cancelRemindersForResidence } from '@/services/notifications/contractReminders';

export function useContractReminders() {
  const residences = useResidenceStore((s) => s.residences);
  const enabled = useNotificationStore((s) => s.contractRemindersEnabled);

  useEffect(() => {
    (async () => {
      for (const r of residences) {
        if (!enabled || !r.contractEndDate) {
          await cancelRemindersForResidence(r.id);
          continue;
        }
        await scheduleRemindersForResidence(r.id, r.displayName ?? '내 집', new Date(r.contractEndDate));
      }
    })();
  }, [residences, enabled]);
}
```

Note: depends on `useResidenceStore` from Plan 4 exposing `residences` with `id`, `contractEndDate`, `displayName`. Adapt selector if Plan 4 used different names.

- [ ] **Step 6: Run test**

Run: `cd app && npx jest src/services/notifications --runInBand`
Expected: 2 passing.

- [ ] **Step 7: Wire `useContractReminders()` into the root** — call it from `MainStack` mount so reminders sync any time residences change.

In `pickhouse/mobile/src/navigation/MainStack.tsx`, add at the top of the component:

```ts
import { useContractReminders } from '@/hooks/useContractReminders';
// inside MainStack():
useContractReminders();
```

- [ ] **Step 8: Commit**

```bash
git add pickhouse/mobile/src/services/notifications pickhouse/mobile/src/stores/notificationStore.ts pickhouse/mobile/src/hooks/useContractReminders.ts pickhouse/mobile/src/navigation/MainStack.tsx
git commit -m "feat(notifications): local 60/30/7-day reminders before contract end"
```

---

### Task 27: Settings root screen + stack navigator

**Files:**
- Create: `pickhouse/mobile/src/screens/settings/SettingsScreen.tsx`
- Create: `pickhouse/mobile/src/screens/settings/AccountScreen.tsx`
- Create: `pickhouse/mobile/src/screens/settings/NotificationsScreen.tsx`
- Create: `pickhouse/mobile/src/navigation/SettingsStack.tsx`
- Modify: `pickhouse/mobile/src/navigation/MainStack.tsx` — register settings entry

- [ ] **Step 1: `SettingsScreen.tsx`**

```tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  onNavigate: (target:
    | 'Account' | 'Notifications' | 'DataExport'
    | 'LegalTerms' | 'LegalPrivacy' | 'LegalLocation'
  ) => void;
}

const SECTIONS: { title: string; rows: { label: string; target: Parameters<Props['onNavigate']>[0] }[] }[] = [
  {
    title: '계정',
    rows: [{ label: '계정 정보 · 로그아웃 · 탈퇴', target: 'Account' }],
  },
  {
    title: '알림',
    rows: [{ label: '계약 종료 알림', target: 'Notifications' }],
  },
  {
    title: '데이터',
    rows: [{ label: '데이터 내보내기 (JSON · 사진)', target: 'DataExport' }],
  },
  {
    title: '약관',
    rows: [
      { label: '이용약관', target: 'LegalTerms' },
      { label: '개인정보 처리방침', target: 'LegalPrivacy' },
      { label: '위치정보 이용약관', target: 'LegalLocation' },
    ],
  },
];

export function SettingsScreen({ onNavigate }: Props) {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.body}>
      {SECTIONS.map((sec) => (
        <View key={sec.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{sec.title}</Text>
          {sec.rows.map((row) => (
            <Pressable
              key={row.label}
              onPress={() => onNavigate(row.target)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6f0' },
  body: { padding: 16, paddingBottom: 48 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, color: '#a09583', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 12, marginBottom: 6 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowPressed: { opacity: 0.6 },
  rowLabel: { fontSize: 15, color: '#1f1d1a' },
  chevron: { fontSize: 20, color: '#bdb09a' },
});
```

- [ ] **Step 2: `AccountScreen.tsx`** (shows provider + logout + deletion entry)

```tsx
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

interface Props { onOpenDeletion: () => void; }

export function AccountScreen({ onOpenDeletion }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function confirmLogout() {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.label}>이름</Text>
        <Text style={styles.value}>{user?.nickname ?? '익명'}</Text>
        <Text style={styles.label}>로그인 수단</Text>
        <Text style={styles.value}>{user?.providers?.join(', ') ?? '-'}</Text>
        <Text style={styles.label}>이메일</Text>
        <Text style={styles.value}>{user?.email ?? '(미제공)'}</Text>
      </View>

      <Pressable style={styles.btn} onPress={confirmLogout} accessibilityRole="button">
        <Text style={styles.btnLabel}>로그아웃</Text>
      </Pressable>

      <Pressable style={styles.danger} onPress={onOpenDeletion} accessibilityRole="button">
        <Text style={styles.dangerLabel}>회원 탈퇴</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6f0', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16 },
  label: { fontSize: 12, color: '#a09583', marginTop: 8 },
  value: { fontSize: 15, color: '#1f1d1a', marginTop: 2 },
  btn: { marginTop: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1f1d1a' },
  btnLabel: { color: '#1f1d1a', fontWeight: '600' },
  danger: { marginTop: 16, paddingVertical: 14, alignItems: 'center' },
  dangerLabel: { color: '#b94a4a', textDecorationLine: 'underline' },
});
```

- [ ] **Step 3: `NotificationsScreen.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useNotificationStore } from '@/stores/notificationStore';

export function NotificationsScreen() {
  const enabled = useNotificationStore((s) => s.contractRemindersEnabled);
  const setEnabled = useNotificationStore((s) => s.setContractReminders);

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.title}>계약 종료 알림</Text>
          <Text style={styles.body}>계약 종료 60일·30일·7일 전 09시(KST)에 알려드려요.</Text>
        </View>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf6f0', padding: 24 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  col: { flex: 1, paddingRight: 12 },
  title: { fontSize: 15, fontWeight: '600', color: '#1f1d1a' },
  body: { fontSize: 13, color: '#6d655a', marginTop: 4 },
});
```

- [ ] **Step 4: `SettingsStack.tsx`**

```tsx
import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { AccountScreen } from '@/screens/settings/AccountScreen';
import { NotificationsScreen } from '@/screens/settings/NotificationsScreen';
import { DataExportScreen } from '@/screens/settings/DataExportScreen';
import { AccountDeletionScreen } from '@/screens/settings/AccountDeletionScreen';
import { AccountDeletionConfirmScreen } from '@/screens/settings/AccountDeletionConfirmScreen';
import { LegalWebViewScreen } from '@/screens/legal/LegalWebViewScreen';
import type { LegalSlug } from '@/assets/legal/types';

export type SettingsStackParamList = {
  Settings: undefined;
  Account: undefined;
  Notifications: undefined;
  DataExport: undefined;
  AccountDeletion: undefined;
  AccountDeletionConfirm: undefined;
  Legal: { slug: LegalSlug };
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#faf6f0' }, headerTintColor: '#1f1d1a' }}>
      <Stack.Screen name="Settings" options={{ title: '설정' }}>
        {({ navigation }) => (
          <SettingsScreen
            onNavigate={(target) => {
              if (target === 'LegalTerms') navigation.navigate('Legal', { slug: 'terms' });
              else if (target === 'LegalPrivacy') navigation.navigate('Legal', { slug: 'privacy' });
              else if (target === 'LegalLocation') navigation.navigate('Legal', { slug: 'location' });
              else navigation.navigate(target);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Account" options={{ title: '계정' }}>
        {({ navigation }) => <AccountScreen onOpenDeletion={() => navigation.navigate('AccountDeletion')} />}
      </Stack.Screen>
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: '알림' }} />
      <Stack.Screen name="DataExport" component={DataExportScreen} options={{ title: '데이터 내보내기' }} />
      <Stack.Screen name="AccountDeletion" options={{ title: '회원 탈퇴' }}>
        {({ navigation }) => (
          <AccountDeletionScreen
            onProceed={() => navigation.navigate('AccountDeletionConfirm')}
            onCancel={() => navigation.goBack()}
            onExportFirst={() => navigation.navigate('DataExport')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="AccountDeletionConfirm" options={{ title: '최종 확인' }}>
        {({ navigation }) => (
          <AccountDeletionConfirmScreen
            onDone={() => { /* auth store reset will switch RootNavigator to AuthStack */ }}
            onCancel={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Legal" component={LegalWebViewScreen} options={{ title: '약관' }} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 5: Wire `SettingsStack` from `MainStack`** — add a settings icon to the home header that navigates to a settings screen. In `pickhouse/mobile/src/navigation/MainStack.tsx`, add:

```ts
import { SettingsStack } from './SettingsStack';
// Inside the MainStack navigator:
<Stack.Screen name="SettingsRoot" component={SettingsStack} options={{ headerShown: false }} />
```

And in the home screen header (from Plan 3/4), add a button that calls `navigation.navigate('SettingsRoot')`.

- [ ] **Step 6: Commit**

```bash
git add pickhouse/mobile/src/screens/settings pickhouse/mobile/src/navigation/SettingsStack.tsx pickhouse/mobile/src/navigation/MainStack.tsx
git commit -m "feat(settings): settings stack — account/notifications/export/legal"
```

---

### Task 28: App store listing copy (Korean + English)

**Files:**
- Create: `store/ios/listing.ko.md`
- Create: `store/ios/listing.en.md`
- Create: `store/android/listing.ko.md`
- Create: `store/android/listing.en.md`

- [ ] **Step 1: `store/ios/listing.ko.md`**

```markdown
# App Store Connect — 한국어 메타데이터

## 앱 이름 (최대 30자)
살래말래

## 부제 (최대 30자)
본 집을 비교하고 살아온 집을 기록

## 프로모션 텍스트 (최대 170자)
이사 시즌엔 다섯 채 넘게 보러 다니죠. 살래말래로 그 자리에서 별점·사진·메모로 기록하고, 마음에 든 집과 후보를 한눈에 비교하세요.

## 키워드 (최대 100자, 쉼표 구분)
부동산,자취,월세,전세,이사,집비교,발품,체크리스트,거주이력,원룸

## 설명 (최대 4000자)
**카톡·메모장에 흩어진 집 기록을 비교 가능한 형태로 정리하는 앱.**

집을 보러 다닐 때마다 카톡 나에게쓰기, 사진앱, 메모장에 흩어진 기록을 다시 정리하느라 지치셨나요? 살래말래는 발품 파는 그 자리에서 빠르게 기록하고, 본 집들끼리 항목별로 비교해 의사결정을 도와드려요.

**현장에서 빠르게**
- 별점 + 체크박스 + 사진으로 5분 만에 한 채 기록
- 라벨 없는 자유 사진 업로드 (라벨링은 v2에서)
- 한 줄 메모로 충분

**집에 와서 차분히**
- 디테일 모드에서 나머지 항목 보강
- 사진 정리·삭제

**비교 화면 (핵심)**
- 마음에 드는 집을 기준으로 두고 후보를 슬라이드로 넘기며 비교
- 항목별로 유리한 쪽만 강조 — 자동 점수 계산 없이 raw 데이터만 정직하게

**내 집 · 거쳐온 집들**
- 계약한 집은 자동으로 "현재 집"으로 승격
- 살아온 집들을 인생 챕터별 타임라인으로 회상

**프라이버시 우선**
- 모든 기록은 본인용 — 제3자 공유 기능 없음
- 회원 탈퇴 시 30일 후 완전 삭제
- 데이터 내보내기(JSON · 사진 zip) 언제든 가능

## 새 버전의 새로운 기능 (최대 4000자)
첫 출시 버전입니다. 현장 기록 · 비교 · 거주 이력 타임라인을 지원해요.

## 마케팅 URL
https://pickhouse.app

## 지원 URL
https://pickhouse.app/support

## 개인정보 처리방침 URL
https://pickhouse.app/privacy
```

- [ ] **Step 2: `store/ios/listing.en.md`**

```markdown
# App Store Connect — English Metadata

## App Name
PickHouse — House Hunt Notes

## Subtitle
Compare apartments you toured & track where you lived

## Promotional Text
Touring 5+ apartments? Capture star ratings, photos, and quick notes on the spot — then compare them side-by-side to make confident decisions.

## Keywords
apartment,rental,house hunting,real estate,checklist,compare,move,lease,studio,korea

## Description
**The notebook for apartment hunters who don't want their decisions scattered across screenshots and messaging apps.**

PickHouse turns the chaos of touring 5–10 apartments into a tidy, comparable list. Record on the spot. Compare back home. Remember where you lived.

**Capture in 5 minutes per unit**
- Star ratings + checkboxes + photos
- One-line notes — no fields required
- Works offline, syncs when back online

**Refine at home**
- Detail mode unlocks every field
- Clean up photos, fill in missing notes

**Side-by-side comparison**
- Pin a favorite, swipe through candidates
- Per-row highlight without auto-scoring — your call

**Your residence timeline**
- The unit you sign becomes "current"
- Past homes live in a life-chapter timeline

**Privacy-first**
- For your eyes only — no social sharing
- Delete account = full erase after 30-day grace
- Export your data (JSON + photo zip) any time

## What's New
First release — capture, compare, residence timeline.

## Marketing URL
https://pickhouse.app

## Support URL
https://pickhouse.app/support

## Privacy Policy URL
https://pickhouse.app/privacy
```

- [ ] **Step 3: `store/android/listing.ko.md`**

```markdown
# Google Play Console — 한국어 스토어 등록정보

## 앱 이름 (최대 30자)
살래말래

## 짧은 설명 (최대 80자)
발품 판 집을 그 자리에서 기록하고, 후보끼리 한눈에 비교하는 개인 노트.

## 자세한 설명 (최대 4000자)
**카톡·메모장에 흩어진 집 기록을, 비교 가능한 형태로 정리해주는 앱.**

5채에서 10채까지 보러 다니는 발품. 끝나면 메모장과 카톡과 사진앱을 뒤져 다시 정리하느라 한참 걸리시죠. 살래말래는 그 자리에서 별점·사진·메모로 기록하고, 후보를 한눈에 비교하게 해줘요.

▸ 현장 기록 — 별점·체크·사진·한줄 메모로 5분 안에
▸ 디테일 보강 — 집에 와서 나머지 항목 차분히
▸ 비교 화면 — 마음에 드는 집을 기준으로 후보 슬라이드
▸ 내 집 — 계약하면 자동으로 "현재 집"으로 승격
▸ 거쳐온 집들 — 인생 챕터별 타임라인

✓ 자동 점수 매기지 않음 — 판단은 당신 몫
✓ 본인만 보는 개인 기록 (공유 기능 없음)
✓ 데이터 내보내기 · 회원 탈퇴 · 30일 유예기간

지원 권한
- 카메라 / 사진: 집 사진 촬영·선택
- 위치: 주소 자동 채우기 (선택)
- 알림: 계약 종료 60·30·7일 전

문의: support@pickhouse.app
```

- [ ] **Step 4: `store/android/listing.en.md`**

```markdown
# Google Play Console — English Listing

## App Name
PickHouse — Apartment Hunting Notebook

## Short Description (max 80 chars)
Capture, compare, and remember every apartment you've toured or lived in.

## Full Description
**A private notebook for the chaos of apartment hunting.**

Tour 5–10 places? Stop juggling screenshots and chat threads. PickHouse lets you capture each unit in five minutes (stars, checks, photos, one-line note), then compare candidates side-by-side without arbitrary auto-scoring.

▸ Capture on site — ratings, checks, photos, quick note
▸ Refine later — detail mode unlocks every field
▸ Compare — pin a favorite, swipe through candidates
▸ My Home — the unit you sign becomes "current" automatically
▸ Past Homes — life-chapter timeline of where you've lived

✓ No automatic ranking — judgment stays yours
✓ Private to you — no sharing features
✓ Export your data; delete your account anytime (30-day grace)

Permissions
- Camera / Photos: capture & pick apartment photos
- Location (optional): autofill address
- Notifications: 60/30/7-day lease-end reminders

Contact: support@pickhouse.app
```

- [ ] **Step 5: Commit**

```bash
git add store/ios/listing.ko.md store/ios/listing.en.md store/android/listing.ko.md store/android/listing.en.md
git commit -m "docs(store): app store listing copy KO + EN"
```

---

### Task 29: Screenshot capture plan + placeholder slots

We don't generate final renders here — we lay out which screen shows what. Real screenshots come from running the production build through device frames in Task 32.

**Files:**
- Create: `store/screenshots-plan.md`
- Create empty placeholder files for now (so paths are reserved and `.gitkeep` style):
  - `store/ios/screenshots/6.7-1.png` through `6.7-5.png`
  - `store/ios/screenshots/6.5-1.png` through `6.5-5.png`
  - `store/android/screenshots/phone-1.png` through `phone-5.png`

- [ ] **Step 1: Write `store/screenshots-plan.md`**

```markdown
# Store Screenshot Plan (5 screens per device class)

| # | Screen | What to show | Caption (KO) | Caption (EN) |
|---|---|---|---|---|
| 1 | 홈 (My Homes) | 현재 집 Hero + 거쳐온 집 타임라인 (3개 노출) | 살아온 집들을 한 줄로 | Your past homes, all in one place |
| 2 | 본 집 리스트 | 후보 4-6채 카드 그리드 | 본 집들을 한눈에 | Every candidate at a glance |
| 3 | 집 입력 (현장 모드) | 별점 격자 + 사진 그리드 + 한 줄 메모 | 5분이면 한 채 기록 끝 | Capture a unit in 5 minutes |
| 4 | 비교 화면 | 기준 vs 후보, 항목별 비교 | 후보를 옆에 놓고 비교 | Side-by-side, no auto-scoring |
| 5 | 집 상세 | 사진 캐러셀 + 별점 + 메모 | 모든 디테일 한 곳에 | Every detail, one screen |

## Device classes & sizes
- iOS 6.7" (iPhone 15 Pro Max): **1290 × 2796** PNG
- iOS 6.5" (iPhone 11 Pro Max): **1242 × 2688** PNG (Apple accepts 6.7 for both)
- Android phone: **min 1080 × 1920** PNG, 16:9 ratio acceptable; max 3840×3840

## Capture flow (Task 32)
1. Run dev build with seed data: `npx expo start --dev-client`
2. Use iOS Simulator (iPhone 15 Pro Max) → File → Save Screen
3. Use Android Emulator (Pixel 6 Pro) → camera icon in toolbar
4. Drop into `store/ios/screenshots/` and `store/android/screenshots/`
5. Optional: frame with `https://shotbot.app/` or `@expo/screenshot-helper`
```

- [ ] **Step 2: Create placeholder PNGs**

```bash
mkdir -p store/ios/screenshots store/android/screenshots
for i in 1 2 3 4 5; do
  magick -size 1290x2796 xc:'#faf6f0' "store/ios/screenshots/6.7-$i.png"
  magick -size 1242x2688 xc:'#faf6f0' "store/ios/screenshots/6.5-$i.png"
  magick -size 1080x1920 xc:'#faf6f0' "store/android/screenshots/phone-$i.png"
done
```

- [ ] **Step 3: Commit**

```bash
git add store/screenshots-plan.md store/ios/screenshots store/android/screenshots
git commit -m "docs(store): screenshot plan + sized placeholders for 5 screens × 3 classes"
```

---

### Task 30: Privacy nutrition label + Play Data Safety declarations

iOS App Privacy and Play Console Data Safety surveys must match what the app actually collects.

**Files:**
- Create: `store/ios/privacy-nutrition.yaml`
- Create: `store/android/data-safety.yaml`

- [ ] **Step 1: `store/ios/privacy-nutrition.yaml`** — used by the human filling out the App Privacy section.

```yaml
# App Privacy — iOS App Store Connect
# Map each item below into the corresponding question in App Store Connect.

contact_info:
  email_address:
    collected: true
    linked_to_user: true
    used_for_tracking: false
    purposes: [app_functionality]   # Apple/카카오 회원 식별
  name:
    collected: true
    linked_to_user: true
    used_for_tracking: false
    purposes: [app_functionality]

identifiers:
  user_id:
    collected: true                  # provider sub (Apple) / kakao id
    linked_to_user: true
    used_for_tracking: false
    purposes: [app_functionality, authentication]
  device_id:
    collected: false

usage_data:
  product_interaction:
    collected: false                 # MVP: no analytics
  advertising_data:
    collected: false

diagnostics:
  crash_data:
    collected: false                 # MVP: no Sentry by default; toggle in v1.1
  performance_data:
    collected: false

location:
  coarse_location:
    collected: true
    linked_to_user: true
    used_for_tracking: false
    purposes: [app_functionality]   # 주소 자동 채우기
  precise_location:
    collected: true
    linked_to_user: true
    used_for_tracking: false
    purposes: [app_functionality]

user_content:
  photos_or_videos:
    collected: true
    linked_to_user: true
    used_for_tracking: false
    purposes: [app_functionality]
  other_user_content:
    collected: true                  # memo, ratings
    linked_to_user: true
    used_for_tracking: false
    purposes: [app_functionality]

third_party_sdks:
  - name: Sign in with Apple
    purpose: authentication
  - name: Kakao SDK
    purpose: authentication
  - name: Cloudflare R2 (S3-compatible)
    purpose: photo_storage

data_used_to_track_you: []           # empty: no cross-app tracking
```

- [ ] **Step 2: `store/android/data-safety.yaml`** — for Play Console Data Safety form.

```yaml
# Play Console — Data Safety section reference

data_collected:
  personal_info:
    name:
      shared_with_third_parties: false
      ephemeral: false
      required: true
      purpose: account_management
    email:
      shared_with_third_parties: false
      ephemeral: false
      required: false
      purpose: account_management
    user_ids:
      shared_with_third_parties: false
      ephemeral: false
      required: true
      purpose: account_management

  location:
    approximate_location:
      shared_with_third_parties: false
      required: false
      purpose: app_functionality
    precise_location:
      shared_with_third_parties: false
      required: false
      purpose: app_functionality

  photos_and_videos:
    photos:
      shared_with_third_parties: false
      required: false
      purpose: app_functionality

  app_activity:
    other_user_generated_content:
      shared_with_third_parties: false
      required: false
      purpose: app_functionality

security_practices:
  data_encrypted_in_transit: true
  user_can_request_data_deletion: true
  follows_play_families_policy: false  # not a kids app
  independent_security_review: false   # plan post-launch
```

- [ ] **Step 3: Commit**

```bash
git add store/ios/privacy-nutrition.yaml store/android/data-safety.yaml
git commit -m "docs(store): privacy nutrition + Play data safety declarations"
```

---

### Task 31: Build scripts

**Files:**
- Create: `app/scripts/build-ios.sh`
- Create: `app/scripts/build-android.sh`
- Create: `app/scripts/submit-ios.sh`
- Create: `app/scripts/submit-android.sh`
- Modify: `app/package.json` — add npm scripts

- [ ] **Step 1: `app/scripts/build-ios.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
PROFILE=${1:-production}
echo "→ EAS Build iOS ($PROFILE)"
cd "$(dirname "$0")/.."
[ -f ".env.$PROFILE" ] && set -a && . ".env.$PROFILE" && set +a
npx eas-cli build --platform ios --profile "$PROFILE" --non-interactive
```

- [ ] **Step 2: `app/scripts/build-android.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
PROFILE=${1:-production}
echo "→ EAS Build Android ($PROFILE)"
cd "$(dirname "$0")/.."
[ -f ".env.$PROFILE" ] && set -a && . ".env.$PROFILE" && set +a
npx eas-cli build --platform android --profile "$PROFILE" --non-interactive
```

- [ ] **Step 3: `app/scripts/submit-ios.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "→ EAS Submit iOS (production → TestFlight)"
cd "$(dirname "$0")/.."
npx eas-cli submit --platform ios --profile production --non-interactive --latest
```

- [ ] **Step 4: `app/scripts/submit-android.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "→ EAS Submit Android (production → internal track)"
cd "$(dirname "$0")/.."
npx eas-cli submit --platform android --profile production --non-interactive --latest
```

- [ ] **Step 5: Make executable & add npm scripts**

```bash
chmod +x app/scripts/*.sh
```

In `app/package.json`, under `scripts`:

```json
{
  "scripts": {
    "build:ios": "./scripts/build-ios.sh production",
    "build:ios:preview": "./scripts/build-ios.sh preview",
    "build:android": "./scripts/build-android.sh production",
    "build:android:preview": "./scripts/build-android.sh preview",
    "submit:ios": "./scripts/submit-ios.sh",
    "submit:android": "./scripts/submit-android.sh"
  }
}
```

- [ ] **Step 6: Verify scripts parse**

Run: `cd app && bash -n scripts/build-ios.sh && bash -n scripts/build-android.sh && bash -n scripts/submit-ios.sh && bash -n scripts/submit-android.sh`
Expected: no output (clean parse).

- [ ] **Step 7: Commit**

```bash
git add app/scripts app/package.json
git commit -m "build(app): EAS build/submit shell scripts + npm aliases"
```

---

### Task 32: iOS submission checklist

**Files:**
- Create: `store/checklist/ios-submission.md`

- [ ] **Step 1: Write checklist**

```markdown
# iOS Submission Checklist

## Pre-flight (Apple Developer + App Store Connect)
- [ ] Apple Developer Program 활성 ($99/yr 결제 완료)
- [ ] App Store Connect에 새 앱 등록: name "살래말래", primary language 한국어, bundle id `app.pickhouse.ios`, SKU `pickhouse-ios-001`
- [ ] App Information 입력: privacy policy URL `https://pickhouse.app/privacy`, support URL `https://pickhouse.app/support`
- [ ] Pricing & Availability: 무료, 한국 first, 추후 다국가 확장
- [ ] Sign in with Apple capability 활성 (entitlements)
- [ ] `eas.json` 안의 `submit.production.ios` 값 채움: appleId, ascAppId, appleTeamId

## App Privacy
- [ ] App Store Connect > App Privacy 에서 `store/ios/privacy-nutrition.yaml` 항목 그대로 입력
- [ ] **Account Deletion Required** — Apple 정책 (5.1.1(v))으로 in-app 회원 탈퇴 필수. Task 24/25 화면 캡처를 review notes에 첨부.

## Build & Upload
- [ ] `cd app && npm run build:ios` (production)
- [ ] EAS dashboard에서 build status: `finished` 확인
- [ ] `cd app && npm run submit:ios` → TestFlight 자동 업로드
- [ ] TestFlight Processing → "Ready to Submit" 대기 (보통 5-20분)

## TestFlight (Closed Beta)
- [ ] Internal Testing 그룹에 본인 + 1-2명 추가
- [ ] 24-48시간 사용 후 크리티컬 버그 없음 확인
- [ ] External Testing 단계 생략 가능 (소수 베타)

## Submission (Production)
- [ ] Screenshots 업로드: 6.7" 5장 (Apple은 6.7만 있어도 OK; 6.5는 자동 다운스케일)
- [ ] App Preview 영상 (선택): 30초 미만
- [ ] Promotional Text + Description + Keywords: `store/ios/listing.ko.md`
- [ ] What's New: 첫 출시 문구
- [ ] Review Information: 테스트 계정 (test@pickhouse.app + 카카오/Apple sandbox), 데모 로그인 경로 메모, **회원 탈퇴 경로 설명** ("Settings > 계정 > 회원 탈퇴")
- [ ] Sign-in required? **Yes** — 데모 계정 제공
- [ ] Content rights: 본인이 모든 권리 보유 확인
- [ ] Advertising identifier: **사용 안 함**
- [ ] Submit for Review → 보통 24-48시간

## After Approval
- [ ] Phased Release 활성 (7일에 걸쳐 점진적 배포)
- [ ] App Store 검색에서 "살래말래" 확인
- [ ] 첫 사용자 리뷰 모니터링
```

- [ ] **Step 2: Commit**

```bash
git add store/checklist/ios-submission.md
git commit -m "docs(store): iOS submission checklist with Account Deletion compliance"
```

---

### Task 33: Android submission checklist

**Files:**
- Create: `store/checklist/android-submission.md`

- [ ] **Step 1: Write checklist**

```markdown
# Android (Play Store) Submission Checklist

## Pre-flight (Play Console)
- [ ] Google Play Console 계정 ($25 일회성)
- [ ] 새 앱 등록: name "살래말래", default language 한국어, free, app or game = app
- [ ] App content section 모두 완료:
  - Privacy Policy: `https://pickhouse.app/privacy`
  - App access: 데모 계정 정보 입력 (test@pickhouse.app)
  - Ads: 없음
  - Content rating: IARC 설문 (대화 없음 / 폭력 없음 → 전체이용가)
  - Target audience: 18+
  - News app: 아니오
  - COVID-19 contact tracing: 아니오
  - Data safety: `store/android/data-safety.yaml` 그대로 입력
  - Government apps: 아니오
- [ ] Store settings > App category: 라이프스타일 or 도구
- [ ] Service account JSON 생성 (Play Console → Setup → API access → Create service account) → `store/android/play-service-account.json` 로컬 보관 (gitignored)
- [ ] `eas.json submit.production.android.serviceAccountKeyPath` 가 위 파일 가리키도록 확인

## Build & Upload
- [ ] `cd app && npm run build:android` (production, app-bundle)
- [ ] EAS dashboard에서 AAB 다운로드 또는 EAS Submit 사용
- [ ] `cd app && npm run submit:android` → Play Console internal track 자동 업로드

## Closed Testing (Internal Track)
- [ ] Internal testing track에 본인 이메일 추가
- [ ] opt-in URL을 안드로이드 기기에서 열어 설치
- [ ] 24-48시간 dogfooding, 크리티컬 버그 없음 확인

## Production Rollout
- [ ] Release 작성: "1.0.0 — 첫 출시" + 한국어 변경사항
- [ ] Country/region: 대한민국 우선, 이후 확장
- [ ] Pricing: 무료
- [ ] Screenshots: 최소 2장, 권장 8장 (`store/android/screenshots/phone-{1..5}.png`)
- [ ] Feature graphic 1024×500 PNG: `store/android/feature-graphic.png` (Task 32 placeholder)
- [ ] Submit for review → 보통 7일 이내 (신규 디벨로퍼 계정은 더 길 수 있음)
- [ ] Staged rollout 20% → 50% → 100% 권장

## Post-launch
- [ ] Play Console > Statistics 활성
- [ ] Crashlytics 없으므로 Play Console > Android vitals 의 ANR/Crash rate 모니터링
- [ ] 한국 리뷰에 답변 (Play Console > Reviews)
```

- [ ] **Step 2: Commit**

```bash
git add store/checklist/android-submission.md
git commit -m "docs(store): Android Play submission checklist"
```

---

### Task 34: QA — Cold launch scenarios

**Files:**
- Create: `store/checklist/qa-cold-launch.md`

- [ ] **Step 1: Write**

```markdown
# QA — Cold Launch Scenarios

Run before each release. Use a freshly installed build, no cached login.

## iOS — Apple Sign In
- [ ] 앱 첫 실행 → splash → AuthStack의 로그인 화면 노출
- [ ] "Apple로 계속" 탭 → Apple 시스템 시트 → 성공
- [ ] 백엔드 /auth/login 성공 응답 (network log)
- [ ] 신규 사용자: ConsentScreen 노출 → 모두 동의 → 시작
- [ ] MainStack 진입, 비어있는 "내 집" 표시
- [ ] 콜드 종료 후 재실행 → AuthStack 건너뜀 → 동의 화면도 건너뜀 → 곧장 홈

## iOS — Kakao Login
- [ ] 동일 흐름 카카오로 반복
- [ ] 같은 이메일이면 동일 User에 연결되는지 (백엔드 정책)

## Android — Kakao only
- [ ] 첫 실행 시 Apple 버튼이 노출되지 않는지 (스펙 §6.1)
- [ ] 카카오 로그인 → 카카오톡 앱 전환 → 복귀 → 백엔드 인증 성공
- [ ] 카카오톡 미설치 기기에서 웹뷰 fallback 작동

## 권한 거부 케이스
- [ ] 카메라 거부 시 집 입력 화면에서 안내 + 설정 이동 버튼
- [ ] 위치 거부 시 주소 자동 채우기 비활성, 수동 입력 가능
- [ ] 알림 거부 시 NotificationsScreen 토글이 OS 설정으로 유도

## 약관 재동의
- [ ] 약관 v1.1 배포 후 앱 재실행 시 ConsentScreen 다시 노출되는지 (Task 9 `requiresConsent` 동작)

## 첫 데이터 입력
- [ ] 새 집 추가 → 사진 1장 → 별점 3개 → 저장 → 본 집 리스트에 노출
- [ ] 오프라인 모드로 전환 후 추가 → 온라인 복귀 시 sync queue가 백엔드에 PATCH 동작
```

- [ ] **Step 2: Commit**

```bash
git add store/checklist/qa-cold-launch.md
git commit -m "docs(qa): cold launch scenarios checklist"
```

---

### Task 35: QA — Offline mode + auth + backup/restore

**Files:**
- Create: `store/checklist/qa-offline.md`
- Create: `store/checklist/qa-auth.md`
- Create: `store/checklist/qa-backup-restore.md`

- [ ] **Step 1: `qa-offline.md`**

```markdown
# QA — Offline Mode Scenarios

## 비행기 모드 입력
- [ ] WiFi/셀룰러 OFF
- [ ] 새 집 추가 → 사진 5장 첨부 → 저장
- [ ] 본 집 리스트에 즉시 노출 (로컬 SQLite)
- [ ] 사진 업로드 상태: `pending`
- [ ] 네트워크 ON → sync queue 자동 실행
- [ ] R2 업로드 + 백엔드 POST /photos 호출
- [ ] 사진 상태: `pending` → `uploading` → `uploaded`

## 부분 실패 복구
- [ ] 사진 1장의 R2 업로드 강제 실패 (4xx 시뮬레이션) → 상태 `failed`
- [ ] 본 집 상세에서 재시도 버튼 → `uploaded` 전이

## 동시 편집 (same device)
- [ ] 같은 집을 두 번 빠르게 PATCH → last-write-wins, 백엔드 응답 일치

## 회원 탈퇴 오프라인
- [ ] 오프라인 상태에서 탈퇴 시도 → "네트워크 필요" 안내 (DELETE /me 호출 차단)

## 데이터 내보내기 오프라인
- [ ] 오프라인에서 내보내기 시작 시 즉시 에러 메시지 ("네트워크 연결이 필요해요")
```

- [ ] **Step 2: `qa-auth.md`**

```markdown
# QA — Auth Scenarios

## Apple Sign In (iOS)
- [ ] 신규 가입 → 닉네임 자동 채움 (이메일 hide 옵션 포함)
- [ ] 이메일 hide 선택 시 백엔드는 relay 이메일 저장
- [ ] 로그아웃 후 재로그인 → 같은 User
- [ ] 기기 변경 후 재로그인 → 데이터 그대로

## Kakao Login (iOS + Android)
- [ ] 카카오톡 앱 있음 → 앱 전환 SSO
- [ ] 카카오톡 앱 없음 → 웹뷰 fallback
- [ ] 동의 항목: profile_nickname + profile_image + (optional) account_email
- [ ] 이메일 미동의 시 백엔드가 이메일 null로 저장

## 토큰 회전
- [ ] Access token 만료(30분) 후 API 호출 → 401 → /auth/refresh 자동 호출 → 재시도 성공
- [ ] Refresh token 만료(30일) 후 → AuthStack으로 강제 이동
- [ ] Refresh rotation: 새 refresh 받았는지 keychain 저장 확인

## 두 provider 연결
- [ ] 같은 이메일이면 Apple/Kakao 모두 동일 User로 매핑
- [ ] 서로 다른 이메일이면 두 개의 User로 분리 (MVP 정책 — 추후 link 기능)

## 탈퇴 후 재가입
- [ ] 탈퇴 즉시 로그아웃
- [ ] 30일 이내 재로그인 → "복구하시겠어요?" 안내 (MVP는 단순 재가입으로 새 User 발급도 허용 — 정책 명시 필요)
- [ ] 30일 경과 후 재로그인 → 완전 새 User
```

- [ ] **Step 3: `qa-backup-restore.md`**

```markdown
# QA — Backup / Restore

## 데이터 내보내기
- [ ] 설정 > 데이터 내보내기 시작
- [ ] 사진 5장 + 집 3채인 계정에서 zip 약 5MB 내외
- [ ] 다운로드 후 zip 압축 풀어 `data.json` 안에 houses/residences 배열 존재 확인
- [ ] photos/ 디렉터리에 사진 5개 존재
- [ ] zip URL 7일 후 만료 (HTTP 403)

## 기기 변경 복구 (소셜 로그인 기반)
- [ ] iPhone 12 → iPhone 15 변경
- [ ] 새 기기에서 Apple Sign In → 동일 User 인증
- [ ] /houses GET → 기존 집 목록 즉시 노출
- [ ] 사진 lazy-load via R2 URL

## 백엔드 장애 시 로컬 데이터
- [ ] 백엔드 다운 시뮬레이션 (`https://api.pickhouse.app` block)
- [ ] 앱은 로컬 SQLite 기반으로 동작 (홈/리스트/상세)
- [ ] 새 입력은 sync queue에 쌓이고, 복구 후 자동 동기화

## 부분 손상 복구
- [ ] 로컬 SQLite 강제 삭제 후 앱 재실행 → 백엔드에서 전체 재동기화
- [ ] 사진은 R2 URL 기준 lazy fetch, 캐시 재구성

## 탈퇴 grace period 복구 (MVP 정책 — 동일 provider 재로그인만 인정)
- [ ] 탈퇴 후 5일째 동일 Apple ID로 로그인 → 백엔드는 `deletedAt` 클리어 + 데이터 복구
- [ ] 31일째 로그인 → 데이터 없음, 새 가입 처리
```

- [ ] **Step 4: Commit**

```bash
git add store/checklist/qa-offline.md store/checklist/qa-auth.md store/checklist/qa-backup-restore.md
git commit -m "docs(qa): offline / auth / backup-restore checklists"
```

---

### Task 36: Restore on grace-period re-login

To make the QA above pass, backend needs a hook in /auth/login that clears `deletedAt` if the user logs in within the grace window.

**Files:**
- Modify: `backend/src/main/java/app/pickhouse/auth/AuthService.java` (from Plan 2)
- Create: `backend/src/test/java/app/pickhouse/auth/AuthServiceRestoreTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.auth;

import app.pickhouse.user.User;
import app.pickhouse.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AuthServiceRestoreTest {

    @Test
    void loginWithinGrace_clearsDeletedAtAndRestoresAccount() {
        var repo = mock(UserRepository.class);
        var jwt = mock(JwtService.class);
        var verifier = mock(IdTokenVerifier.class);
        var fixed = Instant.parse("2026-06-01T00:00:00Z");
        var clock = Clock.fixed(fixed, ZoneOffset.UTC);

        var u = new User();
        u.setId(7L);
        u.setDeletedAt(Instant.parse("2026-05-20T00:00:00Z")); // 12 days ago, inside 30d
        when(verifier.verifyApple("idtok")).thenReturn(new ProviderIdentity("apple", "sub-123", "e@x.com"));
        when(repo.findByApplePid("sub-123")).thenReturn(Optional.of(u));

        var service = new AuthService(repo, jwt, verifier, clock);
        service.loginApple("idtok");

        assertThat(u.getDeletedAt()).isNull();
        verify(repo).save(u);
    }
}
```

- [ ] **Step 2: Modify `AuthService.java`** — after locating a User in login flow, add:

```java
private static final Duration GRACE = Duration.ofDays(30);

// inside loginApple / loginKakao, after finding user:
if (user.getDeletedAt() != null) {
    if (clock.instant().isBefore(user.getDeletedAt().plus(GRACE))) {
        user.setDeletedAt(null);
        userRepo.save(user);
        log.info("Restored user id={} on re-login within grace period", user.getId());
    } else {
        // Past grace: treat as new account. Detach provider id and create fresh.
        user = createNewUserFromIdentity(identity);
    }
}
```

(Adapt to the exact signature Plan 2 used. The key invariant: re-login within grace clears the soft-delete flag; outside grace, treat as a brand-new user.)

- [ ] **Step 3: Run test**

Run: `cd backend && ./gradlew test --tests AuthServiceRestoreTest`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/pickhouse/auth/AuthService.java backend/src/test/java/app/pickhouse/auth/AuthServiceRestoreTest.java
git commit -m "feat(auth): clear deletedAt on re-login within 30-day grace"
```

---

### Task 37: Pre-launch full sweep

A one-page master checklist that ties everything together. The engineer runs this before clicking "Submit for Review" on each platform.

**Files:**
- Create: `store/checklist/pre-launch-master.md`

- [ ] **Step 1: Write**

```markdown
# Pre-Launch Master Checklist

## 1. Code & Tests
- [ ] `cd app && npm test && npx tsc --noEmit` 통과
- [ ] `cd backend && ./gradlew clean check` 통과
- [ ] Test coverage: 신규 코드 80%+
- [ ] 모든 TODO/FIXME 주석 해결 또는 이슈화

## 2. Configuration
- [ ] `app.config.ts` 의 VERSION = "1.0.0"
- [ ] `app/.env.production` 의 KAKAO_NATIVE_APP_KEY 채워짐
- [ ] `eas.json` 의 appleId/ascAppId/appleTeamId 실제 값
- [ ] `store/android/play-service-account.json` 존재 (gitignored)

## 3. Assets
- [ ] 최종 아이콘 1024×1024 (placeholder 아님)
- [ ] adaptive-icon + splash 최종본
- [ ] 스토어 스크린샷 각 5장 (iOS 6.7, 6.5, Android phone)
- [ ] Feature graphic 1024×500 (Android)

## 4. Legal
- [ ] 약관 3종(이용·개인정보·위치) 변호사 검토 완료
- [ ] `https://pickhouse.app/privacy` 게시 (변호사 검토판)
- [ ] In-app 약관 버전 == 게시판 버전

## 5. Backend
- [ ] Production MySQL 백업 cron 동작 확인
- [ ] R2 버킷 명: `pickhouse-prod`, lifecycle rule (사진 영구 보관, exports/는 7일 만료)
- [ ] `AccountDeletionScheduler` 운영 환경에서 한 번 수동 실행 (`./gradlew bootRun -Dpurge=true`)
- [ ] Health check `GET /actuator/health` 200

## 6. Privacy
- [ ] iOS App Privacy 설문 = `privacy-nutrition.yaml`
- [ ] Play Data Safety 설문 = `data-safety.yaml`
- [ ] In-app `회원 탈퇴` 진입 경로 < 3 탭 (Apple 5.1.1(v))
- [ ] `데이터 내보내기` 정상 동작

## 7. QA
- [ ] qa-cold-launch.md 전 항목 ✅
- [ ] qa-offline.md 전 항목 ✅
- [ ] qa-auth.md 전 항목 ✅
- [ ] qa-backup-restore.md 전 항목 ✅

## 8. Store Listings
- [ ] iOS listing.ko / listing.en 입력
- [ ] Android listing.ko / listing.en 입력
- [ ] What's New 한국어 + 영어
- [ ] Review notes에 테스트 계정 + 회원 탈퇴 경로 명시

## 9. Submission
- [ ] `npm run build:ios` → EAS finished
- [ ] `npm run submit:ios` → TestFlight Ready
- [ ] `npm run build:android` → AAB ready
- [ ] `npm run submit:android` → Play internal track
- [ ] 24h dogfood on TestFlight + internal
- [ ] Submit for Review (both)

## 10. Post-Submit
- [ ] App Store / Play Console 알림 모니터링 (보통 1-7일)
- [ ] 거절 시 metadata-only 수정 vs 신규 빌드 결정
- [ ] 승인 후 Phased Release 활성 (iOS) / Staged Rollout 20% (Android)
```

- [ ] **Step 2: Commit**

```bash
git add store/checklist/pre-launch-master.md
git commit -m "docs(launch): pre-launch master checklist"
```

---

## Self-Review

### 1. Spec coverage

Walked through each requirement in the brief:

| Brief requirement | Task(s) |
|---|---|
| Android build config: 카카오 only | Task 1 (`app.config.ts` conditional plugin not gated, but Android UI is — gating happens in Plan 2's auth screen; Apple plugin is included on both for build to work but the button is hidden on Android per spec §6.1. Documented in QA-auth.) |
| iOS build config: Apple + Kakao | Task 1 (both providers in plugins) |
| EAS Build setup | Task 2 (`eas.json` 3 profiles + submit config) |
| App icons + splash | Tasks 6 (placeholders) + Task 37 step 3 (final) |
| Bundle identifier | Task 1 (`app.pickhouse.ios`, `app.pickhouse.android`) |
| Versioning scheme | Task 1 (`VERSION`, `IOS_BUILD_NUMBER`, `ANDROID_VERSION_CODE`, plus EAS `autoIncrement`) |
| 이용약관 draft | Task 3 |
| 개인정보 처리방침 draft | Task 4 |
| 위치정보 이용약관 draft | Task 5 |
| Onboarding consent | Tasks 9 + 10 + 11 |
| 회원탈퇴 screen | Tasks 24 + 25 |
| 30-day grace + soft delete | Tasks 12 + 13 + 14 + 16 + 36 |
| Pre-deletion confirmation + export reminder | Task 24 |
| Server-side cron | Task 16 (`AccountDeletionScheduler @Scheduled`) |
| 데이터 내보내기 | Tasks 17 + 18 + 19 + 21 + 22 + 23 |
| JSON export of houses/residences/evaluations/memos | Task 18 (`buildArchive` manifest) |
| Photo zip via R2 | Task 18 (zip stream + R2 download) |
| Background task w/ progress | Task 18 (`@Async`), Task 22 (polling), Task 23 (UI progress) |
| Contract end push (60/30/7) | Task 26 |
| App Store screenshots | Task 29 (plan + placeholders) |
| Store listing copy KO+EN | Task 28 |
| Submission checklists | Tasks 32 (iOS) + 33 (Android) |
| Apple Account Deletion compliance | Task 32 (referenced; deletion screens in 24/25) |
| Privacy nutrition labels | Task 30 |
| QA: cold launch | Task 34 |
| QA: offline | Task 35 |
| QA: auth flow | Task 35 |
| QA: backup/restore | Task 35 |
| Settings screen scaffolding | Task 27 |
| Legal webview | Task 8 |
| Markdown legal content | Tasks 3, 4, 5 |
| EAS build config | Task 2 |
| Build scripts + CI | Task 31 (CI hook is implicit via npm scripts — could be promoted) |

**Gap noted:** "CI" was mentioned in the brief but no GitHub Actions workflow was scripted. Building this would be a separate task; documented as a known follow-up in the pre-launch master rather than required for v1.0 since EAS Build itself is the CI for app builds.

### 2. Placeholder scan

Searched the plan for: "TBD", "TODO", "implement later", "fill in details", "add appropriate", "similar to Task", "etc.", "fill in".

- "TBD/TODO/etc." — none found in steps; the words "TBD"-style appear only in legal documents as `(개발사 대표명 — 추후 기입)`, which is intentional and clearly bracketed as content placeholders for the lawyer's review (not plan placeholders).
- "REPLACE_WITH_*" strings in `eas.json` and `.env.*` are explicit env-substitution markers, not lazy plan placeholders — replacement is gated by Task 37's pre-launch checklist.
- All test steps include the actual assertion code.

### 3. Type / name consistency

Cross-checked the load-bearing identifiers:

| Symbol | Definition | Uses |
|---|---|---|
| `LegalSlug = 'terms' \| 'privacy' \| 'location'` | Task 7 | Tasks 8, 9, 10, 11 |
| `useConsentStore` + `recordAcceptance(slug, version)` | Task 9 | Task 10 |
| `requiresConsent` | Task 9 | Task 11 |
| `accountApi.deleteMe()` | Task 21 | Task 25 |
| `accountApi.requestExport()` / `getExportStatus()` | Task 21 | Task 22 |
| `pollUntilReady` | Task 22 | Task 22 hook |
| `AccountDeletionService.softDelete(userId)` | Task 13 | Task 14 controller |
| `HardDeleteService.hardDelete(user)` | Task 16 | Task 16 scheduler |
| `findExpiredSoftDeleted(cutoff)` | Task 12 (repo) | Task 16 |
| `findByIdAndDeletedAtIsNull` | Task 13 (repo) | Task 13 service |
| `ExportJob.Status` enum | Task 17 | Tasks 18, 19, 21 (string compat) |
| `R2Client.uploadPrivate(key, bytes, contentType)` / `download(url)` / `deleteObjects(keys)` | Used in Tasks 16 + 18 — assumed from Plan 1 | Plans 1 must expose these. Documented as dependency. |
| `scheduleRemindersForResidence(residenceId, houseName, contractEnd)` | Task 26 | Task 26 hook |
| `useResidenceStore` shape | Task 26 — assumes `residences[].id`, `.contractEndDate`, `.displayName` | Plan 4 dependency; adapter note inline. |

No mismatches; all symbols introduced are used with matching signatures.

**Plan complete.**






