import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MotionDiv, MotionSection, fadeUp, stagger } from "@/components/motion";
import { locales, type Locale } from "@/i18n";
import { SECTORS } from "@/lib/sectors-data";
import { supabaseServer } from "@/lib/supabase-server";

type FeaturedProgram = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  youtube_playlist: string | null;
  cover_url: string | null;
  featured_order: number | null;
};

type FeaturedEvent = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  event_type: string | null;
  location: string | null;
  event_date: string | null;
  image1_url: string | null;
  image2_url: string | null;
  featured_order: number | null;
};

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

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function stripHtml(html: string) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickText(isAr: boolean, ar?: string | null, en?: string | null) {
  return isAr ? ar || en || "" : en || ar || "";
}

function getSector(slug: string | null | undefined) {
  if (!slug) return null;
  return SECTORS.find((s) => s.slug === slug) ?? null;
}

function formatMonth(locale: "ar" | "en", value?: string | null) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long"
    });
  } catch {
    return "";
  }
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

function formatEventType(locale: "ar" | "en", value?: string | null) {
  const x = (value ?? "").toLowerCase().trim();

  if (x.includes("online") || x.includes("أونلاين")) {
    return locale === "ar" ? "أونلاين" : "Online";
  }

  if (x.includes("offline") || x.includes("أوفلاين")) {
    return locale === "ar" ? "أوفلاين" : "Offline";
  }

  return locale === "ar" ? "فعالية" : "Event";
}

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();

  const safeLocale = locale as Locale;
  setRequestLocale(safeLocale);

  const isAr = safeLocale === "ar";
  const href = (path: string) => `/${safeLocale}${path}`;
  const t = await getTranslations("home");

  const heroBadge = isAr ? "فريق SkillUp" : "SkillUp Team";
  const heroSub = isAr
    ? "فريق شبابي يركز على تمكين الشباب من خلال تعلم تطبيقي يحاكي بيئة العمل ويقربهم من سوق العمل."
    : "A youth team focused on empowering young people through practical learning that simulates real work environments and connects them to the job market.";

  const glass =
    "rounded-[28px] border border-black/10 bg-white/78 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60";

  const softCard =
    "rounded-2xl border border-black/10 bg-white/88 dark:border-white/10 dark:bg-zinc-950/45";

  const cardHover =
    "transition duration-200 will-change-transform hover:-translate-y-1 hover:border-black/15 hover:shadow-lg hover:shadow-black/5 dark:hover:border-white/15 dark:hover:shadow-black/20";

  const pill =
    "rounded-full border border-black/10 bg-white/95 px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm dark:border-white/10 dark:bg-zinc-950/55 dark:text-zinc-200";

  const softPill =
    "rounded-full border border-black/10 bg-white/90 px-3 py-1 dark:border-white/10 dark:bg-zinc-950/45";

  const primaryBtn =
    "rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300";

  const secondaryBtn =
    "rounded-2xl border border-black/10 bg-white/90 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white";

  const ghostLink =
    "text-sm font-semibold text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white";

  const sb = supabaseServer();

  const [{ data: programsData }, { data: eventsData }, { data: awardsRow }] =
    await Promise.all([
      sb
        .from("programs")
        .select(
          "id,title_ar,title_en,description_ar,description_en,youtube_playlist,cover_url,featured_order"
        )
        .eq("is_published", true)
        .eq("is_featured_home", true)
        .order("featured_order", { ascending: true })
        .limit(3),

      sb
        .from("events")
        .select(
          "id,title_ar,title_en,description_ar,description_en,event_type,location,event_date,image1_url,image2_url,featured_order"
        )
        .eq("is_published", true)
        .eq("is_featured_home", true)
        .order("featured_order", { ascending: true })
        .limit(3),

      sb
        .from("monthly_awards")
        .select(
          "award_month,best_sector_slug,best_head_name,best_head_sector_slug,best_head_photo_url,best_deputy_name,best_deputy_sector_slug,best_deputy_photo_url,is_published"
        )
        .eq("is_published", true)
        .order("award_month", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

  const featuredPrograms = (programsData ?? []) as FeaturedProgram[];
  const featuredEvents = (eventsData ?? []) as FeaturedEvent[];
  const latestAwards = (awardsRow ?? null) as MonthlyAwardsRow | null;

  const bestSector = getSector(latestAwards?.best_sector_slug);
  const bestHeadSector = getSector(latestAwards?.best_head_sector_slug);
  const bestDeputySector = getSector(latestAwards?.best_deputy_sector_slug);
  const monthText = latestAwards ? formatMonth(safeLocale, latestAwards.award_month) : "";

  const whyItems = [
    {
      title: isAr ? "تجربة تحاكي بيئة العمل" : "Workplace-like experience",
      desc: isAr
        ? "نتعلم من خلال أدوار فعلية، وتعاون بين القطاعات، ومسؤوليات واضحة."
        : "Learn through real roles, cross-sector collaboration, and clear responsibilities."
    },
    {
      title: isAr ? "مهارات عملية قابلة للتطبيق" : "Practical skills",
      desc: isAr
        ? "برامج وأنشطة تساعد الشباب على اكتساب خبرة أقرب لسوق العمل."
        : "Programs and activities that build skills closer to the job market."
    },
    {
      title: isAr ? "مجتمع شبابي وفرص مشاركة" : "Youth community",
      desc: isAr
        ? "مساحة للنمو والمشاركة وصناعة أثر حقيقي من خلال الأنشطة والفعاليات."
        : "A space for growth, participation, and real impact through activities and events."
    }
  ];

  const heroHighlights = [
    {
      title: t("highlights.h1Title"),
      desc: t("highlights.h1Sub")
    },
    {
      title: t("highlights.h2Title"),
      desc: t("highlights.h2Sub")
    },
    {
      title: t("highlights.h3Title"),
      desc: t("highlights.h3Sub")
    }
  ];

  return (
    <div className="grid gap-12">
      <MotionSection
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={cx("relative overflow-hidden p-7 md:p-10", glass)}
      >
        <div className="absolute inset-0 -z-20 bg-grid opacity-50" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-sky-50/80 to-transparent dark:from-amber-400/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-100/45 blur-3xl dark:bg-amber-300/10" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-sky-100/35 blur-3xl dark:bg-amber-200/10" />

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[30px] bg-white/72 shadow-sm dark:bg-zinc-950/28" />

            <div className="grid gap-6 rounded-[30px] p-1 md:p-2">
              <div className={cx("inline-flex w-fit items-center gap-2", pill)}>
                <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-amber-300" />
                <span>{heroBadge}</span>
              </div>

              <div className="grid gap-4">
                <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-zinc-950 dark:text-white md:text-5xl">
                  {t("headline")}
                </h1>

                <p className="max-w-2xl text-sm leading-8 text-zinc-600 dark:text-zinc-300 md:text-base">
                  {heroSub}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={href("/join")} className={primaryBtn}>
                  {isAr ? "انضم إلينا" : "Join us"}
                </Link>

                <Link href={href("/programs")} className={secondaryBtn}>
                  {isAr ? "استكشف البرامج" : "Explore programs"}
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroHighlights.map((item, index) => (
                  <MotionDiv
                    key={index}
                    variants={fadeUp}
                    className={cx("rounded-2xl p-4", softCard)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>

                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {item.title}
                      </span>
                    </div>

                    <div className="mt-2 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                      {item.desc}
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={cx("p-5", softCard)}>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                {isAr ? "رحلة SkillUp" : "SkillUp journey"}
              </div>

              <div className="mt-4 grid gap-3">
                {[
                  isAr
                    ? "تدريب عملي يطور المهارات"
                    : "Practical training that builds skills",
                  isAr
                    ? "تجربة تعاون بين القطاعات"
                    : "Cross-sector collaboration experience",
                  isAr
                    ? "مشروعات وفعاليات تصنع أثرًا"
                    : "Projects and events that create impact"
                ].map((text, index) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/90 p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-[11px] font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-300">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                {isAr
                  ? "ابدأ من المكان الأنسب لك، وطور نفسك خطوة بخطوة."
                  : "Start where you fit best and grow step by step."}
              </div>
            </div>

            <div className={cx("p-5", softCard)}>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                {isAr ? "الخطوة التالية" : "Next step"}
              </div>

              <div className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {isAr
                  ? "لو دي أول زيارة ليك، ابدأ بالبرامج أو القطاعات، وبعدها قدّم للانضمام."
                  : "If this is your first visit, start with programs or sectors, then apply to join."}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={href("/sectors")} className={secondaryBtn}>
                  {isAr ? "القطاعات" : "Sectors"}
                </Link>

                <Link href={href("/events")} className={secondaryBtn}>
                  {isAr ? "الفعاليات" : "Events"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            {isAr ? "لماذا SkillUp" : "Why SkillUp"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "ليست مجرد متابعة، بل مساحة للتعلم بالممارسة والمشاركة."
              : "Not just observation, but a space for learning by doing."}
          </p>
        </div>

        <MotionDiv
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {whyItems.map((item, index) => (
            <MotionDiv
              key={item.title}
              variants={fadeUp}
              className={cx("p-5", glass, cardHover)}
            >
              <div className="inline-flex rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-300">
                {(index + 1).toString().padStart(2, "0")}
              </div>
              <div className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">
                {item.title}
              </div>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {item.desc}
              </p>
            </MotionDiv>
          ))}
        </MotionDiv>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {t("sections.programsTitle")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("sections.programsDesc")}
            </p>
          </div>

          <Link href={href("/programs")} className={ghostLink}>
            {t("sections.programsCta")} →
          </Link>
        </div>

        <MotionDiv
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 lg:grid-cols-3"
        >
          {featuredPrograms.length === 0 ? (
            <div className={cx("lg:col-span-3 p-6 text-sm", glass)}>
              <div className="font-semibold text-zinc-900 dark:text-white">
                {isAr ? "لا يوجد برامج مميزة حاليًا" : "No featured programs yet"}
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {isAr
                  ? "من لوحة الإدارة فعّل Published و Show on Home."
                  : "From admin, enable Published and Show on Home."}
              </div>
            </div>
          ) : (
            featuredPrograms.map((program) => {
              const title = pickText(isAr, program.title_ar, program.title_en) || "—";
              const desc = stripHtml(
                pickText(isAr, program.description_ar, program.description_en)
              ).slice(0, 130);

              return (
                <MotionDiv key={program.id} variants={fadeUp}>
                  <Link
                    href={href(`/programs/${program.id}`)}
                    className={cx(
                      "group block overflow-hidden rounded-[28px] border border-black/10 bg-white/78 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60",
                      cardHover
                    )}
                  >
                    <div className="relative aspect-[16/10] w-full bg-zinc-50 dark:bg-white/5">
                      {program.cover_url ? (
                        <img
                          src={program.cover_url}
                          alt={title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                          {isAr ? "صورة البرنامج" : "Program image"}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div className="line-clamp-1 text-sm font-bold text-white">
                          {title}
                        </div>

                        <div className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur">
                          {program.youtube_playlist
                            ? isAr
                              ? "سلسلة فيديو"
                              : "Playlist"
                            : isAr
                              ? "برنامج"
                              : "Program"}
                        </div>
                      </div>
                    </div>

                    <div className="grid min-h-[150px] gap-3 p-4">
                      <p className="line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                        {desc || (isAr ? "وصف قيد الإعداد" : "Description coming soon")}
                      </p>

                      <div className="mt-auto text-sm font-semibold text-sky-700 underline underline-offset-4 group-hover:text-sky-800 dark:text-amber-200 dark:group-hover:text-amber-100">
                        {isAr ? "عرض التفاصيل" : "View details"}
                      </div>
                    </div>
                  </Link>
                </MotionDiv>
              );
            })
          )}
        </MotionDiv>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {t("sections.eventsTitle")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("sections.eventsDesc")}
            </p>
          </div>

          <Link href={href("/events")} className={ghostLink}>
            {t("sections.eventsCta")} →
          </Link>
        </div>

        <MotionDiv
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 lg:grid-cols-3"
        >
          {featuredEvents.length === 0 ? (
            <div className={cx("lg:col-span-3 p-6 text-sm", glass)}>
              <div className="font-semibold text-zinc-900 dark:text-white">
                {isAr ? "لا يوجد فعاليات مميزة حاليًا" : "No featured events yet"}
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {isAr
                  ? "من لوحة الإدارة فعّل Published و Show on Home."
                  : "From admin, enable Published and Show on Home."}
              </div>
            </div>
          ) : (
            featuredEvents.map((event) => {
              const title = pickText(isAr, event.title_ar, event.title_en) || "—";
              const desc = stripHtml(
                pickText(isAr, event.description_ar, event.description_en)
              ).slice(0, 130);
              const tag = formatEventType(safeLocale, event.event_type);
              const dateText = formatDate(safeLocale, event.event_date);
              const cover = event.image1_url || event.image2_url;

              return (
                <MotionDiv key={event.id} variants={fadeUp}>
                  <Link
                    href={href(`/events/${event.id}`)}
                    className={cx(
                      "group block overflow-hidden rounded-[28px] border border-black/10 bg-white/78 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60",
                      cardHover
                    )}
                  >
                    <div className="relative aspect-[16/10] w-full bg-zinc-50 dark:bg-white/5">
                      {cover ? (
                        <img
                          src={cover}
                          alt={title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                          {isAr ? "صورة الفعالية" : "Event image"}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div className="line-clamp-1 text-sm font-bold text-white">
                          {title}
                        </div>

                        <div className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur">
                          {tag}
                        </div>
                      </div>
                    </div>

                    <div className="grid min-h-[170px] gap-3 p-4">
                      <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                        {dateText ? (
                          <span className={softPill}>
                            {isAr ? "التاريخ" : "Date"}: {dateText}
                          </span>
                        ) : null}

                        {event.location ? (
                          <span className={softPill}>
                            {isAr ? "المكان" : "Location"}: {event.location}
                          </span>
                        ) : null}
                      </div>

                      <p className="line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                        {desc || (isAr ? "تفاصيل قيد الإعداد" : "Details coming soon")}
                      </p>

                      <div className="mt-auto text-sm font-semibold text-sky-700 underline underline-offset-4 group-hover:text-sky-800 dark:text-amber-200 dark:group-hover:text-amber-100">
                        {isAr ? "عرض التفاصيل" : "View details"}
                      </div>
                    </div>
                  </Link>
                </MotionDiv>
              );
            })
          )}
        </MotionDiv>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {t("sections.sectorsTitle")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t("sections.sectorsDesc")}
            </p>
          </div>

          <Link href={href("/sectors")} className={ghostLink}>
            {t("sections.sectorsCta")} →
          </Link>
        </div>

        <MotionDiv
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {SECTORS.slice(0, 6).map((sector) => (
            <MotionDiv key={sector.slug} variants={fadeUp}>
              <Link
                href={href(`/sectors/${sector.slug}`)}
                className={cx("block p-5", glass, cardHover)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {sector.short}
                    </div>
                    <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      {isAr ? sector.name_ar : sector.name_en}
                    </div>
                  </div>

                  <div className={cx("shrink-0", pill)}>
                    {isAr ? "عرض" : "View"}
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {isAr ? sector.note_ar : sector.note_en}
                </p>

                <div className="mt-4 line-clamp-2 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {isAr ? "أبرز فائدة: " : "Key benefit: "}
                  </span>
                  {isAr ? sector.benefits_ar : sector.benefits_en}
                </div>
              </Link>
            </MotionDiv>
          ))}
        </MotionDiv>
      </section>

      <MotionSection
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className={cx(glass, "p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                {isAr ? "تكريمات الشهر" : "Monthly awards"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {latestAwards
                  ? isAr
                    ? "لمحة سريعة عن أفضل أداء هذا الشهر، والتفاصيل الكاملة داخل صفحة التكريمات."
                    : "A quick preview of this month's top performance, with full details on the awards page."
                  : isAr
                    ? "لا توجد تكريمات منشورة حاليًا."
                    : "No published awards yet."}
              </p>
            </div>

            <Link href={href("/highlights")} className={secondaryBtn}>
              {isAr ? "عرض التكريمات" : "View awards"}
            </Link>
          </div>

          {latestAwards ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className={cx("p-4", softCard)}>
                <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <span className={softPill}>
                    {isAr ? "الشهر" : "Month"}: {monthText || (isAr ? "الحالي" : "Current")}
                  </span>

                  {bestSector ? (
                    <span className={softPill}>
                      {isAr ? "أفضل قطاع" : "Best sector"}:{" "}
                      <span className="font-semibold">
                        {isAr ? bestSector.name_ar : bestSector.name_en}
                      </span>
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/90 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
                      {latestAwards.best_head_photo_url ? (
                        <img
                          src={latestAwards.best_head_photo_url}
                          alt={latestAwards.best_head_name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                          Photo
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isAr ? "أفضل رئيس قطاع" : "Best head"}
                      </div>
                      <div className="line-clamp-1 text-sm font-bold text-zinc-900 dark:text-white">
                        {latestAwards.best_head_name || "—"}
                      </div>
                      <div className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {bestHeadSector
                          ? isAr
                            ? bestHeadSector.name_ar
                            : bestHeadSector.name_en
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/90 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
                      {latestAwards.best_deputy_photo_url ? (
                        <img
                          src={latestAwards.best_deputy_photo_url}
                          alt={latestAwards.best_deputy_name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                          Photo
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {isAr ? "أفضل نائب" : "Best deputy"}
                      </div>
                      <div className="line-clamp-1 text-sm font-bold text-zinc-900 dark:text-white">
                        {latestAwards.best_deputy_name || "—"}
                      </div>
                      <div className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {bestDeputySector
                          ? isAr
                            ? bestDeputySector.name_ar
                            : bestDeputySector.name_en
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                  {isAr
                    ? "صفحة التكريمات تعرض الصورة الكاملة، بما فيها أفضل عضوين من كل قطاع."
                    : "The awards page shows the full picture, including the top two members in each sector."}
                </div>
              </div>

              <div className={cx("p-4", softCard)}>
                <div className="text-sm font-bold text-zinc-900 dark:text-white">
                  {isAr ? "استعرض التكريمات كاملة" : "See full awards"}
                </div>

                <div className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {isAr
                    ? "اعرض الفائزين، أفضل قطاع، وأفضل أعضاء الشهر بشكل كامل ومنظم."
                    : "Explore the winners, best sector, and top performers in a dedicated page."}
                </div>

                <Link href={href("/highlights")} className={cx("mt-4 inline-flex", primaryBtn)}>
                  {isAr ? "افتح التكريمات" : "Open awards"}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </MotionSection>

      <MotionSection
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className={cx("relative overflow-hidden p-7 md:p-8", glass)}
      >
        <div className="absolute inset-0 -z-10 bg-grid opacity-40" />

        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-950 dark:text-white">
              {isAr ? "جاهز تبدأ رحلتك مع SkillUp؟" : "Ready to start with SkillUp?"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-8 text-zinc-600 dark:text-zinc-300">
              {isAr
                ? "استكشف البرامج، تعرّف على القطاعات، وابدأ أول خطوة نحو تجربة عملية أقرب لسوق العمل."
                : "Explore programs, discover sectors, and take your first step toward a more practical experience."}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={href("/join")} className={primaryBtn}>
                {isAr ? "انضم إلينا" : "Join us"}
              </Link>

              <Link href={href("/contact")} className={secondaryBtn}>
                {isAr ? "تواصل معنا" : "Contact us"}
              </Link>

              <Link
                href="https://www.youtube.com/channel/UCGtdtBzfVIcJZCrwZC3d6sw"
                target="_blank"
                rel="noreferrer"
                className={secondaryBtn}
              >
                {isAr ? "قناة يوتيوب" : "YouTube channel"}
              </Link>
            </div>
          </div>

          <div className={cx("p-4 text-sm", softCard)}>
            <div className="font-bold text-zinc-900 dark:text-white">
              {isAr ? "البريد الرسمي" : "Official email"}
            </div>
            <div className="mt-2 text-zinc-600 dark:text-zinc-300">
              skillupyouth.eg@gmail.com
            </div>
          </div>
        </div>
      </MotionSection>
    </div>
  );
}
