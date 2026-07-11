// functions/api/stripe/payment-intent.js — POST /api/stripe/payment-intent
// Apple Pay / Payment Request sheet. Amount is computed server-side from the cart payload.
import { computeTotals } from '../_totals.js';

export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.json();
    let totals;
    try { totals = computeTotals(payload); }
    catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 400 }); }

    const body = new URLSearchParams({
      amount: String(Math.round(totals.total * 100)),
      currency: 'usd',
      'automatic_payment_methods[enabled]': 'true',
      description: 'Huế Vietnamese Cuisine order',
    });
    const r = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`${env.STRIPE_SECRET_KEY}:`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const d = await r.json();
    if (!r.ok) return new Response(JSON.stringify({ error: d?.error?.message || 'stripe_failed' }), { status: 502 });
    return new Response(JSON.stringify({ clientSecret: d.client_secret, total: totals.total }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
