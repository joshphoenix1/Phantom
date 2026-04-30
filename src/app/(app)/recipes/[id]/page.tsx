import Link from "next/link";
import { notFound } from "next/navigation";
import { VENUE_LABELS } from "@/lib/types";
import { getRecipe, listIngredients } from "@/db/queries";
import { RecipeDetailSummary } from "@/components/recipe-detail-summary";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, ingredients] = await Promise.all([getRecipe(id), listIngredients()]);
  if (!recipe) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/recipes" className="text-sm text-muted hover:text-text w-fit">
          ← All recipes
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{recipe.name}</h1>
            <div className="text-sm text-muted mt-1 flex items-center gap-2">
              {recipe.venue && (
                <span className="px-2 py-0.5 rounded bg-border/60 text-text">
                  {VENUE_LABELS[recipe.venue]}
                </span>
              )}
              <span>
                {recipe.items.length} ingredients · updated {recipe.updatedAt}
              </span>
            </div>
          </div>
        </div>
      </header>

      <RecipeDetailSummary recipe={recipe} ingredients={ingredients} />

      {recipe.notes && (
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted mb-2">Notes</h2>
          <div className="rounded-lg border border-border bg-panel p-4 text-sm whitespace-pre-wrap">
            {recipe.notes}
          </div>
        </section>
      )}
    </div>
  );
}
