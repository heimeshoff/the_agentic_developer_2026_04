"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createDemoDataForUser,
  removeDemoDataForUser,
} from "@/lib/demoData";

export async function createDemoDataAction(): Promise<
  | { ok: true; count: number }
  | { ok: false; error: "already_exists"; message: string }
> {
  const { user } = await requireSession();
  const result = await createDemoDataForUser(user.id, user.currency);
  if (!result.ok) {
    return {
      ok: false,
      error: "already_exists",
      message: "Demo data already exists. Remove it first.",
    };
  }
  revalidatePath("/app");
  return { ok: true, count: result.count };
}

export async function removeDemoDataAction(): Promise<{
  ok: true;
  count: number;
}> {
  const { user } = await requireSession();
  const result = await removeDemoDataForUser(user.id);
  revalidatePath("/app");
  return { ok: true, count: result.count };
}
