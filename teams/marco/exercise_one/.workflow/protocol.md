# Protocol

---

## 2026-04-23 11:24 -- Brainstorm: Runway app (Exercise One kickoff)

**Type:** Brainstorm
**Summary:** First vision session for Exercise One. Framed the app as a *runway calculator*, not a ledger — answering "when is my zero-money day?" for someone with lumpy consulting income plus steady subscription revenue. Chose CSV-primary / manual-secondary data entry, two-state income model (Received + Invoiced + Recurring baseline), categories-as-levers, and one agentic piece (transaction categorizer with learning).
**Vision updated:** Yes (created `.workflow/vision.md` from scratch)
**Key decisions:**
- Local-only Windows app; no cloud, no sync, no multi-user.
- Income modeled as two distinct shapes: subscription baseline (floor) and consulting pulses. Collapsed only at the zero-day calculation.
- Forward income uses two states — *Received* and *Invoiced* — no pipeline/prospect tracking.
- Categories are a lever: changing projected category spend updates zero-day live.
- Agentic piece = LLM transaction categorizer that learns from corrections. Single, load-bearing agent use; no "advice" agent.
- Investments, tax, mobile, bank APIs all explicitly out for v1.

---

## 2026-04-23 11:20 -- Research: Wise API and alternatives for pulling personal bank transactions

**Type:** Research
**Topic:** Can a Wise retail customer in the EU pull their own transaction data via API, and if not, which banks/aggregators do it better?
**File:** research/wise-api-and-alternatives.md
**Key findings:**
- Wise's Personal API Token cannot retrieve balance statements in EU/UK — blocked by PSD2. The statement API only works for personal accounts based in US, CA, AU, NZ, SG, MY.
- Wise's Open Banking AISP endpoints (`GET /open-banking/v3.1.11/aisp/accounts/{id}/transactions`, 450-day window) exist, but are gated to licensed TPPs — not individuals.
- Practical paths for an EU Wise customer: manual CSV/QIF export from the app (365-day window), or a PSD2 aggregator (GoCardless BAD — but closed to new signups since July 2025; TrueLayer; Tink; Salt Edge).
- bunq is the clear "best retail bank for devs" — personal API keys straight from the app, 300+ operations, webhooks on incoming transactions. Revolut and N26 have no public personal API.
- PSD2 SCA consent re-auth every ~90 days is the big hidden cost of any aggregator-based "live sync" feature.

---
