# Mello Studio

Next.js + TypeScript + Prisma + PostgreSQL + Tailwind.

## What's built

**Phase 1 — architecture.** Folder structure, fulfillment abstraction, money handling.

**Phase 2 — database.** Full Prisma schema with seed data.

**Phase 3 — authentication + admin foundation.** Database-backed sessions, protected `/admin`, overview dashboard with live counts.

**Phase 4 — artwork management.** Direct browser-to-Supabase uploads, automatic web/thumbnail derivatives, artwork list and editor with print-capability readout.

**Phase 5 — product catalog.** Create products from artwork, manage variants and pricing, publish. Product types are database rows, so adding hats later needs no code.

**Phase 11 (partial) — Printify import.** Verified against the official API reference. Lists your Printify shop's products, maps variants onto ours, records provider ids. Order submission is implemented but not yet triggered — that needs Stripe webhooks first.

**Phases 8 & 9 — Stripe Checkout and webhooks.** Order created before handoff with a full price snapshot, payment verified server-side, fulfilment submitted only from a verified event.

**Phase 13 — email.** Resend behind a provider interface. Order confirmations, shipping notices, commission alerts and acknowledgements, newsletter welcome with one-click unsubscribe.

**Commissions.** Public enquiry page with a staged explanation of how a commission works, plus an admin queue with status tracking. Enquiries are stored, not emailed — see the caveat below.

**Phase 7 — cart.** Server-side cart keyed to an httpOnly cookie, variant picker, quantity editing, live bag count.

**Phase 6 (partial) — public storefront.** Home, shop, apparel, prints, collections, product detail, about. All read from the database.

## What is deliberately not built

These are stubbed and labelled in the UI rather than faked:

| Area | Status | Phase |
|---|---|---|
| Printify integration | interface only, throws on call | 11 |

`PrintifyProvider` throws rather than returning fake success. The add-to-cart button is disabled and says why. Newsletter signup validates but stores nothing and says so.

## First admin user

There is no public sign-up route. The only way an account exists is if someone with database access creates one:

```bash
npm run admin:create
```

Then sign in at `/admin/login`. Re-running it on an existing email resets that password and signs out every existing session.

## Supabase setup

Create a project, then:

**Database.** Copy both connection strings from Project Settings → Database into `DATABASE_URL` (session pooler, port 6543) and `DIRECT_URL` (direct, port 5432). Prisma needs the direct one for migrations because PgBouncer cannot run DDL.

**Storage.** Create two buckets:

| Bucket | Public | Holds |
|---|---|---|
| `artwork-originals` | **No** | Master files, exactly as uploaded |
| `artwork-public` | **Yes** | Web images, thumbnails, mockups |

Originals must stay private. They are the only files that can produce a print later, and they should never be reachable from a browser.

**Keys.** `SUPABASE_ANON_KEY` is safe in the browser. `SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security and must stay server-side — it is only ever read inside `src/lib/storage/`.

## Setup

```bash
npm install
cp .env.example .env        # set DATABASE_URL at minimum
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Only `DATABASE_URL` is needed to run. Stripe and Printify keys can stay blank until their phases.

Local Postgres via Docker:

```bash
docker run --name mello-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mello_studio -p 5432:5432 -d postgres:16
```

Then `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mello_studio"`.

## Architecture notes

**Artwork is the spine.** `/apparel` and `/prints` are filtered views of one catalog, not separate trees. They share `CatalogPage`; only the category argument differs.

**Artwork and print files are separate records.** `Artwork` holds the concept; `ArtworkAsset` holds every file, tagged by `kind` and `cropLabel`. A hoodie chest print and a full-bleed poster are two assets on one artwork. Originals are never served to the browser.

**Collections are one table.** Null dates and null `editionLimit` mean a permanent series. Fill them in and it's a timed drop.

**The cart stores quantity, never price.** A cart line holds a variant id and a number. Every price is resolved server-side from the product and variant records at render and again at checkout. There is no price field for a client to tamper with, which makes price manipulation structurally impossible rather than something to validate against.

Cart mutations are scoped by the session cookie, so knowing an item id is not enough to change someone else's bag.

**Money is integer cents everywhere.** No floats, including in transit. `OrderItem` snapshots name, SKU, price and print-file URL at purchase, so changing a price later never rewrites history.

**Fulfillment is behind an interface.** Nothing outside `src/lib/fulfillment/` imports a provider SDK or knows which provider handled an order. Adding Printful means one new class and one registry entry.

**Uploads skip the server.** The browser asks for a signed credential, uploads the original straight to Supabase, then tells the server to process it. A serverless function on Netlify caps out around 6 MB of request body, so routing a 100 MB scan through one would simply fail. This way file size is irrelevant to the function.

**Originals are never touched.** The upload is stored byte-for-byte in the private bucket. Derivatives are separate `ArtworkAsset` rows built with sharp, and resizing uses `withoutEnlargement` so a small upload stays small rather than being upscaled into false sharpness.

**Auth is two layers.** `middleware.ts` runs on the edge and cannot reach the database, so it only checks whether a session cookie exists — enough to bounce anonymous traffic off `/admin`. The real check is `requireAdmin()` in the admin layout, which validates the session against the database. Never rely on the middleware alone.

Sessions are server-side: the cookie carries a random token, and only its SHA-256 hash is stored, so a database leak does not hand over live sessions. Passwords use Node's built-in scrypt — memory-hard, and no dependency to audit.

**Route groups keep the two shells apart.** `(site)` carries the storefront header and footer; `admin/(protected)` carries the admin chrome and the auth guard. `/admin/login` sits outside the protected group, otherwise the guard would redirect it to itself forever.

**Webhook idempotency** is enforced by a unique constraint on `(source, externalId)` in `WebhookEvent`, and `FulfillmentOrder.idempotencyKey` is unique — a retried webhook cannot create a second fulfillment request.

## Print capability

The artwork editor shows the largest print each original can honestly carry, at 300 DPI and at 150 DPI. Printful requires a minimum of 150 DPI for DTG and 300 DPI for paper products, and Printify recommends 300 DPI for most products, dropping to 120–150 DPI for large-format items viewed at a distance. The readout is there so it is obvious *before* a product is created whether a file can carry a poster.

## Adding a product

1. Upload artwork, publish it
2. **Make a product** from the artwork page
3. Pick a type, set your cost and retail price
4. Add variants — one per size/colour a customer can buy
5. Publish

A product cannot be published without at least one active variant, since that would put something on the site that can't be added to a bag. Products that appear in an order are unpublished rather than deleted, so order history stays intact.

The product editor warns when an artwork is too low-resolution for the print area of its product type — it compares the original's pixel dimensions against the type's print size at 300 DPI.

## Printify

Design products in Printify, then import them at `/admin/printify`. Structure and cost come from Printify; retail price and everything the customer sees stays ours.

Verified against the official API reference:

- Base URL `https://api.printify.com/v1/`, Bearer auth, **a `User-Agent` header is required on every request**
- The API does not support CORS, so all calls are server-side by design
- 600 requests/minute globally, with catalog endpoints capped at 100/minute; the client backs off and retries once on a 429
- Personal access tokens expire after one year

Scopes needed: `shops.read`, `catalog.read`, `products.read`, `orders.read`, `orders.write`, `webhooks.read`, `webhooks.write`. A 403 is almost always a missing scope, and the client says so rather than reporting a generic failure.

Variant options arrive as numeric option-value ids that have to be resolved against the product's `options` array — the import does that so variants store "Black / L" rather than `[2734, 18]`. Where a size costs more than the cheapest variant, the difference is carried into a per-variant price override.

## Commissions

`/commissions` explains the process and takes enquiries. They land in `/admin/inquiries` with a status pipeline: New → Talking → Quoted → Accepted / Declined / Closed.

An alert goes to `STUDIO_INBOX` with reply-to set to the enquirer, so replying from your inbox just works. The enquirer gets an acknowledgement.

The form uses a hidden honeypot field rather than a captcha. Bot submissions are accepted silently so the bot does not learn to adapt.

## No advertising

Deliberate. Display ads on product pages would serve competing print-on-demand shops into the middle of a purchase, and they conflict with the gallery positioning in the brief. Commissions and email are the revenue levers here instead.

## Payments

The order is written in `PENDING_PAYMENT` with a full price snapshot **before** the customer reaches Stripe. That means the amount we intend to charge exists independently of what Stripe reports back, and the webhook compares the two — a mismatch is recorded and fulfilment is refused.

**Only the webhook can mark an order paid.** The success URL is read-only; visiting it directly proves nothing, and a customer who closes the tab still gets their order processed.

Idempotency has two layers:

1. `WebhookEvent` has a unique index on `(source, externalId)`, so a redelivered Stripe event is recognised and skipped.
2. `FulfillmentOrder.idempotencyKey` is unique per order and provider, so even a race cannot produce two print jobs.

Fulfilment failure never fails the webhook. The money is taken and the order is valid, so a failed submission is recorded with its error and retried from `/admin/orders`.

Orders can mix providers — a hand-shipped original alongside a Printify tee — so items are grouped by provider and submitted separately. `MANUAL` items are marked submitted without an external call.

### Local webhook testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`. Without it the route rejects everything and no order will ever be paid.

In production, add the endpoint at `https://yourdomain/api/webhooks/stripe` and subscribe to `checkout.session.completed`, `checkout.session.expired`, and `charge.refunded`.

### Not done yet

Tax is not calculated. Stripe Tax needs configuring, and until then `taxCents` records whatever Stripe reports, which is zero. Talk to an accountant about nexus before selling at volume.

## Email

Resend, called over plain HTTP — one less dependency than the SDK. Everything sits behind an `EmailProvider` interface, so switching providers is one file.

| Trigger | To | Sent from |
|---|---|---|
| Payment verified | Customer | Stripe webhook |
| Provider reports shipped | Customer | Printify webhook |
| Commission enquiry | `STUDIO_INBOX` | Enquiry form |
| Commission enquiry | Enquirer | Enquiry form |
| Newsletter signup | Subscriber | Footer form |

**Email never fails a transaction.** `sendSafely` logs and swallows. A failed receipt must not roll back a paid order or lose an enquiry. `confirmationSentAt` and `shippingSentAt` guard against duplicate sends when a provider reports the same status repeatedly.

Templates are table-based with inline styles, because Outlook still ignores most CSS in a `<style>` block and flexbox is unusable in mail. Deliberately not how the rest of the site is built. Every message has a plain-text alternative.

### Domain setup — do this before sending anything real

Verify your sending domain in Resend and add the DKIM and SPF records it gives you at Porkbun. Sending from an unverified domain is the single most common reason mail lands in spam. `EMAIL_FROM` must be on the verified domain.

Consider a subdomain like `mail.yourdomain.com` so a deliverability problem never affects your main domain's reputation.

### Newsletter

Subscribers live in your own database, not a third-party list. Export to Mailchimp or Kit whenever you want — the list is yours, same principle as owning your product data. Unsubscribe is one click via an unguessable token, no login, no confirmation step.

There is no bulk-send feature yet. Composing and sending a newsletter to the whole list is a separate build.

## Known gap

`Collection` joins to `Artwork`, so products inherit their collection through artwork. A drop cannot currently contain just the hoodie from a piece while excluding the poster. Adding a product-level join later is additive, not a rewrite.

## Seed images

The six pieces in the seed are Mello's existing photos, cropped and colour-adjusted for display. They are 1–3 MP snapshots, fine for the web and **not usable as print files**. Real print files come in through the admin in Phase 4.
