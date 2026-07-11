// functions/api/stripe/session-status.js — GET /api/stripe/session-status?id=cs_...
// Polled by the QR "scan to pay" screen to detect when the customer finished paying on their phone.
export async function onRequestGet({ request, env }) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
      headers: { Authorization: 'Basic ' + btoa(`${env.STRIPE_SECRET_KEY}:`) },
    });
    const d = await r.json();
    if (!r.ok) return new Response(JSON.stringify({ error: 'lookup_failed' }), { status: 502 });
    return new Response(JSON.stringify({ payment_status: d.payment_status }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
