# Personal Finance App — Walking Skeleton (Tier 1)

**Date:** 2026-04-21
**Team:** attila_enrico
**Exercise:** exercise_one
**Status:** Design approved, pending implementation plan

---

## 1. Goal & scope

Build a **walking skeleton** of a personal finance web app: users can register (email + password, pick a currency), log in, add a transaction (income or expense), and see their transactions in a simple list. Nothing more.

Explicit non-goals for this spec (deferred to a later tier):
- Filtering or sorting the transaction list
- Charts or graphs
- Editing / deleting transactions
- Budgets, recurring transactions, multi-currency FX
- User-defined categories
- Mobile apps, PWA, offline
- Deployment (runs on `localhost` only)

## 2. Stack decisions

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Data flow | React Server Components + Server Actions (no REST handlers) |
| Storage | Single JSON file on disk (`data/db.json`) |
| Password hashing | `bcryptjs` (pure JS — avoids native build issues on Windows) |
| Session | Signed JWT via `jose`, stored in an `httpOnly` cookie |
| Validation | `zod` |
| Tests | `vitest` |
| Runtime | Node (not Edge — needs `fs` + bcrypt) |

Rationale: the workshop brief asks for "vibe code" over production polish. JSON + Server Actions minimizes ceremony; the app is still fully functional and safe-ish without pulling in a database or auth framework.

## 3. Repository layout

```
teams/attila_enrico/exercise_one/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.local                   # AUTH_SECRET (gitignored)
├── .gitignore                   # data/, .env.local, node_modules, .next
├── data/
│   └── db.json                  # created on first write
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx             # redirects based on session
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── app/
│   │       ├── layout.tsx       # requires session, renders app chrome
│   │       └── page.tsx         # balance + list + add form
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── categories.ts
│   │   └── currencies.ts
│   └── actions/
│       ├── auth.ts
│       └── transactions.ts
└── tests/
    ├── db.test.ts
    ├── auth.test.ts
    └── actions.test.ts
```

The `lib/` layer is pure, testable logic. The `actions/` layer wraps it with Next.js concerns (`cookies()`, `redirect()`, `revalidatePath()`).

## 4. Data model

### 4.1 `db.json` shape

```ts
type DB = {
  users: Array<{
    id: string              // nanoid
    email: string           // lowercased, unique
    passwordHash: string    // bcrypt
    currency: string        // ISO 4217 code from the allowlist
    createdAt: string       // ISO timestamp
  }>
  transactions: Array<{
    id: string              // nanoid
    userId: string
    kind: 'expense' | 'income'
    amount: number          // positive, up to 2 decimal places
    title: string           // 1–120 chars
    timestamp: string       // ISO timestamp
    category: string        // must be in the list for the matching `kind`
  }>
}
```

### 4.2 Categories (hardcoded for Tier 1)

**Expense:** Groceries, Utilities, Rent, Transport, Dining, Entertainment, Healthcare, Other
**Income:** Salary, Freelance, Investment, Gift, Other

A transaction's `category` must belong to the list that matches its `kind`. User-defined categories are a Tier 2+ concern.

### 4.3 Currencies

Popular-first ordered allowlist (shown in that order in the signup `<select>`):
EUR, USD, GBP, HUF, CHF, JPY, CAD, AUD, NOK, SEK, DKK, PLN, CZK.

The currency code is stored on the user; amounts are rendered with `Intl.NumberFormat('en', { style: 'currency', currency })`, which produces the symbol automatically (e.g. `€42.10`, `$42.10`, `Ft42`).

## 5. Data layer (`lib/db.ts`)

- `readDb()`: if `data/db.json` doesn't exist, return `{ users: [], transactions: [] }` without writing. If present, parse and validate the envelope with Zod — corrupt data fails loudly (throws) rather than being silently "fixed".
- `writeDb(next)`: **atomic** — `JSON.stringify(next, null, 2)` → write to `data/db.json.tmp` → `fs.rename` over `data/db.json`. An in-module `async` mutex serializes concurrent calls (Server Actions can overlap even on a single Node process).
- Typed query helpers:
  - `findUserByEmail(email)`
  - `createUser({ email, passwordHash, currency })`
  - `listTransactionsByUser(userId)` (most recent first)
  - `addTransaction(tx)`

## 6. Auth (`lib/auth.ts` + `actions/auth.ts`)

### 6.1 Primitives

- **Passwords:** `bcryptjs`, cost factor 10. Minimum password length: 8 characters.
- **Tokens:** JWT signed with HS256 via `jose`. Payload: `{ sub: userId, iat, exp }`. 7-day expiry.
- **Secret:** `process.env.AUTH_SECRET`, minimum 32 characters; validated at module import time — the app fails to start if missing or too short.
- **Cookie:** name `session`, flags `httpOnly`, `sameSite=lax`, `secure` in prod only, `path=/`.
- **Session helpers:**
  - `createSession(userId)` — writes the cookie
  - `getSession()` — reads + verifies cookie; returns `{ user }` or `null`
  - `requireSession()` — returns `{ user }` or `redirect('/login')`
  - `clearSession()` — deletes the cookie

### 6.2 Server actions

- **`registerAction(formData)`**
  1. Zod-validate `{ email, password, currency }`.
  2. If validation fails, return `{ ok: false, errors }`.
  3. If a user with that email already exists, return a single generic top-level error (no user enumeration).
  4. Hash password, create user, issue session.
  5. `redirect('/app')`.
- **`loginAction(formData)`**
  1. Zod-validate `{ email, password }`.
  2. Look up user; compare bcrypt. On any failure, return a single "Invalid email or password" error (same message for both "no such user" and "wrong password").
  3. Issue session, `redirect('/app')`.
- **`logoutAction()`**
  1. Clear the session cookie, `redirect('/login')`.

## 7. Transactions (`actions/transactions.ts`)

- **`addTransactionAction(formData)`**
  1. `requireSession()`.
  2. Zod-validate `{ kind, amount>0, title 1–120, timestamp, category }`.
  3. Reject if `category` is not in the allowed list for the given `kind`.
  4. Append to DB via `addTransaction`.
  5. `revalidatePath('/app')`.

## 8. UI & visual system

### 8.1 Design tokens (Tailwind)

| Token | Value | Purpose |
| --- | --- | --- |
| `bg` | `#fafafa` | Page background |
| `surface` | `#ffffff` | Cards, inputs |
| `text` | `#111111` | Primary text |
| `muted` | `#6b7280` | Secondary text |
| `border` | `#eeeeee` | Hairlines |
| `expense` | `#c43a3a` | Expense amounts |
| `income` | `#2a8a5f` | Income amounts |

Font: **Inter** via `next/font/google`, loaded once in the root layout. No shadows, no gradients — whitespace and borders do the work. Max content width: `max-w-3xl`. Primary button: solid `text` on `surface` text color; secondary: outlined.

### 8.2 Pages

- **`/login`** — centered card (`max-w-sm`): email + password + submit. "No account? Register →" link underneath.
- **`/register`** — centered card: email, password, currency `<select>`. "Already have an account? Log in" link.
- **`/`** — redirects: session → `/app`, else → `/login`.
- **`/app`** — protected by `requireSession()` in the segment layout. Two-panel on desktop (`grid md:grid-cols-[1fr_2fr]`), stacked on mobile.
  - **Left panel (sticky on desktop):** add-transaction form. `kind` toggle (Expense / Income) determines which categories appear in the `category` select (reactively, via a Client Component wrapper). Fields: `amount` (number, step 0.01), `title`, `timestamp` (datetime-local, default = now), `category`. Submit button.
  - **Right panel:** header showing the word "Balance", the computed net in the user's currency, and the user's email + a logout button aligned right. Below: the transaction list, most recent first. Each row: title (bold), `category · date` (muted, where `date` is rendered as "Today" for today, "Yesterday" for yesterday, and `Mon D` or `Mon D, YYYY` otherwise), amount right-aligned in expense/income color with `−` or `+` prefix.
- **Empty state** for the list: "No transactions yet — add your first one." in muted text.

## 9. Error handling

- Server actions return either `{ ok: true }` (followed by a `redirect` where appropriate) or `{ ok: false, errors: { _form?: string[], fieldName?: string[] } }`.
- Client forms use `useFormState` to render inline field errors under inputs; `_form` errors render as a single muted-red line above the form.
- Auth errors use only `_form` (to avoid leaking which field was wrong).
- Missing or short `AUTH_SECRET` → throw at import time (dev startup fails loudly).
- Corrupt `db.json` → Zod parse throws with the offending file path in the message.
- Unhandled runtime errors → Next.js `error.tsx` route boundary renders a minimal "Something went wrong. Try again." card.

## 10. Testing strategy

The workshop brief says "vibe code" / "favour breadth over polish", so this spec deviates from the global 80%-coverage rule by design. Tests are focused on the logic that is risky to get wrong and cheap to test:

- `lib/db.ts` — read/write round-trip, atomic rename behaviour, empty-file bootstrap.
- `lib/auth.ts` — password hash/verify, JWT sign/verify, expiry handling.
- `actions/auth.ts` — register happy path + duplicate-email rejection; login happy path + wrong-password rejection.
- `actions/transactions.ts` — add happy path + "category not in list for kind" rejection.
- UI components — not tested at Tier 1 (no logic worth testing).
- E2E (Playwright) — not in scope at Tier 1.

Target: roughly 70% line coverage on `lib/` + `actions/`; `app/` is effectively untested. If the team wants strict 80% including UI component tests, the plan can be extended with React Testing Library specs.

## 11. Risks & open questions

- **Concurrent writes:** the mutex works within a single Node process (which `next dev` is). If the app ever runs in multi-process mode, the JSON file approach needs replacing. Tier-1 acceptable.
- **No migrations:** schema changes require a manual edit to `db.json` during the workshop. Acceptable for a throwaway skeleton.
- **bcrypt cost 10:** fine for local dev; a production deployment should revisit.
- **JWT in cookie vs DB-backed session:** we chose the simpler path (JWT). Logout revokes the cookie but the token remains valid until expiry if copied elsewhere — acceptable for a local-only workshop app.
- **Server Actions + Client Component category select:** the kind→category reactivity needs a small Client Component wrapping the form. Straightforward, called out here so the plan accounts for it.

## 12. Out of scope (future tiers — not part of this spec)

- Tier 2: filtering/sorting, dashboard with charts (donut by category, line over time), shadcn/ui components, polished empty states.
- Tier 3: budgets, monthly summary, edit/delete, user-defined categories, CSV import.
- Tier 4: multi-currency FX, recurring transactions, LLM-generated insights, PWA, share links.
