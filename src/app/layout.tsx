import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plate — Food Cost",
  description: "AI-assisted food costing for NZ kitchens",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text font-sans antialiased">{children}</body>
    </html>
  );
}
