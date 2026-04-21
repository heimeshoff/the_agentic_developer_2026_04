# Competitive Analysis — Agent Briefs

Spawn these three agents in parallel. Each covers a distinct angle of the competitor landscape.

---

## Agent A: Direct Competitor Profiles

**Research question:** Who are the direct competitors to a homeowner-focused personal finance app, what do they offer, and how are they positioned?

**Focus:**
- Personal finance / budgeting apps with any homeowner angle: YNAB, Monarch Money, Copilot, Honeydue, Simplifi, Tiller, Empower (Personal Capital), NerdWallet
- For each competitor found: product description, target user, headline features, pricing tiers, stated value proposition, app store rating if available
- Note whether any competitor explicitly serves homeowners or has homeowner-specific features (mortgage tracking, HOA, maintenance budgets, property tax)
- Identify positioning gaps — homeowner needs that no competitor explicitly addresses

**Sources to search:** App websites, app store listings, product landing pages, Crunchbase, press coverage.

**Output format:**
```
## [Competitor Name]
- Tagline / positioning:
- Target user:
- Key features:
- Pricing:
- Homeowner-specific features (if any):
- Notable strength:
- Notable gap:
```

---

## Agent B: Homeowner-Adjacent Tools

**Research question:** What tools do homeowners use specifically for property-related finances, and how do they overlap with personal finance apps?

**Focus:**
- Mortgage-specific tools: calculators, refinancing trackers, lender comparison (e.g., Mortgage Coach, Optimal Blue)
- Home maintenance budgeting apps (e.g., HomeZada, Centriq, Thumbtack)
- Insurance comparison tools (e.g., Policygenius, Zebra)
- HOA management software that touches homeowner finances
- Energy bill optimization tools (e.g., OhmConnect, Arcadia)
- For each: what specific homeowner financial pain point does it solve? Does it connect to a broader budgeting picture?

**Sources to search:** App store searches for "home maintenance budget", "mortgage tracker", "home expense tracker"; product websites; listicle articles ranking homeowner finance tools.

**Output format:**
```
## [Tool Name]
- Category:
- Pain point it solves:
- Integration with broader personal finance (yes/no/partial):
- User base signals (ratings, reviews count):
```

---

## Agent C: User Sentiment on Existing Tools

**Research question:** What do homeowners say about existing personal finance and home finance tools — what works, what frustrates them, and what's missing?

**Focus:**
- Reddit threads: r/personalfinance, r/homeowners, r/FirstTimeHomeBuyer, r/frugal — search for "YNAB homeowner", "budgeting app mortgage", "home expenses app", "tracking home costs"
- App Store / Google Play reviews for YNAB, Monarch, Copilot (look for homeowner-specific complaints or requests)
- Quora and personal finance forums for homeowner budget discussions
- Verbatim quotes where possible — the exact language homeowners use matters

**Key themes to extract:**
- Frustrations with current tools (what's missing for homeowners specifically)
- Workarounds people use (spreadsheets, custom YNAB categories, multiple apps)
- Feature requests that come up repeatedly
- What "good" looks like — what do satisfied users praise?

**Output format:**
- Group findings by theme, not by source
- Lead each theme with a representative verbatim quote if available
- Note which themes appear across multiple sources (stronger signal)