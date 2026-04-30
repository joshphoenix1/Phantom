import Link from "next/link";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipes", label: "Recipes" },
  { href: "/recipes/new", label: "New recipe" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/roadmap", label: "Roadmap" },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-ink-600/60 bg-ink-900/80 backdrop-blur-sm flex flex-col">
      <div className="px-7 pt-8 pb-7 border-b border-ink-600/60">
        <div className="font-display text-4xl font-light tracking-tight text-cream-50">
          Phantom
        </div>
        <div className="mt-2 eyebrow text-cream-500">Britomart Kitchens</div>
        <div className="mt-4 h-px w-10 bg-vermillion" />
        <div className="mt-3 font-display italic text-base text-cream-300">
          Cafe Hanoi <span className="text-cream-500">·</span> Ghost Street
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-3 rounded-sm hover:bg-ink-700/60 transition-colors text-base text-cream-100 hover:text-cream-50"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-7 pb-7 pt-4 border-t border-ink-600/60">
        <div className="eyebrow mb-2">Service</div>
        <div className="font-mono text-sm text-cream-400 leading-relaxed">
          v0.1 · Auckland<br />
          NZD · whole-dollar pricing
        </div>
      </div>
    </aside>
  );
}
