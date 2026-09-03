try {
  process.loadEnvFile(); // reads .env into process.env; not on by default outside Next
} catch {
  // Fine if the vars are already in the environment some other way.
}

/**
 * One-off: releases every Printify product stuck in the "publishing" lock.
 *
 * Printify puts a product in this state the moment Publish is clicked and
 * waits indefinitely for the connected sales channel to call back with
 * publishing_succeeded or publishing_failed. Our storefront only ever sends
 * that callback from the admin import flow (see printify/actions.ts), so
 * anything published from Printify's own dashboard — or an import that
 * failed before that callback ran — stays locked forever without this.
 *
 * Self-contained rather than importing src/lib/fulfillment/printify/client —
 * that module starts with `import "server-only"`, which Next.js quietly
 * no-ops inside its own bundler but which throws for real under plain
 * tsx/node, so it can't be reused from a standalone script as-is.
 *
 *   npm run printify:unstick
 */

const BASE_URL = "https://api.printify.com/v1";

type PrintifyProduct = { id: string; title: string };
type ProductPage = { data: PrintifyProduct[]; current_page?: number; last_page?: number };

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json;charset=utf-8",
    // Required by Printify on every request.
    "User-Agent": "MelloStudio/1.0",
  };
}

async function listAllProducts(token: string, shopId: string): Promise<PrintifyProduct[]> {
  const all: PrintifyProduct[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await fetch(
      `${BASE_URL}/shops/${shopId}/products.json?page=${page}&limit=50`,
      { headers: headers(token), cache: "no-store" }
    );
    if (!response.ok) {
      throw new Error(`Printify returned ${response.status} listing products: ${await response.text()}`);
    }

    const json = (await response.json()) as ProductPage;
    all.push(...json.data);
    lastPage = json.last_page ?? 1;
    page += 1;
  } while (page <= lastPage);

  return all;
}

async function releaseProduct(token: string, shopId: string, productId: string): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/shops/${shopId}/products/${productId}/publishing_failed.json`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ reason: "Cancelled" }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Printify returned ${response.status}: ${await response.text()}`);
  }
}

async function main() {
  const token = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!token || !shopId) {
    console.error("Set PRINTIFY_API_KEY and PRINTIFY_SHOP_ID in .env first.");
    process.exit(1);
  }

  const products = await listAllProducts(token, shopId);
  console.log(`Found ${products.length} product(s) in shop ${shopId}.\n`);

  let released = 0;
  let failed = 0;

  for (const product of products) {
    try {
      await releaseProduct(token, shopId, product.id);
      console.log(`✓ Released — ${product.title} (${product.id})`);
      released++;
    } catch (error) {
      console.log(
        `✗ Not released — ${product.title} (${product.id}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      failed++;
    }
  }

  console.log(`\nDone: ${released} released, ${failed} failed, ${products.length} total.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
