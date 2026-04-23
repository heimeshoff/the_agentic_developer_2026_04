# Protocol

Chronological log of research, planning, and decisions. Newest entries at top.

---

## 2026-04-23 14:00 -- Brainstorm: Initial product vision (exploratory, unresolved)

**Type:** Brainstorm
**Summary:** First brainstorming session to shape the product vision. Settled on a commercial EU-native personal-finance product with a Belgian beachhead and a two-layer (pan-EU core + country-specific polish) architecture. The target user segment was *not* settled — the conversation rotated through expats, households, families with kids, shared-finance groups, and finally "friends coordinating toward a common goal (trip or venture)." Session paused before converging; a follow-up brainstorm is required.
**Vision updated:** Yes (as DRAFT — open questions explicitly flagged)
**Key decisions:**
- Commercial product, not a pet project.
- Positioning: EU-native, differentiated from US-centric incumbents (Monarch, YNAB, Copilot).
- Beachhead: Belgium. Pan-EU Layer 1 core + country-specific Layer 2 localization.
- Explicit non-goal: no agentic AI that autonomously takes financial actions — team does not trust AI for money management.
- Target-user ICP and product wedge (household finance vs. shared-goal coordination) deferred to next brainstorm.

---

## 2026-04-23 12:00 -- Research: Personal-finance GitHub repos (architecture & UX)

**Type:** Research
**Topic:** Top-starred open-source personal-finance tracking apps on GitHub — architecture and UX patterns
**File:** research/personal-finance-architecture-ux.md
**Key findings:**
- Five leaders dominate: Maybe (~54k ⭐, archived Rails/Hotwire), Actual Budget (~26k ⭐, local-first TS/CRDT), Firefly III (~23k ⭐, Laravel double-entry), Wealthfolio (~7.5k ⭐, Tauri/Rust), ezBookkeeping (~4.7k ⭐, Go single binary).
- Architectures split two ways: server-rendered monolith (most of them) vs. local-first client with CRDT sync (Actual, Wealthfolio). Only Actual offers optional end-to-end encryption.
- Data models split three ways: strict double-entry bookkeeping (Firefly), envelope budgeting (Actual), and account+category+tag (everyone else).
- UX converges on dashboard + transaction register + accounts + budget + reports; real differentiation lives in bank-sync strategy, rule engines, and mobile experience (where ezBookkeeping PWA and Wealthfolio v2 lead).
- Bank sync is the hardest UX problem; every project punts to CSV + "bring your own aggregator" (Plaid/SimpleFIN/GoCardless/Pluggy).

---
