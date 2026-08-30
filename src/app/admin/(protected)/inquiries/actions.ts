"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guard";

const UpdateInput = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "IN_CONVERSATION", "QUOTED", "ACCEPTED", "DECLINED", "CLOSED"]),
  adminNotes: z.string().max(4000).optional(),
});

export async function updateInquiry(formData: FormData) {
  await requireAdmin();

  const parsed = UpdateInput.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes") ?? undefined,
  });
  if (!parsed.success) return;

  const { id, ...data } = parsed.data;
  await db.commissionInquiry.update({
    where: { id },
    data: { ...data, adminNotes: data.adminNotes || null },
  });

  revalidatePath("/admin/inquiries");
}
