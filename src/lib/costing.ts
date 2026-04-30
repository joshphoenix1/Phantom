import type { CostingResult, Ingredient, RecipeItem, Unit } from "./types";

const NZ_GST = 0.15;

const GRAMS_PER_UNIT: Record<Exclude<Unit, "ea">, number> = {
  kg: 1000,
  g: 1,
  L: 1000,
  ml: 1,
};

function toKilograms(quantity: number, unit: Unit, fallbackEachWeightG = 100): number {
  if (unit === "ea") return (quantity * fallbackEachWeightG) / 1000;
  return (quantity * GRAMS_PER_UNIT[unit]) / 1000;
}

export function costRecipe(
  items: RecipeItem[],
  ingredients: Map<string, Ingredient>,
  targetMarginPct: number,
  salePriceIncGst: number | null = null,
): CostingResult {
  const breakdown: CostingResult["breakdown"] = [];
  let plateCost = 0;

  for (const item of items) {
    const ing = ingredients.get(item.ingredientId);
    if (!ing) continue;

    const usableYield = item.yieldPct > 0 ? item.yieldPct / 100 : 1;
    const grossKg = toKilograms(item.quantity, item.unit);
    const effectiveKg = grossKg / usableYield;
    const cost = effectiveKg * ing.pricePerKg;

    plateCost += cost;
    breakdown.push({
      name: ing.name,
      quantity: item.quantity,
      unit: item.unit,
      quantityKg: Number(effectiveKg.toFixed(4)),
      pricePerKg: ing.pricePerKg,
      cost: Number(cost.toFixed(2)),
    });
  }

  const margin = Math.min(Math.max(targetMarginPct, 0), 99) / 100;
  // Floor on ex-GST revenue: cost = revenue × (1 - margin) → revenue = cost / (1 - margin)
  // Convert that revenue to the menu price (inc-GST), then ceil to a whole dollar.
  const floorRevenueExGst = margin >= 1 ? plateCost : plateCost / (1 - margin);
  const floorPriceIncGst = Math.ceil(floorRevenueExGst * (1 + NZ_GST));

  // Maximise-margin rule: never recommend a cut. Hold at current price if it
  // already clears the target, otherwise raise to the inc-GST floor.
  let suggestedPriceIncGst: number;
  let suggestionAction: "hold" | "raise" | "set";
  if (salePriceIncGst == null) {
    suggestedPriceIncGst = floorPriceIncGst;
    suggestionAction = "set";
  } else if (salePriceIncGst >= floorPriceIncGst) {
    suggestedPriceIncGst = salePriceIncGst;
    suggestionAction = "hold";
  } else {
    suggestedPriceIncGst = floorPriceIncGst;
    suggestionAction = "raise";
  }

  // Margin is computed on the merchant's actual revenue (ex-GST).
  const saleRevenueExGst = salePriceIncGst != null ? salePriceIncGst / (1 + NZ_GST) : null;
  const achievedSaleMarginPct =
    saleRevenueExGst != null && saleRevenueExGst > 0
      ? ((saleRevenueExGst - plateCost) / saleRevenueExGst) * 100
      : null;

  return {
    plateCost: Number(plateCost.toFixed(2)),
    floorPriceIncGst,
    suggestedPriceIncGst,
    suggestionAction,
    targetMarginPct,
    achievedSaleMarginPct: achievedSaleMarginPct != null ? Number(achievedSaleMarginPct.toFixed(1)) : null,
    salePriceIncGst,
    breakdown,
  };
}
