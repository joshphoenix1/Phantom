import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Ingredient, RecipeItem, Unit } from "./types";

const SUPPORTED_UNITS = ["kg", "g", "L", "ml", "ea"] as const;

const ParsedItemSchema = z.object({
  rawText: z.string().describe("The original line from the recipe text"),
  ingredientId: z
    .string()
    .describe("ID of the matched ingredient from the price list. Empty string if no good match."),
  quantity: z.number().describe("Quantity in the chosen unit"),
  unit: z.enum(SUPPORTED_UNITS),
  yieldPct: z
    .number()
    .min(0)
    .max(100)
    .describe("Edible yield percentage after prep losses. 100 if no prep waste."),
});

const ParseResultSchema = z.object({
  recipeName: z.string(),
  servings: z.number().int().positive(),
  items: z.array(ParsedItemSchema),
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

const SYSTEM_INSTRUCTIONS = `You are a recipe parsing assistant for a food costing tool used by professional chefs in New Zealand. Your job is to convert freeform recipe text into structured ingredients matched against a kg-based price list.

For each ingredient line:

1. Extract quantity and convert to a precise unit. When the recipe specifies a count of items (e.g., "1 large onion", "4 cloves garlic", "2 carrots"), convert to grams using typical kitchen weights so the costing math is accurate. Use these defaults:
   - Brown/yellow onion: 150g each
   - Red onion: 130g each
   - Garlic clove: 5g each
   - Garlic head: 50g each
   - Carrot (medium): 80g each
   - Potato (medium): 200g each
   - Tomato (medium): 120g each
   - Lemon: 100g each
   - Lime: 70g each
   - Egg: 50g each
   When the recipe gives an explicit weight or volume (e.g. "200g chicken", "40ml oil"), keep that. Use "ea" only when no weight conversion is reasonable (e.g., "1 bay leaf").

2. Match it to the closest ingredient in the AVAILABLE INGREDIENTS list. Use the ingredient ID exactly as listed. If no reasonable match exists, set ingredientId to empty string.

3. Estimate edible yield percentage based on typical prep losses:
   - Whole vegetables (peeled/trimmed): onion 85, carrot 80, garlic 90, potato 85
   - Whole fruits with peel/seeds: citrus 60-70, apple 90
   - Bone-in meat: 70-85
   - Boneless trimmed meat / fish fillets: 92-98
   - Pantry items (oil, pasta, canned tomato, dairy): 100
   - Fresh herbs (stems wasted): 60-80

The first line of the recipe usually contains the dish name and may indicate serving count (e.g. "Pollo al Pomodoro — serves 4"). If servings aren't stated, infer a reasonable default for the dish (most plated mains: 2-4).`;

export async function parseRecipeWithClaude(
  recipeText: string,
  ingredients: Ingredient[],
): Promise<ParseResult> {
  const client = new Anthropic();

  const ingredientList = ingredients
    .map((i) => `- ${i.id}: ${i.name} ($${i.pricePerKg.toFixed(2)}/kg)`)
    .join("\n");

  const response = await client.messages.parse({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: SYSTEM_INSTRUCTIONS },
      {
        type: "text",
        text: `AVAILABLE INGREDIENTS:\n${ingredientList}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: `Parse this recipe:\n\n${recipeText}` }],
    output_config: { format: zodOutputFormat(ParseResultSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("Claude response did not match the schema");
  }

  return response.parsed_output;
}

export function toRecipeItems(
  parsed: ParseResult,
  ingredients: Ingredient[],
): {
  items: RecipeItem[];
  matched: Array<{ raw: string; ingredientName: string; quantity: number; unit: Unit }>;
  unmatched: string[];
} {
  const ingMap = new Map(ingredients.map((i) => [i.id, i]));
  const items: RecipeItem[] = [];
  const matched: Array<{ raw: string; ingredientName: string; quantity: number; unit: Unit }> = [];
  const unmatched: string[] = [];

  parsed.items.forEach((item, idx) => {
    if (!item.ingredientId || !ingMap.has(item.ingredientId)) {
      unmatched.push(item.rawText);
      return;
    }
    const ing = ingMap.get(item.ingredientId)!;
    items.push({
      id: `ri_${idx}`,
      recipeId: "preview",
      ingredientId: item.ingredientId,
      ingredientName: ing.name,
      quantity: item.quantity,
      unit: item.unit,
      yieldPct: item.yieldPct,
    });
    matched.push({
      raw: item.rawText,
      ingredientName: ing.name,
      quantity: item.quantity,
      unit: item.unit,
    });
  });

  return { items, matched, unmatched };
}
