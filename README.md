# PAP 2026Z – Projekt Zespołowy (`pap2026Z11`)

## 1. Skład zespołu

| Imię i nazwisko | Numer indeksu | Uczelniany adres e-mail | Rola w projekcie |
| :--- | :--- | :--- | :--- |
| **Valianstin Shynkovich** | `341955` | `01196827@pw.edu.pl` | Data Ingestion, Parsers & NBP Currency Engine |
| **Ruslan Dzikanchuk** | `347868` | `01210171@pw.edu.pl` | Categorization Engine, Subscriptions & Auth |
| **Egor Gavrileyko** | `347903` | `01210274@pw.edu.pl` | Group Expense Splitting (Splitwise Module) & DB |
| **Artsiom Andrasovich** | `347911` | `01205859@pw.edu.pl` | Frontend / UI (React/TS), Analytics & DevOps |

---

## 2. Temat zadania projektowego

**System zarządzania finansami osobistymi z wielowalutową analityką, automatyczną kategoryzacją wydatków i modułem rozliczeń grupowych**

Celem projektu jest stworzenie aplikacji webowej wspomagającej zarządzanie budżetem osobistym oraz wydatkami współdzielonymi. System umożliwia import wyciągów bankowych (w formatach CSV/JSON z różnych banków, np. PKO BP, mBank, Revolut) prowadzonych w wielu walutach (PLN, EUR, USD), ich automatyczną deduplikację oraz przeliczanie wartości transakcji według historycznych kursów średnich pobieranych z publicznego API Narodowego Banku Polskiego (NBP API). Aplikacja automatycznie przypisuje kategorie do wydatków na podstawie definiowalnych reguł (np. `BIEDRONKA` -> *Spożywcze*, `ZDROFIT` -> *Sport*), wykrywa cykliczne subskrypcje, prognozuje wykonanie budżetu na koniec miesiąca oraz pozwala na dzielenie rachunków ze znajomymi wraz z algorytmem minimalizacji liczby przelewów wyrównawczych.

---

## 3. Krótki opis przewidywanej architektury, technologii i funkcjonalności

### 3.1. Przewidywana architektura systemu
System zostanie zrealizowany w architekturze trójwarstwowej (Client–Server) uruchamianej w kontenerach Docker:

1. **Warstwa prezentacji (Frontend – Next.js App Router, SSR / RSC):**
   * Aplikacja webowa w technologii Next.js (React + TypeScript) wykorzystująca architekturę hybrydową: komponenty serwerowe (*React Server Components*) do szybkiego pobierania danych z backendu Java i renderowania po stronie serwera (SSR) oraz komponenty klienckie (*Client Components*) dla interaktywnych wykresów, formularzy importu CSV/JSON i panelu rozliczeń grupowych.
2. **Warstwa logiki biznesowej (Backend – Java 21 / Spring Boot):**
   * *Statement Importer & Currency Service:* Moduł parsujący wyciągi z różnych formatów bankowych do wspólnego modelu domenowego, wykrywający duplikaty transakcji oraz synchronizujący historyczne i bieżące kursy walut z zewnętrznego **API NBP (`api.nbp.pl`)** z wykorzystaniem lokalnej pamięci podręcznej (Cache).
   * *Categorization & Subscription Engine:* Silnik reguł dopasowujący słowa kluczowe i wyrażenia regularne z tytułów przelewów do kategorii budżetowych oraz algorytm analizujący historię transakcji w celu wykrywania stałych opłat cyklicznych (subskrypcji).
   * *Group Settlement Engine (Moduł Splitwise):* Moduł obsługujący grupy współdzielonych wydatków, obliczający salda uczestników oraz wyznaczający minimalną liczbę transakcji potrzebnych do całkowitego rozliczenia długów w grupie (optymalizacja grafu przepływów finansowych).
   * *Budget & Forecasting Service:* Moduł monitorujący limity wydatków i prognozujący stan konta na koniec okresu rozliczeniowego na podstawie dotychczasowego tempa wydatków (*Burn Rate*).
3. **Warstwa danych (Persistence – PostgreSQL):**
   * Relacyjna baza danych przechowująca użytkowników, konta wielowalutowe, zaimportowane transakcje, słowniki reguł kategoryzacji, zkeszowane kursy walut NBP, cele oszczędnościowe oraz strukturę grup i rozliczeń między użytkownikami.

### 3.2. Wykorzystywane technologie
* **Backend:** Java 21, Spring Boot 3 (Spring Web, Spring Data JPA, Spring Security + JWT, Scheduling), Maven/Gradle, OpenAPI (Swagger).
* **Frontend:** TypeScript, Next.js (App Router, SSR / React Server Components), React, Tailwind CSS, biblioteka do wykresów (np. Recharts).
* **Baza danych:** PostgreSQL.
* **Zewnętrzne API:** Publiczne REST API Narodowego Banku Polskiego (`https://api.nbp.pl/`).
* **Infrastruktura i DevOps:** Docker, Docker Compose, GitLab CI/CD, JUnit 5 (testy jednostkowe i integracyjne).

### 3.3. Główne funkcjonalności systemu
* **Import wyciągów i deduplikacja:** Wczytywanie historii transakcji z plików CSV/JSON o różnych schematach kolumn, walidacja poprawności danych oraz automatyczne pomijanie wcześniej zaimportowanych operacji.
* **Wielowalutowość i integracja z NBP API:** Obsługa transakcji w różnych walutach (PLN, EUR, USD i in.) z automatycznym pobraniem kursu NBP z dnia poprzedzającego transakcję oraz przeliczeniem kwot do waluty bazowej portfela.
* **Automatyczna kategoryzacja i detekcja subskrypcji:** Przypisywanie kategorii na podstawie słów kluczowych (np. nazwa sprzedawcy, kod MCC) z możliwością definiowania własnych reguł przez użytkownika oraz automatyczne wykrywanie powtarzalnych płatności miesięcznych.
* **Rozliczenia grupowe (Splitwise Module):** Tworzenie grup ze znajomymi, dzielenie rachunków (równo, procentowo lub kwotowo) oraz generowanie optymalnego planu spłaty zadłużenia minimalizującego liczbę przelewów w grupie.
* **Budżetowanie i prognozowanie wydatków:** Definiowanie miesięcznych limitów dla poszczególnych kategorii, ostrzeżenia o przekroczeniu budżetu oraz estymacja salda na koniec miesiąca.
* **Analityka i raportowanie:** Wizualizacja struktury wydatków na wykresach kołowych i słupkowych, porównania miesiąc do miesiąca (MoM) oraz eksport zagregowanych raportów finansowych.
* **Bezpieczeństwo i autoryzacja:** Rejestracja i logowanie oparte na tokenach JWT oraz izolacja danych finansowych poszczególnych użytkowników.