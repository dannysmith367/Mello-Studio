"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

const LoginInput = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(400),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) return { error: "Enter a valid email and password." };

  const { email, password, next } = parsed.data;
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

  // Same message either way, so this can't be used to discover which
  // email addresses have accounts.
  const FAILED = { error: "Email or password is incorrect." };
  if (!user) return FAILED;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return FAILED;

  const headerList = await headers();
  await createSession(user.id, headerList.get("user-agent") ?? undefined);
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Only relative paths, so ?next= can't be used as an open redirect.
  const target = next && next.startsWith("/admin") ? next : "/admin";
  redirect(target);
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
