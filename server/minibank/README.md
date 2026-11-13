# miniBank backend

Spring Boot 4, Java 21, PostgreSQL 17, Hibernate (JPA), Flyway, Spring Security.

## Running

Database and backend in Docker:

```bash
cd Docker
docker compose up --build
```

Database in Docker, backend from IDE or Maven:

```bash
cd Docker && docker compose up -d postgres
cd ../server/minibank && ./mvnw spring-boot:run
```

Health check: http://localhost:8080/actuator/health

Tests need Docker running (Testcontainers starts its own Postgres):

```bash
./mvnw test
```

## Configuration

Environment variables (defaults in `application.yml`):

| Variable      | Default                                     |
|---------------|---------------------------------------------|
| `DB_URL`      | `jdbc:postgresql://localhost:5432/minibank` |
| `DB_USERNAME` | `minibank`                                  |
| `DB_PASSWORD` | `minibank`                                  |
| `SERVER_PORT` | `8080`                                      |

## Database

- Schema is managed only by Flyway migrations in `src/main/resources/db/migration`.
- Hibernate runs with `ddl-auto: validate`, so entities must match the migrations.
- Every schema change is a new `V<n>__description.sql` file. Don't edit migrations that are already merged.
- Entities extend `BaseEntity` (`id`, `created_at`, `updated_at`).

## Packages

| Package        | Scope                                            | Role |
|----------------|--------------------------------------------------|------|
| `config`       | Spring configuration (security etc.)             | -    |
| `common`       | `BaseEntity`, exception handling                 | -    |
| `user`         | `User` entity and repository                     | 2    |
| `auth`         | Registration, login, JWT                         | 2    |
| `category`     | Categories, rules, categorization engine         | 2    |
| `subscription` | Recurring payment detection                      | 2    |
| `transaction`  | Accounts, transactions, statement parsers        | 1    |
| `currency`     | NBP exchange rates, cache, conversion to PLN     | 1    |
| `group`        | Group expenses, settlement optimization          | 3    |
| `budget`       | Budgets, spending forecast                       | 3    |
