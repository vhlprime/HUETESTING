// functions/api/stripe/webhook.js — POST /api/stripe/webhook
// Verifies Stripe's signature with Web Crypto (workerd-native, no Node SDK needed),
// processes each event exactly once, marks the order Paid in Supabase, and sends
// notifications only if the browser's best-effort notify hasn't already.
//
// SETUP: Stripe Dashboard -> Developers -> Webhooks -> Add endpoint
//   URL: https://huevietnamesecuisine.com/api/stripe/webhook
//   Events: payment_intent.succeeded, checkout.session.completed
//   Copy the "Signing secret" (whsec_...) -> Cloudflare secret STRIPE_WEBHOOK_SECRET
import { claimEvent, markPaidOnce, claimNotify, sb } from '../_db.js';
import { sendOrderEmails, sendOrderSMS } from '../_notify.js';

async function verifyStripeSignature(payload, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map(kv => kv.split('=')));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false; // replay guard
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${payload}`));
  const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== v1.length) return false;
  let diff = 0;                                   // constant-time compare
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  const payload = await request.text();           // RAW body — required for signature check
  const ok = await verifyStripeSignature(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response('Bad signature', { status: 400 });

  const event = JSON.parse(payload);
  if (!(await claimEvent(env, 'stripe', event.id))) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 }); // idempotent
  }

  if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
    const obj = event.data.object;
    const paymentId = obj.id;                                        // pi_... or cs_...
    const cents = obj.amount_received ?? obj.amount_total ?? null;
    const code = obj.metadata?.order_code || `STRIPE-${paymentId.slice(-8)}`;

    const row = await markPaidOnce(env, { code, payment_id: paymentId, method: 'Apple Pay / Card', amount_cents: cents });
    if (row && (await claimNotify(env, row.code))) {
      // Browser notify didn't fire (closed tab, crash) — send from here as the safety net.
      const full = await sb(env, `orders?code=eq.${encodeURIComponent(row.code)}&select=*&limit=1`);
      const o = (full.ok && full.data && full.data[0]) || row;
      const order = {
        code: o.code, method: o.method, total: (o.amount_cents ?? cents ?? 0) / 100,
        items: o.items || [], totals: o.totals || { total: (o.amount_cents ?? cents ?? 0) / 100 },
        pickup: o.pickup || 'ASAP',
        contact: { name: o.customer_name || '', email: o.email || '', phone: o.phone || '', pref: 'both' },
      };
      await Promise.allSettled([sendOrderEmails(env, order), sendOrderSMS(env, order)]);
    }
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
