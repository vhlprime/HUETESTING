# Inbound Email Worker — Huế Vietnamese Cuisine (OPTIONAL, separate project)

This is a genuinely **separate Cloudflare project** from your website. Your
website is a **Pages** project (deployed with `wrangler pages deploy`); this
folder is a plain **Worker** (deployed with `wrangler deploy`). Different
product, different command, different folder — don't run these from the
`hue-site` root, and don't run the website's `npm run deploy` from in here.

## What this does
Lets you have an address like `hello@huevietnamesecuisine.com` where every
email that arrives is:
1. Logged to a Supabase table (`inbound_emails`) — nothing gets lost, and you
   could later build a little admin page to browse them.
2. Forwarded to your real inbox (`huevietnamesecuisine@gmail.com` by default)
   — so nothing changes about how you actually read email day to day.

This is entirely additive and optional. If you never set it up, nothing about
your website changes.

---

## One-time setup

**1. Create the Supabase table.**
Supabase dashboard → SQL Editor → paste and run `supabase-inbound-emails.sql`.

**2. Install and deploy this Worker.**
```
cd email-worker
npm install
npx wrangler login          (skip if already logged in from the website project)
npx wrangler deploy
```
This gives you a Worker named `huevietnamesecuisine-inbound-email`.

**3. Add its secrets** (Cloudflare dashboard → Workers & Pages →
`huevietnamesecuisine-inbound-email` → Settings → Variables and Secrets):

| Secret | Value |
|---|---|
| `SUPABASE_URL` | same as your website's |
| `SUPABASE_SERVICE_ROLE_KEY` | same as your website's |
| `FORWARD_TO` | `huevietnamesecuisine@gmail.com` (or wherever you want the copy) |

**4. Turn on Email Routing for your domain.**
Cloudflare dashboard → **Compute → Email Service → Email Routing** → follow
the prompt to enable it (it adds a couple of DNS records automatically, since
your domain is already on Cloudflare).

**5. Verify a destination address** (needed once, so Cloudflare knows it's safe
to forward to it): **Email Routing → Destination Addresses** → add
`huevietnamesecuisine@gmail.com` → open the confirmation email Cloudflare
sends → click Verify.

**6. Create the routing rule.**
**Email Routing → Routing Rules → Create routing rule**:
- Email pattern: e.g. `hello` (for `hello@huevietnamesecuisine.com`) — pick
  whatever address you want customers to write to.
- Action: **Send to a Worker**
- Destination: `huevietnamesecuisine-inbound-email` (the Worker from step 2)
- Save.

## Test it
Send a real email to whatever address you chose (e.g.
`hello@huevietnamesecuisine.com`) from any other email account. Within a
minute you should see it both in your real inbox (forwarded) and as a new row
in Supabase's `inbound_emails` table.

## Notes
- Every email is forwarded **first**, before anything else — so even if
  Supabase is briefly unreachable, you never lose an email to a bug in this
  code.
- Attachments are counted but not stored (their content is not saved) to keep
  this simple and avoid storing large binary data. Ask if you'd like
  attachment storage added later (e.g., to Cloudflare R2).
