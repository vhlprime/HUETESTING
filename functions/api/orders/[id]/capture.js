// functions/api/orders/[id]/capture.js — POST /api/orders/:id/capture
// Captures the PayPal order server-side and VERIFIES the captured amount matches what the
// server independently computed from the cart. This is the discrepancy guard: even if
// someone tampered with the client or the PayPal order, a mismatch is caught, logged, and
// (optionally) alerted — the receipt/kitchen ticket only fire on an exact, verified match.
import { ppFetch } from '../../_paypal.js';
import { computeTotals } from '../../_totals.js';

export async function onRequestPost({ request, env, params }) {
  try {
    const orderId = params.id;
    if (!orderId) return new Response(JSON.stringify({ error: 'Missing order id' }), { status: 400 });

    const body = await request.json().catch(() => ({}));
    const snapshot = body.order || {};        // browser's record: order code, items, contact — for the receipt
    const cartPayload = body.payload || null; // {items,tip,coupon,free} — lets us re-verify the price independently

    // 1) Capture the payment with PayPal (source of truth for what was actually charged).
    const { ok, data } = await ppFetch(env, `/v2/checkout/orders/${orderId}/capture`, { method: 'POST' });
    if (!ok) return new Response(JSON.stringify({ error: 'capture_failed', detail: data }), { status: 502 });

    const cap = data?.purchase_units?.[0]?.payments?.captures?.[0];
    const paidValue = cap ? Number(cap.amount?.value) : NaN;
    const paidStatus = cap?.status || data?.status;

    // 2) DISCREPANCY GUARD: recompute the correct total from the cart, compare to what PayPal charged.
    let expected = null, mismatch = false;
    if (cartPayload) {
      try {
        expected = computeTotals(cartPayload).total;                 // server-authoritative price
        mismatch = Math.abs(expected - paidValue) > 0.01;            // penny tolerance
      } catch (_) { /* invalid cart => treat as mismatch below */ mismatch = true; }
    }

    // 3) If the numbers don't line up, do NOT treat it as a clean sale.
    //    Record it for review and flag it back to the browser (no receipt/kitchen ticket fires).
    if (cartPayload && mismatch) {
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/payment_discrepancies`, {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderId, order_code: snapshot.code || null,
            expected_total: expected, paid_total: paidValue,
            email: snapshot.email || null, raw: data,
          }),
        }).catch(() => {});
      }
      // Optional instant alert to the owner (Resend) — only if the key is set.
      if (env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: env.MAIL_FROM || 'Huế Vietnamese Cuisine <onboarding@resend.dev>',
            to: [env.NOTIFY_EMAIL || 'huevietnamesecuisine@gmail.com'],
            subject: `⚠️ Payment amount mismatch on order ${snapshot.code || orderId}`,
            html: `<p>A PayPal capture did not match the expected total.</p>
                   <p><b>Expected:</b> $${expected}<br><b>Paid:</b> $${paidValue}</p>
                   <p>Order ${orderId} has been flagged for review in Supabase. No receipt was sent.</p>`,
          }),
        }).catch(() => {});
      }
      return new Response(JSON.stringify({
        status: 'AMOUNT_MISMATCH', expected, paid: paidValue,
        message: 'Payment captured but amount did not match the order total. Flagged for review.',
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    // 4) Clean, verified sale. (Notifications fire from /api/orders/notify + the webhook safety net.)
    return new Response(JSON.stringify({ ...data, verified: true, expected, paid: paidValue, paidStatus }),
      { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
