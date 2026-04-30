import { NextResponse } from "next/server";
import { listIngredients } from "@/db/queries";
import { fuzzyMatchInvoiceLines, parseInvoiceWithClaude } from "@/lib/invoice-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set. Invoice import requires Claude (no regex fallback for this)." },
      { status: 503 },
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Expected multipart form" }, { status: 400 });

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const mediaType =
    file.type === "application/pdf"
      ? "application/pdf"
      : file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")
        ? "text/csv"
        : "text/plain";

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  try {
    const parsed = await parseInvoiceWithClaude(base64, mediaType);
    const ingredients = await listIngredients();
    const matched = fuzzyMatchInvoiceLines(parsed.lines, ingredients);

    return NextResponse.json({
      supplier: parsed.supplier,
      invoiceDate: parsed.invoiceDate ?? null,
      lines: matched,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    console.error("Invoice parse failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
