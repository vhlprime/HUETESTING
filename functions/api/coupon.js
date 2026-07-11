// functions/api/coupon.js — Cloudflare Pages Function
// Server-side WELCOME5 enforcement: first online order only, one redemption per email, $50 minimum.
// SETUP: Cloudflare -> Pages project -> Settings -> Environment variables:
//   SUPABASE_URL              = https://YOUR-PROJECT.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY = (service role key — server only, NEVER in front-end code)
// Then run supabase-coupon.sql once in the Supabase SQL editor.
import { COUPON } from '../_pricing.js';

async function sb(env, path, opts = {}) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers || {}),
    },
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
}

export async function onRequestPost({ request, env }) {
  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  try {
    const { code, email, subtotal, redeem, order } = await request.json();
    const em = String(email || '').trim().toLowerCase();
    if (String(code || '').toUpperCase() !== COUPON.code) return json({ ok: false, reason: 'That code is not valid.' });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return json({ ok: false, reason: 'A valid email is required for this coupon.' });
    if (Number(subtotal) < COUPON.min) return json({ ok: false, reason: `WELCOME5 needs an order of $${COUPON.min} or more.` });

    // already redeemed?
    const prior = await sb(env, `coupon_redemptions?select=id&code=eq.${COUPON.code}&email=eq.${encodeURIComponent(em)}&limit=1`);
    if (prior.ok && Array.isArray(prior.data) && prior.data.length) {
      return json({ ok: false, reason: 'WELCOME5 has already been used with this email — it is for your first order only.' });
    }
    // any prior order on file? (first-order check; table optional)
    const orders = await sb(env, `orders?select=id&email=eq.${encodeURIComponent(em)}&limit=1`);
    if (orders.ok && Array.isArray(orders.data) && orders.data.length) {
      return json({ ok: false, reason: 'WELCOME5 is for first orders only — welcome back though!' });
    }

    if (redeem) {
      const ins = await sb(env, 'coupon_redemptions', {
        method: 'POST',
        body: JSON.stringify({ email: em, code: COUPON.code, order_id: order || null }),
      });
      // unique index makes double-redeem a 409 — treat as already used
      if (!ins.ok && ins.status !== 409) return json({ ok: false, reason: 'Could not record the coupon. Please try again.' }, 500);
    }
    return json({ ok: true, off: COUPON.off });
  } catch (e) {
    return json({ ok: false, reason: 'Bad request' }, 400);
  }
}
