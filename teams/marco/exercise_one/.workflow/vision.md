# Vision: Runway

A local personal-finance app for people with lumpy income. Built for Marco; by extension for any freelancer / consultant / commission-based earner who alternates between fat months and zero months.

## Problem

Every budgeting app on the market assumes steady monthly income. Marco's income is the opposite: big consulting invoices interleaved with zero-income months, against a mostly-fixed outflow (rent, food, clothes, normal living). The question he actually needs answered — *"when is my zero-money day, and how much work do I need to line up before then?"* — isn't a first-class concept in YNAB, Monarch, Mint, or a spreadsheet. Those tools are ledgers. He needs a runway.

## Target user

Marco. Independent consultant, Windows 11, prefers local-only tooling, does not want personal finances in the cloud.

One user. No accounts, no login, no multi-device sync. If the app survives contact with Marco, it might later serve other lumpy-income earners — but v1 is explicitly single-user and single-machine.

## Value proposition

A **runway calculator**, not a ledger. The headline number is the date you run out of money at your current outflow and expected inflow. Everything else (transactions, categories, charts) exists to sharpen or move that number.

What makes it different from existing tools:

- **Two-shape income model.** Recurring subscription revenue is a baseline floor. Consulting fees are pulses. The app models them separately — because collapsing them into one "income" number loses the signal that actually matters: "how long can I live on subscriptions alone, and how much runway does each gig buy me?"
- **Invoice state.** Sent invoices count toward expected income with a stated confidence and expected pay date. The zero-day moves as soon as an invoice goes out, not only when it's paid.
- **Categories as a lever.** Cutting a spending category updates the zero-day in real time. Categories are not just a rear-view mirror.

## Key features (v1)

1. **Zero-day dashboard.** The home screen. Today → projected zero-money day, shown as a date and a countdown. Two lines on the chart: *conservative* (cash actually in the account) and *expected* (cash + sent invoices + subscription baseline).
2. **CSV import.** Primary data path. Drop in a bank export, transactions ingest, duplicates get caught. Targets German banks first (Sparkasse, DKB, N26) — exact format list TBD during research.
3. **Manual entry.** For cash, corrections, and income that doesn't appear on the bank statement. Addition to CSV, not a replacement.
4. **Income states.**
   - *Received* — money in the account.
   - *Invoiced* — sent to a client, awaiting payment, with expected pay date.
   - *Recurring* — subscription revenue, modeled as a steady monthly baseline.
5. **Category overview with lever mode.** Spending grouped by category. Adjust a category's projected spend; the zero-day recomputes live.
6. **Agentic transaction categorizer.** On CSV import, an LLM assigns categories to each row from cryptic merchant strings. Learns from corrections: once you re-categorize "EDEKA ZENTRALE 4721" as Groceries, it sticks for future imports.

## Non-goals (v1)

- **No cloud.** No sync, no account system, no server. Runs entirely on the local Windows 11 machine.
- **No mobile.** Desktop only.
- **No multi-user / family budgeting.** Single user.
- **No investment tracking.** Stocks, ETFs, crypto are out of scope for runway. Savings accounts count only as cash-on-hand.
- **No tax features.** No estimates, no reporting, no VAT handling.
- **No bank API / Open Banking integration.** CSV import only.
- **No pipeline / CRM.** Verbal deals, proposals, prospects do *not* count as income. Only sent invoices do.
- **No advice agent.** The app shows levers; it doesn't lecture about spending.

## Success criteria

- On a Monday morning Marco opens the app and sees his zero-day inside 5 seconds, with no manual data entry required since the last CSV drop.
- A fresh CSV import produces categorized transactions that are >80% correct before any hand correction.
- Adjusting a category's projected spend updates the zero-day in real time (<200ms).
- The app runs fully offline except for the LLM categorization call, which must be toggle-able.

## Open questions (for `/research`)

- **Tech stack.** Local desktop (Tauri / Electron / WPF / .NET MAUI / native) vs. localhost web app. Needs research on what plays well with Windows 11 + a small dev footprint.
- **Categorization model.** Claude API (cloud call, costs money, best accuracy) vs. local model via Ollama (strict-local, free, lower accuracy). Probably worth supporting both with a config toggle.
- **CSV formats.** Which exact bank exports to parse first. Schema varies wildly by bank.
- **Storage format.** SQLite vs. plain-file (JSON/CSV/Markdown) for the transaction store. Tradeoffs: query power vs. inspectability and portability.
