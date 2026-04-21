import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";
import { SECTORS } from "@/lib/sectors-data";
import { supabaseServer } from "@/lib/supabase-server";

type StarRow = {
  id: string;
  month: string; // date
  sector_slug: string;
  rank: number; // 1 or 2
  name: string;
  title: string | null;
  photo_url: string | null;
  profile_url: string | null;
};

function monthStartISO(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = "01";
  return `${yyyy}-${mm}-${dd}`;
}

export default async function StarsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const sp = (await searchParams) ?? {};
  const month = sp.month || monthStartISO(); // default الشهر الحالي
  const isAr = locale === "ar";

  const sb = supabaseServer();
  const { data } = await sb
    .from("sector_stars")
    .select("id,month,sector_slug,rank,name,title,photo_url,profile_url")
    .eq("month", month)
    .order("sector_slug", { ascending: true })
    .order("rank", { ascending: true });

  const rows = (data ?? []) as StarRow[];

  const bySector = new Map<string, StarRow[]>();
  for (const r of rows) {
    const arr = bySector.get(r.sector_slug) ?? [];
    arr.push(r);
    bySector.set(r.sector_slug, arr);
  }

  const title = isAr ? "أفضل 2 شهريًا من كل قطاع" : "Top 2 Monthly per Sector";
  const subtitle = isAr
    ? `شهر ${month}`
    : `Month ${month}`;

  const href = (p: string) => `/${locale}${p}`;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm opacity-75">{subtitle}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={href("/sectors")}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            {isAr ? "عرض القطاعات" : "View sectors"}
          </Link>

          <Link
            href={href(`/stars?month=${monthStartISO(new Date(new Date().setMonth(new Date().getMonth() - 1)))}`)}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            {isAr ? "الشهر السابق" : "Previous month"}
          </Link>

          <Link
            href={href(`/stars?month=${monthStartISO()}`)}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
          >
            {isAr ? "هذا الشهر" : "This month"}
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTORS.map((s) => {
          const winners = (bySector.get(s.slug) ?? []).slice(0, 2);

          return (
            <section
              key={s.slug}
              className="rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold opacity-70">{s.short}</div>
                  <div className="mt-1 text-lg font-semibold">
                    {isAr ? s.name_ar : s.name_en}
                  </div>
                </div>

                <Link
                  href={href(`/join?sector=${encodeURIComponent(s.slug)}`)}
                  className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-xs font-semibold hover:bg-white/80 dark:border-white/10 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60"
                >
                  {isAr ? "قدّم" : "Apply"}
                </Link>
              </div>

              {winners.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4 text-sm opacity-75 dark:border-white/10 dark:bg-zinc-950/40">
                  {isAr ? "لم يتم إعلان الأفضل لهذا الشهر بعد." : "No winners announced yet."}
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {winners.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-zinc-950/40"
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                        {w.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.photo_url} alt={w.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs opacity-70">
                            {w.rank === 1 ? "🥇" : "🥈"}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold line-clamp-1">{w.name}</div>
                          <span className="text-xs opacity-75">
                            {w.rank === 1 ? "🥇" : "🥈"}
                          </span>
                        </div>
                        {w.title ? (
                          <div className="text-xs opacity-70 line-clamp-1">{w.title}</div>
                        ) : null}
                      </div>

                      {w.profile_url ? (
                        <a
                          href={w.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto rounded-xl border border-black/10 px-3 py-2 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                        >
                          {isAr ? "الملف" : "Profile"}
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="text-xs opacity-60">
        {isAr
          ? "لو أنت Admin: عدّل الأفضل من لوحة التحكم."
          : "If you’re admin: update winners from the admin panel."}
      </div>
    </div>
  );
}