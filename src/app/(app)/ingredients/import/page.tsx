import { listIngredients } from "@/db/queries";
import { InvoiceImportForm } from "@/components/invoice-import-form";

export const dynamic = "force-dynamic";

export default async function InvoiceImportPage() {
  const ingredients = await listIngredients();
  return <InvoiceImportForm ingredients={ingredients} />;
}
