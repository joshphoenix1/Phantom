"use client";

import { useMemo, useState, useTransition } from "react";
import { updateRecipeTargetMargin } from "@/app/actions";
import { costRecipe } from "@/lib/costing";
import { nzd, pct } from "@/lib/format";
import type { Ingredient, Recipe } from "@/lib/types";

export function RecipeDetailSummary({
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
    <>
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
        <Cell label="Plate cost" value={nzd(result.plateCost)} />
        <Cell
          label="Menu price"
          value={result.salePriceIncGst != null ? nzd(result.salePriceIncGst) : "—"}
        />
        <Cell
          label="Achieved margin"
          value={result.achievedSaleMarginPct != null ? pct(result.achievedSaleMarginPct) : "—"}
          tone={
            result.achievedSaleMarginPct == null
              ? undefined
              : result.achievedSaleMarginPct >= target - 2
                ? "accent"
                : result.achievedSaleMarginPct < target - 5
                  ? "bad"
                  : undefined
          }
        />
        <div className="rounded border border-border bg-panel px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted">
            Target margin {pending && <span className="text-muted">(saving…)</span>}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <input
              type="number"
              min={0}
              max={95}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              onBlur={() => commit(target)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setTarget(savedTarget);
              }}
              disabled={pending}
              className={`w-16 text-2xl font-semibold font-mono bg-transparent border-b focus:outline-none ${
                dirty ? "border-accent text-accent" : "border-border"
              }`}
            />
            <span className="text-muted text-xl">%</span>
          </div>
        </div>
        <Cell
          label={
            result.suggestionAction === "hold"
              ? "Hold price"
              : result.suggestionAction === "raise"
                ? "Raise to"
                : "Suggested"
          }
          value={nzd(result.suggestedPriceIncGst)}
          tone={result.suggestionAction === "raise" ? "bad" : "accent"}
          subtitle={
            result.suggestionAction === "raise" && result.salePriceIncGst != null
              ? `+${nzd(result.suggestedPriceIncGst - result.salePriceIncGst)} on the menu`
              : result.suggestionAction === "hold"
                ? "already above target"
                : "no menu price set"
          }
        />
      </section>

      <BreakdownTable result={result} />
    </>
  );
}

function BreakdownTable({ result }: { result: ReturnType<typeof costRecipe> }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Ingredient breakdown</h2>
        <div className="text-xs text-muted">
          Floor (cost-plus): <span className="font-mono text-text">{nzd(result.floorPriceIncGst)}</span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-medium">Ingredient</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Effective kg</th>
              <th className="px-4 py-3 font-medium text-right">$ / kg</th>
              <th className="px-4 py-3 font-medium text-right">Line cost</th>
              <th className="px-4 py-3 font-medium text-right">% of plate</th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown.map((b, i) => {
              const pctOfPlate = result.plateCost > 0 ? (b.cost / result.plateCost) * 100 : 0;
              return (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {b.quantity}
                    {b.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{b.quantityKg}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">{nzd(b.pricePerKg)}</td>
                  <td className="px-4 py-3 text-right font-mono">{nzd(b.cost)}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted">
                    {pctOfPlate.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-border bg-bg/40">
              <td className="px-4 py-3 font-medium" colSpan={4}>
                Plate cost
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold">
                {nzd(result.plateCost)}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  subtitle,
  tone,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "accent" | "bad";
}) {
  const valueClass = tone === "bad" ? "text-bad" : tone === "accent" ? "text-accent" : "";
  return (
    <div className="rounded border border-border bg-panel px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold font-mono ${valueClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
    </div>
  );
}
