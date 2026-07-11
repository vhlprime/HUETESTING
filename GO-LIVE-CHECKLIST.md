# GO-LIVE CHECKLIST — Huế Vietnamese Cuisine

One list, in order. Do each step, check it off, move to the next. Every secret
name below was pulled directly from your actual code, so this is complete and
accurate — nothing extra, nothing missing.

**Two different places things get pasted:**
- **Cloudflare secrets** → Cloudflare dashboard → **Workers & Pages → your site
  project → Settings → Variables and Secrets → Production → Add** (as *Secret*).
- **Public code values** (safe to be visible) → directly in `index.html` or
  `script.js`, then redeployed.

---

## PHASE 1 — Supabase (do this first; everything else logs into it)

- [ ] Go to supabase.com → your project → **SQL Editor**.
- [ ] Run each of these files, one at a time (each is a separate paste-and-run):
  - [ ] `functions/supabase-orders.sql`
  - [ ] `functions/supabase-discrepancies.sql`
  - [ ] `functions/supabase-coupon.sql`
  - [ ] `email-worker/supabase-inbound-emails.sql`
  - [ ] `functions/supabase-payroll.sql`
- [ ] Go to **Project Settings → Data API** → copy the **Project URL**.
- [ ] Go to **Project Settings → API Keys** → copy the **service_role** key
      (not the anon/public one).
- [ ] Add as Cloudflare secrets on your **website** project:
  - [ ] `SUPABASE_URL` = the Project URL
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` = the service_role key

---

## PHASE 2 — Resend (customer + kitchen emails)

- [ ] resend.com → **API Keys → Create** → copy it (starts `re_`).
- [ ] Add as Cloudflare secret: `RESEND_API_KEY`
- [ ] Decide your sender. Two options:
  - **Quick test today:** `MAIL_FROM` = `Huế Vietnamese Cuisine <onboarding@resend.dev>`
  - **Real, branded (do this before real customers):** Resend → **Domains →
    Add Domain** → `huevietnamesecuisine.com` → add the DNS records it shows
    you in Cloudflare's DNS tab → wait for "Verified" → then
    `MAIL_FROM` = `Huế Vietnamese Cuisine <hello@huevietnamesecuisine.com>`
- [ ] Add as Cloudflare secret: `NOTIFY_EMAIL` = `huevietnamesecuisine@gmail.com`

---

## PHASE 3 — Twilio (SMS alerts) — you already have these values

- [ ] Add as Cloudflare secret: `TWILIO_ACCOUNT_SID`
- [ ] Add as Cloudflare secret: `TWILIO_AUTH_TOKEN`
- [ ] Add as Cloudflare secret: `TWILIO_FROM_NUMBER` = `+18449384118`
- [ ] Add as Cloudflare secret: `NOTIFY_PHONE` = `+12065549522`

---

## PHASE 4 — PayPal

- [ ] developer.paypal.com → **Apps & Credentials → Live tab** → open your app
      (or create one) → copy the **Client ID** and **Secret**.
- [ ] Open `index.html`, find the line near the top:
  ```
  <script src="https://www.paypal.com/sdk/js?client-id=...">
  ```
  Replace the `client-id=` value with your real **Live Client ID**.
- [ ] Add as Cloudflare secrets on your website project:
  - [ ] `PAYPAL_CLIENT_ID`
  - [ ] `PAYPAL_CLIENT_SECRET`
  - [ ] `PAYPAL_ENV` = `live`
- [ ] Same Developer Dashboard → **Webhooks → Add Webhook**:
  - URL: `https://huevietnamesecuisine.com/api/paypal/webhook`
  - Event: `PAYMENT.CAPTURE.COMPLETED`
  - Copy the **Webhook ID** it gives you.
- [ ] Add as Cloudflare secret: `PAYPAL_WEBHOOK_ID`

---


## PHASE 4.5 — Manager login + orders dashboard (new)

The manager dashboard is at **/manager.html** (e.g.
`https://huevietnamesecuisine.com/manager.html`). It shows real-time orders and
the email inbox, and lets the manager reply to customers — all protected by a
login only you know. Full details: `functions/api/admin/README-auth.md`.

- [ ] In VS Code terminal, generate your own credentials (replace YOUR-PASSWORD):
  ```
  node -e "const c=require('crypto');const salt=c.randomBytes(24).toString('hex');const sess=c.randomBytes(32).toString('hex');const pw='YOUR-PASSWORD';console.log('MANAGER_SALT =',salt);console.log('SESSION_SECRET =',sess);console.log('MANAGER_PASSWORD_HASH =',c.createHash('sha256').update(salt+pw).digest('hex'));"
  ```
- [ ] Add as Cloudflare secrets on your website project:
  - [ ] `MANAGER_USER` = your chosen username (e.g. `manager`)
  - [ ] `MANAGER_SALT` = the printed salt
  - [ ] `MANAGER_PASSWORD_HASH` = the printed hash
  - [ ] `SESSION_SECRET` = the printed session secret
- [ ] After deploy, visit `/manager.html`, log in, confirm orders appear.

---


## PHASE 4.6 — Staff payroll portal (new)

Employees clock in/out at **/portal.html**; the manager sees everyone's hours
under the **Payroll** tab of `/manager.html` and adds staff there too.

- [ ] Supabase SQL Editor → run `functions/supabase-payroll.sql` (creates the
      `staff` and `shifts` tables).
- [ ] No new secrets needed — staff auth reuses `SESSION_SECRET` from Phase 4.5.
- [ ] After deploy, log into `/manager.html` → **Payroll** tab → "Add a staff
      member" to create each employee's login (username + temp password).
- [ ] Give each employee `/portal.html` + their login. They tap **Clock In** at
      the start of a shift and **Clock Out** at the end; their weekly hours show
      right on the page, and you see everyone's totals (and pay, if you set an
      hourly rate) in the Payroll tab.

---

## PHASE 5 — Stripe (Apple Pay + cards)

- [ ] dashboard.stripe.com → **Developers → API keys** → copy the
      **Publishable key** (`pk_live_...`).
- [ ] Open `script.js`, find `STRIPE_PK:` near the top, replace the value
      (currently a leftover **test** key) with your real `pk_live_...` one.
- [ ] Same page → copy the **Secret key** (`sk_live_...`).
- [ ] Add as Cloudflare secret: `STRIPE_SECRET_KEY`
- [ ] Stripe → **Developers → Webhooks → Add endpoint**:
  - URL: `https://huevietnamesecuisine.com/api/stripe/webhook`
  - Events: `payment_intent.succeeded` and `checkout.session.completed`
  - Copy the **Signing secret** (`whsec_...`).
- [ ] Add as Cloudflare secret: `STRIPE_WEBHOOK_SECRET`
- [ ] Apple Pay domain verification: Stripe → **Settings → Payment methods →
      Apple Pay → Add a new domain** → `huevietnamesecuisine.com` → download
      the file it gives you → put it in this project's `.well-known/` folder
      (replacing the placeholder file there) → redeploy → click **Verify** in Stripe.

---

## PHASE 6 — Deploy the website

- [ ] In VS Code, from the `hue-site` folder:
  ```
  npm run deploy
  ```
- [ ] Confirm all 14 secrets are visible under **Settings → Variables and
      Secrets** on this project (the list above, all in one place).

---

## PHASE 7 — Deploy the inbound-email Worker (now required)

This is a **separate** Cloudflare project — different command, different folder.

- [ ] In VS Code terminal:
  ```
  cd email-worker
  npm install
  npx wrangler deploy
  ```
- [ ] Add its 3 secrets (Cloudflare dashboard → Workers & Pages →
      `huevietnamesecuisine-inbound-email` → Settings → Variables and Secrets):
  - [ ] `SUPABASE_URL` (same value as Phase 1)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (same value as Phase 1)
  - [ ] `FORWARD_TO` = `huevietnamesecuisine@gmail.com`
- [ ] Cloudflare dashboard → **Compute → Email Service → Email Routing** →
      enable it for your domain (adds a couple of DNS records automatically).
- [ ] **Email Routing → Destination Addresses** → add
      `huevietnamesecuisine@gmail.com` → open the verification email → click Verify.
- [ ] **Email Routing → Routing Rules → Create routing rule**:
  - Email pattern: pick an address, e.g. `hello`
  - Action: **Send to a Worker**
  - Destination: `huevietnamesecuisine-inbound-email`
  - Save.

---

## PHASE 8 — Test everything, in this order

- [ ] **Coupon signup:** join the email list on the site → confirm the
      WELCOME5 email arrives.
- [ ] **PayPal:** place a $1 test order → confirm it completes, then refund it
      from your PayPal account.
- [ ] **Apple Pay / Stripe:** on an iPhone in Safari, place a $1 test order →
      confirm the Apple Pay sheet appears and completes → refund in Stripe.
- [ ] **Notifications:** after either test order, confirm you got: a customer
      receipt email, a kitchen-ticket email, and a text message.
- [ ] **Discrepancy guard:** nothing to do here — it only ever fires if
      something's wrong, which a normal test order won't trigger.
- [ ] **Inbound email:** send a real email to your new address (e.g.
      `hello@huevietnamesecuisine.com`) from a different account → confirm it
      shows up forwarded in your Gmail, and as a new row in Supabase's
      `inbound_emails` table.

---

Once every box above is checked, your full pipeline — order → verified
payment → database "Paid" state → email receipt → kitchen ticket → text
alert, plus inbound email logging — is live end to end for the first time.
