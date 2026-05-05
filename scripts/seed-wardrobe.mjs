/**
 * Seed script — inserts a diverse wardrobe into MongoDB for testing.
 *
 * Usage:
 *   node scripts/seed-wardrobe.mjs
 *
 * Change USER_ID below to the _id of the user you want to seed for.
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { Resolver } from "dns/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

async function resolveSrvUri(uri) {
  try {
    const url = new URL(uri);
    if (!url.protocol.startsWith("mongodb+srv")) return uri;
    const resolver = new Resolver();
    resolver.setServers(["8.8.8.8", "8.8.4.4"]);
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${url.hostname}`);
    if (!srvRecords?.length) return uri;
    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    let txtOpts = "authSource=admin";
    try {
      const txtRecords = await resolver.resolveTxt(url.hostname);
      if (txtRecords.length > 0) txtOpts = txtRecords[0].join("");
    } catch {}
    const finalParams = new URLSearchParams(txtOpts);
    finalParams.set("tls", "true");
    const origParams = new URLSearchParams(url.search);
    for (const [k, v] of origParams) {
      if (!finalParams.has(k) && k !== "appName") finalParams.set(k, v);
    }
    const dbName = url.pathname.replace(/^\//, "") || "wardrobe";
    const userInfo = `${url.username}:${encodeURIComponent(decodeURIComponent(url.password))}`;
    return `mongodb://${userInfo}@${hosts}/${dbName}?${finalParams.toString()}`;
  } catch (err) {
    console.warn("SRV resolve failed, using original URI:", err.message);
    return uri;
  }
}

// ── CONFIG ────────────────────────────────────────────────────────
const USER_ID = "69e519444a6dbd4307cee51f"; // ← your user _id from MongoDB
// ─────────────────────────────────────────────────────────────────

const ClothingItemSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl:     { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    type:         { type: String, required: true },
    color:        { type: String, required: true },
    pattern:      { type: String, default: "solid" },
    style:        { type: String, default: "casual" },
    occasion:     { type: [String], default: [] },
    season:       { type: String, default: "all" },
    customName:   { type: String, default: "" },
    notes:        { type: String, default: "" },
    wearCount:    { type: Number, default: 0 },
    lastWorn:     { type: Date, default: null },
    purchasePrice:{ type: Number, default: null },
    inLaundry:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ClothingItem =
  mongoose.models.ClothingItem || mongoose.model("ClothingItem", ClothingItemSchema);

// Unsplash images — stable, no API key needed
const IMG = {
  white_shirt:    "https://images.unsplash.com/photo-1603251578711-3290ca1a0187?w=400&auto=format&fit=crop",
  navy_tshirt:    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&auto=format&fit=crop",
  black_turtleneck:"https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&auto=format&fit=crop",
  floral_blouse:  "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&auto=format&fit=crop",
  olive_hoodie:   "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&auto=format&fit=crop",
  cream_sweater:  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&auto=format&fit=crop",
  red_polo:       "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&auto=format&fit=crop",
  striped_shirt:  "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=400&auto=format&fit=crop",
  beige_linen:    "https://images.unsplash.com/photo-1594938298603-c8148c4b4f9a?w=400&auto=format&fit=crop",
  pink_kurta:     "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop",
  dark_jeans:     "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&auto=format&fit=crop",
  black_trousers: "https://images.unsplash.com/photo-1594938374182-a57b60e35741?w=400&auto=format&fit=crop",
  beige_chinos:   "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&auto=format&fit=crop",
  grey_sweatpants:"https://images.unsplash.com/photo-1593698054498-56dcfb454a26?w=400&auto=format&fit=crop",
  navy_formal:    "https://images.unsplash.com/photo-1560060141-5f2a2b1b1c2e?w=400&auto=format&fit=crop",
  white_shorts:   "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&auto=format&fit=crop",
  floral_skirt:   "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&auto=format&fit=crop",
  olive_cargo:    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop",
  black_suit:     "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop",
  navy_blazer:    "https://images.unsplash.com/photo-1580657018950-c7f7d99a1542?w=400&auto=format&fit=crop",
  red_dress:      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop",
  black_dress:    "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&auto=format&fit=crop",
  white_kurta:    "https://images.unsplash.com/photo-1603217192634-61068e4d4bf9?w=400&auto=format&fit=crop",
  lehenga:        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop",
  saree:          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop",
  white_sneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop",
  black_oxfords:  "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400&auto=format&fit=crop",
  brown_boots:    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&auto=format&fit=crop",
  white_heels:    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&auto=format&fit=crop",
  sports_shoes:   "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop",
  denim_jacket:   "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&auto=format&fit=crop",
  leather_jacket: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop",
  grey_blazer:    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&auto=format&fit=crop",

  // ── MEN'S ADDITIONS ──────────────────────────────────────────
  light_blue_shirt:   "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=400&auto=format&fit=crop",
  graphic_tee:        "https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=400&auto=format&fit=crop",
  black_henley:       "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&auto=format&fit=crop",
  maroon_shirt:       "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&auto=format&fit=crop",
  grey_melange_tee:   "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop",
  chambray_shirt:     "https://images.unsplash.com/photo-1603252109360-909baaf261ae?w=400&auto=format&fit=crop",
  mandarin_shirt:     "https://images.unsplash.com/photo-1602810319428-019690571b5b?w=400&auto=format&fit=crop",
  flannel_shirt:      "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&auto=format&fit=crop",
  white_linen_shirt:  "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=400&auto=format&fit=crop",
  mustard_polo:       "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&auto=format&fit=crop",
  black_slim_jeans:   "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop",
  light_blue_jeans:   "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=400&auto=format&fit=crop",
  charcoal_trousers:  "https://images.unsplash.com/photo-1594938374182-a57b60e35741?w=400&auto=format&fit=crop",
  corduroy_trousers:  "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&auto=format&fit=crop",
  navy_joggers:       "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&auto=format&fit=crop",
  denim_shorts:       "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&auto=format&fit=crop",
  khaki_shorts:       "https://images.unsplash.com/photo-1565084888279-aca607bb7fe9?w=400&auto=format&fit=crop",
  plaid_trousers:     "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop",
  blue_kurta:         "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop",
  maroon_kurta:       "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop",
  white_kurta_pajama: "https://images.unsplash.com/photo-1603217192634-61068e4d4bf9?w=400&auto=format&fit=crop",
  sherwani:           "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop",
  indo_western:       "https://images.unsplash.com/photo-1580657018950-c7f7d99a1542?w=400&auto=format&fit=crop",
  charcoal_suit:      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop",
  light_grey_suit:    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&auto=format&fit=crop",
  pinstripe_blazer:   "https://images.unsplash.com/photo-1580657018950-c7f7d99a1542?w=400&auto=format&fit=crop",
  linen_blazer:       "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&auto=format&fit=crop",
  black_waistcoat:    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop",
  olive_bomber:       "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&auto=format&fit=crop",
  navy_puffer:        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&auto=format&fit=crop",
  grey_zip_hoodie:    "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&auto=format&fit=crop",
  overshirt:          "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&auto=format&fit=crop",
  brown_derby:        "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?w=400&auto=format&fit=crop",
  white_canvas:       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop",
  black_chelsea:      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&auto=format&fit=crop",
  tan_loafers:        "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=400&auto=format&fit=crop",
  running_shoes:      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop",
};

const items = [
  // ── TOPS ──────────────────────────────────────────────────────
  {
    imageUrl: IMG.white_shirt, cloudinaryId: "seed/white_formal_shirt",
    type: "shirt", color: "white", pattern: "solid", style: "formal",
    occasion: ["office", "formal", "smart casual", "wedding"], season: "all",
    customName: "White Formal Shirt", purchasePrice: 1200,
  },
  {
    imageUrl: IMG.navy_tshirt, cloudinaryId: "seed/navy_tshirt",
    type: "t-shirt", color: "navy blue", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor"], season: "summer",
    customName: "Navy Blue T-Shirt", purchasePrice: 499,
  },
  {
    imageUrl: IMG.black_turtleneck, cloudinaryId: "seed/black_turtleneck",
    type: "t-shirt", color: "black", pattern: "solid", style: "smart casual",
    occasion: ["casual", "smart casual", "date"], season: "winter",
    customName: "Black Turtleneck", purchasePrice: 899,
  },
  {
    imageUrl: IMG.floral_blouse, cloudinaryId: "seed/floral_blouse",
    type: "blouse", color: "pink", pattern: "floral", style: "casual",
    occasion: ["casual", "party", "date"], season: "summer",
    customName: "Floral Blouse", purchasePrice: 750,
  },
  {
    imageUrl: IMG.olive_hoodie, cloudinaryId: "seed/olive_hoodie",
    type: "hoodie", color: "olive green", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor", "gym"], season: "winter",
    customName: "Olive Green Hoodie", purchasePrice: 1100,
  },
  {
    imageUrl: IMG.cream_sweater, cloudinaryId: "seed/cream_sweater",
    type: "sweater", color: "cream", pattern: "solid", style: "smart casual",
    occasion: ["casual", "smart casual", "office"], season: "winter",
    customName: "Cream Knit Sweater", purchasePrice: 1500,
  },
  {
    imageUrl: IMG.red_polo, cloudinaryId: "seed/red_polo",
    type: "shirt", color: "red", pattern: "solid", style: "casual",
    occasion: ["casual", "smart casual", "outdoor"], season: "summer",
    customName: "Red Polo Shirt", purchasePrice: 699,
  },
  {
    imageUrl: IMG.striped_shirt, cloudinaryId: "seed/striped_shirt",
    type: "shirt", color: "blue white", pattern: "stripes", style: "smart casual",
    occasion: ["casual", "smart casual", "office"], season: "all",
    customName: "Blue Striped Shirt", purchasePrice: 999,
  },
  {
    imageUrl: IMG.beige_linen, cloudinaryId: "seed/beige_linen_shirt",
    type: "shirt", color: "beige", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor", "beach"], season: "summer",
    customName: "Beige Linen Shirt", purchasePrice: 850,
  },
  {
    imageUrl: IMG.pink_kurta, cloudinaryId: "seed/pink_kurta",
    type: "kurta", color: "pink", pattern: "embroidered", style: "ethnic",
    occasion: ["festive", "casual", "wedding"], season: "all",
    customName: "Pink Embroidered Kurta", purchasePrice: 1800,
  },
  // ── BOTTOMS ───────────────────────────────────────────────────
  {
    imageUrl: IMG.dark_jeans, cloudinaryId: "seed/dark_jeans",
    type: "jeans", color: "dark blue", pattern: "solid", style: "casual",
    occasion: ["casual", "smart casual", "date", "outdoor"], season: "all",
    customName: "Dark Blue Skinny Jeans", purchasePrice: 1499,
  },
  {
    imageUrl: IMG.black_trousers, cloudinaryId: "seed/black_trousers",
    type: "trousers", color: "black", pattern: "solid", style: "formal",
    occasion: ["office", "formal", "smart casual", "wedding"], season: "all",
    customName: "Black Formal Trousers", purchasePrice: 1200,
  },
  {
    imageUrl: IMG.beige_chinos, cloudinaryId: "seed/beige_chinos",
    type: "trousers", color: "beige", pattern: "solid", style: "smart casual",
    occasion: ["smart casual", "casual", "office", "date"], season: "all",
    customName: "Beige Chinos", purchasePrice: 1100,
  },
  {
    imageUrl: IMG.grey_sweatpants, cloudinaryId: "seed/grey_sweatpants",
    type: "trousers", color: "grey", pattern: "solid", style: "sporty",
    occasion: ["casual", "gym", "outdoor"], season: "all",
    customName: "Grey Sweatpants", purchasePrice: 599,
  },
  {
    imageUrl: IMG.navy_formal, cloudinaryId: "seed/navy_formal_trousers",
    type: "trousers", color: "navy blue", pattern: "solid", style: "formal",
    occasion: ["office", "formal", "smart casual"], season: "all",
    customName: "Navy Formal Trousers", purchasePrice: 1300,
  },
  {
    imageUrl: IMG.white_shorts, cloudinaryId: "seed/white_shorts",
    type: "shorts", color: "white", pattern: "solid", style: "casual",
    occasion: ["casual", "beach", "outdoor", "gym"], season: "summer",
    customName: "White Cotton Shorts", purchasePrice: 499,
  },
  {
    imageUrl: IMG.floral_skirt, cloudinaryId: "seed/floral_skirt",
    type: "skirt", color: "multicolor", pattern: "floral", style: "casual",
    occasion: ["casual", "party", "date"], season: "summer",
    customName: "Floral Midi Skirt", purchasePrice: 900,
  },
  {
    imageUrl: IMG.olive_cargo, cloudinaryId: "seed/olive_cargo",
    type: "trousers", color: "olive green", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor"], season: "all",
    customName: "Olive Cargo Pants", purchasePrice: 1200,
  },
  // ── FULL OUTFITS / DRESSES ─────────────────────────────────────
  {
    imageUrl: IMG.black_suit, cloudinaryId: "seed/black_suit",
    type: "suit", color: "black", pattern: "solid", style: "formal",
    occasion: ["formal", "office", "wedding"], season: "all",
    customName: "Black Formal Suit", purchasePrice: 6000,
  },
  {
    imageUrl: IMG.navy_blazer, cloudinaryId: "seed/navy_blazer",
    type: "blazer", color: "navy blue", pattern: "solid", style: "formal",
    occasion: ["office", "smart casual", "formal", "wedding"], season: "all",
    customName: "Navy Blue Blazer", purchasePrice: 3500,
  },
  {
    imageUrl: IMG.grey_blazer, cloudinaryId: "seed/grey_blazer",
    type: "blazer", color: "grey", pattern: "solid", style: "smart casual",
    occasion: ["office", "smart casual", "formal"], season: "all",
    customName: "Grey Blazer", purchasePrice: 3000,
  },
  {
    imageUrl: IMG.red_dress, cloudinaryId: "seed/red_floral_dress",
    type: "dress", color: "red", pattern: "floral", style: "casual",
    occasion: ["party", "date", "casual"], season: "summer",
    customName: "Red Floral Dress", purchasePrice: 1800,
  },
  {
    imageUrl: IMG.black_dress, cloudinaryId: "seed/black_cocktail_dress",
    type: "dress", color: "black", pattern: "solid", style: "formal",
    occasion: ["party", "formal", "date", "wedding"], season: "all",
    customName: "Black Cocktail Dress", purchasePrice: 2500,
  },
  {
    imageUrl: IMG.white_kurta, cloudinaryId: "seed/white_kurta_set",
    type: "kurta", color: "white", pattern: "solid", style: "ethnic",
    occasion: ["festive", "casual", "wedding"], season: "all",
    customName: "White Kurta Set", purchasePrice: 2000,
  },
  {
    imageUrl: IMG.lehenga, cloudinaryId: "seed/pink_lehenga",
    type: "lehenga", color: "pink", pattern: "embroidered", style: "ethnic",
    occasion: ["wedding", "festive", "party"], season: "all",
    customName: "Pink Lehenga", purchasePrice: 8000,
  },
  // ── OUTERWEAR ─────────────────────────────────────────────────
  {
    imageUrl: IMG.denim_jacket, cloudinaryId: "seed/denim_jacket",
    type: "jacket", color: "blue", pattern: "solid", style: "casual",
    occasion: ["casual", "smart casual", "outdoor", "date"], season: "winter",
    customName: "Denim Jacket", purchasePrice: 2000,
  },
  {
    imageUrl: IMG.leather_jacket, cloudinaryId: "seed/black_leather_jacket",
    type: "jacket", color: "black", pattern: "solid", style: "casual",
    occasion: ["casual", "party", "date"], season: "winter",
    customName: "Black Leather Jacket", purchasePrice: 4500,
  },
  // ── SHOES ─────────────────────────────────────────────────────
  {
    imageUrl: IMG.white_sneakers, cloudinaryId: "seed/white_sneakers",
    type: "sneakers", color: "white", pattern: "solid", style: "casual",
    occasion: ["casual", "smart casual", "outdoor"], season: "all",
    customName: "White Sneakers", purchasePrice: 2500,
  },
  {
    imageUrl: IMG.black_oxfords, cloudinaryId: "seed/black_oxfords",
    type: "shoes", color: "black", pattern: "solid", style: "formal",
    occasion: ["formal", "office", "wedding", "smart casual"], season: "all",
    customName: "Black Oxford Shoes", purchasePrice: 3000,
  },
  {
    imageUrl: IMG.brown_boots, cloudinaryId: "seed/brown_boots",
    type: "boots", color: "brown", pattern: "solid", style: "casual",
    occasion: ["smart casual", "casual", "outdoor", "date"], season: "winter",
    customName: "Brown Leather Boots", purchasePrice: 3500,
  },
  {
    imageUrl: IMG.white_heels, cloudinaryId: "seed/white_heels",
    type: "heels", color: "white", pattern: "solid", style: "formal",
    occasion: ["party", "wedding", "formal", "date"], season: "all",
    customName: "White Block Heels", purchasePrice: 2000,
  },
  {
    imageUrl: IMG.sports_shoes, cloudinaryId: "seed/sports_shoes",
    type: "sneakers", color: "grey", pattern: "solid", style: "sporty",
    occasion: ["gym", "casual", "outdoor"], season: "all",
    customName: "Grey Sports Shoes", purchasePrice: 2800,
  },

  // ══════════════════════════════════════════════════════════════
  // ── MEN'S CLOTHING ────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  // ── MEN'S TOPS ────────────────────────────────────────────────
  {
    imageUrl: IMG.light_blue_shirt, cloudinaryId: "seed/men_light_blue_shirt",
    type: "shirt", color: "light blue", pattern: "solid", style: "formal",
    occasion: ["office", "formal", "smart casual", "wedding"], season: "all",
    customName: "Light Blue Dress Shirt", purchasePrice: 1100,
  },
  {
    imageUrl: IMG.graphic_tee, cloudinaryId: "seed/men_graphic_tee",
    type: "t-shirt", color: "white", pattern: "printed", style: "streetwear",
    occasion: ["casual", "outdoor"], season: "summer",
    customName: "White Graphic Tee", purchasePrice: 599,
  },
  {
    imageUrl: IMG.black_henley, cloudinaryId: "seed/men_black_henley",
    type: "t-shirt", color: "black", pattern: "solid", style: "smart casual",
    occasion: ["casual", "smart casual", "date", "outdoor"], season: "all",
    customName: "Black Henley T-Shirt", purchasePrice: 799,
  },
  {
    imageUrl: IMG.maroon_shirt, cloudinaryId: "seed/men_maroon_shirt",
    type: "shirt", color: "maroon", pattern: "solid", style: "smart casual",
    occasion: ["casual", "smart casual", "party", "date"], season: "winter",
    customName: "Maroon Full-Sleeve Shirt", purchasePrice: 899,
  },
  {
    imageUrl: IMG.grey_melange_tee, cloudinaryId: "seed/men_grey_melange_tee",
    type: "t-shirt", color: "grey", pattern: "solid", style: "casual",
    occasion: ["casual", "gym", "outdoor"], season: "all",
    customName: "Grey Melange T-Shirt", purchasePrice: 399,
  },
  {
    imageUrl: IMG.chambray_shirt, cloudinaryId: "seed/men_chambray_shirt",
    type: "shirt", color: "light blue", pattern: "solid", style: "casual",
    occasion: ["casual", "smart casual", "outdoor", "date"], season: "all",
    customName: "Chambray Casual Shirt", purchasePrice: 1200,
  },
  {
    imageUrl: IMG.mandarin_shirt, cloudinaryId: "seed/men_mandarin_shirt",
    type: "shirt", color: "white", pattern: "solid", style: "smart casual",
    occasion: ["smart casual", "party", "date", "festive"], season: "all",
    customName: "White Mandarin Collar Shirt", purchasePrice: 1400,
  },
  {
    imageUrl: IMG.flannel_shirt, cloudinaryId: "seed/men_flannel_shirt",
    type: "shirt", color: "red green", pattern: "checks", style: "casual",
    occasion: ["casual", "outdoor"], season: "winter",
    customName: "Green Checked Flannel Shirt", purchasePrice: 999,
  },
  {
    imageUrl: IMG.white_linen_shirt, cloudinaryId: "seed/men_white_linen_shirt",
    type: "shirt", color: "white", pattern: "solid", style: "casual",
    occasion: ["casual", "beach", "smart casual", "outdoor"], season: "summer",
    customName: "White Linen Shirt", purchasePrice: 1300,
  },
  {
    imageUrl: IMG.mustard_polo, cloudinaryId: "seed/men_mustard_polo",
    type: "shirt", color: "mustard yellow", pattern: "solid", style: "smart casual",
    occasion: ["casual", "smart casual", "outdoor"], season: "summer",
    customName: "Mustard Yellow Polo", purchasePrice: 799,
  },

  // ── MEN'S BOTTOMS ─────────────────────────────────────────────
  {
    imageUrl: IMG.black_slim_jeans, cloudinaryId: "seed/men_black_slim_jeans",
    type: "jeans", color: "black", pattern: "solid", style: "smart casual",
    occasion: ["casual", "smart casual", "party", "date"], season: "all",
    customName: "Black Slim Fit Jeans", purchasePrice: 1799,
  },
  {
    imageUrl: IMG.light_blue_jeans, cloudinaryId: "seed/men_light_blue_jeans",
    type: "jeans", color: "light blue", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor", "date"], season: "all",
    customName: "Light Blue Distressed Jeans", purchasePrice: 1599,
  },
  {
    imageUrl: IMG.charcoal_trousers, cloudinaryId: "seed/men_charcoal_trousers",
    type: "trousers", color: "charcoal grey", pattern: "solid", style: "formal",
    occasion: ["office", "formal", "smart casual", "wedding"], season: "all",
    customName: "Charcoal Formal Trousers", purchasePrice: 1400,
  },
  {
    imageUrl: IMG.corduroy_trousers, cloudinaryId: "seed/men_corduroy_trousers",
    type: "trousers", color: "brown", pattern: "solid", style: "smart casual",
    occasion: ["casual", "smart casual", "outdoor", "date"], season: "winter",
    customName: "Brown Corduroy Trousers", purchasePrice: 1600,
  },
  {
    imageUrl: IMG.navy_joggers, cloudinaryId: "seed/men_navy_joggers",
    type: "trousers", color: "navy blue", pattern: "solid", style: "sporty",
    occasion: ["casual", "gym", "outdoor"], season: "all",
    customName: "Navy Blue Joggers", purchasePrice: 699,
  },
  {
    imageUrl: IMG.denim_shorts, cloudinaryId: "seed/men_denim_shorts",
    type: "shorts", color: "light blue", pattern: "solid", style: "casual",
    occasion: ["casual", "beach", "outdoor"], season: "summer",
    customName: "Denim Shorts", purchasePrice: 899,
  },
  {
    imageUrl: IMG.khaki_shorts, cloudinaryId: "seed/men_khaki_shorts",
    type: "shorts", color: "khaki", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor", "beach"], season: "summer",
    customName: "Khaki Cargo Shorts", purchasePrice: 799,
  },
  {
    imageUrl: IMG.plaid_trousers, cloudinaryId: "seed/men_plaid_trousers",
    type: "trousers", color: "grey", pattern: "checks", style: "smart casual",
    occasion: ["smart casual", "party", "office"], season: "winter",
    customName: "Grey Plaid Trousers", purchasePrice: 1800,
  },

  // ── MEN'S ETHNIC ──────────────────────────────────────────────
  {
    imageUrl: IMG.blue_kurta, cloudinaryId: "seed/men_blue_kurta",
    type: "kurta", color: "blue", pattern: "solid", style: "ethnic",
    occasion: ["casual", "festive", "wedding"], season: "all",
    customName: "Blue Cotton Kurta", purchasePrice: 900,
  },
  {
    imageUrl: IMG.maroon_kurta, cloudinaryId: "seed/men_maroon_silk_kurta",
    type: "kurta", color: "maroon", pattern: "solid", style: "ethnic",
    occasion: ["festive", "wedding", "party"], season: "all",
    customName: "Maroon Silk Kurta", purchasePrice: 2200,
  },
  {
    imageUrl: IMG.white_kurta_pajama, cloudinaryId: "seed/men_white_kurta_pajama",
    type: "kurta", color: "white", pattern: "embroidered", style: "ethnic",
    occasion: ["festive", "wedding", "casual"], season: "all",
    customName: "White Kurta Pajama Set", purchasePrice: 2500,
  },
  {
    imageUrl: IMG.sherwani, cloudinaryId: "seed/men_maroon_sherwani",
    type: "suit", color: "maroon", pattern: "embroidered", style: "ethnic",
    occasion: ["wedding", "festive"], season: "all",
    customName: "Maroon Sherwani", purchasePrice: 12000,
  },
  {
    imageUrl: IMG.indo_western, cloudinaryId: "seed/men_indo_western_jacket",
    type: "blazer", color: "navy blue", pattern: "embroidered", style: "ethnic",
    occasion: ["wedding", "festive", "party"], season: "all",
    customName: "Navy Indo-Western Jacket", purchasePrice: 4500,
  },

  // ── MEN'S FORMAL / SMART ──────────────────────────────────────
  {
    imageUrl: IMG.charcoal_suit, cloudinaryId: "seed/men_charcoal_suit",
    type: "suit", color: "charcoal grey", pattern: "solid", style: "formal",
    occasion: ["formal", "office", "wedding"], season: "all",
    customName: "Charcoal Grey Suit", purchasePrice: 7500,
  },
  {
    imageUrl: IMG.light_grey_suit, cloudinaryId: "seed/men_light_grey_suit",
    type: "suit", color: "light grey", pattern: "solid", style: "formal",
    occasion: ["formal", "office", "wedding", "smart casual"], season: "all",
    customName: "Light Grey Suit", purchasePrice: 6500,
  },
  {
    imageUrl: IMG.pinstripe_blazer, cloudinaryId: "seed/men_pinstripe_blazer",
    type: "blazer", color: "navy blue", pattern: "stripes", style: "formal",
    occasion: ["office", "formal", "smart casual"], season: "all",
    customName: "Navy Pinstripe Blazer", purchasePrice: 4000,
  },
  {
    imageUrl: IMG.linen_blazer, cloudinaryId: "seed/men_cream_linen_blazer",
    type: "blazer", color: "cream", pattern: "solid", style: "smart casual",
    occasion: ["smart casual", "party", "wedding", "date"], season: "summer",
    customName: "Cream Linen Blazer", purchasePrice: 3800,
  },
  {
    imageUrl: IMG.black_waistcoat, cloudinaryId: "seed/men_black_waistcoat",
    type: "blazer", color: "black", pattern: "solid", style: "formal",
    occasion: ["formal", "party", "wedding"], season: "all",
    customName: "Black Waistcoat", purchasePrice: 1800,
  },

  // ── MEN'S OUTERWEAR ───────────────────────────────────────────
  {
    imageUrl: IMG.olive_bomber, cloudinaryId: "seed/men_olive_bomber",
    type: "jacket", color: "olive green", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor", "smart casual", "date"], season: "winter",
    customName: "Olive Bomber Jacket", purchasePrice: 2800,
  },
  {
    imageUrl: IMG.navy_puffer, cloudinaryId: "seed/men_navy_puffer",
    type: "jacket", color: "navy blue", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor"], season: "winter",
    customName: "Navy Blue Puffer Jacket", purchasePrice: 3200,
  },
  {
    imageUrl: IMG.grey_zip_hoodie, cloudinaryId: "seed/men_grey_zip_hoodie",
    type: "hoodie", color: "grey", pattern: "solid", style: "casual",
    occasion: ["casual", "gym", "outdoor"], season: "winter",
    customName: "Grey Zip-Up Hoodie", purchasePrice: 1200,
  },
  {
    imageUrl: IMG.overshirt, cloudinaryId: "seed/men_checked_overshirt",
    type: "jacket", color: "brown beige", pattern: "checks", style: "casual",
    occasion: ["casual", "smart casual", "outdoor"], season: "winter",
    customName: "Brown Checked Overshirt", purchasePrice: 1800,
  },

  // ── MEN'S FOOTWEAR ────────────────────────────────────────────
  {
    imageUrl: IMG.brown_derby, cloudinaryId: "seed/men_brown_derby",
    type: "shoes", color: "brown", pattern: "solid", style: "formal",
    occasion: ["office", "formal", "smart casual", "wedding"], season: "all",
    customName: "Brown Derby Shoes", purchasePrice: 3500,
  },
  {
    imageUrl: IMG.white_canvas, cloudinaryId: "seed/men_white_canvas",
    type: "sneakers", color: "white", pattern: "solid", style: "casual",
    occasion: ["casual", "outdoor", "smart casual"], season: "summer",
    customName: "White Canvas Sneakers", purchasePrice: 1200,
  },
  {
    imageUrl: IMG.black_chelsea, cloudinaryId: "seed/men_black_chelsea",
    type: "boots", color: "black", pattern: "solid", style: "smart casual",
    occasion: ["smart casual", "party", "date", "casual"], season: "winter",
    customName: "Black Chelsea Boots", purchasePrice: 4000,
  },
  {
    imageUrl: IMG.tan_loafers, cloudinaryId: "seed/men_tan_loafers",
    type: "shoes", color: "tan", pattern: "solid", style: "smart casual",
    occasion: ["smart casual", "casual", "office", "date"], season: "all",
    customName: "Tan Leather Loafers", purchasePrice: 2800,
  },
  {
    imageUrl: IMG.running_shoes, cloudinaryId: "seed/men_running_shoes",
    type: "sneakers", color: "blue white", pattern: "solid", style: "sporty",
    occasion: ["gym", "casual", "outdoor"], season: "all",
    customName: "Blue Running Shoes", purchasePrice: 3200,
  },
];

async function seed() {
  try {
    const resolvedUri = await resolveSrvUri(process.env.MONGODB_URI);
    await mongoose.connect(resolvedUri);
    console.log("Connected to MongoDB");

    // Remove previously seeded items (cloudinaryId starts with "seed/")
    const deleted = await ClothingItem.deleteMany({ cloudinaryId: /^seed\// });
    if (deleted.deletedCount > 0) console.log(`🗑  Removed ${deleted.deletedCount} old seeded items`);

    const userId = new mongoose.Types.ObjectId(USER_ID);
    const docs = items.map((item) => ({ ...item, userId }));

    const result = await ClothingItem.insertMany(docs);
    console.log(`✅ Inserted ${result.length} clothing items for user ${USER_ID}`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
