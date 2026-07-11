// email-worker/src/index.js — Cloudflare Email Worker (NOT a Pages Function).
// Triggered whenever someone emails an address on huevietnamesecuisine.com that
// you've routed to this Worker (see README.md for the one-time dashboard setup).
//
// What it does for every incoming email:
//   1. Parses it into a clean subject/from/to/text/html (via postal-mime).
//   2. Logs it to Supabase (table: inbound_emails) so nothing is ever lost,
//      even if your inbox fills up or an email gets buried.
//   3. Forwards a verbatim copy to your real inbox, so you still see it exactly
//      as before — this feature is purely additive, nothing stops working.
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const forwardTo = env.FORWARD_TO || 'huevietnamesecuisine@gmail.com';

    // Always forward first — if parsing or Supabase logging fails below, the
    // restaurant still receives the real email no matter what.
    try {
      await message.forward(forwardTo);
    } catch (e) {
      console.error('Forward failed:', e.message);
    }

    try {
      const parsed = await PostalMime.parse(message.raw);
      const subject = parsed.subject || message.headers.get('subject') || '(no subject)';
      const text = (parsed.text || '').slice(0, 20000); // sane cap per message
      const html = (parsed.html || '').slice(0, 40000);

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const r = await fetch(`${env.SUPABASE_URL}/rest/v1/inbound_emails`, {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            from_address: message.from,
            to_address: message.to,
            subject,
            text_body: text,
            html_body: html || null,
            attachment_count: (parsed.attachments || []).length,
          }),
        });
        if (!r.ok) console.error('Supabase insert failed:', r.status, await r.text());
      }
    } catch (e) {
      // Parsing/logging is a bonus on top of the forward above — never reject the
      // email over this, so a bad message never bounces back to the sender.
      console.error('Parse/log error:', e.message);
    }
  },
};
