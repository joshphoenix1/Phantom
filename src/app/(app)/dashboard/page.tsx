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
    <div className="flex flex-col gap-14">
      <header className="border-b border-ink-600/60 pb-7">
        <div className="eyebrow mb-3">Service</div>
        <h1 className="font-display text-7xl font-light tracking-tight text-cream-50">
          Tonight&rsquo;s <span className="display-italic text-vermillion">numbers</span>
        </h1>
        <p className="mt-4 font-display italic text-cream-400 text-xl">
          Plate cost across both kitchens · {new Date().toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </header>

      <section className="grid grid-cols-4 gap-5">
        <Stat label="Recipes" value={totalRecipes.toString()} />
        <Stat label="Ingredients" value={totalIngredients.toString()} />
        <Stat label="Avg margin" value={pct(avgAchievedMargin)} accent />
        <Stat
          label="Movement"
          value={`${underTarget.length} ↑`}
          subtitle={`${overTarget.length} above target`}
        />
      </section>

      <div className="flex flex-col gap-16">
        {Array.from(byVenue.entries())
          .sort((a, b) => (a[0] ?? "").localeCompare(b[0] ?? ""))
          .map(([venue, items]) => (
            <VenueSection key={venue ?? "none"} venue={venue} items={items} />
          ))}
      </div>
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
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-3xl font-medium text-cream-50">{label}</h2>
        <div className="eyebrow">{items.length} dishes</div>
      </div>

      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead className="text-left">
            <tr className="border-b border-ink-600/60 bg-ink-900/40">
              <Th>Dish</Th>
              <Th align="right">Plate cost</Th>
              <Th align="right">Menu</Th>
              <Th align="right">Achieved</Th>
              <Th align="right">Target</Th>
              <Th align="right">Floor</Th>
              <Th align="right">Suggested</Th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ recipe, result }, idx) => (
              <tr
                key={recipe.id}
                className={`border-b border-ink-600/40 last:border-0 hover:bg-ink-800/40 transition-colors ${idx % 2 === 1 ? "bg-ink-900/30" : ""}`}
              >
                <td className="px-6 py-4">
                  <span className="font-display text-lg text-cream-100">{recipe.name}</span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-base text-cream-300">{nzd(result.plateCost)}</td>
                <td className="px-6 py-4 text-right font-mono text-base">
                  {result.salePriceIncGst != null ? nzd(result.salePriceIncGst) : <span className="text-cream-500">—</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <MarginBadge value={result.achievedSaleMarginPct} target={recipe.targetMarginPct} />
                </td>
                <td className="px-6 py-4 text-right font-mono text-base text-cream-500">{pct(recipe.targetMarginPct, 0)}</td>
                <td className="px-6 py-4 text-right font-mono text-base text-cream-500">{nzd(result.floorPriceIncGst)}</td>
                <td className="px-6 py-4 text-right">
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

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-6 py-4 eyebrow font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Stat({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div className="stat-tile">
      <span className="eyebrow">{label}</span>
      <div className={`mt-1 font-display text-5xl font-light tracking-tight ${accent ? "text-vermillion" : "text-cream-50"}`}>
        {value}
      </div>
      {subtitle && <div className="text-sm font-mono text-cream-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function MarginBadge({ value, target }: { value: number | null; target: number }) {
  if (value == null) return <span className="text-cream-500">—</span>;
  const delta = value - target;
  const tone =
    delta >= -2 ? "text-bamboo" : delta >= -5 ? "text-amber-warm" : "text-vermillion-light";
  return <span className={`font-mono text-base ${tone}`}>{value.toFixed(1)}%</span>;
}

function SuggestionCell({ result }: { result: ReturnType<typeof costRecipe> }) {
  const value = nzd(result.suggestedPriceIncGst);
  if (result.suggestionAction === "hold") {
    return (
      <div>
        <div className="font-mono text-base text-cream-300">{value}</div>
        <div className="eyebrow text-cream-500">hold</div>
      </div>
    );
  }
  if (result.suggestionAction === "raise") {
    const delta = result.salePriceIncGst != null ? result.suggestedPriceIncGst - result.salePriceIncGst : 0;
    return (
      <div>
        <div className="font-mono text-base text-vermillion-light">{value}</div>
        <div className="eyebrow text-vermillion-light">raise +{nzd(delta)}</div>
      </div>
    );
  }
  return (
    <div>
      <div className="font-mono text-base text-bamboo">{value}</div>
      <div className="eyebrow text-cream-500">set</div>
    </div>
  );
}
