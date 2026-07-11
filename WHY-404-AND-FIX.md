# Why you're getting 404s — and the real fix

I checked this against Cloudflare's own documentation to be sure, and here's the
confirmed answer: **this is not a broken file. `wrangler.toml` is working exactly
as designed — it just can't be used the way you're trying to use it.**

## What's actually happening

Cloudflare Pages has three completely different ways to deploy, and they are not
interchangeable:

| Method | Supports `wrangler.toml`? | Supports the `functions/` folder (your payments, coupon, email, SMS)? |
|---|---|---|
| **Dashboard drag-and-drop** ("Direct Upload" in a browser) | ❌ No — it's a CLI-only file | ❌ **No — documented Cloudflare limitation** |
| **Wrangler CLI** (`npm run deploy` in a terminal) | ✅ Yes | ✅ Yes |
| **Git integration** (Cloudflare watches your GitHub repo) | ✅ Yes | ✅ Yes |

Cloudflare's own docs say it plainly:

> "Uploading a /functions directory through the dashboard's Direct Upload option
> does not work." — Cloudflare Pages, Known Issues
>
> "Drag and drop deployments made from the Cloudflare dashboard do not currently
> support compiling a functions folder of Pages Functions. To deploy a functions
> folder, you must use Wrangler [or Git integration]."

So if you've been dragging the `hue-site` folder (or a zip of it) into the
Cloudflare dashboard in your browser: **that method silently throws away your
entire `functions/` folder** — every one of your payment, coupon, email, and SMS
endpoints (`/api/lead`, `/api/orders`, `/api/coupon`, `/api/stripe/*`,
`/api/paypal/*`) never gets created. That's exactly why they 404. And
`wrangler.toml` "can't be uploaded" because that upload box was never built to
accept it — it's not a bug, it's just the wrong tool for a site with a backend.

The "files within files within more files" feeling you had is a second symptom of
the same issue: nested folders like `functions/api/orders/[id]/capture.js` are
exactly the kind of structure that browser drag-and-drop handles awkwardly, while
a real deploy tool (Wrangler or Git) handles automatically without you touching
individual files.

**No version of `wrangler.toml` fixes this — the browser upload box literally
cannot process it.** You have to switch methods. Here are your two working options.

---

## Option A (recommended, since you already have GitHub): connect Git

This is the best long-term setup: push your code to GitHub once, then every future
change is just `git push` — no more manual uploads, ever, and Functions work
correctly every time.

**1. Get the project onto GitHub** (skip if it's already there):
   - Go to github.com → **New repository** → name it `hue-site` → Create.
   - In VS Code, open the `hue-site` folder, open the terminal, run:
     ```
     git init
     git add .
     git commit -m "Initial site"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/hue-site.git
     git push -u origin main
     ```

**2. Connect Cloudflare to that repo:**
   - Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
   - Choose your `hue-site` repository.
   - Build settings:
     - **Framework preset:** None
     - **Build command:** *(leave empty — this is a plain site, no build step)*
     - **Build output directory:** `/` (just a forward slash — the repo root)
   - Click **Save and Deploy**.

That's it — Cloudflare will pull the whole repo, including `functions/` and
`wrangler.toml`, and deploy them correctly together. It reads `wrangler.toml` from
the repo automatically for the compatibility date/flags.

**Every future change:** edit files in VS Code → `git add . && git commit -m "..."
&& git push` → Cloudflare redeploys automatically in under a minute. No dragging,
no zip files, no missing folders.

---

## Option B: keep using Wrangler CLI (no GitHub needed)

If you'd rather not set up GitHub right now, the terminal method already fully
supports everything — you just have to run it instead of using the browser upload:

```
cd hue-site
npm install
npx wrangler login
npm run deploy
```

This reads `wrangler.toml`, uploads your static files **and** compiles the entire
`functions/` folder (including the `[id]` nested routes) into working endpoints,
all in one step. This is the same command from DEPLOY.md — if the 404s were from
drag-and-drop, switching to this alone should fix them immediately.

---

## What NOT to do
Don't use the Cloudflare dashboard's drag-and-drop / "Direct Upload" box for this
project going forward — it will always silently drop your `functions/` folder,
no matter how the files are organized or zipped. It's fine for a pure front-end-only
site with no backend, but this project has one, so it needs Option A or B above.

## If you've already deployed a project via drag-and-drop
That existing Pages project is permanently limited to Direct Upload — Cloudflare
does not allow switching an existing project from Direct Upload to Git
integration. The clean fix is to create a **new** Pages project using Option A
above, get it working, then point `huevietnamesecuisine.com`'s Custom Domain at
the new project and remove it from the old one (same domain-move steps as in
DEPLOY.md).
