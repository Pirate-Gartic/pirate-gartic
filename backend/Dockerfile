FROM registry.access.redhat.com/ubi8/openjdk-21:latest
WORKDIR /app
# Copiamos el jar compilado
COPY build/libs/open-gartic-backend-1.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]