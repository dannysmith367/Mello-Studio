import "server-only";
import { z } from "zod";

const BASE_URL = "https://api.printify.com/v1";

/**
 * Printify HTTP client.
 *
 * Verified against the official API reference:
 *  - Base URL https://api.printify.com/v1/, Bearer auth
 *  - A User-Agent header is required on every request
 *  - The API does not support CORS, so this is server-only by design
 *  - 600 requests/minute globally; catalog endpoints additionally capped
 *    at 100/minute. Both return 429 when exceeded.
 *
 * Personal access tokens expire after one year.
 */
export class PrintifyClient {
  constructor(
    private readonly token: string,
    private readonly shopId: string
  ) {}

  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    init?: RequestInit,
    attempt = 0
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json;charset=utf-8",
        // Required by Printify on every request.
        "User-Agent": "MelloStudio/1.0",
        ...init?.headers,
      },
      cache: "no-store",
    });

    // Back off and retry once on a rate limit rather than failing the import.
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "5");
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 30) * 1000));
      return this.request(path, schema, init, attempt + 1);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new PrintifyError(response.status, path, body.slice(0, 400));
    }

    const json = await response.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new Error(
        `Unexpected response shape from ${path}: ${parsed.error.issues[0]?.message ?? "invalid"}`
      );
    }
    return parsed.data;
  }

  async listShops() {
    return this.request("/shops.json", ShopListSchema);
  }

  /** Walks every page. Printify paginates with current_page / last_page. */
    async listProducts() {
const all: z.input<typeof ProductPageSchema>["data"] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const result = await this.request(
        `/shops/${this.shopId}/products.json?page=${page}&limit=50`,
        ProductPageSchema
      );
      all.push(...result.data);
      lastPage = result.last_page ?? 1;
      page += 1;
    } while (page <= lastPage && page <= 20);

    return all;
  }

  async getProduct(productId: string) {
    return this.request(
      `/shops/${this.shopId}/products/${productId}.json`,
      ProductSchema
    );
  }

  async createOrder(payload: unknown) {
    return this.request(`/shops/${this.shopId}/orders.json`, OrderCreatedSchema, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getOrder(orderId: string) {
    return this.request(`/shops/${this.shopId}/orders/${orderId}.json`, OrderSchema);
  }

  /**
   * POSTs a publish callback that returns 200 with no body on success,
   * which is why this bypasses the JSON-parsing request() helper. Shared by
   * publishingSucceeded and publishingFailed — the only difference between
   * them is the endpoint and the payload shape.
   */
  private async postPublishCallback(path: string, body: unknown): Promise<void> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json;charset=utf-8",
        "User-Agent": "MelloStudio/1.0",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      throw new PrintifyError(response.status, path, responseBody.slice(0, 400));
    }
  }

  /**
   * Confirms a product's publish to Printify.
   *
   * Every product pushed to a Printify shop is created in a "publishing"
   * state and waits for the connected sales channel to call this endpoint —
   * without it, the product stays stuck mid-publish in Printify's UI even
   * though it already exists on our storefront.
   */
  async publishingSucceeded(
    productId: string,
    external: { id: string; handle: string }
  ): Promise<void> {
    return this.postPublishCallback(
      `/shops/${this.shopId}/products/${productId}/publishing_succeeded.json`,
      { external }
    );
  }

  /**
   * Releases a product stuck in the "publishing" lock without confirming
   * it — the other half of the same handshake as publishingSucceeded, for
   * when a publish should never have been treated as complete.
   */
  async publishingFailed(productId: string, reason: string): Promise<void> {
    return this.postPublishCallback(
      `/shops/${this.shopId}/products/${productId}/publishing_failed.json`,
      { reason }
    );
  }
}

export class PrintifyError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: string
  ) {
    super(
      status === 401
        ? "Printify rejected the API token. It may be expired — tokens last one year."
        : status === 403
          ? `Printify denied access to ${path}. This is almost always a missing token scope.`
          : `Printify returned ${status} for ${path}. ${body}`
    );
    this.name = "PrintifyError";
  }
}

// --- Schemas -------------------------------------------------------------
// Kept permissive with .passthrough() so an added field upstream does not
// break the import. Only what we actually consume is required.

const ShopListSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    sales_channel: z.string().optional(),
  })
);

const VariantSchema = z
  .object({
    id: z.number(),
    sku: z.string().optional(),
    title: z.string().optional(),
    /** Printify returns money as integer cents, same as we store it. */
    cost: z.number().optional(),
    price: z.number().optional(),
    is_enabled: z.boolean().optional(),
    is_default: z.boolean().optional(),
    options: z.array(z.number()).optional(),
  })
  .passthrough();

const OptionSchema = z
  .object({
    name: z.string(),
    type: z.string().optional(),
    values: z.array(
      z
        .object({
          id: z.number(),
          title: z.string(),
          colors: z.array(z.string()).optional(),
        })
        .passthrough()
    ),
  })
  .passthrough();

const ImageSchema = z
  .object({
    src: z.string(),
    variant_ids: z.array(z.number()).optional(),
    position: z.string().optional(),
    is_default: z.boolean().optional(),
  })
  .passthrough();

const ProductSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    blueprint_id: z.number().optional(),
    print_provider_id: z.number().optional(),
    variants: z.array(VariantSchema).default([]),
    options: z.array(OptionSchema).default([]),
    images: z.array(ImageSchema).default([]),
    visible: z.boolean().optional(),
  })
  .passthrough();

const ProductPageSchema = z
  .object({
    data: z.array(ProductSchema),
    current_page: z.number().optional(),
    last_page: z.number().optional(),
    total: z.number().optional(),
  })
  .passthrough();

const OrderCreatedSchema = z.object({ id: z.string() }).passthrough();

const OrderSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    shipments: z
      .array(
        z
          .object({
            carrier: z.string().optional(),
            number: z.string().optional(),
            url: z.string().optional(),
            delivered_at: z.string().nullish(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();

export type PrintifyProduct = z.infer<typeof ProductSchema>;
export type PrintifyVariant = z.infer<typeof VariantSchema>;
export type PrintifyOption = z.infer<typeof OptionSchema>;
