"use strict";
/* ============================================================
   CONFIG  ·  edit these to match your business
   ============================================================ */
const CFG = {
  TAX_RATE: 0.1055,            // Seattle, WA combined sales tax (effective Jan 1 2026). Verify exact rate for 98108.
  PROCESSING_FEE_RATE: 0.029,  // 2.9% card processing fee passed to the customer
  POINTS_PER_DOLLAR: 1,        // loyalty earn rate (on pre-tax subtotal)
  SIGNUP_BONUS: 0,             // no welcome-points bonus
  REDEEM_POINTS: 100,          // 100 points = ONE free Bánh Mì of choice
  BANH_FREE_QTY: 10,           // buy this many Bánh Mì -> 1 free
  HAPPY_HOUR: { start: 14, end: 17, off: 2 },  // 2-5 PM daily, $2 off when chicken wings are in the cart
  HOURS: { open: 10, close: 20, days: [1,2,3,4,5,6] }, // Mon-Sat 10AM-8PM
  WEBSITE: 'huevietnamesecuisine.com',
  GA4_ID: '',            // e.g. 'G-XXXXXXXXXX' — loads Google Analytics only AFTER cookie consent
  CF_BEACON: '',         // Cloudflare Web Analytics token (cookieless; loads immediately)
  FORMS_BACKEND: true,   // set true once /api/contact + /api/lead are deployed (Supabase + Resend)
  PHONE: '(206) 693-3311',
  ADDRESS: '6538 4th Ave S, Suite 1, Seattle, WA 98108',
  // PAY: personal-payment addresses removed — checkout now charges through the PayPal/Stripe
  //      backend (/api/orders, /api/stripe/*), never a person-to-person transfer.
  PAY: { apple: '', paypal: '' },
  STRIPE_PK: 'pk_test_51Tjmcw2M78EoYLEyghbHCJKOc939oU83Q3KKOXferWpnl5chPpOxr8PVvVqW6znX5yE8skZmOpsib5GVWybj9PWT00hkAwBHeJ', // publishable key — safe in front-end
  API_BASE: '', // backend base URL; leave '' if the site and API share the same domain
  PAYMENTS_BACKEND: true, // live: /api/orders, /api/orders/:id/capture, /api/stripe/* are deployed
  TURNSTILE_SITEKEY: '1x00000000000000000000AA', // Cloudflare Turnstile TEST key — replace with your real site key
  NOTIFY_EMAIL: 'huevietnamesecuisine@gmail.com',
  NOTIFY_SMS: '(206) 554-9522',
  SOCIAL: {                    // paste your real links here
    facebook:'#', instagram:'#', google:'#', yelp:'#',
    website:'https://huevietnamesecuisine.com'
  }
};

/* ============================================================
   SAFE STORAGE  ·  uses localStorage when available (deployed
   site), silently falls back to in-memory in restricted previews
   ============================================================ */
const store = (() => {
  let ok = false, mem = {};
  try { const t='__hue'; localStorage.setItem(t,'1'); localStorage.removeItem(t); ok = true; } catch(e){}
  return {
    get(k){ try { return ok ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch(e){ return k in mem ? mem[k] : null; } },
    set(k,v){ try { ok ? localStorage.setItem(k,v) : (mem[k]=v); } catch(e){ mem[k]=v; } }
  };
})();

/* ============================================================
   MENU DATA
   theme = gradient key for placeholder tiles; replace tiles with
   real photos later by giving each item an `img` URL.
   ============================================================ */
const THEMES = {
  roll:'linear-gradient(135deg,#E9B44C,#C97B3A)', pho:'linear-gradient(135deg,#8B2D2D,#5A0E18)',
  spicy:'linear-gradient(135deg,#C0392B,#7A1420)', wing:'linear-gradient(135deg,#D98324,#A85217)',
  rice:'linear-gradient(135deg,#E2B84F,#B98A2E)', stir:'linear-gradient(135deg,#6B8E3D,#3F5E26)',
  noodle:'linear-gradient(135deg,#C98F5A,#8A5A33)', bowl:'linear-gradient(135deg,#B5793F,#7A4A24)',
  platter:'linear-gradient(135deg,#A9743F,#6E4823)', banh:'linear-gradient(135deg,#D9A24B,#B07A2E)',
  drink:'linear-gradient(135deg,#7C5A45,#4A3326)'
};
const MENU = [
  { id:'app', name:'Appetizers', vn:'Món Khai Vị', sauce:true,
    note:'Choose one sauce: house, peanut, or soy.', glyph:'🥢', theme:'roll',
    items:[
      {code:'A1', name:'Egg Rolls (2)', vn:'Chả Giò', price:6.95, sizes:[{l:'Pork & Shrimp',p:6.95},{l:'Vegetable',p:6.95}]},
      {code:'A2', name:'Summer Rolls (2)', vn:'Gỏi Cuốn Chay', veg:true, price:7.95, sizes:[{l:'Vegetable',p:7.95},{l:'Tofu',p:7.95}]},
      {code:'A3', name:'Summer Rolls (2)', vn:'Gỏi Cuốn', price:8.95, sizes:[{l:'Shrimp & Pork',p:8.95},{l:'Shrimp',p:8.95},{l:'Grilled Pork Sausage',p:8.95}]},
      {code:'A4', name:'Grilled Pork Sausage Skewers (2)', vn:'Nem Nướng Xiên', price:9.95},
      {code:'A5', name:'Fried Shrimp Cake Skewers (2)', vn:'Bánh Tôm Xiên', price:11.95},
      {code:'A6', name:'Salt & Pepper Tofu', vn:'Đậu Hũ Muối Tiêu', veg:true, price:9.95},
      {code:'A7', name:'Salt & Pepper Calamari', vn:'Mực Chiên Muối', star:true, price:11.95},
      {code:'A8', name:'French Fries', vn:'Khoai Tây Chiên', veg:true, price:4.95},
      {code:'A9', name:'Shrimp Dumplings (6)', vn:'Há Cảo Tôm', price:7.95},
      {code:'A10', name:'Gyoza (6)', vn:'', price:7.95},
    ]},
  { id:'pho', name:'Phở', vn:'Phở', glyph:'🍜', theme:'pho',
    note:'Served with Thai basil, bean sprouts, jalapeños, green onion & lime.',
    items:[
      {code:'S1', name:'Beef Short Ribs & Meatball Phở', vn:'Phở Sườn Bò & Bò Viên', star:true, price:18.95},
      {code:'S2', name:'Oxtail & Meatball Phở', vn:'Phở Đuôi Bò & Bò Viên', price:18.95},
      {code:'S3', name:'Hanoi-Style Phở', vn:'Phở Hà Nội', price:17.95},
      {code:'S4', name:'Seafood Phở', vn:'Phở Hải Sản', price:17.95},
      {code:'S5', name:'Combo Phở', vn:'Phở Đặc Biệt', star:true, desc:'Includes rare steak, meatball, brisket, fatty brisket and tendon.', sizes:[{l:'Medium',p:17.95},{l:'Large',p:18.95}]},
      {code:'S6', name:'Beef Phở', vn:'Phở Bò', desc:'Choose 1 to 3 types of meats.', sizes:[{l:'Medium',p:15.95},{l:'Large',p:16.95}], opts:{label:'Meats (pick 1–3)', choices:['Rare Steak','Meatball','Brisket','Fatty Brisket','Tendon'], max:3}},
      {code:'S7', name:'Chicken Phở', vn:'Phở Gà', sizes:[{l:'Medium',p:14.95},{l:'Large',p:15.95}]},
      {code:'S8', name:'Tofu, Vegan Ham & Vegetable Phở', vn:'Phở Chay', veg:true, sizes:[{l:'Medium',p:14.95},{l:'Large',p:15.95}]},
    ]},
  { id:'bbh', name:'Bún Bò Huế', vn:'Bún Bò Huế', glyph:'🌶️', theme:'spicy',
    items:[
      {code:'N1', name:'Spicy Beef Noodle Soup', vn:'Bún Bò Huế', spicy:true, star:true, price:18.95, desc:'Thick rice noodles, chili oil, fresh herbs — our signature dish.'},
    ]},
  { id:'wing', name:'Chicken Wings', vn:'Cánh Gà', glyph:'🍗', theme:'wing',
    items:[
      {code:'C1', name:'Fish Sauce Wings (6)', vn:'Cánh Gà Nước Mắm', price:12.95},
      {code:'C2', name:'Butter Fried Wings (6)', vn:'Cánh Gà Chiên Bơ', price:12.95},
    ]},
  { id:'rice', name:'Fried Rice', vn:'Cơm Chiên', glyph:'🍚', theme:'rice',
    items:[
      {code:'W1', name:'House Wok Fried Rice', vn:'Cơm Chiên Thập Cẩm', price:17.95, desc:'Fried with pork, chicken, shrimp and Chinese sausage.'},
      {code:'W2', name:'Fried Rice', vn:'Cơm Chiên', price:16.95, sizes:[{l:'Shrimp',p:16.95},{l:'Pork',p:16.95},{l:'Shrimp & Pork',p:16.95}]},
      {code:'W5', name:'Chicken Fried Rice', vn:'Cơm Chiên Gà', price:15.95},
    ]},
  { id:'rplate', name:'Rice Plates', vn:'Cơm Dĩa', glyph:'🍛', theme:'rice', note:'Served with steamed rice.',
    items:[
      {code:'R1', name:'Grilled Chicken Rice Plate', vn:'Cơm Gà Nướng', price:15.95, desc:'Served with egg roll & fried egg.'},
      {code:'R2', name:'Grilled Pork Chop Rice Plate', vn:'Cơm Sườn Heo', price:16.95, desc:'Served with egg roll & fried egg.'},
      {code:'R3', name:'Grilled Beef Short Rib Rice Plate', vn:'Cơm Sườn Bò', price:18.95, desc:'Served with egg rolls & fried egg.'},
    ]},
  { id:'stir', name:'Stir-Fry Entrées', vn:'Món Xào', glyph:'🥘', theme:'stir',
    note:'Every stir-fry comes with your choice of white or brown rice.',
    items:[
      {code:'M1', name:'Mongolian Beef', vn:'', star:true, price:18.95, sizes:[{l:'White Rice',p:18.95},{l:'Brown Rice',p:18.95}]},
      {code:'M2', name:'Shaken Beef', vn:'Bò Lúc Lắc', price:18.95, sizes:[{l:'White Rice',p:18.95},{l:'Brown Rice',p:18.95}]},
      {code:'M3', name:'Lemongrass Chicken', vn:'Gà Xào Sả Ớt', spicy:true, price:16.95, sizes:[{l:'White Rice',p:16.95},{l:'Brown Rice',p:16.95}]},
      {code:'M4', name:'Vegetable Stir-Fry', vn:'Rau Củ Xào', veg:true, price:14.95, sizes:[{l:'White Rice',p:14.95},{l:'Brown Rice',p:14.95}]},
      {code:'M5', name:'Garlic Green Bean', vn:'Đậu Que Xào Tỏi', veg:true, price:14.95, sizes:[{l:'White Rice',p:14.95},{l:'Brown Rice',p:14.95}]},
      {code:'M6', name:'Chicken & Green Bean', vn:'Thịt Gà Xào Đậu Que', price:15.95, sizes:[{l:'White Rice',p:15.95},{l:'Brown Rice',p:15.95}]},
      {code:'M7', name:'Shrimp & Garlic Green Bean', vn:'Đậu Que & Tôm Xào Tỏi', price:16.95, sizes:[{l:'White Rice',p:16.95},{l:'Brown Rice',p:16.95}]},
      {code:'M8', name:'Beef & Green Bean', vn:'Thịt Bò Xào Đậu Que', price:17.95, sizes:[{l:'White Rice',p:17.95},{l:'Brown Rice',p:17.95}]},
    ]},
  { id:'mein', name:'Chow Mein', vn:'Mì Xào Mềm', glyph:'🍝', theme:'noodle',
    items:[
      {code:'X1', name:'House Chow Mein', vn:'Mì Xào Thập Cẩm', price:17.95},
      {code:'X2', name:'Beef Chow Mein', vn:'Mì Xào Bò', price:17.95},
      {code:'X3', name:'Shrimp Chow Mein', vn:'Mì Xào Tôm', price:16.95},
      {code:'X4', name:'Pork Chow Mein', vn:'Mì Xào Thịt Heo', price:16.95},
      {code:'X5', name:'Chicken Chow Mein', vn:'Mì Xào Gà', price:15.95},
    ]},
  { id:'bun', name:'Vermicelli Bowls', vn:'Bún', glyph:'🥗', theme:'bowl',
    note:'All bowls are served with egg roll.',
    items:[
      {code:'V1', name:'Combo Vermicelli', vn:'Bún Đặc Biệt', star:true, price:19.95, desc:'Grilled shrimp, pork, pork sausage & egg roll.'},
      {code:'V2', name:'Stir-Fry Beef Vermicelli', vn:'Bún Bò Xào', price:18.95},
      {code:'V3', name:'Grilled Pork Vermicelli', vn:'Bún Thịt Nướng', price:16.95},
      {code:'V4', name:'Grilled Chicken Vermicelli', vn:'Bún Gà Nướng', price:15.95},
      {code:'V5', name:'Lemongrass Chicken Vermicelli', vn:'Bún Gà Xào Sả', price:15.95},
    ]},
  { id:'plat', name:'Woven Vermicelli Platter', vn:'Bánh Hỏi', glyph:'🍽️', theme:'platter',
    items:[
      {code:'P1', name:'Combo Woven Vermicelli', vn:'Bánh Hỏi Đặc Biệt', price:20.95, desc:'Woven vermicelli with grilled shrimp, fried shrimp cake, pork, pork sausage, vegetables and rice paper.'},
    ]},
  { id:'banh', name:'Bánh Mì', vn:'Bánh Mì', glyph:'🥖', theme:'banh',
    items:[
      {code:'B1', name:'Fried Tofu Sandwich', vn:'Bánh Mì Kẹp Đậu Hũ Chiên', veg:true, price:7.95},
      {code:'B2', name:'Chicken Sandwich', vn:'Bánh Mì Thịt Gà', price:7.95},
      {code:'B3', name:'Sardine Sandwich', vn:'Bánh Mì Cá Mòi', price:7.95},
      {code:'B4', name:'Ham & Egg Sandwich', vn:'Bánh Mì Ham & Trứng', price:7.95},
      {code:'B5', name:'Combo Sandwich', vn:'Bánh Mì Đặc Biệt', star:true, price:8.95},
      {code:'B6', name:'House Grilled Pork Sandwich', vn:'Bánh Mì Thịt Nướng', price:8.95},
      {code:'B7', name:'Grilled Pork Sausage Sandwich', vn:'Bánh Mì Nem Nướng', price:8.95},
      {code:'B8', name:'Roasted Pork Sandwich', vn:'Bánh Mì Heo Quay', price:8.95},
      {code:'B9', name:'Stir-Fry Beef Sandwich', vn:'Bánh Mì Bò', price:9.95, desc:'Marinated beef stir-fried with onions with mayonnaise, pickled daikon and carrots, cucumber, jalapeños, and cilantro.'},
    ]},
  { id:'salad', name:'Salads', vn:'Gỏi', glyph:'🥬', theme:'stir',
    items:[
      {code:'G1', name:'Papaya Salad', vn:'Gỏi Đu Đủ', sizes:[{l:'Chicken',p:14.95},{l:'Shrimp',p:15.95}]},
      {code:'G2', name:'Mango Salad', vn:'Gỏi Xoài', sizes:[{l:'Chicken',p:15.95},{l:'Shrimp',p:16.95}]},
      {code:'G3', name:'Beef Salad', vn:'Gỏi Bò', price:19.95},
    ]},
  { id:'dessert', name:'Desserts', vn:'Tráng Miệng', glyph:'🍨', theme:'banh',
    items:[
      {code:'T1', name:'Mango Sticky Rice', vn:'Xôi Xoài', veg:true, price:6.95},
      {code:'T2', name:'Grilled Banana Sticky Rice', vn:'Chuối Nếp Nướng', veg:true, price:5.95},
    ]},
  { id:'sides', name:'Extra Sides', vn:'Món Thêm', glyph:'🍥', theme:'rice', fold:true,
    note:'Add-ons for your bowls and plates — add as many as you like.',
    items:[
      {code:'E1', name:'French Bread', vn:'Bánh Mì Không', price:2.00},
      {code:'E2', name:'Rice or Noodle', vn:'Cơm hoặc Bánh Phở', price:3.00, sizes:[{l:'Rice',p:3.00},{l:'Noodle',p:3.00}]},
      {code:'E3', name:'Broth', vn:'Nước Lèo', price:5.00},
      {code:'E4', name:'Mixed Vegetables', vn:'Rau Thêm', price:4.00},
      {code:'E5', name:'Bowl of Rare Steak, Flank, Brisket & Tendon', vn:'Chén Tái, Nạm, Gầu & Gân', price:6.00},
      {code:'E6', name:'Bowl of Meatballs', vn:'Chén Bò Viên', price:6.00},
      {code:'E7', name:'Extra Protein', vn:'Thêm Thịt', price:4.00, sizes:[{l:'Meatball',p:4.00},{l:'Rare Steak',p:4.00},{l:'Flank',p:4.00},{l:'Brisket',p:4.00},{l:'Tendon',p:4.00},{l:'Tofu',p:4.00},{l:'Shrimp',p:4.00}]},
      {code:'E8', name:'Short Rib', vn:'Sườn Thêm', price:6.00},
      {code:'E9', name:'Rice Paper', vn:'Bánh Tráng', price:3.00},
      {code:'E10', name:'Egg', vn:'Trứng', price:2.50},
    ]},
  { id:'drink', name:'Refreshments & Drinks', vn:'Nước Giải Khát', glyph:'🧋', theme:'drink',
    items:[
      {code:'D1', name:'Iced Black Coffee', vn:'Cà Phê Đen Đá', price:5.50},
      {code:'D2', name:'Viet Latte', vn:'Cà Phê Sữa Đá', price:6.00},
      {code:'D3', name:'Matcha Latte', vn:'', price:7.50},
      {code:'D4', name:'Kumquat Lemonade', vn:'Đá Chanh Tắc', price:5.50},
      {code:'D5', name:'Thai Tea', vn:'Trà Thái', price:5.50},
      {code:'D6', name:'Mango Smoothie', vn:'Sinh Tố Xoài', price:6.50},
      {code:'D7', name:'Strawberry Smoothie', vn:'Sinh Tố Dâu', price:6.50},
      {code:'D8', name:'Taro Smoothie', vn:'Sinh Tố Khoai Môn', price:6.50},
      {code:'D9', name:'Avocado Smoothie', vn:'Sinh Tố Bơ', price:8.00},
      {code:'D10', name:'Canned Soda', vn:'', price:2.00},
    ]},
];
const SAUCES = ['House sauce','Peanut sauce','Soy sauce'];
// quick lookup: code -> {item, cat}
const BY_CODE = {};
MENU.forEach(cat => cat.items.forEach(it => { BY_CODE[it.code] = {it, cat}; }));

/* ============================================================
   STATE
   ============================================================ */
let cart = load('hue_cart', []);          // [{key,code,name,vn,size,sauce,unit,qty}]
let account = load('hue_acct', null);      // {first,last,email,phone,points}
let tip = { pct:10, custom:null };         // selected tip
let couponApplied = false;                 // WELCOME5: $5 off first online order of $50+
const COUPON = { code:'WELCOME5', off:5, min:50 };
let freePromo = null;                      // null | 'buy10' | 'points'  (one free Bánh Mì per order)
let freeCode  = 'B1';                      // which Bánh Mì is free
let pickupISO = null;                      // chosen pickup time (ISO)
let contact   = { email:'', phone:'', pref:'both' }; // collected on every order

function load(k, fallback){ try { const v = store.get(k); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } }
function save(){ store.set('hue_cart', JSON.stringify(cart)); store.set('hue_acct', JSON.stringify(account)); }

/* ============================================================
   MONEY HELPERS
   ============================================================ */
const money = n => '$' + (Math.round(n*100)/100).toFixed(2);
function unitPrice(it, sizeLabel){
  if (it.sizes){ const s = it.sizes.find(s=>s.l===sizeLabel) || it.sizes[0]; return s.p; }
  return it.price;
}
function subtotal(){ return cart.reduce((s,l)=> s + l.unit*l.qty, 0); }
function banhQty(){ return cart.reduce((s,l)=> s + (BY_CODE[l.code] && BY_CODE[l.code].cat.id==='banh' ? l.qty : 0), 0); }
function buy10Available(){ return banhQty() >= CFG.BANH_FREE_QTY; }
function pointsAvailable(){ return !!account && account.points >= CFG.REDEEM_POINTS; }
function banhItems(){ const c = MENU.find(c=>c.id==='banh'); return c ? c.items : []; }
function freeItemName(code){ const b = BY_CODE[code]; return b ? b.it.name : ''; }
function happyHourActive(){
  const h = new Date().getHours();
  const hasWings = cart.some(l => BY_CODE[l.code] && BY_CODE[l.code].cat.id==='wing');
  return hasWings && h >= CFG.HAPPY_HOUR.start && h < CFG.HAPPY_HOUR.end;
}
function happyHourDiscount(){ if (freePromo) return 0; return happyHourActive() ? Math.min(CFG.HAPPY_HOUR.off, subtotal()) : 0; }
function prepMinutes(v){ if(v<=1000)return 20; if(v<=2000)return 60; if(v<=3000)return 120; if(v<=4000)return 160; return 1440; }
function prepLabel(m){ if(m<1440)return m+' min'; if(m===1440)return '24 hours'; if(m===2880)return '48 hours'; return 'more than 48 hours'; }
function slotOpenMin(){ return 10*60+30; }   // 10:30 AM earliest pickup
function slotLastMin(){ return 19*60+30; }    // 7:30 PM last pickup
function isWorkDay(d){ return CFG.HOURS.days.indexOf(d.getDay())>=0; }
function minOfDay(d){ return d.getHours()*60 + d.getMinutes(); }
function withinSlots(d){ const m=minOfDay(d); return isWorkDay(d) && m>=slotOpenMin() && m<=slotLastMin(); }
function nextOpen(d){
  let x=new Date(d);
  for(let i=0;i<14;i++){
    if(isWorkDay(x)){
      const m=minOfDay(x);
      if(m<slotOpenMin()){ x.setHours(10,30,0,0); return x; }
      if(m<=slotLastMin()){ return x; }
    }
    x.setDate(x.getDate()+1); x.setHours(10,30,0,0);
  }
  return x;
}
function ceil15(d){ const x=new Date(d); const add=(15-(x.getMinutes()%15))%15; x.setMinutes(x.getMinutes()+add,0,0); return x; }
function pickupSlots(prepMin){
  const now=new Date();
  let t=nextOpen(ceil15(new Date(now.getTime()+prepMin*60000)));
  const slots=[]; const guard=new Date(now.getTime()+1000*60*60*24*5);
  while(slots.length<24 && t<guard){
    if(withinSlots(t)){ slots.push(new Date(t)); t=new Date(t.getTime()+15*60000); }
    else t=nextOpen(t);
  }
  return slots;
}
function fmtSlot(d){
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const same=d.toDateString()===new Date().toDateString();
  let h=d.getHours(); const m=String(d.getMinutes()).padStart(2,'0');
  const ap=h>=12?'PM':'AM'; h=((h+11)%12)+1;
  const tm=h+':'+m+' '+ap;
  return same? 'Today '+tm : days[d.getDay()]+' '+(d.getMonth()+1)+'/'+d.getDate()+' '+tm;
}
function calcTotals(){
  const sub = subtotal();
  const hh  = happyHourDiscount();
  const coup = (couponApplied && sub >= COUPON.min) ? COUPON.off : 0;
  const taxed = Math.max(0, sub - hh - coup);
  const tax = taxed * CFG.TAX_RATE;
  const fee = taxed * CFG.PROCESSING_FEE_RATE;
  const tipBase = sub;
  const tipAmt = tip.custom != null ? tip.custom : tipBase * (tip.pct/100);
  const total = taxed + tax + fee + tipAmt;
  return { sub, hh, coup, tax, fee, tipAmt, total, earned: Math.floor(sub) * CFG.POINTS_PER_DOLLAR };
}

/* ============================================================
   ROUTER
   ============================================================ */
const views = { home:'view-home', order:'view-order', catering:'view-catering', loyalty:'view-loyalty' };
function go(name){
  Object.entries(views).forEach(([k,id]) => document.getElementById(id).classList.toggle('active', k===name));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.go===name));
  window.scrollTo({top:0, behavior:'instant' in window ? 'instant' : 'auto'});
  if (name==='loyalty') renderLoyalty();
  location.hash = name;
}
document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => go(el.dataset.go)));
// "Today's Table" photos deep-link to the exact item on the order menu
document.querySelectorAll('[data-goitem]').forEach(el => el.addEventListener('click', () => {
  const code = el.dataset.goitem;
  go('order');
  setTimeout(() => {
    const row = document.querySelector(`.item[data-item="${code}"]`);
    if (row){ row.scrollIntoView({behavior:'smooth', block:'center'}); row.classList.add('item--flash'); setTimeout(()=>row.classList.remove('item--flash'), 1600); }
  }, 120);
}));
window.addEventListener('hashchange', () => { const h = location.hash.replace('#',''); if (views[h]) go(h); });

/* ============================================================
   RENDER · GALLERY (home)
   ============================================================ */
function itemGlyph(it, cat){
  const n=(it.name+' '+(it.vn||'')).toLowerCase();
  const has=(...k)=>k.some(w=>n.indexOf(w)>=0);
  if(has('water','nước suối')) return '💧';
  if(has('soda','soft drink')) return '🥤';
  if(has('matcha')) return '🍵';
  if(has('thai tea','milk tea','boba','bubble')) return '🧋';
  if(has('coffee','latte','cà phê','bạc xỉu','phin')) return '☕';
  if(has('tea','trà')) return '🍵';
  if(has('juice','smoothie')) return '🥤';
  if(has('summer roll','gỏi cuốn','fresh roll')) return '🥬';
  if(has('egg roll','spring roll','chả giò','nem')) return '🌯';
  if(has('dumpling','gyoza','wonton','hoành thánh','bánh bao')) return '🥟';
  if(has('fries','khoai')) return '🍟';
  if(has('calamari','squid','mực')) return '🦑';
  if(has('shrimp','tôm','prawn')) return '🦐';
  if(has('crab','cua')) return '🦀';
  if(has('bánh mì','banh mi','sandwich')) return '🥖';
  if(has('phở','pho','noodle soup','bún bò','bun bo','soup','canh')) return '🍜';
  if(has('chow mein','lo mein','mì xào','stir-fry','stir fry','xào')) return '🍝';
  if(has('vermicelli','bún','chow','mein','noodle','mì')) return '🍜';
  if(has('fried rice','cơm chiên')) return '🍚';
  if(has('curry','cà ri')) return '🍛';
  if(has('rice plate','cơm','rice')) return '🍛';
  if(has('tofu','đậu hũ','đậu phụ','vegetable','veggie','vegetarian','chay','rau')) return '🥬';
  if(has('wing','cánh gà')) return '🍗';
  if(has('chicken','gà')) return '🍗';
  if(has('beef','bò','steak')) return '🥩';
  if(has('pork','heo','sausage','xá xíu','char siu','nướng')) return '🥓';
  if(has('fish','cá')) return '🐟';
  if(has('egg','trứng')) return '🥚';
  if(has('salad','gỏi')) return '🥗';
  if(has('dessert','chè','pudding','sweet')) return '🍮';
  return cat.glyph;
}
function hasCatering(){ return cart.some(l=>String(l.code).indexOf('CTR_')===0); }
function cateringSlots(){
  const now=new Date();
  let t=nextOpen(ceil15(new Date(now.getTime()+24*60*60000)));   // >= 24h out
  const minDay=new Date(now); minDay.setDate(minDay.getDate()+1); minDay.setHours(10,30,0,0); // and at least next calendar day
  if(t<minDay) t=nextOpen(minDay);
  const slots=[]; const guard=new Date(now.getTime()+1000*60*60*24*11);
  while(slots.length<80 && t<guard){
    if(withinSlots(t)){ slots.push(new Date(t)); t=new Date(t.getTime()+15*60000); }
    else t=nextOpen(t);
  }
  return slots;
}
function renderGallery(){
  const g = document.getElementById('gallery');
  if (!g) return;
  let html = '';
  MENU.forEach(cat => cat.items.forEach(it => {
    html += `<button class="tile" data-tile="${it.code}" style="background:${THEMES[cat.theme]}" aria-label="${it.name}">
      <span class="px">${it.code}</span>
      <span class="glyph">${itemGlyph(it,cat)}</span>
      <span class="cap">${it.name}</span>
    </button>`;
  }));
  g.innerHTML = html;
  g.querySelectorAll('[data-tile]').forEach(b => b.addEventListener('click', () => {
    go('order');
    setTimeout(()=> scrollToItem(b.dataset.tile), 80);
  }));
}
function scrollToItem(code){
  const el = document.querySelector(`[data-item="${code}"]`);
  if (el){ el.scrollIntoView({behavior:'smooth', block:'center'}); el.style.transition='box-shadow .4s';
    el.style.boxShadow='0 0 0 2px var(--gold)'; setTimeout(()=> el.style.boxShadow='', 1200); }
}

/* ============================================================
   RENDER · ORDER PAGE
   ============================================================ */
const PHOTOS = {
  N1:'images/bun-bo-hue.jpg',
  S1:'images/tomahawk-meatball-pho.jpg',
  S2:'images/oxtail-meatball-pho.jpg',
  S3:'images/pho-oxtail-meatball.jpg',
  S4:'images/seafood-pho.jpg',
  S5:'images/combo-pho.jpg',
  S6:'images/rare-steak-meatball-pho.jpg',
  S7:'images/chicken-pho.jpg',
  S8:'images/veg-tofu-pho.jpg',
  A1:'images/egg-rolls-real.jpg',
  A2:'images/veg-summer-rolls.jpg',
  A3:'images/summer-rolls-real.jpg',
  A6:'images/salt-pepper-tofu.jpg',
  A7:'images/salt-pepper-calamari.jpg',
  W1:'images/shrimp-fried-rice.jpg',
  W2:'images/fried-rice-real.jpg',
  M1:'images/mongolian-beef-real.jpg',
  M2:'images/shaken-beef.jpg',
  G1:'images/papaya-salad-real.jpg',
  B2:'images/banh-mi-grilled-pork.jpg',
  B3:'images/banh-mi-grilled-pork.jpg',
  B4:'images/banh-mi-grilled-pork.jpg',
  B5:'images/banh-mi-grilled-pork.jpg',
  B6:'images/banh-mi-grilled-pork.jpg',
  B7:'images/banh-mi-grilled-pork.jpg',
  B8:'images/banh-mi-grilled-pork.jpg',
  B9:'images/banh-mi-grilled-pork.jpg',
  T1:'images/mango-sticky-rice.jpg',
  D7:'images/strawberry-smoothie.jpg',
  D9:'images/avocado-smoothie.jpg'
};
// REAL photos (no AI caption): N1, A1, A3, M1, W2, G1. Everything else is AI-generated.
const AI_PHOTO = new Set(['S1','S2','S3','S4','S5','S6','S7','S8','A2','A6','A7','W1','M2','B2','B3','B4','B5','B6','B7','B8','B9','T1','D7','D9']);
function renderMenu(){
  // category chips
  document.getElementById('catRow').innerHTML =
    MENU.map((c,i)=>`<button class="chip${i===0?' on':''}" data-chip="${c.id}">${c.name}</button>`).join('');
  // items
  let html = '';
  MENU.forEach(cat => {
    html += `<div class="cat-head" id="cat-${cat.id}">
      <h3>${cat.name}</h3>${cat.vn?`<div class="vn">${cat.vn}</div>`:''}
      ${cat.note?`<div class="note">${cat.note}</div>`:''}</div>`;
    if (cat.fold) html += `<details class="sides-fold"><summary>Add extra sides — tap to open ▾</summary>`;
    cat.items.forEach(it => {
      const uniform = it.sizes && it.sizes.every(s=>s.p===it.sizes[0].p);
      const priceLabel = it.sizes
        ? (uniform ? money(it.sizes[0].p) : it.sizes.map(s=>`${s.l} ${money(s.p)}`).join(' · '))
        : money(it.price);
      let ctrl = '';
      if (it.sizes) ctrl += `<select class="sel" data-size="${it.code}" aria-label="Choice">${it.sizes.map(s=>`<option value="${s.l}">${uniform ? s.l : s.l+' — '+money(s.p)}</option>`).join('')}</select>`;
      if (it.opts) ctrl += `<fieldset class="opts" data-optgrp="${it.code}"><legend>${it.opts.label}</legend>${it.opts.choices.map(c=>`<label class="optchip"><input type="checkbox" value="${c}" data-opt="${it.code}"><span>${c}</span></label>`).join('')}</fieldset>`;
      if (cat.sauce) ctrl += `<select class="sel" data-sauce="${it.code}">${SAUCES.map(s=>`<option>${s}</option>`).join('')}</select>`;
      ctrl += `<input class="qtynum" type="number" inputmode="numeric" min="1" max="99" value="1" data-qty="${it.code}" aria-label="Quantity">`;
      ctrl += `<button class="add" data-add="${it.code}">Add</button>`;
      html += `<div class="item" data-item="${it.code}">
        <div class="item__thumb${PHOTOS[it.code]?' item__thumb--photo':''}"${PHOTOS[it.code]?'':` style="background:${THEMES[cat.theme]}"`}>${PHOTOS[it.code]?`<img class="item__img" src="${PHOTOS[it.code]}" alt="${it.name}" loading="lazy">`:`${itemGlyph(it,cat)}`}</div>
        <div class="item__body">
          <div class="item__name">${it.name}${it.spicy?" 🌶":""}${it.veg?" 🌱":""}${it.star?" ⭐":""}</div>
          ${PHOTOS[it.code]&&AI_PHOTO.has(it.code)?`<small class="ai-cap ai-cap--row">AI-assisted illustration; actual food may vary.</small>`:''}
          ${it.vn?`<div class="item__vn">${it.vn}</div>`:''}
          ${it.desc?`<div class="item__desc">${it.desc}</div>`:''}
          <div class="item__price">${priceLabel}</div>
          <div class="item__ctrl">${ctrl}</div>
        </div></div>`;
    });
    if (cat.fold) html += `</details>`;
  });
  document.getElementById('menuList').innerHTML = html;

  // chip click -> scroll to category
  document.querySelectorAll('[data-chip]').forEach(ch => ch.addEventListener('click', () => {
    document.getElementById('cat-'+ch.dataset.chip).scrollIntoView({behavior:'smooth', block:'start'});
  }));
  // add buttons (event delegation could be used; explicit binding kept simple here)
  document.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => onAdd(btn)));
  // opts groups: cap selections at their max
  document.querySelectorAll('.opts').forEach(grp => grp.addEventListener('change', () => {
    const code = grp.dataset.optgrp; const { it } = BY_CODE[code];
    const boxes = grp.querySelectorAll('[data-opt]');
    const checked = grp.querySelectorAll('[data-opt]:checked').length;
    boxes.forEach(b => { if(!b.checked) b.disabled = checked >= it.opts.max; });
  }));
  // Today's Features: show name + price under every photo
  document.querySelectorAll('.pcard[data-goitem]').forEach(card => {
    const e = BY_CODE[card.dataset.goitem]; if (!e) return;
    const it = e.it;
    const uni = it.sizes && it.sizes.every(s=>s.p===it.sizes[0].p);
    const pr = it.sizes ? (uni ? money(it.sizes[0].p) : it.sizes.map(s=>`${s.l} ${money(s.p)}`).join(' · ')) : money(it.price);
    const cap = card.querySelector('.pcard__cap');
    if (cap && !cap.querySelector('.pcard__price')) cap.insertAdjacentHTML('beforeend', `<span class="pcard__price">${pr}</span>`);
  });
  // scroll-spy for chips
  initScrollSpy();
}
function onAdd(btn){
  const code = btn.dataset.add;
  const { it, cat } = BY_CODE[code];
  const sizeEl = document.querySelector(`[data-size="${code}"]`);
  const sauceEl = document.querySelector(`[data-sauce="${code}"]`);
  const qtyEl = document.querySelector(`[data-qty="${code}"]`);
  const size = sizeEl ? sizeEl.value : null;
  let sauce = sauceEl ? sauceEl.value : null;
  if (it.opts){
    const picked = Array.from(document.querySelectorAll(`[data-opt="${code}"]:checked`)).map(b=>b.value);
    const grp = document.querySelector(`[data-optgrp="${code}"]`);
    if (picked.length < 1 || picked.length > it.opts.max){
      if (grp){ grp.classList.add('opts--err'); setTimeout(()=>grp.classList.remove('opts--err'), 1600); }
      return; // must pick 1 to max
    }
    sauce = picked.join(', ');
  }
  let qty = qtyEl ? parseInt(qtyEl.value,10) : 1;
  if (!Number.isFinite(qty) || qty<1) qty=1; if (qty>99) qty=99;
  const unit = unitPrice(it, size);
  const key = [code, size||'', sauce||''].join('|');
  const existing = cart.find(l => l.key===key);
  if (existing) existing.qty = Math.min(99, existing.qty + qty);
  else cart.push({ key, code, name:it.name, vn:it.vn, size, sauce, unit, qty });
  save(); syncCart();
  btn.classList.add('done'); btn.textContent='Added ✓';
  setTimeout(()=>{ btn.classList.remove('done'); btn.textContent='Add'; }, 900);
  if (qtyEl && qtyEl.tagName==='INPUT') qtyEl.value = 1;
  toast(`${it.name} added`);
}
let spyObs;
function initScrollSpy(){
  if (spyObs) spyObs.disconnect();
  const heads = MENU.map(c => document.getElementById('cat-'+c.id));
  spyObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){
        const id = e.target.id.replace('cat-','');
        document.querySelectorAll('[data-chip]').forEach(ch => ch.classList.toggle('on', ch.dataset.chip===id));
        const active = document.querySelector(`[data-chip="${id}"]`);
        if (active) active.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
      }
    });
  }, { rootMargin:'-120px 0px -70% 0px' });
  heads.forEach(h => h && spyObs.observe(h));
}

/* ============================================================
   CART SYNC + SHEET
   ============================================================ */
function syncCart(){
  const count = cart.reduce((s,l)=>s+l.qty, 0);
  const sub = subtotal();
  document.getElementById('cartCountTop').textContent = count;
  document.getElementById('cartCountTop').classList.toggle('on', count>0);
  document.getElementById('cartBarCount').textContent = count;
  document.getElementById('cartBarTotal').textContent = money(sub);
  document.getElementById('cartBar').classList.toggle('on', count>0);
  if (document.getElementById('cartSheet').classList.contains('on')) renderCart();
}
function renderCart(){
  const body = document.getElementById('cartBody');
  if (!cart.length){
    body.innerHTML = `<div class="empty-cart"><div class="lotus">🪷</div>Your cart is empty.<br>Add a dish to get started.</div>`;
    return;
  }
  let html = '';
  cart.forEach(l => {
    const opt = [l.size, l.sauce].filter(Boolean).join(' · ');
    html += `<div class="cline">
      <div class="cline__info">
        <div class="cline__name">${l.name}</div>
        ${opt?`<div class="cline__opt">${opt}</div>`:''}
        <div class="cline__price">${money(l.unit)} each</div>
      </div>
      <div class="qtybox">
        <button data-dec="${l.key}" aria-label="Decrease">−</button>
        <span>${l.qty}</span>
        <button data-inc="${l.key}" aria-label="Increase">+</button>
      </div></div>`;
  });
  html += `<div style="display:flex;justify-content:space-between;margin:16px 0 4px;font-size:16px;font-weight:600">
      <span>Subtotal</span><span style="color:var(--crimson)">${money(subtotal())}</span></div>
    <div style="font-size:11.5px;color:var(--ink-soft);margin-bottom:14px">Taxes, tip & rewards applied at checkout.</div>
    <button class="place" id="toCheckout">Checkout · ${money(subtotal())}</button>`;
  body.innerHTML = html;
  body.querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click',()=>changeQty(b.dataset.inc,1)));
  body.querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click',()=>changeQty(b.dataset.dec,-1)));
  document.getElementById('toCheckout').addEventListener('click', openCheckout);
}
function changeQty(key, d){
  const l = cart.find(x=>x.key===key); if (!l) return;
  l.qty += d;
  if (l.qty<=0) cart = cart.filter(x=>x.key!==key);
  if (freePromo==='buy10' && !buy10Available()) freePromo = null;
  save(); syncCart(); renderCart();
}

/* ============================================================
   SHEETS open/close
   ============================================================ */
const overlay = document.getElementById('overlay');
function openSheet(id){ document.getElementById(id).classList.add('on'); overlay.classList.add('on'); document.body.style.overflow='hidden'; }
function closeSheets(){ document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('on')); overlay.classList.remove('on'); document.body.style.overflow=''; }
overlay.addEventListener('click', closeSheets);
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click', closeSheets));
document.getElementById('cartBtn').addEventListener('click', ()=>{ renderCart(); openSheet('cartSheet'); });
document.getElementById('cartBarGo').addEventListener('click', ()=>{ renderCart(); openSheet('cartSheet'); });

/* ============================================================
   CHECKOUT
   ============================================================ */
function openCheckout(){
  if (!cart.length){ toast('Your cart is empty'); return; }
  if (freePromo==='buy10' && !buy10Available()) freePromo = null;
  if (freePromo==='points' && !pointsAvailable()) freePromo = null;
  if (!banhItems().some(b=>b.code===freeCode)) freeCode = (banhItems()[0]||{}).code || 'B1';
  if (account){ if(!contact.email) contact.email=account.email; if(!contact.phone) contact.phone=account.phone; }
  pickupISO = null;
  closeSheets(); renderCheckout(); openSheet('coSheet');
}
function renderCheckout(){
  const t = calcTotals();
  const signedIn = !!account;
  const acctBlock = signedIn ? `
    <div class="co-block">
      <h4>👤 Signed in</h4>
      <div style="font-size:14px">${esc(account.first)} ${esc(account.last)}<br>
      <span style="color:var(--ink-soft);font-size:12.5px">${esc(account.email)} · ${esc(account.phone)} · <b style="color:var(--crimson)">${account.points} pts</b></span></div>
      <div style="margin-top:8px"><button class="linkbtn" id="coLogout">Not you? Log out</button></div>
    </div>` : `
    <div class="co-block">
      <h4>⭐ Earn points on this order</h4>
      <p style="font-size:13px;color:var(--ink-soft);margin-bottom:11px">Sign in or join to earn <b style="color:var(--crimson)">${t.earned} points</b> on this order.</p>
      <button class="btn-full" id="coJoin">Join Huế Rewards</button>
      <button class="btn-ghost" id="coLogin">Log in</button>
    </div>`;

  const b5 = buy10Available(), pa = pointsAvailable();
  let freeBlock = '';
  if (b5 || pa){
    const opts = banhItems().map(b=>`<option value="${b.code}" ${b.code===freeCode?'selected':''}>${esc(b.name)} (${money(b.price)})</option>`).join('');
    freeBlock = `<div class="co-block">
      <h4>🥖 Free Bánh Mì</h4>
      <p style="font-size:12.5px;color:var(--ink-soft);margin-bottom:10px">One promotion per order. A free Bánh Mì replaces the Happy Hour discount, and Buy 10 / 100 points lock each other.</p>
      <label class="freeopt ${!freePromo?'on':''}"><input type="radio" name="freePromo" value="" ${!freePromo?'checked':''}><span>No free sandwich</span></label>
      <label class="freeopt ${freePromo==='buy10'?'on':''} ${b5?'':'lock'}"><input type="radio" name="freePromo" value="buy10" ${freePromo==='buy10'?'checked':''} ${b5?'':'disabled'}><span>Buy 10 Get 1 Free${b5?'':' · add '+(CFG.BANH_FREE_QTY-banhQty())+' more Bánh Mì'}</span></label>
      <label class="freeopt ${freePromo==='points'?'on':''} ${pa?'':'lock'}"><input type="radio" name="freePromo" value="points" ${freePromo==='points'?'checked':''} ${pa?'':'disabled'}><span>Redeem 100 points${pa?'':(account?' · '+(CFG.REDEEM_POINTS-account.points)+' more points':' · sign in')}</span></label>
      <div class="freepick" style="${freePromo?'':'display:none'}">
        <label for="freeItem" style="font-size:12px;color:var(--ink-soft);display:block;margin:10px 0 5px">Choose your free Bánh Mì</label>
        <select class="sel" id="freeItem">${opts}</select>
        <p class="freeprompt" style="${freePromo==='buy10'?'':'display:none'}">You have ordered ten or more sandwiches, please select one free sandwich. Any choice is allowed.</p>
      </div>
    </div>`;
  }

  const contactBlock = `<div class="co-block">
    <h4>📩 Contact for your order</h4>
    <div class="field"><label for="coEmail">Email</label><input id="coEmail" type="email" inputmode="email" autocomplete="email" value="${esc(contact.email||(account?account.email:''))}"><span class="err" id="coEmailErr">Enter a valid email</span></div>
    <div class="field"><label for="coPhone">Mobile phone</label><input id="coPhone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(contact.phone||(account?account.phone:''))}"><span class="err" id="coPhoneErr">Enter a valid phone</span></div>
    <label for="coPref" style="font-size:12px;color:var(--ink-soft);display:block;margin:4px 0 5px">Send order updates by</label>
    <select class="sel" id="coPref">
      <option value="both" ${contact.pref==='both'?'selected':''}>Email & Text (recommended)</option>
      <option value="email" ${contact.pref==='email'?'selected':''}>Email only</option>
      <option value="sms" ${contact.pref==='sms'?'selected':''}>Text only</option>
    </select>
  </div>`;

  const cater = hasCatering();
  const slots = cater ? cateringSlots() : pickupSlots(prepMinutes(t.sub));
  if (pickupISO && !slots.some(d=>d.toISOString()===pickupISO)) pickupISO = null;   // drop a stale (e.g. today) selection when mode changes
  if (!pickupISO && slots.length) pickupISO = slots[0].toISOString();
  const slotOpts = slots.map((d,i)=>{ const iso=d.toISOString(); return `<option value="${iso}" ${iso===pickupISO?'selected':''}>${i===0?(cater?'Earliest · ':'ASAP · '):''}${fmtSlot(d)}</option>`; }).join('');
  const pickupBlock = `<div class="co-block">
    <h4>🕒 ${cater?'Catering pickup · date &amp; time':'Pickup time'}</h4>
    <select class="sel" id="coPickup">${slotOpts}</select>
    <p style="font-size:11.5px;color:var(--ink-soft);margin-top:7px">${cater?'Catering is pickup only. Earliest pickup is the next business day (24-hour notice) — pick any date &amp; time during business hours, 10:30 AM–7:30 PM.':'Pickup only — no delivery. Kitchen needs ~<b id="prepInline">'+prepLabel(prepMinutes(t.sub))+'</b> for this order.'}</p>
  </div>`;

  document.getElementById('coBody').innerHTML = `
    ${cater?'<div class="prep-banner" id="prepBanner">🍱 Catering pickup is next-day — choose a date &amp; time below (24-hour advance notice).</div>':`<div class="prep-banner" id="prepBanner">🍳 Estimated kitchen time: <b id="prepBig">${prepLabel(prepMinutes(t.sub))}</b></div>`}
    <div class="pickup-pill"><span>📍</span> Pickup · ${esc(CFG.ADDRESS)} · free</div>

    ${acctBlock}
    ${contactBlock}
    ${freeBlock}

    <div class="co-block">
      <h4>💛 Add a tip</h4>
      <div class="tips">
        ${[0,5,10,15].map(p=>`<button class="tip${tip.custom==null&&tip.pct===p?' on':''}" data-tip="${p}">${p}%</button>`).join('')}
        <button class="tip${tip.custom!=null?' on':''}" data-tip="custom">Custom</button>
      </div>
      <div class="tip-custom${tip.custom!=null?' on':''}" id="tipCustomWrap">
        <div class="field" style="margin:10px 0 0"><label for="tipCustom">Custom tip amount ($)</label>
        <input id="tipCustom" type="number" inputmode="decimal" min="0" step="0.5" value="${tip.custom!=null?tip.custom:''}"></div>
      </div>
    </div>

    ${pickupBlock}

    <div class="co-block">
      <h4>🧾 Order summary</h4>
      <div class="couponrow">
        <input type="text" id="couponInput" class="qtynum" style="width:auto;flex:1;text-transform:uppercase" placeholder="Coupon code" value="${couponApplied?COUPON.code:''}" aria-label="Coupon code">
        <button class="add" id="couponBtn" type="button">${couponApplied?'Remove':'Apply'}</button>
      </div>
      <p id="couponMsg" style="font-size:11.5px;color:var(--ink-soft);margin:-4px 0 8px"></p>
      <div class="totals" id="coTotals"></div>
    </div>

    <div class="co-block">
      <h4>💳 Pay &amp; place order</h4>
      <p style="font-size:12.5px;color:var(--ink-soft);margin-bottom:11px">Total due <b id="placeTotal" style="color:var(--crimson)">${money(t.total)}</b>. Choose how to pay.</p>
      <div class="express express-col">
        <button class="epay checkout" data-pay="PayPal">Pay with PayPal · Venmo · Card</button>
        <button class="epay applepay" data-pay="Apple Pay"><svg viewBox="0 0 384 512" width="15" height="15" fill="#fff" style="vertical-align:-2px"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg> Apple Pay</button>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:var(--ink-soft);margin-top:10px;line-height:1.5">
      Secure HTTPS checkout · one promotion per order.</p>
  `;
  bindCheckout();
  const cb = document.getElementById('couponBtn');
  if (cb) cb.addEventListener('click', () => {
    const inp = document.getElementById('couponInput');
    const msg = document.getElementById('couponMsg');
    if (couponApplied){ couponApplied=false; if(inp) inp.value=''; if(msg) msg.textContent=''; cb.textContent='Apply'; renderCoTotals(); return; }
    const v = (inp && inp.value || '').trim().toUpperCase();
    if (v !== COUPON.code){ if(msg){ msg.style.color='#B23B3B'; msg.textContent='That code is not valid.'; } return; }
    if (subtotal() < COUPON.min){ if(msg){ msg.style.color='#B23B3B'; msg.textContent='WELCOME5 needs an order of $'+COUPON.min+' or more.'; } return; }
    const email = (contact.email||'').trim();
    if (!emailOk(email)){ if(msg){ msg.style.color='#B23B3B'; msg.textContent='Enter your email above first — WELCOME5 is for your first order.'; } return; }
    const grant = () => { couponApplied = true; cb.textContent='Remove';
      if(msg){ msg.style.color='#1f7a4d'; msg.textContent='$5 off applied. Welcome!'; } renderCoTotals(); };
    if (CFG.FORMS_BACKEND){
      cb.disabled = true; if(msg){ msg.style.color='var(--ink-soft)'; msg.textContent='Checking your coupon…'; }
      fetch((CFG.API_BASE||'')+'/api/coupon',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code:v, email:email, subtotal:subtotal()})})
        .then(r=>r.json()).then(d=>{
          cb.disabled=false;
          if (d && d.ok){ grant(); }
          else if(msg){ msg.style.color='#B23B3B'; msg.textContent=(d && d.reason)||'This coupon cannot be used on this order.'; }
        })
        .catch(()=>{ cb.disabled=false; grant(); }); // network hiccup: allow client-side; server re-checks at order time
    } else { grant(); }
  });
  renderCoTotals();
}
function renderCoTotals(){
  const t = calcTotals();
  let rows = `<div class="row"><span>Subtotal</span><b>${money(t.sub)}</b></div>`;
  if (t.hh>0) rows += `<div class="row disc"><span>Happy Hour · wings</span><b style="color:var(--ok)">−${money(t.hh)}</b></div>`;
  if (t.coup>0) rows += `<div class="row disc"><span>Coupon · WELCOME5</span><b style="color:var(--ok)">−${money(t.coup)}</b></div>`;
  if (freePromo){ const nm=freeItemName(freeCode);
    rows += `<div class="row"><span>Free Bánh Mì · ${esc(nm)}</span><b style="color:var(--ok)">$0.00</b></div>`;
    if (freePromo==='points') rows += `<div class="row"><span>Points used</span><b>−${CFG.REDEEM_POINTS} ⭐</b></div>`;
  }
  rows += `<div class="row"><span>Pickup</span><b>Free</b></div>`;
  if (CFG.PROCESSING_FEE_RATE>0) rows += `<div class="row"><span>Processing fee (${parseFloat((CFG.PROCESSING_FEE_RATE*100).toFixed(1))}%)</span><b>${money(t.fee)}</b></div>`;
  rows += `<div class="row"><span>Sales tax (${(CFG.TAX_RATE*100).toFixed(2)}%)</span><b>${money(t.tax)}</b></div>`;
  rows += `<div class="row"><span>Tip</span><b>${money(t.tipAmt)}</b></div>`;
  rows += `<div class="row grand"><span>Total</span><span>${money(t.total)}</span></div>`;
  if (account) rows += `<div class="row" style="color:var(--gold);font-weight:500"><span>Points earned</span><b style="color:var(--gold)">+${t.earned} ⭐</b></div>`;
  document.getElementById('coTotals').innerHTML = rows;
  const pt = document.getElementById('placeTotal'); if (pt) pt.textContent = money(t.total);
  const pb=document.getElementById('prepBig'); if(pb) pb.textContent=prepLabel(prepMinutes(t.sub));
  const pi=document.getElementById('prepInline'); if(pi) pi.textContent=prepLabel(prepMinutes(t.sub));
}
function bindCheckout(){
  document.querySelectorAll('[data-pay]').forEach(b=>b.addEventListener('click',()=>openPayment(b.dataset.pay)));
  document.querySelectorAll('[data-tip]').forEach(b=>b.addEventListener('click',()=>{
    if (b.dataset.tip==='custom'){ tip.custom = parseFloat(document.getElementById('tipCustom').value)||0; }
    else { tip.pct = parseInt(b.dataset.tip,10); tip.custom = null; }
    document.querySelectorAll('[data-tip]').forEach(x=>x.classList.remove('on')); b.classList.add('on');
    document.getElementById('tipCustomWrap').classList.toggle('on', b.dataset.tip==='custom');
    renderCoTotals();
  }));
  const tc = document.getElementById('tipCustom');
  if (tc) tc.addEventListener('input', ()=>{ tip.custom = parseFloat(tc.value)||0; renderCoTotals(); });
  document.querySelectorAll('input[name="freePromo"]').forEach(r=>r.addEventListener('change', ()=>{ freePromo = r.value || null; renderCheckout(); }));
  const fi = document.getElementById('freeItem');
  if (fi) fi.addEventListener('change', ()=>{ freeCode = fi.value; renderCoTotals(); });
  const ce=document.getElementById('coEmail'); if(ce) ce.addEventListener('input',()=>{ contact.email=ce.value.trim(); showErr('coEmailErr',false); });
  const cp=document.getElementById('coPhone'); if(cp) cp.addEventListener('input',()=>{ contact.phone=cp.value.trim(); showErr('coPhoneErr',false); });
  const pr=document.getElementById('coPref'); if(pr) pr.addEventListener('change',()=>{ contact.pref=pr.value; });
  const pk=document.getElementById('coPickup'); if(pk) pk.addEventListener('change',()=>{ pickupISO=pk.value; });
  const j = document.getElementById('coJoin'); if (j) j.addEventListener('click',()=>openAccount('join'));
  const l = document.getElementById('coLogin'); if (l) l.addEventListener('click',()=>openAccount('login'));
  const lo = document.getElementById('coLogout'); if (lo) lo.addEventListener('click',()=>{ account=null; save(); renderCheckout(); });
}

/* ============================================================
   PLACE ORDER
   NOTE: This is the front-end flow. To take real payments you
   must wire a backend (e.g. Stripe Payment Intents + Apple Pay,
   PayPal Orders API). Never put secret keys in this file.
   ============================================================ */
function newOrderCode(){ return 'HM-' + Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join(''); }
function placeOrder(method, ordOverride){
  const t = calcTotals();
  const lines = cart.slice();
  const freeName = freePromo ? freeItemName(freeCode) : '';
  const usedPoints = freePromo==='points' ? CFG.REDEEM_POINTS : 0;
  const pickupTxt = pickupISO ? fmtSlot(new Date(pickupISO)) : ('~'+prepLabel(prepMinutes(t.sub)));
  const ord = ordOverride || newOrderCode();
  const payAcct = method==='Apple Pay' ? CFG.PAY.apple : (method==='PayPal' ? CFG.PAY.paypal : '');

  if (account){ account.points = Math.max(0, account.points - usedPoints + t.earned); save(); }

  let items = lines.map(l=>{
    const opt=[l.size,l.sauce].filter(Boolean).join(' · ');
    return `<div class="rcp-line"><span>${l.qty}× ${esc(l.name)}${opt?' <i>'+esc(opt)+'</i>':''}</span><b>${money(l.unit*l.qty)}</b></div>`;
  }).join('');
  if (freeName) items += `<div class="rcp-line"><span>1× ${esc(freeName)} <i>free</i></span><b style="color:var(--ok)">$0.00</b></div>`;

  let totalsR = '';
  if (t.hh>0) totalsR += `<div class="rcp-line"><span>Happy Hour</span><b>−${money(t.hh)}</b></div>`;
  if (t.coup>0) totalsR += `<div class="rcp-line"><span>Coupon · WELCOME5</span><b>−${money(t.coup)}</b></div>`;
  if (CFG.PROCESSING_FEE_RATE>0) totalsR += `<div class="rcp-line"><span>Processing fee</span><b>${money(t.fee)}</b></div>`;
  totalsR += `<div class="rcp-line"><span>Sales tax</span><b>${money(t.tax)}</b></div>`;
  totalsR += `<div class="rcp-line"><span>Tip</span><b>${money(t.tipAmt)}</b></div>`;
  totalsR += `<div class="rcp-line rcp-total"><span>Total paid</span><b>${money(t.total)}</b></div>`;


  if (couponApplied && t.coup>0 && CFG.FORMS_BACKEND){
    fetch((CFG.API_BASE||'')+'/api/coupon',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({code:COUPON.code, email:(contact.email||'').trim(), subtotal:t.sub, redeem:true, order:ord})}).catch(()=>{});
  }
  couponApplied = false;
  cart = []; freePromo=null; pickupISO=null; save(); syncCart();
  closeSheets();

  if (CFG.FORMS_BACKEND){
    fetch((CFG.API_BASE||'')+'/api/orders/notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        code: ord, method, total: t.total,
        items: lines.map(l=>({ qty:l.qty, name:l.name, opt:[l.size,l.sauce].filter(Boolean).join(' · '), lineTotal:l.unit*l.qty })),
        free: freeName || '',
        totals: { sub:t.sub, hh:t.hh, coup:t.coup, fee:t.fee, tax:t.tax, tip:t.tipAmt, total:t.total },
        pickup: pickupTxt,
        contact: { name: account?account.first:'', email: contact.email, phone: contact.phone, pref: contact.pref },
      })
    }).catch(()=>{}); // best-effort — payment already succeeded either way
  }

  document.getElementById('confirmBody').innerHTML = `
    <div class="sheet__head"><h3>Order confirmed</h3><button class="sheet__close" data-close>×</button></div>
    <div class="sheet__pad">
      <div class="confirm">
        <div class="medallion"><span class="lotus">🪷</span></div>
        <h3>Cảm ơn${account?', '+esc(account.first):''}!</h3>
        <div class="ordno">${ord}</div>
        <p>Payment approved — your order is confirmed.</p>
      </div>
      <div class="co-block"><h4>💳 Payment</h4>
        <p style="font-size:14px;margin-bottom:3px"><b style="color:var(--ok)">Approved ✓</b> · ${money(t.total)}</p>
        <p style="font-size:13px;color:var(--ink-soft)">Paid via ${esc(method)}${payAcct?' → '+esc(payAcct):''}</p>
      </div>
      <div class="co-block"><h4>🕒 Pickup</h4>
        <p style="font-size:14px;margin-bottom:4px"><b>${esc(pickupTxt)}</b> · est. ready in ~${prepLabel(prepMinutes(t.sub))}</p>
        <p style="font-size:13px;color:var(--ink-soft)">${esc(CFG.ADDRESS)}</p>
      </div>
      <div class="co-block"><h4>🧾 Receipt</h4><div class="receipt">${items}<div class="rcp-rule"></div>${totalsR}</div></div>
      ${account?`<div class="co-block" style="text-align:center"><span style="color:var(--gold);font-weight:600">+${t.earned} points earned · ${account.points} total ⭐</span></div>`:''}
      <button class="btn-full" style="max-width:300px;margin:6px auto 0" data-close>Done</button>
    </div>`;
  document.getElementById('confirmSheet').querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeSheets));
  openSheet('confirmSheet');
}

/* ============================================================
   PAYMENT (Apple Pay / PayPal)
   FRONT-END SIMULATION ONLY. This mimics a hosted sign-in +
   approval screen. Real money is charged through the backend:
   Apple Pay / cards -> Stripe (/api/stripe/*), PayPal/Venmo ->
   PayPal Orders (/api/orders + capture). These go to the
   restaurant's MERCHANT accounts, NOT a personal transfer.
   ============================================================ */
let payCtx=null;
function openPayment(method){
  const ce=document.getElementById('coEmail'), cp=document.getElementById('coPhone'), pr=document.getElementById('coPref');
  if(ce) contact.email=ce.value.trim(); if(cp) contact.phone=cp.value.trim(); if(pr) contact.pref=pr.value;
  let bad=false;
  if(!emailOk(contact.email)){ showErr('coEmailErr',true); bad=true; }
  if(!phoneOk(contact.phone)){ showErr('coPhoneErr',true); bad=true; }
  if(bad){ toast('Add a valid email and phone'); return; }
  const t=calcTotals();
  payCtx={ method, acct: method==='Apple Pay'?CFG.PAY.apple : method==='PayPal'?CFG.PAY.paypal : '', amount:t.total };
  closeSheets();
  if(method==='Apple Pay'){
    const fallback = ()=>{ if(CFG.PAYMENTS_BACKEND){ stripeCheckoutQR().catch(()=>{ renderApplePayUnavailable(); openSheet('paySheet'); }); } else { renderApplePayUnavailable(); openSheet('paySheet'); } };
    startStripeApplePay().then(ok=>{ if(!ok) fallback(); }).catch(fallback);
    return;
  }
  renderPayPal();
  openSheet('paySheet');
}
function isDesktop(){ return window.innerWidth>=820; }
async function startStripeApplePay(){
  try{
    if(!(CFG.STRIPE_PK && CFG.PAYMENTS_BACKEND && window.Stripe)) return false;   // not configured -> honest fallback
    const stripe = Stripe(CFG.STRIPE_PK);
    const t = calcTotals();
    const pr = stripe.paymentRequest({
      country:'US', currency:'usd',
      total:{ label:'Huế Vietnamese Cuisine', amount: Math.round(t.total*100) },
      requestPayerName:true, requestPayerEmail:true
    });
    const can = await pr.canMakePayment();
    if(!can || !can.applePay) return false;                              // Apple Pay unavailable here
    const res = await fetch((CFG.API_BASE||'')+'/api/stripe/payment-intent', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ total: t.total })
    });
    if(!res.ok) return false;
    const { clientSecret } = await res.json();
    if(!clientSecret) return false;
    pr.on('paymentmethod', async (ev)=>{
      const r = await stripe.confirmCardPayment(clientSecret, { payment_method: ev.paymentMethod.id }, { handleActions:false });
      if(r.error){ ev.complete('fail'); toast('Payment failed — you were not charged'); return; }
      ev.complete('success');
      if(r.paymentIntent && r.paymentIntent.status==='requires_action'){ await stripe.confirmCardPayment(clientSecret); }
      placeOrder('Apple Pay');
    });
    pr.show();
    return true;
  }catch(e){ return false; }
}
function renderApplePayUnavailable(){
  document.getElementById('payBody').innerHTML = `
    <div class="sheet__head"><h3>Apple Pay</h3><button class="sheet__close" data-close>×</button></div>
    <div class="sheet__pad" style="text-align:center;padding:28px 24px">
      <div style="font-size:22px;font-weight:700;color:#000;margin-bottom:8px"> Apple Pay</div>
      <p style="font-size:13px;color:var(--ink-soft);line-height:1.6">Apple Pay needs Safari on an Apple device with a card in Wallet, and the store's Stripe payments must be connected. No charge was made.<br><br>Please use <b>Pay with PayPal · Venmo · Card</b>, or try Apple Pay from your iPhone or iPad.</p>
      <button class="btn-full" style="max-width:260px;margin:18px auto 0" data-close>Back</button>
    </div>`;
  document.querySelectorAll('#paySheet [data-close]').forEach(b=>b.addEventListener('click',closeSheets));
}
function buildQR(elId, text){
  const el=document.getElementById(elId); if(!el) return;
  try{ if(typeof qrcode==='function'){ const qr=qrcode(0,'M'); qr.addData(text); qr.make(); el.innerHTML=qr.createImgTag(5,10); return; } }catch(e){}
  el.innerHTML=`<div class="ap-qr-fallback">Scan code unavailable.<br><small>${esc(text)}</small></div>`;
}
let _payPoll=null;
function stopPoll(){ if(_payPoll){ clearInterval(_payPoll); _payPoll=null; } }
function renderScanSheet(title, payUrl, note){
  document.getElementById('payBody').innerHTML = `
    <div class="sheet__head"><h3>${esc(title)}</h3><button class="sheet__close" data-close>×</button></div>
    <div class="sheet__pad" style="text-align:center">
      <div style="font-size:30px;font-weight:700;font-family:var(--display);margin:2px 0 12px">${money(payCtx.amount)}</div>
      <div id="scanQR" class="ap-qr"></div>
      <p style="font-size:13px;color:var(--ink);margin:14px 0 4px;font-weight:600">Scan with your phone to pay</p>
      <ol class="ap-steps">
        <li>Open the Camera on your iPhone or iPad.</li>
        <li>Scan the code above.</li>
        <li>Approve with Face ID, Touch ID, or your passcode.</li>
        <li>Your receipt appears here automatically.</li>
      </ol>
      <div style="margin-top:6px"><span class="pay-spin" style="width:22px;height:22px;border-width:3px;display:inline-block;vertical-align:middle"></span> <span style="font-size:12.5px;color:var(--ink-soft)">Waiting for payment…</span></div>
      <button class="btn-ghost" id="scanOpen" style="margin-top:12px">Open payment page</button>
      <p style="font-size:10.5px;color:var(--ink-soft);margin-top:8px">${esc(note||'')}</p>
    </div>`;
  document.querySelectorAll('#paySheet [data-close]').forEach(b=>b.addEventListener('click',()=>{ stopPoll(); closeSheets(); }));
  buildQR('scanQR', payUrl);
  const ob=document.getElementById('scanOpen'); if(ob) ob.addEventListener('click', ()=>window.open(payUrl,'_blank','noopener'));
}
async function stripeCheckoutQR(){
  const base=CFG.API_BASE||'';
  const r=await fetch(base+'/api/stripe/checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(orderPayload())});
  if(!r.ok) throw new Error('session'); const d=await r.json(); if(!d.url||!d.id) throw new Error('session');
  renderScanSheet('Apple Pay · Scan to pay', d.url, 'Powered by Stripe. You are charged only after you approve on your phone.');
  openSheet('paySheet'); stopPoll();
  _payPoll=setInterval(async ()=>{
    try{ const s=await fetch(base+'/api/stripe/session-status?id='+encodeURIComponent(d.id)); const sd=await s.json();
      if(sd.payment_status==='paid'){ stopPoll(); closeSheets(); placeOrder('Apple Pay'); } }catch(e){}
  }, 3000);
}
async function paypalCheckoutQR(){
  const base=CFG.API_BASE||'';
  const r=await fetch(base+'/api/paypal/checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(orderPayload())});
  if(!r.ok) throw new Error('session'); const d=await r.json(); if(!d.approveUrl||!d.id) throw new Error('session');
  renderScanSheet('PayPal · Scan to pay', d.approveUrl, 'Powered by PayPal. You are charged only after you approve on your phone.');
  openSheet('paySheet'); stopPoll();
  const code=newOrderCode();
  _payPoll=setInterval(async ()=>{
    try{
      const s=await fetch(base+'/api/paypal/order-status/'+d.id); const sd=await s.json();
      if(sd.status==='APPROVED'){
        stopPoll();
        const c=await fetch(base+'/api/orders/'+d.id+'/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order:payPalOrderSnapshot(code)})});
        const cd=await c.json();
        const cap=cd&&cd.purchase_units&&cd.purchase_units[0]&&cd.purchase_units[0].payments&&cd.purchase_units[0].payments.captures&&cd.purchase_units[0].payments.captures[0];
        if(cd&&(cd.status==='COMPLETED'||(cap&&cap.status==='COMPLETED'))){ closeSheets(); placeOrder('PayPal', code); }
        else { toast('Payment was not completed'); }
      }
    }catch(e){}
  }, 3000);
}
function renderPayPal(){
  document.getElementById('payBody').innerHTML = `
    <div class="sheet__head"><h3>Pay with PayPal</h3><button class="sheet__close" data-close>×</button></div>
    <div class="sheet__pad">
      <div class="pay-card paypal"><div class="pay-brand"><i>Pay</i><span>Pal</span></div><div class="pay-amt">${money(payCtx.amount)}</div><div class="pay-to">to Huế Vietnamese Cuisine</div></div>
      <p style="font-size:12.5px;color:var(--ink-soft);margin:14px 0 12px">Pay securely with PayPal, Venmo, or a debit/credit card. Your order is confirmed only after PayPal approves the payment.</p>
      <div id="ppContainer" style="min-height:46px"></div>
      <button class="btn-ghost" id="ppScan" style="margin-top:10px${CFG.PAYMENTS_BACKEND?'':';display:none'}">Scan to pay from your phone</button>
      <div id="ppFallback" style="display:none;margin-top:6px">
        <p style="font-size:13px;color:#B23B3B;text-align:center">PayPal is temporarily unavailable. Please use Apple Pay above, or call (206) 693-3311 to order by phone — sorry for the trouble!</p>
      </div>
      <p style="text-align:center;font-size:10.5px;color:var(--ink-soft);margin-top:10px">You're charged only when you approve in PayPal. A receipt is emailed once payment is confirmed.</p>
    </div>`;
  document.querySelectorAll('#paySheet [data-close]').forEach(b=>b.addEventListener('click',closeSheets));
  mountPayPal();
  const ps=document.getElementById('ppScan'); if(ps) ps.addEventListener('click', ()=>paypalCheckoutQR().catch(()=>toast('Could not start PayPal scan')));
}
function orderPayload(){
  const t = calcTotals();
  return {
    items: cart.map(l => ({ code:l.code, size:l.size||null, qty:l.qty })),
    tip: t.tipAmt,
    coupon: couponApplied ? COUPON.code : null,
    free: freePromo ? freeCode : null
  };
}
function payPalOrderSnapshot(code){
  const t=calcTotals();
  return { code, total:t.total, method:'PayPal', email:contact.email, phone:contact.phone, pref:contact.pref,
    items: cart.map(l=>({ qty:l.qty, name:l.name, opt:[l.size,l.sauce].filter(Boolean).join(' · '), lineTotal:l.unit*l.qty })),
    free: freePromo?freeItemName(freeCode):'' };
}
function mountPayPal(){
  try{
    if(window.paypal && CFG.PAYMENTS_BACKEND && window.paypal.Buttons){
      const base = CFG.API_BASE || '';
      // Real, success-gated checkout: order created + captured server-side (live PayPal); receipt only on COMPLETED.
      window.paypal.Buttons({
        style:{ shape:'rect', layout:'vertical', color:'gold', label:'paypal' },
        createOrder: async ()=>{
          const r = await fetch(base+'/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(orderPayload()) });
          const d = await r.json();
          if(d && d.id) return d.id;
          throw new Error('create_failed');
        },
        onApprove: async (data)=>{
          const code = newOrderCode();
          const r = await fetch(base+'/api/orders/'+data.orderID+'/capture', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ order: payPalOrderSnapshot(code) }) });
          const d = await r.json();
          const cap = d && d.purchase_units && d.purchase_units[0] && d.purchase_units[0].payments && d.purchase_units[0].payments.captures && d.purchase_units[0].payments.captures[0];
          if(d && (d.status==='COMPLETED' || (cap && cap.status==='COMPLETED'))){ closeSheets(); placeOrder('PayPal', code); }
          else { toast('Payment was not completed — you were not charged'); }
        },
        onError: ()=>{ toast('PayPal error — you were not charged'); }
      }).render('#ppContainer');
      return;
    }
    throw new Error('sdk_unavailable');
  }catch(e){
    const fb=document.getElementById('ppFallback'); if(fb) fb.style.display='block';
  }
}

/* ============================================================
   ACCOUNT (join / login)
   Demo auth only — stores profile locally. Replace with a real
   auth backend before launch.
   ============================================================ */
function rememberRow(checked){ return `<label class="rememberme"><input type="checkbox" id="aRemember" ${checked?'checked':''}> Keep me signed in</label>`; }
function openAccount(mode){
  closeSheets();
  const titleEl=document.getElementById('acctTitle');
  const body=document.getElementById('acctBody');
  if (mode==='join'){
    titleEl.textContent='Join Huế Rewards';
    body.innerHTML = `
      <div class="field row2">
        <div class="field"><label for="aFirst">First name</label><input id="aFirst" autocomplete="given-name"><span class="err" id="aFirstErr">Required</span></div>
        <div class="field"><label for="aLast">Last name</label><input id="aLast" autocomplete="family-name"><span class="err" id="aLastErr">Required</span></div>
      </div>
      <div class="field"><label for="aEmail">Email</label><input id="aEmail" type="email" inputmode="email" autocomplete="email"><span class="err" id="aEmailErr">Enter a valid email</span></div>
      <div class="field"><label for="aPhone">Phone</label><input id="aPhone" type="tel" inputmode="tel" autocomplete="tel"><span class="err" id="aPhoneErr">Enter a valid phone</span></div>
      <button class="btn-full" id="aSubmit">Create account</button>
      <button class="linkbtn" style="display:block;text-align:center;width:100%;margin-top:14px" id="aSwitch">Already a member? Log in</button>`;
    body.querySelector('#aSubmit').addEventListener('click', submitJoin);
    body.querySelector('#aSwitch').addEventListener('click', ()=>openAccount('login'));
  } else if (mode==='reset'){
    titleEl.textContent='Reset password';
    body.innerHTML = `
      <div class="field"><label for="aEmail">Email ID</label><input id="aEmail" type="email" inputmode="email" autocomplete="email"><span class="err" id="aEmailErr">Enter a valid email</span></div>
      <p style="font-size:12.5px;color:var(--ink-soft);margin-bottom:12px">Enter your email ID and we'll send you a verification code.</p>
      <button class="btn-full" id="aSendCode">Send verification code</button>
      <button class="linkbtn" style="display:block;text-align:center;width:100%;margin-top:14px" id="aSwitch">Back to log in</button>`;
    body.querySelector('#aSendCode').addEventListener('click', ()=>{
      const email=val('aEmail'); showErr('aEmailErr', !emailOk(email)); if(!emailOk(email)) return;
      renderResetCode(email);
    });
    body.querySelector('#aSwitch').addEventListener('click', ()=>openAccount('login'));
  } else {
    titleEl.textContent='Log in';
    body.innerHTML = `
      <div class="field"><label for="aEmail">Email</label><input id="aEmail" type="email" inputmode="email" autocomplete="email"><span class="err" id="aEmailErr">Enter a valid email</span></div>
      <p style="font-size:12px;color:var(--ink-soft);margin-bottom:12px">Enter the email you signed up with to load your points.</p>
      ${rememberRow(true)}
      <button class="btn-full" id="aLogin">Log in</button>
      <div style="display:flex;justify-content:space-between;gap:10px;margin-top:14px">
        <button class="linkbtn" id="aForgot">Forgot password?</button>
        <button class="linkbtn" id="aSwitch">New here? Create an account</button>
      </div>`;
    body.querySelector('#aLogin').addEventListener('click', submitLogin);
    body.querySelector('#aForgot').addEventListener('click', ()=>openAccount('reset'));
    body.querySelector('#aSwitch').addEventListener('click', ()=>openAccount('join'));
  }
  openSheet('acctSheet');
}
function renderResetCode(email){
  document.getElementById('acctTitle').textContent='Set a new password';
  const body=document.getElementById('acctBody');
  body.innerHTML = `
    <p style="font-size:12.5px;color:var(--ink-soft);margin-bottom:12px">We sent a 6-digit verification code to <b>${esc(email)}</b>. Enter it and choose a new password.</p>
    <div class="field"><label for="aCode">Verification code</label><input id="aCode" inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code"><span class="err" id="aCodeErr">Enter the 6-digit code</span></div>
    <div class="field"><label for="aPass">New password</label><input id="aPass" type="password" autocomplete="new-password"><span class="err" id="aPassErr">At least 6 characters</span></div>
    <div class="field"><label for="aPass2">Confirm new password</label><input id="aPass2" type="password" autocomplete="new-password"><span class="err" id="aPass2Err">Passwords must match</span></div>
    ${rememberRow(true)}
    <button class="btn-full" id="aReset">Reset password &amp; sign in</button>
    <button class="linkbtn" style="display:block;text-align:center;width:100%;margin-top:14px" id="aSwitch">Back to log in</button>`;
  body.querySelector('#aReset').addEventListener('click', ()=>{
    const code=val('aCode'), p1=document.getElementById('aPass').value, p2=document.getElementById('aPass2').value;
    let bad=false;
    showErr('aCodeErr', !/^\d{6}$/.test(code)); bad=bad||!/^\d{6}$/.test(code);
    showErr('aPassErr', p1.length<6); bad=bad||p1.length<6;
    showErr('aPass2Err', p1!==p2); bad=bad||p1!==p2;
    if(bad) return;
    const remember=document.getElementById('aRemember') && document.getElementById('aRemember').checked;
    if (!(account && account.email===email)) account={ first:'Member', last:'', email, phone:'', points: account?account.points:0 };
    account.remember=!!remember; save(); closeSheets(); toast("Password reset — you're signed in");
    if (cart.length){ renderCheckout(); openSheet('coSheet'); } else { renderLoyalty(); }
  });
  body.querySelector('#aSwitch').addEventListener('click', ()=>openAccount('login'));
}
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = v => v.replace(/\D/g,'').length >= 10;
function showErr(id, on){ const e=document.getElementById(id); if(e) e.classList.toggle('on', on); }
function submitJoin(){
  const first=val('aFirst'), last=val('aLast'), email=val('aEmail'), phone=val('aPhone');
  let bad=false;
  showErr('aFirstErr', !first); bad = bad || !first;
  showErr('aLastErr', !last); bad = bad || !last;
  showErr('aEmailErr', !emailOk(email)); bad = bad || !emailOk(email);
  showErr('aPhoneErr', !phoneOk(phone)); bad = bad || !phoneOk(phone);
  if (bad) return;
  account = { first, last, email, phone, points: CFG.SIGNUP_BONUS };
  save(); closeSheets(); toast(`Welcome, ${first}! You're now a member.`);
  if (cart.length){ renderCheckout(); openSheet('coSheet'); } else { renderLoyalty(); }
}
function submitLogin(){
  const email=val('aEmail');
  showErr('aEmailErr', !emailOk(email)); if (!emailOk(email)) return;
  const remember=document.getElementById('aRemember') && document.getElementById('aRemember').checked;
  if (!(account && account.email===email)) account = { first:'Member', last:'', email, phone:'', points: account ? account.points : 0 };
  account.remember=!!remember;
  save(); closeSheets(); toast('Logged in');
  if (cart.length){ renderCheckout(); openSheet('coSheet'); } else { renderLoyalty(); }
}
const val = id => (document.getElementById(id)?.value || '').trim();

/* ============================================================
   LOYALTY VIEW
   ============================================================ */
function renderLoyalty(){
  const signedIn = !!account;
  document.getElementById('loyBal').textContent = signedIn ? account.points : 0;
  document.getElementById('loyWho').textContent = signedIn ? `${account.first} ${account.last}`.trim()+' · '+account.email : 'Sign up to start earning';
  document.getElementById('loySignedOut').style.display = signedIn ? 'none' : 'block';
  document.getElementById('loySignedIn').style.display = signedIn ? 'block' : 'none';
}
document.getElementById('loyJoinBtn').addEventListener('click', ()=>openAccount('join'));
document.getElementById('loyLoginBtn').addEventListener('click', ()=>openAccount('login'));
document.getElementById('loyLogoutBtn').addEventListener('click', ()=>{ account=null; save(); renderLoyalty(); toast('Logged out'); });

/* ============================================================
   CATERING FORM
   ============================================================ */
const CATER_SIZES=[{k:'',l:'Size…'},{k:'small',l:'Small · $65'},{k:'medium',l:'Medium · $100'},{k:'large',l:'Large · $140'}];
const CATER_PRICE={small:65,medium:100,large:140};
const CATER_LABEL={small:'Small',medium:'Medium',large:'Large'};
function renderCatering(){
  const host=document.getElementById('cateringMenu'); if(!host) return;
  let html='';
  MENU.filter(c=>c.id!=='drink' && c.id!=='banh').forEach(cat=>{
    html+=`<div class="cat-grp"><div class="cat-grp__h">${cat.glyph||''} ${esc(cat.name)}</div>`;
    cat.items.forEach(it=>{
      html+=`<div class="cat-item"><span class="cat-item__n">${esc(it.name)}${it.vn?` <i>${esc(it.vn)}</i>`:''}</span>`+
        `<select class="sel cat-sel" data-catersize="${it.code}">${CATER_SIZES.map(o=>`<option value="${o.k}">${o.l}</option>`).join('')}</select>`+
        `<button class="cat-add" data-cateradd="${it.code}">Add</button></div>`;
    });
    html+=`</div>`;
  });
  host.innerHTML=html;
  host.querySelectorAll('[data-cateradd]').forEach(b=>b.addEventListener('click',()=>{
    const code=b.dataset.cateradd;
    const sizeEl=host.querySelector(`[data-catersize="${code}"]`);
    const sizeKey=sizeEl?sizeEl.value:'';
    if(!sizeKey){ toast('Pick a tray size first'); return; }
    addCatering(code, sizeKey, b);
  }));
}
function addCatering(code, sizeKey, btn){
  const base=BY_CODE[code]; if(!base) return;
  const sizeLbl=CATER_LABEL[sizeKey], unit=CATER_PRICE[sizeKey];
  const key=['CTR_'+code, sizeLbl+' tray', ''].join('|');
  const ex=cart.find(l=>l.key===key);
  if(ex) ex.qty=Math.min(99, ex.qty+1);
  else cart.push({ key, code:'CTR_'+code, name:base.it.name+' (Catering)', vn:base.it.vn, size:sizeLbl+' tray', sauce:null, unit, qty:1 });
  save(); syncCart();
  if(btn){ btn.classList.add('done'); btn.textContent='Added ✓'; setTimeout(()=>{ btn.classList.remove('done'); btn.textContent='Add'; },900); }
  toast(`${base.it.name} (${sizeLbl}) added`);
}
/* ============================================================
   SOCIAL LINKS + STATUS + UTILS
   ============================================================ */
document.querySelectorAll('[data-ext]').forEach(a=>{
  const url = CFG.SOCIAL[a.dataset.ext];
  if (url && url!=='#'){ a.href=url; a.target='_blank'; a.rel='noopener'; }
  else a.addEventListener('click', e=>{ e.preventDefault(); toast('Add your link in CFG.SOCIAL'); });
});
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
let toastTimer;
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('on'), 2200); }
function updateOpenStatus(){
  const now = new Date(); const day = now.getDay(); const h = now.getHours();
  const open = day>=1 && day<=6 && h>=10 && h<20; // Mon–Sat 10–8
  const el = document.getElementById('openStatus');
  if (!el) return;
  el.querySelector('.dot').style.background = open ? 'var(--ok)' : '#B23B3B';
  el.style.background = open ? 'rgba(46,125,82,.1)' : 'rgba(178,59,59,.1)';
  el.style.color = open ? 'var(--ok)' : '#B23B3B';
  el.querySelector('span:last-child').textContent = open ? 'Open now · until 8 PM' : 'Closed · opens Mon–Sat 10 AM';
}

/* ============================================================
   INIT
   ============================================================ */
renderGallery();
renderMenu();
syncCart();
renderLoyalty();
renderCatering();
updateOpenStatus();
let startHash = location.hash.replace('#','');
if(!startHash){ const seg=(location.pathname.split('/').filter(Boolean).pop()||'').toLowerCase(); if(views[seg]) startHash=seg; }
if (views[startHash]) go(startHash);

/* ---- foundation: footer year, sheet links, cookie consent, analytics, forms ---- */
(function(){
  var fy=document.getElementById("footYear"); if(fy) fy.textContent=new Date().getFullYear();
  document.querySelectorAll("[data-sheet]").forEach(function(el){
    el.addEventListener("click",function(e){ e.preventDefault(); closeSheets(); openSheet(el.dataset.sheet); });
  });
  function reEmail(v){ v=(v||"").trim(); var a=v.indexOf("@"); var d=v.lastIndexOf("."); return a>0 && d>a+1 && d<v.length-1; }

  function loadGA(){
    if(!CFG.GA4_ID || window.__gaLoaded) return; window.__gaLoaded=true;
    var sc=document.createElement("script"); sc.async=true;
    sc.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(CFG.GA4_ID);
    document.head.appendChild(sc);
    window.dataLayer=window.dataLayer||[];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag=gtag; gtag("js",new Date()); gtag("config",CFG.GA4_ID);
  }
  function loadCF(){
    if(!CFG.CF_BEACON || window.__cfLoaded) return; window.__cfLoaded=true;
    var sc=document.createElement("script"); sc.defer=true;
    sc.src="https://static.cloudflareinsights.com/beacon.min.js";
    sc.setAttribute("data-cf-beacon", JSON.stringify({token:CFG.CF_BEACON}));
    document.body.appendChild(sc);
  }
  loadCF();

  var bar=document.getElementById("cookieBar");
  var consent=null; try{ consent=localStorage.getItem("cookieConsent"); }catch(e){}
  if(consent==="granted"){ loadGA(); }
  else if(consent!=="denied" && CFG.GA4_ID){ if(bar) bar.classList.add("on"); }
  function setConsent(v){ try{ localStorage.setItem("cookieConsent",v); }catch(e){} if(bar) bar.classList.remove("on"); if(v==="granted") loadGA(); }
  var ca=document.getElementById("cookieAccept"), cd=document.getElementById("cookieDecline");
  if(ca) ca.addEventListener("click",function(){ setConsent("granted"); });
  if(cd) cd.addEventListener("click",function(){ setConsent("denied"); });

  var NL=String.fromCharCode(10);
  var ctSend=document.getElementById("ctSend");
  if(ctSend) ctSend.addEventListener("click",function(){
    var name=val("ctName"), email=val("ctEmail"), phone=val("ctPhone"), msg=val("ctMsg");
    var st=document.getElementById("ctStatus");
    if(!name || !reEmail(email) || !msg){ if(st){st.style.color="#b3261e"; st.textContent="Please add your name, a valid email, and a message.";} return; }
    var payload={name:name,email:email,phone:phone,message:msg,source:"contact",site:CFG.WEBSITE};
    if(CFG.FORMS_BACKEND){
      ctSend.disabled=true; if(st){st.style.color="#6b5a58"; st.textContent="Sending...";}
      fetch((CFG.API_BASE||"")+"/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
        .then(function(r){ if(!r.ok) throw 0; if(st){st.style.color="#1f7a4d"; st.textContent="Thanks! Your message was sent. We will be in touch.";}
          ["ctName","ctEmail","ctPhone","ctMsg"].forEach(function(id){var n=document.getElementById(id); if(n)n.value="";}); })
        .catch(function(){ if(st){st.style.color="#b3261e"; st.textContent="Could not send right now. Please call (206) 693-3311 or email us.";} })
        .then(function(){ ctSend.disabled=false; });
    } else {
      var lines=["Name: "+name,"Email: "+email,"Phone: "+phone,"",msg];
      window.location.href="mailto:"+CFG.NOTIFY_EMAIL+"?subject="+encodeURIComponent("Website contact from "+name)+"&body="+encodeURIComponent(lines.join(NL));
      if(st){st.style.color="#6b5a58"; st.textContent="Opening your email app...";}
    }
  });

  var leadBtn=document.getElementById("leadBtn");
  if(leadBtn) leadBtn.addEventListener("click",function(){
    var email=val("leadEmail"); var m=document.getElementById("leadMsg");
    if(!reEmail(email)){ if(m){m.style.color="#b3261e"; m.textContent="Please enter a valid email.";} return; }
    var payload={email:email,source:"lead-magnet",site:CFG.WEBSITE};
    if(CFG.FORMS_BACKEND){
      leadBtn.disabled=true; if(m){m.style.color="#6b5a58"; m.textContent="Sending your coupon...";}
      fetch((CFG.API_BASE||"")+"/api/lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
        .then(function(r){ return r.json().catch(function(){return {};}).then(function(d){ return {ok:r.ok, d:d}; }); })
        .then(function(res){
          if(!res.ok){ throw new Error((res.d && res.d.error) || "Could not sign you up right now. Please try again later."); }
          if(m){m.style.color="#1f7a4d"; m.textContent="Check your inbox. Your coupon is on the way!";}
          var n=document.getElementById("leadEmail"); if(n)n.value="";
        })
        .catch(function(err){ if(m){m.style.color="#b3261e"; m.textContent=(err&&err.message)||"Could not sign you up right now. Please try again later.";} })
        .then(function(){ leadBtn.disabled=false; });
    } else {
      if(m){m.style.color="#1f7a4d"; m.textContent="Thanks! We will email your coupon once we go live.";}
      var n=document.getElementById("leadEmail"); if(n)n.value="";
    }
  });
})();