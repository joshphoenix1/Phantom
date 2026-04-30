import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type Database from "better-sqlite3";
import { getDb, schema } from "./client";
import { SEED_INGREDIENTS, SEED_ORG_NAME, SEED_RECIPES } from "./seed-data";

declare global {
  // eslint-disable-next-line no-var
  var __dbInitialized: Promise<void> | undefined;
}

async function migrate(): Promise<void> {
  const db = getDb();
  const sqlite = db.$client as unknown as Database.Database;
  if (!sqlite) throw new Error("Could not access underlying sqlite client");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __migrations (
      filename TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  const migrationDir = path.join(process.cwd(), "drizzle");
  const files = (await fs.readdir(migrationDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = sqlite.prepare("SELECT filename FROM __migrations").all() as { filename: string }[];
  const appliedSet = new Set(applied.map((r) => r.filename));

  const insertApplied = sqlite.prepare("INSERT INTO __migrations (filename) VALUES (?)");

  for (const file of files) {
    if (appliedSet.has(file)) continue;
    const text = await fs.readFile(path.join(migrationDir, file), "utf8");
    sqlite.exec(text.replace(/--> statement-breakpoint/g, ";"));
    insertApplied.run(file);
    console.log(`[db] applied migration ${file}`);
  }
}

async function seedIfEmpty(): Promise<void> {
  const db = getDb();
  const existing = db.select().from(schema.organizations).limit(1).all();
  if (existing.length > 0) return;

  console.log("[db] seeding initial data…");
  const [org] = db
    .insert(schema.organizations)
    .values({ name: SEED_ORG_NAME, defaultMarginPct: 70 })
    .returning()
    .all();

  const ingredientRows = SEED_INGREDIENTS.map((i) => ({
    organizationId: org.id,
    name: i.name,
    pricePerKg: i.pricePerKg,
    supplier: i.supplier,
  }));
  const insertedIngredients = db
    .insert(schema.ingredients)
    .values(ingredientRows)
    .returning()
    .all();

  const ingMap = new Map<string, string>();
  SEED_INGREDIENTS.forEach((seed, idx) => {
    ingMap.set(seed.key, insertedIngredients[idx].id);
  });

  for (const recipe of SEED_RECIPES) {
    const [inserted] = db
      .insert(schema.recipes)
      .values({
        organizationId: org.id,
        venue: recipe.venue,
        name: recipe.name,
        targetMarginPct: recipe.targetMarginPct ?? 70,
        salePriceIncGst: recipe.salePriceIncGst,
        notes: recipe.notes,
      })
      .returning()
      .all();

    const items = recipe.items.map((item, position) => {
      const ingredientId = ingMap.get(item.ingredientKey);
      if (!ingredientId) {
        throw new Error(`Seed: unknown ingredient key "${item.ingredientKey}" in recipe "${recipe.name}"`);
      }
      return {
        recipeId: inserted.id,
        ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        yieldPct: item.yieldPct ?? 100,
        position,
      };
    });
    db.insert(schema.recipeItems).values(items).run();
  }

  console.log(`[db] seeded ${SEED_INGREDIENTS.length} ingredients, ${SEED_RECIPES.length} recipes`);
}

export function ensureDbReady(): Promise<void> {
  if (!globalThis.__dbInitialized) {
    globalThis.__dbInitialized = (async () => {
      await migrate();
      await seedIfEmpty();
    })().catch((err) => {
      globalThis.__dbInitialized = undefined;
      throw err;
    });
  }
  return globalThis.__dbInitialized;
}
