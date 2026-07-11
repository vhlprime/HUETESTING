// functions/api/orders/notify.js — POST /api/orders/notify
// Fired by the browser right after a payment succeeds, carrying the rich cart details.
// It (1) persists the order to Supabase, (2) claims the notified flag so the verified
// webhook (which also fires) can never double-send, then (3) sends receipt + kitchen
// ticket + SMS. If the browser dies before calling this, the webhook is the safety net.
// Never blocks or reverses a payment — money moved before this runs.
import { sendOrderEmails, sendOrderSMS } from '../_notify.js';
import { sb, claimNotify } from '../_db.js';

export async function onRequestPost({ request, env }) {
  try {
    const order = await request.json();
    if (!order || !order.code || typeof order.total !== 'number') {
      return new Response(JSON.stringify({ error: 'Bad order payload' }), { status: 400 });
    }

    let mayNotify = true;
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      // Upsert the rich order row (webhook may already have created a thin "paid" row).
      const patch = {
        method: order.method, amount_cents: Math.round(order.total * 100),
        email: order.contact?.email || null, phone: order.contact?.phone || null,
        customer_name: order.contact?.name || null,
        items: order.items || [], totals: order.totals || {}, pickup: order.pickup || null,
      };
      const upd = await sb(env, `orders?code=eq.${encodeURIComponent(order.code)}`, {
        method: 'PATCH', body: JSON.stringify(patch),
      });
      if (!(upd.ok && Array.isArray(upd.data) && upd.data.length)) {
        await sb(env, 'orders', { method: 'POST', body: JSON.stringify({ code: order.code, status: 'pending', ...patch }) });
      }
      mayNotify = await claimNotify(env, order.code); // exactly-once vs the webhook
    }

    if (!mayNotify) return new Response(JSON.stringify({ ok: true, deduped: true }), { headers: { 'Content-Type': 'application/json' } });

    const [emailRes, smsRes] = await Promise.allSettled([sendOrderEmails(env, order), sendOrderSMS(env, order)]);
    return new Response(JSON.stringify({
      ok: true,
      email: emailRes.status === 'fulfilled' ? emailRes.value : { ok: false },
      sms: smsRes.status === 'fulfilled' ? smsRes.value : { ok: false },
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
