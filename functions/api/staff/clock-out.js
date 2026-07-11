// POST /api/staff/clock-out -> closes the open shift, computes minutes
import { requireStaff } from '../_auth.js';
import { sb } from '../_db.js';

export async function onRequestPost({ request, env }) {
  const staff = await requireStaff(request, env);
  if (!staff) return new Response(JSON.stringify({error:'Not authorized'}),{status:401,headers:{'Content-Type':'application/json'}});
  const open = await sb(env, `shifts?select=id,clock_in&staff_id=eq.${staff.id}&clock_out=is.null&order=clock_in.desc&limit=1`);
  const shift = open.ok && open.data && open.data[0];
  if (!shift) return new Response(JSON.stringify({error:'You are not clocked in.'}),{status:409,headers:{'Content-Type':'application/json'}});
  const now = new Date();
  const minutes = Math.max(1, Math.round((now - new Date(shift.clock_in)) / 60000));
  const upd = await sb(env, `shifts?id=eq.${shift.id}`, { method:'PATCH', body: JSON.stringify({ clock_out: now.toISOString(), minutes }) });
  if (!upd.ok) return new Response(JSON.stringify({error:'Could not clock out.'}),{status:502,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({ ok:true, minutes }), { headers:{'Content-Type':'application/json'} });
}
