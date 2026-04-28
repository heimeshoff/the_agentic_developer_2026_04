import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TransactionSchema, withLock } from "@/lib/db";

// Transaction-scoped audit variants: one row of the transactions collection
// was created, updated, soft-deleted, or restored. These carry the full
// before/after snapshots plus the `transactionId` they reference.
const TransactionAuditBase = {
  id: z.string(),
  transactionId: z.string(),
  userId: z.string(),
  at: z.string(),
  before: TransactionSchema.nullable(),
  after: TransactionSchema.nullable(),
};

const CreateAuditEntrySchema = z.object({
  ...TransactionAuditBase,
  action: z.literal("create"),
});

const UpdateAuditEntrySchema = z.object({
  ...TransactionAuditBase,
  action: z.literal("update"),
});

const DeleteAuditEntrySchema = z.object({
  ...TransactionAuditBase,
  action: z.literal("delete"),
});

const RestoreAuditEntrySchema = z.object({
  ...TransactionAuditBase,
  action: z.literal("restore"),
});

// Demo-data audit variants: batch-level entries that record a bulk create /
// bulk remove of demo rows for a user. They deliberately omit
// `transactionId`, `before`, and `after` because no single row is referenced.
const DemoDataCreatedAuditEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  at: z.string(),
  action: z.literal("demo_data_created"),
  count: z.number(),
});

const DemoDataRemovedAuditEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  at: z.string(),
  action: z.literal("demo_data_removed"),
  count: z.number(),
});

export const AuditEntrySchema = z.discriminatedUnion("action", [
  CreateAuditEntrySchema,
  UpdateAuditEntrySchema,
  DeleteAuditEntrySchema,
  RestoreAuditEntrySchema,
  DemoDataCreatedAuditEntrySchema,
  DemoDataRemovedAuditEntrySchema,
]);

const AuditLogSchema = z.array(AuditEntrySchema);

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

// Narrow helper types for the transaction-scoped subset, so legacy callers
// that build `create` / `update` / `delete` / `restore` entries keep their
// existing type signature.
type TransactionAuditAction = "create" | "update" | "delete" | "restore";
type TransactionAuditEntry = Extract<AuditEntry, { action: TransactionAuditAction }>;

export function getAuditPath(): string {
  return process.env.AUDIT_PATH ?? path.join(process.cwd(), "data", "audit.json");
}

export async function readAuditLog(): Promise<AuditEntry[]> {
  const p = getAuditPath();
  try {
    const raw = await fs.readFile(p, "utf8");
    try {
      return AuditLogSchema.parse(JSON.parse(raw));
    } catch (err) {
      throw new Error(`Corrupt or invalid ${p}: ${(err as Error).message}`);
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  const validated = AuditEntrySchema.parse(entry);
  await withLock(async () => {
    const p = getAuditPath();
    let current: AuditEntry[];
    try {
      const raw = await fs.readFile(p, "utf8");
      try {
        current = AuditLogSchema.parse(JSON.parse(raw));
      } catch (err) {
        throw new Error(`Corrupt or invalid ${p}: ${(err as Error).message}`);
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        current = [];
      } else {
        throw err;
      }
    }
    const next = [...current, validated];
    await fs.mkdir(path.dirname(p), { recursive: true });
    const tmp = `${p}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
    await fs.rename(tmp, p);
  });
}

export function createAuditEntry(
  partial: Omit<TransactionAuditEntry, "id" | "at"> & { id?: string; at?: string },
): AuditEntry {
  const entry: AuditEntry = {
    id: partial.id ?? nanoid(),
    transactionId: partial.transactionId,
    userId: partial.userId,
    action: partial.action,
    at: partial.at ?? new Date().toISOString(),
    before: partial.before,
    after: partial.after,
  };
  return AuditEntrySchema.parse(entry);
}

export function createDemoDataCreatedAuditEntry(
  partial: { userId: string; count: number; id?: string; at?: string },
): AuditEntry {
  const entry: AuditEntry = {
    id: partial.id ?? nanoid(),
    userId: partial.userId,
    action: "demo_data_created",
    at: partial.at ?? new Date().toISOString(),
    count: partial.count,
  };
  return AuditEntrySchema.parse(entry);
}

export function createDemoDataRemovedAuditEntry(
  partial: { userId: string; count: number; id?: string; at?: string },
): AuditEntry {
  const entry: AuditEntry = {
    id: partial.id ?? nanoid(),
    userId: partial.userId,
    action: "demo_data_removed",
    at: partial.at ?? new Date().toISOString(),
    count: partial.count,
  };
  return AuditEntrySchema.parse(entry);
}
