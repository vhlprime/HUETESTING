// GET /api/admin/orders?status=&limit= -> recent orders (manager only)
import { requireManager } from '../_auth.js';
import { sb } from '../_db.js';

export async function onRequestGet({ request, env }) {
  const user = await requireManager(request, env);
  if (!user) return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');           // optional: 'paid' | 'pending'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
  let path = `orders?select=code,status,method,amount_cents,email,phone,customer_name,items,totals,pickup,created_at,paid_at&order=created_at.desc&limit=${limit}`;
  if (status) path += `&status=eq.${encodeURIComponent(status)}`;

  const r = await sb(env, path);
  if (!r.ok) return new Response(JSON.stringify({ error: 'Query failed' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ orders: r.data || [] }), { headers: { 'Content-Type': 'application/json' } });
}
