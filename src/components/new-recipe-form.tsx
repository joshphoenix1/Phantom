"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRecipe } from "@/app/actions";
import { nzd, pct } from "@/lib/format";
import type { CostingResult, Unit, Venue } from "@/lib/types";

const SAMPLE = `Pollo al Pomodoro
600g chicken thigh, boneless skinless
1 large brown onion, diced
4 cloves garlic
40ml olive oil
800g tinned tomato
10g fresh basil`;

type ParsedItem = {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: Unit;
  yieldPct: number;
};

type ParseResponse = {
  recipeName: string;
  costing: CostingResult;
  items: ParsedItem[];
  matched: Array<{ raw: string; ingredientName: string; quantity: number; unit: string }>;
  unmatched: string[];
  parsedBy: "claude" | "regex";
  parseError: string | null;
};

export function NewRecipeForm() {
  const router = useRouter();
  const [text, setText] = useState(SAMPLE);
  const [margin, setMargin] = useState(70);
  const [salePrice, setSalePrice] = useState("");
  const [venue, setVenue] = useState<NonNullable<Venue>>("cafe-hanoi");
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [recipeName, setRecipeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savePending, startSaveTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function onParse(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const sale = salePrice.trim() ? Number(salePrice) : null;
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetMarginPct: margin, salePriceIncGst: sale }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ParseResponse;
      setResult(data);
      setRecipeName(data.recipeName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onSave() {
    if (!result) return;
    setError(null);
    startSaveTransition(async () => {
      try {
        const sale = salePrice.trim() ? Number(salePrice) : null;
        await saveRecipe({
          name: recipeName.trim() || result.recipeName,
          venue,
          targetMarginPct: margin,
          salePriceIncGst: sale,
          items: result.items.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
            yieldPct: i.yieldPct,
          })),
        });
        setSaved(true);
        router.push("/recipes");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-ink-600/60 pb-7">
        <div className="eyebrow mb-3">New</div>
        <h1 className="font-display text-7xl font-light tracking-tight text-cream-50">
          <span className="display-italic text-vermillion">Add</span> a dish
        </h1>
        <p className="mt-4 font-display italic text-cream-400 text-xl">
          Paste a recipe — AI parses, matches, costs, you save.
        </p>
      </header>

      <form onSubmit={onParse} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="eyebrow">Recipe text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="font-mono text-base rounded-sm border border-ink-600 bg-ink-800/60 text-cream-100 p-5 focus:outline-none focus:border-vermillion placeholder:text-cream-500"
            placeholder="Paste recipe here…"
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          <Field label="Venue">
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value as NonNullable<Venue>)}
              className="rounded-sm border border-ink-600 bg-ink-900 text-cream-100 px-4 py-2.5 font-mono text-base w-full focus:outline-none focus:border-vermillion"
            >
              <option value="cafe-hanoi">Cafe Hanoi</option>
              <option value="ghost-street">Ghost Street</option>
            </select>
          </Field>
          <Field label="Target margin %">
            <input
              type="number"
              min={0}
              max={95}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="rounded-sm border border-ink-600 bg-ink-900 text-cream-100 px-4 py-2.5 font-mono text-base w-full focus:outline-none focus:border-vermillion"
            />
          </Field>
          <Field label="Menu price (optional)">
            <input
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="e.g. 41"
              inputMode="decimal"
              className="rounded-sm border border-ink-600 bg-ink-900 text-cream-100 px-4 py-2.5 font-mono text-base w-full focus:outline-none focus:border-vermillion placeholder:text-cream-500"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-base rounded-sm bg-vermillion text-cream-50 font-mono uppercase tracking-eyebrow hover:bg-vermillion-light transition-colors disabled:opacity-50 h-fit"
          >
            {loading ? "Parsing…" : "Parse & cost"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-sm border border-vermillion/50 bg-vermillion/10 px-5 py-4 text-base text-vermillion-light">
          {error}
        </div>
      )}

      {result && (
        <section className="surface p-7 flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-3 flex-wrap border-b border-ink-600/60 pb-5">
            <input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="font-display text-3xl font-light text-cream-50 bg-transparent border-b border-transparent hover:border-ink-600 focus:border-vermillion focus:outline-none flex-1 min-w-0"
            />
            <div className="flex items-center gap-3">
              <ParsedByBadge parsedBy={result.parsedBy} fallbackReason={result.parseError} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Cell label="Plate cost" value={nzd(result.costing.plateCost)} />
            <Cell label="Menu" value={result.costing.salePriceIncGst != null ? nzd(result.costing.salePriceIncGst) : "—"} />
            <Cell label="Achieved" value={result.costing.achievedSaleMarginPct != null ? pct(result.costing.achievedSaleMarginPct) : "—"} />
            <Cell
              label={
                result.costing.suggestionAction === "hold"
                  ? "Hold"
                  : result.costing.suggestionAction === "raise"
                    ? "Raise to"
                    : "Suggested"
              }
              value={nzd(result.costing.suggestedPriceIncGst)}
              accent
            />
          </div>

          <div>
            <div className="section-eyebrow">Breakdown</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-600/60 text-left">
                  <th className="py-3 eyebrow font-medium">Ingredient</th>
                  <th className="py-3 eyebrow font-medium text-right">Qty</th>
                  <th className="py-3 eyebrow font-medium text-right">Effective kg</th>
                  <th className="py-3 eyebrow font-medium text-right">$/kg</th>
                  <th className="py-3 eyebrow font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {result.costing.breakdown.map((b, i) => (
                  <tr key={i} className="border-b border-ink-600/30 last:border-0">
                    <td className="py-3 font-display text-lg text-cream-100">{b.name}</td>
                    <td className="py-3 text-right font-mono text-base text-cream-300">
                      {b.quantity}
                      {b.unit}
                    </td>
                    <td className="py-3 text-right font-mono text-base text-cream-500">{b.quantityKg}</td>
                    <td className="py-3 text-right font-mono text-base text-cream-500">{nzd(b.pricePerKg)}</td>
                    <td className="py-3 text-right font-mono text-base text-cream-100">{nzd(b.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.unmatched.length > 0 && (
            <div className="rounded-sm border border-amber-warm/40 bg-amber-warm/5 px-5 py-4 text-base">
              <div className="font-display italic text-lg text-amber-warm">
                {result.unmatched.length} unmatched ingredient{result.unmatched.length === 1 ? "" : "s"}
              </div>
              <ul className="mt-2 list-disc list-inside text-cream-400 font-mono text-sm">
                {result.unmatched.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              <div className="mt-2 text-sm text-cream-500 italic">
                These won&apos;t be saved. Add them to the master ingredient list first.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="font-display italic text-bamboo text-lg">Saved ✓</span>}
            <button
              onClick={onSave}
              disabled={savePending || result.items.length === 0}
              className="px-6 py-3 text-base rounded-sm bg-vermillion text-cream-50 font-mono uppercase tracking-eyebrow hover:bg-vermillion-light transition-colors disabled:opacity-50"
            >
              {savePending ? "Saving…" : "Save recipe"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-sm border border-ink-600/60 bg-ink-900/60 px-5 py-4">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 font-display text-3xl font-light ${accent ? "text-vermillion" : "text-cream-50"}`}>{value}</div>
    </div>
  );
}

function ParsedByBadge({
  parsedBy,
  fallbackReason,
}: {
  parsedBy: "claude" | "regex";
  fallbackReason: string | null;
}) {
  if (parsedBy === "claude") {
    return (
      <span className="px-3 py-1 rounded-sm text-sm bg-bamboo/15 text-bamboo border border-bamboo/40 font-mono uppercase tracking-eyebrow">
        AI
      </span>
    );
  }
  const title = fallbackReason ? `Fell back to regex: ${fallbackReason}` : "No ANTHROPIC_API_KEY set — using regex";
  return (
    <span
      className="px-3 py-1 rounded-sm text-sm bg-amber-warm/15 text-amber-warm border border-amber-warm/40 font-mono uppercase tracking-eyebrow"
      title={title}
    >
      regex
    </span>
  );
}
