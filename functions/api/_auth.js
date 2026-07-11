// functions/api/_auth.js — manager session auth (server-only). Highest-practical security
// for a static+Functions site: HMAC-signed HttpOnly cookie tokens, constant-time compares,
// salted SHA-256 password hashing, short expiry. No password or token is ever exposed to
// client JavaScript.
//
// SECRETS (Cloudflare -> your Pages project -> Settings -> Variables & Secrets):
//   MANAGER_USER            the manager's username (e.g. "manager")
//   MANAGER_PASSWORD_HASH   sha256 hex of (MANAGER_SALT + password)  — NOT the raw password
//   MANAGER_SALT            a long random string, unique to this site
//   SESSION_SECRET          a long random string used to sign session tokens
// Generate the hash once with the helper printed in GO-LIVE (or ask Claude to compute it).

const enc = new TextEncoder();
const COOKIE = 'hv_mgr';
const TTL_SECONDS = 60 * 60 * 8;   // 8-hour manager session

function hex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function sha256Hex(str) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(str)));
}
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}

// token = base64url({user,exp}) + "." + hmac(secret, that payload)
async function makeToken(env, user) {
  const payload = btoa(JSON.stringify({ u: user, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sig = await hmac(env.SESSION_SECRET, payload);
  return `${payload}.${sig}`;
}

export async function verifyToken(env, token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = await hmac(env.SESSION_SECRET, payload);
  if (!timingSafeEqual(sig, expected)) return null;               // tampered signature
  try {
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;  // expired
    return data.u;
  } catch { return null; }
}

export async function checkLogin(env, username, password) {
  if (!env.MANAGER_USER || !env.MANAGER_PASSWORD_HASH || !env.MANAGER_SALT) return false;
  const userOk = timingSafeEqual(String(username || ''), env.MANAGER_USER);
  const hash = await sha256Hex(env.MANAGER_SALT + String(password || ''));
  const passOk = timingSafeEqual(hash, env.MANAGER_PASSWORD_HASH.toLowerCase());
  return userOk && passOk;    // both computed every time -> no early-exit timing leak
}

export async function issueCookie(env, user) {
  const token = await makeToken(env, user);
  // HttpOnly (no JS access) + Secure (HTTPS only) + SameSite=Strict (CSRF defense) + short Max-Age.
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TTL_SECONDS}`;
}
export function clearCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
export function readCookie(request) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

// Guard for protected endpoints: returns the username or null.
export async function requireManager(request, env) {
  return verifyToken(env, readCookie(request));
}

// ---------------------------------------------------------------------------
// STAFF (payroll portal) auth — same security model as the manager, but staff
// accounts live in the Supabase `staff` table so the manager can add people
// without redeploying. Separate cookie so staff and manager sessions don't mix.
// ---------------------------------------------------------------------------
const STAFF_COOKIE = 'hv_staff';
const STAFF_TTL = 60 * 60 * 12;   // 12-hour staff session (covers a long shift)

async function staffToken(env, staffId, name) {
  const payload = btoa(JSON.stringify({ s: staffId, n: name, exp: Math.floor(Date.now()/1000) + STAFF_TTL }))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const sig = await hmac(env.SESSION_SECRET, payload);
  return `${payload}.${sig}`;
}
export async function verifyStaff(env, token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = await hmac(env.SESSION_SECRET, payload);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const d = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
    if (!d.exp || d.exp < Math.floor(Date.now()/1000)) return null;
    return { id: d.s, name: d.n };
  } catch { return null; }
}
export async function issueStaffCookie(env, staffId, name) {
  const t = await staffToken(env, staffId, name);
  return `${STAFF_COOKIE}=${t}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${STAFF_TTL}`;
}
export function clearStaffCookie() {
  return `${STAFF_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
export function readStaffCookie(request) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${STAFF_COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}
export async function requireStaff(request, env) {
  return verifyStaff(env, readStaffCookie(request));
}
// Hash a staff password with their per-user salt (used at login + when creating accounts).
export async function hashPassword(salt, password) {
  return sha256Hex(salt + String(password || ''));
}
