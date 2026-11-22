# Vibrum

Personal finance web app with multi-currency analytics, automatic expense categorization, subscription detection and Splitwise-style group settlements.

Built as a 4-person university team project (Warsaw University of Technology, PAP 2026Z).

## Features

- **Bank statement import** — real PKO BP CSV exports (Windows-1250), Revolut CSV (any app language), mBank CSV; SHA-256 deduplication, so re-importing the same file adds nothing.
- **Multi-currency** — foreign transactions converted to PLN with historical NBP (National Bank of Poland) rates, cached in the database.
- **Automatic categorization** — keyword/regex rule engine with system and per-user rules, manual overrides and bulk re-categorization.
- **Subscription detection** — finds recurring payments (weekly/monthly/yearly), tolerates price changes and a missed payment, predicts the next charge and the monthly/yearly cost.
- **Analytics** — monthly income/expenses/balance, spending by category, monthly trend.
- **Budgets** — monthly limits per category with burn-rate forecast.
- **Group expenses** — shared expenses with equal/percent/fixed splits, balances, minimal settlement plan, email invitations.
- **QR payments** — settle a debt by scanning a Polish bank-transfer QR code generated from the recipient's IBAN.
- **Auth** — JWT access tokens, rotating refresh tokens in HttpOnly cookies, password change and reset by email.

## Tech stack

| Layer | Technologies |
|---|---|
| Backend | Java 21, Spring Boot 4, Spring Security (JWT, BCrypt), Spring Data JPA / Hibernate, Flyway, springdoc-openapi |
| Frontend | Next.js (App Router, RSC), React, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Database | PostgreSQL |
| Testing | JUnit 5, MockMvc, Testcontainers, Mockito, Jest |
| DevOps | Docker, GitLab CI, Azure, Vercel |

## My part

I was responsible for the backend platform and the "smart" features:

- project setup: Spring Boot skeleton, Flyway migrations, Docker Compose, security configuration, Swagger;
- authentication: JWT, refresh-token sessions, password change/reset, profile;
- categorization engine and rules API;
- subscription detection;
- analytics API;
- real bank statement parsers (PKO BP, Revolut);
- transaction management (manual categories, re-categorization, accounts);
- IBAN and bank-transfer QR codes for group settlements;
- code review and integration of the team's branches.

## Running locally

Requirements: Docker.

```bash
cd docker
cp .env.example .env   # fill in database and SMTP settings
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

Backend tests (require a running Docker daemon for Testcontainers):

```bash
cd server/minibank
./mvnw test
```

## Team

- Ruslan Dzikanchuk — backend platform, auth, categorization, subscriptions, analytics
- Artsiom Andrasovich — frontend, DevOps
- Egor Gavrileyko — group settlements, budgets, database
- Valiantsin Shynkovich — statement import, NBP currency service
