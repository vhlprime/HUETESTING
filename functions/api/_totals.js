// functions/api/_totals.js — the ONE place order totals are computed for payment.
// The browser sends WHAT was ordered (codes, sizes, quantities) — never prices.
// Prices come from _pricing.js on the server, so a customer cannot modify the amount.
import { PRICES, TAX_RATE, PROCESSING_FEE, COUPON, BANH_FREE_QTY, HAPPY_HOUR } from '../_pricing.js';

const WING_CODES = ['C1', 'C2'];
const round2 = n => Math.round(n * 100) / 100;

function basePrice(code, size) {
  const p = PRICES[code];
  if (p === undefined) throw new Error(`Unknown item: ${code}`);
  const v = (typeof p === 'number') ? p : p[size];
  if (v === undefined) throw new Error(`Unknown choice "${size}" for ${code}`);
  return v;
}

function isHappyHourNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: HAPPY_HOUR.tz, hour: 'numeric', hour12: false, weekday: 'short' })
    .formatToParts(now).reduce((a, x) => (a[x.type] = x.value, a), {});
  const h = parseInt(parts.hour, 10);
  return parts.weekday !== 'Sun' && h >= HAPPY_HOUR.startHour && h < HAPPY_HOUR.endHour;
}

/**
 * payload: { items:[{code,size,qty}], tip, coupon, free }
 * Returns { sub, hh, coup, tax, fee, tip, total } — total is what gets charged.
 * Throws on any invalid item/choice/quantity (reject the payment attempt).
 */
export function computeTotals(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length || items.length > 100) throw new Error('Invalid cart');

  let sub = 0, banhQty = 0, hasWings = false;
  for (const l of items) {
    const qty = Math.floor(Number(l.qty));
    if (!qty || qty < 1 || qty > 50) throw new Error('Invalid quantity');
    sub += basePrice(l.code, l.size) * qty;
    if (String(l.code).startsWith('B')) banhQty += qty;
    if (WING_CODES.includes(l.code)) hasWings = true;
  }

  // Buy-10-get-1-free Bánh Mì: the free sandwich itself is simply not charged,
  // but it's only allowed when the cart truly has 10+ sandwiches. One promotion per order.
  const freeValid = payload?.free ? (String(payload.free).startsWith('B') && banhQty >= BANH_FREE_QTY) : false;
  if (payload?.free && !freeValid) throw new Error('Free sandwich requires 10+ Bánh Mì');

  // Happy Hour: flat $2 off when wings are in the cart, 2–5 PM Pacific Mon–Sat,
  // not combinable with the free-sandwich promotion (mirrors the website display).
  const hh = (!freeValid && hasWings && isHappyHourNow()) ? Math.min(HAPPY_HOUR.discount, sub) : 0;

  // WELCOME5 coupon: $5 off subtotals of $50+. (First-order-only is enforced by /api/coupon + DB.)
  const coup = (String(payload?.coupon || '').toUpperCase() === COUPON.code && sub >= COUPON.min) ? COUPON.off : 0;

  const taxed = Math.max(0, sub - hh - coup);
  const tax = taxed * TAX_RATE;
  const fee = taxed * PROCESSING_FEE;
  let tip = Number(payload?.tip) || 0;
  if (!(tip >= 0)) tip = 0;
  tip = Math.min(tip, 500); // sanity cap

  const total = round2(taxed + tax + fee + tip);
  if (total <= 0 || total > 2000) throw new Error('Total out of range');
  return { sub: round2(sub), hh, coup, tax: round2(tax), fee: round2(fee), tip: round2(tip), total };
}
