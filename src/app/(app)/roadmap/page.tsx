import { listIngredients, listRecipes } from "@/db/queries";

export const dynamic = "force-dynamic";

type Item = {
  title: string;
  why: string;
  what: string;
  effort?: "small" | "medium" | "large";
  flagship?: boolean;
};

type Section = {
  label: string;
  blurb: string;
  items: Item[];
};

const SECTIONS: Section[] = [
  {
    label: "Auto-data",
    blurb: "Stop typing prices. The biggest time-saver — none of this is theoretical, just plumbing.",
    items: [
      {
        title: "Email-in supplier invoices",
        what: "A unique inbox per kitchen (e.g. cafehanoi@invoices.phantom.nz). Forward Bidfood / Gilmours / Service Foods PDFs as they arrive — Claude extracts line items, normalises to $/kg, matches against the master list, applies the price changes, posts a digest to Slack.",
        why: "The current invoice import is manual upload. Email-in turns it into a zero-touch pipeline. Two minutes a week instead of half an hour.",
        effort: "medium",
        flagship: true,
      },
      {
        title: "Weekly price-list ingestion",
        what: "Most NZ wholesalers email a weekly price list. Same Claude pipeline as invoices, scheduled. Catches price moves before you place the order.",
        why: "Plate cost stays accurate without anyone touching the master list.",
        effort: "small",
      },
      {
        title: "POS integration",
        what: "Pull actual sales counts from Lightspeed / Vend / Mr Yum. Combine with margin: which dishes are both profitable AND popular vs. high-margin-but-unsold.",
        why: "Margin alone is half the picture. A 80%-margin dish that sells 2/week is worth less than a 65%-margin dish that sells 200/week. Menu engineering needs both.",
        effort: "large",
      },
    ],
  },
  {
    label: "Pricing intelligence",
    blurb: "Beyond cost-plus — actually decide what to keep, push, retire.",
    items: [
      {
        title: "Menu engineering matrix",
        what: "Classic 2×2 from sales × margin: stars (push), plowhorses (re-cost), puzzles (re-market), dogs (cut). Auto-classify every dish.",
        why: "Standard chef's tool, currently done by hand once a quarter at most. Live version updates daily.",
        effort: "small",
      },
      {
        title: "Price-rise simulator",
        what: "“If beef goes up 10%, which dishes drop below target?” Slider per ingredient, recompute every plate cost.",
        why: "Negotiate harder with suppliers when you know exactly what their next price hike will cost across the menu.",
        effort: "small",
      },
      {
        title: "Cost trend graphs",
        what: "Per-ingredient and per-dish cost time-series. Spot supplier creep before margin disappears.",
        why: "Right now you can’t see “the chicken thigh price has crept up $0.50/kg over three months.” You only see today’s number.",
        effort: "medium",
      },
      {
        title: "Wastage tracking → true food cost",
        what: "Daily 30-second log of what got binned. Roll into true cost vs. theoretical cost, by station, by shift.",
        why: "Theoretical cost says you’re at 28%. Real food cost is probably 32–34% after wastage. Knowing the gap is half the fight.",
        effort: "medium",
      },
    ],
  },
  {
    label: "Recipe modelling",
    blurb: "What the current data model can't express — and chefs complain about.",
    items: [
      {
        title: "Sub-recipes / preps",
        what: "A nuoc cham used across six dishes is one recipe, not six copies. Cost it once; every dish that uses it inherits the cost. When the fish sauce price moves, every dish downstream re-prices.",
        why: "This is the single most-requested feature in chef costing tools. Without it the data model leaks.",
        effort: "medium",
        flagship: true,
      },
      {
        title: "Batch / production sheets",
        what: "12L of pho stock costs $X. Per portion = $X / portions yielded. Print as a prep sheet for the kitchen.",
        why: "Prep recipes have different math than plate recipes. Currently we conflate them.",
        effort: "small",
      },
      {
        title: "Yield testing",
        what: "Built-in tool to record actual yields: weigh in 5kg of chicken thigh, weigh out 4.6kg trimmed = 92%. Save against the ingredient. Replace the estimates seeded in the system.",
        why: "Estimated yields are good for v0; real yields are how serious kitchens cost.",
        effort: "small",
      },
      {
        title: "Recipe versioning",
        what: "Every save creates a version. See “the Pollo al Pomodoro became 18% more expensive after we switched chicken suppliers in March.”",
        why: "Margin drift has causes. Versioning makes them visible.",
        effort: "medium",
      },
    ],
  },
  {
    label: "Kitchen workflow",
    blurb: "Move beyond costing into the daily ops Nathan already runs.",
    items: [
      {
        title: "Inventory / par levels",
        what: "Track stock per ingredient, set par levels, alert when low. Connect to supplier ordering once the auto-invoice pipeline is in.",
        why: "Closes the loop: prices in, recipes out, stock managed in between.",
        effort: "large",
      },
      {
        title: "Allergen tracking",
        what: "Flag every ingredient with allergens (gluten / dairy / nuts / shellfish / soy / sesame). Auto-roll up to dish level. Warn on menu changes.",
        why: "Compliance + reduces “is this gluten-free?” waiter cycles. NZ Food Act compliance.",
        effort: "small",
      },
      {
        title: "Prep schedules from forecasts",
        what: "Given last-month covers + this week’s bookings, generate the prep list per station per day.",
        why: "Currently a hand-written whiteboard. Generated lists save 30 minutes a day per section chef.",
        effort: "large",
      },
    ],
  },
  {
    label: "Multi-site reality",
    blurb: "Right now Phantom is single-org. Nathan has three kitchens; the model needs to grow.",
    items: [
      {
        title: "Proper venues + per-venue P&L",
        what: "Recipes scoped to venues. Shared ingredient master list across venues with per-venue overrides. Per-venue dashboards.",
        why: "Multi-site is on the schema in name only — needs real venue tables, role scoping, and aggregated views.",
        effort: "medium",
      },
      {
        title: "Auth + roles",
        what: "Clerk or Auth.js. Owner / exec chef / sous chef / read-only roles. Audit trail for sensitive edits.",
        why: "Anyone can edit anything right now. Fine for one user; not fine when sous chefs join.",
        effort: "small",
      },
      {
        title: "iPad / mobile mode",
        what: "Receiving on the kitchen floor — scan an invoice, edit prices, approve. Read-only dish breakdowns at the pass.",
        why: "Costing tools live on laptops. Kitchen happens at the bench. Bridge the two.",
        effort: "medium",
      },
    ],
  },
  {
    label: "Output",
    blurb: "Things Phantom should produce, not just track.",
    items: [
      {
        title: "Print-ready menu PDFs",
        what: "Take the recipes, sale prices, and dietary tags — generate a Cafe Hanoi-style typeset menu. Update prices once, regenerate menus everywhere.",
        why: "The menu PDF I parsed for the seed data was set in InDesign. Phantom can produce that directly from the source of truth.",
        effort: "medium",
      },
      {
        title: "Beverages costing",
        what: "Wine, cocktails, beer. Different margin dynamics — cocktails should be 78–85% margin, wine by-the-glass usually pours 5–6 times bottle cost.",
        why: "Currently food only. Drinks are usually the biggest margin contribution; we’re ignoring half the business.",
        effort: "medium",
      },
    ],
  },
];

export default async function RoadmapPage() {
  const [recipes, ingredients] = await Promise.all([listRecipes(), listIngredients()]);
  const flagshipCount = SECTIONS.flatMap((s) => s.items.filter((i) => i.flagship)).length;

  return (
    <div className="flex flex-col gap-14">
      <header className="border-b border-ink-600/60 pb-7">
        <div className="eyebrow mb-3">Roadmap</div>
        <h1 className="font-display text-7xl font-light tracking-tight text-cream-50">
          Where <span className="display-italic text-vermillion">Phantom</span> goes next
        </h1>
        <p className="mt-4 font-display italic text-cream-400 text-xl max-w-3xl">
          v0 covers plate cost across two kitchens, paste-to-cost recipes, and manual invoice import. v0.2 is about turning every &ldquo;you have to type that in&rdquo; into &ldquo;Phantom already knows.&rdquo;
        </p>
      </header>

      <section className="grid grid-cols-3 gap-5">
        <Stat label="Today" value={`${recipes.length} dishes`} subtitle={`${ingredients.length} ingredients · 2 kitchens`} />
        <Stat label="v0.2 themes" value={SECTIONS.length.toString()} subtitle="auto-data → workflow" />
        <Stat
          label="Flagship items"
          value={flagshipCount.toString()}
          subtitle="biggest time-savers"
          accent
        />
      </section>

      <div className="flex flex-col gap-14">
        {SECTIONS.map((section) => (
          <section key={section.label}>
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="font-display text-3xl font-medium text-cream-50">{section.label}</h2>
              <div className="eyebrow">{section.items.length} items</div>
            </div>
            <p className="font-display italic text-cream-400 text-xl mb-6 max-w-4xl">{section.blurb}</p>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {section.items.map((item) => (
                <article
                  key={item.title}
                  className="surface p-6 flex flex-col gap-4 group hover:border-vermillion/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-2xl text-cream-50 leading-tight">
                      {item.title}
                      {item.flagship && (
                        <span className="ml-3 text-sm px-2.5 py-0.5 rounded-sm bg-vermillion/15 text-vermillion-light border border-vermillion/40 font-mono uppercase tracking-eyebrow align-middle">
                          flagship
                        </span>
                      )}
                    </h3>
                    {item.effort && <EffortBadge level={item.effort} />}
                  </div>
                  <p className="text-base text-cream-200 leading-relaxed">{item.what}</p>
                  <div className="pt-3 border-t border-ink-600/60">
                    <div className="eyebrow text-cream-500 mb-1.5">Why</div>
                    <p className="text-base font-display italic text-cream-300 leading-relaxed">{item.why}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-ink-600/60 pt-7 text-base">
        <div className="font-display italic text-cream-400 text-lg">
          Pick the two or three that move Nathan&rsquo;s morning the most. Build those, ship, repeat.
        </div>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div className="stat-tile">
      <span className="eyebrow">{label}</span>
      <div className={`mt-1 font-display text-5xl font-light tracking-tight ${accent ? "text-vermillion" : "text-cream-50"}`}>
        {value}
      </div>
      {subtitle && <div className="text-sm font-mono text-cream-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function EffortBadge({ level }: { level: "small" | "medium" | "large" }) {
  const tone =
    level === "small"
      ? "border-bamboo/40 text-bamboo bg-bamboo/10"
      : level === "medium"
        ? "border-amber-warm/40 text-amber-warm bg-amber-warm/10"
        : "border-vermillion/40 text-vermillion-light bg-vermillion/10";
  return (
    <span className={`shrink-0 text-sm px-2.5 py-0.5 rounded-sm border font-mono uppercase tracking-eyebrow ${tone}`}>
      {level}
    </span>
  );
}
