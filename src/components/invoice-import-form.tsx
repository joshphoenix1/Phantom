"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyInvoice } from "@/app/actions";
import { nzd } from "@/lib/format";
import type { Ingredient } from "@/lib/types";

type InvoiceLine = {
  rawName: string;
  packDescription: string;
  packPrice: number;
  estimatedPricePerKg: number;
  notes?: string;
  matchedIngredientId: string | null;
  matchedIngredientName: string | null;
};

type ParseResponse = {
  supplier: string;
  invoiceDate: string | null;
  lines: InvoiceLine[];
};

export function InvoiceImportForm({ ingredients }: { ingredients: Ingredient[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParseResponse | null>(null);
  const [supplier, setSupplier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyPending, startApplyTransition] = useTransition();
  const [editedLines, setEditedLines] = useState<InvoiceLine[]>([]);

  async function onParse(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/invoices/parse", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Parse failed" }));
        throw new Error(body.error || "Parse failed");
      }
      const data = (await res.json()) as ParseResponse;
      setParsed(data);
      setSupplier(data.supplier);
      setEditedLines(data.lines);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  }

  function updateLine(idx: number, patch: Partial<InvoiceLine>) {
    setEditedLines((lines) => lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function onApply() {
    if (!parsed) return;
    const usable = editedLines.filter((l) => l.estimatedPricePerKg > 0);
    if (usable.length === 0) {
      setError("No usable lines (all have $/kg of 0).");
      return;
    }
    startApplyTransition(async () => {
      try {
        const result = await applyInvoice({
          supplier: supplier || parsed.supplier,
          lines: usable.map((l) => ({
            name: l.matchedIngredientName ?? l.rawName,
            pricePerKg: l.estimatedPricePerKg,
            matchedIngredientId: l.matchedIngredientId,
          })),
        });
        alert(`Invoice applied: ${result.inserted} new ingredients, ${result.updated} prices updated.`);
        router.push("/ingredients");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Apply failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Import supplier invoice</h1>
        <p className="text-sm text-muted">
          Drop a Bidfood / Gilmours / Service Foods PDF or CSV. Claude reads it, normalises everything to $/kg,
          and matches against your existing ingredients. You review, then apply.
        </p>
      </header>

      <form onSubmit={onParse} className="flex flex-col gap-3 rounded-lg border border-border bg-panel p-5">
        <input
          type="file"
          accept=".pdf,.csv,application/pdf,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-4 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-accent file:text-bg file:font-medium file:cursor-pointer"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{file ? `${file.name} (${Math.round(file.size / 1024)} KB)` : "PDF or CSV"}</span>
          <button
            type="submit"
            disabled={!file || loading}
            className="px-4 py-2 text-sm rounded bg-accent text-bg font-medium disabled:opacity-50"
          >
            {loading ? "Parsing…" : "Parse invoice"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded border border-bad/50 bg-bad/10 px-4 py-3 text-sm text-bad whitespace-pre-wrap">{error}</div>
      )}

      {parsed && (
        <section className="rounded-lg border border-border bg-panel p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs uppercase tracking-wider text-muted">Supplier</label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="rounded border border-border bg-bg px-2 py-1 font-mono text-sm"
              />
              {parsed.invoiceDate && (
                <span className="text-xs text-muted">Invoice {parsed.invoiceDate}</span>
              )}
            </div>
            <span className="text-sm text-muted">
              {editedLines.length} line{editedLines.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b border-border bg-bg">
                  <th className="px-3 py-2 font-medium">Invoice line</th>
                  <th className="px-3 py-2 font-medium">Pack</th>
                  <th className="px-3 py-2 font-medium text-right">Pack $</th>
                  <th className="px-3 py-2 font-medium text-right">$/kg</th>
                  <th className="px-3 py-2 font-medium">Matches</th>
                </tr>
              </thead>
              <tbody>
                {editedLines.map((line, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0 align-top">
                    <td className="px-3 py-2">
                      <div>{line.rawName}</div>
                      {line.notes && <div className="text-xs text-muted mt-0.5">{line.notes}</div>}
                    </td>
                    <td className="px-3 py-2 text-muted">{line.packDescription}</td>
                    <td className="px-3 py-2 text-right font-mono">{nzd(line.packPrice)}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={line.estimatedPricePerKg}
                        onChange={(e) => updateLine(idx, { estimatedPricePerKg: Number(e.target.value) })}
                        className="w-20 text-right rounded border border-border bg-bg px-2 py-0.5 font-mono text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={line.matchedIngredientId ?? "__new__"}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "__new__") {
                            updateLine(idx, { matchedIngredientId: null, matchedIngredientName: null });
                          } else {
                            const ing = ingredients.find((i) => i.id === v);
                            updateLine(idx, {
                              matchedIngredientId: v,
                              matchedIngredientName: ing?.name ?? null,
                            });
                          }
                        }}
                        className="rounded border border-border bg-bg px-2 py-1 text-sm w-full"
                      >
                        <option value="__new__">+ Create new ingredient</option>
                        {ingredients.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onApply}
              disabled={applyPending}
              className="px-4 py-2 text-sm rounded bg-accent text-bg font-medium disabled:opacity-50"
            >
              {applyPending ? "Applying…" : `Apply ${editedLines.filter((l) => l.estimatedPricePerKg > 0).length} lines`}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
