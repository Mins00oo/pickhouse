# PickHouse Plans — Canonical Decisions (Addendum)

> **Read this BEFORE any of the 5 plans.** When plans disagree on a contract or shape, this document is authoritative. The 5 plans were written in parallel and some inconsistencies were detected during cross-review. The substantive ones are listed here so implementers can reconcile without confusion.

**Spec:** `2026-05-19-pickhouse-design.md`
**Plans:** `2026-05-19-pickhouse-01..05`

---

## 1. Enum Values

### `dealType`
```
'JEONSE' | 'WOLSE' | 'BAN_JEONSE'
```
- ✅ Plan 1, 2, 3, 4 — aligned (after fixes)
- Korean labels (`전세`/`월세`/`반전세`) appear ONLY at presentation time via a `formatDealType()` helper. Never stored or transmitted as Korean.

### `authProvider`
```
'apple' | 'kakao'   (lowercase)
```

---

## 2. Project Layout

### Backend
- Root: `pickhouse/backend/`
- Package: `app.pickhouse.*`
- Source: `backend/src/main/java/app/pickhouse/...`
- Test: `backend/src/test/java/app/pickhouse/...`
- Resources: `backend/src/main/resources/`

### Mobile
- Root: `pickhouse/mobile/`
- Source: `pickhouse/mobile/src/...`
- ❌ Do NOT use `app/src/...` (Plan 5 had this in places — fix at implementation if encountered)

---

## 3. User ID Type

**Canonical: `UUID`** (CHAR(36) in MySQL, `java.util.UUID` in Java, `string` in TypeScript)

- Plan 1 entities use `UUID` for `users.id` and FKs.
- ⚠ **Plan 5 test snippets still contain `Long`/`*L` literals** (e.g., `bearerForUser(42L)`, `setUserId(7L)`, `softDelete(42L)`, `findById(anyLong())`). These were not all converted in the consistency pass.
- **At implementation:** wherever Plan 5 shows `*L` or `Long userId`, treat as `UUID`. Service signatures take `UUID`, test JWTs use `UUID.fromString("00000000-0000-0000-0000-...")`, mocks use `any(UUID.class)` not `anyLong()`.

---

## 4. Address Structure (Wire Format)

**Canonical wire shape (JSON on both directions):**

```json
"address": {
  "roadAddress": "서울 마포구 망원로 ●●",
  "jibunAddress": "망원동 ●●●-●",
  "zonecode": "04032",
  "latitude": 37.5566,
  "longitude": 126.9018,
  "detail": "302호"
}
```

- ⚠ **Plan 1 currently shows flat `addressRoad`/`addressJibun` fields** in entity, request DTOs, and JSON examples (~24 occurrences). These were not converted.
- **At implementation:**
  - JPA entity may keep flat columns (`address_road_address`, `address_jibun_address`, `address_zonecode`, `address_latitude`, `address_longitude`, `address_detail`) as `@Embeddable Address` for cleanness, OR keep entity fields flat and nest only at DTO mapping. Either works.
  - **DTO / JSON wire format must be nested** as shown above — this is what Plan 2 (mobile) expects.
  - Plan 4 had a third shape (`{road, lat, lng}`) — also wrong. Use the canonical nested shape with full field names.

Same rule for Residence.address.

---

## 5. House Ratings

**Canonical: FLAT optional fields on `House` (both wire and entity).**

```typescript
interface House {
  // ... base fields
  waterPressure?: number;     // 1-5
  sunlight?: number;
  noise?: number;
  insulation?: number;
  ventilation?: number;
  moisture?: number;
  neighborhood?: number;
  firstImpression?: number;
}
```

- ✅ Plan 1, 3 — already flat
- ⚠ Plan 2 still has `ratings?: StarRatings` (nested object) in some places. At implementation, flatten `House.ratings` into individual optional fields on House.
- The `StarRatings` TYPE may stay as a **form-local helper** for input UI (collecting ratings while editing), but it must be spread into flat fields when persisted or sent over the wire.
- Plan 2 form code that does `Object.keys(house.ratings)` should be replaced with an iteration over a hardcoded list of rating keys.

---

## 6. Residence Model

**Canonical fields (wire DTO from backend; mobile mirrors this):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | ✓ | |
| `userId` | UUID | ✓ (entity only — NOT in DTO; backend filters via JWT) | |
| `name` | string | ✓ | User-friendly nickname like "망원동 자취방" |
| `sourceHouseId` | UUID? | | Set if promoted from a viewed House |
| `address` | Address (nested) | ✓ | See §4 |
| `dealType` | enum | ✓ | See §1 |
| `deposit` | int | ✓ | 만원 |
| `rent` | int? | | 만원 (전세 = 0/null) |
| `maintenanceFee` | int? | | 만원 |
| `area` | float? | | 평 |
| `builtYear` | int? | | |
| `floor` | int? | | |
| `totalFloor` | int? | | |
| `rooms` | int? | | |
| `bathrooms` | int? | | |
| `contractStartDate` | LocalDate (ISO `YYYY-MM-DD`) | ✓ | |
| `contractEndDate` | LocalDate | ✓ | |
| `isCurrent` | boolean | ✓ | Only one residence can be `true` per user; setting forces others to `false` |
| `isFavorite` | boolean | ✓ | Defaults `false` |
| `eraLabel` | string? | | e.g., "사회초년생 시절" (✅ NOT `chapterLabel`) |
| `landlordMemo` | string? | | Free text |
| `memo` | string? | | Free text |
| `moveInPhotoIds` | UUID[] | ✓ (empty allowed) | Separate from regular photos |
| `contractPhotoId` | UUID? | | Single contract photo |
| `meterReadings` | object? | | `{ electricity?: int, water?: int, gas?: int, recordedAt?: LocalDate }` |
| `ratings` | flat fields per §5 | | |
| `createdAt`, `updatedAt`, `deletedAt` | Instant | | |

- ⚠ Plan 1 currently has flat `meterElectricInitial`/`meterWaterInitial`/`meterGasInitial` columns. Wire format is nested as above.
- ✅ `eraLabel` (NOT `chapterLabel`). Plan 2 fixed in this pass.
- Plan 4 stored `moveInPhotos: Photo[]` (denormalized objects). Wire format stores `moveInPhotoIds: UUID[]` only; UI looks up Photo objects from the photos store/repo at render time.

---

## 7. Photo Endpoints (revised 2026-05-20)

> **Storage strategy:** MVP uses local disk on the backend server. Cloudflare R2 / S3 migration is deferred to v2. Plan 1 originally specified R2 presigned URLs but this was changed during execution — see §7.5 for the reason. Plan 2 (mobile) and beyond must follow the contracts below, not the older R2 contracts in the spec document.

### POST `/photos/upload` (direct multipart upload)

**Request (multipart/form-data):**
- `file` (binary, required) — the image bytes
- `?houseId=<uuid>` query param (optional) — if known at upload time
- `?residenceId=<uuid>` query param (optional) — if known at upload time
- `?takenAt=<ISO8601>` query param (optional)

**Constraints:**
- Max file size: 10 MB
- Allowed mime types: `image/jpeg`, `image/png`, `image/webp`
- 400 BAD_REQUEST on violation (single, non-negotiable)
- Both `houseId` and `residenceId` set → 400 BAD_REQUEST

**Response (201 Created):**
```json
{
  "id": "uuid",
  "houseId": "uuid|null",
  "residenceId": "uuid|null",
  "remoteUrl": "https://api.pickhouse.app/files/<photoId>.<ext>",
  "takenAt": "2026-05-19T10:30:00Z|null",
  "createdAt": "2026-05-19T10:30:01Z"
}
```

The server mints `photoId` (UUID), writes the file to `{PICKHOUSE_STORAGE_PATH}/<photoId>.<ext>`, and stores a `Photo` row with `object_key=<photoId>.<ext>` and `remote_url=<base>/files/<photoId>.<ext>`.

### PATCH `/photos/{id}` (link to parent later)

Used when the photo was uploaded with no parent and the parent was created subsequently. Authenticated; only the owning user can call.

**Request:**
```json
{ "houseId": "uuid" }    // OR
{ "residenceId": "uuid" }
```

**Response (200 OK):** updated `PhotoDto` (same shape as upload response).

- Photo's current parent must be `null` (no re-parenting via PATCH); attempts return 409 CONFLICT.
- Setting both fields or neither → 400 BAD_REQUEST.

### Bulk-link via parent create — `POST /houses` and `POST /residences`

When the parent is being created **after** the photos were uploaded (the typical "new entry" flow):

**`POST /houses` request adds:**
```json
{ ...other fields..., "photoIds": ["uuid", "uuid", ...] }
```

Each ID's `Photo.houseId` is set in the same transaction as the new `House`. Photos must currently have no parent and be owned by the same user; otherwise the whole request fails with 400.

**`POST /residences` request** already accepts `moveInPhotoIds: UUID[]` and `contractPhotoId: UUID?` per §6. These behave identically: server sets `Photo.residenceId` for each in the same transaction.

### GET `/files/{filename}` (static serving)

The backend serves uploaded files directly via Spring's resource handler. No auth on the file URL itself (URLs contain unguessable UUIDs and the photo records are queryable only by owners). Future R2/S3 migration replaces this with public-bucket URLs without changing the wire shape — `remoteUrl` stays opaque to clients.

### §7.5 — Why local disk instead of R2 (decided 2026-05-20)

The spec (§9.3) specified Cloudflare R2 from the start. During Plan 1 Task 29 implementation the user opted to defer R2 until a real storage server is provisioned, on the rationale that direct server upload is simpler for MVP and the abstraction (`LocalStorageService` interface) keeps a future R2 swap mechanical. The client-facing wire shape was designed to be storage-backend-agnostic: clients see `remoteUrl` and never construct R2-specific URLs themselves.

What this means for other plans:
- **Plan 2 (mobile):** call `POST /photos/upload` with multipart, not presigned URL PUT. No client-side R2 SDK.
- **Plan 5 (polish):** `HardDeleteService` deletes from local disk, not from R2. `AccountDeletionScheduler` also cleans up orphan photos (parents both null, older than N days).

---

## 8. Auth Flow

### POST `/auth/login`

**Request (canonical — no `nickname`):**
```json
{ "provider": "apple", "idToken": "..." }
```

- ⚠ Plan 1 still shows `nickname` in some examples. **Drop it.** Server defaults nickname to `"닉네임"` on first signup; user edits later via a future endpoint (out of MVP scope).

**Response:**
```json
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "닉네임",
    "createdAt": "..."
  }
}
```

- ⚠ Plan 1 shows `avatarUrl` in UserDto. **Drop avatarUrl** — no upload mechanism in MVP. Server may persist a column for v2 but does not expose it via DTO.

### POST `/auth/refresh`
```json
{ "refreshToken": "jwt..." }
→ { "accessToken": "...", "refreshToken": "..." }
```

### DELETE `/me`
- ✅ Implemented by Plan 1 (Task 25, soft delete with `deleted_at` timestamp).
- ⚠ Plan 5 originally duplicated this. **At implementation: skip Plan 5's Task 12 and Task 14** — Plan 1 already covers them.
- Plan 5 still adds value with: `AccountDeletionScheduler` (cron for hard delete after 30-day grace), `HardDeleteService` (cleanup of houses/residences/photos/R2 objects), and the **restore-on-login hook** in `AuthService.login` (if user logs in within grace period, clear `deleted_at`).

---

## 9. JWT Payload

```json
{
  "sub": "<user-uuid>",
  "iat": ...,
  "exp": ...,
  "type": "access" | "refresh"
}
```

- Signed RS256. Backend issues, mobile passes as `Authorization: Bearer <token>`.
- No additional claims (email, nickname) — fetched via `/me` if needed.

---

## 10. URL Path Prefix

**No `/api/` or `/api/v1/` prefix.** All endpoints live at root:
- `/auth/login`, `/auth/refresh`
- `/houses`, `/houses/{id}`, `/houses/{id}/promote-to-residence`
- `/residences`, `/residences/{id}`
- `/photos/upload-url`, `/photos`
- `/me`, `/me/export`, `/me/export/{jobId}`

---

## 11. Internal Plan 5 Endpoint Comment Correction

Plan 5's file-list comment for the account API says `GET /me/export, GET /me/export-status`. The actual controller code (also in Plan 5) uses `POST /me/export, GET /me/export/{jobId}`. The latter is correct — follow the controller code, ignore the file-list comment.

---

## 11.5. Testing Strategy (Plan 1 divergence — 2026-05-20)

**Plan 1 originally specified Testcontainers-based integration tests for every layer (entities, repositories, controllers, services).** This was abandoned during execution because Docker Desktop's `docker_cli proxy` blocks the `docker-java` library used by Testcontainers, while `docker compose` CLI works fine.

**Current strategy:**
- **Unit tests only at this stage.** Services use Mockito to mock repositories. Controllers use `@WebMvcTest` (slice tests) with `@MockBean` for services. DTOs/validators are tested with pure unit tests. No `@SpringBootTest`.
- **MySQL via `docker-compose up -d`** at `backend/docker-compose.yml` — used for `./gradlew bootRun` (local dev) and any future integration tests.
- **Integration tests added later** when there's a coherent flow worth testing end-to-end. They will connect to the same docker-compose MySQL (user starts it first), not to a Testcontainers-managed one.
- **No `@SpringBootTest` smoke test** (the original Task 2 `contextLoads` was deleted in revised Task 3 — `7c4e346` / `2f79f62`).
- **Migrations (Flyway) have no tests at this stage.** They're plain SQL files validated by Flyway at boot time when `./gradlew bootRun` runs.

**What this means for implementing subsequent Plan 1 tasks:**
- Where the plan says "Run `./gradlew test`" expecting integration test behavior, treat it as a unit-only test run.
- Where the plan defines `IntegrationTestBase` usage, do NOT use it — base on Mockito + `@WebMvcTest` slice tests instead.
- Where the plan defines a `@SpringBootTest` test that requires DB connectivity, refactor to a pure unit test OR delete and add a TODO note for the future integration test layer.

This is intentional MVP-stage simplification. Will be revisited when a real integration test layer is added (target: end of Plan 1, or Plan 2 mobile work tied to backend).

## 12. What's Already Consistent (no action needed)

- Endpoint paths and HTTP methods (verbs match Plan 1 ↔ Plan 2 client calls)
- Auth body: `{ provider, idToken }` matches
- Token field names: `accessToken`, `refreshToken`
- `Authorization: Bearer ...` header
- `isCurrent`, `contractStartDate`, `contractEndDate`, `landlordMemo` field names
- `sourceHouseId`, `promote-to-residence` URL segment
- Provider enum: `apple` / `kakao` (lowercase) consistent
- Photo PUT-presign approach (single URL, no multipart fields)
- 30-day grace period for soft delete
- Backend package after fix: `app.pickhouse.*`
- Mobile root after fix: `pickhouse/mobile/src/...`

---

## TL;DR — Decision Matrix

| Topic | Authoritative shape | Where to be careful |
|---|---|---|
| `dealType` enum | `'JEONSE'\|'WOLSE'\|'BAN_JEONSE'` | ✅ Already aligned |
| User IDs | `UUID` (CHAR(36)) | ⚠ Plan 5 has Long literals — translate |
| Address (wire) | Nested object | ⚠ Plan 1 has flat fields — nest at DTO |
| Meter readings (wire) | Nested object | ⚠ Plan 1 has flat columns — nest at DTO |
| House ratings (wire) | Flat optional fields | ⚠ Plan 2 has nested — flatten |
| `eraLabel` (NOT `chapterLabel`) | Use `eraLabel` | ✅ Aligned |
| `moveInPhotoIds` (NOT `moveInPhotos`) | IDs in DTO | ⚠ Plan 4 has full objects — lookup at render |
| Photo upload | Direct multipart POST /photos/upload (no presign) | ⚠ Plan 1 originally specified R2 presign — see §7 revision 2026-05-20 |
| `nickname` in login req | Removed | ⚠ Plan 1 has it — drop |
| `avatarUrl` in UserDto | Removed | ⚠ Plan 1 has it — drop from DTO |
| Plan 5 DELETE /me / V20 migration | Skip — Plan 1 owns this | ⚠ Plan 5 duplicates — skip |
| Backend layout | `backend/app.pickhouse` | ✅ Fixed |
| Mobile layout | `pickhouse/mobile/` | ✅ Fixed |

If a plan disagrees with this document, **this document wins**.
