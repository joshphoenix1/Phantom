import { costRecipe } from "@/lib/costing";
import { nzd, pct } from "@/lib/format";
import { VENUE_LABELS, type Venue } from "@/lib/types";
import { getIngredientMap, listIngredients, listRecipes } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [recipes, ingredients, ingMap] = await Promise.all([
    listRecipes(),
    listIngredients(),
    getIngredientMap(),
  ]);

  const costed = recipes.map((r) => ({
    recipe: r,
    result: costRecipe(r.items, ingMap, r.targetMarginPct, r.salePriceIncGst),
  }));

  const totalRecipes = recipes.length;
  const totalIngredients = ingredients.length;

  const withSalePrice = costed.filter((c) => c.result.achievedSaleMarginPct != null);
  const avgAchievedMargin =
    withSalePrice.reduce((sum, c) => sum + (c.result.achievedSaleMarginPct ?? 0), 0) /
    Math.max(withSalePrice.length, 1);

  const underTarget = costed.filter((c) => c.result.suggestionAction === "raise");
  const overTarget = costed.filter(
    (c) =>
      c.result.achievedSaleMarginPct != null &&
      c.result.achievedSaleMarginPct > c.recipe.targetMarginPct + 5,
  );

  const byVenue = new Map<Venue, typeof costed>();
  for (const c of costed) {
    const v = c.recipe.venue;
    const arr = byVenue.get(v) ?? [];
    arr.push(c);
    byVenue.set(v, arr);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">Plate-cost overview across both venues</p>
      </header>

      <section className="grid grid-cols-4 gap-4">
        <Stat label="Recipes" value={totalRecipes.toString()} />
        <Stat label="Ingredients" value={totalIngredients.toString()} />
        <Stat label="Avg achieved margin" value={pct(avgAchievedMargin)} />
        <Stat
          label="Needs raise / over target"
          value={`${underTarget.length} ↑ / ${overTarget.length} ✓+`}
        />
      </section>

      {Array.from(byVenue.entries())
        .sort((a, b) => (a[0] ?? "").localeCompare(b[0] ?? ""))
        .map(([venue, items]) => (
          <VenueSection key={venue ?? "none"} venue={venue} items={items} />
        ))}
    </div>
  );
}

function VenueSection({
  venue,
  items,
}: {
  venue: Venue;
  items: Array<{
    recipe: Awaited<ReturnType<typeof listRecipes>>[number];
    result: ReturnType<typeof costRecipe>;
  }>;
}) {
  const label = venue ? VENUE_LABELS[venue] : "Unassigned";
  return (
    <section>
      <h2 className="text-sm uppercase tracking-wider text-muted mb-3">{label}</h2>
      <div className="rounded-lg border border-border bg-panel">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Dish</th>
              <th className="px-4 py-3 font-medium text-right">Plate cost</th>
              <th className="px-4 py-3 font-medium text-right">Menu price</th>
              <th className="px-4 py-3 font-medium text-right">Achieved</th>
              <th className="px-4 py-3 font-medium text-right">Target</th>
              <th className="px-4 py-3 font-medium text-right">Floor</th>
              <th className="px-4 py-3 font-medium text-right">Suggested</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ recipe, result }) => (
              <tr key={recipe.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">{recipe.name}</td>
                <td className="px-4 py-3 text-right font-mono">{nzd(result.plateCost)}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {result.salePriceIncGst != null ? nzd(result.salePriceIncGst) : <span className="text-muted">—</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  <MarginBadge value={result.achievedSaleMarginPct} target={recipe.targetMarginPct} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted">{pct(recipe.targetMarginPct, 0)}</td>
                <td className="px-4 py-3 text-right font-mono text-muted">{nzd(result.floorPriceIncGst)}</td>
                <td className="px-4 py-3 text-right">
                  <SuggestionCell result={result} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold font-mono">{value}</div>
    </div>
  );
}

function MarginBadge({ value, target }: { value: number | null; target: number }) {
  if (value == null) return <span className="text-muted">—</span>;
  const delta = value - target;
  const tone = delta >= -2 ? "text-accent" : delta >= -5 ? "text-warn" : "text-bad";
  return <span className={tone}>{value.toFixed(1)}%</span>;
}

function SuggestionCell({ result }: { result: ReturnType<typeof costRecipe> }) {
  const value = nzd(result.suggestedPriceIncGst);
  if (result.suggestionAction === "hold") {
    return (
      <div>
        <div className="font-mono text-muted">{value}</div>
        <div className="text-xs text-muted">hold</div>
      </div>
    );
  }
  if (result.suggestionAction === "raise") {
    const delta = result.salePriceIncGst != null ? result.suggestedPriceIncGst - result.salePriceIncGst : 0;
    return (
      <div>
        <div className="font-mono text-bad">{value}</div>
        <div className="text-xs text-bad">raise +{nzd(delta)}</div>
      </div>
    );
  }
  return (
    <div>
      <div className="font-mono text-accent">{value}</div>
      <div className="text-xs text-muted">set</div>
    </div>
  );
}
