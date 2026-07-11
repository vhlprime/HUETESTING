# Manager login — how to set your own password

The manager dashboard lives at **https://huevietnamesecuisine.com/manager.html**
(kept out of search engines). Only someone with the username + password can log
in; everything behind it is protected server-side, so no order data is visible
without a valid session.

## Add these 4 secrets to Cloudflare (your Pages project → Settings → Variables & Secrets)

| Secret | What to put |
|---|---|
| `MANAGER_USER` | a username, e.g. `manager` |
| `MANAGER_SALT` | a long random string (see below) |
| `MANAGER_PASSWORD_HASH` | the SHA-256 hash of (salt + your password) — NOT the password itself |
| `SESSION_SECRET` | another long random string |

## Generating your own password hash

The raw password is **never stored anywhere** — only its salted hash. To create
the hash for a password you choose, run this once in the VS Code terminal
(replace `YOUR-PASSWORD`):

```
node -e "const c=require('crypto');const salt=c.randomBytes(24).toString('hex');const sess=c.randomBytes(32).toString('hex');const pw='YOUR-PASSWORD';console.log('MANAGER_SALT =',salt);console.log('SESSION_SECRET =',sess);console.log('MANAGER_PASSWORD_HASH =',c.createHash('sha256').update(salt+pw).digest('hex'));"
```

It prints the salt, session secret, and hash. Paste those three into Cloudflare
as the secrets above, set `MANAGER_USER` to your chosen username, and redeploy.
Keep your password somewhere safe — because only the hash is stored, it cannot
be recovered, only reset by generating a new hash.

## Security properties
- Password stored only as a salted SHA-256 hash; raw password never persisted.
- Login compared in constant time (no timing leak) with a small fixed delay.
- Session is an HMAC-signed token in an **HttpOnly, Secure, SameSite=Strict**
  cookie — unreadable by any page script, HTTPS-only, and CSRF-resistant.
- Sessions expire after 8 hours; "Log out" clears them immediately.
- Every /api/admin/* endpoint re-verifies the session on every request.
