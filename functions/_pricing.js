// functions/_pricing.js
// SERVER-SIDE source of truth. Auto-generated from script.js MENU on 2026-07-06.
// Order totals MUST be recomputed here — never trust prices sent from the browser.

export const TAX_RATE = 0.1055;        // 10.55% Seattle
export const PROCESSING_FEE = 0.029;   // 2.9% card processing
export const BANH_FREE_QTY = 10;       // Buy 10 Bánh Mì -> 1 free (one promotion per order)
export const COUPON = { code:'WELCOME5', off:5.00, min:50.00 }; // first online order of $50+

export const HAPPY_HOUR = { codes:['C1','C2'], discount:2.00, startHour:14, endHour:17, tz:'America/Los_Angeles' };

export function isHappyHour(now = new Date()){
  const p = new Intl.DateTimeFormat('en-US',{timeZone:HAPPY_HOUR.tz,hour:'numeric',hour12:false,weekday:'short'})
    .formatToParts(now).reduce((a,x)=>(a[x.type]=x.value,a),{});
  const h = parseInt(p.hour,10);
  return p.weekday !== 'Sun' && h >= HAPPY_HOUR.startHour && h < HAPPY_HOUR.endHour;
}

export const PRICES = {
  // Appetizers
  A1: { "Pork & Shrimp":6.95, "Vegetable":6.95 },  // Egg Rolls (2)
  A2: { "Vegetable":7.95, "Tofu":7.95 },  // Summer Rolls (2)
  A3: { "Shrimp & Pork":8.95, "Shrimp":8.95, "Grilled Pork Sausage":8.95 },  // Summer Rolls (2)
  A4: 9.95,  // Grilled Pork Sausage Skewers (2)
  A5: 11.95,  // Fried Shrimp Cake Skewers (2)
  A6: 9.95,  // Salt & Pepper Tofu
  A7: 11.95,  // Salt & Pepper Calamari
  A8: 4.95,  // French Fries
  A9: 7.95,  // Shrimp Dumplings (6)
  A10: 7.95,  // Gyoza (6)
  // Phở
  S1: 18.95,  // Beef Short Ribs & Meatball Phở
  S2: 18.95,  // Oxtail & Meatball Phở
  S3: 17.95,  // Hanoi-Style Phở
  S4: 17.95,  // Seafood Phở
  S5: { "Medium":17.95, "Large":18.95 },  // Combo Phở
  S6: { "Medium":15.95, "Large":16.95 },  // Beef Phở
  S7: { "Medium":14.95, "Large":15.95 },  // Chicken Phở
  S8: { "Medium":14.95, "Large":15.95 },  // Tofu, Vegan Ham & Vegetable Phở
  // Bún Bò Huế
  N1: 18.95,  // Spicy Beef Noodle Soup
  // Chicken Wings
  C1: 12.95,  // Fish Sauce Wings (6)
  C2: 12.95,  // Butter Fried Wings (6)
  // Fried Rice
  W1: 17.95,  // House Wok Fried Rice
  W2: { "Shrimp":16.95, "Pork":16.95, "Shrimp & Pork":16.95 },  // Fried Rice
  W5: 15.95,  // Chicken Fried Rice
  // Rice Plates
  R1: 15.95,  // Grilled Chicken Rice Plate
  R2: 16.95,  // Grilled Pork Chop Rice Plate
  R3: 18.95,  // Grilled Beef Short Rib Rice Plate
  // Stir-Fry Entrées
  M1: { "White Rice":18.95, "Brown Rice":18.95 },  // Mongolian Beef
  M2: { "White Rice":18.95, "Brown Rice":18.95 },  // Shaken Beef
  M3: { "White Rice":16.95, "Brown Rice":16.95 },  // Lemongrass Chicken
  M4: { "White Rice":14.95, "Brown Rice":14.95 },  // Vegetable Stir-Fry
  M5: { "White Rice":14.95, "Brown Rice":14.95 },  // Garlic Green Bean
  M6: { "White Rice":15.95, "Brown Rice":15.95 },  // Chicken & Green Bean
  M7: { "White Rice":16.95, "Brown Rice":16.95 },  // Shrimp & Garlic Green Bean
  M8: { "White Rice":17.95, "Brown Rice":17.95 },  // Beef & Green Bean
  // Chow Mein
  X1: 17.95,  // House Chow Mein
  X2: 17.95,  // Beef Chow Mein
  X3: 16.95,  // Shrimp Chow Mein
  X4: 16.95,  // Pork Chow Mein
  X5: 15.95,  // Chicken Chow Mein
  // Vermicelli Bowls
  V1: 19.95,  // Combo Vermicelli
  V2: 18.95,  // Stir-Fry Beef Vermicelli
  V3: 16.95,  // Grilled Pork Vermicelli
  V4: 15.95,  // Grilled Chicken Vermicelli
  V5: 15.95,  // Lemongrass Chicken Vermicelli
  // Woven Vermicelli Platter
  P1: 20.95,  // Combo Woven Vermicelli
  // Bánh Mì
  B1: 7.95,  // Fried Tofu Sandwich
  B2: 7.95,  // Chicken Sandwich
  B3: 7.95,  // Sardine Sandwich
  B4: 7.95,  // Ham & Egg Sandwich
  B5: 8.95,  // Combo Sandwich
  B6: 8.95,  // House Grilled Pork Sandwich
  B7: 8.95,  // Grilled Pork Sausage Sandwich
  B8: 8.95,  // Roasted Pork Sandwich
  B9: 9.95,  // Stir-Fry Beef Sandwich
  // Salads
  G1: { "Chicken":14.95, "Shrimp":15.95 },  // Papaya Salad
  G2: { "Chicken":15.95, "Shrimp":16.95 },  // Mango Salad
  G3: 19.95,  // Beef Salad
  // Desserts
  T1: 6.95,  // Mango Sticky Rice
  T2: 5.95,  // Grilled Banana Sticky Rice
  // Extra Sides
  E1: 2.00,  // French Bread
  E2: { "Rice":3.00, "Noodle":3.00 },  // Rice or Noodle
  E3: 5.00,  // Broth
  E4: 4.00,  // Mixed Vegetables
  E5: 6.00,  // Bowl of Rare Steak, Flank, Brisket & Tendon
  E6: 6.00,  // Bowl of Meatballs
  E7: { "Meatball":4.00, "Rare Steak":4.00, "Flank":4.00, "Brisket":4.00, "Tendon":4.00, "Tofu":4.00, "Shrimp":4.00 },  // Extra Protein
  E8: 6.00,  // Short Rib
  E9: 3.00,  // Rice Paper
  E10: 2.50,  // Egg
  // Refreshments & Drinks
  D1: 5.50,  // Iced Black Coffee
  D2: 6.00,  // Viet Latte
  D3: 7.50,  // Matcha Latte
  D4: 5.50,  // Kumquat Lemonade
  D5: 5.50,  // Thai Tea
  D6: 6.50,  // Mango Smoothie
  D7: 6.50,  // Strawberry Smoothie
  D8: 6.50,  // Taro Smoothie
  D9: 8.00,  // Avocado Smoothie
  D10: 2.00,  // Canned Soda
};

export function unitPrice(code, size, now = new Date()){
  const p = PRICES[code];
  if (p === undefined) throw new Error('Unknown item code: ' + code);
  let price = (typeof p === 'number') ? p : p[size];
  if (price === undefined) throw new Error('Unknown size "' + size + '" for ' + code);
  if (HAPPY_HOUR.codes.includes(code) && isHappyHour(now)) price = Math.max(0, price - HAPPY_HOUR.discount);
  return Math.round(price * 100) / 100;
}
