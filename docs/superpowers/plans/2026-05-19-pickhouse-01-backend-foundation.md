# PickHouse Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spring Boot backend API serving auth, house CRUD, residence management, and R2 photo URLs — deployed to Oracle Cloud.

**Architecture:** Spring Boot 3 + JPA + MySQL 8 + JWT auth + Cloudflare R2 for photos. REST API. Stateless. Dockerized for deployment.

**Tech Stack:** Java 21, Spring Boot 3.x, Spring Data JPA, Spring Security, MySQL 8, Flyway, Gradle, JUnit 5 + Testcontainers, AWS SDK v2 (for R2 S3 API), Apple JWKS, Kakao OAuth API.

---

## API Contract Reference (downstream plans depend on this)

This section is the canonical reference for the API contract. Mobile clients (Plan 2+) must match this exactly.

### Base URL

- Local dev: `http://localhost:8080`
- Production: `https://api.pickhouse.app`

### Authentication Header

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

### JWT Payload Structure

**Access Token (RS256, 30 min TTL):**
```json
{
  "iss": "https://api.pickhouse.app",
  "sub": "<user-uuid>",
  "iat": 1716086400,
  "exp": 1716088200,
  "type": "access",
  "email": "user@example.com"
}
```

**Refresh Token (RS256, 30 day TTL):**
```json
{
  "iss": "https://api.pickhouse.app",
  "sub": "<user-uuid>",
  "iat": 1716086400,
  "exp": 1718678400,
  "type": "refresh",
  "jti": "<token-uuid-for-rotation-tracking>"
}
```

### Error Response Format

All errors return:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

HTTP statuses:
- 400 — `BAD_REQUEST` (validation)
- 401 — `UNAUTHORIZED` (missing/invalid JWT)
- 403 — `FORBIDDEN` (JWT valid but action not allowed)
- 404 — `NOT_FOUND`
- 409 — `CONFLICT`
- 422 — `UNPROCESSABLE_ENTITY` (business rule violation)
- 500 — `INTERNAL_ERROR`

### Endpoint List

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /auth/login | No | provider ID token → our JWT |
| POST | /auth/refresh | No (refresh JWT in body) | refresh access token |
| DELETE | /me | Yes | soft delete account |
| GET | /houses | Yes | list user's houses |
| POST | /houses | Yes | create house |
| GET | /houses/{id} | Yes | get one house |
| PATCH | /houses/{id} | Yes | partial update |
| DELETE | /houses/{id} | Yes | delete house |
| POST | /houses/{id}/promote-to-residence | Yes | House → Residence |
| GET | /residences | Yes | list user's residences |
| POST | /residences | Yes | create residence directly (pre-app history) |
| PATCH | /residences/{id} | Yes | partial update residence |
| POST | /photos/upload-url | Yes | get R2 presigned PUT URL |
| POST | /photos | Yes | register Photo record after upload |

### Request/Response Shapes

**POST /auth/login**
```json
// Request
{
  "provider": "apple" | "kakao",
  "idToken": "<provider ID token>"
}
// Response 200
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "닉네임",
    "createdAt": "2026-05-19T10:00:00Z"
  }
}
```
On first signup, server defaults `nickname` to `"닉네임"`. A future endpoint will let users edit it.

**POST /auth/refresh**
```json
// Request
{ "refreshToken": "..." }
// Response 200
{ "accessToken": "...", "refreshToken": "..." }
```

**House DTO (request and response share base fields):**
```json
{
  "id": "uuid",
  "address": {
    "roadAddress": "서울특별시 강남구 테헤란로 123",
    "jibunAddress": "서울특별시 강남구 역삼동 678-9",
    "zonecode": "06234",
    "latitude": 37.5,
    "longitude": 127.0,
    "detail": "302호"
  },
  "dealType": "JEONSE" | "WOLSE" | "BAN_JEONSE",
  "deposit": 50000,
  "rent": 0,
  "maintenanceFee": 10,
  "area": 8.5,
  "builtYear": 2015,
  "floor": 3,
  "totalFloor": 5,
  "availableFrom": "2026-06-01",
  "stationDistance": 7,
  "rooms": 1,
  "bathrooms": 1,
  "hasBalcony": true,
  "hasElevator": true,
  "hasParking": false,
  "options": ["fridge", "washer", "aircon"],
  "security": ["cctv", "doorlock"],
  "garbage": "분리수거 가능",
  "waterPressure": 4,
  "sunlight": 5,
  "noise": 3,
  "insulation": 4,
  "ventilation": 4,
  "moisture": 5,
  "neighborhood": 4,
  "firstImpression": 5,
  "memo": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Residence extends House with:**
```json
{
  "name": "망원동 자취방",
  "eraLabel": "사회초년생 시절",
  "isFavorite": false,
  "contractStartDate": "2024-03-01",
  "contractEndDate": "2026-02-28",
  "landlordMemo": "...",
  "isCurrent": true,
  "moveInPhotoIds": ["uuid-1", "uuid-2"],
  "contractPhotoId": "uuid-3",
  "meterReadings": {
    "electricity": 1234,
    "water": 56,
    "gas": 78,
    "recordedAt": "2024-03-01"
  }
}
```
- `name` (required) — user-friendly nickname like `"망원동 자취방"`.
- `eraLabel` (optional) — free-form era label like `"사회초년생 시절"`.
- `isFavorite` defaults to `false`.
- `moveInPhotoIds` is a separate ordered list of move-in photo UUIDs distinct from the residence's general photos.
- `contractPhotoId` is at most one contract photo UUID.
- `meterReadings` is a nullable nested object; its inner fields (`electricity`, `water`, `gas`, `recordedAt`) are individually optional.

**POST /photos/upload-url**
```json
// Request
{ "contentType": "image/jpeg", "extension": "jpg" }
// Response 200
{
  "photoId": "uuid",
  "uploadUrl": "https://<bucket>.r2.cloudflarestorage.com/...",
  "objectKey": "users/<uuid>/photos/<uuid>.jpg",
  "publicUrl": "https://photos.pickhouse.app/users/<uuid>/photos/<uuid>.jpg",
  "expiresInSeconds": 600
}
```
The server mints `photoId` at presign time and returns it. The client uses it when calling `POST /photos` so the uploaded blob is correlated to the photo record.

**POST /photos**
```json
// Request
{
  "photoId": "uuid",      // value returned from /photos/upload-url
  "objectKey": "users/.../photo.jpg",
  "remoteUrl": "https://photos.pickhouse.app/...",
  "houseId": "uuid",      // exactly one of houseId/residenceId
  "residenceId": null,
  "takenAt": "2026-05-19T10:30:00Z"
}
// Response 201
{
  "id": "uuid",
  "houseId": "...",
  "residenceId": null,
  "remoteUrl": "...",
  "takenAt": "...",
  "createdAt": "..."
}
```
`photoId` is required; `objectKey` is still accepted (both come from the presign response). The returned `id` equals the supplied `photoId`.

---

## File Structure

All paths relative to `D:/work/project/workspace/Prj/pickhouse/backend/`.

### Build / Config
- `build.gradle.kts` — Gradle Kotlin DSL, dependencies
- `settings.gradle.kts` — project name
- `gradle/wrapper/gradle-wrapper.properties` — wrapper version
- `gradlew`, `gradlew.bat` — wrapper scripts
- `.gitignore` — ignore build artifacts
- `src/main/resources/application.yml` — base config
- `src/main/resources/application-local.yml` — local dev
- `src/main/resources/application-prod.yml` — production
- `src/main/resources/application-test.yml` — test profile

### Flyway Migrations
- `src/main/resources/db/migration/V1__create_users.sql`
- `src/main/resources/db/migration/V2__create_houses.sql`
- `src/main/resources/db/migration/V3__create_residences.sql`
- `src/main/resources/db/migration/V4__create_photos.sql`
- `src/main/resources/db/migration/V5__create_refresh_tokens.sql`
- `src/main/resources/db/migration/V6__create_oauth_identities.sql`

### Application Entry
- `src/main/java/app/pickhouse/PickHouseApplication.java`

### Domain Entities (JPA)
- `src/main/java/app/pickhouse/domain/user/User.java`
- `src/main/java/app/pickhouse/domain/user/OAuthIdentity.java`
- `src/main/java/app/pickhouse/domain/user/OAuthProvider.java` (enum)
- `src/main/java/app/pickhouse/domain/house/House.java`
- `src/main/java/app/pickhouse/domain/house/DealType.java` (enum)
- `src/main/java/app/pickhouse/domain/common/Address.java` (@Embeddable)
- `src/main/java/app/pickhouse/domain/residence/Residence.java`
- `src/main/java/app/pickhouse/domain/photo/Photo.java`
- `src/main/java/app/pickhouse/domain/auth/RefreshToken.java`

### Repositories
- `src/main/java/app/pickhouse/domain/user/UserRepository.java`
- `src/main/java/app/pickhouse/domain/user/OAuthIdentityRepository.java`
- `src/main/java/app/pickhouse/domain/house/HouseRepository.java`
- `src/main/java/app/pickhouse/domain/residence/ResidenceRepository.java`
- `src/main/java/app/pickhouse/domain/photo/PhotoRepository.java`
- `src/main/java/app/pickhouse/domain/auth/RefreshTokenRepository.java`

### Security / JWT
- `src/main/java/app/pickhouse/security/JwtProperties.java`
- `src/main/java/app/pickhouse/security/JwtKeyProvider.java`
- `src/main/java/app/pickhouse/security/JwtIssuer.java`
- `src/main/java/app/pickhouse/security/JwtVerifier.java`
- `src/main/java/app/pickhouse/security/JwtAuthFilter.java`
- `src/main/java/app/pickhouse/security/SecurityConfig.java`
- `src/main/java/app/pickhouse/security/CurrentUserArgumentResolver.java`
- `src/main/java/app/pickhouse/security/CurrentUserId.java` (annotation)
- `src/main/java/app/pickhouse/security/WebConfig.java`

### OAuth Verification
- `src/main/java/app/pickhouse/auth/oauth/OAuthVerifier.java` (interface)
- `src/main/java/app/pickhouse/auth/oauth/AppleIdTokenVerifier.java`
- `src/main/java/app/pickhouse/auth/oauth/AppleJwksClient.java`
- `src/main/java/app/pickhouse/auth/oauth/KakaoIdTokenVerifier.java`
- `src/main/java/app/pickhouse/auth/oauth/KakaoApiClient.java`
- `src/main/java/app/pickhouse/auth/oauth/OAuthVerifiedUser.java` (record)
- `src/main/java/app/pickhouse/auth/oauth/OAuthVerifierResolver.java`

### Auth Service / Controller
- `src/main/java/app/pickhouse/auth/AuthService.java`
- `src/main/java/app/pickhouse/auth/AuthController.java`
- `src/main/java/app/pickhouse/auth/dto/LoginRequest.java`
- `src/main/java/app/pickhouse/auth/dto/LoginResponse.java`
- `src/main/java/app/pickhouse/auth/dto/RefreshRequest.java`
- `src/main/java/app/pickhouse/auth/dto/TokenPair.java`
- `src/main/java/app/pickhouse/auth/dto/UserDto.java`

### User Controller
- `src/main/java/app/pickhouse/user/UserController.java`
- `src/main/java/app/pickhouse/user/UserService.java`

### House Service / Controller / DTOs
- `src/main/java/app/pickhouse/house/HouseService.java`
- `src/main/java/app/pickhouse/house/HouseController.java`
- `src/main/java/app/pickhouse/house/dto/HouseDto.java`
- `src/main/java/app/pickhouse/house/dto/CreateHouseRequest.java`
- `src/main/java/app/pickhouse/house/dto/UpdateHouseRequest.java`
- `src/main/java/app/pickhouse/house/dto/PromoteToResidenceRequest.java`

### Residence Service / Controller / DTOs
- `src/main/java/app/pickhouse/residence/ResidenceService.java`
- `src/main/java/app/pickhouse/residence/ResidenceController.java`
- `src/main/java/app/pickhouse/residence/dto/ResidenceDto.java`
- `src/main/java/app/pickhouse/residence/dto/CreateResidenceRequest.java`
- `src/main/java/app/pickhouse/residence/dto/UpdateResidenceRequest.java`

### Photo Service / Controller / DTOs
- `src/main/java/app/pickhouse/photo/PhotoService.java`
- `src/main/java/app/pickhouse/photo/PhotoController.java`
- `src/main/java/app/pickhouse/photo/R2Client.java`
- `src/main/java/app/pickhouse/photo/R2Properties.java`
- `src/main/java/app/pickhouse/photo/dto/PresignRequest.java`
- `src/main/java/app/pickhouse/photo/dto/PresignResponse.java`
- `src/main/java/app/pickhouse/photo/dto/RegisterPhotoRequest.java`
- `src/main/java/app/pickhouse/photo/dto/PhotoDto.java`

### Error Handling
- `src/main/java/app/pickhouse/common/error/ApiException.java`
- `src/main/java/app/pickhouse/common/error/ErrorCode.java`
- `src/main/java/app/pickhouse/common/error/ErrorResponse.java`
- `src/main/java/app/pickhouse/common/error/GlobalExceptionHandler.java`

### Tests (mirror main tree)
- `src/test/java/app/pickhouse/PickHouseApplicationTests.java`
- `src/test/java/app/pickhouse/support/IntegrationTestBase.java`
- `src/test/java/app/pickhouse/support/MySqlContainerHolder.java`
- `src/test/java/app/pickhouse/support/TestJwtFactory.java`
- `src/test/java/app/pickhouse/security/JwtIssuerTest.java`
- `src/test/java/app/pickhouse/security/JwtAuthFilterTest.java`
- `src/test/java/app/pickhouse/auth/oauth/AppleIdTokenVerifierTest.java`
- `src/test/java/app/pickhouse/auth/oauth/KakaoIdTokenVerifierTest.java`
- `src/test/java/app/pickhouse/auth/AuthControllerTest.java`
- `src/test/java/app/pickhouse/user/UserControllerTest.java`
- `src/test/java/app/pickhouse/house/HouseControllerTest.java`
- `src/test/java/app/pickhouse/residence/ResidenceControllerTest.java`
- `src/test/java/app/pickhouse/photo/PhotoControllerTest.java`
- `src/test/resources/application-test.yml`
- `src/test/resources/test-keys/jwt-private.pem`
- `src/test/resources/test-keys/jwt-public.pem`

### Docker / Deployment
- `docker-compose.yml` (local dev)
- `docker-compose.prod.yml` (production)
- `Dockerfile`
- `deploy/nginx.conf`
- `deploy/setup-server.sh`
- `deploy/deploy.sh`

---

## Tasks

### Task 1: Initialize Gradle project skeleton

**Files:**
- Create: `backend/settings.gradle.kts`
- Create: `backend/build.gradle.kts`
- Create: `backend/.gitignore`
- Create: `backend/gradle/wrapper/gradle-wrapper.properties`

- [ ] **Step 1: Create `backend/` directory and verify**

Run: `mkdir -p D:/work/project/workspace/Prj/pickhouse/backend && ls D:/work/project/workspace/Prj/pickhouse/backend`
Expected: empty directory listing succeeds.

- [ ] **Step 2: Write `backend/settings.gradle.kts`**

```kotlin
rootProject.name = "pickhouse-backend"
```

- [ ] **Step 3: Write `backend/build.gradle.kts`**

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.3.5"
    id("io.spring.dependency-management") version "1.1.6"
}

group = "app.pickhouse"
version = "0.0.1-SNAPSHOT"

java {
    toolchain { languageVersion.set(JavaLanguageVersion.of(21)) }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-mysql")
    implementation("com.mysql:mysql-connector-j")
    implementation("com.auth0:java-jwt:4.4.0")
    implementation("com.auth0:jwks-rsa:0.22.1")
    implementation("software.amazon.awssdk:s3:2.28.16")
    implementation("software.amazon.awssdk:auth:2.28.16")
    compileOnly("org.projectlombok:lombok:1.18.34")
    annotationProcessor("org.projectlombok:lombok:1.18.34")
    testCompileOnly("org.projectlombok:lombok:1.18.34")
    testAnnotationProcessor("org.projectlombok:lombok:1.18.34")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:junit-jupiter:1.20.3")
    testImplementation("org.testcontainers:mysql:1.20.3")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
}

tasks.withType<Test> {
    useJUnitPlatform()
    testLogging { events("passed", "failed", "skipped") }
}
```

- [ ] **Step 4: Write `backend/.gitignore`**

```
.gradle/
build/
out/
*.iml
.idea/
.vscode/
HELP.md
*.log
.env
.env.local
src/main/resources/jwt-private.pem
src/main/resources/jwt-public.pem
```

- [ ] **Step 5: Generate Gradle wrapper**

Run: `cd D:/work/project/workspace/Prj/pickhouse/backend && gradle wrapper --gradle-version 8.10`
Expected: `gradlew`, `gradlew.bat`, and `gradle/wrapper/` files created.

If `gradle` is not installed, instead create `backend/gradle/wrapper/gradle-wrapper.properties` manually:
```
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```
Then download `gradle-wrapper.jar` from a fresh Spring Initializr project of equivalent version, or run `gradle wrapper` from any system that has Gradle 8.10.

- [ ] **Step 6: Verify wrapper works**

Run: `cd D:/work/project/workspace/Prj/pickhouse/backend && ./gradlew --version` (PowerShell: `.\gradlew.bat --version`)
Expected: Gradle 8.10, JVM 21.

- [ ] **Step 7: Commit**

```bash
cd D:/work/project/workspace/Prj/pickhouse
git init 2>/dev/null; git add backend/build.gradle.kts backend/settings.gradle.kts backend/.gitignore backend/gradle backend/gradlew backend/gradlew.bat
git commit -m "chore(backend): scaffold gradle project with spring boot 3"
```

---

### Task 2: Spring Boot application entry point + smoke test

**Files:**
- Create: `backend/src/main/java/app/pickhouse/PickHouseApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/test/java/app/pickhouse/PickHouseApplicationTests.java`

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/app/pickhouse/PickHouseApplicationTests.java`:
```java
package app.pickhouse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PickHouseApplicationTests {
    @Test
    void contextLoads() {}
}
```

- [ ] **Step 2: Run test, see it fail**

Run: `./gradlew test --tests app.pickhouse.PickHouseApplicationTests`
Expected: FAIL — `PickHouseApplication` class missing.

- [ ] **Step 3: Write application entry**

`backend/src/main/java/app/pickhouse/PickHouseApplication.java`:
```java
package app.pickhouse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PickHouseApplication {
    public static void main(String[] args) {
        SpringApplication.run(PickHouseApplication.class, args);
    }
}
```

- [ ] **Step 4: Write base `application.yml`**

`backend/src/main/resources/application.yml`:
```yaml
spring:
  application:
    name: pickhouse-backend
  profiles:
    default: local
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        jdbc:
          time_zone: UTC
        format_sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration
server:
  port: 8080
  forward-headers-strategy: framework
pickhouse:
  jwt:
    issuer: https://api.pickhouse.app
    access-token-ttl-seconds: 1800
    refresh-token-ttl-seconds: 2592000
    private-key-path: classpath:jwt-private.pem
    public-key-path: classpath:jwt-public.pem
  oauth:
    apple:
      audience: app.pickhouse.ios
      jwks-url: https://appleid.apple.com/auth/keys
    kakao:
      jwks-url: https://kauth.kakao.com/.well-known/jwks.json
      issuer: https://kauth.kakao.com
      audience: ${KAKAO_REST_API_KEY:dummy-kakao-key}
  r2:
    endpoint: ${R2_ENDPOINT:https://example.r2.cloudflarestorage.com}
    bucket: ${R2_BUCKET:pickhouse-photos}
    access-key: ${R2_ACCESS_KEY:dummy}
    secret-key: ${R2_SECRET_KEY:dummy}
    public-base-url: ${R2_PUBLIC_BASE_URL:https://photos.pickhouse.app}
    presign-ttl-seconds: 600
  account:
    grace-period-days: 30
```

- [ ] **Step 5: Write `application-test.yml`**

`backend/src/test/resources/application-test.yml`:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
pickhouse:
  jwt:
    issuer: https://test.pickhouse.app
    access-token-ttl-seconds: 1800
    refresh-token-ttl-seconds: 2592000
    private-key-path: classpath:test-keys/jwt-private.pem
    public-key-path: classpath:test-keys/jwt-public.pem
  oauth:
    apple:
      audience: app.pickhouse.ios
      jwks-url: http://localhost:0/keys
    kakao:
      jwks-url: http://localhost:0/jwks
      issuer: https://kauth.kakao.com
      audience: test-kakao-key
  r2:
    endpoint: http://localhost:9999
    bucket: test-bucket
    access-key: test-access
    secret-key: test-secret
    public-base-url: http://localhost:9999/test-bucket
    presign-ttl-seconds: 600
  account:
    grace-period-days: 30
```

- [ ] **Step 6: Generate test JWT key pair**

Run from `backend/`:
```bash
mkdir -p src/test/resources/test-keys
openssl genrsa -out src/test/resources/test-keys/jwt-private.pem 2048
openssl rsa -in src/test/resources/test-keys/jwt-private.pem -pubout -out src/test/resources/test-keys/jwt-public.pem
```
Expected: both files created.

- [ ] **Step 7: Generate main JWT key pair (will be excluded from git)**

Run:
```bash
mkdir -p src/main/resources
openssl genrsa -out src/main/resources/jwt-private.pem 2048
openssl rsa -in src/main/resources/jwt-private.pem -pubout -out src/main/resources/jwt-public.pem
```

(Already in .gitignore from Task 1.)

- [ ] **Step 8: Run test, expect partial success or container failure**

Run: `./gradlew test --tests app.pickhouse.PickHouseApplicationTests`
Expected: still FAILS — no datasource configured yet. We'll wire Testcontainers next.

- [ ] **Step 9: Commit progress**

```bash
git add backend/src/main/java backend/src/main/resources backend/src/test/resources/application-test.yml backend/src/test/resources/test-keys backend/src/test/java
git commit -m "feat(backend): add application entry and base config"
```

---

### Task 3: Testcontainers MySQL base + smoke test passes

**Files:**
- Create: `backend/src/test/java/app/pickhouse/support/MySqlContainerHolder.java`
- Create: `backend/src/test/java/app/pickhouse/support/IntegrationTestBase.java`
- Modify: `backend/src/test/java/app/pickhouse/PickHouseApplicationTests.java`

- [ ] **Step 1: Write `MySqlContainerHolder`**

`backend/src/test/java/app/pickhouse/support/MySqlContainerHolder.java`:
```java
package app.pickhouse.support;

import org.testcontainers.containers.MySQLContainer;

public final class MySqlContainerHolder {
    public static final MySQLContainer<?> INSTANCE = new MySQLContainer<>("mysql:8.0.39")
        .withDatabaseName("pickhouse_test")
        .withUsername("test")
        .withPassword("test")
        .withReuse(true);

    static {
        INSTANCE.start();
    }

    private MySqlContainerHolder() {}
}
```

- [ ] **Step 2: Write `IntegrationTestBase`**

`backend/src/test/java/app/pickhouse/support/IntegrationTestBase.java`:
```java
package app.pickhouse.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", MySqlContainerHolder.INSTANCE::getJdbcUrl);
        r.add("spring.datasource.username", MySqlContainerHolder.INSTANCE::getUsername);
        r.add("spring.datasource.password", MySqlContainerHolder.INSTANCE::getPassword);
        r.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }
}
```

- [ ] **Step 3: Update `PickHouseApplicationTests`**

```java
package app.pickhouse;

import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;

class PickHouseApplicationTests extends IntegrationTestBase {
    @Test
    void contextLoads() {}
}
```

- [ ] **Step 4: Verify Docker is running**

Run: `docker info`
Expected: shows daemon info. If not, start Docker Desktop.

- [ ] **Step 5: Run test, see it pass**

Run: `./gradlew test --tests app.pickhouse.PickHouseApplicationTests`
Expected: PASS after Testcontainers pulls mysql:8.0.39 (first run slow). Note context will still fail until Flyway migrations exist — so this step also expects FAIL with `Schema validation` error referencing missing tables. That's the next step.

Actually with `ddl-auto: validate` and no entities yet, validation has nothing to check. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/test/java/app/pickhouse/support backend/src/test/java/app/pickhouse/PickHouseApplicationTests.java
git commit -m "test(backend): add testcontainers MySQL base"
```

---

### Task 4: Flyway migration — users + oauth_identities + refresh_tokens

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__create_users.sql`
- Create: `backend/src/main/resources/db/migration/V5__create_refresh_tokens.sql`
- Create: `backend/src/main/resources/db/migration/V6__create_oauth_identities.sql`

- [ ] **Step 1: Write V1 migration**

`backend/src/main/resources/db/migration/V1__create_users.sql`:
```sql
CREATE TABLE users (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    email         VARCHAR(255) NULL,
    nickname      VARCHAR(50)  NULL,
    created_at    DATETIME(3)  NOT NULL,
    updated_at    DATETIME(3)  NOT NULL,
    deleted_at    DATETIME(3)  NULL,
    purge_after   DATETIME(3)  NULL,
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Write V6 migration (oauth identities)**

`backend/src/main/resources/db/migration/V6__create_oauth_identities.sql`:
```sql
CREATE TABLE oauth_identities (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    user_id     CHAR(36)     NOT NULL,
    provider    VARCHAR(20)  NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    created_at  DATETIME(3)  NOT NULL,
    UNIQUE KEY uk_oauth_provider (provider, provider_id),
    KEY ix_oauth_user (user_id),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 3: Write V5 migration (refresh tokens)**

`backend/src/main/resources/db/migration/V5__create_refresh_tokens.sql`:
```sql
CREATE TABLE refresh_tokens (
    id          CHAR(36)    NOT NULL PRIMARY KEY,
    user_id     CHAR(36)    NOT NULL,
    jti         CHAR(36)    NOT NULL,
    expires_at  DATETIME(3) NOT NULL,
    revoked     TINYINT(1)  NOT NULL DEFAULT 0,
    created_at  DATETIME(3) NOT NULL,
    UNIQUE KEY uk_refresh_jti (jti),
    KEY ix_refresh_user (user_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 4: Run smoke test, expect pass**

Run: `./gradlew test --tests app.pickhouse.PickHouseApplicationTests`
Expected: PASS. Flyway runs migrations against testcontainer MySQL.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/db/migration/V1__create_users.sql \
        backend/src/main/resources/db/migration/V5__create_refresh_tokens.sql \
        backend/src/main/resources/db/migration/V6__create_oauth_identities.sql
git commit -m "feat(db): migrations for users, oauth identities, refresh tokens"
```

---

### Task 5: Flyway migration — houses

**Files:**
- Create: `backend/src/main/resources/db/migration/V2__create_houses.sql`

- [ ] **Step 1: Write V2 migration**

`backend/src/main/resources/db/migration/V2__create_houses.sql`:
```sql
CREATE TABLE houses (
    id                       CHAR(36)      NOT NULL PRIMARY KEY,
    user_id                  CHAR(36)      NOT NULL,
    address_road_address     VARCHAR(255)  NULL,
    address_jibun_address    VARCHAR(255)  NULL,
    address_zonecode         VARCHAR(10)   NULL,
    address_latitude         DECIMAL(10,7) NULL,
    address_longitude        DECIMAL(10,7) NULL,
    address_detail           VARCHAR(255)  NULL,
    deal_type          VARCHAR(20)  NOT NULL,
    deposit            INT          NOT NULL DEFAULT 0,
    rent               INT          NOT NULL DEFAULT 0,
    maintenance_fee    INT          NULL,
    area               DECIMAL(7,2) NULL,
    built_year         INT          NULL,
    floor              INT          NULL,
    total_floor        INT          NULL,
    available_from     DATE         NULL,
    station_distance   INT          NULL,
    rooms              INT          NULL,
    bathrooms          INT          NULL,
    has_balcony        TINYINT(1)   NULL,
    has_elevator       TINYINT(1)   NULL,
    has_parking        TINYINT(1)   NULL,
    options_json       JSON         NULL,
    security_json      JSON         NULL,
    garbage            VARCHAR(255) NULL,
    water_pressure     TINYINT      NULL,
    sunlight           TINYINT      NULL,
    noise              TINYINT      NULL,
    insulation         TINYINT      NULL,
    ventilation        TINYINT      NULL,
    moisture           TINYINT      NULL,
    neighborhood       TINYINT      NULL,
    first_impression   TINYINT      NULL,
    memo               TEXT         NULL,
    promoted_at        DATETIME(3)  NULL,
    created_at         DATETIME(3)  NOT NULL,
    updated_at         DATETIME(3)  NOT NULL,
    deleted_at         DATETIME(3)  NULL,
    KEY ix_houses_user (user_id),
    KEY ix_houses_user_deleted (user_id, deleted_at),
    CONSTRAINT fk_houses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Run smoke test, expect pass**

Run: `./gradlew test --tests app.pickhouse.PickHouseApplicationTests`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/resources/db/migration/V2__create_houses.sql
git commit -m "feat(db): migration for houses table"
```

---

### Task 6: Flyway migration — residences

**Files:**
- Create: `backend/src/main/resources/db/migration/V3__create_residences.sql`

- [ ] **Step 1: Write V3 migration**

`backend/src/main/resources/db/migration/V3__create_residences.sql`:
```sql
CREATE TABLE residences (
    id                       CHAR(36)     NOT NULL PRIMARY KEY,
    user_id                  CHAR(36)     NOT NULL,
    source_house_id          CHAR(36)     NULL,
    name                     VARCHAR(100) NOT NULL,
    era_label                VARCHAR(100) NULL,
    is_favorite              TINYINT(1)   NOT NULL DEFAULT 0,
    address_road_address     VARCHAR(255) NULL,
    address_jibun_address    VARCHAR(255) NULL,
    address_zonecode         VARCHAR(10)  NULL,
    address_latitude         DECIMAL(10,7) NULL,
    address_longitude        DECIMAL(10,7) NULL,
    address_detail           VARCHAR(255) NULL,
    deal_type                VARCHAR(20)  NULL,
    deposit                  INT          NULL,
    rent                     INT          NULL,
    maintenance_fee          INT          NULL,
    area                     DECIMAL(7,2) NULL,
    built_year               INT          NULL,
    floor                    INT          NULL,
    total_floor              INT          NULL,
    rooms                    INT          NULL,
    bathrooms                INT          NULL,
    has_balcony              TINYINT(1)   NULL,
    has_elevator             TINYINT(1)   NULL,
    has_parking              TINYINT(1)   NULL,
    options_json             JSON         NULL,
    security_json            JSON         NULL,
    garbage                  VARCHAR(255) NULL,
    water_pressure           TINYINT      NULL,
    sunlight                 TINYINT      NULL,
    noise                    TINYINT      NULL,
    insulation               TINYINT      NULL,
    ventilation              TINYINT      NULL,
    moisture                 TINYINT      NULL,
    neighborhood             TINYINT      NULL,
    first_impression         TINYINT      NULL,
    memo                     TEXT         NULL,
    contract_start_date      DATE         NOT NULL,
    contract_end_date        DATE         NOT NULL,
    landlord_memo            TEXT         NULL,
    is_current               TINYINT(1)   NOT NULL DEFAULT 0,
    move_in_photo_ids_json   JSON         NULL,
    contract_photo_id        CHAR(36)     NULL,
    meter_electricity        INT          NULL,
    meter_water              INT          NULL,
    meter_gas                INT          NULL,
    meter_recorded_at        DATE         NULL,
    created_at               DATETIME(3)  NOT NULL,
    updated_at               DATETIME(3)  NOT NULL,
    deleted_at               DATETIME(3)  NULL,
    KEY ix_residences_user (user_id),
    KEY ix_residences_source (source_house_id),
    CONSTRAINT fk_residences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_residences_house FOREIGN KEY (source_house_id) REFERENCES houses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Run smoke test**

Run: `./gradlew test --tests app.pickhouse.PickHouseApplicationTests`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/resources/db/migration/V3__create_residences.sql
git commit -m "feat(db): migration for residences table"
```

---

### Task 7: Flyway migration — photos

**Files:**
- Create: `backend/src/main/resources/db/migration/V4__create_photos.sql`

- [ ] **Step 1: Write V4 migration**

`backend/src/main/resources/db/migration/V4__create_photos.sql`:
```sql
CREATE TABLE photos (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    user_id       CHAR(36)     NOT NULL,
    house_id      CHAR(36)     NULL,
    residence_id  CHAR(36)     NULL,
    object_key    VARCHAR(500) NOT NULL,
    remote_url    VARCHAR(1000) NOT NULL,
    content_type  VARCHAR(50)  NULL,
    taken_at      DATETIME(3)  NULL,
    created_at    DATETIME(3)  NOT NULL,
    deleted_at    DATETIME(3)  NULL,
    KEY ix_photos_user (user_id),
    KEY ix_photos_house (house_id),
    KEY ix_photos_residence (residence_id),
    CONSTRAINT fk_photos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_house FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    CONSTRAINT fk_photos_residence FOREIGN KEY (residence_id) REFERENCES residences(id) ON DELETE CASCADE,
    CONSTRAINT ck_photos_parent CHECK (
        (house_id IS NOT NULL AND residence_id IS NULL) OR
        (house_id IS NULL AND residence_id IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Run smoke test**

Run: `./gradlew test --tests app.pickhouse.PickHouseApplicationTests`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/resources/db/migration/V4__create_photos.sql
git commit -m "feat(db): migration for photos table"
```

---

### Task 8: JPA entity — User + OAuthIdentity + OAuthProvider enum

**Files:**
- Create: `backend/src/main/java/app/pickhouse/domain/user/User.java`
- Create: `backend/src/main/java/app/pickhouse/domain/user/OAuthIdentity.java`
- Create: `backend/src/main/java/app/pickhouse/domain/user/OAuthProvider.java`
- Create: `backend/src/main/java/app/pickhouse/domain/user/UserRepository.java`
- Create: `backend/src/main/java/app/pickhouse/domain/user/OAuthIdentityRepository.java`
- Create: `backend/src/test/java/app/pickhouse/domain/user/UserRepositoryTest.java`

- [ ] **Step 1: Write the failing repository test**

`backend/src/test/java/app/pickhouse/domain/user/UserRepositoryTest.java`:
```java
package app.pickhouse.domain.user;

import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserRepositoryTest extends IntegrationTestBase {

    @Autowired UserRepository users;
    @Autowired OAuthIdentityRepository identities;

    @Test
    void saves_user_with_oauth_identity() {
        Instant now = Instant.now();
        User u = User.builder()
            .id(UUID.randomUUID())
            .email("a@b.com")
            .nickname("alice")
            .createdAt(now)
            .updatedAt(now)
            .build();
        users.save(u);

        OAuthIdentity id = OAuthIdentity.builder()
            .id(UUID.randomUUID())
            .userId(u.getId())
            .provider(OAuthProvider.KAKAO)
            .providerId("kakao-12345")
            .createdAt(now)
            .build();
        identities.save(id);

        assertThat(identities.findByProviderAndProviderId(OAuthProvider.KAKAO, "kakao-12345"))
            .isPresent()
            .get().extracting(OAuthIdentity::getUserId).isEqualTo(u.getId());
    }
}
```

- [ ] **Step 2: Run test, see it fail**

Run: `./gradlew test --tests app.pickhouse.domain.user.UserRepositoryTest`
Expected: FAIL — classes missing.

- [ ] **Step 3: Write `OAuthProvider` enum**

```java
package app.pickhouse.domain.user;

public enum OAuthProvider { APPLE, KAKAO }
```

- [ ] **Step 4: Write `User` entity**

`backend/src/main/java/app/pickhouse/domain/user/User.java`:
```java
package app.pickhouse.domain.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @Column private String email;
    @Column private String nickname;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "deleted_at") private Instant deletedAt;
    @Column(name = "purge_after") private Instant purgeAfter;

    public void softDelete(Instant now, Instant purgeAfter) {
        this.deletedAt = now;
        this.purgeAfter = purgeAfter;
        this.updatedAt = now;
    }

    public void updateProfile(String nickname, Instant now) {
        if (nickname != null) this.nickname = nickname;
        this.updatedAt = now;
    }
}
```

- [ ] **Step 5: Write `OAuthIdentity` entity**

```java
package app.pickhouse.domain.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "oauth_identities")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OAuthIdentity {

    @Id
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OAuthProvider provider;

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
```

- [ ] **Step 6: Write `UserRepository`**

```java
package app.pickhouse.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
}
```

- [ ] **Step 7: Write `OAuthIdentityRepository`**

```java
package app.pickhouse.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OAuthIdentityRepository extends JpaRepository<OAuthIdentity, UUID> {
    Optional<OAuthIdentity> findByProviderAndProviderId(OAuthProvider provider, String providerId);
}
```

- [ ] **Step 8: Run test, see it pass**

Run: `./gradlew test --tests app.pickhouse.domain.user.UserRepositoryTest`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/app/pickhouse/domain/user backend/src/test/java/app/pickhouse/domain/user
git commit -m "feat(domain): User and OAuthIdentity entities + repos"
```

---

### Task 9: JPA entity — RefreshToken

**Files:**
- Create: `backend/src/main/java/app/pickhouse/domain/auth/RefreshToken.java`
- Create: `backend/src/main/java/app/pickhouse/domain/auth/RefreshTokenRepository.java`
- Create: `backend/src/test/java/app/pickhouse/domain/auth/RefreshTokenRepositoryTest.java`

- [ ] **Step 1: Write the failing test**

```java
package app.pickhouse.domain.auth;

import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class RefreshTokenRepositoryTest extends IntegrationTestBase {
    @Autowired RefreshTokenRepository tokens;
    @Autowired UserRepository users;

    @Test
    void finds_token_by_jti() {
        Instant now = Instant.now();
        User u = User.builder().id(UUID.randomUUID()).createdAt(now).updatedAt(now).build();
        users.save(u);

        UUID jti = UUID.randomUUID();
        tokens.save(RefreshToken.builder()
            .id(UUID.randomUUID())
            .userId(u.getId())
            .jti(jti)
            .expiresAt(now.plusSeconds(3600))
            .revoked(false)
            .createdAt(now)
            .build());

        assertThat(tokens.findByJti(jti)).isPresent();
    }
}
```

- [ ] **Step 2: Run, expect fail**

Run: `./gradlew test --tests app.pickhouse.domain.auth.RefreshTokenRepositoryTest`
Expected: FAIL.

- [ ] **Step 3: Write `RefreshToken`**

```java
package app.pickhouse.domain.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @Column(columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)")
    private UUID userId;

    @Column(nullable = false, columnDefinition = "CHAR(36)")
    private UUID jti;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean revoked;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public void revoke() { this.revoked = true; }
}
```

- [ ] **Step 4: Write `RefreshTokenRepository`**

```java
package app.pickhouse.domain.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByJti(UUID jti);

    @Modifying
    @Query("update RefreshToken t set t.revoked = true where t.userId = :userId")
    int revokeAllForUser(@Param("userId") UUID userId);
}
```

- [ ] **Step 5: Run test, see it pass**

Run: `./gradlew test --tests app.pickhouse.domain.auth.RefreshTokenRepositoryTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/app/pickhouse/domain/auth backend/src/test/java/app/pickhouse/domain/auth
git commit -m "feat(domain): RefreshToken entity + repo"
```

---

### Task 10: JPA entity — House + DealType enum

**Files:**
- Create: `backend/src/main/java/app/pickhouse/domain/common/Address.java`
- Create: `backend/src/main/java/app/pickhouse/domain/house/DealType.java`
- Create: `backend/src/main/java/app/pickhouse/domain/house/House.java`
- Create: `backend/src/main/java/app/pickhouse/domain/house/HouseRepository.java`
- Create: `backend/src/test/java/app/pickhouse/domain/house/HouseRepositoryTest.java`

- [ ] **Step 1: Write the failing test**

```java
package app.pickhouse.domain.house;

import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class HouseRepositoryTest extends IntegrationTestBase {

    @Autowired HouseRepository houses;
    @Autowired UserRepository users;

    @Test
    void lists_user_houses_excluding_deleted() {
        Instant now = Instant.now();
        User u = User.builder().id(UUID.randomUUID()).createdAt(now).updatedAt(now).build();
        users.save(u);

        House active = House.builder()
            .id(UUID.randomUUID()).userId(u.getId())
            .dealType(DealType.JEONSE).deposit(50000).rent(0)
            .createdAt(now).updatedAt(now).build();
        House deleted = House.builder()
            .id(UUID.randomUUID()).userId(u.getId())
            .dealType(DealType.WOLSE).deposit(1000).rent(50)
            .createdAt(now).updatedAt(now).deletedAt(now).build();
        houses.save(active);
        houses.save(deleted);

        List<House> found = houses.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(u.getId());
        assertThat(found).extracting(House::getId).containsExactly(active.getId());
    }
}
```

- [ ] **Step 2: Run, expect fail**

Run: `./gradlew test --tests app.pickhouse.domain.house.HouseRepositoryTest`
Expected: FAIL.

- [ ] **Step 3: Write `Address` @Embeddable**

`backend/src/main/java/app/pickhouse/domain/common/Address.java`:
```java
package app.pickhouse.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.math.BigDecimal;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Address {
    @Column(name = "road_address") private String roadAddress;
    @Column(name = "jibun_address") private String jibunAddress;
    @Column(name = "zonecode") private String zonecode;
    @Column(name = "latitude") private BigDecimal latitude;
    @Column(name = "longitude") private BigDecimal longitude;
    @Column(name = "detail") private String detail;
}
```

The owning entity must annotate the field with `@AttributeOverrides` to prefix columns with `address_` (so DB columns become `address_road_address`, `address_jibun_address`, etc.). The `House` / `Residence` entity examples below show this. Use the same `Address` value object for both `House` and `Residence`.

- [ ] **Step 4: Write `DealType`**

```java
package app.pickhouse.domain.house;

public enum DealType { JEONSE, WOLSE, BAN_JEONSE }
```

- [ ] **Step 5: Write `House` entity**

```java
package app.pickhouse.domain.house;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "houses")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class House {

    @Id @Column(columnDefinition = "CHAR(36)") private UUID id;
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)") private UUID userId;

    @Embedded
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(name = "deal_type", nullable = false)
    private DealType dealType;

    @Column(nullable = false) private int deposit;
    @Column(nullable = false) private int rent;
    @Column(name = "maintenance_fee") private Integer maintenanceFee;
    @Column private BigDecimal area;
    @Column(name = "built_year") private Integer builtYear;
    @Column private Integer floor;
    @Column(name = "total_floor") private Integer totalFloor;
    @Column(name = "available_from") private LocalDate availableFrom;
    @Column(name = "station_distance") private Integer stationDistance;

    @Column private Integer rooms;
    @Column private Integer bathrooms;
    @Column(name = "has_balcony") private Boolean hasBalcony;
    @Column(name = "has_elevator") private Boolean hasElevator;
    @Column(name = "has_parking") private Boolean hasParking;

    @Column(name = "options_json", columnDefinition = "json") private String optionsJson;
    @Column(name = "security_json", columnDefinition = "json") private String securityJson;
    @Column private String garbage;

    @Column(name = "water_pressure") private Integer waterPressure;
    @Column private Integer sunlight;
    @Column private Integer noise;
    @Column private Integer insulation;
    @Column private Integer ventilation;
    @Column private Integer moisture;
    @Column private Integer neighborhood;
    @Column(name = "first_impression") private Integer firstImpression;

    @Column(columnDefinition = "TEXT") private String memo;

    @Column(name = "promoted_at") private Instant promotedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "deleted_at") private Instant deletedAt;

    public void softDelete(Instant now) { this.deletedAt = now; this.updatedAt = now; }
    public void markPromoted(Instant now) { this.promotedAt = now; this.updatedAt = now; }
    public void touch(Instant now) { this.updatedAt = now; }
}
```

- [ ] **Step 6: Write `HouseRepository`**

```java
package app.pickhouse.domain.house;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HouseRepository extends JpaRepository<House, UUID> {
    List<House> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);
    Optional<House> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
}
```

- [ ] **Step 7: Run test, see it pass**

Run: `./gradlew test --tests app.pickhouse.domain.house.HouseRepositoryTest`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/app/pickhouse/domain/common backend/src/main/java/app/pickhouse/domain/house backend/src/test/java/app/pickhouse/domain/house
git commit -m "feat(domain): House entity + Address embeddable + repo"
```

---

### Task 11: JPA entity — Residence

**Files:**
- Create: `backend/src/main/java/app/pickhouse/domain/residence/Residence.java`
- Create: `backend/src/main/java/app/pickhouse/domain/residence/ResidenceRepository.java`
- Create: `backend/src/test/java/app/pickhouse/domain/residence/ResidenceRepositoryTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.domain.residence;

import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ResidenceRepositoryTest extends IntegrationTestBase {
    @Autowired ResidenceRepository residences;
    @Autowired UserRepository users;

    @Test
    void lists_residences_by_user() {
        Instant now = Instant.now();
        User u = User.builder().id(UUID.randomUUID()).createdAt(now).updatedAt(now).build();
        users.save(u);

        Residence r = Residence.builder()
            .id(UUID.randomUUID()).userId(u.getId())
            .contractStartDate(LocalDate.of(2024, 1, 1))
            .contractEndDate(LocalDate.of(2026, 1, 1))
            .isCurrent(true)
            .createdAt(now).updatedAt(now)
            .build();
        residences.save(r);

        List<Residence> result = residences.findByUserIdAndDeletedAtIsNullOrderByContractStartDateDesc(u.getId());
        assertThat(result).extracting(Residence::getId).containsExactly(r.getId());
    }
}
```

- [ ] **Step 2: Run, expect fail**

Run: `./gradlew test --tests app.pickhouse.domain.residence.ResidenceRepositoryTest`
Expected: FAIL.

- [ ] **Step 3: Write `Residence` entity**

```java
package app.pickhouse.domain.residence;

import app.pickhouse.domain.house.DealType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "residences")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Residence {

    @Id @Column(columnDefinition = "CHAR(36)") private UUID id;
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)") private UUID userId;
    @Column(name = "source_house_id", columnDefinition = "CHAR(36)") private UUID sourceHouseId;

    @Column(name = "address_road") private String addressRoad;
    @Column(name = "address_jibun") private String addressJibun;
    @Column private BigDecimal latitude;
    @Column private BigDecimal longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "deal_type")
    private DealType dealType;

    @Column private Integer deposit;
    @Column private Integer rent;
    @Column(name = "maintenance_fee") private Integer maintenanceFee;
    @Column private BigDecimal area;
    @Column(name = "built_year") private Integer builtYear;
    @Column private Integer floor;
    @Column(name = "total_floor") private Integer totalFloor;

    @Column private Integer rooms;
    @Column private Integer bathrooms;
    @Column(name = "has_balcony") private Boolean hasBalcony;
    @Column(name = "has_elevator") private Boolean hasElevator;
    @Column(name = "has_parking") private Boolean hasParking;

    @Column(name = "options_json", columnDefinition = "json") private String optionsJson;
    @Column(name = "security_json", columnDefinition = "json") private String securityJson;
    @Column private String garbage;

    @Column(name = "water_pressure") private Integer waterPressure;
    @Column private Integer sunlight;
    @Column private Integer noise;
    @Column private Integer insulation;
    @Column private Integer ventilation;
    @Column private Integer moisture;
    @Column private Integer neighborhood;
    @Column(name = "first_impression") private Integer firstImpression;

    @Column(columnDefinition = "TEXT") private String memo;

    @Column(name = "contract_start_date", nullable = false) private LocalDate contractStartDate;
    @Column(name = "contract_end_date", nullable = false) private LocalDate contractEndDate;
    @Column(name = "landlord_memo", columnDefinition = "TEXT") private String landlordMemo;
    @Column(name = "is_current", nullable = false) private boolean isCurrent;

    @Column(name = "meter_electric_initial") private Integer meterElectricInitial;
    @Column(name = "meter_water_initial") private Integer meterWaterInitial;
    @Column(name = "meter_gas_initial") private Integer meterGasInitial;

    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @Column(name = "deleted_at") private Instant deletedAt;

    public void softDelete(Instant now) { this.deletedAt = now; this.updatedAt = now; }
    public void touch(Instant now) { this.updatedAt = now; }
}
```

- [ ] **Step 4: Write `ResidenceRepository`**

```java
package app.pickhouse.domain.residence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResidenceRepository extends JpaRepository<Residence, UUID> {
    List<Residence> findByUserIdAndDeletedAtIsNullOrderByContractStartDateDesc(UUID userId);
    Optional<Residence> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
}
```

- [ ] **Step 5: Run test, pass**

Run: `./gradlew test --tests app.pickhouse.domain.residence.ResidenceRepositoryTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/app/pickhouse/domain/residence backend/src/test/java/app/pickhouse/domain/residence
git commit -m "feat(domain): Residence entity + repo"
```

---

### Task 12: JPA entity — Photo

**Files:**
- Create: `backend/src/main/java/app/pickhouse/domain/photo/Photo.java`
- Create: `backend/src/main/java/app/pickhouse/domain/photo/PhotoRepository.java`
- Create: `backend/src/test/java/app/pickhouse/domain/photo/PhotoRepositoryTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.domain.photo;

import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.House;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoRepositoryTest extends IntegrationTestBase {
    @Autowired PhotoRepository photos;
    @Autowired UserRepository users;
    @Autowired HouseRepository houses;

    @Test
    void lists_photos_by_house() {
        Instant now = Instant.now();
        User u = User.builder().id(UUID.randomUUID()).createdAt(now).updatedAt(now).build();
        users.save(u);
        House h = House.builder().id(UUID.randomUUID()).userId(u.getId())
            .dealType(DealType.JEONSE).deposit(50000).rent(0)
            .createdAt(now).updatedAt(now).build();
        houses.save(h);

        Photo p = Photo.builder()
            .id(UUID.randomUUID()).userId(u.getId()).houseId(h.getId())
            .objectKey("users/x/photos/y.jpg").remoteUrl("https://photos.example/x.jpg")
            .createdAt(now).build();
        photos.save(p);

        List<Photo> result = photos.findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(h.getId());
        assertThat(result).extracting(Photo::getId).containsExactly(p.getId());
    }
}
```

- [ ] **Step 2: Run, expect fail**

Run: `./gradlew test --tests app.pickhouse.domain.photo.PhotoRepositoryTest`
Expected: FAIL.

- [ ] **Step 3: Write `Photo` entity**

```java
package app.pickhouse.domain.photo;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "photos")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {

    @Id @Column(columnDefinition = "CHAR(36)") private UUID id;
    @Column(name = "user_id", nullable = false, columnDefinition = "CHAR(36)") private UUID userId;
    @Column(name = "house_id", columnDefinition = "CHAR(36)") private UUID houseId;
    @Column(name = "residence_id", columnDefinition = "CHAR(36)") private UUID residenceId;

    @Column(name = "object_key", nullable = false) private String objectKey;
    @Column(name = "remote_url", nullable = false) private String remoteUrl;
    @Column(name = "content_type") private String contentType;
    @Column(name = "taken_at") private Instant takenAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @Column(name = "deleted_at") private Instant deletedAt;

    public void softDelete(Instant now) { this.deletedAt = now; }
}
```

- [ ] **Step 4: Write `PhotoRepository`**

```java
package app.pickhouse.domain.photo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {
    List<Photo> findByHouseIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID houseId);
    List<Photo> findByResidenceIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID residenceId);
    Optional<Photo> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);
}
```

- [ ] **Step 5: Run test, pass**

Run: `./gradlew test --tests app.pickhouse.domain.photo.PhotoRepositoryTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/app/pickhouse/domain/photo backend/src/test/java/app/pickhouse/domain/photo
git commit -m "feat(domain): Photo entity + repo"
```

---

### Task 13: Error handling — ApiException + ErrorResponse + GlobalExceptionHandler

**Files:**
- Create: `backend/src/main/java/app/pickhouse/common/error/ErrorCode.java`
- Create: `backend/src/main/java/app/pickhouse/common/error/ApiException.java`
- Create: `backend/src/main/java/app/pickhouse/common/error/ErrorResponse.java`
- Create: `backend/src/main/java/app/pickhouse/common/error/GlobalExceptionHandler.java`
- Create: `backend/src/test/java/app/pickhouse/common/error/GlobalExceptionHandlerTest.java`

- [ ] **Step 1: Write `ErrorCode`**

```java
package app.pickhouse.common.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    BAD_REQUEST(HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    CONFLICT(HttpStatus.CONFLICT),
    UNPROCESSABLE_ENTITY(HttpStatus.UNPROCESSABLE_ENTITY),
    OAUTH_VERIFICATION_FAILED(HttpStatus.UNAUTHORIZED),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;
    ErrorCode(HttpStatus s) { this.status = s; }
    public HttpStatus status() { return status; }
}
```

- [ ] **Step 2: Write `ApiException`**

```java
package app.pickhouse.common.error;

import lombok.Getter;

import java.util.Map;

@Getter
public class ApiException extends RuntimeException {
    private final ErrorCode code;
    private final Map<String, Object> details;

    public ApiException(ErrorCode code, String message) {
        this(code, message, Map.of());
    }

    public ApiException(ErrorCode code, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.details = details;
    }
}
```

- [ ] **Step 3: Write `ErrorResponse`**

```java
package app.pickhouse.common.error;

import java.util.Map;

public record ErrorResponse(Body error) {
    public static ErrorResponse of(ErrorCode code, String message, Map<String, Object> details) {
        return new ErrorResponse(new Body(code.name(), message, details));
    }
    public record Body(String code, String message, Map<String, Object> details) {}
}
```

- [ ] **Step 4: Write `GlobalExceptionHandler`**

```java
package app.pickhouse.common.error;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getCode().status())
            .body(ErrorResponse.of(ex.getCode(), ex.getMessage(), ex.getDetails()));
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        Map<String, Object> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
            fields.put(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(ErrorCode.BAD_REQUEST, "validation failed", Map.of("fields", fields)));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(ErrorCode.BAD_REQUEST, ex.getMessage(), Map.of()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAny(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of(ErrorCode.INTERNAL_ERROR, "internal error", Map.of()));
    }
}
```

- [ ] **Step 5: Write test**

`backend/src/test/java/app/pickhouse/common/error/GlobalExceptionHandlerTest.java`:
```java
package app.pickhouse.common.error;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void api_exception_maps_to_response() {
        ResponseEntity<ErrorResponse> resp = handler.handleApi(
            new ApiException(ErrorCode.NOT_FOUND, "house missing"));
        assertThat(resp.getStatusCode().value()).isEqualTo(404);
        assertThat(resp.getBody().error().code()).isEqualTo("NOT_FOUND");
        assertThat(resp.getBody().error().message()).isEqualTo("house missing");
    }
}
```

- [ ] **Step 6: Run test**

Run: `./gradlew test --tests app.pickhouse.common.error.GlobalExceptionHandlerTest`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/app/pickhouse/common/error backend/src/test/java/app/pickhouse/common/error
git commit -m "feat(error): ApiException + global handler"
```

---

### Task 14: JWT properties + key provider

**Files:**
- Create: `backend/src/main/java/app/pickhouse/security/JwtProperties.java`
- Create: `backend/src/main/java/app/pickhouse/security/JwtKeyProvider.java`
- Create: `backend/src/test/java/app/pickhouse/security/JwtKeyProviderTest.java`

- [ ] **Step 1: Write `JwtProperties`**

```java
package app.pickhouse.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.jwt")
public record JwtProperties(
    String issuer,
    long accessTokenTtlSeconds,
    long refreshTokenTtlSeconds,
    String privateKeyPath,
    String publicKeyPath
) {}
```

- [ ] **Step 2: Enable @ConfigurationProperties in main app**

Edit `backend/src/main/java/app/pickhouse/PickHouseApplication.java`:
```java
package app.pickhouse;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan("app.pickhouse")
public class PickHouseApplication {
    public static void main(String[] args) {
        SpringApplication.run(PickHouseApplication.class, args);
    }
}
```

- [ ] **Step 3: Write `JwtKeyProvider`**

```java
package app.pickhouse.security;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Component
@RequiredArgsConstructor
public class JwtKeyProvider {

    private final JwtProperties props;
    private final ResourceLoader resourceLoader;

    private RSAPrivateKey privateKey;
    private RSAPublicKey publicKey;

    @PostConstruct
    void init() throws Exception {
        this.privateKey = readPrivate(props.privateKeyPath());
        this.publicKey = readPublic(props.publicKeyPath());
    }

    public RSAPrivateKey privateKey() { return privateKey; }
    public RSAPublicKey publicKey() { return publicKey; }

    private RSAPrivateKey readPrivate(String path) throws Exception {
        String pem = readPem(path);
        String b64 = pem.replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "").replaceAll("\\s+", "");
        byte[] der = Base64.getDecoder().decode(b64);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private RSAPublicKey readPublic(String path) throws Exception {
        String pem = readPem(path);
        String b64 = pem.replace("-----BEGIN PUBLIC KEY-----", "")
            .replace("-----END PUBLIC KEY-----", "").replaceAll("\\s+", "");
        byte[] der = Base64.getDecoder().decode(b64);
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
    }

    private String readPem(String path) throws Exception {
        Resource r = resourceLoader.getResource(path);
        try (InputStream is = r.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
```

- [ ] **Step 4: Write test**

```java
package app.pickhouse.security;

import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

class JwtKeyProviderTest extends IntegrationTestBase {
    @Autowired JwtKeyProvider keys;

    @Test
    void loads_rsa_keys() {
        assertThat(keys.privateKey()).isNotNull();
        assertThat(keys.publicKey()).isNotNull();
        assertThat(keys.privateKey().getAlgorithm()).isEqualTo("RSA");
    }
}
```

- [ ] **Step 5: Run test**

Run: `./gradlew test --tests app.pickhouse.security.JwtKeyProviderTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/app/pickhouse/PickHouseApplication.java backend/src/main/java/app/pickhouse/security backend/src/test/java/app/pickhouse/security/JwtKeyProviderTest.java
git commit -m "feat(security): JWT properties + key provider"
```

---

### Task 15: JwtIssuer (signs access/refresh tokens)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/security/JwtIssuer.java`
- Create: `backend/src/test/java/app/pickhouse/security/JwtIssuerTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.security;

import app.pickhouse.support.IntegrationTestBase;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtIssuerTest extends IntegrationTestBase {

    @Autowired JwtIssuer issuer;
    @Autowired JwtKeyProvider keys;
    @Autowired JwtProperties props;

    @Test
    void issues_access_token_with_subject_and_type() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueAccessToken(userId, "u@x.com");

        DecodedJWT decoded = JWT.require(Algorithm.RSA256(keys.publicKey(), keys.privateKey()))
            .withIssuer(props.issuer()).build().verify(token);

        assertThat(decoded.getSubject()).isEqualTo(userId.toString());
        assertThat(decoded.getClaim("type").asString()).isEqualTo("access");
        assertThat(decoded.getClaim("email").asString()).isEqualTo("u@x.com");
    }

    @Test
    void issues_refresh_token_with_jti() {
        UUID userId = UUID.randomUUID();
        UUID jti = UUID.randomUUID();
        String token = issuer.issueRefreshToken(userId, jti);
        DecodedJWT decoded = JWT.require(Algorithm.RSA256(keys.publicKey(), keys.privateKey()))
            .withIssuer(props.issuer()).build().verify(token);
        assertThat(decoded.getClaim("type").asString()).isEqualTo("refresh");
        assertThat(decoded.getId()).isEqualTo(jti.toString());
    }
}
```

- [ ] **Step 2: Run, expect fail**

Run: `./gradlew test --tests app.pickhouse.security.JwtIssuerTest`
Expected: FAIL.

- [ ] **Step 3: Write `JwtIssuer`**

```java
package app.pickhouse.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtIssuer {

    private final JwtKeyProvider keys;
    private final JwtProperties props;

    public String issueAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        return JWT.create()
            .withIssuer(props.issuer())
            .withSubject(userId.toString())
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(now.plusSeconds(props.accessTokenTtlSeconds())))
            .withClaim("type", "access")
            .withClaim("email", email)
            .sign(Algorithm.RSA256(keys.publicKey(), keys.privateKey()));
    }

    public String issueRefreshToken(UUID userId, UUID jti) {
        Instant now = Instant.now();
        return JWT.create()
            .withIssuer(props.issuer())
            .withSubject(userId.toString())
            .withJWTId(jti.toString())
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(now.plusSeconds(props.refreshTokenTtlSeconds())))
            .withClaim("type", "refresh")
            .sign(Algorithm.RSA256(keys.publicKey(), keys.privateKey()));
    }
}
```

- [ ] **Step 4: Run test, pass**

Run: `./gradlew test --tests app.pickhouse.security.JwtIssuerTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/security/JwtIssuer.java backend/src/test/java/app/pickhouse/security/JwtIssuerTest.java
git commit -m "feat(security): JwtIssuer for access and refresh tokens"

```

---

### Task 16: JwtVerifier (validates our own JWTs)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/security/JwtVerifier.java`
- Create: `backend/src/test/java/app/pickhouse/security/JwtVerifierTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.security;

import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtVerifierTest extends IntegrationTestBase {

    @Autowired JwtIssuer issuer;
    @Autowired JwtVerifier verifier;

    @Test
    void verifies_valid_access_token() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueAccessToken(userId, "x@y.com");
        JwtVerifier.VerifiedClaims c = verifier.verifyAccess(token);
        assertThat(c.userId()).isEqualTo(userId);
        assertThat(c.type()).isEqualTo("access");
    }

    @Test
    void rejects_refresh_token_as_access() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueRefreshToken(userId, UUID.randomUUID());
        assertThatThrownBy(() -> verifier.verifyAccess(token))
            .isInstanceOf(RuntimeException.class);
    }

    @Test
    void rejects_garbage_token() {
        assertThatThrownBy(() -> verifier.verifyAccess("garbage"))
            .isInstanceOf(RuntimeException.class);
    }
}
```

- [ ] **Step 2: Run, expect fail**

Run: `./gradlew test --tests app.pickhouse.security.JwtVerifierTest`
Expected: FAIL.

- [ ] **Step 3: Write `JwtVerifier`**

```java
package app.pickhouse.security;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtVerifier {

    private final JwtKeyProvider keys;
    private final JwtProperties props;

    public VerifiedClaims verifyAccess(String token) {
        return verify(token, "access");
    }

    public VerifiedClaims verifyRefresh(String token) {
        return verify(token, "refresh");
    }

    private VerifiedClaims verify(String token, String expectedType) {
        try {
            DecodedJWT decoded = JWT.require(Algorithm.RSA256(keys.publicKey(), keys.privateKey()))
                .withIssuer(props.issuer())
                .withClaim("type", expectedType)
                .build()
                .verify(token);
            UUID userId = UUID.fromString(decoded.getSubject());
            UUID jti = decoded.getId() != null ? UUID.fromString(decoded.getId()) : null;
            String email = decoded.getClaim("email").asString();
            return new VerifiedClaims(userId, expectedType, jti, email);
        } catch (JWTVerificationException ex) {
            throw new ApiException(ErrorCode.INVALID_TOKEN, "invalid token: " + ex.getMessage());
        }
    }

    public record VerifiedClaims(UUID userId, String type, UUID jti, String email) {}
}
```

- [ ] **Step 4: Run, pass**

Run: `./gradlew test --tests app.pickhouse.security.JwtVerifierTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/security/JwtVerifier.java backend/src/test/java/app/pickhouse/security/JwtVerifierTest.java
git commit -m "feat(security): JwtVerifier with type validation"
```

---

### Task 17: JwtAuthFilter + SecurityConfig + CurrentUserId resolver

**Files:**
- Create: `backend/src/main/java/app/pickhouse/security/JwtAuthFilter.java`
- Create: `backend/src/main/java/app/pickhouse/security/SecurityConfig.java`
- Create: `backend/src/main/java/app/pickhouse/security/CurrentUserId.java`
- Create: `backend/src/main/java/app/pickhouse/security/CurrentUserArgumentResolver.java`
- Create: `backend/src/main/java/app/pickhouse/security/WebConfig.java`
- Create: `backend/src/test/java/app/pickhouse/security/JwtAuthFilterTest.java`

- [ ] **Step 1: Write `CurrentUserId` annotation**

```java
package app.pickhouse.security;

import java.lang.annotation.*;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUserId {}
```

- [ ] **Step 2: Write `JwtAuthFilter`**

```java
package app.pickhouse.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtVerifier verifier;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                JwtVerifier.VerifiedClaims c = verifier.verifyAccess(token);
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    c.userId(), null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (RuntimeException ex) {
                // leave unauthenticated; protected endpoints will 401
            }
        }
        chain.doFilter(req, res);
    }
}
```

- [ ] **Step 3: Write `CurrentUserArgumentResolver`**

```java
package app.pickhouse.security;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.UUID;

@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUserId.class)
            && parameter.getParameterType().equals(UUID.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED, "auth required");
        }
        return auth.getPrincipal();
    }
}
```

- [ ] **Step 4: Write `WebConfig`**

```java
package app.pickhouse.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUserResolver;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserResolver);
    }
}
```

- [ ] **Step 5: Write `SecurityConfig`**

```java
package app.pickhouse.security;

import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.common.error.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(c -> c.disable())
            .cors(c -> {})
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/auth/login", "/auth/refresh", "/actuator/health").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(HttpStatus.UNAUTHORIZED.value());
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(res.getOutputStream(),
                        ErrorResponse.of(ErrorCode.UNAUTHORIZED, "auth required", Map.of()));
                })
                .accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(HttpStatus.FORBIDDEN.value());
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(res.getOutputStream(),
                        ErrorResponse.of(ErrorCode.FORBIDDEN, "forbidden", Map.of()));
                }))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

- [ ] **Step 6: Write `TestJwtFactory` helper**

`backend/src/test/java/app/pickhouse/support/TestJwtFactory.java`:
```java
package app.pickhouse.support;

import app.pickhouse.security.JwtIssuer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TestJwtFactory {

    @Autowired JwtIssuer issuer;

    public String access(UUID userId) {
        return issuer.issueAccessToken(userId, "test@example.com");
    }

    public String bearer(UUID userId) {
        return "Bearer " + access(userId);
    }
}
```

- [ ] **Step 7: Add Spring Boot actuator dependency**

Add to `backend/build.gradle.kts` dependencies:
```kotlin
    implementation("org.springframework.boot:spring-boot-starter-actuator")
```

Add to `application.yml`:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      probes:
        enabled: true
```

- [ ] **Step 8: Write filter test**

`backend/src/test/java/app/pickhouse/security/JwtAuthFilterTest.java`:
```java
package app.pickhouse.security;

import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class JwtAuthFilterTest extends IntegrationTestBase {

    @Autowired MockMvc mvc;

    @Test
    void health_is_public() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void rejects_missing_token_on_protected_endpoint() throws Exception {
        mvc.perform(get("/houses")).andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 9: Run filter test**

Run: `./gradlew test --tests app.pickhouse.security.JwtAuthFilterTest`
Expected: PASS for `health_is_public`. `rejects_missing_token_on_protected_endpoint` will pass as 401 (Spring Security returns 401 even when controller doesn't exist, because security runs first).

- [ ] **Step 10: Commit**

```bash
git add backend/src/main/java/app/pickhouse/security backend/src/test/java/app/pickhouse/security/JwtAuthFilterTest.java backend/src/test/java/app/pickhouse/support/TestJwtFactory.java backend/build.gradle.kts backend/src/main/resources/application.yml
git commit -m "feat(security): JWT auth filter + security config + @CurrentUserId"
```

---

### Task 18: OAuthVerifiedUser record + OAuthVerifier interface + OAuthProperties

**Files:**
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/OAuthVerifiedUser.java`
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/OAuthVerifier.java`
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/OAuthProperties.java`

- [ ] **Step 1: Write `OAuthVerifiedUser`**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.domain.user.OAuthProvider;

public record OAuthVerifiedUser(
    OAuthProvider provider,
    String providerId,
    String email
) {}
```

- [ ] **Step 2: Write `OAuthVerifier` interface**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.domain.user.OAuthProvider;

public interface OAuthVerifier {
    OAuthProvider provider();
    OAuthVerifiedUser verify(String idToken);
}
```

- [ ] **Step 3: Write `OAuthProperties`**

```java
package app.pickhouse.auth.oauth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.oauth")
public record OAuthProperties(Apple apple, Kakao kakao) {
    public record Apple(String audience, String jwksUrl) {}
    public record Kakao(String jwksUrl, String issuer, String audience) {}
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/pickhouse/auth/oauth
git commit -m "feat(auth): OAuthVerifier interface + properties"
```

---

### Task 19: AppleJwksClient + AppleIdTokenVerifier

**Files:**
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/AppleJwksClient.java`
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/AppleIdTokenVerifier.java`
- Create: `backend/src/test/java/app/pickhouse/auth/oauth/AppleIdTokenVerifierTest.java`

- [ ] **Step 1: Write `AppleJwksClient`**

```java
package app.pickhouse.auth.oauth;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class AppleJwksClient {

    private final OAuthProperties props;
    private volatile JwkProvider provider;

    public Jwk get(String kid) throws Exception {
        return cached().get(kid);
    }

    private JwkProvider cached() throws Exception {
        JwkProvider p = provider;
        if (p == null) {
            synchronized (this) {
                p = provider;
                if (p == null) {
                    p = new JwkProviderBuilder(new URL(props.apple().jwksUrl()))
                        .cached(10, 24, TimeUnit.HOURS)
                        .rateLimited(10, 1, TimeUnit.MINUTES)
                        .build();
                    provider = p;
                }
            }
        }
        return p;
    }
}
```

- [ ] **Step 2: Write `AppleIdTokenVerifier`**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.user.OAuthProvider;
import com.auth0.jwk.Jwk;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.interfaces.RSAPublicKey;

@Component
@RequiredArgsConstructor
public class AppleIdTokenVerifier implements OAuthVerifier {

    private static final String APPLE_ISSUER = "https://appleid.apple.com";

    private final AppleJwksClient jwks;
    private final OAuthProperties props;

    @Override public OAuthProvider provider() { return OAuthProvider.APPLE; }

    @Override
    public OAuthVerifiedUser verify(String idToken) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            String kid = unverified.getKeyId();
            Jwk key = jwks.get(kid);
            RSAPublicKey publicKey = (RSAPublicKey) key.getPublicKey();
            DecodedJWT decoded = JWT.require(Algorithm.RSA256(publicKey, null))
                .withIssuer(APPLE_ISSUER)
                .withAudience(props.apple().audience())
                .build()
                .verify(idToken);
            String sub = decoded.getSubject();
            String email = decoded.getClaim("email").asString();
            return new OAuthVerifiedUser(OAuthProvider.APPLE, sub, email);
        } catch (Exception ex) {
            throw new ApiException(ErrorCode.OAUTH_VERIFICATION_FAILED,
                "Apple ID token invalid: " + ex.getMessage());
        }
    }
}
```

- [ ] **Step 3: Write test using MockWebServer + locally generated RSA key pair**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AppleIdTokenVerifierTest {

    private MockWebServer server;
    private KeyPair keyPair;
    private OAuthProperties props;
    private AppleIdTokenVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        server = new MockWebServer();
        server.start();
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        keyPair = gen.generateKeyPair();

        String n = Base64.getUrlEncoder().withoutPadding().encodeToString(
            ((RSAPublicKey) keyPair.getPublic()).getModulus().toByteArray());
        String e = Base64.getUrlEncoder().withoutPadding().encodeToString(
            ((RSAPublicKey) keyPair.getPublic()).getPublicExponent().toByteArray());
        String jwks = "{\"keys\":[{\"kty\":\"RSA\",\"kid\":\"k1\",\"use\":\"sig\",\"alg\":\"RS256\",\"n\":\""
            + n + "\",\"e\":\"" + e + "\"}]}";
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));

        props = new OAuthProperties(
            new OAuthProperties.Apple("app.pickhouse.ios", server.url("/keys").toString()),
            new OAuthProperties.Kakao("", "", ""));
        verifier = new AppleIdTokenVerifier(new AppleJwksClient(props), props);
    }

    @AfterEach
    void tearDown() throws Exception { server.shutdown(); }

    @Test
    void verifies_valid_apple_id_token() {
        String token = JWT.create()
            .withIssuer("https://appleid.apple.com")
            .withAudience("app.pickhouse.ios")
            .withSubject("apple-user-123")
            .withClaim("email", "u@apple.com")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("k1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));

        OAuthVerifiedUser u = verifier.verify(token);
        assertThat(u.providerId()).isEqualTo("apple-user-123");
        assertThat(u.email()).isEqualTo("u@apple.com");
    }

    @Test
    void rejects_wrong_audience() {
        String token = JWT.create()
            .withIssuer("https://appleid.apple.com")
            .withAudience("app.someoneelse")
            .withSubject("apple-user-123")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("k1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));
        assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(ApiException.class);
    }
}
```

- [ ] **Step 4: Run, expect pass**

Run: `./gradlew test --tests app.pickhouse.auth.oauth.AppleIdTokenVerifierTest`
Expected: PASS for both cases.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/auth/oauth/AppleJwksClient.java backend/src/main/java/app/pickhouse/auth/oauth/AppleIdTokenVerifier.java backend/src/test/java/app/pickhouse/auth/oauth/AppleIdTokenVerifierTest.java
git commit -m "feat(auth): Apple ID token verifier with JWKS"
```

---

### Task 20: KakaoApiClient + KakaoIdTokenVerifier

Kakao supports OIDC; their ID token is a JWT signed via JWKS at `kauth.kakao.com/.well-known/jwks.json`. Verify same way as Apple.

**Files:**
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/KakaoApiClient.java`
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/KakaoIdTokenVerifier.java`
- Create: `backend/src/test/java/app/pickhouse/auth/oauth/KakaoIdTokenVerifierTest.java`

- [ ] **Step 1: Write `KakaoApiClient`**

```java
package app.pickhouse.auth.oauth;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class KakaoApiClient {

    private final OAuthProperties props;
    private volatile JwkProvider provider;

    public Jwk getKey(String kid) throws Exception {
        JwkProvider p = provider;
        if (p == null) {
            synchronized (this) {
                p = provider;
                if (p == null) {
                    p = new JwkProviderBuilder(new URL(props.kakao().jwksUrl()))
                        .cached(10, 24, TimeUnit.HOURS)
                        .rateLimited(10, 1, TimeUnit.MINUTES)
                        .build();
                    provider = p;
                }
            }
        }
        return p.get(kid);
    }
}
```

- [ ] **Step 2: Write `KakaoIdTokenVerifier`**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.user.OAuthProvider;
import com.auth0.jwk.Jwk;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.interfaces.RSAPublicKey;

@Component
@RequiredArgsConstructor
public class KakaoIdTokenVerifier implements OAuthVerifier {

    private final KakaoApiClient kakao;
    private final OAuthProperties props;

    @Override public OAuthProvider provider() { return OAuthProvider.KAKAO; }

    @Override
    public OAuthVerifiedUser verify(String idToken) {
        try {
            DecodedJWT unverified = JWT.decode(idToken);
            Jwk key = kakao.getKey(unverified.getKeyId());
            RSAPublicKey pub = (RSAPublicKey) key.getPublicKey();
            DecodedJWT decoded = JWT.require(Algorithm.RSA256(pub, null))
                .withIssuer(props.kakao().issuer())
                .withAudience(props.kakao().audience())
                .build()
                .verify(idToken);
            String sub = decoded.getSubject();
            String email = decoded.getClaim("email").asString();
            return new OAuthVerifiedUser(OAuthProvider.KAKAO, sub, email);
        } catch (Exception ex) {
            throw new ApiException(ErrorCode.OAUTH_VERIFICATION_FAILED,
                "Kakao ID token invalid: " + ex.getMessage());
        }
    }
}
```

- [ ] **Step 3: Write `KakaoIdTokenVerifierTest`**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KakaoIdTokenVerifierTest {

    private MockWebServer server;
    private KeyPair keyPair;
    private OAuthProperties props;
    private KakaoIdTokenVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        server = new MockWebServer();
        server.start();
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        keyPair = gen.generateKeyPair();
        String n = Base64.getUrlEncoder().withoutPadding().encodeToString(
            ((RSAPublicKey) keyPair.getPublic()).getModulus().toByteArray());
        String e = Base64.getUrlEncoder().withoutPadding().encodeToString(
            ((RSAPublicKey) keyPair.getPublic()).getPublicExponent().toByteArray());
        String jwks = "{\"keys\":[{\"kty\":\"RSA\",\"kid\":\"kk1\",\"alg\":\"RS256\",\"n\":\""
            + n + "\",\"e\":\"" + e + "\"}]}";
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));
        server.enqueue(new MockResponse().setBody(jwks).setHeader("Content-Type", "application/json"));

        props = new OAuthProperties(
            new OAuthProperties.Apple("", ""),
            new OAuthProperties.Kakao(server.url("/jwks").toString(), "https://kauth.kakao.com", "kakao-app-key"));
        verifier = new KakaoIdTokenVerifier(new KakaoApiClient(props), props);
    }

    @AfterEach
    void tearDown() throws Exception { server.shutdown(); }

    @Test
    void verifies_valid_kakao_token() {
        String token = JWT.create()
            .withIssuer("https://kauth.kakao.com")
            .withAudience("kakao-app-key")
            .withSubject("12345")
            .withClaim("email", "u@kakao.com")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("kk1")
            .sign(Algorithm.RSA256((RSAPublicKey) keyPair.getPublic(), (RSAPrivateKey) keyPair.getPrivate()));

        OAuthVerifiedUser u = verifier.verify(token);
        assertThat(u.providerId()).isEqualTo("12345");
        assertThat(u.email()).isEqualTo("u@kakao.com");
    }

    @Test
    void rejects_invalid_signature() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair other = gen.generateKeyPair();
        String token = JWT.create()
            .withIssuer("https://kauth.kakao.com")
            .withAudience("kakao-app-key")
            .withSubject("12345")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(Instant.now().plusSeconds(300)))
            .withKeyId("kk1")
            .sign(Algorithm.RSA256((RSAPublicKey) other.getPublic(), (RSAPrivateKey) other.getPrivate()));
        assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(ApiException.class);
    }
}
```

- [ ] **Step 4: Run**

Run: `./gradlew test --tests app.pickhouse.auth.oauth.KakaoIdTokenVerifierTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/auth/oauth/KakaoApiClient.java backend/src/main/java/app/pickhouse/auth/oauth/KakaoIdTokenVerifier.java backend/src/test/java/app/pickhouse/auth/oauth/KakaoIdTokenVerifierTest.java
git commit -m "feat(auth): Kakao ID token verifier (OIDC)"
```

---

### Task 21: OAuthVerifierResolver

**Files:**
- Create: `backend/src/main/java/app/pickhouse/auth/oauth/OAuthVerifierResolver.java`
- Create: `backend/src/test/java/app/pickhouse/auth/oauth/OAuthVerifierResolverTest.java`

- [ ] **Step 1: Failing test**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.domain.user.OAuthProvider;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OAuthVerifierResolverTest {

    @Test
    void resolves_by_provider() {
        OAuthVerifier apple = mock(OAuthVerifier.class);
        when(apple.provider()).thenReturn(OAuthProvider.APPLE);
        OAuthVerifier kakao = mock(OAuthVerifier.class);
        when(kakao.provider()).thenReturn(OAuthProvider.KAKAO);
        OAuthVerifierResolver resolver = new OAuthVerifierResolver(List.of(apple, kakao));
        assertThat(resolver.forProvider(OAuthProvider.APPLE)).isSameAs(apple);
        assertThat(resolver.forProvider(OAuthProvider.KAKAO)).isSameAs(kakao);
    }

    @Test
    void throws_when_provider_missing() {
        OAuthVerifierResolver resolver = new OAuthVerifierResolver(List.of());
        assertThatThrownBy(() -> resolver.forProvider(OAuthProvider.APPLE))
            .isInstanceOf(ApiException.class);
    }
}
```

- [ ] **Step 2: Run, fail**

Run: `./gradlew test --tests app.pickhouse.auth.oauth.OAuthVerifierResolverTest`
Expected: FAIL.

- [ ] **Step 3: Implement**

```java
package app.pickhouse.auth.oauth;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.user.OAuthProvider;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class OAuthVerifierResolver {

    private final Map<OAuthProvider, OAuthVerifier> map;

    public OAuthVerifierResolver(List<OAuthVerifier> verifiers) {
        this.map = verifiers.stream().collect(Collectors.toMap(OAuthVerifier::provider, Function.identity()));
    }

    public OAuthVerifier forProvider(OAuthProvider provider) {
        OAuthVerifier v = map.get(provider);
        if (v == null) throw new ApiException(ErrorCode.BAD_REQUEST, "unsupported provider: " + provider);
        return v;
    }
}
```

- [ ] **Step 4: Run, pass; commit**

```bash
./gradlew test --tests app.pickhouse.auth.oauth.OAuthVerifierResolverTest
git add backend/src/main/java/app/pickhouse/auth/oauth/OAuthVerifierResolver.java backend/src/test/java/app/pickhouse/auth/oauth/OAuthVerifierResolverTest.java
git commit -m "feat(auth): OAuthVerifierResolver"
```

---

### Task 22: Auth DTOs

**Files:**
- Create: `backend/src/main/java/app/pickhouse/auth/dto/LoginRequest.java`
- Create: `backend/src/main/java/app/pickhouse/auth/dto/LoginResponse.java`
- Create: `backend/src/main/java/app/pickhouse/auth/dto/RefreshRequest.java`
- Create: `backend/src/main/java/app/pickhouse/auth/dto/TokenPair.java`
- Create: `backend/src/main/java/app/pickhouse/auth/dto/UserDto.java`

- [ ] **Step 1: LoginRequest**

```java
package app.pickhouse.auth.dto;

import app.pickhouse.domain.user.OAuthProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LoginRequest(
    @NotNull OAuthProvider provider,
    @NotBlank String idToken,
    String nickname
) {}
```

- [ ] **Step 2: UserDto**

```java
package app.pickhouse.auth.dto;

import app.pickhouse.domain.user.User;

import java.time.Instant;
import java.util.UUID;

public record UserDto(UUID id, String email, String nickname, String avatarUrl, Instant createdAt) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getEmail(), u.getNickname(), u.getAvatarUrl(), u.getCreatedAt());
    }
}
```

- [ ] **Step 3: TokenPair**

```java
package app.pickhouse.auth.dto;

public record TokenPair(String accessToken, String refreshToken) {}
```

- [ ] **Step 4: LoginResponse**

```java
package app.pickhouse.auth.dto;

public record LoginResponse(String accessToken, String refreshToken, UserDto user) {}
```

- [ ] **Step 5: RefreshRequest**

```java
package app.pickhouse.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(@NotBlank String refreshToken) {}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/app/pickhouse/auth/dto
git commit -m "feat(auth): auth DTOs"
```

---

### Task 23: AuthService — login + refresh

**Files:**
- Create: `backend/src/main/java/app/pickhouse/auth/AuthService.java`
- Create: `backend/src/test/java/app/pickhouse/auth/AuthServiceTest.java`

- [ ] **Step 1: Write failing test**

```java
package app.pickhouse.auth;

import app.pickhouse.auth.dto.LoginRequest;
import app.pickhouse.auth.dto.LoginResponse;
import app.pickhouse.auth.oauth.OAuthVerifiedUser;
import app.pickhouse.auth.oauth.OAuthVerifier;
import app.pickhouse.auth.oauth.OAuthVerifierResolver;
import app.pickhouse.domain.auth.RefreshTokenRepository;
import app.pickhouse.domain.user.OAuthIdentityRepository;
import app.pickhouse.domain.user.OAuthProvider;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthServiceTest extends IntegrationTestBase {

    @Autowired AuthService authService;
    @Autowired UserRepository users;
    @Autowired OAuthIdentityRepository identities;
    @Autowired RefreshTokenRepository refreshTokens;

    @MockBean OAuthVerifierResolver resolver;

    @BeforeEach
    void seedVerifier() {
        OAuthVerifier kakao = org.mockito.Mockito.mock(OAuthVerifier.class);
        when(kakao.provider()).thenReturn(OAuthProvider.KAKAO);
        when(kakao.verify(any())).thenReturn(new OAuthVerifiedUser(OAuthProvider.KAKAO, "k-1", "u@kakao.com"));
        when(resolver.forProvider(OAuthProvider.KAKAO)).thenReturn(kakao);
    }

    @Test
    void creates_new_user_on_first_login() {
        LoginResponse resp = authService.login(new LoginRequest(OAuthProvider.KAKAO, "ID_TOKEN", "alice"));
        assertThat(resp.accessToken()).isNotBlank();
        assertThat(resp.refreshToken()).isNotBlank();
        assertThat(resp.user().nickname()).isEqualTo("alice");
        assertThat(identities.findByProviderAndProviderId(OAuthProvider.KAKAO, "k-1")).isPresent();
    }

    @Test
    void links_existing_oauth_identity() {
        LoginResponse first = authService.login(new LoginRequest(OAuthProvider.KAKAO, "T1", "bob"));
        LoginResponse second = authService.login(new LoginRequest(OAuthProvider.KAKAO, "T2", null));
        assertThat(second.user().id()).isEqualTo(first.user().id());
    }
}
```

- [ ] **Step 2: Run, fail**

Run: `./gradlew test --tests app.pickhouse.auth.AuthServiceTest`
Expected: FAIL.

- [ ] **Step 3: Implement `AuthService`**

```java
package app.pickhouse.auth;

import app.pickhouse.auth.dto.*;
import app.pickhouse.auth.oauth.OAuthVerifiedUser;
import app.pickhouse.auth.oauth.OAuthVerifierResolver;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.auth.RefreshToken;
import app.pickhouse.domain.auth.RefreshTokenRepository;
import app.pickhouse.domain.user.*;
import app.pickhouse.security.JwtIssuer;
import app.pickhouse.security.JwtProperties;
import app.pickhouse.security.JwtVerifier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final OAuthVerifierResolver resolver;
    private final UserRepository users;
    private final OAuthIdentityRepository identities;
    private final RefreshTokenRepository refreshTokens;
    private final JwtIssuer issuer;
    private final JwtVerifier verifier;
    private final JwtProperties jwtProps;

    @Transactional
    public LoginResponse login(LoginRequest req) {
        OAuthVerifiedUser v = resolver.forProvider(req.provider()).verify(req.idToken());

        User user = identities.findByProviderAndProviderId(v.provider(), v.providerId())
            .map(id -> users.findById(id.getUserId()).orElseThrow(
                () -> new ApiException(ErrorCode.INTERNAL_ERROR, "user missing for oauth identity")))
            .orElseGet(() -> createUser(v, req.nickname()));

        TokenPair pair = issueTokens(user);
        return new LoginResponse(pair.accessToken(), pair.refreshToken(), UserDto.from(user));
    }

    private User createUser(OAuthVerifiedUser v, String nickname) {
        Instant now = Instant.now();
        User u = User.builder()
            .id(UUID.randomUUID())
            .email(v.email())
            .nickname(nickname)
            .createdAt(now)
            .updatedAt(now)
            .build();
        users.save(u);
        identities.save(OAuthIdentity.builder()
            .id(UUID.randomUUID())
            .userId(u.getId())
            .provider(v.provider())
            .providerId(v.providerId())
            .createdAt(now)
            .build());
        return u;
    }

    @Transactional
    public TokenPair refresh(RefreshRequest req) {
        JwtVerifier.VerifiedClaims claims = verifier.verifyRefresh(req.refreshToken());
        UUID jti = claims.jti();
        RefreshToken stored = refreshTokens.findByJti(jti)
            .orElseThrow(() -> new ApiException(ErrorCode.INVALID_TOKEN, "refresh token unknown"));
        if (stored.isRevoked()) {
            refreshTokens.revokeAllForUser(stored.getUserId());
            throw new ApiException(ErrorCode.INVALID_TOKEN, "refresh token reused");
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(ErrorCode.INVALID_TOKEN, "refresh token expired");
        }
        stored.revoke();
        User user = users.findById(stored.getUserId())
            .orElseThrow(() -> new ApiException(ErrorCode.INVALID_TOKEN, "user missing"));
        return issueTokens(user);
    }

    private TokenPair issueTokens(User user) {
        String access = issuer.issueAccessToken(user.getId(), user.getEmail());
        UUID jti = UUID.randomUUID();
        String refresh = issuer.issueRefreshToken(user.getId(), jti);
        Instant now = Instant.now();
        refreshTokens.save(RefreshToken.builder()
            .id(UUID.randomUUID())
            .userId(user.getId())
            .jti(jti)
            .expiresAt(now.plus(Duration.ofSeconds(jwtProps.refreshTokenTtlSeconds())))
            .revoked(false)
            .createdAt(now)
            .build());
        return new TokenPair(access, refresh);
    }
}
```

- [ ] **Step 4: Run, pass**

Run: `./gradlew test --tests app.pickhouse.auth.AuthServiceTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/auth/AuthService.java backend/src/test/java/app/pickhouse/auth/AuthServiceTest.java
git commit -m "feat(auth): AuthService login + refresh with token rotation"
```

---

### Task 24: AuthController — POST /auth/login and /auth/refresh

**Files:**
- Create: `backend/src/main/java/app/pickhouse/auth/AuthController.java`
- Create: `backend/src/test/java/app/pickhouse/auth/AuthControllerTest.java`

- [ ] **Step 1: Write failing controller test**

```java
package app.pickhouse.auth;

import app.pickhouse.auth.oauth.OAuthVerifiedUser;
import app.pickhouse.auth.oauth.OAuthVerifier;
import app.pickhouse.auth.oauth.OAuthVerifierResolver;
import app.pickhouse.domain.user.OAuthProvider;
import app.pickhouse.support.IntegrationTestBase;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class AuthControllerTest extends IntegrationTestBase {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @MockBean OAuthVerifierResolver resolver;

    @BeforeEach
    void seed() {
        OAuthVerifier v = mock(OAuthVerifier.class);
        when(v.provider()).thenReturn(OAuthProvider.KAKAO);
        when(v.verify(any())).thenReturn(new OAuthVerifiedUser(OAuthProvider.KAKAO, "k-99", "x@k.com"));
        when(resolver.forProvider(OAuthProvider.KAKAO)).thenReturn(v);
    }

    @Test
    void login_returns_token_pair() throws Exception {
        String body = """
            {"provider":"KAKAO","idToken":"abc","nickname":"alice"}
            """;
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isString())
            .andExpect(jsonPath("$.refreshToken").isString())
            .andExpect(jsonPath("$.user.nickname").value("alice"));
    }

    @Test
    void login_validates_request() throws Exception {
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }
}
```

- [ ] **Step 2: Run, fail**

Run: `./gradlew test --tests app.pickhouse.auth.AuthControllerTest`
Expected: FAIL.

- [ ] **Step 3: Write `AuthController`**

```java
package app.pickhouse.auth;

import app.pickhouse.auth.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/refresh")
    public TokenPair refresh(@Valid @RequestBody RefreshRequest req) {
        return authService.refresh(req);
    }
}
```

- [ ] **Step 4: Run, pass**

Run: `./gradlew test --tests app.pickhouse.auth.AuthControllerTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/auth/AuthController.java backend/src/test/java/app/pickhouse/auth/AuthControllerTest.java
git commit -m "feat(auth): AuthController /login + /refresh"
```

---

### Task 25: UserService + DELETE /me (soft delete with grace period)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/user/AccountProperties.java`
- Create: `backend/src/main/java/app/pickhouse/user/UserService.java`
- Create: `backend/src/main/java/app/pickhouse/user/UserController.java`
- Create: `backend/src/test/java/app/pickhouse/user/UserControllerTest.java`

- [ ] **Step 1: Write failing controller test**

```java
package app.pickhouse.user;

import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import app.pickhouse.support.TestJwtFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class UserControllerTest extends IntegrationTestBase {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired TestJwtFactory jwt;

    @Test
    void delete_me_soft_deletes_user() throws Exception {
        Instant now = Instant.now();
        UUID id = UUID.randomUUID();
        users.save(User.builder().id(id).createdAt(now).updatedAt(now).build());

        mvc.perform(delete("/me").header("Authorization", jwt.bearer(id)))
            .andExpect(status().isNoContent());

        User after = users.findById(id).orElseThrow();
        assertThat(after.getDeletedAt()).isNotNull();
        assertThat(after.getPurgeAfter()).isNotNull();
    }

    @Test
    void delete_me_requires_auth() throws Exception {
        mvc.perform(delete("/me")).andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: Run, fail**

Run: `./gradlew test --tests app.pickhouse.user.UserControllerTest`
Expected: FAIL.

- [ ] **Step 3: Write `AccountProperties`**

```java
package app.pickhouse.user;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.account")
public record AccountProperties(int gracePeriodDays) {}
```

- [ ] **Step 4: Write `UserService`**

```java
package app.pickhouse.user;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.auth.RefreshTokenRepository;
import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final AccountProperties accountProps;

    @Transactional
    public void softDeleteSelf(UUID userId) {
        User user = users.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "user not found"));
        if (user.getDeletedAt() != null) return;
        Instant now = Instant.now();
        Instant purgeAfter = now.plus(Duration.ofDays(accountProps.gracePeriodDays()));
        user.softDelete(now, purgeAfter);
        refreshTokens.revokeAllForUser(userId);
    }
}
```

- [ ] **Step 5: Write `UserController`**

```java
package app.pickhouse.user;

import app.pickhouse.security.CurrentUserId;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMe(@CurrentUserId UUID userId) {
        userService.softDeleteSelf(userId);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 6: Run, pass**

Run: `./gradlew test --tests app.pickhouse.user.UserControllerTest`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/app/pickhouse/user backend/src/test/java/app/pickhouse/user
git commit -m "feat(user): DELETE /me with soft delete + grace period"
```

---

### Task 26: House DTOs + JSON converter helper

**Files:**
- Create: `backend/src/main/java/app/pickhouse/common/JsonListConverter.java`
- Create: `backend/src/main/java/app/pickhouse/house/dto/HouseDto.java`
- Create: `backend/src/main/java/app/pickhouse/house/dto/CreateHouseRequest.java`
- Create: `backend/src/main/java/app/pickhouse/house/dto/UpdateHouseRequest.java`
- Create: `backend/src/main/java/app/pickhouse/house/dto/PromoteToResidenceRequest.java`

- [ ] **Step 1: Write `JsonListConverter`**

```java
package app.pickhouse.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class JsonListConverter {

    private final ObjectMapper om;

    public String toJson(List<String> list) {
        try {
            return list == null ? null : om.writeValueAsString(list);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    public List<String> fromJson(String json) {
        try {
            return json == null ? null : om.readValue(json, new TypeReference<List<String>>(){});
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
```

- [ ] **Step 2: Write `HouseDto`**

```java
package app.pickhouse.house.dto;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.House;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record HouseDto(
    UUID id,
    String addressRoad,
    String addressJibun,
    BigDecimal latitude,
    BigDecimal longitude,
    DealType dealType,
    int deposit,
    int rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
    LocalDate availableFrom,
    Integer stationDistance,
    Integer rooms,
    Integer bathrooms,
    Boolean hasBalcony,
    Boolean hasElevator,
    Boolean hasParking,
    List<String> options,
    List<String> security,
    String garbage,
    Integer waterPressure,
    Integer sunlight,
    Integer noise,
    Integer insulation,
    Integer ventilation,
    Integer moisture,
    Integer neighborhood,
    Integer firstImpression,
    String memo,
    Instant createdAt,
    Instant updatedAt
) {
    public static HouseDto from(House h, JsonListConverter conv) {
        return new HouseDto(h.getId(), h.getAddressRoad(), h.getAddressJibun(),
            h.getLatitude(), h.getLongitude(), h.getDealType(),
            h.getDeposit(), h.getRent(), h.getMaintenanceFee(),
            h.getArea(), h.getBuiltYear(), h.getFloor(), h.getTotalFloor(),
            h.getAvailableFrom(), h.getStationDistance(),
            h.getRooms(), h.getBathrooms(),
            h.getHasBalcony(), h.getHasElevator(), h.getHasParking(),
            conv.fromJson(h.getOptionsJson()), conv.fromJson(h.getSecurityJson()),
            h.getGarbage(),
            h.getWaterPressure(), h.getSunlight(), h.getNoise(), h.getInsulation(),
            h.getVentilation(), h.getMoisture(), h.getNeighborhood(), h.getFirstImpression(),
            h.getMemo(), h.getCreatedAt(), h.getUpdatedAt());
    }
}
```

- [ ] **Step 3: Write `CreateHouseRequest`**

```java
package app.pickhouse.house.dto;

import app.pickhouse.domain.house.DealType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateHouseRequest(
    String addressRoad,
    String addressJibun,
    BigDecimal latitude,
    BigDecimal longitude,
    @NotNull DealType dealType,
    @Min(0) int deposit,
    @Min(0) int rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
    LocalDate availableFrom,
    Integer stationDistance,
    Integer rooms,
    Integer bathrooms,
    Boolean hasBalcony,
    Boolean hasElevator,
    Boolean hasParking,
    List<String> options,
    List<String> security,
    String garbage,
    @Min(1) @Max(5) Integer waterPressure,
    @Min(1) @Max(5) Integer sunlight,
    @Min(1) @Max(5) Integer noise,
    @Min(1) @Max(5) Integer insulation,
    @Min(1) @Max(5) Integer ventilation,
    @Min(1) @Max(5) Integer moisture,
    @Min(1) @Max(5) Integer neighborhood,
    @Min(1) @Max(5) Integer firstImpression,
    String memo
) {}
```

- [ ] **Step 4: Write `UpdateHouseRequest`**

```java
package app.pickhouse.house.dto;

import app.pickhouse.domain.house.DealType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateHouseRequest(
    String addressRoad,
    String addressJibun,
    BigDecimal latitude,
    BigDecimal longitude,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
    LocalDate availableFrom,
    Integer stationDistance,
    Integer rooms,
    Integer bathrooms,
    Boolean hasBalcony,
    Boolean hasElevator,
    Boolean hasParking,
    List<String> options,
    List<String> security,
    String garbage,
    @Min(1) @Max(5) Integer waterPressure,
    @Min(1) @Max(5) Integer sunlight,
    @Min(1) @Max(5) Integer noise,
    @Min(1) @Max(5) Integer insulation,
    @Min(1) @Max(5) Integer ventilation,
    @Min(1) @Max(5) Integer moisture,
    @Min(1) @Max(5) Integer neighborhood,
    @Min(1) @Max(5) Integer firstImpression,
    String memo
) {}
```

- [ ] **Step 5: Write `PromoteToResidenceRequest`**

```java
package app.pickhouse.house.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PromoteToResidenceRequest(
    @NotNull LocalDate contractStartDate,
    @NotNull LocalDate contractEndDate,
    String landlordMemo,
    Boolean isCurrent,
    Integer meterElectricInitial,
    Integer meterWaterInitial,
    Integer meterGasInitial
) {}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/app/pickhouse/common/JsonListConverter.java backend/src/main/java/app/pickhouse/house/dto
git commit -m "feat(house): DTOs + JSON list converter"
```

---

### Task 27: HouseService + HouseController (list, create, get, patch, delete)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/house/HouseService.java`
- Create: `backend/src/main/java/app/pickhouse/house/HouseController.java`
- Create: `backend/src/test/java/app/pickhouse/house/HouseControllerTest.java`
- Modify: `backend/src/main/java/app/pickhouse/domain/house/House.java` (toBuilder)

- [ ] **Step 1: Write failing controller test**

```java
package app.pickhouse.house;

import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import app.pickhouse.support.TestJwtFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class HouseControllerTest extends IntegrationTestBase {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired UserRepository users;
    @Autowired TestJwtFactory jwt;

    private UUID seedUser() {
        Instant now = Instant.now();
        UUID id = UUID.randomUUID();
        users.save(User.builder().id(id).createdAt(now).updatedAt(now).build());
        return id;
    }

    @Test
    void create_then_get_then_list_then_delete() throws Exception {
        UUID userId = seedUser();
        String body = """
            {"dealType":"JEONSE","deposit":50000,"rent":0,"addressRoad":"서울 강남구"}
            """;

        MvcResult created = mvc.perform(post("/houses")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isString())
            .andExpect(jsonPath("$.dealType").value("JEONSE"))
            .andReturn();
        String id = om.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/houses/" + id).header("Authorization", jwt.bearer(userId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.deposit").value(50000));

        mvc.perform(get("/houses").header("Authorization", jwt.bearer(userId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));

        mvc.perform(delete("/houses/" + id).header("Authorization", jwt.bearer(userId)))
            .andExpect(status().isNoContent());

        mvc.perform(get("/houses").header("Authorization", jwt.bearer(userId)))
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void patch_partial_fields() throws Exception {
        UUID userId = seedUser();
        String body = """
            {"dealType":"WOLSE","deposit":1000,"rent":50}
            """;
        MvcResult created = mvc.perform(post("/houses")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated()).andReturn();
        String id = om.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(patch("/houses/" + id)
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rent\":80,\"memo\":\"good light\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.rent").value(80))
            .andExpect(jsonPath("$.deposit").value(1000))
            .andExpect(jsonPath("$.memo").value("good light"));
    }

    @Test
    void cannot_access_other_users_house() throws Exception {
        UUID owner = seedUser();
        UUID other = seedUser();
        MvcResult created = mvc.perform(post("/houses")
                .header("Authorization", jwt.bearer(owner))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"dealType\":\"JEONSE\",\"deposit\":1,\"rent\":0}"))
            .andExpect(status().isCreated()).andReturn();
        String id = om.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/houses/" + id).header("Authorization", jwt.bearer(other)))
            .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 2: Run, fail**

Run: `./gradlew test --tests app.pickhouse.house.HouseControllerTest`
Expected: FAIL.

- [ ] **Step 3: Update `House` entity — add toBuilder**

In `backend/src/main/java/app/pickhouse/domain/house/House.java`, change:
```java
@Builder
```
to:
```java
@Builder(toBuilder = true)
```

- [ ] **Step 4: Write `HouseService`**

```java
package app.pickhouse.house;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.house.House;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.residence.Residence;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.house.dto.CreateHouseRequest;
import app.pickhouse.house.dto.HouseDto;
import app.pickhouse.house.dto.PromoteToResidenceRequest;
import app.pickhouse.house.dto.UpdateHouseRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HouseService {

    private final HouseRepository houses;
    private final ResidenceRepository residences;
    private final JsonListConverter conv;

    @Transactional(readOnly = true)
    public List<HouseDto> list(UUID userId) {
        return houses.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
            .stream().map(h -> HouseDto.from(h, conv)).toList();
    }

    @Transactional(readOnly = true)
    public HouseDto get(UUID userId, UUID id) {
        return HouseDto.from(findOwned(userId, id), conv);
    }

    @Transactional
    public HouseDto create(UUID userId, CreateHouseRequest req) {
        Instant now = Instant.now();
        House h = House.builder()
            .id(UUID.randomUUID()).userId(userId)
            .addressRoad(req.addressRoad()).addressJibun(req.addressJibun())
            .latitude(req.latitude()).longitude(req.longitude())
            .dealType(req.dealType()).deposit(req.deposit()).rent(req.rent())
            .maintenanceFee(req.maintenanceFee())
            .area(req.area()).builtYear(req.builtYear())
            .floor(req.floor()).totalFloor(req.totalFloor())
            .availableFrom(req.availableFrom()).stationDistance(req.stationDistance())
            .rooms(req.rooms()).bathrooms(req.bathrooms())
            .hasBalcony(req.hasBalcony()).hasElevator(req.hasElevator()).hasParking(req.hasParking())
            .optionsJson(conv.toJson(req.options())).securityJson(conv.toJson(req.security()))
            .garbage(req.garbage())
            .waterPressure(req.waterPressure()).sunlight(req.sunlight())
            .noise(req.noise()).insulation(req.insulation())
            .ventilation(req.ventilation()).moisture(req.moisture())
            .neighborhood(req.neighborhood()).firstImpression(req.firstImpression())
            .memo(req.memo())
            .createdAt(now).updatedAt(now)
            .build();
        houses.save(h);
        return HouseDto.from(h, conv);
    }

    @Transactional
    public HouseDto update(UUID userId, UUID id, UpdateHouseRequest req) {
        House h = findOwned(userId, id);
        Instant now = Instant.now();
        House updated = h.toBuilder()
            .addressRoad(req.addressRoad() != null ? req.addressRoad() : h.getAddressRoad())
            .addressJibun(req.addressJibun() != null ? req.addressJibun() : h.getAddressJibun())
            .latitude(req.latitude() != null ? req.latitude() : h.getLatitude())
            .longitude(req.longitude() != null ? req.longitude() : h.getLongitude())
            .dealType(req.dealType() != null ? req.dealType() : h.getDealType())
            .deposit(req.deposit() != null ? req.deposit() : h.getDeposit())
            .rent(req.rent() != null ? req.rent() : h.getRent())
            .maintenanceFee(req.maintenanceFee() != null ? req.maintenanceFee() : h.getMaintenanceFee())
            .area(req.area() != null ? req.area() : h.getArea())
            .builtYear(req.builtYear() != null ? req.builtYear() : h.getBuiltYear())
            .floor(req.floor() != null ? req.floor() : h.getFloor())
            .totalFloor(req.totalFloor() != null ? req.totalFloor() : h.getTotalFloor())
            .availableFrom(req.availableFrom() != null ? req.availableFrom() : h.getAvailableFrom())
            .stationDistance(req.stationDistance() != null ? req.stationDistance() : h.getStationDistance())
            .rooms(req.rooms() != null ? req.rooms() : h.getRooms())
            .bathrooms(req.bathrooms() != null ? req.bathrooms() : h.getBathrooms())
            .hasBalcony(req.hasBalcony() != null ? req.hasBalcony() : h.getHasBalcony())
            .hasElevator(req.hasElevator() != null ? req.hasElevator() : h.getHasElevator())
            .hasParking(req.hasParking() != null ? req.hasParking() : h.getHasParking())
            .optionsJson(req.options() != null ? conv.toJson(req.options()) : h.getOptionsJson())
            .securityJson(req.security() != null ? conv.toJson(req.security()) : h.getSecurityJson())
            .garbage(req.garbage() != null ? req.garbage() : h.getGarbage())
            .waterPressure(req.waterPressure() != null ? req.waterPressure() : h.getWaterPressure())
            .sunlight(req.sunlight() != null ? req.sunlight() : h.getSunlight())
            .noise(req.noise() != null ? req.noise() : h.getNoise())
            .insulation(req.insulation() != null ? req.insulation() : h.getInsulation())
            .ventilation(req.ventilation() != null ? req.ventilation() : h.getVentilation())
            .moisture(req.moisture() != null ? req.moisture() : h.getMoisture())
            .neighborhood(req.neighborhood() != null ? req.neighborhood() : h.getNeighborhood())
            .firstImpression(req.firstImpression() != null ? req.firstImpression() : h.getFirstImpression())
            .memo(req.memo() != null ? req.memo() : h.getMemo())
            .updatedAt(now)
            .build();
        houses.save(updated);
        return HouseDto.from(updated, conv);
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        House h = findOwned(userId, id);
        h.softDelete(Instant.now());
    }

    @Transactional
    public ResidenceDto promoteToResidence(UUID userId, UUID houseId, PromoteToResidenceRequest req) {
        House h = findOwned(userId, houseId);
        Instant now = Instant.now();
        Residence r = Residence.builder()
            .id(UUID.randomUUID()).userId(userId).sourceHouseId(h.getId())
            .addressRoad(h.getAddressRoad()).addressJibun(h.getAddressJibun())
            .latitude(h.getLatitude()).longitude(h.getLongitude())
            .dealType(h.getDealType()).deposit(h.getDeposit()).rent(h.getRent())
            .maintenanceFee(h.getMaintenanceFee())
            .area(h.getArea()).builtYear(h.getBuiltYear())
            .floor(h.getFloor()).totalFloor(h.getTotalFloor())
            .rooms(h.getRooms()).bathrooms(h.getBathrooms())
            .hasBalcony(h.getHasBalcony()).hasElevator(h.getHasElevator()).hasParking(h.getHasParking())
            .optionsJson(h.getOptionsJson()).securityJson(h.getSecurityJson())
            .garbage(h.getGarbage())
            .waterPressure(h.getWaterPressure()).sunlight(h.getSunlight())
            .noise(h.getNoise()).insulation(h.getInsulation())
            .ventilation(h.getVentilation()).moisture(h.getMoisture())
            .neighborhood(h.getNeighborhood()).firstImpression(h.getFirstImpression())
            .memo(h.getMemo())
            .contractStartDate(req.contractStartDate())
            .contractEndDate(req.contractEndDate())
            .landlordMemo(req.landlordMemo())
            .isCurrent(Boolean.TRUE.equals(req.isCurrent()))
            .meterElectricInitial(req.meterElectricInitial())
            .meterWaterInitial(req.meterWaterInitial())
            .meterGasInitial(req.meterGasInitial())
            .createdAt(now).updatedAt(now)
            .build();
        residences.save(r);
        h.markPromoted(now);
        return ResidenceDto.from(r, conv);
    }

    private House findOwned(UUID userId, UUID id) {
        return houses.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "house not found"));
    }
}
```

- [ ] **Step 5: Write minimal `ResidenceDto` (used by HouseService.promoteToResidence)**

This is needed before tests compile. See Task 28 Step 2 for the full file — for now create it with the same content.

`backend/src/main/java/app/pickhouse/residence/dto/ResidenceDto.java`: see Task 28 step 2 (place it here now).

- [ ] **Step 6: Write `HouseController`**

```java
package app.pickhouse.house;

import app.pickhouse.house.dto.CreateHouseRequest;
import app.pickhouse.house.dto.HouseDto;
import app.pickhouse.house.dto.PromoteToResidenceRequest;
import app.pickhouse.house.dto.UpdateHouseRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.security.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/houses")
@RequiredArgsConstructor
public class HouseController {

    private final HouseService service;

    @GetMapping
    public List<HouseDto> list(@CurrentUserId UUID userId) {
        return service.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HouseDto create(@CurrentUserId UUID userId, @Valid @RequestBody CreateHouseRequest req) {
        return service.create(userId, req);
    }

    @GetMapping("/{id}")
    public HouseDto get(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return service.get(userId, id);
    }

    @PatchMapping("/{id}")
    public HouseDto update(@CurrentUserId UUID userId, @PathVariable UUID id,
                           @Valid @RequestBody UpdateHouseRequest req) {
        return service.update(userId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/promote-to-residence")
    @ResponseStatus(HttpStatus.CREATED)
    public ResidenceDto promote(@CurrentUserId UUID userId, @PathVariable UUID id,
                                @Valid @RequestBody PromoteToResidenceRequest req) {
        return service.promoteToResidence(userId, id, req);
    }
}
```

- [ ] **Step 7: Run, pass**

Run: `./gradlew test --tests app.pickhouse.house.HouseControllerTest`
Expected: PASS for all three test methods.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/app/pickhouse/house backend/src/main/java/app/pickhouse/domain/house/House.java backend/src/main/java/app/pickhouse/residence/dto/ResidenceDto.java backend/src/test/java/app/pickhouse/house/HouseControllerTest.java
git commit -m "feat(house): CRUD + promote endpoint"
```

---

### Task 28: Residence DTOs + ResidenceController (list, create, update) + promote integration test

**Files:**
- Create: `backend/src/main/java/app/pickhouse/residence/dto/ResidenceDto.java` (if not done in Task 27)
- Create: `backend/src/main/java/app/pickhouse/residence/dto/CreateResidenceRequest.java`
- Create: `backend/src/main/java/app/pickhouse/residence/dto/UpdateResidenceRequest.java`
- Create: `backend/src/main/java/app/pickhouse/residence/ResidenceService.java`
- Create: `backend/src/main/java/app/pickhouse/residence/ResidenceController.java`
- Modify: `backend/src/main/java/app/pickhouse/domain/residence/Residence.java` (toBuilder)
- Create: `backend/src/test/java/app/pickhouse/residence/ResidenceControllerTest.java`
- Create: `backend/src/test/java/app/pickhouse/house/HousePromoteTest.java`

- [ ] **Step 1: Update `Residence` entity for toBuilder**

In `backend/src/main/java/app/pickhouse/domain/residence/Residence.java`, change `@Builder` to `@Builder(toBuilder = true)`.

- [ ] **Step 2: Write `ResidenceDto`** (already referenced in Task 27)

```java
package app.pickhouse.residence.dto;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.residence.Residence;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ResidenceDto(
    UUID id,
    UUID sourceHouseId,
    String addressRoad,
    String addressJibun,
    BigDecimal latitude,
    BigDecimal longitude,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
    Integer rooms,
    Integer bathrooms,
    Boolean hasBalcony,
    Boolean hasElevator,
    Boolean hasParking,
    List<String> options,
    List<String> security,
    String garbage,
    Integer waterPressure,
    Integer sunlight,
    Integer noise,
    Integer insulation,
    Integer ventilation,
    Integer moisture,
    Integer neighborhood,
    Integer firstImpression,
    String memo,
    LocalDate contractStartDate,
    LocalDate contractEndDate,
    String landlordMemo,
    boolean isCurrent,
    Integer meterElectricInitial,
    Integer meterWaterInitial,
    Integer meterGasInitial,
    Instant createdAt,
    Instant updatedAt
) {
    public static ResidenceDto from(Residence r, JsonListConverter conv) {
        return new ResidenceDto(r.getId(), r.getSourceHouseId(),
            r.getAddressRoad(), r.getAddressJibun(), r.getLatitude(), r.getLongitude(),
            r.getDealType(), r.getDeposit(), r.getRent(), r.getMaintenanceFee(),
            r.getArea(), r.getBuiltYear(), r.getFloor(), r.getTotalFloor(),
            r.getRooms(), r.getBathrooms(),
            r.getHasBalcony(), r.getHasElevator(), r.getHasParking(),
            conv.fromJson(r.getOptionsJson()), conv.fromJson(r.getSecurityJson()),
            r.getGarbage(),
            r.getWaterPressure(), r.getSunlight(), r.getNoise(), r.getInsulation(),
            r.getVentilation(), r.getMoisture(), r.getNeighborhood(), r.getFirstImpression(),
            r.getMemo(),
            r.getContractStartDate(), r.getContractEndDate(), r.getLandlordMemo(), r.isCurrent(),
            r.getMeterElectricInitial(), r.getMeterWaterInitial(), r.getMeterGasInitial(),
            r.getCreatedAt(), r.getUpdatedAt());
    }
}
```

- [ ] **Step 3: Write `CreateResidenceRequest`**

```java
package app.pickhouse.residence.dto;

import app.pickhouse.domain.house.DealType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateResidenceRequest(
    String addressRoad,
    String addressJibun,
    BigDecimal latitude,
    BigDecimal longitude,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
    Integer rooms,
    Integer bathrooms,
    Boolean hasBalcony,
    Boolean hasElevator,
    Boolean hasParking,
    List<String> options,
    List<String> security,
    String garbage,
    @Min(1) @Max(5) Integer waterPressure,
    @Min(1) @Max(5) Integer sunlight,
    @Min(1) @Max(5) Integer noise,
    @Min(1) @Max(5) Integer insulation,
    @Min(1) @Max(5) Integer ventilation,
    @Min(1) @Max(5) Integer moisture,
    @Min(1) @Max(5) Integer neighborhood,
    @Min(1) @Max(5) Integer firstImpression,
    String memo,
    @NotNull LocalDate contractStartDate,
    @NotNull LocalDate contractEndDate,
    String landlordMemo,
    Boolean isCurrent,
    Integer meterElectricInitial,
    Integer meterWaterInitial,
    Integer meterGasInitial
) {}
```

- [ ] **Step 4: Write `UpdateResidenceRequest`**

```java
package app.pickhouse.residence.dto;

import app.pickhouse.domain.house.DealType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UpdateResidenceRequest(
    String addressRoad,
    String addressJibun,
    BigDecimal latitude,
    BigDecimal longitude,
    DealType dealType,
    Integer deposit,
    Integer rent,
    Integer maintenanceFee,
    BigDecimal area,
    Integer builtYear,
    Integer floor,
    Integer totalFloor,
    Integer rooms,
    Integer bathrooms,
    Boolean hasBalcony,
    Boolean hasElevator,
    Boolean hasParking,
    List<String> options,
    List<String> security,
    String garbage,
    @Min(1) @Max(5) Integer waterPressure,
    @Min(1) @Max(5) Integer sunlight,
    @Min(1) @Max(5) Integer noise,
    @Min(1) @Max(5) Integer insulation,
    @Min(1) @Max(5) Integer ventilation,
    @Min(1) @Max(5) Integer moisture,
    @Min(1) @Max(5) Integer neighborhood,
    @Min(1) @Max(5) Integer firstImpression,
    String memo,
    LocalDate contractStartDate,
    LocalDate contractEndDate,
    String landlordMemo,
    Boolean isCurrent,
    Integer meterElectricInitial,
    Integer meterWaterInitial,
    Integer meterGasInitial
) {}
```

- [ ] **Step 5: Write `ResidenceService`**

```java
package app.pickhouse.residence;

import app.pickhouse.common.JsonListConverter;
import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.residence.Residence;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.residence.dto.CreateResidenceRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.residence.dto.UpdateResidenceRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResidenceService {

    private final ResidenceRepository residences;
    private final JsonListConverter conv;

    @Transactional(readOnly = true)
    public List<ResidenceDto> list(UUID userId) {
        return residences.findByUserIdAndDeletedAtIsNullOrderByContractStartDateDesc(userId)
            .stream().map(r -> ResidenceDto.from(r, conv)).toList();
    }

    @Transactional
    public ResidenceDto create(UUID userId, CreateResidenceRequest req) {
        Instant now = Instant.now();
        Residence r = Residence.builder()
            .id(UUID.randomUUID()).userId(userId)
            .addressRoad(req.addressRoad()).addressJibun(req.addressJibun())
            .latitude(req.latitude()).longitude(req.longitude())
            .dealType(req.dealType()).deposit(req.deposit()).rent(req.rent())
            .maintenanceFee(req.maintenanceFee())
            .area(req.area()).builtYear(req.builtYear())
            .floor(req.floor()).totalFloor(req.totalFloor())
            .rooms(req.rooms()).bathrooms(req.bathrooms())
            .hasBalcony(req.hasBalcony()).hasElevator(req.hasElevator()).hasParking(req.hasParking())
            .optionsJson(conv.toJson(req.options())).securityJson(conv.toJson(req.security()))
            .garbage(req.garbage())
            .waterPressure(req.waterPressure()).sunlight(req.sunlight())
            .noise(req.noise()).insulation(req.insulation())
            .ventilation(req.ventilation()).moisture(req.moisture())
            .neighborhood(req.neighborhood()).firstImpression(req.firstImpression())
            .memo(req.memo())
            .contractStartDate(req.contractStartDate())
            .contractEndDate(req.contractEndDate())
            .landlordMemo(req.landlordMemo())
            .isCurrent(Boolean.TRUE.equals(req.isCurrent()))
            .meterElectricInitial(req.meterElectricInitial())
            .meterWaterInitial(req.meterWaterInitial())
            .meterGasInitial(req.meterGasInitial())
            .createdAt(now).updatedAt(now)
            .build();
        residences.save(r);
        return ResidenceDto.from(r, conv);
    }

    @Transactional
    public ResidenceDto update(UUID userId, UUID id, UpdateResidenceRequest req) {
        Residence r = residences.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "residence not found"));
        Instant now = Instant.now();
        Residence updated = r.toBuilder()
            .addressRoad(req.addressRoad() != null ? req.addressRoad() : r.getAddressRoad())
            .addressJibun(req.addressJibun() != null ? req.addressJibun() : r.getAddressJibun())
            .latitude(req.latitude() != null ? req.latitude() : r.getLatitude())
            .longitude(req.longitude() != null ? req.longitude() : r.getLongitude())
            .dealType(req.dealType() != null ? req.dealType() : r.getDealType())
            .deposit(req.deposit() != null ? req.deposit() : r.getDeposit())
            .rent(req.rent() != null ? req.rent() : r.getRent())
            .maintenanceFee(req.maintenanceFee() != null ? req.maintenanceFee() : r.getMaintenanceFee())
            .area(req.area() != null ? req.area() : r.getArea())
            .builtYear(req.builtYear() != null ? req.builtYear() : r.getBuiltYear())
            .floor(req.floor() != null ? req.floor() : r.getFloor())
            .totalFloor(req.totalFloor() != null ? req.totalFloor() : r.getTotalFloor())
            .rooms(req.rooms() != null ? req.rooms() : r.getRooms())
            .bathrooms(req.bathrooms() != null ? req.bathrooms() : r.getBathrooms())
            .hasBalcony(req.hasBalcony() != null ? req.hasBalcony() : r.getHasBalcony())
            .hasElevator(req.hasElevator() != null ? req.hasElevator() : r.getHasElevator())
            .hasParking(req.hasParking() != null ? req.hasParking() : r.getHasParking())
            .optionsJson(req.options() != null ? conv.toJson(req.options()) : r.getOptionsJson())
            .securityJson(req.security() != null ? conv.toJson(req.security()) : r.getSecurityJson())
            .garbage(req.garbage() != null ? req.garbage() : r.getGarbage())
            .waterPressure(req.waterPressure() != null ? req.waterPressure() : r.getWaterPressure())
            .sunlight(req.sunlight() != null ? req.sunlight() : r.getSunlight())
            .noise(req.noise() != null ? req.noise() : r.getNoise())
            .insulation(req.insulation() != null ? req.insulation() : r.getInsulation())
            .ventilation(req.ventilation() != null ? req.ventilation() : r.getVentilation())
            .moisture(req.moisture() != null ? req.moisture() : r.getMoisture())
            .neighborhood(req.neighborhood() != null ? req.neighborhood() : r.getNeighborhood())
            .firstImpression(req.firstImpression() != null ? req.firstImpression() : r.getFirstImpression())
            .memo(req.memo() != null ? req.memo() : r.getMemo())
            .contractStartDate(req.contractStartDate() != null ? req.contractStartDate() : r.getContractStartDate())
            .contractEndDate(req.contractEndDate() != null ? req.contractEndDate() : r.getContractEndDate())
            .landlordMemo(req.landlordMemo() != null ? req.landlordMemo() : r.getLandlordMemo())
            .isCurrent(req.isCurrent() != null ? req.isCurrent() : r.isCurrent())
            .meterElectricInitial(req.meterElectricInitial() != null ? req.meterElectricInitial() : r.getMeterElectricInitial())
            .meterWaterInitial(req.meterWaterInitial() != null ? req.meterWaterInitial() : r.getMeterWaterInitial())
            .meterGasInitial(req.meterGasInitial() != null ? req.meterGasInitial() : r.getMeterGasInitial())
            .updatedAt(now)
            .build();
        residences.save(updated);
        return ResidenceDto.from(updated, conv);
    }
}
```

- [ ] **Step 6: Write `ResidenceController`**

```java
package app.pickhouse.residence;

import app.pickhouse.residence.dto.CreateResidenceRequest;
import app.pickhouse.residence.dto.ResidenceDto;
import app.pickhouse.residence.dto.UpdateResidenceRequest;
import app.pickhouse.security.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/residences")
@RequiredArgsConstructor
public class ResidenceController {

    private final ResidenceService service;

    @GetMapping
    public List<ResidenceDto> list(@CurrentUserId UUID userId) {
        return service.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResidenceDto create(@CurrentUserId UUID userId, @Valid @RequestBody CreateResidenceRequest req) {
        return service.create(userId, req);
    }

    @PatchMapping("/{id}")
    public ResidenceDto update(@CurrentUserId UUID userId, @PathVariable UUID id,
                               @Valid @RequestBody UpdateResidenceRequest req) {
        return service.update(userId, id, req);
    }
}
```

- [ ] **Step 7: Write `ResidenceControllerTest`**

```java
package app.pickhouse.residence;

import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import app.pickhouse.support.TestJwtFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class ResidenceControllerTest extends IntegrationTestBase {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired UserRepository users;
    @Autowired TestJwtFactory jwt;

    @Test
    void create_then_patch_residence() throws Exception {
        Instant now = Instant.now();
        UUID userId = UUID.randomUUID();
        users.save(User.builder().id(userId).createdAt(now).updatedAt(now).build());

        String body = """
            {"contractStartDate":"2020-01-01","contractEndDate":"2022-01-01",
             "addressRoad":"마포구","dealType":"WOLSE","deposit":500,"rent":40,"isCurrent":false}
            """;
        MvcResult created = mvc.perform(post("/residences")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isString())
            .andReturn();
        String id = om.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(patch("/residences/" + id)
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"landlordMemo\":\"updated\",\"isCurrent\":true}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.landlordMemo").value("updated"))
            .andExpect(jsonPath("$.isCurrent").value(true));
    }
}
```

- [ ] **Step 8: Write `HousePromoteTest` (verifies promote endpoint creates Residence)**

```java
package app.pickhouse.house;

import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import app.pickhouse.support.TestJwtFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class HousePromoteTest extends IntegrationTestBase {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;
    @Autowired UserRepository users;
    @Autowired TestJwtFactory jwt;

    @Test
    void promotes_house_to_residence() throws Exception {
        Instant now = Instant.now();
        UUID userId = UUID.randomUUID();
        users.save(User.builder().id(userId).createdAt(now).updatedAt(now).build());

        MvcResult created = mvc.perform(post("/houses")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"dealType\":\"JEONSE\",\"deposit\":50000,\"rent\":0,\"addressRoad\":\"강남\"}"))
            .andExpect(status().isCreated()).andReturn();
        String houseId = om.readTree(created.getResponse().getContentAsString()).get("id").asText();

        String body = """
            {"contractStartDate":"2026-06-01","contractEndDate":"2028-05-31","landlordMemo":"010-...","isCurrent":true}
            """;
        mvc.perform(post("/houses/" + houseId + "/promote-to-residence")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.contractStartDate").value("2026-06-01"))
            .andExpect(jsonPath("$.isCurrent").value(true))
            .andExpect(jsonPath("$.addressRoad").value("강남"));

        mvc.perform(get("/residences").header("Authorization", jwt.bearer(userId)))
            .andExpect(jsonPath("$.length()").value(1));
    }
}
```

- [ ] **Step 9: Run tests, pass**

Run: `./gradlew test --tests app.pickhouse.residence.ResidenceControllerTest --tests app.pickhouse.house.HousePromoteTest`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/src/main/java/app/pickhouse/residence backend/src/main/java/app/pickhouse/domain/residence/Residence.java backend/src/test/java/app/pickhouse/residence backend/src/test/java/app/pickhouse/house/HousePromoteTest.java
git commit -m "feat(residence): direct create + update + promote integration"
```

---

### Task 29: R2 properties + R2Client (presigned PUT URL)

**Files:**
- Create: `backend/src/main/java/app/pickhouse/photo/R2Properties.java`
- Create: `backend/src/main/java/app/pickhouse/photo/R2Client.java`
- Create: `backend/src/test/java/app/pickhouse/photo/R2ClientTest.java`

- [ ] **Step 1: Write `R2Properties`**

```java
package app.pickhouse.photo;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.r2")
public record R2Properties(
    String endpoint,
    String bucket,
    String accessKey,
    String secretKey,
    String publicBaseUrl,
    long presignTtlSeconds
) {}
```

- [ ] **Step 2: Write `R2Client`**

```java
package app.pickhouse.photo;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class R2Client {

    private final R2Properties props;
    private S3Presigner presigner;

    @PostConstruct
    void init() {
        this.presigner = S3Presigner.builder()
            .region(Region.of("auto"))
            .endpointOverride(URI.create(props.endpoint()))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.accessKey(), props.secretKey())))
            .serviceConfiguration(S3Configuration.builder()
                .pathStyleAccessEnabled(true).build())
            .build();
    }

    public PresignedUpload presignPut(UUID userId, String contentType, String extension) {
        String objectKey = "users/" + userId + "/photos/" + UUID.randomUUID() + "." + sanitizeExt(extension);
        PutObjectRequest putReq = PutObjectRequest.builder()
            .bucket(props.bucket())
            .key(objectKey)
            .contentType(contentType)
            .build();
        PresignedPutObjectRequest presigned = presigner.presignPutObject(PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(props.presignTtlSeconds()))
            .putObjectRequest(putReq)
            .build());
        String publicUrl = props.publicBaseUrl() + "/" + objectKey;
        return new PresignedUpload(presigned.url().toString(), objectKey, publicUrl, props.presignTtlSeconds());
    }

    private String sanitizeExt(String ext) {
        if (ext == null || ext.isBlank()) return "jpg";
        return ext.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }

    public record PresignedUpload(String uploadUrl, String objectKey, String publicUrl, long expiresInSeconds) {}
}
```

- [ ] **Step 3: Write `R2ClientTest`**

```java
package app.pickhouse.photo;

import app.pickhouse.support.IntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class R2ClientTest extends IntegrationTestBase {

    @Autowired R2Client r2;

    @Test
    void presigns_put_url() {
        R2Client.PresignedUpload up = r2.presignPut(UUID.randomUUID(), "image/jpeg", "jpg");
        assertThat(up.uploadUrl()).contains("test-bucket");
        assertThat(up.objectKey()).startsWith("users/");
        assertThat(up.objectKey()).endsWith(".jpg");
        assertThat(up.publicUrl()).startsWith("http://localhost:9999/test-bucket/");
    }
}
```

- [ ] **Step 4: Run, expect pass**

Run: `./gradlew test --tests app.pickhouse.photo.R2ClientTest`
Expected: PASS (presigner just generates a URL).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/pickhouse/photo/R2Client.java backend/src/main/java/app/pickhouse/photo/R2Properties.java backend/src/test/java/app/pickhouse/photo/R2ClientTest.java
git commit -m "feat(photo): R2 presigned PUT URL generator"
```

---

### Task 30: PhotoController — POST /photos/upload-url + POST /photos

**Files:**
- Create: `backend/src/main/java/app/pickhouse/photo/dto/PresignRequest.java`
- Create: `backend/src/main/java/app/pickhouse/photo/dto/PresignResponse.java`
- Create: `backend/src/main/java/app/pickhouse/photo/dto/RegisterPhotoRequest.java`
- Create: `backend/src/main/java/app/pickhouse/photo/dto/PhotoDto.java`
- Create: `backend/src/main/java/app/pickhouse/photo/PhotoService.java`
- Create: `backend/src/main/java/app/pickhouse/photo/PhotoController.java`
- Create: `backend/src/test/java/app/pickhouse/photo/PhotoControllerTest.java`

- [ ] **Step 1: Write DTOs**

`PresignRequest`:
```java
package app.pickhouse.photo.dto;

import jakarta.validation.constraints.NotBlank;

public record PresignRequest(@NotBlank String contentType, String extension) {}
```

`PresignResponse`:
```java
package app.pickhouse.photo.dto;

public record PresignResponse(String uploadUrl, String objectKey, String publicUrl, long expiresInSeconds) {}
```

`RegisterPhotoRequest`:
```java
package app.pickhouse.photo.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.UUID;

public record RegisterPhotoRequest(
    @NotBlank String objectKey,
    @NotBlank String remoteUrl,
    UUID houseId,
    UUID residenceId,
    String contentType,
    Instant takenAt
) {}
```

`PhotoDto`:
```java
package app.pickhouse.photo.dto;

import app.pickhouse.domain.photo.Photo;

import java.time.Instant;
import java.util.UUID;

public record PhotoDto(
    UUID id,
    UUID houseId,
    UUID residenceId,
    String remoteUrl,
    Instant takenAt,
    Instant createdAt
) {
    public static PhotoDto from(Photo p) {
        return new PhotoDto(p.getId(), p.getHouseId(), p.getResidenceId(),
            p.getRemoteUrl(), p.getTakenAt(), p.getCreatedAt());
    }
}
```

- [ ] **Step 2: Write `PhotoService`**

```java
package app.pickhouse.photo;

import app.pickhouse.common.error.ApiException;
import app.pickhouse.common.error.ErrorCode;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.photo.Photo;
import app.pickhouse.domain.photo.PhotoRepository;
import app.pickhouse.domain.residence.ResidenceRepository;
import app.pickhouse.photo.dto.PhotoDto;
import app.pickhouse.photo.dto.PresignRequest;
import app.pickhouse.photo.dto.PresignResponse;
import app.pickhouse.photo.dto.RegisterPhotoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final R2Client r2;
    private final PhotoRepository photos;
    private final HouseRepository houses;
    private final ResidenceRepository residences;

    public PresignResponse presign(UUID userId, PresignRequest req) {
        R2Client.PresignedUpload up = r2.presignPut(userId, req.contentType(), req.extension());
        return new PresignResponse(up.uploadUrl(), up.objectKey(), up.publicUrl(), up.expiresInSeconds());
    }

    @Transactional
    public PhotoDto register(UUID userId, RegisterPhotoRequest req) {
        if ((req.houseId() == null) == (req.residenceId() == null)) {
            throw new ApiException(ErrorCode.BAD_REQUEST, "exactly one of houseId or residenceId required");
        }
        if (req.houseId() != null) {
            houses.findByIdAndUserIdAndDeletedAtIsNull(req.houseId(), userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "house not found"));
        } else {
            residences.findByIdAndUserIdAndDeletedAtIsNull(req.residenceId(), userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "residence not found"));
        }
        Instant now = Instant.now();
        Photo p = Photo.builder()
            .id(UUID.randomUUID()).userId(userId)
            .houseId(req.houseId()).residenceId(req.residenceId())
            .objectKey(req.objectKey()).remoteUrl(req.remoteUrl())
            .contentType(req.contentType()).takenAt(req.takenAt())
            .createdAt(now)
            .build();
        photos.save(p);
        return PhotoDto.from(p);
    }
}
```

- [ ] **Step 3: Write `PhotoController`**

```java
package app.pickhouse.photo;

import app.pickhouse.photo.dto.PhotoDto;
import app.pickhouse.photo.dto.PresignRequest;
import app.pickhouse.photo.dto.PresignResponse;
import app.pickhouse.photo.dto.RegisterPhotoRequest;
import app.pickhouse.security.CurrentUserId;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService service;

    @PostMapping("/upload-url")
    public PresignResponse uploadUrl(@CurrentUserId UUID userId, @Valid @RequestBody PresignRequest req) {
        return service.presign(userId, req);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PhotoDto register(@CurrentUserId UUID userId, @Valid @RequestBody RegisterPhotoRequest req) {
        return service.register(userId, req);
    }
}
```

- [ ] **Step 4: Write `PhotoControllerTest`**

```java
package app.pickhouse.photo;

import app.pickhouse.domain.house.DealType;
import app.pickhouse.domain.house.House;
import app.pickhouse.domain.house.HouseRepository;
import app.pickhouse.domain.user.User;
import app.pickhouse.domain.user.UserRepository;
import app.pickhouse.support.IntegrationTestBase;
import app.pickhouse.support.TestJwtFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class PhotoControllerTest extends IntegrationTestBase {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired HouseRepository houses;
    @Autowired TestJwtFactory jwt;

    @Test
    void presign_returns_upload_url() throws Exception {
        UUID userId = UUID.randomUUID();
        Instant now = Instant.now();
        users.save(User.builder().id(userId).createdAt(now).updatedAt(now).build());

        mvc.perform(post("/photos/upload-url")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"contentType\":\"image/jpeg\",\"extension\":\"jpg\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.uploadUrl").isString())
            .andExpect(jsonPath("$.objectKey").isString())
            .andExpect(jsonPath("$.publicUrl").isString())
            .andExpect(jsonPath("$.expiresInSeconds").value(600));
    }

    @Test
    void register_photo_for_house() throws Exception {
        UUID userId = UUID.randomUUID();
        Instant now = Instant.now();
        users.save(User.builder().id(userId).createdAt(now).updatedAt(now).build());
        UUID houseId = UUID.randomUUID();
        houses.save(House.builder().id(houseId).userId(userId)
            .dealType(DealType.JEONSE).deposit(1).rent(0)
            .createdAt(now).updatedAt(now).build());

        String body = "{\"objectKey\":\"users/x/photos/y.jpg\",\"remoteUrl\":\"https://photos.test/y.jpg\",\"houseId\":\""
            + houseId + "\"}";
        mvc.perform(post("/photos")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isString())
            .andExpect(jsonPath("$.remoteUrl").value("https://photos.test/y.jpg"));
    }

    @Test
    void register_photo_rejects_both_parents_null() throws Exception {
        UUID userId = UUID.randomUUID();
        Instant now = Instant.now();
        users.save(User.builder().id(userId).createdAt(now).updatedAt(now).build());
        mvc.perform(post("/photos")
                .header("Authorization", jwt.bearer(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"objectKey\":\"k\",\"remoteUrl\":\"u\"}"))
            .andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 5: Run, pass**

Run: `./gradlew test --tests app.pickhouse.photo.PhotoControllerTest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/app/pickhouse/photo backend/src/test/java/app/pickhouse/photo/PhotoControllerTest.java
git commit -m "feat(photo): upload-url + register endpoints"
```

---

### Task 31: Full test suite + build jar

- [ ] **Step 1: Run all tests**

Run: `./gradlew test`
Expected: All green.

- [ ] **Step 2: If any test failed, inspect output and fix**

Common issues:
- `@ConfigurationPropertiesScan` not picking up nested packages — verify `@ConfigurationPropertiesScan("app.pickhouse")` in `PickHouseApplication`.
- Lombok not enabled — Gradle annotation processor should handle it; check `compileOnly` + `annotationProcessor` lines in `build.gradle.kts`.
- Testcontainers reuse needs `~/.testcontainers.properties` with `testcontainers.reuse.enable=true` for `withReuse(true)` to actually reuse. Without it tests still pass but each run starts a new container.

- [ ] **Step 3: Build the jar**

Run: `./gradlew bootJar`
Expected: `build/libs/pickhouse-backend-0.0.1-SNAPSHOT.jar` created.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: green test suite" --allow-empty
```

---

### Task 32: Local Docker Compose (MySQL for dev) + local profile

**Files:**
- Create: `backend/docker-compose.yml`
- Create: `backend/src/main/resources/application-local.yml`

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  mysql:
    image: mysql:8.0.39
    container_name: pickhouse-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpw
      MYSQL_DATABASE: pickhouse
      MYSQL_USER: pickhouse
      MYSQL_PASSWORD: pickhouse
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

- [ ] **Step 2: Write `application-local.yml`**

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pickhouse?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: pickhouse
    password: pickhouse
    driver-class-name: com.mysql.cj.jdbc.Driver
```

- [ ] **Step 3: Verify local stack starts**

Run from `backend/`:
```bash
docker compose up -d
./gradlew bootRun
```
In another terminal:
```bash
curl http://localhost:8080/actuator/health
```
Expected: `{"status":"UP"}`. Stop with `Ctrl+C` and `docker compose down`.

- [ ] **Step 4: Commit**

```bash
git add backend/docker-compose.yml backend/src/main/resources/application-local.yml
git commit -m "chore(dev): docker-compose for local MySQL"
```

---

### Task 33: Production Dockerfile

**Files:**
- Create: `backend/Dockerfile`

- [ ] **Step 1: Write multi-stage `Dockerfile`**

```dockerfile
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
COPY src src
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 1000 -g root appuser
COPY --from=build /workspace/build/libs/*.jar /app/app.jar
USER appuser
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
```

- [ ] **Step 2: Verify build**

Run: `cd backend && docker build -t pickhouse-backend:local .`
Expected: image built (~250 MB).

- [ ] **Step 3: Commit**

```bash
git add backend/Dockerfile
git commit -m "chore(deploy): production Dockerfile"
```

---

### Task 34: Production application-prod.yml + docker-compose.prod.yml

**Files:**
- Create: `backend/src/main/resources/application-prod.yml`
- Create: `backend/docker-compose.prod.yml`

- [ ] **Step 1: Write `application-prod.yml`**

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:mysql}:${MYSQL_PORT:3306}/${MYSQL_DB:pickhouse}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: ${MYSQL_USER:pickhouse}
    password: ${MYSQL_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
pickhouse:
  jwt:
    issuer: ${JWT_ISSUER:https://api.pickhouse.app}
    access-token-ttl-seconds: 1800
    refresh-token-ttl-seconds: 2592000
    private-key-path: file:/run/secrets/jwt-private.pem
    public-key-path: file:/run/secrets/jwt-public.pem
  oauth:
    apple:
      audience: ${APPLE_AUDIENCE}
      jwks-url: https://appleid.apple.com/auth/keys
    kakao:
      jwks-url: https://kauth.kakao.com/.well-known/jwks.json
      issuer: https://kauth.kakao.com
      audience: ${KAKAO_REST_API_KEY}
  r2:
    endpoint: ${R2_ENDPOINT}
    bucket: ${R2_BUCKET}
    access-key: ${R2_ACCESS_KEY}
    secret-key: ${R2_SECRET_KEY}
    public-base-url: ${R2_PUBLIC_BASE_URL}
    presign-ttl-seconds: 600
  account:
    grace-period-days: 30
logging:
  level:
    root: INFO
    app.pickhouse: INFO
```

- [ ] **Step 2: Write `docker-compose.prod.yml`**

```yaml
services:
  mysql:
    image: mysql:8.0.39
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DB}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: pickhouse-backend:latest
    restart: always
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      MYSQL_HOST: mysql
      MYSQL_DB: ${MYSQL_DB}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      JWT_ISSUER: ${JWT_ISSUER}
      APPLE_AUDIENCE: ${APPLE_AUDIENCE}
      KAKAO_REST_API_KEY: ${KAKAO_REST_API_KEY}
      R2_ENDPOINT: ${R2_ENDPOINT}
      R2_BUCKET: ${R2_BUCKET}
      R2_ACCESS_KEY: ${R2_ACCESS_KEY}
      R2_SECRET_KEY: ${R2_SECRET_KEY}
      R2_PUBLIC_BASE_URL: ${R2_PUBLIC_BASE_URL}
    secrets:
      - jwt-private.pem
      - jwt-public.pem
    ports:
      - "127.0.0.1:8080:8080"

volumes:
  mysql-data:

secrets:
  jwt-private.pem:
    file: ./secrets/jwt-private.pem
  jwt-public.pem:
    file: ./secrets/jwt-public.pem
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/resources/application-prod.yml backend/docker-compose.prod.yml
git commit -m "chore(deploy): production compose + config"
```

---

### Task 35: Nginx reverse proxy + Let's Encrypt setup scripts

**Files:**
- Create: `backend/deploy/nginx.conf`
- Create: `backend/deploy/setup-server.sh`
- Create: `backend/deploy/deploy.sh`
- Create: `backend/deploy/.env.example`

- [ ] **Step 1: Write `nginx.conf`**

```nginx
server {
    listen 80;
    server_name api.pickhouse.app;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.pickhouse.app;

    ssl_certificate     /etc/letsencrypt/live/api.pickhouse.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pickhouse.app/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
```

- [ ] **Step 2: Write `setup-server.sh`** (Oracle Cloud Ubuntu ARM one-shot)

```bash
#!/usr/bin/env bash
set -euo pipefail

: "${DOMAIN:?DOMAIN env var required, e.g. api.pickhouse.app}"
: "${EMAIL:?EMAIL env var required for Let's Encrypt}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx iptables-persistent

# Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"

# Firewall — UFW + Oracle iptables
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp -m state --state NEW -m tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save || true

# Initial HTTP-only nginx so certbot can solve ACME challenge
sudo tee /etc/nginx/sites-available/pickhouse > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "ok"; }
}
EOF
sudo mkdir -p /var/www/certbot
sudo ln -sf /etc/nginx/sites-available/pickhouse /etc/nginx/sites-enabled/pickhouse
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue cert
sudo certbot --nginx --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN"

# Install full reverse-proxy config
sudo cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/pickhouse
sudo nginx -t && sudo systemctl reload nginx

# Cert auto-renew (systemd timer installed by certbot)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "Server setup complete. Log out and back in for docker group membership to take effect."
```

- [ ] **Step 3: Write `deploy.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./deploy.sh <ssh-host> <git-rev>
HOST="${1:?ssh host required}"
REV="${2:-main}"
REMOTE_DIR="/opt/pickhouse"

ssh "$HOST" "
  set -e
  sudo mkdir -p $REMOTE_DIR
  sudo chown -R \$USER:\$USER $REMOTE_DIR
  if [ ! -d $REMOTE_DIR/repo ]; then
    git clone https://github.com/YOUR_ORG/pickhouse.git $REMOTE_DIR/repo
  fi
  cd $REMOTE_DIR/repo
  git fetch --all
  git checkout $REV
  git pull --ff-only
  cd backend
  docker build -t pickhouse-backend:latest .
  cd $REMOTE_DIR
  if [ ! -f docker-compose.prod.yml ]; then
    cp repo/backend/docker-compose.prod.yml .
  fi
  if [ ! -f .env ]; then
    echo 'Missing .env at $REMOTE_DIR/.env — populate from repo/backend/deploy/.env.example'
    exit 1
  fi
  docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans
  docker image prune -f
"

echo "Deployment to $HOST complete."
```

- [ ] **Step 4: Write `.env.example`**

`backend/deploy/.env.example`:
```bash
MYSQL_ROOT_PASSWORD=changeme-root
MYSQL_DB=pickhouse
MYSQL_USER=pickhouse
MYSQL_PASSWORD=changeme-app
JWT_ISSUER=https://api.pickhouse.app
APPLE_AUDIENCE=app.pickhouse.ios
KAKAO_REST_API_KEY=replace-with-kakao-rest-api-key
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_BUCKET=pickhouse-photos
R2_ACCESS_KEY=replace
R2_SECRET_KEY=replace
R2_PUBLIC_BASE_URL=https://photos.pickhouse.app
```

- [ ] **Step 5: Mark scripts executable**

Run from `backend/deploy/`:
```bash
chmod +x setup-server.sh deploy.sh
```

- [ ] **Step 6: Commit**

```bash
git add backend/deploy
git commit -m "chore(deploy): nginx + setup-server + deploy scripts"
```

---

### Task 36: README for the backend

**Files:**
- Create: `backend/README.md`

- [ ] **Step 1: Write README**

```markdown
# PickHouse Backend

Spring Boot 3 + Java 21 + MySQL 8 + Cloudflare R2.

## Local dev

    docker compose up -d
    ./gradlew bootRun
    curl http://localhost:8080/actuator/health

## Test

    ./gradlew test

Testcontainers will pull `mysql:8.0.39` on first run. Requires Docker daemon.

## Build production image

    docker build -t pickhouse-backend:latest .

## Deploy (Oracle Cloud Ubuntu ARM)

1. Provision Ubuntu 22.04 ARM instance (Oracle Cloud Free Tier).
2. SSH in, run `DOMAIN=api.pickhouse.app EMAIL=you@example.com bash deploy/setup-server.sh`.
3. Copy `deploy/.env.example` to `/opt/pickhouse/.env`, fill in secrets.
4. Generate JWT keypair into `/opt/pickhouse/secrets/jwt-private.pem` + `jwt-public.pem`:
       openssl genrsa -out jwt-private.pem 2048
       openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
5. From your laptop run `./deploy/deploy.sh user@server main`.
```

- [ ] **Step 2: Commit**

```bash
git add backend/README.md
git commit -m "docs(backend): README"
```

---

### Task 37: Final verification

- [ ] **Step 1: Full test suite**

Run: `cd backend && ./gradlew clean test`
Expected: BUILD SUCCESSFUL, all tests pass.

- [ ] **Step 2: Production jar builds**

Run: `./gradlew bootJar`
Expected: jar in `build/libs/`.

- [ ] **Step 3: Docker image builds**

Run: `docker build -t pickhouse-backend:check .`
Expected: image built.

- [ ] **Step 4: Local smoke**

Run:
```bash
docker compose up -d
./gradlew bootRun &
sleep 25
curl -s http://localhost:8080/actuator/health
curl -s -X POST http://localhost:8080/houses -H "Content-Type: application/json" -d '{}'
```
Expected:
- health returns `{"status":"UP"}`
- POST /houses without auth returns 401 with `{"error":{"code":"UNAUTHORIZED",...}}`.

Stop bootRun (kill %1) and `docker compose down`.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: backend foundation complete" --allow-empty
```

---

## Self-Review Notes

### Spec coverage map

| Spec section | Plan task(s) |
|---|---|
| 4.1 House data model | Task 5 (migration) + Task 10 (entity) + Task 26-27 (DTOs/CRUD) |
| 4.2 Residence + direct add | Task 6 (migration) + Task 11 (entity) + Task 27 (promote in HouseService) + Task 28 (direct create + update) |
| 4.3 Photo | Task 7 (migration) + Task 12 (entity) + Task 29-30 (R2 + endpoints) |
| 4.4 User + soft delete + grace period | Task 4 (migration) + Task 8 (entity) + Task 25 (DELETE /me) |
| 6.1-6.3 Apple + Kakao login, JWT RS256, refresh rotation | Tasks 14-24 |
| 7.3 Account deletion | Task 25 (soft delete + token revocation) |
| 8.3 API endpoints | Tasks 24-30 cover every endpoint in spec |
| 8.4 Photo upload flow | Tasks 29-30 (presign + register) |
| 9.2 Backend stack | Task 1 (gradle) + Task 2 (boot) + Task 3 (testcontainers) + Tasks 4-7 (Flyway) |
| 9.3 Infra (Oracle Cloud, MySQL 8, R2, certbot) | Tasks 32-36 |

### Type/method consistency check

- `House.toBuilder()` requires `@Builder(toBuilder=true)` — set in Task 27 Step 3.
- `Residence.toBuilder()` requires same — set in Task 28 Step 1.
- `JwtVerifier.VerifiedClaims` record fields `(userId, type, jti, email)` match all callers in `JwtAuthFilter` and `AuthService.refresh`.
- `OAuthVerifier.verify(String)` signature matches calls in `AuthService.login` and both `*IdTokenVerifier` implementations.
- `R2Client.PresignedUpload(uploadUrl, objectKey, publicUrl, expiresInSeconds)` field order matches `PhotoService.presign` mapping to `PresignResponse`.
- `OAuthProperties(Apple, Kakao)` two-arg constructor used consistently in tests (Tasks 19, 20).
- All controllers use `@CurrentUserId UUID userId` parameter — annotation defined in Task 17.
- Error codes referenced in tests (`BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`, `INVALID_TOKEN`, `OAUTH_VERIFICATION_FAILED`, `INTERNAL_ERROR`, `FORBIDDEN`, `UNPROCESSABLE_ENTITY`, `CONFLICT`) all defined in `ErrorCode` (Task 13).
- `RefreshToken.revoke()` no-arg void method matches `AuthService.refresh` call.
- `User.softDelete(Instant now, Instant purgeAfter)` 2-arg version matches `UserService.softDeleteSelf`.
- `HouseRepository` query methods (`findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc`, `findByIdAndUserIdAndDeletedAtIsNull`) match `HouseService` calls.
- `ResidenceRepository` query methods (`findByUserIdAndDeletedAtIsNullOrderByContractStartDateDesc`, `findByIdAndUserIdAndDeletedAtIsNull`) match `ResidenceService` calls.

### Placeholder scan

- No "TODO" / "fill in" / "add error handling" placeholders.
- Every code step shows complete code.
- Every test step is paired with a "run, see it fail" verification before implementation.
- Every implementation step is paired with a "run, see it pass" verification.
- Frequent commits (one per logical unit).

### Spec items deferred to other plans

- Sections 5.1–5.6 Screens → Plan 2 (mobile)
- Local SQLite cache + offline sync queue → Plan 2 (mobile)
- Terms of service / privacy pages → Plan 5
- Data export (JSON + photo zip) — spec MVP scope (section 10.1) lists 이용약관·개인정보 처리방침 but not export; treated as v2 (section 10.2) and deferred.
- 입주 사진·계약서 사진 special handling — covered by generic Photo endpoint attached to Residence in this plan; mobile UI flow is Plan 2.

### Final note

When this plan is fully executed, the backend exposes the API described in the "API Contract Reference" section at the top of this document. Plans 2-5 (mobile, comparison, profile, polish) consume those contracts.
