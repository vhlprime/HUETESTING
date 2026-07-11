// POST /api/admin/send-email { to, subject, text } -> sends via Resend (manager only)
import { requireManager } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  const user = await requireManager(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  if (!env.RESEND_API_KEY) return new Response(JSON.stringify({ error: 'Email not configured' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

  try {
    const { to, subject, text } = await request.json();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to || '')) return new Response(JSON.stringify({ error: 'Invalid recipient' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.MAIL_FROM || 'Huế Vietnamese Cuisine <onboarding@resend.dev>',
        to: [to], reply_to: env.NOTIFY_EMAIL || undefined,
        subject: subject || '(no subject)',
        text: String(text || '').slice(0, 20000),
      }),
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); return new Response(JSON.stringify({ error: d?.message || 'Send failed' }), { status: 502, headers: { 'Content-Type': 'application/json' } }); }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
