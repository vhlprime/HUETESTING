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

// Shared "Detail Invoice" layout — the SAME detail goes to the customer,
// to the restaurant inbox, and appears inside the manager portal.
function detailInvoiceHtml(order, env, opts = {}) {
  const contact = order.contact || {};
  const t = order.totals || {};
  const items = (order.items || []).map(it =>
    `<div style="font-size:14px;padding:2px 0">${it.qty}× ${esc(it.name)}${it.opt ? ' <span style="color:#8a7a76">(' + esc(it.opt) + ')</span>' : ''}</div>`).join('');
  const freeLine = order.free ? `<div style="font-size:14px;padding:2px 0">1× ${esc(order.free)} <span style="color:#2e7d52">(free)</span></div>` : '';
  const row = (label, val, bold) =>
    `<div style="display:flex;justify-content:space-between;font-size:${bold?'15px;font-weight:700':'13.5px'};padding:2px 0${bold?';border-top:1px solid #e5d9cf;margin-top:6px;padding-top:8px':''}">
       <span>${label}</span><span>${val}</span></div>`;
  let totals = row('Subtotal', money(t.sub || 0));
  if (t.hh > 0)   totals += row('Happy Hour', '−' + money(t.hh));
  if (t.coup > 0) totals += row('Coupon (WELCOME5)', '−' + money(t.coup));
  if (t.fee > 0)  totals += row('Processing fee', money(t.fee));
  totals += row('Tax', money(t.tax || 0));
  if (t.tip > 0)  totals += row('Tip', money(t.tip));
  totals += row('Total', money(t.total != null ? t.total : order.total), true);
  return `
  <div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#2b2220;border:1px solid #e8dfd8;border-radius:14px;padding:22px">
    <h2 style="color:#7A1420;margin:0 0 2px">${opts.heading || 'Detail Invoice'}</h2>
    <div style="color:#8a7a76;font-size:13px;margin-bottom:14px">${opts.subheading || 'New Order'}</div>
    <div style="font-size:15px;font-weight:700;margin-bottom:12px">Order # ${esc(order.code)}</div>
    <div style="font-size:14px;line-height:1.6">
      <b>Customer:</b> ${esc(contact.name || '—')}<br>
      <b>Phone:</b> ${esc(contact.phone || '—')}<br>
      <b>Email:</b> ${esc(contact.email || '—')}<br>
      <b>Pickup:</b> ${esc(order.pickup || 'As soon as ready')}
    </div>
    <div style="background:#FBF6EF;border-radius:12px;padding:14px 16px;margin:14px 0">
      <div style="font-weight:700;font-size:13px;color:#7A1420;margin-bottom:6px">Items</div>
      ${items}${freeLine}
      <div style="margin-top:10px">${totals}</div>
    </div>
    <div style="font-size:14px"><b>Payment:</b> Paid with ${esc(order.method || '—')}</div>
    <p style="font-size:12.5px;color:#8a7a76;margin-top:16px">
      Questions? Contact us at ${esc(env.NOTIFY_EMAIL || 'HueVietnameseCuisine@gmail.com')} or call us at +1 206-693-3311.<br>
      6538 4th Ave S, Suite 1 · Seattle, WA 98108 · Mon–Sat 10 AM – 8 PM
    </p>
  </div>`;
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
      subject: `Your order ${order.code} — Detail Invoice — Huế Vietnamese Cuisine`,
      html: detailInvoiceHtml(order, env, { heading: 'Cảm ơn' + (contact.name ? ', ' + esc(contact.name) : '') + '!', subheading: 'Your order is confirmed' }),
    });
    results.customer = r.ok ? 'sent' : 'failed:' + r.status;
  }

  // Restaurant kitchen ticket (always)
  const r2 = await send({
    from: FROM, to: [NOTIFY], reply_to: contact.email || undefined,
    subject: `🧾 New Order # ${order.code} — ${money(order.total)} (${esc(order.method || '')})`,
    html: detailInvoiceHtml(order, env, { heading: 'Detail Invoice', subheading: 'New Order' }),
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
