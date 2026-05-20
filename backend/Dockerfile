FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
COPY src src
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd -r -g 1001 appuser && useradd -r -u 1001 -g appuser appuser \
    && mkdir -p /var/lib/pickhouse/photos \
    && chown -R appuser:appuser /var/lib/pickhouse
COPY --from=build /workspace/build/libs/*.jar /app/app.jar
USER appuser
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Djava.security.egd=file:/dev/./urandom"
ENV PICKHOUSE_STORAGE_PATH=/var/lib/pickhouse/photos
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
