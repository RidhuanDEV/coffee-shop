# Toko Kopi implementation

## Architecture and delivered behavior

- Frontend: React 19, Vite 8, React Router, Tailwind 4, existing UI primitives, TanStack Query, Zustand, react-hook-form, Zod, and i18next. Feature folders are `storefront`, `ordering`, and `management`. Cross-feature API contracts, catalog queries, money/date translation helpers and reusable views live in the shared layer.
- Backend: Express 5, Sequelize 6/MySQL, existing JWT/permission system, Redis, and a BullMQ payment worker. Coffee models/schema/service/repository/router and Midtrans adapter are separate from existing auth modules. Public self-registration and fake frontend login/account workflows are removed.
- Public pages: Home, Menu, About, Story, Gallery, Visit, Promotions, Contact, FAQ. The initial brand is Toko Kopi, with illustrative photography and no fabricated customer testimonials, real address or contact details.
- Guest ordering supports dine-in with a backend-validated active table, or takeaway without a table. No delivery, card checkout, cash checkout, ingredient inventory, checkout vouchers, taxes/service fees, or CMS-issued refunds.
- CMS: order board, kitchen/barista view, products/categories, table QR creation/rotation/printing, invoices, finance reports, staff creation/removal, and shop content settings. Product photos accept validated JPEG/PNG/WebP, max 5 MB; the backend strips metadata and stores resized WebP with random filenames.

## Database

Three coffee migrations add:

1. `categories`, `products`, `cafe_tables`, `orders`, `order_items`, `payments`, `payment_events`, `invoices`, `order_history`, `shop_settings`, `order_counters`.
2. Missing `deleted_at` columns in starter roles/permissions, matching their existing paranoid models.
3. `payment_events.occurred_at`, retaining provider settlement time for financial reporting when supplied.

UUIDs use the existing UUIDv7 utility. Product/category translations use explicit JSON `{ id, en, ms }` values. Monetary values are integer IDR, quantities are integers 1–50, carts contain at most 50 unique products, and order totals are capped at Rp10,000,000. Product and order foreign keys restrict deletion; products are archived. Order items preserve translated names, category names and prices. Invoices preserve shop name at payment processing time.

Checkout locks table/products and allocates a daily counter with MySQL `INSERT ... ON DUPLICATE KEY UPDATE` plus a locked read inside the order transaction. Order number, random guest token, idempotency key, payment reference, provider transaction ID, event fingerprint and invoice ownership have database uniqueness constraints. Order list item/payment/invoice/history retrieval is batched to avoid per-order database queries.

`npm run db:seed:coffee` inserts 3 categories, 15 products and 20 tables idempotently. It refuses production. A development admin is created only when `DEV_ADMIN_EMAIL` and a password of at least 12 characters are supplied. It does not overwrite existing menu edits, users, or table tokens.

## API contracts

Use `/docs/specs/coffee.json` for request schemas generated directly from Zod. Existing Swagger remains available at `/docs`; choose Coffee Module. API base is `/api`.

Success is `{ success: true, data, meta? }`. Paginated responses use `{ page, limit, totalItems, totalPages, hasNextPage, hasPrevPage }`. Errors are `{ success: false, message, errors }`. Coffee business errors use stable codes such as `PRODUCT_UNAVAILABLE`, `INVALID_TABLE`, `INVALID_TRANSITION`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_MISMATCH`, `VALIDATION_FAILED`; frontend renders translated messages rather than showing arbitrary provider responses.

| Area | Routes |
|---|---|
| Public catalog/content | GET `/menu`, `/categories`, `/shop`, `/tables`, `/tables/resolve/:token` |
| Guest checkout | POST `/orders` |
| Guest tracking/receipt | GET `/orders/:id`, `/orders/:id/receipt`; POST `/orders/:id/cancel` |
| Auth | POST `/auth/login`; GET `/auth/me` |
| Operations | GET `/admin/orders`, `/admin/orders/:id`; PATCH `/admin/orders/:id/status` |
| Catalog | GET/POST `/admin/products`; PUT/DELETE `/admin/products/:id`; POST `/admin/categories`; PUT `/admin/categories/:id` |
| Tables | GET/POST `/admin/tables`; PUT `/admin/tables/:id`; POST `/admin/tables/:id/rotate` |
| Photos | POST `/admin/uploads` with a raw image body; returns `{ image: '/assets/uploads/<random>.webp' }` |
| Finance | GET `/admin/payments`, `/admin/invoices`, `/admin/reports` |
| Staff/content | GET/POST `/admin/staff`; DELETE `/admin/staff/:id`; PUT `/admin/settings` |
| Provider callback | POST `/payments/webhooks/midtrans` |

Checkout input is `{ idempotencyKey, fulfillment, tableToken, customerName, phone, notes, locale, items: [{ productId, quantity, notes }] }`. It contains no authoritative prices. A successful create returns `{ id, accessToken }`. A repeated key with the same validated input returns the original order; different input returns 409. The client retains the exact pending payload across a network timeout so retry can recover the original order.

Guest tracking requires **X-Order-Token**, independent of the table token or order number. Browser links keep this token in a URL fragment, not query parameters; fragments are not sent to web servers. Tokens are bearer capabilities: anyone holding the order link can view that order and cancel while unpaid. Tokens are not returned in administrative order lists. Sensitive API responses use `Cache-Control: no-store`.

Login returns only `{ token }`; frontend then fetches `/auth/me` to obtain `{ id, email, name, permissions }`. Admin and staff retain the same JWT implementation. `view_orders` / `update_orders` permit operational work, while `manage_users` protects coffee administration and finance. Hiding UI alone is never authorization. Staff deletion clears active-user and permission caches. The UI does not expose unsupported starter password-reset/2FA/session endpoints.

## Payment lifecycle and reconciliation

Orders move `PENDING_PAYMENT → PAID → CONFIRMED → PREPARING → READY → COMPLETED`. Staff may advance only one valid state at a time and only when payment is PAID. Customer cancellation is accepted only while the order is pending payment.

The worker is a separate process (`npm run worker`, production `node dist/workers/payments.worker.js`). It scans durable pending payments and unfinished events every 10 seconds and submits BullMQ jobs with stable IDs, bounded concurrency and exponential retry. Failed jobs can be re-enqueued by the scanner. An individual bad event is flagged for reconciliation and does not block other payments. Restarting Redis/worker does not discard transaction state stored in MySQL.

Provider creation never runs inside a long database transaction. The worker checks Midtrans transaction status by the stable reference before charging, so a lost charge response does not produce another payment. Transient network/provider failures leave the transaction pending for retry. After provider-confirmed absence and local expiry, the worker does not create a new charge. The UI never announces success before backend confirmation.

Midtrans uses Core API QRIS only, server-side Basic authorization, and QR image URLs returned by the provider. Webhooks validate SHA-512 signature, QRIS payment type, IDR currency, amount, order reference and transaction identity. The event is saved before application; payment/order/history/invoice changes are transactional. Duplicate and out-of-order events cannot create a second invoice or regress PAID to PENDING. A late payment on a cancelled order flags reconciliation and leaves the order cancelled, outside the kitchen queue.

Full refund notifications are reflected in payment status. Partial refunds are not automated in this version and require reconciliation with the provider; the application does not provide a refund execution action. The finance view is operational reporting, not a general accounting ledger. It counts gross settled transactions (PAID and REFUNDED) by `paidAt`, using Midtrans settlement time when provided; otherwise event receipt time. Full refunds are reported separately by refund processing date; they do not retroactively erase the original gross revenue. It does not deduct gateway fees or assert that payment settlement has reached a bank account. Date filters and day/week/month boundaries use Asia/Jakarta; weeks start Monday.

QR expiry is initialized to 15 minutes for local display; provider status remains authoritative. Mock payments are deliberately not scannable payment QRs and are explicitly labeled simulation. Settlement fixtures require test mode and the isolated coffee_test database; no customer/admin action can mark payments successful.

## i18n and PWA

- Supported locale codes: `id`, `en`, `ms`. MY is a display label for Malay, not the Burmese language code `my`.
- ID is the initial/fallback language. Preferences persist under `app_language`. Switching languages updates HTML `lang`, leaves the cart/table/order intact, and changes `Intl` money/date formatting without currency conversion.
- UI namespaces cover public pages, ordering, management, receipt, validation and status messages. CMS stores translated product/category/content values with Indonesian fallback. Product names may remain the same where they are menu names rather than translated prose.
- Production build generates a versioned static precache and service worker. Menu/category requests are network-first with a maximum 60-second offline catalog fallback. No order/payment/auth/admin API response is cached. Mutations require connectivity, and unknown offline navigations display the translated offline page.
- PWA manifest, 192/512 PNG icons, theme and standalone start URL are included. Service worker activates on production build only. Installed-app OS UX still depends on browser/device support; browser registration/cache behavior is separately tested.
- Fonts are self-hosted Fraunces and Inter. Photo licenses and original links are in `frontend/public/assets/LICENSES.md`. Example photos are illustrative, including shared category images in seed data; replace them with actual product/store photography before publishing.

## Production configuration

Required backend configuration: `DATABASE_URL`, `REDIS_URL`, strong `JWT_SECRET`, `NODE_ENV=production`, `PORT`, `PUBLIC_WEB_URL=https://<your-domain>`, `PAYMENT_PROVIDER=midtrans`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_PRODUCTION=true`. Sandbox uses `MIDTRANS_PRODUCTION=false` and a sandbox server key. The server refuses production with mock, missing Midtrans credentials or sandbox mode. Never put a server key in a `VITE_` variable.

Frontend: `VITE_API_BASE_URL=https://<your-domain>/api`, `VITE_APP_NAME=Toko Kopi`, `VITE_APP_ENV=production`. Serve built frontend with SPA fallback and HTTPS, proxy `/api` and `/assets/uploads` to backend, and serve `/sw.js` with revalidation rather than immutable caching. Persist and back up backend `public/uploads`, MySQL and Redis outside temporary containers. Configure proxy trust deliberately for the deployed topology before relying on per-IP rate limits.

Enable QRIS on the merchant account, configure HTTPS notifications to `/api/payments/webhooks/midtrans`, and verify sandbox then a controlled live transaction. Run API and worker as supervised processes. Use `/health` for process reachability; startup verifies MySQL, but this endpoint is not a complete downstream readiness probe. Inspect worker failures and `reconcile` payment flags. Monitor pending age, failed jobs, webhook rejection and latency. Keep original production backups before migrations; do not use demo seed or the root local-test helper in production. Provision the production administrator through the existing controlled user/role provisioning workflow, not hardcoded demo credentials.

## Validation boundary

Automated unit, integration and browser tests are provided under backend/frontend `tests`. Integration tests refuse databases whose URL does not identify `coffee_test`; they use seeded data and create their own orders/staff. Local Docker uses dedicated ports/project and ephemeral MySQL storage. Browser tests operate real local APIs and an isolated internal test settlement fixture. Midtrans adapter tests mock network transport; they are not proof of merchant sandbox/live connectivity.

Frontend `npm run verify` runs lint, typecheck and production build. Backend adds typecheck, build and focused lint for new coffee/payment/worker/test modules. Original backend starter modules still contain legacy broad typing; these are not represented as a completed repository-wide type cleanup. The frontend retains unused reusable starter primitives, but disconnected mock feature implementations are removed.

Deployment, merchant sandbox/live validation, production credentials/domain/TLS, physical-device installation and screen-reader testing are external validation steps, not claimed by local build/test success.

## Verified locally — 8 September 2026

- Frontend lint, typecheck, production build (`npm run verify`), and 3 unit tests passed. The build retains a non-failing Tailwind/Rolldown sourcemap warning.
- Backend typecheck, focused lint, build, 11 unit tests, and 13 MySQL/Redis integration tests passed. Coverage includes price tampering, concurrent checkout/number allocation, guest access, RBAC, immutable receipts, real signed/duplicate webhook handling, provider timeout recovery, QR rotation, malformed images, and gross revenue/refund reporting.
- 6 Playwright tests passed on the production preview: 375/768/1024/1440 public layouts, three languages, CMS image upload and translated persistence/archive, dine-in and takeaway to receipt, failed login, offline checkout, and PWA cache boundaries. Ordering passed automated WCAG 2 A/AA checks.
- Local payment settlement uses a test fixture and cannot receive money. Merchant sandbox/live payments, deployment, physical-device installation, and manual assistive-technology testing remain unverified.

An additional runtime worker smoke test passed with the API and BullMQ worker running: a checkout created only in MySQL acquired its provider transaction ID through the worker scan. Run `npm run test:worker` from backend with the isolated test environment.
