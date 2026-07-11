// POST /api/admin/add-staff { username, display_name, password, hourly_rate } (manager only)
// Creates a staff account with a salted hash. Manager-authenticated so only you can add people.
import { requireManager, hashPassword } from '../_auth.js';
import { sb } from '../_db.js';

export async function onRequestPost({ request, env }) {
  const user = await requireManager(request, env);
  if (!user) return new Response(JSON.stringify({error:'Not authorized'}),{status:401,headers:{'Content-Type':'application/json'}});
  try {
    const { username, display_name, password, hourly_rate } = await request.json();
    const uname = String(username||'').trim().toLowerCase();
    if (!uname || !password || String(password).length < 8)
      return new Response(JSON.stringify({error:'Username and an 8+ character password are required.'}),{status:400,headers:{'Content-Type':'application/json'}});
    const salt = crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'');
    const pass_hash = await hashPassword(salt, password);
    const ins = await sb(env, 'staff', { method:'POST', body: JSON.stringify({
      username:uname, display_name:display_name||uname, pass_salt:salt, pass_hash,
      hourly_rate: hourly_rate!=null && hourly_rate!=='' ? Number(hourly_rate) : null,
    })});
    if (!ins.ok) {
      const dup = ins.status===409;
      return new Response(JSON.stringify({error: dup?'That username already exists.':'Could not create staff.'}),{status:dup?409:502,headers:{'Content-Type':'application/json'}});
    }
    return new Response(JSON.stringify({ ok:true }), { headers:{'Content-Type':'application/json'} });
  } catch { return new Response(JSON.stringify({error:'Bad request'}),{status:400,headers:{'Content-Type':'application/json'}}); }
}
