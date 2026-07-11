// functions/api/_db.js — minimal Supabase REST helper (server-only, service role).
export async function sb(env, path, opts = {}) {
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

// Insert a webhook event id; returns false if we've already processed it (idempotency).
export async function claimEvent(env, provider, eventId) {
  if (!eventId) return false;
  const r = await sb(env, 'webhook_events', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId, provider }),
  });
  return r.ok; // 409 (duplicate key) => already processed => false
}

// Mark an order paid exactly once, keyed by payment_id. Returns the order row on FIRST transition only.
export async function markPaidOnce(env, { code, payment_id, method, amount_cents }) {
  // Try to update an existing pending order with this code that has no payment yet
  const upd = await sb(env, `orders?code=eq.${encodeURIComponent(code)}&status=eq.pending`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'paid', payment_id, method, amount_cents, paid_at: new Date().toISOString() }),
  });
  if (upd.ok && Array.isArray(upd.data) && upd.data.length) return upd.data[0];
  // No pending row (webhook beat the browser): insert directly as paid; unique payment_id blocks doubles
  const ins = await sb(env, 'orders', {
    method: 'POST',
    body: JSON.stringify({ code, payment_id, method, amount_cents, status: 'paid', paid_at: new Date().toISOString() }),
  });
  if (ins.ok && Array.isArray(ins.data) && ins.data.length) return ins.data[0];
  return null; // duplicate payment_id or error => not first time => caller skips notifications
}

// Set notified=true exactly once; returns true only for the caller that flipped it.
export async function claimNotify(env, code) {
  const r = await sb(env, `orders?code=eq.${encodeURIComponent(code)}&notified=eq.false`, {
    method: 'PATCH',
    body: JSON.stringify({ notified: true }),
  });
  return r.ok && Array.isArray(r.data) && r.data.length > 0;
}
