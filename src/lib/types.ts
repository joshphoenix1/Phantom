export type Unit = "kg" | "g" | "L" | "ml" | "ea";

export type Venue = "cafe-hanoi" | "ghost-street" | null;

export type Ingredient = {
  id: string;
  organizationId: string;
  name: string;
  pricePerKg: number;
  supplier?: string;
  lastUpdated: string;
};

export type RecipeItem = {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: Unit;
  yieldPct: number;
};

export type Recipe = {
  id: string;
  organizationId: string;
  venue: Venue;
  name: string;
  targetMarginPct: number;
  /** Menu price (GST-inclusive, as printed on the menu — NZ Fair Trading Act). */
  salePriceIncGst: number | null;
  items: RecipeItem[];
  notes?: string;
  updatedAt: string;
};

export type CostingResult = {
  /** Wholesale ingredient cost per plate, ex-GST. */
  plateCost: number;
  /** Inc-GST whole-dollar floor — the menu price needed to hit target margin. Rounded UP. */
  floorPriceIncGst: number;
  /** Recommended menu price (inc-GST, whole dollar). Never below the current menu price ("maximise margins" rule): hold if already at/above target, raise to floor otherwise. */
  suggestedPriceIncGst: number;
  /** "hold" when current menu price already meets target; "raise" when costs have outrun the price; "set" when no menu price is recorded yet. */
  suggestionAction: "hold" | "raise" | "set";
  targetMarginPct: number;
  /** Margin computed on ex-GST revenue (sale / 1.15) — i.e., the merchant's actual margin after remitting GST. */
  achievedSaleMarginPct: number | null;
  salePriceIncGst: number | null;
  breakdown: Array<{
    name: string;
    quantity: number;
    unit: Unit;
    quantityKg: number;
    pricePerKg: number;
    cost: number;
  }>;
};

export type Organization = {
  id: string;
  name: string;
  defaultMarginPct: number;
};

export const VENUE_LABELS: Record<NonNullable<Venue>, string> = {
  "cafe-hanoi": "Cafe Hanoi",
  "ghost-street": "Ghost Street",
};
