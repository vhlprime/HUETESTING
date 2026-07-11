// GET /api/staff/status -> { authed, name, open shift, weekMinutes }
import { requireStaff } from '../_auth.js';
import { sb } from '../_db.js';

export async function onRequestGet({ request, env }) {
  const staff = await requireStaff(request, env);
  if (!staff) return new Response(JSON.stringify({ authed:false }), { headers:{'Content-Type':'application/json'} });

  // open shift (clocked in, not yet out)
  const open = await sb(env, `shifts?select=id,clock_in&staff_id=eq.${staff.id}&clock_out=is.null&order=clock_in.desc&limit=1`);
  const openShift = open.ok && open.data && open.data[0] || null;

  // this week's shifts (from Monday 00:00 local-ish; using last 7 days for simplicity)
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
  const wk = await sb(env, `shifts?select=minutes,clock_in,clock_out&staff_id=eq.${staff.id}&clock_in=gte.${weekAgo}&order=clock_in.desc`);
  let weekMinutes = 0;
  const recent = (wk.ok && wk.data) ? wk.data : [];
  for (const s of recent) if (s.minutes) weekMinutes += s.minutes;

  return new Response(JSON.stringify({
    authed:true, name:staff.name,
    open: openShift ? { id:openShift.id, since:openShift.clock_in } : null,
    weekMinutes, recent,
  }), { headers:{'Content-Type':'application/json'} });
}
