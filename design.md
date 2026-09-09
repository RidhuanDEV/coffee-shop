==================================================
DESIGN SYSTEM / VISUAL DIRECTION
================================

The entire product must have one coherent visual identity across:

* marketing website
* customer ordering PWA
* checkout
* QRIS payment
* order tracking
* admin CMS

Do not make each section look like a different template.

The desired visual direction is:

MODERN PREMIUM SPECIALTY COFFEE SHOP

The design should feel:

* premium
* warm
* minimal
* editorial
* modern
* clean
* calm
* slightly organic
* suitable for a real specialty coffee brand

Avoid:

* generic SaaS dashboard appearance on the customer-facing website
* excessive gradients
* glassmorphism everywhere
* neon colors
* excessive shadows
* excessive rounded containers
* giant oversized text everywhere
* excessive animation
* random decorative blobs
* generic AI-generated landing-page styling
* overly playful fast-food styling

Use visual references conceptually similar to high-end independent specialty coffee shops and modern hospitality brands, without copying any specific brand.

==================================================
COLOR PALETTE
=============

Use a warm neutral palette.

Suggested base palette:

Background / Cream:
#F5F0E8

Surface:
#FFFCF7

Coffee Brown:
#5A3A2A

Deep Espresso:
#2A1E18

Charcoal:
#242424

Muted Text:
#716A63

Warm Beige:
#D8C8B5

Accent Green:
#66785F

Soft Border:
#E6DED4

Success:
#3F6B4F

Warning:
#A86F32

Danger:
#9C4545

Do not blindly hardcode these colors if the existing project already uses design tokens.

Convert them into the project's existing theme/token system.

Maintain sufficient WCAG color contrast.

Customer-facing pages should primarily use cream, white, espresso, brown, and restrained green accents.

The CMS may use a lighter neutral dashboard palette while keeping the same brand identity.

==================================================
TYPOGRAPHY
==========

Use typography that feels editorial and premium.

Recommended direction:

Headings:

* elegant serif or refined display font

Body/UI:

* clean modern sans-serif

Possible free font combinations:

* Playfair Display + Inter
* Cormorant Garamond + Manrope
* DM Serif Display + DM Sans
* Fraunces + Inter

Choose only one pairing.

Prefer fonts available through legitimate free sources such as Google Fonts if external font loading is compatible with the existing project.

For production performance, use sensible font weights and avoid loading unnecessary variants.

Typography hierarchy should be clearly defined.

Example:

Hero heading:
48–72px desktop
36–48px mobile

Page heading:
40–56px desktop

Section heading:
30–40px

Card heading:
18–22px

Body:
15–18px

Small/meta:
12–14px

Use responsive typography rather than fixed desktop sizes.

==================================================
LAYOUT SYSTEM
=============

Use a consistent layout grid.

Recommended max content width:

1200–1320px

Desktop horizontal padding:
32–48px

Tablet:
24–32px

Mobile:
16–20px

Use generous vertical section spacing.

Typical desktop section spacing:
80–120px

Mobile:
48–72px

Avoid placing every section inside a card.

Use whitespace as a major part of the visual hierarchy.

==================================================
BORDER RADIUS
=============

Keep radius refined rather than excessively bubbly.

Suggested:

Small controls:
8px

Buttons:
10–12px

Cards:
12–16px

Large media:
16–24px

Do not use 30–40px radius on every element.

==================================================
SHADOWS
=======

Use subtle shadows only where necessary.

Prefer borders, whitespace, and surface contrast over heavy box shadows.

Example visual approach:

0 4px 20px rgba(30, 20, 15, 0.06)

Do not make every card float.

==================================================
BUTTON SYSTEM
=============

Primary button:

* espresso/dark background
* cream/white text
* medium radius
* strong but minimal

Example:
Order Now

Secondary button:

* transparent or cream
* dark border
* dark text

Text button:

* minimal
* optional arrow icon

Buttons should have:

* hover state
* active state
* focus-visible state
* disabled state
* loading state

Tap targets must remain comfortable on mobile.

==================================================
NAVIGATION DESIGN
=================

Public navbar should be simple and premium.

Desktop:

Logo left

Navigation center/right:

* Home
* Menu
* About
* Gallery
* Visit Us
* Contact

Primary CTA:
Order Now

The navbar may start transparent on the hero and transition into a solid cream/white surface when scrolling if appropriate.

Mobile:

* logo
* menu trigger
* prominent Order button where space permits

Keep mobile navigation accessible.

==================================================
LANDING PAGE HERO
=================

The homepage hero must make the coffee shop feel like a real physical location.

Use strong photography rather than excessive UI decoration.

Suggested composition:

Large editorial headline

Example tone:
"Coffee worth slowing down for."

Short supporting paragraph.

Primary CTA:
Order Now

Secondary CTA:
Explore Menu

Include one or more high-quality coffee/cafe images.

Desktop can use asymmetric editorial layouts.

Example:

Left 45%:
headline + copy + CTA

Right 55%:
large cafe/coffee photography

Or use a full-width photographic hero with carefully controlled text contrast.

Avoid generic centered SaaS hero sections.

==================================================
MENU SECTION DESIGN
===================

Menu cards should prioritize photography.

Card structure:

Image
Category
Product name
Short description
Price
Optional badge
Add button when displayed inside ordering PWA

For the marketing site, keep menu cards editorial.

For the ordering application, optimize them for fast scanning and interaction.

==================================================
CUSTOMER ORDERING PWA DESIGN
============================

The PWA should feel more functional than the marketing website while retaining the brand identity.

Mobile-first structure:

Top header:
Coffee Shop logo/name
Table indicator

Example:
Table 07

Search bar

Sticky horizontal categories:

All
Coffee
Beverage
Food
Dessert

Product list/grid

Persistent cart bar at bottom.

Example:

3 items · Rp125.000
[View Cart]

The cart CTA should remain visible without obstructing content.

On product cards prioritize:

* clear image
* product name
* price
* availability
* fast add action

Do not make users open a modal for every basic item.

Use product-detail sheets/modals only where needed for notes/options.

==================================================
PRODUCT DETAIL
==============

Product detail should support:

Large image

Product name

Description

Price

Quantity controls

Optional notes

Add to Cart button

On mobile prefer a bottom sheet or dedicated page depending on existing frontend patterns.

==================================================
CART DESIGN
===========

Make checkout fast.

Cart screen should clearly show:

Table
Items
Quantity
Notes
Subtotal
Total

Use large readable prices.

Primary action:

Continue to Payment

Avoid unnecessary checkout steps.

==================================================
QRIS PAYMENT SCREEN
===================

Payment screen should feel trustworthy and simple.

Display:

Order number

Amount

QRIS QR code prominently

Payment expiration if applicable

Payment status

Instructions:

1. Open your preferred banking/e-wallet application
2. Scan QRIS
3. Complete payment
4. Payment status will update automatically

Use clear status components:

Waiting for Payment

Payment Successful

Payment Expired

Payment Failed

Never visually imply success before backend confirmation.

==================================================
ORDER TRACKING DESIGN
=====================

Use a clear progress indicator.

Example:

Paid
→ Confirmed
→ Preparing
→ Ready
→ Completed

Visually emphasize the current status.

Do not expose irrelevant internal statuses.

Show:

Order number
Table
Estimated preparation information if available
Ordered items
Total
Payment status

==================================================
ADMIN CMS VISUAL DESIGN
=======================

CMS should prioritize operational clarity over decorative marketing visuals.

Use:

* sidebar navigation on desktop
* responsive drawer on mobile/tablet
* compact top bar
* cards only for important metrics
* readable tables
* status badges
* clear filters
* fast actions

Suggested sidebar:

Dashboard

OPERATIONS
Orders
Kitchen / Barista

CATALOG
Products
Categories

STORE
Tables & QR

FINANCE
Payments
Invoices
Reports

ADMIN
Users
Settings

Do not overload the sidebar with unnecessary pages.

==================================================
CMS DASHBOARD DESIGN
====================

Dashboard should display:

Top metric cards:

Today's Revenue
Today's Orders
Active Orders
Average Order Value

Then:

Revenue chart

Order status summary

Best sellers

Recent orders

Keep charts limited to useful operational information.

Do not add decorative charts without a business purpose.

==================================================
ORDER MANAGEMENT UI
===================

Operational orders should be very easy to scan.

Use status colors consistently.

Example:

Pending payment:
neutral/warning

Paid:
green

Preparing:
warm orange

Ready:
accent green

Completed:
muted green

Cancelled:
red

The kitchen/barista view can use larger order cards instead of dense tables.

Example:

TABLE 07
ORD-20260908-0142
5 min ago

2 × Cafe Latte
1 × Croffle

Note:
Less sugar

[Start Preparing]

==================================================
IMAGE DIRECTION
===============

Choose photography with:

* warm natural lighting
* brown/cream tones
* real coffee cups
* espresso
* latte art
* pastries
* plated cafe food
* wooden tables
* concrete/wood interiors
* real barista environments

Avoid:

* obvious corporate stock photography
* images with logos from unrelated brands
* heavily saturated images
* inconsistent photographic styles

Keep the image treatment consistent across pages.

When possible, crop images to consistent aspect ratios.

Suggested ratios:

Hero:
4:5, 3:2, or 16:10 depending on layout

Menu:
4:3 or 1:1

Gallery:
mixed editorial grid

==================================================
MICRO-INTERACTIONS
==================

Keep animations restrained.

Good uses:

* button hover
* image hover zoom of approximately 2–4%
* menu category transition
* cart add feedback
* status transition
* subtle section reveal

Animation duration generally:

150–300ms

Respect prefers-reduced-motion.

Do NOT use scroll animations on every element.

==================================================
RESPONSIVE BEHAVIOR
===================

Design mobile intentionally rather than merely stacking desktop components.

Customer ordering is primarily mobile.

Landing website should remain visually polished on larger screens.

CMS should prioritize desktop/tablet while remaining usable on mobile.

Test important breakpoints according to the existing CSS framework.

Typical targets:

~375px
~768px
~1024px
~1440px

Do not hardcode specifically for only these widths.

==================================================
DESIGN CONSISTENCY REQUIREMENT
==============================

Before implementing pages, define or identify reusable primitives such as:

Button
Input
Select
Textarea
Badge
Card
Dialog
Drawer
Sheet
Tabs
Table
Pagination
EmptyState
LoadingState
ErrorState
MoneyDisplay
ProductCard
OrderStatusBadge
PaymentStatusBadge

Reuse the existing project component library wherever possible.

Do not duplicate the same UI pattern independently across multiple pages.

==================================================
FINAL VISUAL QUALITY BAR
========================

The final result should look like an intentionally designed specialty coffee shop product, not a collection of generated CRUD screens.

Before declaring the frontend complete, review:

* spacing consistency
* typography hierarchy
* button consistency
* image quality
* responsive behavior
* empty states
* loading states
* hover/focus states
* color contrast
* mobile ordering usability
* CMS information density
* visual consistency between landing page and PWA

Do a final UI polish pass after functionality is complete.
