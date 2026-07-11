// functions/api/paypal/order-status/[id].js — GET /api/paypal/order-status/:id
// Polled by the QR "scan to pay" screen. Captures the order once the customer approves on their phone.
import { ppFetch } from '../../_paypal.js';

export async function onRequestGet({ env, params }) {
  try {
    const id = params.id;
    const got = await ppFetch(env, `/v2/checkout/orders/${id}`, { method: 'GET' });
    if (!got.ok) return new Response(JSON.stringify({ error: 'lookup_failed' }), { status: 502 });
    if (got.data.status === 'APPROVED') {
      const cap = await ppFetch(env, `/v2/checkout/orders/${id}/capture`, { method: 'POST' });
      return new Response(JSON.stringify(cap.data), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(got.data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
