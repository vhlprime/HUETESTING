// POST /api/staff/clock-in -> opens a shift (rejects if one is already open)
import { requireStaff } from '../_auth.js';
import { sb } from '../_db.js';

export async function onRequestPost({ request, env }) {
  const staff = await requireStaff(request, env);
  if (!staff) return new Response(JSON.stringify({error:'Not authorized'}),{status:401,headers:{'Content-Type':'application/json'}});
  // guard: don't allow two open shifts
  const open = await sb(env, `shifts?select=id&staff_id=eq.${staff.id}&clock_out=is.null&limit=1`);
  if (open.ok && open.data && open.data.length) return new Response(JSON.stringify({error:'You are already clocked in.'}),{status:409,headers:{'Content-Type':'application/json'}});
  const ins = await sb(env, 'shifts', { method:'POST', body: JSON.stringify({ staff_id: staff.id }) });
  if (!ins.ok) return new Response(JSON.stringify({error:'Could not clock in.'}),{status:502,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({ ok:true, since: ins.data[0].clock_in }), { headers:{'Content-Type':'application/json'} });
}
