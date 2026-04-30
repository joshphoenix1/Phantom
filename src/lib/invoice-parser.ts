import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const InvoiceLineSchema = z.object({
  rawName: z.string().describe("The product description as it appears on the invoice"),
  packDescription: z
    .string()
    .describe("How the product is packed/sold, e.g. '5kg case', '4L bottle', '6 each', '12x500g'"),
  packPrice: z.number().describe("Total price (ex GST) for one pack/unit as listed on the invoice"),
  estimatedPricePerKg: z
    .number()
    .describe(
      "Best-effort price per kilogram in NZD ex GST. Convert pack pricing to /kg using world knowledge: liquids assume 1 L = 1 kg unless oil (1 L ≈ 0.92 kg), eggs assume ~50g each, count items use typical kitchen weights. If you genuinely cannot estimate, set this to 0.",
    ),
  notes: z
    .string()
    .optional()
    .describe("Brief explanation of any conversion logic used, or warning if estimate is rough"),
});

const InvoiceSchema = z.object({
  supplier: z.string().describe("Supplier name from the invoice header (Bidfood, Gilmours, Service Foods, etc)"),
  invoiceDate: z
    .string()
    .optional()
    .describe("Invoice date in ISO format YYYY-MM-DD if visible"),
  lines: z
    .array(InvoiceLineSchema)
    .describe("Line items from the invoice. Skip non-product lines like delivery fees, GST line, or totals."),
});

export type InvoiceParseResult = z.infer<typeof InvoiceSchema>;

const SYSTEM_INSTRUCTIONS = `You are an invoice parsing assistant for a food costing tool used by professional chefs in New Zealand. Your job is to extract product line items from supplier invoices and compute a normalised price per kilogram (ex GST) for each.

For each line item:
1. Extract the product description, pack description, and pack price exactly as listed.
2. Compute price per kg using world knowledge. Examples:
   - "Chicken thigh 5kg @ $72.50" → $14.50/kg
   - "Olive oil 4L @ $50" → 4L × 0.92 kg/L = 3.68 kg → $13.59/kg
   - "Eggs 30 dozen @ $48" → 360 eggs × 50g = 18 kg → $2.67/kg
   - "Brown onion 10kg bag @ $28" → $2.80/kg
   - "Garlic 1kg @ $18" → $18.00/kg
3. Skip non-product lines: delivery, freight, GST, totals, account credit, returns.
4. If a line is genuinely uninterpretable, include it but set estimatedPricePerKg to 0 with a note.

Common NZ suppliers: Bidfood, Gilmours, Service Foods, Moore Wilson's, Trents, Toops Foodservice, Reesby's.

Liquid density assumptions:
- Water/dairy/vinegar/sauces: 1 L ≈ 1 kg
- Cooking oil: 1 L ≈ 0.92 kg
- Spirits: 1 L ≈ 0.95 kg

Count-item weight assumptions:
- Eggs: 50g each
- Whole chicken: 1.5 kg each
- Lemons/limes: 100g each`;

export async function parseInvoiceWithClaude(
  documentBase64: string,
  mediaType: "application/pdf" | "text/csv" | "text/plain",
): Promise<InvoiceParseResult> {
  const client = new Anthropic();

  const documentBlock =
    mediaType === "application/pdf"
      ? {
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: documentBase64 },
        }
      : {
          type: "text" as const,
          text: `Invoice content (${mediaType}):\n\n${Buffer.from(documentBase64, "base64").toString("utf8")}`,
        };

  const response = await client.messages.parse({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_INSTRUCTIONS,
    messages: [
      {
        role: "user",
        content: [
          documentBlock,
          {
            type: "text",
            text: "Extract every product line and compute price per kg for each.",
          },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(InvoiceSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("Claude response did not match the schema");
  }

  return response.parsed_output;
}

export type InvoiceMatch = {
  rawName: string;
  packDescription: string;
  packPrice: number;
  estimatedPricePerKg: number;
  notes?: string;
  matchedIngredientId: string | null;
  matchedIngredientName: string | null;
  matchScore: number;
};

export function fuzzyMatchInvoiceLines(
  lines: InvoiceParseResult["lines"],
  ingredients: Array<{ id: string; name: string }>,
): InvoiceMatch[] {
  return lines.map((line) => {
    const tokens = line.rawName
      .toLowerCase()
      .split(/[\s,/]+/)
      .filter((t) => t.length > 2);
    let best: { id: string; name: string; score: number } | null = null;
    for (const ing of ingredients) {
      const haystack = ing.name.toLowerCase();
      let score = 0;
      for (const t of tokens) if (haystack.includes(t)) score += 1;
      if (score > 0 && (!best || score > best.score)) {
        best = { id: ing.id, name: ing.name, score };
      }
    }
    const acceptable = best && best.score >= 1;
    return {
      rawName: line.rawName,
      packDescription: line.packDescription,
      packPrice: line.packPrice,
      estimatedPricePerKg: line.estimatedPricePerKg,
      notes: line.notes,
      matchedIngredientId: acceptable ? best!.id : null,
      matchedIngredientName: acceptable ? best!.name : null,
      matchScore: best?.score ?? 0,
    };
  });
}
