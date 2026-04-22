# CLAUDE.md — Exercise 1 (Team boni-luca)

Guidance for Claude Code working inside this folder. Scoped to this exercise only; the repo-level `CLAUDE.md` at the root still applies (team branch, `--no-ff` merges, no code under `instructions/`).

## The project

A **personal finance and budgeting app** for paying down debt.

**Stack:**

- **Java 21 + Maven** (via the committed `./mvnw` wrapper — don't assume a system `mvn`).
- **Spring Boot** — serves a simple web page that shows the current financial overview (remaining debt, recent income/expenses, pace of payoff). Keep the web layer thin; it's a view over the domain, not where logic lives.
- **Architecture: hexagonal (ports & adapters).** Domain is pure Java, free of Spring and CSV concerns. Inbound adapters (Spring MVC controllers, CLI if added) and outbound adapters (CSV repositories) depend on the domain — never the reverse.
- **Persistence: CSV files.** Each aggregate (incomes, expenses, debt snapshots) is a separate CSV under a data directory. No DB, no JPA. CSV read/write lives behind a repository port so the domain stays agnostic.
- **Testing: JUnit 5 + AssertJ.** Use AssertJ's fluent assertions (`assertThat(...)`) — not JUnit's built-in `assertEquals`. Domain logic (debt math, projections, category rollups) gets unit tests; adapters get focused integration tests (e.g. round-trip a CSV file).

**Starting state of the user's finances (seed data for the domain model):**

- Opening debt: **€27,376.35** — origin: Pokémon card purchases.
- The app exists to track income and expenses against this debt and surface how fast it's being paid down.

## Core domain (what the app must eventually model)

- **Expenses** — outflows, categorised, dated. Default categories reflect real ongoing spend: **food**, **living expenses**, **pokemon cards**, **car expenses**. Treat these as the seeded defaults; allow new categories to be added, but don't remove these without asking.
- **Incomes** — inflows, dated, optionally recurring.
- **Debt** — a running balance; every income reduces it, every expense competes with it. Starting value €27,376.35.
- **Progress view** — how much debt remains, pace of payoff, projected debt-free date.

Budgeting, savings, and investments (from the exercise brief) are stretch concepts — address them only after the core debt-tracking loop works.

## Suggested package layout (hexagonal)

```
com.boniluca.finance
├── domain/              # pure Java, no Spring, no CSV
│   ├── model/           # Expense, Income, Debt, Money, Category
│   └── service/         # debt-payoff calculations, projections
├── application/         # use-case orchestration (ports defined here)
│   └── port/
│       ├── in/          # inbound ports (use-case interfaces)
│       └── out/         # outbound ports (repository interfaces)
└── adapter/
    ├── in/web/          # Spring MVC controllers, Thymeleaf templates
    └── out/csv/         # CSV repository implementations
```

Keep `domain` and `application` free of `org.springframework.*` and `java.io.*` imports. Only `adapter/*` may depend on frameworks and I/O.

## Working agreements for this exercise

- **Vibe-code friendly.** The workshop brief explicitly says "creatively prompt engineer and vibe code." Favour breadth and working prototypes over production hardening. Don't over-engineer for hypothetical future requirements.
- **Use the Maven wrapper (`./mvnw`).** It's committed in this folder — don't assume a system `mvn`. Don't hard-code absolute paths.
- **Currency is EUR.** Use `BigDecimal` for all money. Never `double`/`float`. A small `Money` value object is welcome.
- **Dates in ISO-8601.** Store `LocalDate` as `yyyy-MM-dd`; format for display only at the edges.
- **CSV format:** UTF-8, comma-separated, header row, `yyyy-MM-dd` dates, dot as decimal separator, amounts as plain `BigDecimal` strings (no thousands separators, no currency symbol). One CSV per aggregate.
- **Tests:** JUnit 5 + AssertJ. Domain logic must be unit-tested. Adapters get focused integration tests. Don't test Spring framework internals.

## Commands (fill in as the project grows)

Once `pom.xml` exists:

- Build: `./mvnw clean package`
- Run tests: `./mvnw test`
- Run the web app: `./mvnw spring-boot:run` (then open `http://localhost:8080`)
- Run the packaged jar: `java -jar target/*.jar`

Update this section when the actual commands settle.

## What NOT to do

- Don't write code outside `teams/Team boni-luca/exercise_1/`.
- Don't let Spring or CSV concerns leak into `domain/` or `application/`. If you're tempted to `@Autowired` something in a domain class, that's a smell — use a port instead.
- Don't swap JUnit 5 + AssertJ for another stack (no Spock, no Hamcrest, no Mockito-as-assertion-library).
- Don't reach for JPA/Hibernate/a real DB. Persistence is CSV, full stop — unless the team explicitly decides otherwise.
- Don't invent requirements. If the brief is silent on something, propose 2–3 options and let the team choose.
