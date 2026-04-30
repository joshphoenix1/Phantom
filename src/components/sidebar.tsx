import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipes", label: "Recipes" },
  { href: "/recipes/new", label: "New recipe" },
  { href: "/ingredients", label: "Ingredients" },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-panel/60 p-5 flex flex-col gap-6">
      <div>
        <div className="text-lg font-semibold tracking-tight">Plate</div>
        <div className="text-xs text-muted">Nathan&apos;s Kitchens</div>
      </div>
      <nav className="flex flex-col gap-1 text-sm">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 rounded hover:bg-border/40 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-muted">
        v0.0.1 · NZ · GST 15%
      </div>
    </aside>
  );
}
