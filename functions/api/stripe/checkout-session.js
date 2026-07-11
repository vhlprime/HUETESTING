// functions/api/stripe/checkout-session.js — POST /api/stripe/checkout-session
// "Scan to pay" QR flow via Stripe Checkout. Amount computed server-side from the cart payload.
import { computeTotals } from '../_totals.js';

export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.json();
    let totals;
    try { totals = computeTotals(payload); }
    catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 400 }); }

    const origin = new URL(request.url).origin;
    const body = new URLSearchParams({
      mode: 'payment',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': 'Huế Vietnamese Cuisine order',
      'line_items[0][price_data][unit_amount]': String(Math.round(totals.total * 100)),
      'line_items[0][quantity]': '1',
      success_url: `${origin}/?paid=1`,
      cancel_url: `${origin}/?paid=0`,
    });
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + btoa(`${env.STRIPE_SECRET_KEY}:`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const d = await r.json();
    if (!r.ok) return new Response(JSON.stringify({ error: d?.error?.message || 'stripe_failed' }), { status: 502 });
    return new Response(JSON.stringify({ id: d.id, url: d.url, total: totals.total }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
