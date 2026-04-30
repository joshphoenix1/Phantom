# Plate — AI food cost (working scaffold)

Per-plate food costing tool for **Cafe Hanoi** and **Ghost Street** (Britomart, Auckland — both kitchens overseen by exec chef Nathan Houpapa). Seeded with Nathan's actual menus pulled from the published PDFs, prices set at realistic 2026 NZ wholesale.

## Run it

```bash
cd /Users/user/food
npm install
npm run dev
```

Open http://localhost:3000. The first request triggers DB init + seed (~2 seconds), then everything is fast.

### Enable real AI parsing & invoice import

Drop your key in `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Restart dev. Without a key the app still runs — recipe parsing falls back to a regex parser (you'll see an amber **regex (fallback)** badge); invoice import refuses to run since there's no sensible non-AI fallback for PDF/CSV extraction.

## What works

| | |
|---|---|
| **Per-plate costing** | Plate cost in $/kg, edible-yield per ingredient, margin computed on real revenue (after GST is remitted), suggested menu price rounded up to whole dollars. |
| **"Maximise margins" pricing rule** | Suggested price is `max(current menu price, floor-to-hit-target)` — never recommends a price cut. If you're already over target, hold. If costs have outrun the menu, raise to a clean whole-dollar floor. |
| **Two-venue dashboard** | Cafe Hanoi vs Ghost Street, plate cost vs menu price vs target-margin floor, achieved-margin badge per dish, hold/raise call-out on each suggestion. |
| **Recipes list** | Filter by venue. 20 dishes seeded from the actual current menus. |
| **Master ingredient list** | ~85 ingredients, kg-priced, supplier-tagged (Bidfood / Gilmours / Service Foods). Inline price edit, add new ingredient form. |
| **Paste-to-cost** | New recipe page: paste freeform recipe → Claude parses + matches against the price list → costed instantly → save to DB. |
| **Supplier invoice import** | Upload Bidfood/Gilmours PDF or CSV → Claude extracts line items, normalises everything to $/kg using world knowledge (4L oil → 3.68 kg, 30 dozen eggs → 18 kg, etc.) → fuzzy-match to existing ingredients → review screen → apply (insert new + update existing prices). |
| **Multi-tenant from day 1** | Every row scoped by `organization_id` so reselling to other groups doesn't need a rewrite. |

## How it's wired

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 + React 19 + TypeScript + Tailwind v3 |
| State | DB-backed via Drizzle ORM. Server components + server actions. |
| DB | SQLite (better-sqlite3), file at `.data/food.db`. Schema in `src/db/schema.ts`, migrations in `drizzle/`. Auto-migrates + seeds on first request. |
| AI | Anthropic SDK 0.88, Claude **Opus 4.7** with adaptive thinking, structured output via Zod schemas, prompt caching on the ingredient list (kicks in once the catalog passes the cache threshold). |

### Why SQLite, not Postgres

The schema is multi-tenant Postgres-shaped (UUIDs, FKs, timestamps). For local dev we use better-sqlite3 because it's sync, zero-setup, file-based, and Node 25-compatible. Switching to Postgres later is a config change in `drizzle.config.ts` + swapping the client driver — the Drizzle queries don't change.

### Files worth knowing

- `src/db/schema.ts` — data model (organizations, ingredients, recipes, recipe_items)
- `src/db/seed-data.ts` — Nathan's menus + ingredient master list (the source of truth for seed)
- `src/db/init.ts` — auto-applies migrations + seeds on first request
- `src/db/queries.ts` — server-only DB reads
- `src/app/actions.ts` — server actions: `saveRecipe`, `addIngredient`, `updateIngredientPrice`, `applyInvoice`
- `src/lib/recipe-parser.ts` — Claude call for paste-to-cost
- `src/lib/invoice-parser.ts` — Claude call for supplier invoice extraction
- `src/lib/costing.ts` — pure costing math (kg conversion, yield, margin → price, GST)

## What's still NOT real

- **Auth** — single hardcoded org. Add Clerk/Auth.js before exposing the app.
- **Multi-site scoping** — recipes have a `venue` text column but no proper venue table or per-venue permissions yet. Nathan covers 3 restaurants; a third venue + venue-level role scoping comes when needed.
- **Sub-recipes / preps** — schema doesn't model them. Real chefs need them (one nuoc cham used in 6 dishes). Add a `recipe_components` join when you hit it.
- **Inventory / par levels** — costing only. No counts, no reorder logic.
- **POS integration** — sale price is a manually-entered field on each recipe. No connection to actual POS data, no historical trend.

## Reset the DB

```bash
rm -rf .data && npm run dev
```

DB is rebuilt from migrations + seed on the next request. Useful when the schema changes or seed data is updated.

## Stack pinned

| | |
|---|---|
| Next.js | 15.x |
| React | 19.0.0 |
| TypeScript | 5.6 |
| Tailwind | 3.4 |
| Drizzle ORM | 0.36 |
| better-sqlite3 | 11.7 |
| Anthropic SDK | 0.88 |
| Zod | 3.23 |
