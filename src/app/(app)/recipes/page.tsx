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
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
          <p className="text-sm text-muted">
            Costed against current ingredient prices. Type a target margin to see the suggested menu price update.
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="px-3 py-2 text-sm rounded bg-accent text-bg font-medium hover:bg-accent/90"
        >
          + New recipe
        </Link>
      </header>

      <VenueTabs current={venueFilter ?? null} />

      <div className="rounded-lg border border-border bg-panel divide-y divide-border">
        {recipes.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted">No recipes for this venue yet.</div>
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
    <nav className="flex gap-1 text-sm">
      {tabs.map((t) => {
        const active = current === t.key;
        return (
          <Link
            key={t.label}
            href={t.href}
            className={`px-3 py-1.5 rounded transition-colors ${
              active
                ? "bg-border/60 text-text"
                : "text-muted hover:text-text hover:bg-border/30"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
