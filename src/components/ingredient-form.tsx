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
    <form onSubmit={onSubmit} className="surface p-6 flex flex-col gap-4">
      <div className="section-eyebrow !mb-0">Add ingredient</div>
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingredient name"
          className="rounded-sm border border-ink-600 bg-ink-900 text-cream-100 px-4 py-2.5 text-base focus:outline-none focus:border-vermillion placeholder:text-cream-500"
        />
        <input
          value={pricePerKg}
          onChange={(e) => setPricePerKg(e.target.value)}
          placeholder="$ / kg"
          inputMode="decimal"
          className="rounded-sm border border-ink-600 bg-ink-900 text-cream-100 px-4 py-2.5 text-base font-mono focus:outline-none focus:border-vermillion placeholder:text-cream-500"
        />
        <input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier (optional)"
          className="rounded-sm border border-ink-600 bg-ink-900 text-cream-100 px-4 py-2.5 text-base focus:outline-none focus:border-vermillion placeholder:text-cream-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-base rounded-sm bg-vermillion text-cream-50 font-mono uppercase tracking-eyebrow hover:bg-vermillion-light transition-colors disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <div className="text-sm text-vermillion-light">{error}</div>}
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
        className="font-mono text-base text-cream-100 hover:text-vermillion-light hover:bg-ink-700/40 rounded-sm px-2 -mx-2 py-0.5 transition-colors"
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
      className="w-24 text-right rounded-sm border border-vermillion bg-ink-900 text-cream-100 px-2 py-0.5 font-mono text-base focus:outline-none"
    />
  );
}
