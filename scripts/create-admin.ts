import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const db = new PrismaClient();

/**
 * Creates or updates an admin user.
 *
 *   npm run admin:create
 *
 * There is no public sign-up route, by design — the only way an account
 * exists is if someone with database access runs this.
 */
async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  const email = (await rl.question("Email: ")).trim().toLowerCase();
  const name = (await rl.question("Name (optional): ")).trim();
  const password = (await rl.question("Password: ")).trim();
  rl.close();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("That is not a valid email address.");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Use at least 12 characters. This is the only door in.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, name: name || undefined },
    create: { email, name: name || undefined, passwordHash, role: "ADMIN" },
  });

  // Any existing sessions belong to the old password.
  const removed = await db.session.deleteMany({ where: { userId: user.id } });

  console.log(`\nAdmin ready: ${user.email}`);
  if (removed.count > 0) {
    console.log(`Signed out ${removed.count} existing session(s).`);
  }
  console.log("Sign in at /admin/login\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
