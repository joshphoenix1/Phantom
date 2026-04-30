import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "./client";
import { ensureDbReady } from "./init";
import type { Ingredient, Recipe, RecipeItem, Unit, Venue } from "@/lib/types";

async function db() {
  await ensureDbReady();
  return getDb();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getOrgId(): Promise<string> {
  const conn = await db();
  const [org] = conn.select().from(schema.organizations).limit(1).all();
  if (!org) throw new Error("No organization found");
  return org.id;
}

export async function listIngredients(): Promise<Ingredient[]> {
  const conn = await db();
  const orgId = await getOrgId();
  const rows = conn
    .select()
    .from(schema.ingredients)
    .where(eq(schema.ingredients.organizationId, orgId))
    .orderBy(asc(schema.ingredients.name))
    .all();
  return rows.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    name: r.name,
    pricePerKg: r.pricePerKg,
    supplier: r.supplier ?? undefined,
    lastUpdated: isoDate(r.lastUpdated),
  }));
}

export async function listRecipes(): Promise<Recipe[]> {
  const conn = await db();
  const orgId = await getOrgId();
  const recipes = conn
    .select()
    .from(schema.recipes)
    .where(eq(schema.recipes.organizationId, orgId))
    .orderBy(asc(schema.recipes.venue), asc(schema.recipes.name))
    .all();

  if (recipes.length === 0) return [];

  const allItems = conn
    .select({
      id: schema.recipeItems.id,
      recipeId: schema.recipeItems.recipeId,
      ingredientId: schema.recipeItems.ingredientId,
      quantity: schema.recipeItems.quantity,
      unit: schema.recipeItems.unit,
      yieldPct: schema.recipeItems.yieldPct,
      position: schema.recipeItems.position,
      ingredientName: schema.ingredients.name,
    })
    .from(schema.recipeItems)
    .innerJoin(schema.ingredients, eq(schema.ingredients.id, schema.recipeItems.ingredientId))
    .all();

  const itemsByRecipe = new Map<string, RecipeItem[]>();
  for (const item of allItems) {
    const arr = itemsByRecipe.get(item.recipeId) ?? [];
    arr.push({
      id: item.id,
      recipeId: item.recipeId,
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      unit: item.unit as Unit,
      yieldPct: item.yieldPct,
    });
    itemsByRecipe.set(item.recipeId, arr);
  }
  for (const arr of itemsByRecipe.values()) {
    arr.sort((a, b) => {
      const ai = allItems.find((x) => x.id === a.id)?.position ?? 0;
      const bi = allItems.find((x) => x.id === b.id)?.position ?? 0;
      return ai - bi;
    });
  }

  return recipes.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    venue: (r.venue ?? null) as Venue,
    name: r.name,
    targetMarginPct: r.targetMarginPct,
    salePriceIncGst: r.salePriceIncGst,
    notes: r.notes ?? undefined,
    items: itemsByRecipe.get(r.id) ?? [],
    updatedAt: isoDate(r.updatedAt),
  }));
}

export async function getIngredientMap(): Promise<Map<string, Ingredient>> {
  const ingredients = await listIngredients();
  return new Map(ingredients.map((i) => [i.id, i]));
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const all = await listRecipes();
  return all.find((r) => r.id === id) ?? null;
}
