"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db/client";
import { ensureDbReady } from "@/db/init";
import { getOrgId } from "@/db/queries";
import type { Unit, Venue } from "@/lib/types";

async function db() {
  await ensureDbReady();
  return getDb();
}

export async function saveRecipe(input: {
  name: string;
  venue: Venue;
  targetMarginPct: number;
  salePriceIncGst: number | null;
  items: Array<{
    ingredientId: string;
    quantity: number;
    unit: Unit;
    yieldPct: number;
  }>;
}): Promise<{ id: string }> {
  const conn = await db();
  const orgId = await getOrgId();

  const [recipe] = conn
    .insert(schema.recipes)
    .values({
      organizationId: orgId,
      venue: input.venue,
      name: input.name,
      targetMarginPct: input.targetMarginPct,
      salePriceIncGst: input.salePriceIncGst,
    })
    .returning()
    .all();

  if (input.items.length > 0) {
    conn
      .insert(schema.recipeItems)
      .values(
        input.items.map((item, position) => ({
          recipeId: recipe.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
          yieldPct: item.yieldPct,
          position,
        })),
      )
      .run();
  }

  revalidatePath("/recipes");
  revalidatePath("/dashboard");
  return { id: recipe.id };
}

export async function addIngredient(input: {
  name: string;
  pricePerKg: number;
  supplier: string | null;
}): Promise<{ id: string }> {
  const conn = await db();
  const orgId = await getOrgId();

  const [ingredient] = conn
    .insert(schema.ingredients)
    .values({
      organizationId: orgId,
      name: input.name.trim(),
      pricePerKg: input.pricePerKg,
      supplier: input.supplier?.trim() || null,
    })
    .returning()
    .all();

  revalidatePath("/ingredients");
  revalidatePath("/dashboard");
  revalidatePath("/recipes");
  return { id: ingredient.id };
}

export async function updateRecipeTargetMargin(input: {
  id: string;
  targetMarginPct: number;
}): Promise<void> {
  if (!Number.isFinite(input.targetMarginPct) || input.targetMarginPct < 0 || input.targetMarginPct > 95) {
    throw new Error("Target margin must be between 0 and 95");
  }
  const conn = await db();
  conn
    .update(schema.recipes)
    .set({
      targetMarginPct: input.targetMarginPct,
      updatedAt: new Date(),
    })
    .where(eq(schema.recipes.id, input.id))
    .run();
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${input.id}`);
  revalidatePath("/dashboard");
}

export async function updateIngredientPrice(input: {
  id: string;
  pricePerKg: number;
}): Promise<void> {
  const conn = await db();
  conn
    .update(schema.ingredients)
    .set({
      pricePerKg: input.pricePerKg,
      lastUpdated: new Date(),
    })
    .where(eq(schema.ingredients.id, input.id))
    .run();
  revalidatePath("/ingredients");
  revalidatePath("/dashboard");
  revalidatePath("/recipes");
}

export async function applyInvoice(input: {
  supplier: string;
  lines: Array<{
    name: string;
    pricePerKg: number;
    matchedIngredientId: string | null;
  }>;
}): Promise<{ inserted: number; updated: number }> {
  const conn = await db();
  const orgId = await getOrgId();
  let inserted = 0;
  let updated = 0;

  for (const line of input.lines) {
    if (line.matchedIngredientId) {
      conn
        .update(schema.ingredients)
        .set({
          pricePerKg: line.pricePerKg,
          supplier: input.supplier,
          lastUpdated: new Date(),
        })
        .where(eq(schema.ingredients.id, line.matchedIngredientId))
        .run();
      updated += 1;
    } else {
      conn
        .insert(schema.ingredients)
        .values({
          organizationId: orgId,
          name: line.name.trim(),
          pricePerKg: line.pricePerKg,
          supplier: input.supplier,
        })
        .run();
      inserted += 1;
    }
  }

  revalidatePath("/ingredients");
  revalidatePath("/dashboard");
  revalidatePath("/recipes");
  return { inserted, updated };
}
