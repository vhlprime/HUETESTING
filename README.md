# Huế Vietnamese Cuisine — website project

## Files
- `index.html`  — the page (links to styles.css and script.js)
- `styles.css`  — all styles
- `script.js`   — menu data, photo map, cart, checkout, loyalty, sheets
- `images/`     — 16 optimized photos (all ≤ 120 KB each for fast mobile loading)

## Photo → menu item map (in script.js, `PHOTOS`)
A1 egg rolls · A6 summer rolls · A13 calamari tofu · A14 salt & pepper calamari
S1 oxtail & meatball phở · S4 rare steak & meatball phở · S6 chicken phở · S9 beef rib phở
N1 bún bò huế (REAL photo — no AI caption) · M1 mongolian beef · M2 shaken beef (bò lúc lắc)
W3 shrimp fried rice · B1 combo bánh mì · B2 bánh mì thịt · B4 roasted pork bánh mì
business-card.jpg appears above the footer, tap → order page.

Every AI image shows "AI-assisted illustration; actual food may vary." directly
below it (menu rows, featured gallery, and business card).

## To add/change a photo later
1. Drop the JPEG into `images/` (keep it under ~150 KB).
2. Add one line to `PHOTOS` in script.js, e.g.  `C1:'images/fish-sauce-wings.jpg',`
3. Add the code to `AI_PHOTO` if the photo is AI-generated.

## Deploy on Cloudflare Pages (your current host)
1. Put these files in your GitHub repo root (same repo that has your `functions/` folder).
2. Commit + push. Cloudflare Pages auto-builds and deploys to your live URL.
3. Keep `functions/_pricing.js` in sync with any menu price changes in script.js.
