export const revalidate = 0;
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";

import { SECTORS } from "@/lib/sectors-data";
import { supabaseServer } from "@/lib/supabase-server";
import { MotionDiv, MotionSection, fadeUp, stagger } from "@/components/motion";

type MonthlyAwardsRow = {
  award_month: string;
  best_sector_slug: string | null;

  best_head_name: string | null;
  best_head_sector_slug: string | null;
  best_head_photo_url: string | null;

  best_deputy_name: string | null;
  best_deputy_sector_slug: string | null;
  best_deputy_photo_url: string | null;

  is_published: boolean;
};

type SectorTopRow = {
  award_month: string;
  sector_slug: string;
  member_name: string;
  member_photo_url: string | null;
  member_role: string | null;
  sort_order: number;
  is_published: boolean;
};

function cx(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

function getSector(slug: string | null | undefined) {
  if (!slug) return null;
  return SECTORS.find((s) => s.slug === slug) ?? null;
}

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

function formatMonth(locale: "ar" | "en", val?: string | null) {
  if (!val) return "";
  try {
    const d = new Date(val);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long"
    });
  } catch {
    return "";
  }
}

function getHighlightsTitle(locale: "ar" | "en", monthText?: string) {
  if (monthText) {
    return locale === "ar"
      ? `تكريمات ${monthText}`
      : `Monthly Highlights — ${monthText}`;
  }

  return locale === "ar" ? "الافضل لشهر" : "Monthly Highlights";
}

function glass() {
  return "rounded-[28px] border border-black/10 bg-white/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/40";
}

function glassHover() {
  return "transition duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:bg-white/70 hover:shadow-md dark:hover:border-white/20 dark:hover:bg-zinc-950/50";
}

const primaryBtn =
  "inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300";

const secondaryBtn =
  "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-white/90 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-950/60";

const subtlePill =
  "rounded-full border border-black/10 bg-white/75 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-300";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return {
    title: `${locale === "ar" ? "الافضل علي مدار الشهر" : "Monthly Highlights"} | SkillUp`,
    description:
      locale === "ar"
        ? "عرض الافضل خلال الشهر: أفضل قطاع وأفضل أعضاء في كل قطاع."
      : "Monthly highlights: best sector and top members per sector."
  };
}

export default async function HighlightsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === "ar";
  const sb = supabaseServer();

  const { data: awardsRow, error: awardsErr } = await sb
    .from("monthly_awards")
    .select(
      "award_month,best_sector_slug,best_head_name,best_head_sector_slug,best_head_photo_url,best_deputy_name,best_deputy_sector_slug,best_deputy_photo_url,is_published"
    )
    .eq("is_published", true)
    .order("award_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (awardsErr) {
    return (
      <div className={cx(glass(), "p-6 text-sm")}>
        {isAr ? "حدث خطأ أثناء تحميل التكريمات." : "Failed to load highlights."}
      </div>
    );
  }

  if (!awardsRow) {
    return (
      <div className="grid gap-4">
        <div className={cx(glass(), "p-8 text-center")}>
          <div className="text-xl font-semibold text-zinc-900 dark:text-white">
            {isAr ? "الافضل لشهر" : "Monthly Highlights"}
          </div>

          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {isAr
              ? "لا يوجد تكريمات منشورة حاليًا. سيتم نشرها من لوحة التحكم قريبًا."
              : "No published highlights yet. They will appear once published from admin."}
          </div>

          <div className="mt-5">
            <Link href={`/${locale}`} className={secondaryBtn}>
              {isAr ? "العودة إلى الرئيسية" : "Back to Home"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const awards = awardsRow as MonthlyAwardsRow;
  const monthText = formatMonth(locale, awards.award_month);
  const pageTitle = getHighlightsTitle(locale, monthText);

  const { data: topsRows, error: topsErr } = await sb
    .from("sector_monthly_top")
    .select(
      "award_month,sector_slug,member_name,member_photo_url,member_role,sort_order,is_published"
    )
    .eq("award_month", awards.award_month)
    .eq("is_published", true)
    .order("sector_slug", { ascending: true })
    .order("sort_order", { ascending: true });

  if (topsErr) {
    return (
      <div className={cx(glass(), "p-6 text-sm")}>
        {isAr ? "حدث خطأ أثناء تحميل أفضل الأعضاء." : "Failed to load top members."}
      </div>
    );
  }

  const bySector = new Map<string, SectorTopRow[]>();

  for (const r of (topsRows ?? []) as SectorTopRow[]) {
    const name = (r.member_name ?? "").trim();
    if (!name) continue;
    const arr = bySector.get(r.sector_slug) ?? [];
    arr.push(r);
    bySector.set(r.sector_slug, arr);
  }

  const bestSector = getSector(awards.best_sector_slug);
  const bestHeadSector = getSector(awards.best_head_sector_slug);
  const bestDeputySector = getSector(awards.best_deputy_sector_slug);

  const href = (p: string) => `/${locale}${p}`;

  return (
    <div className="grid gap-10">
      <MotionSection
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={cx(glass(), "relative overflow-hidden p-7 md:p-8")}
      >
        <div className="absolute inset-0 -z-10 bg-grid opacity-50" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-black/5 blur-3xl dark:bg-white/5" />

        <div className="grid gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-white" />
            {isAr ? "تكريمات الفريق" : "Team Highlights"}
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold leading-tight text-zinc-900 dark:text-white md:text-5xl">
                {pageTitle}
              </h1>

              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
                {isAr
                  ? "عرض شهري يبرز التميز والالتزام داخل القطاعات، ويعكس ثقافة التقدير والتطور داخل الفريق."
                  : "A monthly spotlight celebrating commitment, excellence, and a culture of appreciation across the team."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={href("/join")} className={primaryBtn}>
                {isAr ? "انضم إلينا" : "Join Us"}
              </Link>

              <Link href={href("/sectors")} className={secondaryBtn}>
                {isAr ? "استعرض القطاعات" : "Explore Sectors"}
              </Link>
            </div>
          </div>
        </div>
      </MotionSection>

      <MotionSection
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        <MotionDiv variants={fadeUp} className={cx(glass(), glassHover(), "p-6")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {isAr ? "أفضل قطاع" : "Best Sector"}
              </div>

              <div className="mt-2 text-xl font-bold text-zinc-900 dark:text-white">
                {bestSector ? (isAr ? bestSector.name_ar : bestSector.name_en) : "—"}
              </div>

              {bestSector ? (
                <div className="mt-1 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {isAr ? bestSector.note_ar : bestSector.note_en}
                </div>
              ) : null}
            </div>

            {bestSector ? (
              <div className="rounded-2xl border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-300">
                {bestSector.short}
              </div>
            ) : null}
          </div>
        </MotionDiv>

        <MotionDiv variants={fadeUp} className={cx(glass(), glassHover(), "p-6")}>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {isAr ? "أفضل رئيس قطاع" : "Best Head"}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
              {awards.best_head_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={awards.best_head_photo_url}
                  alt={awards.best_head_name ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                  N/A
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="line-clamp-1 text-lg font-bold text-zinc-900 dark:text-white">
                {awards.best_head_name ?? "—"}
              </div>

              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {bestHeadSector
                  ? `${isAr ? bestHeadSector.name_ar : bestHeadSector.name_en} • ${bestHeadSector.short}`
                  : "—"}
              </div>
            </div>
          </div>
        </MotionDiv>

        <MotionDiv variants={fadeUp} className={cx(glass(), glassHover(), "p-6")}>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {isAr ? "أفضل نائب" : "Best Deputy"}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
              {awards.best_deputy_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={awards.best_deputy_photo_url}
                  alt={awards.best_deputy_name ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                  N/A
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="line-clamp-1 text-lg font-bold text-zinc-900 dark:text-white">
                {awards.best_deputy_name ?? "—"}
              </div>

              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {bestDeputySector
                  ? `${isAr ? bestDeputySector.name_ar : bestDeputySector.name_en} • ${bestDeputySector.short}`
                  : "—"}
              </div>
            </div>
          </div>
        </MotionDiv>
      </MotionSection>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {isAr ? "أفضل عضوين من كل قطاع" : "Top 2 per Sector"}
            </h2>

            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {isAr
                ? "عرض لأكثر عضوين تميزًا داخل كل قطاع خلال هذا الشهر."
                : "A showcase of the two most outstanding members in each sector this month."}
            </p>
          </div>

          <Link
            href={href("/sectors")}
            className="text-sm font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          >
            {isAr ? "استعرض القطاعات" : "View Sectors"}
          </Link>
        </div>

        <MotionDiv
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {SECTORS.map((s) => {
            const winners = bySector.get(s.slug) ?? [];
            const first = winners.find((x) => x.sort_order === 1) ?? null;
            const second = winners.find((x) => x.sort_order === 2) ?? null;

            return (
              <MotionDiv
                key={s.slug}
                variants={fadeUp}
                className={cx(glass(), glassHover(), "p-6")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {s.short}
                    </div>

                    <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      {isAr ? s.name_ar : s.name_en}
                    </div>

                    <div className="mt-1 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                      {isAr ? s.note_ar : s.note_en}
                    </div>
                  </div>

                  <div className={subtlePill}>
                    {isAr ? "القطاع" : "Sector"}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                    <div className="w-7 shrink-0 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      1
                    </div>

                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                      {first?.member_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={first.member_photo_url}
                          alt={first.member_name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-white">
                        {first?.member_name || (isAr ? "غير محدد" : "Not set")}
                      </div>

                      <div className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {first?.member_role || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                    <div className="w-7 shrink-0 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      2
                    </div>

                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                      {second?.member_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={second.member_photo_url}
                          alt={second.member_name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-white">
                        {second?.member_name || (isAr ? "غير محدد" : "Not set")}
                      </div>

                      <div className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {second?.member_role || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            );
          })}
        </MotionDiv>
      </section>

      <div className="flex justify-center">
        <Link href={href("/")} className={secondaryBtn}>
          {isAr ? "العودة إلى الرئيسية" : "Back to Home"}
        </Link>
      </div>
    </div>
  );
}
