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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New recipe</h1>
        <p className="text-sm text-muted">Paste a recipe — AI parses, matches, costs, you save.</p>
      </header>

      <form onSubmit={onParse} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-muted">Recipe text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="font-mono text-sm rounded border border-border bg-panel p-3 focus:outline-none focus:border-accent"
            placeholder="Paste recipe here…"
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <Field label="Venue">
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value as NonNullable<Venue>)}
              className="rounded border border-border bg-panel px-2 py-1.5 font-mono text-sm w-full"
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
              className="rounded border border-border bg-panel px-2 py-1.5 font-mono text-sm w-full"
            />
          </Field>
          <Field label="Menu price (optional)">
            <input
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="e.g. 41"
              inputMode="decimal"
              className="rounded border border-border bg-panel px-2 py-1.5 font-mono text-sm w-full"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm rounded bg-accent text-bg font-medium disabled:opacity-50 h-fit"
          >
            {loading ? "Parsing…" : "Parse & cost"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded border border-bad/50 bg-bad/10 px-4 py-3 text-sm text-bad">{error}</div>
      )}

      {result && (
        <section className="rounded-lg border border-border bg-panel p-5 flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none flex-1 min-w-0"
            />
            <div className="flex items-center gap-3 text-sm">
              <ParsedByBadge parsedBy={result.parsedBy} fallbackReason={result.parseError} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-sm">
            <Cell label="Plate cost" value={nzd(result.costing.plateCost)} />
            <Cell label="Menu price" value={result.costing.salePriceIncGst != null ? nzd(result.costing.salePriceIncGst) : "—"} />
            <Cell label="Achieved margin" value={result.costing.achievedSaleMarginPct != null ? pct(result.costing.achievedSaleMarginPct) : "—"} />
            <Cell
              label={
                result.costing.suggestionAction === "hold"
                  ? "Hold price"
                  : result.costing.suggestionAction === "raise"
                    ? "Raise to"
                    : "Suggested"
              }
              value={nzd(result.costing.suggestedPriceIncGst)}
              accent
            />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-muted mb-2">Breakdown</div>
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 font-medium">Ingredient</th>
                  <th className="py-2 font-medium text-right">Qty</th>
                  <th className="py-2 font-medium text-right">Effective kg</th>
                  <th className="py-2 font-medium text-right">$/kg</th>
                  <th className="py-2 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {result.costing.breakdown.map((b, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0">
                    <td className="py-2">{b.name}</td>
                    <td className="py-2 text-right font-mono">
                      {b.quantity}
                      {b.unit}
                    </td>
                    <td className="py-2 text-right font-mono">{b.quantityKg}</td>
                    <td className="py-2 text-right font-mono">{nzd(b.pricePerKg)}</td>
                    <td className="py-2 text-right font-mono">{nzd(b.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.unmatched.length > 0 && (
            <div className="rounded border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
              <div className="font-medium text-warn">Unmatched ingredients ({result.unmatched.length})</div>
              <ul className="mt-1 list-disc list-inside text-muted">
                {result.unmatched.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-muted">
                These won&apos;t be saved. Add them to the master ingredient list first.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-accent">Saved ✓</span>}
            <button
              onClick={onSave}
              disabled={savePending || result.items.length === 0}
              className="px-4 py-2 text-sm rounded bg-accent text-bg font-medium disabled:opacity-50"
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
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded border border-border bg-bg px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-lg font-semibold font-mono ${accent ? "text-accent" : ""}`}>{value}</div>
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
      <span className="px-2 py-0.5 rounded text-xs bg-accent/15 text-accent border border-accent/30">
        AI-parsed
      </span>
    );
  }
  const title = fallbackReason ? `Fell back to regex: ${fallbackReason}` : "No ANTHROPIC_API_KEY set — using regex";
  return (
    <span
      className="px-2 py-0.5 rounded text-xs bg-warn/15 text-warn border border-warn/30"
      title={title}
    >
      regex (fallback)
    </span>
  );
}
