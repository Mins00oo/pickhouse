# PickHouse (살래말래) — 설계 문서

- **작성일:** 2026-05-19
- **브랜드명 (앱스토어):** 살래말래
- **코드명 (레포·패키지):** PickHouse / `pickhouse`
- **상태:** 설계 확정, 구현 계획 작성 대기

---

## 1. 개요

집을 보러 다니는 사람을 위한 **개인 기록 + 비교 + 거주 이력** 앱.

발품 팔며 본 집들을 그 자리에서 빠르게 기록하고, 본 집들끼리 한눈에 비교해서 결정을 돕고, 계약한 집은 자동으로 "내 집"이 되어 거주 이력 타임라인에 누적된다. 단순 기록은 어디서나 가능하지만, **기록한 집들을 정리·정돈된 형태로 한눈에 비교**해주는 것이 이 앱의 핵심 가치 제안.

### 1.1 한 줄 핵심
**"카톡·메모장에 흩어진 집 기록을, 비교 가능한 형태로 정리해주는 앱."**

### 1.2 사용자 페인 포인트
- 집을 5~10채 본 뒤 카톡/메모장/노션 어딘가에 흩어진 기록을 다시 정리하기 어려움
- 보증금·월세·평수·수압·햇빛·사진 등 항목이 너무 많아 비교가 안 됨
- 입주 후 집주인이 딴소리 할 때 대비할 초기 사진 기록이 부실
- 살았던 집들을 회상할 수단이 없음

### 1.3 시장 차별점
- 호갱노노/직방/다방 = 매물 시장 데이터 제공
- **PickHouse = 개인이 본 집들의 사적 기록·비교·이력 관리** — 본인 의사결정 도구
- 게임 인벤토리 아이템 비교 UI 패턴을 부동산에 처음 도입

---

## 2. 핵심 사용자 시나리오

### 2.1 페르소나
- 자취·전월세를 알아보는 20~30대 1인 가구
- 5~10채 발품 팔며 결정 중
- 폰으로 모든 걸 처리하는 모바일 네이티브

### 2.2 시나리오 A — 현장 기록 (5~10분, 중개사 동행)
- 집에 들어가자마자 앱 켜고 **빠른 체크리스트** 모드 진입
- 별점·체크 위주로 빠르게 입력 (수압·햇빛·소음 등)
- 사진 5~10장 빠르게 찍어 자유 업로드 (라벨 없음)
- 한 줄 메모만 남기고 다음 집으로 이동

### 2.3 시나리오 B — 집에 와서 보강 (저녁)
- 현장에서 못 적은 디테일을 메모에 추가
- 부족한 별점·체크 항목 보완
- 사진 정리·삭제

### 2.4 시나리오 C — 비교·결정
- 본 집 중 마음에 드는 한 채를 **기준 집**으로 지정
- 다른 후보들을 슬라이드로 넘기며 각각의 diff 확인
- 결정한 집은 "계약함" 토글 → 자동으로 현재 집(프로필)에 승격

### 2.5 시나리오 D — 입주 후
- 입주 시점 사진 (벽지·하자·옵션 가전 상태) 기록
- 계약 시작/종료일 입력
- 임대인 메모 (본인 메모용)

### 2.6 시나리오 E — 거주 이력 회상
- 프로필에서 살아온 집들을 타임라인으로 회상
- 각 집을 탭하면 그때의 사진·메모·스펙 그대로

---

## 3. 디자인 원칙

### 3.1 톤 — 따뜻한 개인 컬렉션
에어비앤비/야놀자처럼 사용자의 개인 컬렉션을 따뜻하게 관리하는 톤. SaaS 대시보드 느낌 금지.

- 크림(#faf6f0) 배경 + 사진 메인 + 둥근 카드 + 소프트 그림자
- 큰 가독성 있는 타이포 + 충분한 여백
- 정보 밀도보다 시각적 호흡 우선
- "현재 집", "거쳐온 집들" 같은 자연어 카피, 데이터베이스 라벨 금지

### 3.2 단순성 우선
- 자동 환산·점수화·승패 카운트 같은 derived/clever 계산 금지
- 사용자가 입력한 raw 데이터를 정직하게 표시, 판단은 사용자에게
- 게임 UI **패턴**은 차용하되 게임 **언어**는 차용하지 않음 (X승 Y패 같은 카운터 금지)

### 3.3 모바일·오프라인 우선
- 현장에서 신호 안 잡혀도 기록 가능해야 함
- 모든 입력은 로컬 SQLite에 즉시 저장, 신호 잡히면 백그라운드 동기화

---

## 4. 데이터 모델

### 4.1 House (본 집·후보)

**기본 정보 (객관 수치)**
| 필드 | 타입 | 필수 | 비고 |
|---|---|---|---|
| address | 주소 객체 | ★ | 카카오 주소 API로 입력 (도로명·지번·위경도) |
| dealType | enum | ★ | 전세 / 월세 / 반전세 |
| deposit | int | ★ | 보증금 (만원) |
| rent | int | | 월세 (전세면 0, 만원) |
| maintenanceFee | int | | 관리비 (만원) |
| area | float | | 전용면적 (평) |
| builtYear | int | | 건축년도 |
| floor | int | | 층 |
| totalFloor | int | | 총층 |
| availableFrom | date | | 입주 가능일 |
| stationDistance | int | | 역 거리 (도보 분) |

**구조·시설 (체크리스트)**
| 필드 | 타입 | 비고 |
|---|---|---|
| rooms | int | 방 개수 |
| bathrooms | int | 화장실 개수 |
| hasBalcony | bool | |
| hasElevator | bool | |
| hasParking | bool | |
| options | string[] | 옵션 가전 (냉장고·세탁기·에어컨·인덕션·전자레인지·TV) |
| security | string[] | CCTV·도어락 |
| garbage | string | 분리수거·쓰레기 처리 |

**주관 평가 (별점 1-5)**
- waterPressure (수압)
- sunlight (채광·햇빛)
- noise (소음)
- insulation (단열·외풍)
- ventilation (환기)
- moisture (곰팡이·누수 흔적)
- neighborhood (동네 분위기)
- firstImpression (전반적 첫인상)

**자유 영역**
- photos: Photo[] — 여러 장, 라벨 없음 (v2에서 라벨링 추가)
- memo: string — 자유 텍스트 (장단점·코멘트·협상여지 등 모두 여기로)

### 4.2 Residence (거주 이력 · "내 집")
House가 계약·입주 처리되면 Residence로 승격. 추가 필드:

- contractStartDate (계약 시작일, 필수)
- contractEndDate (계약 종료일, 필수)
- landlordMemo (임대인 메모, 자유 텍스트, 본인 메모용)
- moveInPhotos: Photo[] (입주 시점 사진 — 벽지·하자 등)
- contractPhoto (계약서 사진, 선택 — 본인 정보 마스킹 안내)
- meterReadings (공과금 계량기 초기값, 선택)
- isCurrent (bool — 현재 거주 중 여부)

또한 사용자가 **앱 사용 이전에 살았던 집**을 직접 추가할 수도 있음 (House 단계 거치지 않고 Residence로 바로 입력).

### 4.3 Photo
- localUri (로컬 파일 경로 — expo-file-system)
- remoteUrl (R2 업로드 후 URL)
- houseId / residenceId (FK)
- uploadStatus: pending / uploading / uploaded / failed
- takenAt

### 4.4 User
- id (서버 발급)
- email (provider 측에서 제공 시)
- authProviders: { apple?: providerId, kakao?: providerId } — 두 provider 모두 한 계정에 연결 가능
- nickname
- avatarUrl
- createdAt
- deletedAt (soft delete, 탈퇴 grace period 동안 보존)

---

## 5. 주요 화면

### 5.1 내 집 (프로필 / 홈)
- 상단: "MY HOMES" 미니 라벨 + 설정 아이콘
- **현재 집 Hero 카드** — 큰 사진 + 위치 핀 + 하트 즐겨찾기 + "지금 사는 곳" 라벨 + 이름·기간·간단 스펙
- **거쳐온 집들 타임라인**
  - 세로 점선 라인 + 연도 마커 (2024, 2022, 2020)
  - 인생 챕터 라벨 ("직전에 살던 집", "사회초년생 시절", "대학생 시절" 등)
  - 각 카드: 사진 가로 스트립(슬라이드) + 이름·기간·스펙 알약
  - 카드와 라인 사이 충분한 여백 (호흡)
  - 맨 아래: "기록 시작점" 점선 원 + "더 이전 집 추가" 버튼

### 5.2 본 집 리스트
- 본 집 후보들의 카드 그리드 (계약 안 한 House들)
- 정렬/필터: 최신순·가격·평수·별점·지역
- 각 카드: 대표 사진 + 주소·가격·핵심 별점
- 우측 상단: + 새 집 추가

### 5.3 집 입력 (현장 모드 + 디테일 모드)
- 두 모드를 탭으로 전환
- **현장 모드:** 별점 격자, 체크박스, 카메라 큰 버튼, 한 줄 메모 — 가장 짧은 탭 수로 저장 가능하도록 설계
- **디테일 모드:** 모든 필드 펼친 폼

### 5.4 비교 화면 (핵심)
- 상단: 기준 집(녹색 배지) vs 후보 집(베이지 배지)
- 사진 영역: 좌우 독립 캐러셀 (각 집의 사진 슬라이드 + 인디케이터 점)
- 항목별 행: `기준 값 | 항목명 | 후보 값`
- 유리한 쪽만 녹색 강조 / 같으면 회색
- ▲▼ 화살표·승패 카운트 없음 (단순함 원칙)
- **거래 유형이 달라도 보증금/월세는 그대로 표시** (환산 없음)
- 하단: "후보 N / M" 슬라이더로 다른 후보로 넘기기 (기준 집은 고정)

### 5.5 집 상세
- 타임라인 카드 탭 진입점
- 전체 스펙 + 모든 사진 + 메모 + 별점

### 5.6 설정
- 계정 (로그인·로그아웃·탈퇴)
- 동기화 옵션
- 알림
- 이용약관 / 개인정보 처리방침
- 데이터 내보내기 (JSON / 사진 zip)

---

## 6. 인증 정책

### 6.1 지원하는 로그인
- **iOS:** Apple Sign In (App Store Guideline 4.8 필수) + 카카오
- **Android:** 카카오 only
- 이메일/비밀번호: **MVP 미포함**

### 6.2 동작 흐름
1. 클라이언트가 provider(Apple/카카오) 로그인 → ID token 획득
2. 클라이언트가 백엔드 `/auth/login`에 ID token POST
3. 백엔드가 provider 측 검증 endpoint로 token 유효성 확인
4. 신규 사용자면 User 생성, 기존이면 매칭
5. 백엔드가 자체 JWT(access + refresh) 발급
6. 이후 모든 API는 자체 JWT로 인증

### 6.3 Spring 구현
- Spring Security + OAuth2 Resource Server
- JWT는 RS256 (private key는 서버 내)
- Access token 30분 / Refresh token 30일
- Refresh는 rotation 적용

---

## 7. 개인정보·법적 정책

### 7.1 원칙
- 모든 사용자 데이터는 **본인 본인용**, 제3자 공유 기능 MVP 미포함
- 클라우드 동기화는 사용자 명시 동의 후에만 (회원가입 시 약관 동의)
- 임대인 정보는 사용자 본인 메모용 — 백엔드에 저장되지만 본인만 조회 가능
- 계약서 사진은 본인 정보 마스킹 안내 표시
- 입주 사진은 본인 거주 공간만 — 타인 얼굴 촬영 자제 안내

### 7.2 필수 문서
- 이용약관
- 개인정보 처리방침 (수집 항목·보유 기간·파기 절차)
- 위치정보 이용약관 (위치 데이터 저장하므로)

### 7.3 데이터 권리
- 회원탈퇴 시 모든 데이터 삭제 (사진 R2 포함)
- 데이터 내보내기 기능 (JSON + 사진 zip)

---

## 8. 기술 아키텍처

### 8.1 전체 구조
```
[Expo 앱]               [Spring Boot API]            [데이터 저장소]
RN + TS         ←→   /auth · /houses · /photos  ←→  MySQL (구조화 데이터)
                        + JWT 인증                    Cloudflare R2 (사진)
SQLite 로컬 캐시        + Spring Security
expo-file-system        + JPA
(임시 사진)
```

### 8.2 오프라인 우선 동기화
- 모든 쓰기는 SQLite 로컬에 즉시 저장 + sync queue에 추가
- 네트워크 가용 시 백그라운드에서 queue 처리
- 사진은 로컬 캐시 → R2 업로드 → 서버에 URL 통보
- 충돌 해결: 단순화 위해 **last-write-wins** (사용자 1인이 1 디바이스 가정, MVP)

### 8.3 API 설계 (REST)
- `POST /auth/login` — provider ID token → 자체 JWT
- `POST /auth/refresh` — refresh → access
- `GET /houses` — 사용자 본 집 목록
- `POST /houses` — 새 집 등록
- `PATCH /houses/{id}` — 집 정보 수정
- `POST /houses/{id}/promote-to-residence` — 거주 집으로 승격
- `GET /residences` — 거주 이력
- `POST /photos/upload-url` — R2 presigned upload URL 발급
- `DELETE /me` — 회원 탈퇴

### 8.4 사진 업로드 흐름
1. 클라이언트가 사진 찍어 로컬 저장
2. `/photos/upload-url` 호출 → R2 presigned URL 받음
3. 클라이언트가 R2에 직접 PUT (백엔드 거치지 않음)
4. 업로드 완료 → 백엔드에 URL 통보 + Photo 레코드 생성

---

## 9. 기술 스택

### 9.1 Frontend (Mobile App)
- **Framework:** React Native + Expo (SDK 최신)
- **Language:** TypeScript
- **상태 관리:** Zustand
- **로컬 DB:** expo-sqlite
- **파일 저장:** expo-file-system
- **위치:** 카카오 우편번호 + 카카오맵 SDK
- **인증:** expo-apple-authentication (iOS) + @react-native-seoul/kakao-login
- **사진:** expo-image-picker + expo-camera
- **HTTP:** axios + React Query

### 9.2 Backend
- **Language:** Java 21
- **Framework:** Spring Boot 3.x
- **ORM:** Spring Data JPA
- **보안:** Spring Security + JWT (RS256)
- **빌드:** Gradle
- **DB 마이그레이션:** Flyway
- **테스트:** JUnit 5 + Mockito + Testcontainers (MySQL)

### 9.3 인프라
- **서버 호스팅:** Oracle Cloud Free Tier (영구 무료, ARM 4코어 24GB RAM)
- **DB:** MySQL 8 (초기엔 같은 인스턴스, 트래픽 늘면 분리)
- **사진 스토리지:** Cloudflare R2 (S3 호환, egress 무료)
- **도메인·SSL:** Cloudflare DNS + Let's Encrypt
- **CI/CD:** GitHub Actions (또는 Oracle 직접 SSH)

> **구현 노트 (2026-05-20):** MVP 단계에서는 사진 스토리지를 **백엔드 서버 로컬 디스크** (`/var/lib/pickhouse/photos`)로 변경. 클라이언트가 multipart로 `POST /photos/upload`에 직접 업로드. R2/S3 마이그레이션은 v2로 미룸. 자세한 흐름은 `canonical-decisions.md §7` 참고. 이에 따라 본 문서의 §8.3/§8.4의 `/photos/upload-url` 프리사인 흐름은 적용되지 않음.

### 9.4 개발 환경
- **OS:** Windows 11 (사용자) + Oracle Cloud Ubuntu (서버)
- **Java:** Eclipse Temurin 21 LTS
- **Node:** 20 LTS
- **에디터:** 사용자 선택

---

## 10. 범위 (MVP)

### 10.1 MVP에 포함
- 집 입력 (현장 빠른 모드 + 디테일 모드)
- 사진 다중 업로드 (라벨 없음)
- 본 집 리스트 (그리드 + 필터)
- 비교 화면 (2채 VS · 기준 고정 · 후보 슬라이드)
- "내 집" 프로필 (현재 집 Hero + 거쳐온 집 타임라인)
- House → Residence 승격
- 입주 사진·계약 정보 기록
- 카카오·Apple 로그인
- 로컬 SQLite + 백엔드 동기화
- 이용약관·개인정보 처리방침

### 10.2 v2 (MVP 이후)
- 사진 라벨링 (거실/욕실/방 등) + 같은 라벨끼리 싱크 모드
- 가중치 기반 자동 점수/순위 (사용자가 요청 시)
- 3+채 동시 비교 (태블릿/웹)
- 클라우드 동기화 off/on 토글 (현재는 사용 시 자동 동기화)
- 공유 기능 (가족·연인과 공유 비교)
- 임차인 커뮤니티 / 후기 기능
- 매물 시장 데이터 연동 (직방·다방 API)

### 10.3 명시적 비범위
- 매물 시장 데이터 제공 (기존 앱 영역, 우리 영역 아님)
- 중개사·임대인 직접 연결 기능
- AI 자동 분류 (사진 분류 등)
- 푸시 알림 마케팅

---

## 11. 리스크·열린 질문

### 11.1 리스크
- **Apple 정책 — Android에 Apple 미제공**: 정책상 권고는 양 플랫폼 제공이지만, 한국 시장 다수 앱이 카카오 only on Android로 운영 중. 리젝 위험은 낮으나 모니터링 필요.
- **Oracle Cloud Free Tier 가용성**: 한국에서 종종 가입 거부 사례. 차선책 Hetzner/Lightsail 준비.
- **카카오 우편번호 API rate limit**: 무료지만 일일 한도 있음. 초기엔 충분, 트래픽 증가 시 카카오 비즈 계정 필요.

### 11.2 열린 질문 (구현 단계에서 결정)
- 회원 탈퇴 후 데이터 보존 기간 (즉시 vs N일 grace period)
- 사진 압축 정책 (R2 비용 관리)
- 백업 전략 (MySQL 덤프 주기·보관 위치)
- 분석 도구 도입 여부 (Mixpanel·Amplitude vs 자체)

---

## 12. 다음 단계
이 문서를 사용자가 검토 → 승인 시 `writing-plans` 스킬로 구현 계획 작성 → 단계별 개발 진행.
