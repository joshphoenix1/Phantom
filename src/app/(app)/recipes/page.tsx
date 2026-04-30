import Link from "next/link";
import { listIngredients, listRecipes } from "@/db/queries";
import { RecipeListRow } from "@/components/recipe-list-row";
import type { Venue } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const params = await searchParams;
  const venueFilter = params.venue as Venue | undefined;

  const [allRecipes, ingredients] = await Promise.all([listRecipes(), listIngredients()]);
  const recipes = venueFilter ? allRecipes.filter((r) => r.venue === venueFilter) : allRecipes;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-end justify-between border-b border-ink-600/60 pb-7">
        <div>
          <div className="eyebrow mb-3">Service</div>
          <h1 className="font-display text-7xl font-light tracking-tight text-cream-50">
            <span className="display-italic text-vermillion">Recipes</span>
          </h1>
          <p className="mt-4 font-display italic text-cream-400 text-xl">
            Costed against current ingredient prices · type a target margin to recompute
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="px-6 py-3 text-base rounded-sm bg-vermillion text-cream-50 font-mono uppercase tracking-eyebrow hover:bg-vermillion-light transition-colors shadow-seal"
        >
          + New
        </Link>
      </header>

      <VenueTabs current={venueFilter ?? null} />

      <div className="surface divide-y divide-ink-600/40">
        {recipes.length === 0 ? (
          <div className="px-7 py-12 text-center font-display italic text-xl text-cream-500">
            No recipes for this venue yet.
          </div>
        ) : (
          recipes.map((r) => <RecipeListRow key={r.id} recipe={r} ingredients={ingredients} />)
        )}
      </div>
    </div>
  );
}

function VenueTabs({ current }: { current: Venue | null }) {
  const tabs: Array<{ key: Venue | null; label: string; href: string }> = [
    { key: null, label: "All", href: "/recipes" },
    { key: "cafe-hanoi", label: "Cafe Hanoi", href: "/recipes?venue=cafe-hanoi" },
    { key: "ghost-street", label: "Ghost Street", href: "/recipes?venue=ghost-street" },
  ];
  return (
    <nav className="flex gap-1 border-b border-ink-600/40">
      {tabs.map((t) => {
        const active = current === t.key;
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`relative px-5 py-3 transition-colors font-display text-lg ${
              active ? "text-cream-50" : "text-cream-400 hover:text-cream-100"
            }`}
          >
            {t.label}
            {active && <span className="absolute bottom-0 left-0 right-0 h-px bg-vermillion" />}
          </Link>
        );
      })}
    </nav>
  );
}
