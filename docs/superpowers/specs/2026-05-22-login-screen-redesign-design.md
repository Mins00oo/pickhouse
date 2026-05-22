# 로그인 화면 리디자인 — 설계 문서

날짜: 2026-05-22
대상: `mobile/src/screens/auth/AuthScreen.tsx` 및 인증 버튼 컴포넌트

## 배경

기존 로그인 화면(`AuthScreen`)은 상단에 제목, 하단에 로그인 버튼만 있어
가운데가 비어 있었다. 또한 Apple 로그인 버튼은 iOS 네이티브 버튼
(`AppleAuthentication.AppleAuthenticationButton`)을 사용해 글자 크기를
제어할 수 없어, 직접 그린 카카오 버튼("카카오로 시작하기")과 글자 크기가
달라 보였다.

앱 컨셉: **살래말래 (PICKHOUSE)** — 발품 팔아 본 집들을 사진·별점으로
기록하고 한눈에 비교하는 "나만의 기록장".

## 목표

1. 빈 가운데 공간을 앱 컨셉이 드러나는 시각 요소로 채운다.
2. Apple 버튼과 카카오 버튼의 글자 크기를 동일하게 맞춘다.
3. 화면 상단의 "PICKHOUSE" 미니 라벨을 제거한다.

## 최종 디자인 (배치 1, 카드 내용 안 X)

화면은 위에서 아래로 세 영역으로 구성한다 (`SafeAreaView` + `cream` 배경 유지).

### 1) 헤더 영역

- "PICKHOUSE" 미니 라벨 — **제거**
- 제목 "살래말래" — `typography.display`, `colors.ink`
- 서브카피 "마음에 든 집, 사진과 별점으로 남겨두세요" — `typography.body`, `colors.inkSoft`

### 2) 히어로 영역 (가운데, 새로 추가)

- **폴라로이드 카드 2장**을 살짝 겹치고 회전시켜 배치 (장식용 정적 요소).
  - 카드 1: 사진 자리(파란 톤) + "망원동 투룸" + ★★★★☆ + "보증금 1000 / 월 65", `-8deg` 회전
  - 카드 2: 사진 자리(베이지 톤) + "성수동 오피스텔" + ★★★☆☆ + "보증금 2000 / 월 80", `+7deg` 회전
  - 카드 스타일: `colors.white` 배경, `colors.border` 테두리, `radii.md`, `shadows.soft`
  - 별점은 정적 유니코드(`★`/`☆`) 텍스트로 표시 (`colors.star`)
- 카드 아래에 **기능 3종**을 가로 3열로 배치 (이모지 아이콘 + 한 줄 라벨):
  - 📸 사진 기록 / ⭐ 별점 평가 / 🏠 한눈 비교

히어로 영역은 별도 컴포넌트 `AuthHero`로 분리해 `AuthScreen`을 단순하게 유지한다.
카드 데이터는 정적 장식이므로 props 없이 컴포넌트 내부 상수로 둔다.

### 3) 하단 버튼 영역 (기존 구조 유지)

- Apple 버튼 (iOS, 사용 가능 시) + 카카오 버튼
- 약관 안내 텍스트

## Apple 버튼 변경

`AppleSignInButton`을 네이티브 버튼에서 **직접 그린 커스텀 Pressable**로 교체한다.
이로써 카카오 버튼과 동일한 글자 크기/모양을 보장한다.

- iOS에서만 렌더 (`Platform.OS !== 'ios'`이면 `null`) — 기존 동작 유지
- 스타일: `KakaoSignInButton`과 동일한 구조 — 높이 52, `radii.pill`, 전체 너비
- 배경 `colors.ink`, 글자 `colors.white`
- 내용: Apple 로고 글리프(``, U+F8FF — iOS 시스템 폰트에서 렌더됨) + "Apple로 로그인"
- 글자 스타일 `typography.bodyBold` — 카카오 버튼과 **동일**
- `testID="apple-sign-in"`
- `onPress`는 기존과 동일하게 부모에서 받음. 실제 인증은 `authService.loginWithApple` →
  `appleAuth.signIn()`이 담당하므로 버튼은 시각 요소만 교체된다.

Apple "Sign in with Apple" 가이드라인은 로고+텍스트를 갖춘 커스텀 검정 버튼을 허용한다.

## 영향 범위 / 테스트

- `AuthScreen.test.tsx`: `appleAuth.isAvailable`을 `false`로 목킹하므로 Apple 버튼은
  테스트에서 렌더되지 않는다. 카카오 버튼 testID(`kakao-sign-in`)는 그대로 유지 →
  기존 테스트 통과해야 한다.
- 신규 컴포넌트(`AuthHero`, 커스텀 `AppleSignInButton`)는 가벼운 렌더 스모크 테스트 추가.
- 타입체크(`tsc`)와 기존 테스트 스위트 통과 확인.

## 범위 밖 (YAGNI)

- 실제 집 데이터 연동, 온보딩 캐러셀, 애니메이션은 포함하지 않는다.
- 카드 사진 자리는 색 그라데이션 플레이스홀더로 둔다(이미지 에셋 추가 안 함).
