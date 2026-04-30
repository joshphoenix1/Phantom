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
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Cell label="Plate cost" value={nzd(result.plateCost)} />
        <Cell
          label="Menu"
          value={result.salePriceIncGst != null ? nzd(result.salePriceIncGst) : "—"}
          muted={result.salePriceIncGst == null}
        />
        <Cell
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
        <div className="surface px-6 py-5">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Target {pending && <span className="text-cream-500 normal-case">·saving</span>}</span>
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
              className={`w-20 text-4xl font-display font-light bg-transparent border-b focus:outline-none transition-colors ${
                dirty ? "border-vermillion text-vermillion" : "border-ink-600 hover:border-cream-400 text-cream-50"
              }`}
            />
            <span className="text-cream-500 text-2xl">%</span>
          </div>
        </div>
        <Cell
          label={
            result.suggestionAction === "hold"
              ? "Hold"
              : result.suggestionAction === "raise"
                ? "Raise to"
                : "Suggested"
          }
          value={nzd(result.suggestedPriceIncGst)}
          tone={result.suggestionAction === "raise" ? "bad" : "good"}
          subtitle={
            result.suggestionAction === "raise" && result.salePriceIncGst != null
              ? `+${nzd(result.suggestedPriceIncGst - result.salePriceIncGst)} on the menu`
              : result.suggestionAction === "hold"
                ? "above target"
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
      <div className="flex items-baseline justify-between mb-5">
        <div className="section-eyebrow !mb-0">Breakdown</div>
        <div className="text-base text-cream-500">
          Floor: <span className="font-mono text-cream-100">{nzd(result.floorPriceIncGst)}</span>
        </div>
      </div>
      <div className="surface overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-600/60 bg-ink-900/40 text-left">
              <Th>Ingredient</Th>
              <Th align="right">Qty</Th>
              <Th align="right">Effective kg</Th>
              <Th align="right">$ / kg</Th>
              <Th align="right">Line</Th>
              <Th align="right">% plate</Th>
            </tr>
          </thead>
          <tbody>
            {result.breakdown.map((b, i) => {
              const pctOfPlate = result.plateCost > 0 ? (b.cost / result.plateCost) * 100 : 0;
              return (
                <tr key={i} className={`border-b border-ink-600/40 last:border-0 ${i % 2 === 1 ? "bg-ink-900/30" : ""}`}>
                  <td className="px-6 py-4 font-display text-lg text-cream-100">{b.name}</td>
                  <td className="px-6 py-4 text-right font-mono text-base text-cream-300">
                    {b.quantity}
                    {b.unit}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-base text-cream-500">{b.quantityKg}</td>
                  <td className="px-6 py-4 text-right font-mono text-base text-cream-500">{nzd(b.pricePerKg)}</td>
                  <td className="px-6 py-4 text-right font-mono text-base text-cream-100">{nzd(b.cost)}</td>
                  <td className="px-6 py-4 text-right font-mono text-base text-cream-500">{pctOfPlate.toFixed(0)}%</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-ink-600 bg-ink-900/60">
              <td className="px-6 py-4 eyebrow" colSpan={4}>
                Plate cost
              </td>
              <td className="px-6 py-4 text-right font-mono text-base font-semibold text-cream-50">
                {nzd(result.plateCost)}
              </td>
              <td className="px-6 py-4"></td>
            </tr>
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

function Cell({
  label,
  value,
  subtitle,
  tone,
  muted,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "good" | "bad";
  muted?: boolean;
}) {
  const valueClass =
    tone === "bad"
      ? "text-vermillion-light"
      : tone === "good"
        ? "text-bamboo"
        : muted
          ? "text-cream-500"
          : "text-cream-50";
  return (
    <div className="surface px-6 py-5">
      <span className="eyebrow">{label}</span>
      <div className={`mt-1 font-display text-4xl font-light tracking-tight ${valueClass}`}>{value}</div>
      {subtitle && <div className="text-sm text-cream-500 mt-1">{subtitle}</div>}
    </div>
  );
}
