# Deploy & Fix Guide — Huế Vietnamese Cuisine

> **Getting a 404 on your live site, or Cloudflare won't accept `wrangler.toml`?**
> Read **WHY-404-AND-FIX.md** first — it's a confirmed, documented Cloudflare
> platform limitation (dashboard drag-and-drop can't deploy the `functions/`
> folder), not a broken file, and it has a clear fix.

# Fix & Go-Live Guide — Huế Vietnamese Cuisine

Your site is live 🎉 — but it deployed as the wrong Cloudflare product, which is why
the coupon signup, PayPal, and Apple Pay errors are happening. This guide fixes all
three in one pass.

---

## Part 1 — Why nothing but the page itself works

Your screenshot showed a project called **`lucky-dream-accb`** with the message
*"Variables cannot be added to a Worker that only…"*. That sentence is the whole
story: at some point `npx wrangler deploy` (the **Workers** command) was run instead
of `npx wrangler pages deploy` (the **Pages** command). Because of that:

- Cloudflare made a plain **Worker with static assets** — a different product from
  **Pages**, even though both live under "Workers & Pages" in the dashboard.
- Your `functions/` folder — which contains the coupon signup, PayPal, and Stripe
  code — is a **Pages-only** feature. A plain Worker ignores it completely.
- That's why `/api/lead` doesn't exist → coupon signup fails with a generic error.
- That's why you can't add environment variables — that screen is blocked for
  asset-only Workers, but works normally on Pages projects.

**The fix is to deploy the same files again, correctly, as a Pages project.**
Nothing about your site's design or menu changes — this is purely a deployment
mechanics fix.

---

## Part 2 — Redeploy correctly (5 minutes)

In VS Code, open this `hue-site` folder (`File → Open Folder`), then in the
terminal:

```
npm install
npx wrangler login
npm run deploy
```

- First run: it asks to create a project. Say **yes**, and use the name
  `huevietnamesecuisine` (already set in `wrangler.toml`).
- You'll get a new URL like `https://huevietnamesecuisine.pages.dev`. That's your
  new, correct Pages project — separate from the old `lucky-dream-accb` Worker.

### Move your domain over
1. **Workers & Pages → huevietnamesecuisine** (the new Pages project) **→ Custom
   domains → Set up a custom domain →** enter `huevietnamesecuisine.com`.
2. **Workers & Pages → lucky-dream-accb** (the old Worker) **→ Domains →** remove
   `huevietnamesecuisine.com` from there (a domain can only point to one project).
3. Once the new project is confirmed working with the domain, you can delete
   `lucky-dream-accb` — **Settings → Delete** (optional cleanup, not urgent).

### Add your secrets (now this screen will work)
**huevietnamesecuisine → Settings → Variables and Secrets → Production**, add each
as **Secret** (encrypted):

| Name | From |
|---|---|
| `RESEND_API_KEY` | resend.com → API Keys |
| `SUPABASE_URL` | supabase.com → your project → Settings → Data API |
| `SUPABASE_SERVICE_ROLE_KEY` | same page → API keys → service role |
| `PAYPAL_CLIENT_ID` | developer.paypal.com → Apps & Credentials → **Live** tab |
| `PAYPAL_CLIENT_SECRET` | same app, right next to the Client ID |
| `PAYPAL_ENV` | type exactly: `live` |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys → **Secret key** (starts `sk_live_`) |

Run `npm run deploy` once more after adding these so the live site picks them up.
Also run `functions/supabase-coupon.sql` once in Supabase's SQL editor (this makes
the WELCOME5 coupon enforce "first order only" for real).

---

## Part 3 — Fix the PayPal error

**"Something went wrong. Contact the merchant for help"** is PayPal's own generic
error, and by far the most common cause is: **the Client ID in your site's PayPal
script tag doesn't belong to the same PayPal account that created the Hosted Button.**

1. Log into **paypal.com** with the account that owns the button, go to
   **Pay Button / PayPal Buttons manager**, and confirm the button ID
   `JM9PCZ6QGEYBY` is active and note which app/account made it.
2. Go to **developer.paypal.com → Apps & Credentials → Live tab**, and copy the
   **Client ID** for that same account.
3. Open `index.html`, find this line near the top:
   ```
   <script src="https://www.paypal.com/sdk/js?client-id=...">
   ```
   Replace the `client-id=` value with the Client ID from step 2.
4. Also confirm your PayPal Business account shows **fully verified** (not
   limited) — a limited account can throw this same error.

**While you sort that out, customers can still pay tonight.** I turned on a
temporary stopgap (`PAYPAL_FORCE_FALLBACK: true` near the top of `script.js`) that
skips the broken button and shows a plain, always-working "Pay with PayPal" link
instead. Once you've fixed the client-id and tested it works, set that flag back to
`false` to restore the nicer in-page button.

---

## Part 4 — Turn on Apple Pay / real Stripe checkout

Apple Pay's error was not a bug — it was your site being honest that Stripe wasn't
connected yet. It now is, in code; three things left:

1. **Replace the placeholder Stripe key.** Line ~27 of `script.js` currently has
   a `pk_test_...` key (Stripe **test mode** — this actually came from a suspicious
   file uploaded earlier in our conversation, not something you entered yourself).
   Go to **dashboard.stripe.com → Developers → API keys**, copy your real
   **Publishable key** (starts `pk_live_`), and put it in `STRIPE_PK` in `script.js`.
   This one is safe to be public. The matching **Secret key** goes only in
   Cloudflare's environment variables (Part 2 table above) — never in this file.
2. **Verify your domain for Apple Pay.** Stripe Dashboard → Settings → Payment
   methods → Apple Pay → Add a new domain → `huevietnamesecuisine.com`. Download
   the file it gives you and put it in this project's `.well-known/` folder,
   replacing the placeholder `README-apple-pay.txt` — full steps are inside that
   folder. Redeploy, then click Verify in Stripe.
3. Redeploy (`npm run deploy`). Apple Pay only shows up on Safari on an Apple
   device with a card already in Wallet — that part of the error message was
   accurate, not a bug.

---

## Part 5 — Where the photos live

- All dish photos are in the **`images/`** folder — open it in VS Code to see or
  swap any file.
- Which photo goes with which menu item is controlled by **`const PHOTOS = {...}`**
  near the top of `script.js` — e.g. `A1:'images/egg-rolls-real.jpg'` means item
  code A1 uses that file. Change the path there to swap a photo without touching
  any HTML.
- To add a brand-new photo: drop the file into `images/`, then add a line to
  `PHOTOS` pointing the right item code at it.

---

## On the repeated Next.js / tRPC / Prisma / MCP requests

Same answer as before, now with real evidence behind it: tonight's outage was
caused by a *one-word mixup in a single deploy command* on your current simple
stack. A full framework rewrite (Next.js + tRPC + Prisma) multiplies the number of
places that kind of mistake can happen, for a site that already does everything
you've asked for. I'd only recommend it if you hired a developer to maintain it
day-to-day. Cloudflare, Supabase, Stripe, and PayPal are usable directly in our
chats already — no separate MCP setup needed for those. A GitHub connector isn't
currently linked; say so if you'd like it and I can look at connecting one.
