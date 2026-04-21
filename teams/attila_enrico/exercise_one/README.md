# Personal Finance — Walking Skeleton

Team **attila_enrico**, Exercise One of *The Agentic Developer (April 2026)*.

A Tier-1 Next.js app: register with an email, password, and preferred currency; log in; add income or expense transactions; see a running balance and a list of your entries. No charts, no filters, no edit/delete — those are deferred to later tiers.

## Stack

- Next.js 15 (App Router) + TypeScript + React 19
- Tailwind CSS (minimal monochrome theme, expense-red / income-green accents)
- Server Actions for every mutation (no hand-written `/api/*` routes)
- JSON file storage (`data/db.json`) with atomic-rename writes and an in-process mutex
- `bcryptjs` for passwords, `jose` for JWT session tokens, `httpOnly` cookie
- `zod` for input validation, `nanoid` for IDs
- `vitest` for unit tests

## Quick start

```bash
cd teams/attila_enrico/exercise_one
npm install
npm run dev
```

Visit <http://localhost:3000> — redirects to `/login` if you're signed out, `/app` if you're signed in.

`.env.local` with an `AUTH_SECRET` is created by the scaffold script. If you need a fresh one:

```bash
node -e "console.log('AUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" > .env.local
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Project layout

```
src/
├── actions/               Server Actions — thin wrappers over lib/
│   ├── auth.ts            register / login / logout
│   └── transactions.ts    addTransactionAction
├── app/                   Next.js App Router
│   ├── layout.tsx         root layout (Inter font)
│   ├── globals.css
│   ├── page.tsx           session-aware redirect
│   ├── error.tsx          global error boundary
│   ├── login/             /login
│   ├── register/          /register
│   └── app/               /app (protected by requireSession)
│       ├── layout.tsx     chrome + logout
│       ├── page.tsx       balance + transaction list
│       ├── AddTransactionForm.tsx   client component, kind/category reactivity
│       ├── LogoutButton.tsx
│       └── formatDate.ts
├── components/            shared form primitives
│   ├── Field.tsx
│   ├── FormError.tsx
│   └── SubmitButton.tsx
└── lib/                   pure, unit-tested logic
    ├── auth.ts            crypto + flows + session cookies
    ├── categories.ts      hardcoded category lists + guards
    ├── currencies.ts      allowlist + Intl-based formatter
    ├── db.ts              atomic JSON store
    └── transactions.ts    addTransactionForUser flow

data/db.json               created on first write (gitignored)
tests/*.test.ts            vitest suite
```

## Data model

```ts
type User = {
  id: string            // nanoid
  email: string         // lowercased, unique
  passwordHash: string  // bcrypt cost 10
  currency: string      // ISO 4217 from the allowlist
  createdAt: string     // ISO timestamp
}

type Transaction = {
  id: string
  userId: string
  kind: "expense" | "income"
  amount: number        // positive; sign comes from `kind`
  title: string         // 1–120 chars
  timestamp: string     // ISO timestamp
  category: string      // must belong to the list for the given kind
}
```

### Categories (hardcoded)

- **Expense:** Groceries, Utilities, Rent, Transport, Dining, Entertainment, Healthcare, Other
- **Income:** Salary, Freelance, Investment, Gift, Other

### Currencies

Popular-first allowlist: EUR, USD, GBP, HUF, CHF, JPY, CAD, AUD, NOK, SEK, DKK, PLN, CZK.

## Auth model

- Password: bcrypt cost 10, minimum 8 characters.
- Session: JWT (HS256 via `jose`), 7-day expiry, stored in an `httpOnly`, `sameSite=lax` cookie named `session`.
- `AUTH_SECRET` must be ≥ 32 characters; validated at module import time.
- Login and register use a generic "Invalid email or password" / "Unable to register" message on failure — no user enumeration.

## Tests

31 unit tests across `lib/` and the pure parts of `actions/`:

```
categories    5 tests
currencies    4 tests
db            7 tests
auth          10 tests (5 crypto + 5 flow)
transactions  5 tests
```

UI components and E2E are intentionally untested at Tier 1 — see the design spec for the rationale.

## Scope

**In scope (Tier 1 — shipped):** register, login, logout, add transaction, list, balance, monochrome UI.

**Deferred:**
- Tier 2: filtering, sorting, dashboard charts, richer empty states
- Tier 3: budgets, edit/delete, user-defined categories, CSV import, monthly summary
- Tier 4: multi-currency FX, recurring transactions, LLM insights, PWA

## Design + plan

The full design spec and implementation plan live alongside this code:

- `docs/superpowers/specs/2026-04-21-personal-finance-skeleton-design.md`
- `docs/superpowers/plans/2026-04-21-personal-finance-skeleton-plan.md`

## Workshop caveats

This is workshop code, not production. A few conscious trade-offs:

- **JSON file storage:** fine inside a single `next dev` process; not multi-process-safe.
- **No migrations:** schema changes require editing `data/db.json` by hand.
- **JWT-in-cookie:** simple, but logout only revokes the cookie — the token stays valid until it expires if copied elsewhere.
- **No rate limiting / CSRF hardening:** acceptable for a local-only skeleton; would need work before anything public.
