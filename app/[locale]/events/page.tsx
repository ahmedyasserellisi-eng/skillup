import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { locales, type Locale } from "@/i18n";
import { MotionDiv, MotionSection, fadeUp, stagger } from "@/components/motion";
import { supabaseServer } from "@/lib/supabase-server";

type EventType = "online" | "offline";

type EventRow = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  event_type: EventType | null;
  location: string | null;
  event_date: string | null;
  image1_url: string | null;
  image2_url: string | null;
  created_at: string | null;
  is_published: boolean | null;
  is_featured_home: boolean | null;
  featured_order: number | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pickText(locale: "ar" | "en", ar?: string | null, en?: string | null) {
  return locale === "ar" ? ar || en || "" : en || ar || "";
}

function stripHtml(html?: string | null) {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(locale: "ar" | "en", value?: string | null) {
  if (!value) return locale === "ar" ? "غير محدد" : "Not specified";

  try {
    return new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit"
    });
  } catch {
    return value;
  }
}

function formatEventType(locale: "ar" | "en", value?: EventType | null) {
  if (value === "online") return locale === "ar" ? "أونلاين" : "Online";
  if (value === "offline") return locale === "ar" ? "أوفلاين" : "Offline";
  return locale === "ar" ? "فعالية" : "Event";
}

export default async function EventsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === "ar";
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  const glass =
    "rounded-[28px] border border-black/10 bg-white/78 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60";

  const softCard =
    "rounded-2xl border border-black/10 bg-white/90 dark:border-white/10 dark:bg-zinc-950/45";

  const cardHover =
    "transition duration-200 will-change-transform hover:-translate-y-1 hover:border-black/15 hover:shadow-lg hover:shadow-black/5 dark:hover:border-white/15 dark:hover:shadow-black/20";

  const pill =
    "rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200";

  const primaryBtn =
    "inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300";

  const secondaryBtn =
    "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white";

  if (error) {
    return (
      <div className={cx(glass, "p-8 text-center")}>
        <h1 className="text-3xl font-bold text-zinc-950 dark:text-white">
          {isAr ? "الفعاليات" : "Events"}
        </h1>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {isAr
            ? `حدث خطأ أثناء تحميل الفعاليات: ${error.message}`
            : `Failed to load events: ${error.message}`}
        </p>
      </div>
    );
  }

  const rows = (data ?? []) as EventRow[];

  const featured = rows
    .filter((event) => event.is_featured_home)
    .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));

  const normalEvents = rows.filter((event) => !event.is_featured_home);

  return (
    <div className="mx-auto grid max-w-6xl gap-8">
      <MotionSection
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={cx("relative overflow-hidden p-7 md:p-8", glass)}
      >
        <div className="absolute inset-0 -z-20 bg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-sky-50/70 to-transparent dark:from-amber-400/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-sky-100/40 blur-3xl dark:bg-amber-300/10" />

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className={cx("mb-3 inline-flex items-center gap-2", pill)}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-amber-300" />
              <span>{isAr ? "فعاليات SkillUp" : "SkillUp Events"}</span>
            </div>

            <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white md:text-5xl">
              {isAr ? "الفعاليات" : "Events"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-8 text-zinc-600 dark:text-zinc-300 md:text-base">
              {isAr
                ? "استعرض الفعاليات المنشورة، واطلع على تفاصيل كل فعالية وموعدها وطريقة الحضور."
                : "Browse published events and view each event’s details, date, and attendance type."}
            </p>
          </div>

          <div className={cx("px-4 py-3 text-sm font-medium", softCard)}>
            {isAr ? `إجمالي الفعاليات المنشورة: ${rows.length}` : `Published events: ${rows.length}`}
          </div>
        </div>
      </MotionSection>

      {rows.length === 0 ? (
        <section className={cx(glass, "p-10 text-center")}>
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">
            {isAr ? "لا توجد فعاليات منشورة حاليًا" : "No published events yet"}
          </h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "بمجرد نشر فعالية من لوحة التحكم ستظهر هنا تلقائيًا."
              : "Once an event is published from the admin dashboard, it will appear here automatically."}
          </p>
        </section>
      ) : (
        <>
          {featured.length > 0 ? (
            <section className="grid gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                    {isAr ? "فعاليات مميزة" : "Featured Events"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? "أبرز الفعاليات المختارة للظهور المميز."
                      : "Highlighted events selected for featured display."}
                  </p>
                </div>
              </div>

              <MotionDiv
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {featured.map((event) => {
                  const title = pickText(locale, event.title_ar, event.title_en) || (isAr ? "فعالية" : "Event");
                  const description = pickText(locale, event.description_ar, event.description_en);
                  const summary = stripHtml(description).slice(0, 160);
                  const typeLabel = formatEventType(locale, event.event_type);
                  const cover = event.image1_url || event.image2_url || null;

                  return (
                    <MotionDiv key={event.id} variants={fadeUp}>
                      <article className={cx("overflow-hidden", glass, cardHover)}>
                        <div className="relative">
                          {cover ? (
                            <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-50 dark:bg-white/5">
                              <img
                                src={cover}
                                alt={title}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-[16/10] w-full items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                              {isAr ? "لا توجد صورة متاحة" : "No image available"}
                            </div>
                          )}

                          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                            <span className={pill}>
                              {isAr ? "مميزة" : "Featured"}
                            </span>

                            <span className={pill}>
                              {typeLabel}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-4 p-5">
                          <div>
                            <h3 className="line-clamp-2 text-xl font-bold leading-8 text-zinc-950 dark:text-white">
                              {title}
                            </h3>

                            <p className="mt-2 line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                              {summary || (isAr ? "لا توجد تفاصيل متاحة بعد." : "No details available yet.")}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className={pill}>
                              {isAr ? "التاريخ" : "Date"}: {formatDate(locale, event.event_date)}
                            </span>

                            <span className={pill}>
                              {isAr ? "المكان" : "Location"}:{" "}
                              {event.location || (isAr ? "غير محدد" : "Not specified")}
                            </span>
                          </div>

                          <Link href={`/${locale}/events/${event.id}`} className={primaryBtn}>
                            {isAr ? "عرض التفاصيل" : "View details"}
                          </Link>
                        </div>
                      </article>
                    </MotionDiv>
                  );
                })}
              </MotionDiv>
            </section>
          ) : null}

          {normalEvents.length > 0 ? (
            <section className="grid gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                    {isAr ? "كل الفعاليات" : "All Events"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? "جميع الفعاليات المتاحة حاليًا."
                      : "All currently published events."}
                  </p>
                </div>
              </div>

              <MotionDiv
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
              >
                {normalEvents.map((event) => {
                  const title = pickText(locale, event.title_ar, event.title_en) || (isAr ? "فعالية" : "Event");
                  const description = pickText(locale, event.description_ar, event.description_en);
                  const summary = stripHtml(description).slice(0, 160);
                  const typeLabel = formatEventType(locale, event.event_type);
                  const cover = event.image1_url || event.image2_url || null;

                  return (
                    <MotionDiv key={event.id} variants={fadeUp}>
                      <article className={cx("overflow-hidden", glass, cardHover)}>
                        <div className="relative">
                          {cover ? (
                            <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-50 dark:bg-white/5">
                              <img
                                src={cover}
                                alt={title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-[16/10] w-full items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                              {isAr ? "لا توجد صورة متاحة" : "No image available"}
                            </div>
                          )}

                          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                            <span className={pill}>{typeLabel}</span>
                            <span className={pill}>{formatDate(locale, event.event_date)}</span>
                          </div>
                        </div>

                        <div className="grid gap-4 p-5">
                          <div>
                            <h3 className="line-clamp-2 text-xl font-bold leading-8 text-zinc-950 dark:text-white">
                              {title}
                            </h3>

                            <p className="mt-2 line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                              {summary || (isAr ? "لا توجد تفاصيل متاحة بعد." : "No details available yet.")}
                            </p>
                          </div>

                          <div className={cx("px-3 py-2 text-sm", softCard)}>
                            <span className="font-semibold text-zinc-900 dark:text-white">
                              {isAr ? "المكان / الرابط: " : "Location / Link: "}
                            </span>
                            <span className="break-words text-zinc-600 dark:text-zinc-300">
                              {event.location || (isAr ? "غير محدد" : "Not specified")}
                            </span>
                          </div>

                          <Link href={`/${locale}/events/${event.id}`} className={primaryBtn}>
                            {isAr ? "عرض التفاصيل" : "View details"}
                          </Link>
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
    </div>
  );
}