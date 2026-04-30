import Link from "next/link";
import { costRecipe } from "@/lib/costing";
import { nzd } from "@/lib/format";
import { VENUE_LABELS } from "@/lib/types";
import { getIngredientMap, listIngredients, listRecipes } from "@/db/queries";
import { AddIngredientForm, EditableIngredientPrice } from "@/components/ingredient-form";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const [ingredients, recipes, ingMap] = await Promise.all([
    listIngredients(),
    listRecipes(),
    getIngredientMap(),
  ]);

  const groupedRecipes = new Map<string, typeof recipes>();
  for (const r of recipes) {
    const key = r.venue ?? "unassigned";
    const arr = groupedRecipes.get(key) ?? [];
    arr.push(r);
    groupedRecipes.set(key, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ingredients</h1>
          <p className="text-sm text-muted">
            Master price list, kg-normalised. Click a price to edit. Per-dish breakdown below.
          </p>
        </div>
        <Link
          href="/ingredients/import"
          className="px-3 py-2 text-sm rounded bg-accent text-bg font-medium hover:bg-accent/90"
        >
          + Import supplier invoice
        </Link>
      </header>

      <AddIngredientForm />

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted mb-3">Master list</h2>
        <div className="rounded-lg border border-border bg-panel">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr className="border-b border-border">
                <th className="px-4 py-3 font-medium">Ingredient</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium text-right">Price / kg</th>
                <th className="px-4 py-3 font-medium text-right">Used in</th>
                <th className="px-4 py-3 font-medium text-right">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => {
                const usageCount = recipes.filter((r) =>
                  r.items.some((i) => i.ingredientId === ing.id),
                ).length;
                return (
                  <tr key={ing.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">{ing.name}</td>
                    <td className="px-4 py-3 text-muted">{ing.supplier ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <EditableIngredientPrice id={ing.id} initial={ing.pricePerKg} />
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {usageCount === 0 ? <span className="text-muted/60">unused</span> : `${usageCount} dish${usageCount === 1 ? "" : "es"}`}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{ing.lastUpdated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-muted mb-3">By dish</h2>
        <div className="flex flex-col gap-4">
          {Array.from(groupedRecipes.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([venueKey, venueRecipes]) => (
              <div key={venueKey}>
                <div className="text-xs uppercase tracking-wider text-muted mb-2">
                  {venueKey === "unassigned"
                    ? "Unassigned"
                    : VENUE_LABELS[venueKey as keyof typeof VENUE_LABELS]}
                </div>
                <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                  {venueRecipes.map((r) => {
                    const result = costRecipe(r.items, ingMap, r.targetMarginPct, r.salePriceIncGst);
                    return (
                      <details
                        key={r.id}
                        className="rounded-lg border border-border bg-panel group"
                        open={false}
                      >
                        <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3 list-none">
                          <span className="font-medium truncate">{r.name}</span>
                          <span className="text-sm text-muted shrink-0">
                            {r.items.length} ingredients · plate{" "}
                            <span className="font-mono text-text">{nzd(result.plateCost)}</span>
                          </span>
                        </summary>
                        <div className="border-t border-border">
                          <table className="w-full text-sm">
                            <thead className="text-left text-muted">
                              <tr className="border-b border-border">
                                <th className="px-4 py-2 font-medium">Ingredient</th>
                                <th className="px-4 py-2 font-medium text-right">Qty</th>
                                <th className="px-4 py-2 font-medium text-right">$ / kg</th>
                                <th className="px-4 py-2 font-medium text-right">Line cost</th>
                                <th className="px-4 py-2 font-medium text-right">% of plate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.breakdown.map((b, i) => {
                                const pctOfPlate = result.plateCost > 0 ? (b.cost / result.plateCost) * 100 : 0;
                                return (
                                  <tr key={i} className="border-b border-border/40 last:border-0">
                                    <td className="px-4 py-2">{b.name}</td>
                                    <td className="px-4 py-2 text-right font-mono">
                                      {b.quantity}
                                      {b.unit}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-muted">
                                      {nzd(b.pricePerKg)}
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono">{nzd(b.cost)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-muted">
                                      {pctOfPlate.toFixed(0)}%
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="border-t-2 border-border bg-bg/40">
                                <td className="px-4 py-2 font-medium" colSpan={3}>
                                  Plate cost
                                </td>
                                <td className="px-4 py-2 text-right font-mono font-medium">
                                  {nzd(result.plateCost)}
                                </td>
                                <td className="px-4 py-2"></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
