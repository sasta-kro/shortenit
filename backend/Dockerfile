# Stage 1: Build
FROM maven:3.9.9-amazoncorretto-17 AS build

WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .

# Download dependencies (cached if pom.xml doesn't change)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds)
# This will include all resources (including geoip database) in the JAR
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM amazoncorretto:17-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create necessary directories
RUN mkdir -p /app/logs /app/geoip-data

# Copy the JAR from build stage
# The JAR includes all resources including the GeoIP database
COPY --from=build /app/target/*.jar app.jar

# Optional: Copy GeoIP database separately if you want to update it without rebuilding
# This is useful for monthly database updates
# Uncomment the line below if you plan to use external volume mount
# COPY --from=build /app/src/main/resources/geoip/*.mmdb /app/geoip-data/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider "http://localhost:8080${APP_BASE_PATH}/actuator/health" || exit 1

# Set default profile to dev (can be overridden by environment variable)
ENV SPRING_PROFILES_ACTIVE=dev

ENV TZ=Asia/Bangkok

# Run the application
# The GeoIP database is included in the JAR, so it will be loaded from classpath
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:--Xmx512m -Xms256m} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-dev} -jar app.jar"]
