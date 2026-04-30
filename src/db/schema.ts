import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

const id = (name = "id") => text(name).$defaultFn(() => crypto.randomUUID());
const tsNow = (name: string) => integer(name, { mode: "timestamp" }).$defaultFn(() => new Date());

export const organizations = sqliteTable("organizations", {
  id: id().primaryKey(),
  name: text("name").notNull(),
  defaultMarginPct: real("default_margin_pct").notNull().default(70),
  createdAt: tsNow("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: id().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: tsNow("created_at").notNull(),
});

export const memberships = sqliteTable(
  "memberships",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: tsNow("created_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.organizationId] }),
  }),
);

export const ingredients = sqliteTable("ingredients", {
  id: id().primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pricePerKg: real("price_per_kg").notNull(),
  supplier: text("supplier"),
  lastUpdated: tsNow("last_updated").notNull(),
});

export const recipes = sqliteTable("recipes", {
  id: id().primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  venue: text("venue"),
  name: text("name").notNull(),
  targetMarginPct: real("target_margin_pct").notNull().default(70),
  salePriceIncGst: real("sale_price_inc_gst"),
  notes: text("notes"),
  updatedAt: tsNow("updated_at").notNull(),
});

export const recipeItems = sqliteTable("recipe_items", {
  id: id().primaryKey(),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: text("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "restrict" }),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(),
  yieldPct: real("yield_pct").notNull().default(100),
  position: integer("position").notNull().default(0),
});
