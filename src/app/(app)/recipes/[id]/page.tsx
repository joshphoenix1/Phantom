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
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 border-b border-ink-600/60 pb-7">
        <Link href="/recipes" className="eyebrow text-cream-500 hover:text-cream-100 w-fit transition-colors">
          ← All recipes
        </Link>
        <div>
          <h1 className="font-display text-5xl font-light tracking-tight text-cream-50">
            {recipe.name}
          </h1>
          <div className="mt-4 text-base text-cream-400 flex items-center gap-3">
            {recipe.venue && (
              <>
                <span className="font-display italic text-lg text-cream-200">{VENUE_LABELS[recipe.venue]}</span>
                <span className="text-cream-500">·</span>
              </>
            )}
            <span className="font-mono">{recipe.items.length} ingredients</span>
            <span className="text-cream-500">·</span>
            <span className="font-mono text-cream-500">updated {recipe.updatedAt}</span>
          </div>
        </div>
      </header>

      <RecipeDetailSummary recipe={recipe} ingredients={ingredients} />

      {recipe.notes && (
        <section>
          <div className="section-eyebrow">Notes</div>
          <div className="surface p-6 text-base whitespace-pre-wrap font-display italic text-cream-200">
            {recipe.notes}
          </div>
        </section>
      )}
    </div>
  );
}
