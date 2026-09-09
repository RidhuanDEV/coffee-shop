You are working inside an EXISTING coffee shop project that already has separate frontend and backend codebases.

Your task is to build a production-quality coffee shop platform consisting of:

1. Public multi-page landing website
2. Customer ordering PWA
3. QR-code table ordering flow
4. QRIS-only payment flow
5. Admin CMS / coffee shop management dashboard
6. Order management
7. Payment and revenue management
8. Customer invoice / receipt management
9. Product/menu management
10. Seeders with realistic dummy menu data

IMPORTANT: DO NOT replace, rewrite, or initialize a new frontend/backend stack.

Before implementing anything, inspect the existing project thoroughly.

==================================================
PHASE 0 — UNDERSTAND THE EXISTING CODEBASE
==========================================

First inspect both the frontend and backend repositories/directories.

Read all relevant project documentation before making architectural decisions, including files such as:

* README.md
* AGENTS.md
* CLAUDE.md
* CONTRIBUTING.md
* docs/
* architecture documentation
* coding guidelines
* package.json
* composer.json
* pyproject.toml
* go.mod
* configuration files
* environment examples
* database schema/migrations
* existing routes
* API definitions
* reusable UI components
* authentication implementation
* state-management patterns
* existing services/repositories
* existing tests
* linting/formatting configuration

Search recursively for AGENTS.md or similar agent instructions because nested directories may contain additional rules.

Follow the existing:

* coding style
* architecture
* folder structure
* naming conventions
* API patterns
* validation patterns
* authentication strategy
* authorization strategy
* error handling
* database conventions
* ORM conventions
* UI component system
* CSS/design system
* state management
* testing conventions

Do NOT introduce a different framework simply because you prefer it.

Do NOT restructure the entire application unless absolutely necessary.

Reuse existing abstractions whenever they are suitable.

If something is missing, implement it in the most idiomatic way for the project's existing technology stack.

Before coding, create a concise implementation plan based on what you discover.

==================================================
PRODUCT VISION
==============

Build a modern coffee shop system where customers sitting at a table can scan a QR code and immediately order food/drinks without having to queue or wait for a waiter.

Example flow:

Customer sits at Table 07
→ scans QR code
→ browser/PWA opens something such as:

/order?table=07

or

/order/table/07

→ customer sees menu
→ adds products to cart
→ submits order
→ pays using QRIS
→ payment is confirmed
→ kitchen/barista/admin receives the order
→ order progresses through preparation
→ customer can view order status
→ invoice/receipt becomes available.

Customers must also be able to access the same ordering application manually from the public landing website without scanning a QR code.

==================================================
CUSTOMER EXPERIENCE
===================

The ordering experience must be optimized for phones.

The customer should NOT be required to create an account just to order.

Guest ordering should be supported.

A customer may optionally provide:

* name
* phone number
* table number if they did not enter through QR
* order notes

If the customer enters through a table QR code, automatically attach the table identifier to their order.

Do not trust arbitrary table identifiers sent from the client.

Validate the table against the backend database.

The ordering experience should feel like a real modern coffee shop application.

==================================================
PUBLIC LANDING WEBSITE
======================

Create a polished multi-page public website.

Do NOT make it a single-page landing page only.

Recommended pages/routes:

Home
Menu
About Us
Our Story
Gallery
Locations / Visit Us
Promotions
Contact
FAQ
Order Online

Home page sections can include:

* navbar
* hero section
* featured menu
* best sellers
* coffee shop atmosphere
* food highlights
* customer testimonials
* promotion banner
* why choose us
* opening hours
* location
* CTA to Order Now
* footer

The main CTA should clearly lead users into the ordering PWA.

Examples:

Order Now
View Menu
Order from Your Table

The website should be responsive and optimized for:

* desktop
* tablet
* mobile

Follow accessibility best practices.

Use semantic HTML where applicable.

Provide meaningful alt text for images.

Maintain adequate contrast.

Do not overuse animation.

==================================================
WEB ASSETS
==========

Use FREE and legally usable web assets for the coffee shop website.

The AI/agent may search for, use, or download free assets where appropriate.

Examples of acceptable sources include:

* Unsplash
* Pexels
* unDraw
* Heroicons
* Lucide
* other reputable sources with licenses that allow website use

Prefer assets suitable for commercial use.

Possible assets include:

* coffee images
* latte images
* espresso images
* cafe interiors
* pastries
* desserts
* food photography
* coffee beans
* barista photographs
* restaurant backgrounds
* icons
* illustrations

Do NOT use random copyrighted images copied from Google Images.

Do NOT hotlink assets when local hosting is more appropriate.

If images are downloaded into the project, organize them consistently with the existing frontend asset structure.

Optimize images before use when possible.

Prefer modern formats such as WebP/AVIF if the existing frontend supports them.

Avoid unnecessarily large assets.

==================================================
PWA REQUIREMENTS
================

The ordering application must work as a Progressive Web App.

Implement appropriately for the existing frontend framework.

Include:

* web app manifest
* application name
* short name
* icons
* theme configuration
* installable experience
* responsive mobile layout
* service worker if appropriate
* reasonable caching strategy
* offline fallback page where appropriate

Be careful with caching dynamic data.

Do NOT cache sensitive customer/payment/order responses incorrectly.

Static assets may use aggressive caching.

Menu/catalog data may use controlled stale/revalidation behavior.

Order/payment status must remain network-first or otherwise reliably fresh.

The PWA should be usable from:

1. QR code links
2. Landing page
3. Direct URL
4. Installed home-screen application

==================================================
QR TABLE ORDERING
=================

Create coffee shop table management.

Each table should have something like:

* internal ID
* table code
* display name/number
* QR token or public identifier
* active/inactive status
* optional location/area

Example tables:

Table 01
Table 02
Table 03
...
Table 20

Generate a unique QR ordering URL for each active table.

Avoid exposing predictable sensitive database IDs if the project's existing conventions support public identifiers, UUIDs, slugs, or signed tokens.

Example:

https://domain.com/order/table/TBL-A8F2K

The QR should resolve to the customer ordering screen and automatically associate the order with that table.

Admin must be able to:

* view tables
* create tables
* update tables
* activate/deactivate tables
* regenerate QR identifier if necessary
* view/download/print a QR code for a table

Do not allow the frontend to fabricate arbitrary table IDs.

Backend must validate the table identifier.

==================================================
MENU / PRODUCT DOMAIN
=====================

Support at minimum these menu types/categories:

Food
Beverage
Dessert

Correct spelling in the UI should be "Dessert".

Products should support fields appropriate to the existing project, for example:

* id
* name
* slug
* description
* category
* image
* price
* availability
* featured
* preparation information if useful
* created_at
* updated_at

Optional fields if appropriate:

* discount
* calories
* spicy level
* tags
* stock tracking
* preparation time
* sort order

Do not over-engineer inventory if it does not fit the current codebase.

Products unavailable for ordering must not be orderable by customers.

==================================================
SEEDER DATA
===========

Create realistic database seeders.

Create at least 5 menu items PER category:

5 Food
5 Beverage
5 Dessert

Minimum total: 15 menu products.

Example data can include:

FOOD

* Smoked Beef Croissant
* Chicken Sandwich
* Spaghetti Aglio e Olio
* Truffle Fries
* Chicken Rice Bowl

BEVERAGE

* Espresso
* Americano
* Cafe Latte
* Cappuccino
* Matcha Latte

DESSERT

* Burnt Cheesecake
* Tiramisu
* Chocolate Brownie
* Croffle
* Panna Cotta

Use realistic Indonesian coffee-shop pricing.

Example range:

Rp18.000 – Rp75.000

Use the project's standard money representation.

Prefer storing monetary values as integers in the smallest applicable currency unit / IDR integer value rather than floating-point values.

Also seed several coffee shop tables so the QR workflow can be tested immediately.

If the application requires users/admin accounts, provide a safe development-only seed account according to the project's existing conventions.

Never hardcode production credentials.

==================================================
CUSTOMER MENU EXPERIENCE
========================

Ordering UI should have:

* category tabs/filter
* search
* product images
* product details
* price
* availability state
* quantity selector
* add to cart
* cart summary
* subtotal
* order notes
* table number display
* checkout
* payment
* order tracking

Recommended categories:

All
Food
Beverage
Dessert

Show unavailable products clearly and disable ordering.

==================================================
SHOPPING CART
=============

Cart should support:

* add item
* remove item
* update quantity
* clear cart
* item notes if appropriate
* subtotal
* total

The backend must NOT trust price values submitted by the client.

At checkout:

Client sends product IDs and quantities.

Backend calculates authoritative prices using database values.

Protect against:

* modified prices
* negative quantities
* invalid products
* unavailable products
* duplicate manipulation
* stale menu information

==================================================
ORDER DOMAIN
============

Implement a robust order lifecycle.

Suggested statuses:

PENDING_PAYMENT
PAID
CONFIRMED
PREPARING
READY
COMPLETED
CANCELLED

Adapt names to the existing project's naming conventions.

Do not blindly duplicate enums if an order system already exists.

An order should contain appropriate data such as:

* order number
* table
* customer name
* customer phone
* customer notes
* subtotal
* discount if applicable
* total
* payment status
* order status
* timestamps

Order items should preserve a snapshot of important product data at purchase time.

For example:

* product reference
* product name snapshot
* unit price
* quantity
* line total

This prevents historical invoices from changing if the menu price is later modified.

==================================================
ORDER NUMBER
============

Generate human-readable order numbers.

Example:

ORD-20260908-0001

Use a safe concurrency strategy.

Do not generate order numbers by simply selecting the current maximum without protecting against race conditions.

Use an approach appropriate to the existing database.

==================================================
QRIS PAYMENT ONLY
=================

Payment method for customers is QRIS ONLY.

Do not implement:

* credit card
* cash payment at checkout
* bank transfer
* PayPal
* Stripe card checkout
* COD

unless the existing backend already abstracts payment providers and those methods are disabled.

Use a clean payment abstraction so a real Indonesian payment gateway can be connected.

Examples of providers that may support QRIS include:

* Midtrans
* Xendit
* DOKU
* another provider already used by the project

IMPORTANT:

If payment provider credentials are not present, implement the QRIS integration abstraction and a DEVELOPMENT MOCK PAYMENT provider.

Do NOT invent production credentials.

Never store payment provider secrets in frontend code.

Use backend environment variables.

The payment flow should support:

Order created
→ payment transaction created
→ QRIS QR data/image shown
→ customer pays
→ provider webhook/callback arrives
→ backend verifies callback
→ payment marked PAID
→ order status updated safely.

==================================================
PAYMENT SECURITY
================

Payment status MUST be controlled by the backend.

Never allow the client to simply call something like:

POST /orders/:id/mark-paid

without trusted provider verification.

Webhook handlers should implement the provider's recommended validation mechanism, such as:

* signature verification
* shared secret verification
* callback token verification

where supported.

Handle webhook retries safely.

Payment processing should be idempotent.

Do not create duplicate payments if the provider sends the same notification multiple times.

Record provider transaction/reference IDs.

Store enough metadata for reconciliation without storing unnecessary sensitive information.

==================================================
PAYMENT STATUS
==============

Suggested payment statuses:

PENDING
PAID
FAILED
EXPIRED
CANCELLED
REFUNDED

Adapt to the existing project's conventions.

Keep payment status separate from kitchen/order preparation status when practical.

For example:

payment_status = PAID
order_status = PREPARING

==================================================
CUSTOMER ORDER TRACKING
=======================

After checkout, provide a customer order status screen.

Example:

Order #ORD-20260908-0007

Table 07

Payment:
Paid

Status:
Preparing

Items:
2x Cafe Latte
1x Burnt Cheesecake

Total:
Rp98.000

Customer should be able to refresh or automatically receive updated status.

Use the existing frontend/backend capabilities.

Possible implementations:

* polling
* Server-Sent Events
* WebSocket

Choose based on the existing architecture.

Do not introduce WebSockets solely because they are fashionable.

Simple polling is acceptable for a moderate-size coffee shop.

==================================================
INVOICE / RECEIPT
=================

Generate an invoice/receipt after a successful payment.

Invoice should contain:

* coffee shop name
* invoice/order number
* date/time
* table
* customer name if provided
* item list
* quantity
* unit price
* subtotal
* total
* payment method: QRIS
* payment status
* transaction reference

Admin should be able to view invoices.

Customer should be able to view their receipt from the order confirmation page.

If the current stack supports printable HTML or PDF generation cleanly, implement it according to project conventions.

Do not introduce a heavy PDF system unnecessarily.

==================================================
ADMIN CMS
=========

Create an authenticated admin CMS.

The CMS is specifically for operating the coffee shop.

Do not turn it into a generic website builder.

Core modules:

Dashboard
Orders
Menu / Products
Categories
Tables / QR Codes
Payments
Invoices
Revenue / Finance
Admin Users
Settings where appropriate

==================================================
ADMIN DASHBOARD
===============

Dashboard should show practical coffee-shop metrics such as:

* today's orders
* pending orders
* preparing orders
* completed orders
* today's gross revenue
* paid transactions
* unpaid/expired transactions
* average order value
* best-selling products
* recent orders

Do not calculate financial metrics from frontend state.

Use backend/database queries.

==================================================
ORDER MANAGEMENT CMS
====================

Admin should be able to see active orders quickly.

Useful tabs/filters:

All
Pending Payment
Paid
Confirmed
Preparing
Ready
Completed
Cancelled

For each order display:

* order number
* table
* customer
* items
* total
* payment status
* order status
* created time

Allow staff to move orders through valid states.

Example:

Paid
→ Confirmed
→ Preparing
→ Ready
→ Completed

Prevent impossible or unsafe transitions where practical.

==================================================
KITCHEN / BARISTA WORKFLOW
==========================

Optimize active-order view for operations.

Staff should quickly see:

Table 07
2x Cafe Latte
1x Croffle
Notes: less sugar

Allow status changes without excessive clicks.

If appropriate, provide a kitchen/barista-focused view showing only active paid orders.

==================================================
MENU MANAGEMENT CMS
===================

Admin should be able to:

* list products
* create products
* edit products
* update price
* update image
* update description
* assign category
* set availability
* mark featured products
* delete/archive based on existing domain conventions

Be cautious deleting products referenced by historical orders.

Prefer soft-delete/archive patterns if the project/database already supports them.

==================================================
TABLE MANAGEMENT CMS
====================

Admin should be able to:

* list coffee shop tables
* create table
* edit table
* activate/deactivate table
* generate/view QR code
* print/download QR
* copy ordering URL

==================================================
PAYMENTS CMS
============

Show payment records with:

* transaction ID
* order
* provider
* amount
* payment status
* payment method
* provider reference
* created time
* paid time

Allow searching/filtering.

Do NOT allow admins to arbitrarily fake provider-paid transactions unless a controlled development mode explicitly exists.

==================================================
FINANCE / MONEY MANAGEMENT
==========================

Build basic operational financial reporting appropriate to a coffee shop.

Show:

* revenue today
* revenue this week
* revenue this month
* completed paid orders
* average order value
* revenue by date
* revenue by product/category
* transaction history

Do not treat pending or failed payments as revenue.

Only count successfully paid transactions according to the chosen accounting rules.

Do not call this a full accounting system.

==================================================
ADMIN USER MANAGEMENT
=====================

Implement admin/staff user management if not already available.

Possible roles:

OWNER
ADMIN
CASHIER
BARISTA

Only implement granular RBAC if appropriate to the existing architecture.

At minimum:

Owners/Admins:

* manage products
* manage tables
* access finance
* manage staff

Operational Staff:

* view/update orders

Protect administrative endpoints on the backend.

Do not rely only on hiding buttons in the frontend.

==================================================
AUTHENTICATION / AUTHORIZATION
==============================

Reuse the authentication mechanism already present in the project.

Do not create a second independent auth system.

Secure:

* admin routes
* product mutations
* table mutations
* order management endpoints
* finance endpoints
* invoice administrative endpoints

Apply authorization server-side.

==================================================
API DESIGN
==========

Reuse the backend's current API style.

Do not force REST if it is GraphQL already.

Do not force GraphQL if it is REST already.

Potential REST-style resources, only if compatible:

/api/menu
/api/categories
/api/tables
/api/orders
/api/orders/:id
/api/orders/:id/status
/api/payments
/api/payments/qris
/api/payment/webhook
/api/invoices
/api/admin/dashboard
/api/admin/orders
/api/admin/products
/api/admin/tables
/api/admin/payments
/api/admin/reports

Follow existing controller/service/repository/domain conventions.

==================================================
DATABASE DESIGN
===============

Adapt to the existing schema first.

Likely entities may include:

users/admin_users
categories
products
tables
orders
order_items
payments
invoices

Possibly:

payment_events
order_status_history

Add tables only where they add clear value.

Maintain:

* foreign keys
* indexes
* constraints
* uniqueness guarantees
* appropriate nullability

Indexes should be considered for commonly queried fields such as:

* order number
* table identifier
* order status
* payment status
* created_at
* payment provider reference

==================================================
TRANSACTIONS AND DATA CONSISTENCY
=================================

Use database transactions for operations that must remain atomic.

Examples:

Creating:

* order
* order items
* totals
* payment initialization metadata

Updating:

* payment state
* order state

Prevent partially created orders.

Handle concurrency properly.

==================================================
MONEY HANDLING
==============

Never use floating-point arithmetic for money.

For IDR, prefer integer storage where appropriate.

Example:

25000 = Rp25.000

Centralize money formatting in the frontend.

==================================================
VALIDATION
==========

All mutable input must be validated on the backend.

Examples:

* product ID
* quantity
* table token
* customer data
* status transitions
* category
* product availability

Client validation is for UX only.

Backend validation is authoritative.

==================================================
SECURITY REQUIREMENTS
=====================

Apply production-minded security practices.

Consider:

* authentication
* authorization
* CSRF depending on auth strategy
* XSS
* SQL injection
* mass assignment
* insecure direct object references
* rate limiting
* webhook forgery
* replay attacks
* leaked secrets
* insecure admin routes
* price manipulation
* table identifier manipulation

Never expose backend secrets in frontend environment variables.

Never trust client-generated prices or totals.

Sanitize/escape user-provided notes appropriately.

Avoid logging sensitive credentials.

==================================================
PERFORMANCE
===========

Optimize for a realistic coffee shop workload.

Avoid N+1 database queries.

Use pagination for administrative lists.

Use indexes appropriately.

Optimize images.

Lazy-load heavy assets where useful.

Avoid unnecessary frontend bundles.

Cache public/static data carefully.

Never sacrifice payment/order consistency for aggressive caching.

==================================================
RESPONSIVE DESIGN
=================

Customer ordering must be mobile-first.

Recommended interaction:

sticky category navigation
+
menu cards
+
persistent cart button/bar
+
fast checkout flow.

Avoid tiny tap targets.

Make the cart reachable with one hand.

==================================================
DESIGN DIRECTION
================

Use a premium modern coffee shop visual style.

Possible direction:

* warm neutral colors
* coffee brown
* cream
* charcoal
* subtle green accents
* strong food photography
* generous whitespace
* elegant typography
* rounded cards
* restrained shadows

However:

Reuse the project's existing design system if it already has one.

Do not introduce a completely unrelated component framework.

==================================================
EMPTY / ERROR / LOADING STATES
==============================

Every important screen should handle:

* loading
* empty
* API error
* validation error
* unavailable item
* expired QRIS
* failed payment
* network issues

Provide retry actions where appropriate.

==================================================
TESTING
=======

Follow the project's existing test stack.

Add meaningful tests for critical functionality.

Prioritize:

1. backend order total calculation
2. order creation
3. product availability validation
4. table token validation
5. payment webhook validation
6. webhook idempotency
7. order status transitions
8. admin authorization
9. payment/revenue calculations

Add frontend tests where the project already has infrastructure for them.

Do not add a second testing framework unnecessarily.

==================================================
DEVELOPMENT PAYMENT FLOW
========================

If no real payment gateway credentials are available:

Create a development/mock QRIS provider.

It should mimic:

PENDING → PAID

without pretending to be a real financial transaction.

It must only be usable in development/test environments.

Clearly label mock transactions in the CMS.

Production mode must fail safely if payment credentials are missing.

==================================================
DEVELOPER EXPERIENCE
====================

Update project documentation.

Document at minimum:

* environment variables
* migrations
* seed command
* frontend start command
* backend start command
* PWA setup
* mock QRIS flow
* real payment integration points
* webhook endpoint
* admin development account if seeded
* table QR generation
* test commands

Never commit secret credentials.

Update .env.example instead.

==================================================
IMPLEMENTATION ORDER
====================

Work incrementally.

Recommended sequence:

1. Inspect frontend/backend architecture and instructions
2. Inspect existing database/auth/API
3. Produce implementation plan
4. Define domain model
5. Add migrations/schema changes
6. Add seeders
7. Implement menu APIs
8. Implement table + QR system
9. Implement order creation
10. Implement authoritative price calculation
11. Implement payment abstraction
12. Implement QRIS/mock QRIS
13. Implement webhook handling
14. Implement customer ordering UI
15. Implement PWA configuration
16. Implement order tracking
17. Implement invoice
18. Implement CMS dashboard
19. Implement order management
20. Implement product management
21. Implement table/QR management
22. Implement payments/invoices
23. Implement finance reports
24. Implement admin management
25. Build multi-page marketing website
26. Add free licensed web assets
27. Add tests
28. Run lint/typecheck/tests/build
29. Fix discovered issues
30. Update documentation

==================================================
ACCEPTANCE CRITERIA
===================

The work is complete when:

1. Existing frontend/backend stack is preserved.

2. Existing AGENTS/README/project conventions have been followed.

3. Public users can browse a multi-page coffee shop website.

4. Landing page has an obvious Order Now flow.

5. Customers can enter ordering through the landing website.

6. Customers can scan a table QR code and enter the ordering page.

7. QR ordering automatically identifies a valid table.

8. Customers can browse Food, Beverage, and Dessert products.

9. Database contains at least 5 seeded products in each category.

10. Customers can add items to cart and checkout.

11. Client cannot manipulate authoritative product prices.

12. QRIS is the only customer payment method.

13. Development mode has a safe QRIS mock if real credentials are unavailable.

14. Real payment architecture supports secure webhook verification.

15. Duplicate payment callbacks do not duplicate transactions.

16. Paid orders appear in the admin operational workflow.

17. Staff can update order status.

18. Customer can track order status.

19. Admin can manage menu products.

20. Admin can manage tables and table QR codes.

21. Admin can see payments.

22. Admin can see customer invoices.

23. Admin can see revenue reports based only on successful payments.

24. Admin routes and APIs are authenticated and authorized.

25. Application is responsive.

26. Ordering interface works well on mobile.

27. Ordering application is installable as a PWA where supported.

28. Images/assets are properly licensed/free-to-use and optimized.

29. Critical business logic has tests.

30. Lint/type checking/build/tests pass according to the existing project tooling.

==================================================
IMPORTANT ENGINEERING RULES
===========================

Do not blindly generate large amounts of code.

Inspect first.

Make changes consistent with the existing architecture.

Prefer maintainability over shortcuts.

Prefer database constraints over application assumptions where practical.

Prefer backend authority over frontend trust.

Prefer clear domain boundaries.

Avoid duplicated logic.

Avoid unnecessary dependencies.

Avoid unnecessary abstractions.

Do not over-engineer.

Do not rewrite working infrastructure without a strong reason.

If there is a conflict between this specification and an explicit rule inside AGENTS.md or project documentation, follow the project's explicit engineering instructions while preserving the product requirements as closely as possible.

When making major architectural decisions, briefly explain:

* why the approach fits the existing codebase
* security implications
* scalability implications
* maintainability implications
* relevant trade-offs

At the end, provide a concise implementation summary containing:

* files/modules created or modified
* database changes
* routes/API endpoints added
* seed data added
* PWA changes
* QR flow
* QRIS/payment implementation
* CMS modules
* tests added
* commands executed
* unresolved limitations
* required production environment variables
* remaining steps needed before production deployment
