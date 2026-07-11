// GET /api/admin/payroll?days=7 -> per-staff hours totals (manager only)
import { requireManager } from '../_auth.js';
import { sb } from '../_db.js';

export async function onRequestGet({ request, env }) {
  const user = await requireManager(request, env);
  if (!user) return new Response(JSON.stringify({error:'Not authorized'}),{status:401,headers:{'Content-Type':'application/json'}});
  const days = Math.min(parseInt(new URL(request.url).searchParams.get('days')||'7',10), 60);
  const since = new Date(Date.now() - days*24*60*60*1000).toISOString();

  const staffRes = await sb(env, 'staff?select=id,display_name,hourly_rate,active&active=eq.true&order=display_name.asc');
  const shiftRes = await sb(env, `shifts?select=staff_id,minutes,clock_in,clock_out&clock_in=gte.${since}`);
  if (!staffRes.ok || !shiftRes.ok) return new Response(JSON.stringify({error:'Query failed'}),{status:502,headers:{'Content-Type':'application/json'}});

  const byStaff = {};
  for (const s of staffRes.data) byStaff[s.id] = { name:s.display_name, rate:s.hourly_rate, minutes:0, openShifts:0 };
  for (const sh of shiftRes.data) {
    const row = byStaff[sh.staff_id]; if (!row) continue;
    if (sh.minutes) row.minutes += sh.minutes;
    if (!sh.clock_out) row.openShifts += 1;
  }
  const staff = Object.values(byStaff).map(r => ({
    name:r.name, hours:+(r.minutes/60).toFixed(2),
    pay: r.rate ? +((r.minutes/60)*r.rate).toFixed(2) : null,
    clockedInNow: r.openShifts > 0,
  }));
  return new Response(JSON.stringify({ days, staff }), { headers:{'Content-Type':'application/json'} });
}
