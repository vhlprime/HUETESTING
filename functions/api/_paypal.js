// functions/api/_paypal.js — shared PayPal REST helper (server-only; never import in front-end code)
// Uses PayPal's Orders v2 API. Docs: https://developer.paypal.com/docs/api/orders/v2/
const BASE = { live: 'https://api-m.paypal.com', sandbox: 'https://api-m.sandbox.paypal.com' };

export function ppBase(env) {
  return BASE[(env.PAYPAL_ENV || 'live').toLowerCase()] || BASE.live;
}

export async function ppToken(env) {
  const r = await fetch(`${ppBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error('paypal_auth_failed');
  const d = await r.json();
  return d.access_token;
}

export async function ppFetch(env, path, opts = {}) {
  const token = await ppToken(env);
  const r = await fetch(`${ppBase(env)}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, data };
}
