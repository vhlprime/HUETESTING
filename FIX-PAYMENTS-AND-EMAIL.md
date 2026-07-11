# Fixing Payments & Email — step by step

Important truth up front: **none of these three errors are bugs in your code.**
They are all "the account/key isn't connected yet" configuration issues. That's
good news — you fix them in dashboards, then paste a couple of values, and they work.

Everything below assumes your site is deployed as a **Cloudflare Pages** project
(see DEPLOY.md). Secrets always go in:
**Cloudflare → your Pages project → Settings → Variables and secrets → (Production) → Add**,
added as **Secret** (encrypted). After adding secrets, redeploy: `npm run deploy`.

---

## A. "Could not sign you up right now" (the coupon email)

### Why it happens
Your site calls `/api/lead`, which uses **Resend** to send the coupon. Resend
**refuses to send** from an address whose domain you haven't verified — it returns
a 403 "domain is not verified." Your `lead.js` was trying to send from
`hello@huevietnamesecuisine.com`, which only works after you verify that domain.
So the send failed, and the site showed the generic message.

I've updated `lead.js` so it now shows you the **real** reason (e.g. "domain is not
verified") both on the page and in `npm run tail`. Now fix the cause:

### Fix (choose ONE)

**Option 1 — Test it working in 2 minutes (no domain needed):**
1. Get your Resend API key: resend.com → API Keys → Create → copy (starts `re_`).
2. In Cloudflare, add secret `RESEND_API_KEY` = that key.
3. Add secret `MAIL_FROM` = `Huế Vietnamese Cuisine <onboarding@resend.dev>`
   (Resend's shared test sender — works immediately, but can only email *your own*
   Resend-account address, and looks unbranded. Fine for a test, not for customers.)
4. Add secret `NOTIFY_EMAIL` = `huevietnamesecuisine@gmail.com`.
5. `npm run deploy`, then try the signup with the email you signed up to Resend with.

**Option 2 — The real, production setup (do this before real customers):**
1. Resend → **Domains → Add Domain →** enter `huevietnamesecuisine.com`.
2. Resend shows a few DNS records (SPF, DKIM, sometimes MX). Add them in Cloudflare:
   **Cloudflare → your domain → DNS → Records → Add record** for each one.
3. Back in Resend, wait until the domain shows **Verified** (usually minutes).
4. In Cloudflare, set secret `MAIL_FROM` = `Huế Vietnamese Cuisine <hello@huevietnamesecuisine.com>`
   (any name @ your verified domain), plus `RESEND_API_KEY` and `NOTIFY_EMAIL` as above.
5. `npm run deploy`. Now it sends branded email to *any* customer.

> SendGrid vs Resend: you don't need SendGrid. Your code uses Resend. Pick one; I
> recommend staying on Resend since the code is already written for it.

---

## B. PayPal — "Something went wrong. Contact the merchant for help"

### Why it happens
That's PayPal's own generic error. The usual cause: the **Client ID** in your
`index.html` PayPal script tag doesn't belong to the **same** PayPal account/app
that owns Hosted Button `JM9PCZ6QGEYBY`. A button can only render under its own
account's client-id.

### Fix — two layers

**Layer 1 (fastest, already ON): the always-working fallback link.**
In `script.js`, `PAYPAL_FORCE_FALLBACK: true` is set. This skips the broken button
and shows a plain "Pay with PayPal" link that goes to your PayPal payment page.
Customers can pay right now. Leave this on until Layer 2 is confirmed.

**Layer 2 (proper in-page button + Venmo/card):**
1. Log in at **paypal.com** with the business account that owns the button.
2. Go to **developer.paypal.com → Apps & Credentials → Live** tab. Open your app
   (or create one). Copy the **Client ID**.
3. Open `index.html`, find near the top:
   ```
   <script src="https://www.paypal.com/sdk/js?client-id=REPLACE_ME&components=buttons,hosted-buttons&enable-funding=venmo&currency=USD"></script>
   ```
   Replace the `client-id=` value with your **Live Client ID** from step 2.
4. Confirm the Hosted Button ID matches: in `script.js`, `PAYPAL_HOSTED_ID` should
   equal the button you created in PayPal (currently `JM9PCZ6QGEYBY`).
5. For the **backend** (create/capture orders, receipts), add these Cloudflare secrets:
   - `PAYPAL_CLIENT_ID` = your Live Client ID
   - `PAYPAL_CLIENT_SECRET` = the Secret shown next to it in the Live app
   - `PAYPAL_ENV` = `live`
6. In `script.js`, set `PAYPAL_FORCE_FALLBACK: false`.
7. `npm run deploy`. Test a real $1 order; refund it from PayPal afterward.

The backend files for this already exist: `functions/api/orders.js`,
`functions/api/orders/[id]/capture.js`, `functions/api/paypal/*`. They read the
three secrets above — you don't edit them.

### Also verify (common silent blocker)
Your PayPal **Business** account must be fully verified (bank/email confirmed, not
"limited"). A limited account throws this exact error even with a correct client-id.

---

## C. Apple Pay / Stripe — "the store's Stripe payments must be connected"

### Why it happens
That message was your site being honest: Stripe wasn't connected. Two blockers:
(1) the key in `script.js` is a **test-mode** `pk_test_...` key, and (2) Apple Pay
requires a one-time **domain verification** with Apple via Stripe.

### Fix
1. **Publishable key (frontend):** dashboard.stripe.com → Developers → API keys →
   copy **Publishable key** (`pk_live_...`). In `script.js`, set
   `STRIPE_PK: 'pk_live_...'`. (Publishable keys are safe to be public.)
2. **Secret key (backend):** copy the **Secret key** (`sk_live_...`). In Cloudflare,
   add secret `STRIPE_SECRET_KEY` = that value. **Never** put `sk_live_` in any file.
3. **Apple Pay domain verification:**
   - Stripe → Settings → Payment methods → **Apple Pay** → Add a new domain →
     `huevietnamesecuisine.com`.
   - Stripe gives a file named `apple-developer-merchantid-domain-association`.
   - Put it in this project's **`.well-known/`** folder (replace the README there).
   - `npm run deploy`. Confirm it loads at
     `https://huevietnamesecuisine.com/.well-known/apple-developer-merchantid-domain-association`
   - Back in Stripe, click **Verify**.
4. `npm run deploy`. Apple Pay only appears in **Safari on an Apple device with a
   card in Wallet** — that part of the original message was accurate, not an error.

Backend files already exist: `functions/api/stripe/payment-intent.js`,
`checkout-session.js`, `session-status.js`. They read `STRIPE_SECRET_KEY`.

---

## D. Order notifications → email + text to you and the customer

- **Customer coupon email** and **your signup notice**: handled by `lead.js` once
  Section A is done.
- **Order-complete emails** (customer receipt + a copy to
  `huevietnamesecuisine@gmail.com`): the capture step in
  `functions/api/orders/[id]/capture.js` has a marked `TODO` where this hooks in.
  Say the word and I'll wire it: on a COMPLETED payment it will email the customer
  their receipt and email you the kitchen ticket (same Resend key as Section A).
- **Text messages (SMS)**: that needs a Twilio account (Account SID + Auth Token +
  a Twilio phone number). Once you have those three, I'll add an `/api/notify-sms`
  function and text each new order to your phone. Tell me the number to send to.

---

## The complete secret list (paste into Cloudflare once)

| Secret name | Value example | Used by |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | coupon + order email |
| `MAIL_FROM` | `Huế Vietnamese Cuisine <hello@huevietnamesecuisine.com>` | email sender |
| `NOTIFY_EMAIL` | `huevietnamesecuisine@gmail.com` | your copy |
| `PAYPAL_CLIENT_ID` | `A...` (Live) | PayPal backend |
| `PAYPAL_CLIENT_SECRET` | `E...` (Live) | PayPal backend |
| `PAYPAL_ENV` | `live` | PayPal backend |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe/Apple Pay backend |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | coupon "first order" check |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | coupon "first order" check |

Two values go in FILES, not secrets (they're safe to be public):
- `STRIPE_PK` (`pk_live_...`) → in `script.js`
- PayPal **Client ID** → in `index.html` script tag

After any secret change: **`npm run deploy`**, then watch **`npm run tail`** while
you test — it prints the real error if anything's still off.

---

## E. Order-completion emails + text alerts — now wired

Every completed order (PayPal, Apple Pay/Stripe, and any future method) now calls
a new endpoint, `/api/orders/notify`, right after payment succeeds. It:

- Emails the **customer** their receipt (if they gave an email and didn't ask for
  text-only updates).
- Emails **you** (`NOTIFY_EMAIL`) a kitchen ticket with every item, option, and the
  customer's contact info — always, regardless of the customer's own preference.
- **Texts your phone** via Twilio with a one-line order summary, if Twilio secrets
  are set.

This never blocks or risks the payment itself — it fires *after* money has already
moved, and a failure here just means you didn't get the alert (check `npm run tail`).

### Add these Twilio secrets in Cloudflare
| Secret name | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (starts `AC`) |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number, e.g. `+18449384118` |
| `NOTIFY_PHONE` | **Confirmed: `+12065549522`** — (206) 554-9522, in E.164 format (required by Twilio) |

> Security note: you pasted your Account SID, Auth Token, and an API Key/Secret
> directly in chat. I did not put any of them in a file — only Cloudflare's secret
> vault should ever hold them. Since they were typed in plaintext here, it's worth
> rotating the Auth Token (Twilio Console → Account → API keys & tokens → regenerate)
> and deleting/recreating that API key, just as a precaution.

After adding the four secrets: `npm run deploy`, place a small test order, and
check your phone + `huevietnamesecuisine@gmail.com`.

---

## F. Price tampering FIXED + verified webhooks — what changed

### The write-in-price page is gone
The old PayPal link (`paypal.com/ncp/payment/JM9PCZ6QGEYBY` — "Write in the price
in the amount field") let customers type their own amount. It has been **completely
removed** from the site: the `PAYPAL_HOSTED_ID`, the force-fallback flag, and the
fallback form are deleted. If PayPal's button ever fails to load now, customers see
an honest "temporarily unavailable — use Apple Pay or call us" message instead of a
page where they set their own price.

### Prices are now computed ONLY on the server
The browser now sends *what* was ordered (item codes, sizes, quantities, tip,
coupon) — never a price. A new `functions/api/_totals.js` recomputes the total from
the server-side menu for **every** payment method (PayPal button, PayPal QR, Apple
Pay, Stripe QR), including tax, the 2.9% fee, Happy Hour, WELCOME5, and validating
the Buy-10-get-1-free rule. Tested: exact-penny math, and it rejects unknown items,
fake sizes, free-sandwich abuse, and absurd quantities. **A customer can no longer
pay $1 for a $60 order.**

### Verified webhooks + paid-exactly-once + notify-exactly-once
- `functions/api/stripe/webhook.js` — verifies Stripe's signature with Web Crypto
  (constant-time compare + 5-minute replay guard), then marks the order Paid.
- `functions/api/paypal/webhook.js` — verifies via PayPal's own
  verify-webhook-signature API, then marks the order Paid.
- Both are idempotent (each event processed once via the `webhook_events` table),
  and notifications are sent exactly once — the browser's rich receipt goes first;
  the webhook is the safety net if the customer closed the tab.

### One-time dashboard setup (2 new secrets)
| Secret | How to get it |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → **Add endpoint** → URL `https://huevietnamesecuisine.com/api/stripe/webhook`, events `payment_intent.succeeded` + `checkout.session.completed` → copy the **Signing secret** (`whsec_...`) |
| `PAYPAL_WEBHOOK_ID` | developer.paypal.com → your **Live** app → **Webhooks → Add webhook** → URL `https://huevietnamesecuisine.com/api/paypal/webhook`, event `PAYMENT.CAPTURE.COMPLETED` → copy the **Webhook ID** |

Also run `functions/supabase-orders.sql` once in Supabase (SQL editor) — it creates
the `orders` and `webhook_events` tables the whole system records into.

Then: `npm run deploy`, place a $1 test order, refund it, and check that the order
row shows `status = paid` in Supabase and you got exactly ONE email + ONE text.
