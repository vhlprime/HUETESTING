// functions/api/orders.js — POST /api/orders
// Creates a PayPal order. The browser sends WHAT was ordered; the PRICE is computed
// here from the server menu (_totals.js). Customers cannot modify the amount.
import { ppFetch } from './_paypal.js';
import { computeTotals } from './_totals.js';

export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.json();
    let totals;
    try { totals = computeTotals(payload); }
    catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 400 }); }

    const { ok, data } = await ppFetch(env, '/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: totals.total.toFixed(2) }, description: 'Huế Vietnamese Cuisine order' }],
      }),
    });
    if (!ok || !data?.id) return new Response(JSON.stringify({ error: 'create_failed' }), { status: 502 });
    return new Response(JSON.stringify({ id: data.id, total: totals.total }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
