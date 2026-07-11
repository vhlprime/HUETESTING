// functions/api/paypal/webhook.js — POST /api/paypal/webhook
// Verifies each webhook with PayPal's verify-webhook-signature API, processes it
// exactly once, marks the order Paid, and sends notifications as a safety net.
//
// SETUP: developer.paypal.com -> your Live app -> Webhooks -> Add webhook
//   URL: https://huevietnamesecuisine.com/api/paypal/webhook
//   Event: PAYMENT.CAPTURE.COMPLETED
//   Copy the Webhook ID -> Cloudflare secret PAYPAL_WEBHOOK_ID
import { ppFetch } from './_paypal.js';
import { claimEvent, markPaidOnce, claimNotify, sb } from '../_db.js';
import { sendOrderEmails, sendOrderSMS } from '../_notify.js';

export async function onRequestPost({ request, env }) {
  const bodyText = await request.text();
  let event;
  try { event = JSON.parse(bodyText); } catch { return new Response('Bad body', { status: 400 }); }

  // Ask PayPal itself to confirm this webhook is genuine (their recommended method).
  const verify = await ppFetch(env, '/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      transmission_id: request.headers.get('paypal-transmission-id'),
      transmission_time: request.headers.get('paypal-transmission-time'),
      cert_url: request.headers.get('paypal-cert-url'),
      auth_algo: request.headers.get('paypal-auth-algo'),
      transmission_sig: request.headers.get('paypal-transmission-sig'),
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: event,
    }),
  });
  if (!verify.ok || verify.data?.verification_status !== 'SUCCESS') {
    return new Response('Bad signature', { status: 400 });
  }

  if (!(await claimEvent(env, 'paypal', event.id))) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const cap = event.resource || {};
    const paymentId = cap.id;
    const cents = cap.amount ? Math.round(Number(cap.amount.value) * 100) : null;
    const code = cap.custom_id || `PAYPAL-${String(paymentId).slice(-8)}`;

    const row = await markPaidOnce(env, { code, payment_id: paymentId, method: 'PayPal', amount_cents: cents });
    if (row && (await claimNotify(env, row.code))) {
      const full = await sb(env, `orders?code=eq.${encodeURIComponent(row.code)}&select=*&limit=1`);
      const o = (full.ok && full.data && full.data[0]) || row;
      const order = {
        code: o.code, method: 'PayPal', total: (o.amount_cents ?? cents ?? 0) / 100,
        items: o.items || [], totals: o.totals || { total: (o.amount_cents ?? cents ?? 0) / 100 },
        pickup: o.pickup || 'ASAP',
        contact: { name: o.customer_name || '', email: o.email || '', phone: o.phone || '', pref: 'both' },
      };
      await Promise.allSettled([sendOrderEmails(env, order), sendOrderSMS(env, order)]);
    }
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
