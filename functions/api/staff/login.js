// POST /api/staff/login { username, password } -> staff session cookie
import { issueStaffCookie, hashPassword } from '../_auth.js';
import { sb } from '../_db.js';

function safeEq(a,b){ if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length) return false; let d=0; for(let i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i); return d===0; }

export async function onRequestPost({ request, env }) {
  const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'Content-Type':'application/json'}});
  try {
    const { username, password } = await request.json();
    await new Promise(r=>setTimeout(r,250)); // uniform delay
    const r = await sb(env, `staff?select=id,display_name,pass_salt,pass_hash,active&username=eq.${encodeURIComponent(String(username||'').toLowerCase())}&limit=1`);
    const row = r.ok && Array.isArray(r.data) && r.data[0];
    // compute a hash regardless (avoid revealing whether the user exists via timing)
    const salt = row ? row.pass_salt : 'nosalt';
    const hash = await hashPassword(salt, password);
    if (!row || !row.active || !safeEq(hash, (row.pass_hash||'').toLowerCase())) {
      return json({ error: 'Invalid username or password.' }, 401);
    }
    return new Response(JSON.stringify({ ok:true, name: row.display_name }), {
      headers: { 'Content-Type':'application/json', 'Set-Cookie': await issueStaffCookie(env, row.id, row.display_name) },
    });
  } catch { return json({ error:'Bad request' }, 400); }
}
