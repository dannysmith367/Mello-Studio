import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Deletes carts untouched for 30 days. Safe to run on a schedule. */
async function main() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await db.cart.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  });
  console.log(`Removed ${count} abandoned cart(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
