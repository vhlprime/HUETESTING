// POST /api/admin/logout -> clears the session cookie
import { clearCookie } from '../_auth.js';
export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearCookie() },
  });
}
