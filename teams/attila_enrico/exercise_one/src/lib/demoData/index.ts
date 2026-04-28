/**
 * Demo-data lib layer — composition on top of the pure generator.
 *
 * Responsibilities:
 *   - `hasDemoDataForUser`: cheap read-only probe of the user's rows.
 *   - `createDemoDataForUser`: atomically inserts the full generated batch and
 *     writes one `demo_data_created` audit entry.
 *   - `removeDemoDataForUser`: atomically removes every `source === "demo"` row
 *     for the user (including soft-deleted ones — demo rows are transient test
 *     data we hard-remove) and writes one `demo_data_removed` audit entry when
 *     anything was removed.
 *
 * Locking: uses the in-process mutex `withLock` from `@/lib/db` to serialize
 * the read-modify-write step against other locked operations. Because
 * `writeDb` and `appendAuditEntry` each acquire the same lock internally,
 * calling them from inside `withLock` would deadlock. The implementation
 * therefore performs raw atomic file writes inside the lock (same tmp-rename
 * pattern `writeDb` uses), and then appends the audit entry in a separate
 * locked step via `appendAuditEntry`. The `hasDemoData` check for the create
 * path runs inside the DB-update lock so duplicate batches cannot be inserted
 * under concurrent calls.
 *
 * Purity: no `next/navigation`, no `@/lib/auth`, no `src/actions/*`. The action
 * layer composes on top and adds `revalidatePath`.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  readDb,
  withLock,
  type DB,
  type Transaction,
} from "@/lib/db";
import {
  appendAuditEntry,
  createDemoDataCreatedAuditEntry,
  createDemoDataRemovedAuditEntry,
} from "@/lib/audit";

import { generateDemoTransactions } from "./generator";
import type { Rng } from "./rng";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type CreateDemoDataResult =
  | { ok: true; count: number }
  | { ok: false; reason: "already_exists" };

export async function hasDemoDataForUser(userId: string): Promise<boolean> {
  const db = await readDb();
  return hasDemoRows(db, userId);
}

export async function createDemoDataForUser(
  userId: string,
  currency: string,
  opts: { now?: Date; rng?: Rng; target?: number } = {},
): Promise<CreateDemoDataResult> {
  const outcome = await withLock<CreateDemoDataResult>(async () => {
    const db = await readDb();
    if (hasDemoRows(db, userId)) {
      return { ok: false, reason: "already_exists" };
    }
    const batch = generateDemoTransactions({
      userId,
      currency,
      now: opts.now,
      rng: opts.rng,
      target: opts.target,
    });
    const next: DB = {
      ...db,
      transactions: [...db.transactions, ...batch],
    };
    await writeDbFile(next);
    return { ok: true, count: batch.length };
  });

  if (outcome.ok) {
    await appendAuditEntry(
      createDemoDataCreatedAuditEntry({ userId, count: outcome.count }),
    );
  }
  return outcome;
}

export async function removeDemoDataForUser(
  userId: string,
): Promise<{ count: number }> {
  const count = await withLock<number>(async () => {
    const db = await readDb();
    const kept: Transaction[] = [];
    let removed = 0;
    for (const tx of db.transactions) {
      if (tx.userId === userId && tx.source === "demo") {
        removed++;
        continue;
      }
      kept.push(tx);
    }
    if (removed === 0) return 0;
    const next: DB = { ...db, transactions: kept };
    await writeDbFile(next);
    return removed;
  });

  if (count > 0) {
    await appendAuditEntry(
      createDemoDataRemovedAuditEntry({ userId, count }),
    );
  }
  return { count };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function hasDemoRows(db: DB, userId: string): boolean {
  return db.transactions.some(
    (t) => t.userId === userId && t.source === "demo",
  );
}

/**
 * Atomically write the DB to disk. Mirrors `writeDb` from `@/lib/db` but
 * without re-acquiring the mutex (callers invoke this from inside `withLock`
 * and the mutex is not re-entrant).
 */
async function writeDbFile(next: DB): Promise<void> {
  const p = getDbPath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, p);
}

function getDbPath(): string {
  return process.env.DB_PATH ?? path.join(process.cwd(), "data", "db.json");
}
