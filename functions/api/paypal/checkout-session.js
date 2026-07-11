// functions/api/paypal/checkout-session.js — POST /api/paypal/checkout-session
// "Scan to pay" QR flow. Amount is computed server-side from the cart payload.
import { ppFetch } from '../_paypal.js';
import { computeTotals } from '../_totals.js';

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
        purchase_units: [{ amount: { currency_code: 'USD', value: totals.total.toFixed(2) } }],
        application_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' },
      }),
    });
    const approveUrl = data?.links?.find(l => l.rel === 'approve')?.href;
    if (!ok || !approveUrl) return new Response(JSON.stringify({ error: 'create_failed' }), { status: 502 });
    return new Response(JSON.stringify({ id: data.id, approveUrl, total: totals.total }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
