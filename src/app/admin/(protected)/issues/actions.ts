"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

const UpdateInput = z.object({
  id: z.string().min(1),
  status: z.enum([
    "NEW",
    "CLAIM_FILED",
    "REPLACEMENT_ORDERED",
    "REFUNDED",
    "RESOLVED",
    "DECLINED",
  ]),
  internalNotes: z.string().max(4000).optional(),
});

export async function updateIssue(formData: FormData) {
  await requireAdmin();

  const parsed = UpdateInput.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    internalNotes: formData.get("internalNotes") ?? undefined,
  });
  if (!parsed.success) return;

  const { id, ...data } = parsed.data;
  await db.orderIssue.update({
    where: { id },
    data: { ...data, internalNotes: data.internalNotes || null },
  });

  revalidatePath("/admin/issues");
}
