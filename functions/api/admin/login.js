// POST /api/admin/login  { username, password } -> sets HttpOnly session cookie
import { checkLogin, issueCookie } from '../_auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    // small fixed delay smooths timing and slows brute force a little
    await new Promise(r => setTimeout(r, 250));
    if (!(await checkLogin(env, username, password))) {
      return new Response(JSON.stringify({ error: 'Invalid username or password.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': await issueCookie(env, username) },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }
}
