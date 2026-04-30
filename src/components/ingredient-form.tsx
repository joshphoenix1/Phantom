"use client";

import { useState, useTransition } from "react";
import { addIngredient, updateIngredientPrice } from "@/app/actions";

export function AddIngredientForm() {
  const [name, setName] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [supplier, setSupplier] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(pricePerKg);
    if (!name.trim() || !Number.isFinite(price) || price <= 0) {
      setError("Name and a positive price/kg are required");
      return;
    }
    startTransition(async () => {
      try {
        await addIngredient({
          name,
          pricePerKg: price,
          supplier: supplier.trim() || null,
        });
        setName("");
        setPricePerKg("");
        setSupplier("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add ingredient");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-panel p-4 flex flex-col gap-3">
      <div className="text-sm font-medium">Add ingredient</div>
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingredient name"
          className="rounded border border-border bg-bg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
        />
        <input
          value={pricePerKg}
          onChange={(e) => setPricePerKg(e.target.value)}
          placeholder="$ / kg"
          inputMode="decimal"
          className="rounded border border-border bg-bg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-accent"
        />
        <input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier (optional)"
          className="rounded border border-border bg-bg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-1.5 text-sm rounded bg-accent text-bg font-medium disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <div className="text-xs text-bad">{error}</div>}
    </form>
  );
}

export function EditableIngredientPrice({ id, initial }: { id: string; initial: number }) {
  const [price, setPrice] = useState(initial.toString());
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function commit() {
    const next = Number(price);
    if (!Number.isFinite(next) || next <= 0 || next === initial) {
      setPrice(initial.toString());
      setEditing(false);
      return;
    }
    startTransition(async () => {
      await updateIngredientPrice({ id, pricePerKg: next });
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="font-mono hover:bg-border/40 rounded px-1 -mx-1 transition-colors"
        title="Click to edit"
      >
        ${initial.toFixed(2)}
      </button>
    );
  }

  return (
    <input
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setPrice(initial.toString());
          setEditing(false);
        }
      }}
      autoFocus
      disabled={isPending}
      inputMode="decimal"
      className="w-20 text-right rounded border border-accent bg-bg px-2 py-0.5 font-mono text-sm focus:outline-none"
    />
  );
}
