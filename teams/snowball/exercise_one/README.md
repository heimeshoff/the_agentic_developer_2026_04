# Snowball

A small personal-finance app for keeping a household budget without the friction of a spreadsheet.

## What it's for

Replacing a paper spreadsheet that my family barely touches. The goal is a quick-glance overview of:

- **Income** — regular and one-off.
- **Expenses** — regular vs one-off.
- **Savings & investments** — balances and progress toward goals.
- **Debts & loans** — what we owe and how repayment is going.
- **Net worth** — over time, derived from the above.

Built for **one household, one person entering the data**. Every design choice points at the same question: *can I add a transaction in ten seconds without thinking?*

## How to run it

Requires [pnpm](https://pnpm.io/) and a recent Node.

```bash
pnpm install
pnpm dev          # local dev server
pnpm build        # production build to ./dist
pnpm preview      # serve the production build locally
```

To deploy: copy `dist/` onto your home server and serve it with nginx, caddy, or whatever you already use. There is no backend to run.

## Where does my data live?

In your browser, locally. The app is a static site — nothing is sent anywhere.

Because the data lives in the browser, clearing browser storage wipes your finances. So:

- **Export regularly** from the in-app menu — you get a JSON file.
- **Import** the same file on another device or after a browser reset.

That export file is also the only way to move between browsers or devices.

## Tech

TypeScript · Vite · pnpm. No server, no database, no account.

## Status

Early. Workshop scaffold — expect rough edges. Budgeting style right now is plain track-and-review; harder guardrails (envelopes, category caps) may come later.
