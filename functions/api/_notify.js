// functions/api/_notify.js — shared order-notification helpers (server-only).
// Sends the customer receipt + restaurant kitchen-ticket email (Resend), and a text
// alert to the restaurant phone (Twilio). Both are best-effort: a failure here never
// blocks or undoes an already-successful payment.

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function money(n) { return '$' + (Number(n) || 0).toFixed(2); }

function receiptLinesHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  let html = items.map(it =>
    `<div style="display:flex;justify-content:space-between;font-size:14px;padding:2px 0">
       <span>${it.qty}× ${esc(it.name)}${it.opt ? ' <i style="color:#8a7a76">' + esc(it.opt) + '</i>' : ''}</span>
       <b>${money(it.lineTotal)}</b>
     </div>`).join('');
  if (order.free) html += `<div style="display:flex;justify-content:space-between;font-size:14px;padding:2px 0">
       <span>1× ${esc(order.free)} <i style="color:#2e7d52">free</i></span><b style="color:#2e7d52">$0.00</b></div>`;
  return html;
}

function totalsHtml(t = {}) {
  let rows = '';
  if (t.hh > 0)   rows += row('Happy Hour', -t.hh);
  if (t.coup > 0) rows += row('Coupon · WELCOME5', -t.coup);
  if (t.fee > 0)  rows += row('Processing fee', t.fee);
  rows += row('Sales tax', t.tax || 0);
  rows += row('Tip', t.tip || 0);
  rows += `<div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;border-top:1px solid #e5d9cf;margin-top:6px;padding-top:6px">
             <span>Total paid</span><span>${money(t.total)}</span></div>`;
  return rows;
  function row(label, val) {
    return `<div style="display:flex;justify-content:space-between;font-size:13px;color:#6a5f5a">
              <span>${label}</span><span>${val < 0 ? '−' : ''}${money(Math.abs(val))}</span></div>`;
  }
}

export async function sendOrderEmails(env, order) {
  if (!env.RESEND_API_KEY) return { ok: false, reason: 'RESEND_API_KEY not set' };
  const FROM = env.MAIL_FROM || 'Huế Vietnamese Cuisine <onboarding@resend.dev>';
  const NOTIFY = env.NOTIFY_EMAIL || 'huevietnamesecuisine@gmail.com';
  const itemsHtml = receiptLinesHtml(order);
  const totalsBlock = totalsHtml(order.totals || {});
  const contact = order.contact || {};

  const send = (payload) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const results = { customer: 'skipped', restaurant: 'skipped' };

  // Customer receipt (only if they gave an email and asked for email updates)
  if (contact.email && contact.pref !== 'sms') {
    const r = await send({
      from: FROM, to: [contact.email],
      subject: `Order ${order.code} confirmed — Huế Vietnamese Cuisine`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#2b2220">
          <h2 style="color:#7A1420">Cảm ơn${contact.name ? ', ' + esc(contact.name) : ''}!</h2>
          <p>Your order <b>${esc(order.code)}</b> is confirmed. Paid via ${esc(order.method || '')}.</p>
          <div style="background:#FBF6EF;border-radius:12px;padding:14px 16px;margin:14px 0">${itemsHtml}${totalsBlock}</div>
          <p><b>Pickup:</b> ${esc(order.pickup || 'as soon as ready')}<br>
             ${esc(env.ADDRESS || '6538 4th Ave S, Suite 1, Seattle, WA 98108')}</p>
          <p style="font-size:12px;color:#8a7a76">Questions about this order? Call ${esc(env.NOTIFY_PHONE_DISPLAY || '(206) 693-3311')}.</p>
        </div>`,
    });
    results.customer = r.ok ? 'sent' : 'failed:' + r.status;
  }

  // Restaurant kitchen ticket (always)
  const r2 = await send({
    from: FROM, to: [NOTIFY], reply_to: contact.email || undefined,
    subject: `🧾 New order ${order.code} — ${money(order.total)} (${esc(order.method || '')})`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#2b2220">
        <h2 style="color:#7A1420">New order — ${esc(order.code)}</h2>
        <div style="background:#FBF6EF;border-radius:12px;padding:14px 16px;margin:10px 0">${itemsHtml}${totalsBlock}</div>
        <p><b>Pickup:</b> ${esc(order.pickup || 'ASAP')}</p>
        <p><b>Customer:</b> ${esc(contact.name || '—')} · ${esc(contact.email || '—')} · ${esc(contact.phone || '—')}
           (prefers ${esc(contact.pref || 'either')})</p>
        <p><b>Paid via:</b> ${esc(order.method || '—')}</p>
      </div>`,
  });
  results.restaurant = r2.ok ? 'sent' : 'failed:' + r2.status;

  return { ok: results.restaurant === 'sent', results };
}

export async function sendOrderSMS(env, order) {
  if (!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER && env.NOTIFY_PHONE)) {
    return { ok: false, reason: 'Twilio not configured' };
  }
  const itemsLine = (order.items || []).map(it => `${it.qty}×${it.name}`).join(', ').slice(0, 300);
  const body = `New order ${order.code} — ${money(order.total)} via ${order.method}. ${itemsLine}. Pickup: ${order.pickup || 'ASAP'}.`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: env.NOTIFY_PHONE, From: env.TWILIO_FROM_NUMBER, Body: body }),
  });
  return { ok: r.ok, status: r.status };
}
