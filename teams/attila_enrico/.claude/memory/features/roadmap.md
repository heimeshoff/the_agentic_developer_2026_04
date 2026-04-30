# Feature Roadmap

The retrospective roadmap of every feature ever discussed for the Personal Finance App — including ones we shipped, parked, and dropped. The graveyard is part of the value: it shows what we considered and why we chose otherwise.

## Statuses

| Status     | Meaning                                                                  |
|------------|--------------------------------------------------------------------------|
| `idea`     | Mentioned, not yet shaped. Roadmap row only.                             |
| `shaping`  | In clarification / journeys / planning. Earns a `features/<slug>/` dir.  |
| `building` | Implementation in progress.                                              |
| `shipped`  | Merged and usable end-to-end.                                            |
| `parked`   | Deliberately deferred. Note why and what would un-park it.               |
| `dropped`  | Decided against. Link the ADR or note that closes it.                    |

## Roadmap

| ID  | Feature                                  | Status                | First mentioned | Notes / Links                                                                                                                                                                |
|-----|------------------------------------------|-----------------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| F01 | User registration with email + password  | shipped (inferred)    | 2026-04-28      | From `CLAUDE.md`. Currency picked at signup. Status inferred — F06/F07 depend on it. No ADR/dossier yet; predates the memory system.                                          |
| F02 | Transaction list                         | shipped (inferred)    | 2026-04-28      | From `CLAUDE.md`. Filter + sort scope unclear; basic list ships. Status inferred from F06/F07 dependence.                                                                     |
| F03 | Transaction data entry                   | shipped (inferred)    | 2026-04-28      | From `CLAUDE.md`. Title, amount, timestamp, category, kind (expense/income). Status inferred.                                                                                 |
| F04 | Spending & income charts/graphs          | idea                  | 2026-04-28      | From `CLAUDE.md`. Chart types TBD during shaping. No evidence in code yet.                                                                                                    |
| F05 | Per-user currency selection              | shipped (inferred)    | 2026-04-28      | Set at registration; consumed by F06 generator (currency-aware ranges). `SUPPORTED_CURRENCIES` lives in `src/lib/currencies.ts`.                                              |
| F06 | Demo data — seed + remove                | shipped               | 2026-04-23      | One-click create ~500 currency-aware transactions over 12mo + one-click remove. Dossier: [features/demo-data/brief.md](demo-data/brief.md). Source: `exercise_one/.features/demo-data/`. |
| F07 | Edit & delete transactions               | shipped (smoke pending) | 2026-04-23    | Inline pencil/trash; modal edit; optimistic soft-delete with ~8s undo toast. ADRs 0002–0005 originated here. Dossier: [features/edit-delete-transactions/brief.md](edit-delete-transactions/brief.md). Source: `exercise_one/.features/edit-delete-transactions/`. |

> **Note on inferred statuses (F01–F05):** the project pre-dates this memory system; statuses for foundational features were not recorded contemporaneously. Marked "shipped (inferred)" where downstream features (F06, F07) prove their existence in the codebase. Promote to plain `shipped` once anyone confirms by inspection, or downgrade if the inference is wrong.

## How to add a row

1. Append a new row with the next `Fnn` ID (zero-padded, two digits is enough until we hit 100 — we won't).
2. Status starts at `idea` unless you're already shaping it.
3. When a row reaches `shaping`, create `features/<slug>/brief.md` and link it from the Notes column.
4. When a status changes due to a decision, link the ADR in Notes (e.g., `Parked — see ADR 0007`).
