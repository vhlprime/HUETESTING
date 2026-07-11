// GET /api/admin/emails?limit= -> recent inbound emails (manager only)
import { requireManager } from '../_auth.js';
import { sb } from '../_db.js';

export async function onRequestGet({ request, env }) {
  const user = await requireManager(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '50', 10), 200);
  const r = await sb(env, `inbound_emails?select=from_address,to_address,subject,text_body,received_at,read&order=received_at.desc&limit=${limit}`);
  if (!r.ok) return new Response(JSON.stringify({ error: 'Query failed' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ emails: r.data || [] }), { headers: { 'Content-Type': 'application/json' } });
}
