import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Deletes expired sessions. Safe to run on a schedule. */
async function main() {
  const { count } = await db.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`Removed ${count} expired session(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
