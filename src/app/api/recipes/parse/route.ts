import { NextResponse } from "next/server";
import { costRecipe } from "@/lib/costing";
import { getIngredientMap, listIngredients } from "@/db/queries";
import { parseRecipeWithClaude, toRecipeItems } from "@/lib/recipe-parser";
import type { Ingredient, RecipeItem, Unit } from "@/lib/types";

type ParsedShape = {
  recipeName: string;
  items: RecipeItem[];
  matched: Array<{ raw: string; ingredientName: string; quantity: number; unit: Unit }>;
  unmatched: string[];
};

function normaliseUnit(u: string | undefined): Unit {
  if (!u) return "ea";
  const lower = u.toLowerCase();
  if (lower === "kg") return "kg";
  if (lower === "g") return "g";
  if (lower === "l") return "L";
  if (lower === "ml") return "ml";
  return "ea";
}

function parseLineRegex(line: string): { raw: string; quantity: number; unit: Unit; name: string } | null {
  const trimmed = line.trim().replace(/^[-•*]\s*/, "");
  if (!trimmed) return null;
  const numUnit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b\s*(.+)$/i);
  if (numUnit) {
    return { raw: trimmed, quantity: Number(numUnit[1]), unit: normaliseUnit(numUnit[2]), name: numUnit[3].trim() };
  }
  const numEach = trimmed.match(/^(\d+(?:\.\d+)?)\s+(?:large\s+|small\s+|medium\s+)?(.+)$/i);
  if (numEach) {
    return {
      raw: trimmed,
      quantity: Number(numEach[1]),
      unit: "ea",
      name: numEach[2].replace(/^cloves?\s+/i, "").trim(),
    };
  }
  return null;
}

function matchIngredientRegex(name: string, ingredients: Ingredient[]): { id: string; name: string } | null {
  const tokens = name.toLowerCase().split(/[\s,]+/).filter(Boolean);
  let best: { score: number; id: string; name: string } | null = null;
  for (const ing of ingredients) {
    const haystack = ing.name.toLowerCase();
    let score = 0;
    for (const t of tokens) if (haystack.includes(t)) score += 1;
    if (score > 0 && (!best || score > best.score)) {
      best = { score, id: ing.id, name: ing.name };
    }
  }
  return best ? { id: best.id, name: best.name } : null;
}

function parseWithRegex(text: string, ingredients: Ingredient[]): ParsedShape {
  const lines = text.split(/\n+/);
  const headerMatch = lines[0]?.match(/^(.+?)(?:\s*[—\-–]\s*serves?\s*\d+)?$/i);
  const recipeName = headerMatch?.[1]?.trim() || "Untitled recipe";

  const items: RecipeItem[] = [];
  const matched: ParsedShape["matched"] = [];
  const unmatched: string[] = [];

  for (const line of lines.slice(1)) {
    const parsed = parseLineRegex(line);
    if (!parsed) continue;
    const match = matchIngredientRegex(parsed.name, ingredients);
    if (!match) {
      unmatched.push(parsed.raw);
      continue;
    }
    items.push({
      id: `ri_${items.length}`,
      recipeId: "preview",
      ingredientId: match.id,
      ingredientName: match.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      yieldPct: 100,
    });
    matched.push({ raw: parsed.raw, ingredientName: match.name, quantity: parsed.quantity, unit: parsed.unit });
  }

  return { recipeName, items, matched, unmatched };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    text?: string;
    targetMarginPct?: number;
    salePriceIncGst?: number | null;
  } | null;
  if (!body?.text) return NextResponse.json({ error: "Missing recipe text" }, { status: 400 });

  const targetMargin = body.targetMarginPct ?? 70;
  const salePriceIncGst = body.salePriceIncGst ?? null;
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  const ingredients = await listIngredients();

  let result: ParsedShape;
  let parsedBy: "claude" | "regex" = "regex";
  let parseError: string | null = null;

  if (hasApiKey) {
    try {
      const claudeResult = await parseRecipeWithClaude(body.text, ingredients);
      const converted = toRecipeItems(claudeResult, ingredients);
      result = {
        recipeName: claudeResult.recipeName,
        items: converted.items,
        matched: converted.matched,
        unmatched: converted.unmatched,
      };
      parsedBy = "claude";
    } catch (err) {
      parseError = err instanceof Error ? err.message : "Unknown error";
      console.error("Claude parse failed, falling back to regex:", parseError);
      result = parseWithRegex(body.text, ingredients);
    }
  } else {
    result = parseWithRegex(body.text, ingredients);
  }

  const ingMap = await getIngredientMap();
  const costing = costRecipe(result.items, ingMap, targetMargin, salePriceIncGst);

  return NextResponse.json({
    recipeName: result.recipeName,
    costing,
    items: result.items,
    matched: result.matched,
    unmatched: result.unmatched,
    parsedBy,
    parseError,
  });
}
