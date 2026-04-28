# Research: Top-Starred Personal Finance GitHub Repos — Architecture & UX

**Date:** 2026-04-23
**Status:** Complete
**Relevance:** Baseline landscape scan. No `vision.md` exists yet for this project, so findings are captured as a general reference for any future direction involving personal-finance tracking (self-hosted, local-first, budgeting, or portfolio).

## Summary

Five repos dominate the open-source personal-finance space by stars, and they split cleanly along two axes: **"server-rendered monolith vs. local-first client"** and **"general ledger vs. budgeting vs. investments"**. The three heavyweights — Maybe (~54k ⭐), Actual Budget (~26k ⭐), and Firefly III (~23k ⭐) — each pick a different quadrant and design accordingly.

**Architecturally**, the field is conservative. Four of the five are monoliths. The one genuine architectural outlier is Actual Budget, which runs entirely client-side in TypeScript with an append-only CRDT message log synced through a dumb relay server, enabling true offline editing and optional end-to-end encryption. Firefly III is the accounting purist (double-entry bookkeeping, transaction journals). Maybe is the modern Rails poster child (Hotwire, server-rendered, low JS). Wealthfolio is the investment specialist (Rust + Tauri desktop, now expanding to mobile/Docker). ezBookkeeping is the lightweight-deployment play (Go single binary, mobile-first PWA).

**UX-wise**, two patterns repeat: (1) a dashboard home with net-worth / cash-flow cards + recent-transaction list, and (2) a transaction register as the daily-driver screen. Differentiators live elsewhere — envelope budgeting (Actual), rule engines (Firefly), SMS/receipt parsing (ezBookkeeping, Hisabi), and portfolio analytics (Wealthfolio, Ghostfolio). Mobile story is the biggest gap across the category: only ezBookkeeping and Wealthfolio ship a real mobile experience.

## Key Findings

### The Five Leaders at a Glance

| Repo | ⭐ (approx.) | Stack | Arch model | License | Status |
|---|---|---|---|---|---|
| [maybe-finance/maybe](https://github.com/maybe-finance/maybe) | ~54k | Ruby on Rails + Hotwire, PostgreSQL | Monolith, SSR + progressive enhancement | AGPL-3.0 | **Archived** (last release v0.6.0, Jul 2025) |
| [actualbudget/actual](https://github.com/actualbudget/actual) | ~26k | TypeScript, NodeJS, Electron, React | Local-first client + sync relay (CRDT, optional E2EE) | MIT | Active, community-governed |
| [firefly-iii/firefly-iii](https://github.com/firefly-iii/firefly-iii) | ~23k | PHP/Laravel, Blade+Twig, small Vue islands | Monolith, MVC + repository pattern | AGPL-3.0 | Very active (v6.6.1 April 2026) |
| [afadil/wealthfolio](https://github.com/afadil/wealthfolio) | ~7.5k | Rust + Tauri, React, TypeScript SDK for addons | Local-first desktop; added mobile + Docker in v2 | AGPL-3.0-ish (check repo) | Active |
| [mayswind/ezbookkeeping](https://github.com/mayswind/ezbookkeeping) | ~4.7k | Go backend, Vue 3 + TS frontend, SQLite/MySQL/PG | Monolith, single-binary deploy | MIT | Active |

### Finding 1 — Architectural split: local-first is the interesting minority

Most repos are comfortable, boring server-rendered monoliths. That's not a criticism — it's the right shape for self-hosters who want one Docker container. Firefly III (Laravel, ~13 years old) and ezBookkeeping (Go single binary) embody this well: one process, one DB, done.

**Actual Budget breaks the mold.** Its data model is a client-side SQLite database wrapped by an append-only log of CRDT "messages" ([Actual's sync docs](https://actualbudget.org/docs/getting-started/sync/)). The server is a thin relay that stores and fans out messages; it doesn't need to understand them, which is what enables **optional end-to-end encryption** — a password-derived key encrypts messages before leaving the client, so the host sees only ciphertext. Caveat: bank-sync tokens (SimpleFIN / GoCardless / Pluggy) live server-side and are *not* covered by E2EE.

**Wealthfolio and Maybe's underlying pattern is instructive for a greenfield build**: Wealthfolio picked Tauri to ship a native desktop binary with a React UI and a Rust core, giving it a small footprint and offline-first guarantees without the Electron weight. Maybe picked the opposite — ship a Rails monolith with Hotwire and lean on the server for everything. Both work; the deciding question is *where your users' data should live*.

### Finding 2 — Double-entry bookkeeping is the serious data model, not everyone uses it

[Firefly III's architecture docs](https://docs.firefly-iii.org/explanation/more-information/architecture/) describe a **TransactionJournal → Transactions** model: every economic event has one journal with exactly two transactions (debit + credit), enforcing the accounting identity at the schema level. This gives you free reconciliation, auditable history, and predictable reports (balance sheet, cash flow).

**Actual doesn't do this** — it's an envelope-budgeting tool, so its model is optimized around "money assigned to a category" rather than "flows between accounts." Maybe and ezBookkeeping sit in between: account-scoped transactions with categories/tags, without strict double-entry invariants.

**Implication:** if the project intends to cover both sides (bookkeeping *and* budgeting), Firefly's model is the more extensible foundation. If it's purely envelope/budget-focused, Actual's simpler schema is faster to get right.

### Finding 3 — The UX playbook is surprisingly uniform

Across all five apps, the primary screens are the same:

1. **Dashboard** — net worth card, monthly cash-flow summary, spending-by-category chart, recent-transaction list.
2. **Transaction register** — searchable, filterable table; inline edit; bulk operations; the *single most important screen* in every app.
3. **Accounts list** — grouped by type (checking / savings / credit / investment / loan).
4. **Budget or Envelope view** — Actual and Firefly both have a strong version; Maybe and ezBookkeeping are lighter here.
5. **Reports** — income vs. expense over time, category breakdowns, drill-downs.

Where they differentiate:

- **Actual:** the envelope-budgeting UX is the product. "Every dollar has a job" is reflected directly in the monthly column-based budget screen.
- **Firefly III:** rules engine exposed in the UI — users can define "if description contains 'AMZN' then set category=Shopping" and re-run over history. Powerful but intimidating.
- **Wealthfolio:** performance/return analytics (XIRR, time-weighted return) that pure budgeting tools don't have.
- **ezBookkeeping:** **mobile-first design with PWA install**, receipt OCR, location-tagged transactions. Feels native on phone in a way the others don't.
- **Maybe:** the visual design is widely praised — clean cards, generous whitespace, thoughtful empty states. Served mostly server-rendered via Hotwire, which proves SSR can still feel modern.

### Finding 4 — Bank sync is the hardest UX problem and nobody fully solves it

Automated transaction import (via Plaid, SimpleFIN, GoCardless, Pluggy, or scraping) is the single biggest differentiator between "open-source toy" and "daily driver." Every project handles it differently:

- **Actual** integrates SimpleFIN / GoCardless / Pluggy; user supplies their own credentials.
- **Firefly III** has no direct bank connection — it relies on importer companion apps (Firefly III Importer, Nordigen importer) and CSV.
- **Maybe** originally integrated Plaid; since archiving, community forks have mixed results.
- **ezBookkeeping** uses an **SMS parser** + CSV import (popular in markets where SMS bank notifications are universal).
- **Wealthfolio** imports broker CSVs.

The common thread: **manual entry and CSV import are always provided; auto-sync is always "bring your own provider / keys."** This is partly technical, partly legal — Plaid-style aggregators don't self-host well.

### Finding 5 — Honorable mentions worth knowing

- [ghostfolio/ghostfolio](https://github.com/ghostfolio/ghostfolio) — wealth/portfolio tracker, Angular + NestJS + Prisma + Nx, AGPL. Strong alternative to Wealthfolio if you like Angular.
- [hisabi-app/hisabi](https://github.com/hisabi-app/hisabi) — lightweight SMS-parser-first tracker, ~442 ⭐.
- [we-promise/sure](https://github.com/we-promise/sure) — community fork of Maybe, active after Maybe was archived.
- [Kresus](https://framagit.org/kresus/kresus) — Node-based, strong in EU with Weboob/woob bank-scraping integration.

## Implications for This Project

Without a stated project vision, these are hooks to pull on in a follow-up `/brainstorm` session:

1. **Pick a quadrant first.** General ledger, envelope budgeting, or investments? The data model decision propagates everywhere. Trying to be all three is what every "from-scratch finance app" gets wrong.
2. **Decide where data lives before picking a framework.** Local-first (Actual/Wealthfolio style) and server-rendered monolith (Maybe/Firefly style) are both valid, but they force different frontends, different sync stories, and different security models (E2EE is only cheap in local-first).
3. **Transaction register is the product.** Whatever else is planned, the register screen needs to be faster, more filterable, and more bulk-editable than the incumbents. That's where daily users spend their time and where open-source tools are still rough.
4. **Plan the bank-sync story early, but expect to ship without it.** CSV import + manual entry is the universal MVP. Integrations come later and are mostly a "bring your own provider" wrapper.
5. **Mobile is an open lane.** ezBookkeeping's PWA and Wealthfolio v2's mobile app are the only strong mobile experiences. Most of the category is desktop-first.

## Open Questions

- What's the actual CRDT variant Actual uses? ("Messages" suggests op-based/Hybrid Logical Clock, but worth confirming from source).
- How does Firefly III's rules engine scale past a few hundred rules — any users reporting perf issues?
- Is the Sure fork of Maybe gaining real traction, or is the archived original still the de-facto code base?
- What does the ecosystem look like for EU bank sync specifically (PSD2 / GoCardless / Weboob) — does one approach dominate?
- For a greenfield build, what's the delta in developer-velocity between a Rails/Hotwire monolith (Maybe pattern) and a Tauri + Rust + React desktop app (Wealthfolio pattern)?

## Sources

- [maybe-finance/maybe on GitHub](https://github.com/maybe-finance/maybe)
- [actualbudget/actual on GitHub](https://github.com/actualbudget/actual)
- [Actual Budget sync documentation](https://actualbudget.org/docs/getting-started/sync/)
- [Actual Budget bank-sync documentation](https://actualbudget.org/docs/advanced/bank-sync/)
- [firefly-iii/firefly-iii on GitHub](https://github.com/firefly-iii/firefly-iii)
- [Firefly III architecture docs](https://docs.firefly-iii.org/explanation/more-information/architecture/)
- [Firefly III transactions docs](https://docs.firefly-iii.org/explanation/financial-concepts/transactions/)
- [afadil/wealthfolio on GitHub](https://github.com/afadil/wealthfolio)
- [Wealthfolio homepage](https://wealthfolio.app/)
- ["How I Built an Open Source App That Went Viral" — Wealthfolio author](https://dev.to/afadil/how-i-built-an-open-source-app-that-went-viral-160p)
- [mayswind/ezbookkeeping on GitHub](https://github.com/mayswind/ezbookkeeping)
- [ghostfolio/ghostfolio on GitHub](https://github.com/ghostfolio/ghostfolio)
- [hisabi-app/hisabi on GitHub](https://github.com/hisabi-app/hisabi)
- [we-promise/sure on GitHub](https://github.com/we-promise/sure)
