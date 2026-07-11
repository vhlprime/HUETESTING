// GET /api/admin/session -> { authed: bool, user }
import { requireManager } from '../_auth.js';
export async function onRequestGet({ request, env }) {
  const user = await requireManager(request, env);
  return new Response(JSON.stringify({ authed: !!user, user: user || null }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
