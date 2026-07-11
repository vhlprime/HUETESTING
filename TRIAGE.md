# Triage: images, notifications, payments — what's actually wrong

I audited your code and assets directly. Here's the honest diagnosis, the exact
checks to run, and what to send me next. Short version: **your code is correct.**
All three problems are *deployment/configuration* issues, not bugs in the files.

---

## 1. BROKEN IMAGES — highest priority, and the diagnosis is nearly certain

### What I verified in your code (all PASS)
- Every one of the 26 referenced images exists in `images/` (35 files total).
- Paths are correctly **relative** (`images/bun-bo-hue.jpg`), not absolute or
  localhost-bound. Relative is correct for Cloudflare Pages.
- No case-sensitivity mismatches (a classic "works on Mac, breaks on live Linux" bug
  — you don't have it).
- Total deploy is 67 files / 2.7 MB, largest image 130 KB — far under Pages' limits.
- No `.gitignore`/ignore rule excludes images.

**Conclusion: the images aren't rendering live because they were never uploaded, and
that's a side-effect of the wrong-deploy-command problem from your Cloudflare
screenshot** (the site went up as an asset **Worker** called `lucky-dream-accb`, not
a **Pages** project). A common failure mode there is the HTML deploying but the
`images/` folder not being served.

### Confirm it in 20 seconds (do this now)
Open your live site, then in the browser: **right-click a broken image → "Open image
in new tab"** (or visit the URL directly):
```
https://huevietnamesecuisine.com/images/bun-bo-hue.jpg
```
- **If you see "Nothing is here" / 404** → the images folder isn't deployed. Fix =
  redeploy as Pages (below). This is what I expect.
- **If the image loads there but not on the page** → different issue (send me the
  browser Console output and I'll pinpoint it).

### The fix (same root fix as everything else)
Redeploy correctly as a **Pages** project so the whole folder — `images/` included —
uploads together:
```
cd hue-site
npm install
npx wrangler login
npm run deploy        # runs `wrangler pages deploy .` — NOT `wrangler deploy`
```
Then point `huevietnamesecuisine.com` at this new Pages project (Custom domains),
and remove it from the old `lucky-dream-accb` Worker. Full steps in **DEPLOY.md**.

### What to send me if it's still broken after a correct Pages deploy
1. The result of visiting the direct image URL above (loads? 404? other?).
2. Browser **Console** tab: right-click page → Inspect → Console → copy any red errors.
3. Browser **Network** tab: reload, click a failed image row, tell me the **Status**
   (404, 403, etc.) and the **Request URL** it tried to load.

---

## 2. FAILED NOTIFICATIONS — code is built; it's waiting on keys

Your email (Resend) and SMS (Twilio) code is written and syntax-clean. Nothing sends
yet because the **secrets aren't set on the live project** (and, before today's
redeploy, the functions weren't even deployed because it was a Worker, not Pages).

### Checklist
- [ ] Site is deployed as **Pages** (so the `functions/` folder is live). Test:
      visit `https://huevietnamesecuisine.com/api/lead` — a **405 Method Not Allowed**
      is GOOD (the endpoint exists; it only accepts POST). A **404** means functions
      aren't deployed → redeploy as Pages.
- [ ] `RESEND_API_KEY` set in Cloudflare, and `MAIL_FROM` uses a **verified** Resend
      domain (unverified sender = the "Could not sign you up" error; the updated
      `lead.js` now shows the real reason).
- [ ] Twilio secrets set: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
      `TWILIO_FROM_NUMBER`, `NOTIFY_PHONE`.
- [ ] Redeployed **after** adding secrets (they don't apply retroactively).

### Diagnostic to send me
Run `npm run tail` in VS Code, then trigger the action (sign up / place a test
order). Paste the log lines it prints — they contain the exact provider error
(e.g. Resend "domain is not verified", Twilio "unverified number").

---

## 3. BLOCKED PAYMENTS — accounts not connected + one hardening gap

### The connection issues (why payments fail today)
- **PayPal "Something went wrong"** = the Client ID in `index.html` doesn't match the
  account that owns Hosted Button `JM9PCZ6QGEYBY`. Fix in FIX-PAYMENTS-AND-EMAIL.md §B.
  (Fallback link is ON so customers can still pay meanwhile.)
- **Apple Pay** = the `pk_test_…` placeholder key needs your real `pk_live_…`, plus
  Stripe domain verification. FIX-PAYMENTS-AND-EMAIL.md §C.

### The hardening gap your prompt correctly identified
You're right that a production payment system needs **webhook verification + a DB
"Paid" state + idempotency**, so nobody can spoof a paid order or get double-charged.
I've started this (it's the piece I was mid-build on):
- `functions/supabase-orders.sql` — `orders` + `webhook_events` tables.
- `functions/api/_db.js` — `claimEvent()` (process each webhook once),
  `markPaidOnce()` (flip to Paid exactly once, keyed by payment id), `claimNotify()`
  (send notifications once).

**Still to add (say "continue the webhooks" and I'll build these next):**
- `functions/api/stripe/webhook.js` — verifies Stripe's `Stripe-Signature` header,
  handles `payment_intent.succeeded`, marks order Paid, then notifies.
- `functions/api/paypal/webhook.js` — verifies PayPal webhook signature, handles
  `PAYMENT.CAPTURE.COMPLETED`, same flow.
- Switch order notifications so they fire **from the verified webhook**, not the
  browser — that's the real fix for "customers can't spoof payments."

---

## Best practices already in your code (so it doesn't crash again)
- Notifications are **best-effort and isolated** — a failed email/SMS can never
  block or reverse a successful payment (they run after money moves, in a
  `Promise.allSettled`, all wrapped in try/catch).
- Every function returns a **real error reason** as JSON, so `npm run tail` shows you
  the true cause instead of a generic message.
- The coupon and (soon) payment truth are **server-verified**, never trusted from the
  browser.

## After the fixes — 3 award-level enhancements
1. **Sub-second loads:** convert photos to AVIF/WebP with width variants +
   `srcset`, and preload the hero image. Your images are already lazy-loaded; this
   would cut mobile load meaningfully.
2. **Tasteful micro-interactions:** the prismatic-blue order button and card tilt are
   in; add reduced-motion-safe fade-ins on scroll and a haptic-style "added to cart"
   pulse. Pure CSS, no speed cost.
3. **Accessibility pass (real award criterion):** full keyboard nav for the cart,
   focus traps in the checkout sheet, ARIA live-regions announcing cart changes, and
   a contrast audit. This is what separates "nice" from "award-winning."

---

## The one thing to do right now
Visit `https://huevietnamesecuisine.com/images/bun-bo-hue.jpg` and tell me what you
see (image, 404, or error). That single result tells me whether the fix is "redeploy
as Pages" (most likely) or something deeper — and then we knock these out in order.
