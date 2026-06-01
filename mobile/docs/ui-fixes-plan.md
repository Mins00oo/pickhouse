# PickHouse Mobile — UI/Runtime Fixes Plan

Branch: `fix/main-page-ui`. App lives under `mobile/`. Stack: Expo SDK 52, RN 0.76.9, New Architecture ON, Hermes, TypeScript.

The main-page redesign + add-house wizard are in the **working tree** of this branch. This plan fixes 7 issues found on-device on 2026-06-01.

**Deploy reality:** 9 of 10 fixes are JS-only (ship via Metro reload / `eas update` OTA — no native rebuild). Only the Naver custom map style (Phase 2) needs a native rebuild.

Execution order: Phase 0 → Phase 1 → Phase 2 (scaffold only). Run from repo root; the app is in `mobile/`.

---

## Phase 0 — Add House blockers

### 0.1 Address modal "닫기" overlaps the iOS status bar / Dynamic Island
- File: `mobile/src/integrations/kakaoAddress.tsx`
- Cause: `<SafeAreaView>` inside a React Native `<Modal>` resolves insets to 0 because the Modal detaches from the app-level `SafeAreaProvider` (App.tsx).
- Fix: import `SafeAreaProvider` from `react-native-safe-area-context`; wrap the modal content:
  `<Modal ... statusBarTranslucent><SafeAreaProvider><SafeAreaView edges={['top','bottom']}>…</SafeAreaView></SafeAreaProvider></Modal>`.
  Add `hitSlop={12}` to the 닫기 `Pressable`.
- Keep `mobile/src/integrations/__tests__/kakaoAddress.test.tsx` passing.

### 0.2 Address selection does not register on device (+ no 상세주소 field appears)
- Files: `mobile/src/integrations/kakaoAddress.tsx`, `mobile/src/screens/houses/components/wizard/AddressField.tsx`, `mobile/src/screens/houses/HouseInputScreen.tsx`
- Finding: the selection logic + 상세주소 input are ALREADY correctly implemented in the working tree (typed `address:selected` envelope; AddressField shows the detail input only AFTER an address is selected; `handleAddressPicked` wired via `onSelect`). "상세주소 칸 없음" is a CONSEQUENCE of selection not registering (field is gated on a selected address). Primary hypothesis: device ran a stale bundle.
- Action:
  - Verify the chain in code: oncomplete → `window.ReactNativeWebView.postMessage` → `onMessage` handleMessage → `onSelect=handleAddressPicked` → `set('address', base)`.
  - Add a DEFENSIVE fallback in `handleMessage`: also accept a flat `{ roadAddress, jibunAddress, zonecode }` payload (no `type` field) so any older/edge message shape still selects. Do NOT remove the typed envelope.
  - NOTE in the PR/Discord summary: final confirmation requires on-device re-test on a FRESH bundle — the remote agent cannot verify the WebView runtime.

---

## Phase 1 — JS-only batch (OTA-able, no rebuild)

### 1.1 Visit-date calendar Korean localization
- File: `mobile/src/screens/houses/components/wizard/DateField.tsx` (import at line 3). Mock: `mobile/jest.setup.ts`.
- Fix: `import { Calendar, LocaleConfig } from 'react-native-calendars';` and at module top-level (idempotent):
  ```
  if (!LocaleConfig.locales['ko']) {
    LocaleConfig.locales['ko'] = {
      monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
      monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
      dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
      dayNamesShort: ['일','월','화','수','목','금','토'],
      today: '오늘',
    };
  }
  LocaleConfig.defaultLocale = 'ko';
  ```
  Leave `firstDay` default (Sunday).
- Test: extend the react-native-calendars mock in `jest.setup.ts` to also export `LocaleConfig: { locales: {}, defaultLocale: 'en' }`.

### 1.2 Bottom sheet — remove handle, fix height, disable drag, modernize card
- File: `mobile/src/screens/home/HomeMapScreen.tsx`
- Replace `SHEET_SNAP_POINTS = ['16%','46%','92%']` (~line 125) with a single fixed height: `const SHEET_FIXED_HEIGHT = 290; const SHEET_SNAP_POINTS = [SHEET_FIXED_HEIGHT];` (tune height to fit one card row + header with no empty gap).
- On `<BottomSheet>` (HomeCarousel, ~line 627): add `enablePanDownToClose={false}`, `enableHandlePanningGesture={false}`, `enableContentPanningGesture={false}`, `enableOverDrag={false}`, and `handleComponent={null}` (remove grab bar). Keep `index={0}`, `enableDynamicSizing={false}`.
- Remove `sheetRef.current?.snapToIndex(1)` in `handleSelectHouseFromMarker` (~line 297) — out of range with one snap point; carousel already scrolls to the selected card.
- Re-tie floating-button math: set `const peekSheetHeight = SHEET_FIXED_HEIGHT;` and drop `SHEET_PEEK_RATIO` usage (~lines 310-313) so `mapFloatingBottom` / `listToggleBottom` / `logoBottomMargin` stay above the fixed sheet.
- Modernize the card UI (`HomeHouseCard` styles): with the handle gone, give the sheet a clean rounded top; tighten card radius/spacing/shadow for a modern look. Keep all `testID`s intact.
- Tests: `mobile/src/screens/home/__tests__/HomeMapScreen.test.tsx` — structural testIDs unchanged; the gorhom mock (`mobile/src/__mocks__/gorhom-bottom-sheet.tsx`) ignores these props. Adjust any snapPoint assertions if present.

### 1.3 Selected marker price balloon — remove empty space at the top
- File: `mobile/src/screens/home/HomeMapScreen.tsx` (`getSelectedMarkerCaption`, ~line 1351).
- Cause: caption is centered on the marker ICON center (50% of the 50px marker) but the green body occupies only the top ~74% (bottom ~26% is the tail), so text sits low and the body top looks empty. NOT a PNG-padding issue.
- Fix: change caption `offset` from `-8` to about `-14` (tune) so the caption+subCaption block lifts into the body's visual center. Keep 116×50 and text sizes.
- Test: update the caption `offset` expectation in `HomeMapScreen.test.tsx` (~line 293).
- (Zoom-out clustering already works — count-only bubble; no change needed.)

### 1.4 Search keyboard dismiss on map tap
- File: `mobile/src/screens/home/HomeMapScreen.tsx`
- Fix: `import { Keyboard } from 'react-native';` add `onTapMap={() => Keyboard.dismiss()}` to `<NaverMapView>` (~line 317). Add `keyboardShouldPersistTaps="handled"` to the carousel ScrollView (~line 678) and the full-list ScrollView (~line 800).
- Test: drivable via `fireEvent(getByTestId('house-map-view'), 'onTapMap', {...})`.

### 1.5 Reanimated "Property 'window' doesn't exist" — patch @gorhom/bottom-sheet
- Cause: `@gorhom/bottom-sheet@5.2.14` `useAnimatedLayout` references an identifier named `window` inside a worklet; reanimated 3.15+ resolves it as a (missing) global on the UI runtime → non-fatal error. gorhom 5.2.14 is the latest, so upgrading cannot fix it.
- Fix via patch-package:
  - `cd mobile && npm i -D patch-package postinstall-postinstall`
  - In the Dimensions `'change'` listener, rename the destructured `window` → `win` (and `_state.window = win`) in ALL three build outputs:
    - `mobile/node_modules/@gorhom/bottom-sheet/src/hooks/useAnimatedLayout.ts` (~108-116)
    - `mobile/node_modules/@gorhom/bottom-sheet/lib/commonjs/hooks/useAnimatedLayout.js` (~88-99)
    - `mobile/node_modules/@gorhom/bottom-sheet/lib/module/hooks/useAnimatedLayout.js` (~91)
  - `npx patch-package @gorhom/bottom-sheet`, commit `mobile/patches/@gorhom+bottom-sheet+5.2.14.patch`, add `"postinstall": "patch-package"` to `mobile/package.json` scripts.

---

## Phase 2 — Naver custom map style (NEEDS native rebuild — SCAFFOLD ONLY)

- File: `mobile/src/screens/home/HomeMapScreen.tsx`, `mobile/app.config.ts`
- The map looks plain because it pins `mapType="Basic"`. Per research, a fully custom style (Naver Map Style Editor → `customStyleId`) costs NO extra (billing is per map-view-create), but `customStyleId` is wired to native code → first activation needs ONE EAS rebuild.
- Scaffold (do NOT rebuild):
  - Add an optional `customStyleId={NAVER_MAP_STYLE_ID}` + `onCustomStyleLoadFailed={(e)=>{/* log + graceful fallback */}}` to `<NaverMapView>`, applied only when the env value is set.
  - Source from `process.env.EXPO_PUBLIC_NAVER_MAP_STYLE_ID` (add to `app.config.ts` extra/env).
  - Document in the PR: the user creates the style at https://style-editor.map.naver.com under their NCP Maps account, provides the style ID, then a new EAS build is required (which also bundles all Phase 0/1 fixes).

---

## Testing & delivery
- `cd mobile && npm test` (jest), `npm run typecheck`, `npm run lint` — all green.
- Commit to a new branch off `fix/main-page-ui` (e.g. `fix/ui-issues-batch`) and open a PR summarizing each fix, which items need on-device verification (0.2 selection, marker offset, sheet height), and the Phase 2 manual step.
