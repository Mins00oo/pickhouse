# PickHouse Backend

Spring Boot 3 + Java 21 + MySQL 8. Photo storage: backend local disk
(see `canonical-decisions.md §7` — R2/S3 migration is v2).

## Local dev

```
docker compose up -d              # MySQL on :3306
./gradlew bootRun                  # Backend on :8080
curl http://localhost:8080/actuator/health
```

Uploaded photos go to `./uploads/` (override with `PICKHOUSE_STORAGE_PATH`).
The directory is auto-created on first upload. `./uploads` is in `.gitignore`.

## Test

```
./gradlew test
```

Unit tests only — Mockito for repository mocks, `@WebMvcTest` slice for
controllers. No `@SpringBootTest`, no Testcontainers. MySQL via
`docker compose` is for `bootRun`, not for tests. See
`canonical-decisions.md §11.5` for the rationale.

## Build production image

```
docker build -t pickhouse-backend:latest .
```

Multi-stage build: `temurin:21-jdk` → `bootJar` → `temurin:21-jre` runtime.
Runs as non-root `appuser` (UID 1001). Photo directory
(`/var/lib/pickhouse/photos`) pre-created with correct ownership so a
mounted volume inherits the right permissions on first mount.

## Deploy (Oracle Cloud Ubuntu ARM)

1. Provision Ubuntu 22.04 ARM instance (Oracle Cloud Free Tier).
2. SSH in, run `DOMAIN=api.pickhouse.app EMAIL=you@example.com bash deploy/setup-server.sh`.
3. Copy `deploy/.env.example` to `/opt/pickhouse/.env`, fill in secrets.
4. Generate JWT keypair into `/opt/pickhouse/secrets/jwt-private.pem` + `jwt-public.pem`:
   ```
   openssl genrsa -out jwt-private.pem 2048
   openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
   ```
5. From your laptop run `PICKHOUSE_GIT_URL=https://github.com/YOU/pickhouse.git ./deploy/deploy.sh user@server main`.

Photos persist across container restarts via the `photos-data` named
docker volume mounted at `/var/lib/pickhouse/photos`. To back them up,
`docker run --rm -v pickhouse_photos-data:/data -v $(pwd):/backup ubuntu tar czf /backup/photos.tar.gz -C /data .`
