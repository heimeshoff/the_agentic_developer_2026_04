# Decisions

Architecture and library choices made during development, with rationale.

## Stack

| Choice | Alternatives considered | Why |
|--------|------------------------|-----|
| Vite + TypeScript | CRA, Parcel | Fast builds, native TS, standard for 2025 SPAs |
| Dexie 4 + dexie-react-hooks | raw IndexedDB, localForage | `useLiveQuery` gives reactive DB queries without any extra state layer |
| React 19, no UI library | MUI, shadcn, Tailwind | Keeps the bundle small; inline styles are fine for a single-user local app |
| No router | React Router, TanStack Router | M1 is single-page; add routing when M2 introduces a real second view |
| Local `useState` only | Zustand, Context | No cross-component sharing needed yet; revisit at M2/M3 |

## Code structure

- **Single `App.tsx` for M1** — deliberate. Splitting components before the data model stabilises adds churn. Refactor when M2 introduces a dashboard view.
- **`format.ts` self-test** — inline assertion on module load to catch locale regressions without a test framework.
- **Export format `{ version: 1, transactions: [...] }`** — versioned envelope so future imports can migrate older exports.

## Out-of-scope decisions (confirmed, do not revisit silently)

- No multi-user, no auth, no logins
- No bank API / CSV import
- No multi-currency
- No mobile packaging
- No cloud sync

Any of the above requires explicit user confirmation before touching.
