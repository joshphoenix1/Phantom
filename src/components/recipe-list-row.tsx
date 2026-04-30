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
    <div className="px-7 py-6 flex items-center justify-between gap-7 hover:bg-ink-800/40 transition-colors group">
      <Link href={`/recipes/${recipe.id}`} className="min-w-0 flex-1 cursor-pointer">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl text-cream-100 group-hover:text-cream-50 group-hover:underline decoration-vermillion decoration-2 underline-offset-[6px] truncate transition-all">
            {recipe.name}
          </span>
          <span
            className="text-sm font-mono text-vermillion opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden
          >
            →
          </span>
          {recipe.venue && (
            <span className="text-sm font-display italic text-cream-400 ml-auto">
              {VENUE_LABELS[recipe.venue]}
            </span>
          )}
        </div>
        <div className="mt-1.5 eyebrow text-cream-500">
          {recipe.items.length} ingredients · {recipe.updatedAt}
        </div>
      </Link>

      <div className="flex gap-8 text-right shrink-0 items-center">
        <Metric label="Plate cost" value={nzd(result.plateCost)} />
        <Metric
          label="Menu"
          value={result.salePriceIncGst != null ? nzd(result.salePriceIncGst) : "—"}
          muted={result.salePriceIncGst == null}
        />
        <Metric
          label="Achieved"
          value={result.achievedSaleMarginPct != null ? pct(result.achievedSaleMarginPct) : "—"}
          tone={
            result.achievedSaleMarginPct == null
              ? undefined
              : result.achievedSaleMarginPct >= target - 2
                ? "good"
                : result.achievedSaleMarginPct < target - 5
                  ? "bad"
                  : undefined
          }
        />
        <div className="w-24 text-right">
          <div className="eyebrow">Target</div>
          <div className="flex items-center justify-end gap-1 mt-1.5">
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
              className={`w-14 text-right rounded-none border-b bg-transparent font-mono text-xl focus:outline-none transition-colors ${
                dirty ? "border-vermillion text-vermillion" : "border-ink-600 hover:border-cream-400 text-cream-100"
              }`}
            />
            <span className="text-base text-cream-500">%</span>
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
          tone={result.suggestionAction === "raise" ? "bad" : result.suggestionAction === "set" ? "good" : undefined}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  muted,
  tone,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tone?: "good" | "bad";
}) {
  const valueClass =
    tone === "bad"
      ? "text-vermillion-light"
      : tone === "good"
        ? "text-bamboo"
        : muted
          ? "text-cream-500"
          : "text-cream-100";
  return (
    <div className="w-24">
      <div className="eyebrow">{label}</div>
      <div className={`font-mono text-xl mt-1.5 ${valueClass}`}>{value}</div>
    </div>
  );
}
