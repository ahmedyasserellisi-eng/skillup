import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, type Locale } from "@/i18n";
import { MotionDiv, MotionSection, fadeUp, stagger } from "@/components/motion";
import { supabaseServer } from "@/lib/supabase-server";

type Program = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  youtube_playlist: string | null;
  cover_url: string | null;
  extra_images: string[] | null;
  created_at: string | null;
  is_published?: boolean | null;
  is_featured_home?: boolean | null;
  featured_order?: number | null;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function extractPlaylistId(input: string) {
  const value = (input || "").trim();
  if (!value) return "";

  if (
    !value.includes("http") &&
    !value.includes("youtube") &&
    !value.includes("youtu.be")
  ) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.searchParams.get("list") || "";
  } catch {
    return "";
  }
}

function stripHtml(html: string) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function pickText(locale: "ar" | "en", ar?: string | null, en?: string | null) {
  return locale === "ar" ? ar || en || "" : en || ar || "";
}

function formatDate(locale: "ar" | "en", value?: string | null) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  } catch {
    return "";
  }
}

export default async function ProgramsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();

  const safeLocale = locale as Locale;
  const isAr = safeLocale === "ar";

  setRequestLocale(safeLocale);
  const t = await getTranslations({ locale: safeLocale, namespace: "programs" });

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("programs")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(100);

  // ثوابت التصميم المتناسقة مع الهوية الرسمية (Navy #182B36 & Gold #C8A448)
  const glass =
    "rounded-[28px] border border-black/10 bg-white/78 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60";
  const softCard =
    "rounded-2xl border border-black/10 bg-white/90 dark:border-white/10 dark:bg-zinc-950/45";
  const cardHover =
    "transition duration-300 will-change-transform hover:-translate-y-1 hover:border-[#182B36]/20 hover:shadow-xl hover:shadow-[#182B36]/5 dark:hover:border-[#C8A448]/20 dark:hover:shadow-black/30";
  const pill =
    "rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200";
  const softPill =
    "rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-300";
  const primaryBtn =
    "inline-flex items-center justify-center rounded-2xl bg-[#182B36] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#182B36]/90 active:scale-[0.99] dark:bg-[#C8A448] dark:text-zinc-950 dark:hover:bg-[#C8A448]/90";
  const secondaryBtn =
    "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/90 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white";

  if (error) {
    return (
      <div className={cx(glass, "p-6 text-sm text-zinc-700 dark:text-zinc-200")}>
        {isAr ? "تعذر تحميل البرامج حاليًا." : "Unable to load programs right now."}
      </div>
    );
  }

  const rows = (data ?? []) as Program[];
  const featuredPrograms = rows
    .filter((program) => program.is_featured_home)
    .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
  const regularPrograms = rows.filter((program) => !program.is_featured_home);
  const listingPrograms = featuredPrograms.length > 0 ? regularPrograms : rows;
  const href = (path: string) => `/${safeLocale}${path}`;

  return (
    <div className="grid gap-8">
      {/* الهيدر الرئيسي مضاف إليه هالات إضاءة الهوية */}
      <MotionSection
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={cx("relative overflow-hidden p-7 md:p-10", glass)}
      >
        <div className="absolute inset-0 -z-20 bg-grid opacity-45" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-[#182B36]/5 to-transparent dark:from-[#C8A448]/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#182B36]/5 blur-3xl dark:bg-[#C8A448]/10" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#182B36]/5 blur-3xl dark:bg-[#C8A448]/5" />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="grid gap-4">
            <div className={cx("inline-flex w-fit items-center gap-2", pill)}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#182B36] dark:bg-[#C8A448]" />
              <span>{isAr ? "برامج SkillUp" : "SkillUp Programs"}</span>
            </div>

            <div className="grid gap-3">
              <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white md:text-5xl">
                {t("title")}
              </h1>
              <p className="max-w-3xl text-sm leading-8 text-zinc-600 dark:text-zinc-300 md:text-base">
                {t("desc")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={href("/join")} className={primaryBtn}>
                {isAr ? "انضم إلينا" : "Join us"}
              </Link>
              <Link href={href("/contact")} className={secondaryBtn}>
                {isAr ? "تواصل معنا" : "Contact us"}
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isAr ? "إجمالي البرامج" : "Total programs"}
              </div>
              <div className="mt-2 text-2xl font-extrabold text-zinc-950 dark:text-white">
                {rows.length}
              </div>
            </div>

            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isAr ? "برامج مميزة" : "Featured programs"}
              </div>
              <div className="mt-2 text-2xl font-extrabold text-zinc-950 dark:text-white">
                {featuredPrograms.length}
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {rows.length === 0 ? (
        <div className={cx("p-10 text-center", glass)}>
          <div className="text-lg font-bold text-zinc-950 dark:text-white">
            {isAr ? "لا توجد برامج منشورة حاليًا" : "No published programs yet"}
          </div>
          <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "بمجرد إضافة البرامج ونشرها من لوحة التحكم ستظهر هنا تلقائيًا."
              : "Programs will appear here automatically once they are published from the admin dashboard."}
          </p>
          <div className="mt-5 flex justify-center">
            <Link href={href("/")} className={secondaryBtn}>
              {isAr ? "العودة للرئيسية" : "Back to home"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* قسم البرامج المميزة مضاف إليه تحسين توازن الارتفاع بالـ flex layout */}
          {featuredPrograms.length > 0 ? (
            <section className="grid gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                    {isAr ? "البرامج المميزة" : "Featured Programs"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? "مجموعة مختارة من البرامج التي نبرزها حاليًا على الموقع."
                      : "A curated selection of programs currently highlighted on the website."}
                  </p>
                </div>
              </div>

              <MotionDiv
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {featuredPrograms.map((program) => {
                  const title = pickText(safeLocale, program.title_ar, program.title_en);
                  const excerpt = stripHtml(
                    pickText(safeLocale, program.description_ar, program.description_en)
                  ).slice(0, 140);
                  const playlistId = extractPlaylistId(program.youtube_playlist || "");

                  return (
                    <MotionDiv key={program.id} variants={fadeUp} className="h-full">
                      <Link
                        href={href(`/programs/${program.id}`)}
                        className={cx(
                          "group flex flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white/78 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60 h-full",
                          cardHover
                        )}
                      >
                        <div className="relative aspect-[16/9] w-full bg-zinc-50 dark:bg-white/5 shrink-0">
                          {program.cover_url ? (
                            <img
                              src={program.cover_url}
                              alt={title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                              {isAr ? "صورة البرنامج غير متاحة" : "Program image unavailable"}
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          <div className="absolute left-3 top-3">
                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                              {isAr ? "مميز" : "Featured"}
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                            <div className="line-clamp-1 text-sm font-bold text-white">
                              {title}
                            </div>
                            <div className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur">
                              {playlistId
                                ? isAr ? "يتضمن فيديوهات" : "Includes videos"
                                : isAr ? "برنامج" : "Program"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col flex-1 p-5 justify-between gap-4">
                          <p className="line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            {excerpt ||
                              (isAr ? "وصف البرنامج قيد الإعداد." : "Program description is coming soon.")}
                          </p>
                          <div className="pt-1 flex items-center justify-between gap-3 mt-auto">
                            <span className="text-sm font-bold text-[#182B36] dark:text-[#C8A448] group-hover:underline">
                              {isAr ? "عرض التفاصيل ←" : "View details ←"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </MotionDiv>
                  );
                })}
              </MotionDiv>
            </section>
          ) : null}

          {/* قسم باقي البرامج التلقائي */}
          {listingPrograms.length > 0 ? (
            <section className="grid gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                    {featuredPrograms.length > 0
                      ? isAr ? "باقي البرامج" : "More Programs"
                      : isAr ? "كل البرامج" : "All Programs"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? "تصفح البرامج المتاحة وتعرّف على محتواها وتفاصيلها."
                      : "Browse the available programs and explore their details."}
                  </p>
                </div>
              </div>

              <MotionDiv
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {listingPrograms.map((program) => {
                  const title = pickText(safeLocale, program.title_ar, program.title_en);
                  const excerpt = stripHtml(
                    pickText(safeLocale, program.description_ar, program.description_en)
                  ).slice(0, 160);
                  const playlistId = extractPlaylistId(program.youtube_playlist || "");
                  const dateText = formatDate(safeLocale, program.created_at);

                  return (
                    <MotionDiv key={program.id} variants={fadeUp} className="h-full">
                      <article className={cx("group overflow-hidden flex flex-col h-full", glass, cardHover)}>
                        <div className="relative aspect-[16/9] w-full bg-zinc-50 dark:bg-white/5 shrink-0">
                          {program.cover_url ? (
                            <img
                              src={program.cover_url}
                              alt={title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                              {isAr ? "صورة البرنامج غير متاحة" : "Program image unavailable"}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col flex-1 p-5 justify-between gap-4">
                          <div className="grid gap-2">
                            <h3 className="line-clamp-1 text-lg font-bold text-zinc-950 dark:text-white">
                              {title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {dateText ? (
                                <span className={softPill}>
                                  {isAr ? "تاريخ الإضافة" : "Published"}: {dateText}
                                </span>
                              ) : null}
                              <span className={softPill}>
                                {playlistId
                                  ? isAr ? "فيديوهات متاحة" : "Videos available"
                                  : isAr ? "بدون فيديوهات" : "No videos"}
                              </span>
                            </div>
                          </div>

                          <p className="line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                            {excerpt || (isAr ? "وصف البرنامج قيد الإعداد." : "Program description is coming soon.")}
                          </p>

                          <div className="mt-auto pt-2 flex flex-wrap gap-2 items-center justify-between">
                            {playlistId ? (
                              <a
                                href={`https://www.youtube.com/playlist?list=${playlistId}`}
                                target="_blank"
                                rel="noreferrer"
                                className={secondaryBtn}
                              >
                                {t("actions.watchPlaylist")}
                              </a>
                            ) : (
                              <span className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-400 dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-500">
                                {isAr ? "لا توجد قائمة تشغيل" : "No playlist"}
                              </span>
                            )}

                            <Link href={href(`/programs/${program.id}`)} className={primaryBtn}>
                              {t("actions.viewDetails")}
                            </Link>
                          </div>
                        </div>
                      </article>
                    </MotionDiv>
                  );
                })}
              </MotionDiv>
            </section>
          ) : null}
        </>
      )}

      {/* الـ CTA سيكشن السفلي */}
      <MotionSection
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className={cx("p-6 md:p-7", glass)}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {isAr ? "هل تريد الانضمام إلى أحد المسارات؟" : "Interested in joining a track?"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {isAr
                ? "تصفح البرامج المناسبة لك، ثم قدّم طلب الانضمام أو تواصل معنا لمعرفة المسار الأنسب."
                : "Explore the programs that fit you, then submit your application or contact us to choose the right path."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={href("/join")} className={primaryBtn}>
              {isAr ? "قدّم الآن" : "Apply now"}
            </Link>
            <Link href={href("/contact")} className={secondaryBtn}>
              {isAr ? "تواصل معنا" : "Contact us"}
            </Link>
          </div>
        </div>
      </MotionSection>
    </div>
  );
}
