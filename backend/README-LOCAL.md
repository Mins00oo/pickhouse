# Running PickHouse Backend Locally

## Prerequisites
- Java 21
- Docker (only for the local MySQL container)

## Start local MySQL
```
docker compose up -d
```

This starts MySQL 8.0.39 on `localhost:3306` with:
- Database: `pickhouse`
- User: `pickhouse` / Password: `pickhouse`
- Data persisted in named volume `pickhouse-mysql-data`

## Run the application
```
./gradlew bootRun
```

Spring Boot will auto-select the `local` profile (configured in `application.yml`) and connect to the MySQL container above.

## Stop MySQL
```
docker compose down        # keeps data
docker compose down -v     # also wipes data volume
```

## Tests
```
./gradlew test
```

Currently no tests exist; unit tests will be added as we build out service/controller classes. Integration tests (against a real DB) will arrive later and will also connect to the docker-compose MySQL (start it before running integration tests).
