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
    <div className="flex flex-col gap-12">
      <header className="flex items-end justify-between border-b border-ink-600/60 pb-7">
        <div>
          <div className="eyebrow mb-3">Pantry</div>
          <h1 className="font-display text-7xl font-light tracking-tight text-cream-50">
            <span className="display-italic text-vermillion">Ingredients</span>
          </h1>
          <p className="mt-4 font-display italic text-cream-400 text-xl">
            Master price list, kg-normalised · click a price to edit · per-dish breakdown below
          </p>
        </div>
        <Link
          href="/ingredients/import"
          className="px-6 py-3 text-base rounded-sm bg-vermillion text-cream-50 font-mono uppercase tracking-eyebrow hover:bg-vermillion-light transition-colors shadow-seal"
        >
          + Invoice
        </Link>
      </header>

      <AddIngredientForm />

      <section>
        <div className="section-eyebrow">Master list</div>
        <div className="surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-600/60 bg-ink-900/40 text-left">
                <Th>Ingredient</Th>
                <Th>Supplier</Th>
                <Th align="right">Price / kg</Th>
                <Th align="right">Used in</Th>
                <Th align="right">Updated</Th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing, idx) => {
                const usageCount = recipes.filter((r) =>
                  r.items.some((i) => i.ingredientId === ing.id),
                ).length;
                return (
                  <tr
                    key={ing.id}
                    className={`border-b border-ink-600/40 last:border-0 hover:bg-ink-800/40 transition-colors ${idx % 2 === 1 ? "bg-ink-900/30" : ""}`}
                  >
                    <td className="px-6 py-3.5 font-display text-lg text-cream-100">{ing.name}</td>
                    <td className="px-6 py-3.5 text-cream-500 text-base">{ing.supplier ?? "—"}</td>
                    <td className="px-6 py-3.5 text-right text-base">
                      <EditableIngredientPrice id={ing.id} initial={ing.pricePerKg} />
                    </td>
                    <td className="px-6 py-3.5 text-right text-base text-cream-500">
                      {usageCount === 0 ? <span className="opacity-60">unused</span> : `${usageCount}`}
                    </td>
                    <td className="px-6 py-3.5 text-right text-base text-cream-500 font-mono">{ing.lastUpdated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-eyebrow">By dish</div>
        <div className="flex flex-col gap-10">
          {Array.from(groupedRecipes.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([venueKey, venueRecipes]) => (
              <div key={venueKey}>
                <h3 className="font-display text-2xl text-cream-100 mb-5">
                  {venueKey === "unassigned"
                    ? "Unassigned"
                    : VENUE_LABELS[venueKey as keyof typeof VENUE_LABELS]}
                </h3>
                <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                  {venueRecipes.map((r) => {
                    const result = costRecipe(r.items, ingMap, r.targetMarginPct, r.salePriceIncGst);
                    return (
                      <details key={r.id} className="surface group">
                        <summary className="px-6 py-4 cursor-pointer flex items-center justify-between gap-4 list-none hover:bg-ink-800/40 transition-colors">
                          <span className="font-display text-lg text-cream-100 group-open:text-cream-50">
                            {r.name}
                          </span>
                          <span className="text-base text-cream-400 shrink-0 flex items-center gap-3">
                            <span className="eyebrow">{r.items.length} ing</span>
                            <span className="font-mono text-cream-100">{nzd(result.plateCost)}</span>
                          </span>
                        </summary>
                        <div className="border-t border-ink-600/60">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-ink-600/40 text-left">
                                <Th small>Ingredient</Th>
                                <Th small align="right">Qty</Th>
                                <Th small align="right">$ / kg</Th>
                                <Th small align="right">Cost</Th>
                                <Th small align="right">% plate</Th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.breakdown.map((b, i) => {
                                const pctOfPlate = result.plateCost > 0 ? (b.cost / result.plateCost) * 100 : 0;
                                return (
                                  <tr key={i} className="border-b border-ink-600/30 last:border-0">
                                    <td className="px-6 py-2.5 text-cream-200 text-base">{b.name}</td>
                                    <td className="px-6 py-2.5 text-right font-mono text-base text-cream-300">
                                      {b.quantity}
                                      {b.unit}
                                    </td>
                                    <td className="px-6 py-2.5 text-right font-mono text-base text-cream-500">
                                      {nzd(b.pricePerKg)}
                                    </td>
                                    <td className="px-6 py-2.5 text-right font-mono text-base text-cream-100">
                                      {nzd(b.cost)}
                                    </td>
                                    <td className="px-6 py-2.5 text-right font-mono text-base text-cream-500">
                                      {pctOfPlate.toFixed(0)}%
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-ink-900/40 border-t border-ink-600/60">
                                <td className="px-6 py-2.5 eyebrow" colSpan={3}>Plate cost</td>
                                <td className="px-6 py-2.5 text-right font-mono text-base font-semibold text-cream-50">
                                  {nzd(result.plateCost)}
                                </td>
                                <td className="px-6 py-2.5"></td>
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

function Th({
  children,
  align = "left",
  small = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  small?: boolean;
}) {
  return (
    <th className={`${small ? "px-6 py-2.5" : "px-6 py-3.5"} eyebrow font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
