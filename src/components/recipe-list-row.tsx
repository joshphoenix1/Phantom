"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { updateRecipeTargetMargin } from "@/app/actions";
import { costRecipe } from "@/lib/costing";
import { nzd, pct } from "@/lib/format";
import { VENUE_LABELS, type Ingredient, type Recipe } from "@/lib/types";

export function RecipeListRow({
  recipe,
  ingredients,
}: {
  recipe: Recipe;
  ingredients: Ingredient[];
}) {
  const [target, setTarget] = useState(recipe.targetMarginPct);
  const [savedTarget, setSavedTarget] = useState(recipe.targetMarginPct);
  const [pending, startTransition] = useTransition();

  const ingMap = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);
  const result = useMemo(
    () => costRecipe(recipe.items, ingMap, target, recipe.salePriceIncGst),
    [recipe.items, recipe.salePriceIncGst, ingMap, target],
  );

  function commit(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 95) {
      setTarget(savedTarget);
      return;
    }
    if (value === savedTarget) return;
    startTransition(async () => {
      try {
        await updateRecipeTargetMargin({ id: recipe.id, targetMarginPct: value });
        setSavedTarget(value);
      } catch {
        setTarget(savedTarget);
      }
    });
  }

  const dirty = target !== savedTarget;

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-border/20 transition-colors">
      <Link
        href={`/recipes/${recipe.id}`}
        className="min-w-0 flex-1 group"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium truncate group-hover:underline underline-offset-2">{recipe.name}</span>
          {recipe.venue && (
            <span className="text-xs px-2 py-0.5 rounded bg-border/60 text-muted">
              {VENUE_LABELS[recipe.venue]}
            </span>
          )}
        </div>
        <div className="text-xs text-muted mt-0.5">
          {recipe.items.length} ingredients · updated {recipe.updatedAt}
        </div>
      </Link>
      <div className="flex gap-6 text-right shrink-0 items-center">
        <Metric label="Plate" value={nzd(result.plateCost)} />
        <Metric
          label="Menu"
          value={result.salePriceIncGst != null ? nzd(result.salePriceIncGst) : "—"}
          muted={result.salePriceIncGst == null}
        />
        <Metric
          label="Achieved"
          value={result.achievedSaleMarginPct != null ? pct(result.achievedSaleMarginPct) : "—"}
          accent={
            result.achievedSaleMarginPct != null &&
            result.achievedSaleMarginPct >= target - 2
          }
          bad={
            result.achievedSaleMarginPct != null &&
            result.achievedSaleMarginPct < target - 5
          }
        />
        <div className="w-24">
          <div className="text-xs text-muted">Target %</div>
          <div className="flex items-center gap-1 justify-end">
            <input
              type="number"
              min={0}
              max={95}
              value={target}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setTarget(Number(e.target.value))}
              onBlur={() => commit(target)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setTarget(savedTarget);
              }}
              disabled={pending}
              className={`w-12 text-right rounded border px-1 py-0.5 font-mono text-sm bg-bg focus:outline-none ${
                dirty ? "border-accent" : "border-border"
              }`}
            />
            <span className="text-xs text-muted">%</span>
          </div>
        </div>
        <Metric
          label={
            result.suggestionAction === "hold"
              ? "Hold"
              : result.suggestionAction === "raise"
                ? "Raise to"
                : "Set"
          }
          value={nzd(result.suggestedPriceIncGst)}
          bad={result.suggestionAction === "raise"}
          accent={result.suggestionAction === "set"}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  muted,
  accent,
  bad,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
  bad?: boolean;
}) {
  const valueClass = bad ? "text-bad" : accent ? "text-accent" : muted ? "text-muted" : "";
  return (
    <div className="w-20">
      <div className="text-xs text-muted">{label}</div>
      <div className={`font-mono ${valueClass}`}>{value}</div>
    </div>
  );
}
