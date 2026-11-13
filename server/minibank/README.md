# miniBank — backend

Spring Boot 4 · Java 21 · PostgreSQL 17 · Hibernate (JPA) · Flyway · Spring Security

## Uruchomienie

Wszystko w Dockerze (baza + backend):

```bash
cd Docker
docker compose up --build
```

Tylko baza w Dockerze, backend z IDE / Mavena:

```bash
cd Docker && docker compose up -d postgres
cd ../server/minibank && ./mvnw spring-boot:run
```

Sprawdzenie: http://localhost:8080/actuator/health

Testy (wymagają działającego Dockera — Testcontainers stawia własnego Postgresa):

```bash
./mvnw test
```

## Konfiguracja

Zmienne środowiskowe (domyślne wartości w `application.yml`):

| Zmienna       | Domyślnie                                   |
|---------------|---------------------------------------------|
| `DB_URL`      | `jdbc:postgresql://localhost:5432/minibank` |
| `DB_USERNAME` | `minibank`                                  |
| `DB_PASSWORD` | `minibank`                                  |
| `SERVER_PORT` | `8080`                                      |

## Baza danych

- Schemat zarządzany **wyłącznie przez Flyway**: `src/main/resources/db/migration`.
- Hibernate działa w trybie `ddl-auto: validate` — encje muszą zgadzać się z migracjami.
- Nowa zmiana schematu = nowy plik `V<n>__opis.sql`. Nigdy nie edytujemy już wypuszczonych migracji.
- Encje dziedziczą po `BaseEntity` (`id`, `created_at`, `updated_at`).

## Struktura pakietów

| Pakiet         | Zakres                                              | Rola |
|----------------|-----------------------------------------------------|------|
| `config`       | Konfiguracja Spring (security itp.)                 | —    |
| `common`       | `BaseEntity`, obsługa wyjątków (ProblemDetail)      | —    |
| `user`         | Encja `User`, repozytorium                          | 2    |
| `auth`         | Rejestracja, logowanie, JWT                         | 2    |
| `category`     | Kategorie, reguły, silnik kategoryzacji             | 2    |
| `subscription` | Detekcja płatności cyklicznych                      | 2    |
| `transaction`  | Konta, transakcje, parsery wyciągów, deduplikacja   | 1    |
| `currency`     | Kursy NBP, cache, przeliczanie na PLN               | 1    |
| `group`        | Rozliczenia grupowe, minimalizacja przelewów        | 3    |
| `budget`       | Budżety, prognoza wydatków                          | 3    |
