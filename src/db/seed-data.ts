// Seed data drawn from the actual current menus of Cafe Hanoi and Ghost Street
// (both in Britomart, Auckland, both kitchens overseen by exec chef Nathan Houpapa).
// Ingredient prices are realistic 2026 NZ wholesale $/kg; quantities are
// per-plate estimates. These are starting points — real values are entered by the chef.

export type SeedIngredient = {
  key: string;
  name: string;
  pricePerKg: number;
  supplier: string;
};

export type SeedRecipeItem = {
  ingredientKey: string;
  quantity: number;
  unit: "kg" | "g" | "L" | "ml" | "ea";
  yieldPct?: number;
};

export type SeedRecipe = {
  venue: "cafe-hanoi" | "ghost-street";
  name: string;
  salePriceIncGst: number;
  targetMarginPct?: number;
  notes?: string;
  items: SeedRecipeItem[];
};

export const SEED_ORG_NAME = "Nathan's Kitchens";

export const SEED_INGREDIENTS: SeedIngredient[] = [
  // Proteins
  { key: "beef_eye_fillet", name: "Beef eye fillet, Angus", pricePerKg: 65, supplier: "Bidfood" },
  { key: "beef_sirloin", name: "Beef sirloin, Angus", pricePerKg: 42, supplier: "Bidfood" },
  { key: "beef_brisket", name: "Beef brisket, Mātangi", pricePerKg: 32, supplier: "Bidfood" },
  { key: "beef_mince", name: "Beef mince, premium", pricePerKg: 14, supplier: "Bidfood" },
  { key: "pork_belly", name: "Pork belly, boneless free-range", pricePerKg: 18, supplier: "Service Foods" },
  { key: "pork_shoulder", name: "Pork shoulder, free-range", pricePerKg: 14, supplier: "Service Foods" },
  { key: "pork_ribs", name: "Pork ribs", pricePerKg: 18, supplier: "Service Foods" },
  { key: "pork_mince", name: "Pork mince", pricePerKg: 12, supplier: "Service Foods" },
  { key: "lamb_ribs", name: "Lamb ribs", pricePerKg: 28, supplier: "Bidfood" },
  { key: "chicken_thigh", name: "Chicken thigh, boneless skinless organic", pricePerKg: 14.5, supplier: "Bidfood" },
  { key: "chicken_whole", name: "Chicken whole, organic", pricePerKg: 11, supplier: "Bidfood" },
  { key: "duck_breast", name: "Duck breast", pricePerKg: 42, supplier: "Bidfood" },
  { key: "duck_crown", name: "Duck crown", pricePerKg: 30, supplier: "Bidfood" },
  { key: "tiger_prawns", name: "Tiger prawns, raw shell-on", pricePerKg: 48, supplier: "Bidfood" },
  { key: "scallops", name: "Hokkaido scallops", pricePerKg: 85, supplier: "Bidfood" },
  { key: "snapper_fillet", name: "Snapper fillets, NZ", pricePerKg: 48, supplier: "Bidfood" },
  { key: "kingfish_fillet", name: "Kingfish fillets, farmed NZ", pricePerKg: 52, supplier: "Bidfood" },
  { key: "octopus", name: "Octopus, NZ", pricePerKg: 35, supplier: "Bidfood" },
  { key: "egg", name: "Eggs, free-range", pricePerKg: 7, supplier: "Gilmours" },
  { key: "tofu_silken", name: "Tofu, silken", pricePerKg: 9, supplier: "Service Foods" },
  { key: "tofu_firm", name: "Tofu, firm", pricePerKg: 9, supplier: "Service Foods" },

  // Carbs / wrappers
  { key: "rice_jasmine", name: "Rice, jasmine", pricePerKg: 3.5, supplier: "Bidfood" },
  { key: "noodles_pho", name: "Pho rice noodles, dried", pricePerKg: 5, supplier: "Bidfood" },
  { key: "noodles_egg", name: "Egg noodles, fresh", pricePerKg: 4, supplier: "Bidfood" },
  { key: "flour_bread", name: "Bread flour (for biang biang)", pricePerKg: 4, supplier: "Gilmours" },
  { key: "rice_paper", name: "Rice paper wrappers", pricePerKg: 14, supplier: "Bidfood" },
  { key: "wonton_skins", name: "Wonton skins", pricePerKg: 8, supplier: "Bidfood" },
  { key: "bao_steamed", name: "Steamed bao buns", pricePerKg: 6, supplier: "Bidfood" },
  { key: "rice_powder", name: "Rice powder, toasted", pricePerKg: 15, supplier: "Gilmours" },

  // Vegetables
  { key: "onion_brown", name: "Onion, brown", pricePerKg: 2.8, supplier: "Gilmours" },
  { key: "onion_red", name: "Onion, red", pricePerKg: 3.2, supplier: "Gilmours" },
  { key: "spring_onion", name: "Spring onion", pricePerKg: 14, supplier: "Gilmours" },
  { key: "shallot", name: "Shallot", pricePerKg: 9, supplier: "Gilmours" },
  { key: "leek", name: "Leek", pricePerKg: 7, supplier: "Gilmours" },
  { key: "garlic", name: "Garlic", pricePerKg: 18, supplier: "Gilmours" },
  { key: "ginger", name: "Ginger, fresh", pricePerKg: 14, supplier: "Gilmours" },
  { key: "lemongrass", name: "Lemongrass", pricePerKg: 24, supplier: "Gilmours" },
  { key: "galangal", name: "Galangal", pricePerKg: 22, supplier: "Gilmours" },
  { key: "turmeric_fresh", name: "Turmeric, fresh", pricePerKg: 20, supplier: "Gilmours" },
  { key: "lime_leaf", name: "Kaffir lime leaf", pricePerKg: 90, supplier: "Gilmours" },
  { key: "chilli_red", name: "Chilli, red fresh", pricePerKg: 14, supplier: "Gilmours" },
  { key: "carrot", name: "Carrot", pricePerKg: 2.5, supplier: "Gilmours" },
  { key: "daikon", name: "Daikon", pricePerKg: 4, supplier: "Gilmours" },
  { key: "cabbage_green", name: "Cabbage, green", pricePerKg: 3, supplier: "Gilmours" },
  { key: "wong_bok", name: "Wong bok (Chinese cabbage)", pricePerKg: 4, supplier: "Gilmours" },
  { key: "cucumber", name: "Cucumber", pricePerKg: 5, supplier: "Gilmours" },
  { key: "courgette", name: "Courgette", pricePerKg: 6, supplier: "Gilmours" },
  { key: "eggplant", name: "Eggplant", pricePerKg: 7, supplier: "Gilmours" },
  { key: "cos_lettuce", name: "Cos lettuce", pricePerKg: 7, supplier: "Gilmours" },
  { key: "watercress", name: "Watercress", pricePerKg: 20, supplier: "Gilmours" },
  { key: "mustard_greens", name: "Mustard greens", pricePerKg: 9, supplier: "Gilmours" },
  { key: "asian_greens", name: "Asian greens (bok choy mix)", pricePerKg: 7, supplier: "Gilmours" },
  { key: "enoki", name: "Enoki mushroom", pricePerKg: 25, supplier: "Gilmours" },
  { key: "shiitake", name: "Shiitake mushroom, fresh", pricePerKg: 35, supplier: "Gilmours" },
  { key: "wakame", name: "Wakame, dried", pricePerKg: 80, supplier: "Service Foods" },
  { key: "garlic_shoots", name: "Garlic shoots", pricePerKg: 18, supplier: "Gilmours" },
  { key: "water_chestnut", name: "Water chestnut, tinned", pricePerKg: 9, supplier: "Bidfood" },

  // Citrus / fruit
  { key: "lime", name: "Lime", pricePerKg: 9, supplier: "Gilmours" },
  { key: "lemon", name: "Lemon", pricePerKg: 7, supplier: "Gilmours" },
  { key: "pineapple", name: "Pineapple, fresh", pricePerKg: 5, supplier: "Gilmours" },

  // Herbs
  { key: "coriander", name: "Coriander, fresh", pricePerKg: 35, supplier: "Gilmours" },
  { key: "mint", name: "Mint, fresh", pricePerKg: 50, supplier: "Gilmours" },
  { key: "viet_mint", name: "Viet mint (rau ram)", pricePerKg: 80, supplier: "Gilmours" },
  { key: "thai_basil", name: "Thai basil", pricePerKg: 60, supplier: "Gilmours" },
  { key: "dill", name: "Dill, fresh", pricePerKg: 50, supplier: "Gilmours" },
  { key: "chives_chinese", name: "Chinese chives", pricePerKg: 40, supplier: "Gilmours" },

  // Pantry / sauces
  { key: "fish_sauce", name: "Fish sauce", pricePerKg: 7, supplier: "Bidfood" },
  { key: "soy_sauce", name: "Soy sauce", pricePerKg: 5, supplier: "Bidfood" },
  { key: "sweet_soy", name: "Sweet soy (kecap manis)", pricePerKg: 7, supplier: "Bidfood" },
  { key: "hoisin", name: "Hoisin sauce", pricePerKg: 9, supplier: "Bidfood" },
  { key: "doubanjiang", name: "Doubanjiang", pricePerKg: 14, supplier: "Bidfood" },
  { key: "sichuan_oil", name: "Sichuan chilli oil", pricePerKg: 18, supplier: "Bidfood" },
  { key: "xo_sauce", name: "XO sauce", pricePerKg: 35, supplier: "Bidfood" },
  { key: "vinegar_black", name: "Black vinegar (Chinkiang)", pricePerKg: 11, supplier: "Bidfood" },
  { key: "vinegar_rice", name: "Rice vinegar", pricePerKg: 6, supplier: "Bidfood" },
  { key: "oil_sesame", name: "Sesame oil", pricePerKg: 14, supplier: "Bidfood" },
  { key: "oil_veg", name: "Vegetable oil", pricePerKg: 4, supplier: "Bidfood" },
  { key: "coconut_cream", name: "Coconut cream", pricePerKg: 6, supplier: "Bidfood" },
  { key: "coconut_milk", name: "Coconut milk", pricePerKg: 5, supplier: "Bidfood" },
  { key: "palm_sugar", name: "Palm sugar", pricePerKg: 11, supplier: "Bidfood" },
  { key: "peanuts", name: "Peanuts, raw unsalted", pricePerKg: 11, supplier: "Bidfood" },
  { key: "sesame_white", name: "Sesame seeds, white", pricePerKg: 14, supplier: "Bidfood" },
  { key: "sesame_black", name: "Sesame seeds, black", pricePerKg: 18, supplier: "Bidfood" },
  { key: "salt_sea", name: "Salt, sea", pricePerKg: 2.4, supplier: "Service Foods" },
  { key: "sichuan_pepper", name: "Sichuan peppercorns", pricePerKg: 95, supplier: "Bidfood" },
  { key: "cumin_ground", name: "Cumin, ground", pricePerKg: 38, supplier: "Bidfood" },
  { key: "fennel_seed", name: "Fennel seed", pricePerKg: 32, supplier: "Bidfood" },
  { key: "black_beans_fermented", name: "Fermented black beans", pricePerKg: 14, supplier: "Bidfood" },
  { key: "preserved_mustard", name: "Preserved mustard greens (suan cai)", pricePerKg: 12, supplier: "Bidfood" },
];

// ============================================================================
// CAFE HANOI — Vietnamese, Britomart
// ============================================================================
const CAFE_HANOI_RECIPES: SeedRecipe[] = [
  {
    venue: "cafe-hanoi",
    name: "Crispy tofu rice paper rolls (2 pce)",
    salePriceIncGst: 18,
    items: [
      { ingredientKey: "rice_paper", quantity: 30, unit: "g" },
      { ingredientKey: "tofu_firm", quantity: 80, unit: "g" },
      { ingredientKey: "noodles_pho", quantity: 30, unit: "g" },
      { ingredientKey: "carrot", quantity: 30, unit: "g", yieldPct: 80 },
      { ingredientKey: "cucumber", quantity: 30, unit: "g", yieldPct: 95 },
      { ingredientKey: "viet_mint", quantity: 5, unit: "g", yieldPct: 70 },
      { ingredientKey: "peanuts", quantity: 8, unit: "g" },
      { ingredientKey: "fish_sauce", quantity: 15, unit: "ml" },
      { ingredientKey: "lime", quantity: 8, unit: "g" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Roast duck rice paper rolls (2 pce)",
    salePriceIncGst: 25,
    items: [
      { ingredientKey: "rice_paper", quantity: 30, unit: "g" },
      { ingredientKey: "duck_crown", quantity: 80, unit: "g", yieldPct: 70 },
      { ingredientKey: "pineapple", quantity: 30, unit: "g", yieldPct: 60 },
      { ingredientKey: "cucumber", quantity: 25, unit: "g", yieldPct: 95 },
      { ingredientKey: "hoisin", quantity: 15, unit: "g" },
      { ingredientKey: "chilli_red", quantity: 3, unit: "g" },
      { ingredientKey: "viet_mint", quantity: 4, unit: "g", yieldPct: 70 },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Dry Phở gà — turmeric chicken",
    salePriceIncGst: 30,
    items: [
      { ingredientKey: "noodles_pho", quantity: 120, unit: "g" },
      { ingredientKey: "chicken_thigh", quantity: 130, unit: "g", yieldPct: 95 },
      { ingredientKey: "turmeric_fresh", quantity: 5, unit: "g", yieldPct: 90 },
      { ingredientKey: "lemongrass", quantity: 6, unit: "g" },
      { ingredientKey: "asian_greens", quantity: 60, unit: "g", yieldPct: 90 },
      { ingredientKey: "viet_mint", quantity: 5, unit: "g", yieldPct: 70 },
      { ingredientKey: "lime", quantity: 12, unit: "g" },
      { ingredientKey: "fish_sauce", quantity: 12, unit: "ml" },
      { ingredientKey: "chilli_red", quantity: 4, unit: "g" },
      { ingredientKey: "oil_veg", quantity: 12, unit: "ml" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Tiger prawn cutlets, young green rice",
    salePriceIncGst: 30,
    items: [
      { ingredientKey: "tiger_prawns", quantity: 110, unit: "g", yieldPct: 60 },
      { ingredientKey: "rice_powder", quantity: 12, unit: "g" },
      { ingredientKey: "chilli_red", quantity: 6, unit: "g" },
      { ingredientKey: "garlic", quantity: 4, unit: "g", yieldPct: 90 },
      { ingredientKey: "lime", quantity: 10, unit: "g" },
      { ingredientKey: "oil_veg", quantity: 18, unit: "ml" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Honey glazed pork skewers (2 pce)",
    salePriceIncGst: 18,
    items: [
      { ingredientKey: "pork_shoulder", quantity: 130, unit: "g", yieldPct: 95 },
      { ingredientKey: "cos_lettuce", quantity: 30, unit: "g", yieldPct: 80 },
      { ingredientKey: "carrot", quantity: 20, unit: "g", yieldPct: 80 },
      { ingredientKey: "daikon", quantity: 20, unit: "g", yieldPct: 90 },
      { ingredientKey: "fish_sauce", quantity: 12, unit: "ml" },
      { ingredientKey: "palm_sugar", quantity: 8, unit: "g" },
      { ingredientKey: "lime", quantity: 8, unit: "g" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Banh Xeo taco — lemongrass pork (2 pce)",
    salePriceIncGst: 21,
    items: [
      { ingredientKey: "pork_shoulder", quantity: 90, unit: "g", yieldPct: 95 },
      { ingredientKey: "lemongrass", quantity: 6, unit: "g" },
      { ingredientKey: "palm_sugar", quantity: 10, unit: "g" },
      { ingredientKey: "flour_bread", quantity: 50, unit: "g" },
      { ingredientKey: "egg", quantity: 1, unit: "ea" },
      { ingredientKey: "coconut_milk", quantity: 30, unit: "ml" },
      { ingredientKey: "viet_mint", quantity: 5, unit: "g", yieldPct: 70 },
      { ingredientKey: "fish_sauce", quantity: 12, unit: "ml" },
      { ingredientKey: "chilli_red", quantity: 4, unit: "g" },
      { ingredientKey: "lime", quantity: 8, unit: "g" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Chargrilled lime leaf chicken thighs",
    salePriceIncGst: 41,
    items: [
      { ingredientKey: "chicken_thigh", quantity: 220, unit: "g", yieldPct: 95 },
      { ingredientKey: "lime_leaf", quantity: 2, unit: "g" },
      { ingredientKey: "lemongrass", quantity: 8, unit: "g" },
      { ingredientKey: "cos_lettuce", quantity: 80, unit: "g", yieldPct: 80 },
      { ingredientKey: "courgette", quantity: 60, unit: "g", yieldPct: 90 },
      { ingredientKey: "peanuts", quantity: 10, unit: "g" },
      { ingredientKey: "coriander", quantity: 8, unit: "g", yieldPct: 75 },
      { ingredientKey: "oil_veg", quantity: 20, unit: "ml" },
      { ingredientKey: "fish_sauce", quantity: 10, unit: "ml" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Angus eye fillet 'Shaking Beef'",
    salePriceIncGst: 46,
    items: [
      { ingredientKey: "beef_eye_fillet", quantity: 180, unit: "g", yieldPct: 96 },
      { ingredientKey: "watercress", quantity: 50, unit: "g", yieldPct: 80 },
      { ingredientKey: "onion_red", quantity: 30, unit: "g", yieldPct: 90 },
      { ingredientKey: "soy_sauce", quantity: 15, unit: "ml" },
      { ingredientKey: "garlic", quantity: 6, unit: "g", yieldPct: 90 },
      { ingredientKey: "oil_veg", quantity: 18, unit: "ml" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Lemongrass pork belly, coconut caramel",
    salePriceIncGst: 40,
    items: [
      { ingredientKey: "pork_belly", quantity: 220, unit: "g", yieldPct: 92 },
      { ingredientKey: "lemongrass", quantity: 10, unit: "g" },
      { ingredientKey: "coconut_milk", quantity: 60, unit: "ml" },
      { ingredientKey: "palm_sugar", quantity: 18, unit: "g" },
      { ingredientKey: "mustard_greens", quantity: 80, unit: "g", yieldPct: 85 },
      { ingredientKey: "ginger", quantity: 8, unit: "g", yieldPct: 90 },
      { ingredientKey: "coriander", quantity: 6, unit: "g", yieldPct: 75 },
      { ingredientKey: "fish_sauce", quantity: 10, unit: "ml" },
    ],
  },
  {
    venue: "cafe-hanoi",
    name: "Turmeric galangal tofu, rice noodles",
    salePriceIncGst: 29,
    items: [
      { ingredientKey: "tofu_firm", quantity: 180, unit: "g" },
      { ingredientKey: "noodles_pho", quantity: 120, unit: "g" },
      { ingredientKey: "turmeric_fresh", quantity: 6, unit: "g", yieldPct: 90 },
      { ingredientKey: "galangal", quantity: 5, unit: "g", yieldPct: 90 },
      { ingredientKey: "asian_greens", quantity: 60, unit: "g", yieldPct: 90 },
      { ingredientKey: "spring_onion", quantity: 12, unit: "g", yieldPct: 90 },
      { ingredientKey: "dill", quantity: 4, unit: "g", yieldPct: 75 },
      { ingredientKey: "fish_sauce", quantity: 12, unit: "ml" },
      { ingredientKey: "oil_veg", quantity: 18, unit: "ml" },
    ],
  },
];

// ============================================================================
// GHOST STREET — Sichuan / Xi'an, basement of Cafe Hanoi
// ============================================================================
const GHOST_STREET_RECIPES: SeedRecipe[] = [
  {
    venue: "ghost-street",
    name: "Shiitake & vegetable dumplings (6 pce)",
    salePriceIncGst: 21,
    items: [
      { ingredientKey: "wonton_skins", quantity: 60, unit: "g" },
      { ingredientKey: "shiitake", quantity: 70, unit: "g" },
      { ingredientKey: "wakame", quantity: 5, unit: "g" },
      { ingredientKey: "wong_bok", quantity: 50, unit: "g", yieldPct: 90 },
      { ingredientKey: "ginger", quantity: 6, unit: "g", yieldPct: 90 },
      { ingredientKey: "shallot", quantity: 15, unit: "g", yieldPct: 90 },
      { ingredientKey: "soy_sauce", quantity: 12, unit: "ml" },
      { ingredientKey: "sichuan_oil", quantity: 12, unit: "ml" },
    ],
  },
  {
    venue: "ghost-street",
    name: "Cucumber salad, whipped tofu, hot & sour",
    salePriceIncGst: 17,
    items: [
      { ingredientKey: "cucumber", quantity: 180, unit: "g", yieldPct: 95 },
      { ingredientKey: "tofu_silken", quantity: 100, unit: "g" },
      { ingredientKey: "vinegar_black", quantity: 18, unit: "ml" },
      { ingredientKey: "sesame_white", quantity: 6, unit: "g" },
      { ingredientKey: "oil_sesame", quantity: 8, unit: "ml" },
      { ingredientKey: "garlic", quantity: 4, unit: "g", yieldPct: 90 },
      { ingredientKey: "chilli_red", quantity: 3, unit: "g" },
    ],
  },
  {
    venue: "ghost-street",
    name: "Hokkaido scallop wonton (4 pce)",
    salePriceIncGst: 34,
    items: [
      { ingredientKey: "scallops", quantity: 100, unit: "g" },
      { ingredientKey: "wonton_skins", quantity: 40, unit: "g" },
      { ingredientKey: "ginger", quantity: 5, unit: "g", yieldPct: 90 },
      { ingredientKey: "vinegar_black", quantity: 10, unit: "ml" },
      { ingredientKey: "sichuan_oil", quantity: 10, unit: "ml" },
      { ingredientKey: "spring_onion", quantity: 10, unit: "g", yieldPct: 90 },
    ],
  },
  {
    venue: "ghost-street",
    name: "Tea smoked duck breast, bao (4 pce)",
    salePriceIncGst: 39,
    items: [
      { ingredientKey: "duck_breast", quantity: 140, unit: "g", yieldPct: 92 },
      { ingredientKey: "bao_steamed", quantity: 80, unit: "g" },
      { ingredientKey: "hoisin", quantity: 18, unit: "g" },
      { ingredientKey: "cucumber", quantity: 30, unit: "g", yieldPct: 95 },
      { ingredientKey: "spring_onion", quantity: 8, unit: "g", yieldPct: 90 },
    ],
  },
  {
    venue: "ghost-street",
    name: "Dan Dan noodles, beef & pork mince",
    salePriceIncGst: 24,
    items: [
      { ingredientKey: "noodles_egg", quantity: 140, unit: "g" },
      { ingredientKey: "beef_mince", quantity: 50, unit: "g" },
      { ingredientKey: "pork_mince", quantity: 50, unit: "g" },
      { ingredientKey: "sichuan_oil", quantity: 15, unit: "ml" },
      { ingredientKey: "sichuan_pepper", quantity: 1.5, unit: "g" },
      { ingredientKey: "preserved_mustard", quantity: 15, unit: "g" },
      { ingredientKey: "peanuts", quantity: 10, unit: "g" },
      { ingredientKey: "soy_sauce", quantity: 12, unit: "ml" },
      { ingredientKey: "spring_onion", quantity: 10, unit: "g", yieldPct: 90 },
    ],
  },
  {
    venue: "ghost-street",
    name: "Cumin beef Biang Biang noodles",
    salePriceIncGst: 31,
    items: [
      { ingredientKey: "flour_bread", quantity: 130, unit: "g" },
      { ingredientKey: "beef_sirloin", quantity: 130, unit: "g", yieldPct: 95 },
      { ingredientKey: "onion_red", quantity: 50, unit: "g", yieldPct: 90 },
      { ingredientKey: "cumin_ground", quantity: 4, unit: "g" },
      { ingredientKey: "sichuan_oil", quantity: 14, unit: "ml" },
      { ingredientKey: "coriander", quantity: 6, unit: "g", yieldPct: 75 },
      { ingredientKey: "oil_veg", quantity: 12, unit: "ml" },
    ],
  },
  {
    venue: "ghost-street",
    name: "KK's special fried rice, tiger prawn",
    salePriceIncGst: 32,
    items: [
      { ingredientKey: "rice_jasmine", quantity: 180, unit: "g" },
      { ingredientKey: "tiger_prawns", quantity: 80, unit: "g", yieldPct: 65 },
      { ingredientKey: "egg", quantity: 1, unit: "ea" },
      { ingredientKey: "xo_sauce", quantity: 12, unit: "g" },
      { ingredientKey: "spring_onion", quantity: 10, unit: "g", yieldPct: 90 },
      { ingredientKey: "garlic", quantity: 5, unit: "g", yieldPct: 90 },
      { ingredientKey: "oil_veg", quantity: 18, unit: "ml" },
      { ingredientKey: "soy_sauce", quantity: 10, unit: "ml" },
    ],
  },
  {
    venue: "ghost-street",
    name: "Twice-cooked Sichuan pork belly",
    salePriceIncGst: 38,
    items: [
      { ingredientKey: "pork_belly", quantity: 200, unit: "g", yieldPct: 92 },
      { ingredientKey: "preserved_mustard", quantity: 30, unit: "g" },
      { ingredientKey: "doubanjiang", quantity: 15, unit: "g" },
      { ingredientKey: "leek", quantity: 40, unit: "g", yieldPct: 80 },
      { ingredientKey: "garlic", quantity: 8, unit: "g", yieldPct: 90 },
      { ingredientKey: "ginger", quantity: 6, unit: "g", yieldPct: 90 },
      { ingredientKey: "oil_veg", quantity: 18, unit: "ml" },
    ],
  },
  {
    venue: "ghost-street",
    name: "Sizzling Xinjiang lamb ribs",
    salePriceIncGst: 39,
    items: [
      { ingredientKey: "lamb_ribs", quantity: 220, unit: "g", yieldPct: 75 },
      { ingredientKey: "watercress", quantity: 40, unit: "g", yieldPct: 80 },
      { ingredientKey: "onion_red", quantity: 35, unit: "g", yieldPct: 90 },
      { ingredientKey: "cumin_ground", quantity: 5, unit: "g" },
      { ingredientKey: "fennel_seed", quantity: 2, unit: "g" },
      { ingredientKey: "sichuan_oil", quantity: 10, unit: "ml" },
    ],
  },
  {
    venue: "ghost-street",
    name: "Hunan steamed silken tofu, salted chillies",
    salePriceIncGst: 26,
    items: [
      { ingredientKey: "tofu_silken", quantity: 220, unit: "g" },
      { ingredientKey: "chilli_red", quantity: 12, unit: "g" },
      { ingredientKey: "black_beans_fermented", quantity: 12, unit: "g" },
      { ingredientKey: "ginger", quantity: 8, unit: "g", yieldPct: 90 },
      { ingredientKey: "coriander", quantity: 6, unit: "g", yieldPct: 75 },
      { ingredientKey: "oil_veg", quantity: 12, unit: "ml" },
      { ingredientKey: "soy_sauce", quantity: 10, unit: "ml" },
    ],
  },
];

export const SEED_RECIPES: SeedRecipe[] = [...CAFE_HANOI_RECIPES, ...GHOST_STREET_RECIPES];
