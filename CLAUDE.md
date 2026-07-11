# CLAUDE.md — context file for Claude sessions — Huế Vietnamese Cuisine (huevietnamesecuisine.com)

## Architecture
Static site (index.html + styles.css + script.js) on Cloudflare Pages,
with Cloudflare Pages Functions in /functions (orders, lead, coupon)
and Supabase (Postgres) for coupon redemptions / order history.
This stack was deliberately kept instead of Next.js/tRPC/Prisma:
it deploys instantly, has no build step to break, and every customer-facing
feature works without a framework migration right before launch.

## Source of truth
- Menu items & prices: `const MENU` in script.js.
- Server-side prices: functions/_pricing.js (regenerate whenever MENU changes; never trust browser totals).
- Photos: `const PHOTOS`; REAL photos are excluded from `AI_PHOTO` (no AI caption).

## Coding rules
- Vanilla JS only; use fetch, never axios. No frameworks, no build step.
- Every price change updates BOTH script.js MENU and functions/_pricing.js.
- All customer choices (size, meats, protein, rice) ride the `sizes`/`opts` mechanisms
  so they flow into cart -> receipt -> email automatically.
- Mobile first: inputs ≥16px on phones (iOS zoom), touch targets ≥44px.

## Never touch without owner approval
- functions/_pricing.js prices (money)
- Payment code paths (PayPal / Apple Pay / Stripe)
- Environment variables / secrets — never hardcode keys in any file

## Secrets (Cloudflare Pages -> Settings -> Environment variables)
RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PayPal/Stripe secrets.
