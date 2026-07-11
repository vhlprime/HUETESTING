// functions/api/lead.js — Cloudflare Pages Function
// Emails the WELCOME5 coupon ($5 off first online order of $50+) the moment someone joins the list,
// and notifies the restaurant. Uses Resend (https://resend.com).
//
// REQUIRED environment variables (Cloudflare -> your Pages project -> Settings -> Variables & Secrets):
//   RESEND_API_KEY   your Resend API key (starts with "re_")
//   MAIL_FROM        a sender on a domain you've VERIFIED in Resend,
//                    e.g. "Huế Vietnamese Cuisine <hello@huevietnamesecuisine.com>"
//                    Until your domain is verified, use "onboarding@resend.dev" (test only).
//   NOTIFY_EMAIL     where you want a copy, e.g. "huevietnamesecuisine@gmail.com"
//
// This handler returns the REAL reason on failure (as JSON { error }) so the website can show it
// and so you can see it in `npm run tail`.

export async function onRequestPost({ request, env }) {
  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  try {
    const { email } = await request.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'Please enter a valid email.' }, 400);
    }
    if (!env.RESEND_API_KEY) {
      return json({ error: 'Email is not configured yet (missing RESEND_API_KEY).' }, 503);
    }

    const FROM = env.MAIL_FROM || 'Huế Vietnamese Cuisine <onboarding@resend.dev>';
    const NOTIFY = env.NOTIFY_EMAIL || 'huevietnamesecuisine@gmail.com';

    // 1) send the coupon to the customer
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: NOTIFY,
        subject: 'Your $5 welcome coupon — Huế Vietnamese Cuisine',
        html: `
          <div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#2b2220">
            <h2 style="color:#7A1420">Welcome to Huế Vietnamese Cuisine!</h2>
            <p>Here is your welcome treat:</p>
            <div style="background:#FBF6EF;border:2px dashed #B8860B;border-radius:12px;padding:18px;text-align:center;margin:14px 0">
              <div style="font-size:26px;font-weight:bold;letter-spacing:2px;color:#7A1420">WELCOME5</div>
              <div style="font-size:14px;margin-top:6px">$5 off your first online order of $50 or more</div>
            </div>
            <p>Enter the code in the coupon box at checkout on
               <a href="https://huevietnamesecuisine.com/#order" style="color:#7A1420">huevietnamesecuisine.com</a>.</p>
            <p style="font-size:12px;color:#8a7a76">One coupon per customer, first online order only, minimum $50 subtotal before tax &amp; fees. Cannot be combined with another promotion.</p>
            <p>6538 4th Ave S, Suite 1 · Seattle, WA 98108 · (206) 693-3311<br>Mon–Sat 10 AM – 8 PM · Pickup · Takeout · Catering</p>
          </div>`,
      }),
    });

    if (!r.ok) {
      const detail = await r.json().catch(() => ({}));
      // Surface Resend's actual message (e.g. "domain is not verified") so it's fixable.
      return json({ error: detail?.message || detail?.name || 'Email provider rejected the request.' }, 502);
    }

    // 2) notify the restaurant that someone joined (best-effort; never blocks the customer)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [NOTIFY], reply_to: email,
          subject: 'New email signup — WELCOME5',
          html: `<p>New list signup: <b>${email}</b></p><p>The WELCOME5 coupon was emailed to them automatically.</p>`,
        }),
      });
    } catch (_) {}

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Bad request' }, 400);
  }
}
