# Research: Wise API for Retail Customers, and Better Alternatives

**Date:** 2026-04-23
**Status:** Complete
**Relevance:** Data ingestion for a personal finance / budgeting app — can we pull a user's own bank transactions programmatically?

## Summary

Wise has an API, but for a **personal EU/UK customer** it will not give you your own transaction data. Wise's Personal API Token is intentionally narrow: it can create quotes, recipients, and transfers, and track transfer events — it *cannot* retrieve balance statements in the EU/UK (this is blocked by PSD2; the carve-out for API statement access only covers personal accounts based in the US, Canada, Australia, New Zealand, Singapore, and Malaysia). Wise does expose a full PSD2 Open Banking / AISP surface (`GET /open-banking/v3.1.11/aisp/accounts/{id}/transactions`, 450-day window), but those endpoints are gated to regulated Third Party Providers — not to you as the account holder.

So for a Wise EU customer, the realistic paths are (a) manual CSV / QIF / PDF download from the web or mobile app (365-day window, statements kept 30 days), or (b) go through a licensed **PSD2 account-information aggregator** (TrueLayer, Tink, GoCardless Bank Account Data, Salt Edge, Yapily) that reads Wise via its AISP endpoints on your behalf.

If the real goal is "a bank whose API I can actually use as a retail developer," **bunq is the clear winner**: it publishes a full personal API (300+ operations, personal API keys issued from the app), and payments/transactions are a first-class object. Revolut and N26 do not offer a public API for personal accounts. Either way — bunq-direct or aggregator-mediated — PSD2 means the *data* is reachable for most EU banks; the quality-of-life difference is how much yak-shaving (TPP licensing, aggregator fees, consent re-auth every 90 days) sits between you and it.

## Key Findings

### Wise Personal API Token — what it actually covers
Personal API tokens authenticate a single Wise.com user and are limited to: creating quotes, retrieving/creating recipients, creating transfers and batch groups, and tracking transfer events. **Funding transfers and retrieving balance statements via API are not supported** except for personal accounts based in US, CA, AU, NZ, SG, MY. In EU/UK this is explicitly blocked due to PSD2. ([Wise docs — Personal API tokens](https://docs.wise.com/guides/developer/auth-and-security/personal-api-token))

### Wise Balance Statement endpoint exists but is business-side
The balance statement endpoint returns "deposits, withdrawals, conversions, card transactions, and fees" in JSON, CSV, PDF, XLSX, CAMT.053, MT940, or QIF. Practically useful format list — but the gate is the authentication: personal token holders in EU/UK can't hit it. ([Wise docs — Balance Statement](https://docs.wise.com/api-docs/api-reference/balance-statement))

### Wise Open Banking AISP surface is for TPPs, not end users
Wise publishes PSD2/Open-Banking endpoints — notably `GET /open-banking/v3.1.11/aisp/accounts/{id}/transactions` with a 450-day query window. This is the endpoint a regulated aggregator would call after the customer grants consent; you can't reach it as an individual. ([Wise — Open Banking guide](https://docs.wise.com/guides/developer/open-banking))

### Manual export still works fine
From the Wise website or app you can filter and download statements in CSV or PDF (and for balances, also in QIF which imports cleanly into most budgeting tools), 365-day window per download, statements stored for 30 days. This is the no-code path and it works today. ([Wise Help Centre — download a statement](https://wise.com/help/articles/2736049/how-do-i-download-a-statement))

### bunq — the genuinely developer-friendly retail bank
bunq publishes a full public API (300+ operations). Any user on a bunq Pro or Elite plan can generate a **personal API key from inside the app** and immediately start listing payments via `GET /user/{userID}/monetary-account/{monetary-accountID}/payment`. Webhooks are supported, so you can react to incoming card transactions in real time rather than polling. Official SDKs handle session/encryption boilerplate. ([bunq API docs](https://doc.bunq.com/), [Getting started](https://doc.bunq.com/basics/getting-started), [bunq personal account API page](https://www.bunq.com/personal-account/banking-features/api-and-zapier))

### Revolut and N26 — not useful for this
Revolut has a developer portal but the **personal account API is not public** — only the Business API is available (Grow plan and above). Even on the Open Banking/AISP side, full transaction history is only accessible in the first 5 minutes after consent, then restricted to the last 90 days. N26 has no public personal API. ([Revolut developer — Open Banking API](https://developer.revolut.com/docs/open-banking/open-banking-api))

### Aggregators — the realistic path for "any EU bank incl. Wise"
Rather than banking-hop, you can use a PSD2 AISP aggregator. For Europe/UK, the relevant options:
- **GoCardless Bank Account Data** (formerly Nordigen). Historically the best deal: **free** for personal use, up to 50 bank connections per month. **Caveat: stopped accepting new Bank Account Data signups from July 2025.** Existing accounts still work. If you already have one, use it. ([GoCardless BAD docs](https://developer.gocardless.com/bank-account-data/overview/), [Actual Budget setup guide](https://actualbudget.org/docs/advanced/bank-sync/gocardless/))
- **TrueLayer** — strong European coverage (UK, France, Italy, etc.), consumer-facing API quality, paid. ([Plaid vs TrueLayer 2026](https://www.fintegrationfs.com/post/plaid-vs-truelayer-us-vs-global-open-banking-apis))
- **Tink** (Visa-owned), **Yapily**, **Salt Edge** — similar EU-focused aggregators, mostly paid, some free/dev tiers. ([Open Banking Tracker — aggregators](https://www.openbankingtracker.com/banking-data-aggregation))
- **Plaid** — US-first; patchy EU coverage by country/product. Not the right pick for Wise/EU. ([Yapily — Plaid alternatives](https://www.yapily.com/blog/plaid-alternatives))

### Recurring gotcha: PSD2 consent re-auth
Across *every* aggregator route (and Wise's own AISP endpoints), PSD2 mandates the user re-grants consent every ~90 days via SCA. This is not an aggregator limitation, it's regulation. Any "sync my bank" app needs a consent-refresh UX, which is non-trivial. ([Revolut OB docs](https://developer.revolut.com/docs/open-banking/open-banking-api))

## Implications for This Project

Ranked by effort vs. power for a budgeting app prototype:

1. **Start with manual CSV import from Wise.** For exercise_one this is probably enough to prove the UX — upload-a-CSV → parsed-transactions → categorization → dashboards. No auth, no rate limits, no PSD2 consent dance. The workshop brief explicitly favours breadth and exploration; this is the fastest path to a working demo.
2. **If you want live sync in the prototype, use bunq.** Open a bunq account (Pro/Elite), generate a personal API key, list payments. You control the account and the key; there's no TPP licensing needed. Cleanest "built it myself" story, and it gives you webhooks for real-time updates.
3. **If you need live sync from an *arbitrary* EU bank (the real-world budgeting-app case), pick an aggregator.** TrueLayer or Tink for coverage/reliability; check whether your existing GoCardless BAD access (if any) still works before building on a closed-signup service. Budget for the 90-day consent re-auth UX — it's the biggest hidden cost.
4. **Do *not* plan around "Wise personal API pulls my transactions."** That path is blocked by PSD2 for EU/UK and won't change.

For the workshop specifically: option 1 (manual CSV) plus option 2 (bunq live sync as a stretch goal) is the most faithful "vibe code a budgeting app" story with the least regulatory gristle.

## Open Questions

- Does Marco already have a GoCardless BAD account from before July 2025? If yes, that flips the aggregator math — free live Wise sync without needing to switch banks.
- Is the workshop prototype scoped to *one user's own data* (makes bunq/personal-token-style solutions valid) or *multiple users' data* (forces the aggregator + TPP-consent route)?
- Wise's CAMT.053 / MT940 exports are interesting for a data-modelling exercise — worth prototyping against those richer formats instead of CSV?

## Sources

- [Wise docs — Personal API tokens](https://docs.wise.com/guides/developer/auth-and-security/personal-api-token)
- [Wise docs — Balance Statement endpoint](https://docs.wise.com/api-docs/api-reference/balance-statement)
- [Wise docs — Open Banking / AISP guide](https://docs.wise.com/guides/developer/open-banking)
- [Wise Help Centre — downloading a statement](https://wise.com/help/articles/2736049/how-do-i-download-a-statement)
- [Wise Help Centre — what is the Wise API](https://wise.com/help/articles/2958106/whats-the-wise-api)
- [bunq API documentation](https://doc.bunq.com/)
- [bunq — Getting started](https://doc.bunq.com/basics/getting-started)
- [bunq — personal API & Zapier page](https://www.bunq.com/personal-account/banking-features/api-and-zapier)
- [Revolut developer — Open Banking API](https://developer.revolut.com/docs/open-banking/open-banking-api)
- [GoCardless Bank Account Data — docs](https://developer.gocardless.com/bank-account-data/overview/)
- [Actual Budget — GoCardless setup guide](https://actualbudget.org/docs/advanced/bank-sync/gocardless/)
- [Plaid vs TrueLayer (2026) — FintegrationFS](https://www.fintegrationfs.com/post/plaid-vs-truelayer-us-vs-global-open-banking-apis)
- [Open Banking Tracker — banking data aggregation comparison](https://www.openbankingtracker.com/banking-data-aggregation)
- [Yapily — Plaid alternatives](https://www.yapily.com/blog/plaid-alternatives)
