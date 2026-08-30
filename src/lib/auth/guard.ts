import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";

/**
 * The real authorization check. Middleware only sees whether a cookie exists;
 * this verifies the session against the database and is what every admin
 * route actually depends on.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}
