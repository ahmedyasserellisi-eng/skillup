import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";
import { supabaseServer } from "@/lib/supabase-server";

type EventRow = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  event_type: "online" | "offline" | null;
  location: string | null;
  event_date: string | null;
  image1_url: string | null;
  image2_url: string | null;
  created_at: string | null;
  is_published: boolean | null;
};

function cx(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

function pickText(locale: "ar" | "en", ar?: string | null, en?: string | null) {
  return locale === "ar" ? ar || en || "" : en || ar || "";
}

function formatDate(locale: "ar" | "en", val?: string | null) {
  if (!val) return locale === "ar" ? "غير محدد" : "Not specified";

  try {
    const d = new Date(val);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit"
    });
  } catch {
    return val;
  }
}

function isValidUrl(value?: string | null) {
  if (!value) return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const sb = supabaseServer();

  const { data } = await sb
    .from("events")
    .select("title_ar,title_en")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  const title =
    locale === "ar"
      ? data?.title_ar || data?.title_en || "فعالية"
      : data?.title_en || data?.title_ar || "Event";

  return {
    title: `${title} | SkillUp`,
    description:
      locale === "ar"
        ? "تفاصيل فعالية منشورة على موقع SkillUp."
        : "Published event details on SkillUp website."
  };
}

export default async function EventDetailsPage({
  params
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;

  if (!locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === "ar";
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !data) notFound();

  const event = data as EventRow;

  const title = pickText(locale, event.title_ar, event.title_en) || (isAr ? "فعالية" : "Event");
  const description = pickText(locale, event.description_ar, event.description_en);

  const type = event.event_type ?? "online";
  const typeLabel =
    type === "online"
      ? isAr
        ? "أونلاين"
        : "Online"
      : isAr
        ? "أوفلاين"
        : "Offline";

  const formattedDate = formatDate(locale, event.event_date);
  const locationIsUrl = isValidUrl(event.location);
  const mainImage = event.image1_url || event.image2_url || null;
  const galleryImages = [event.image1_url, event.image2_url].filter(Boolean) as string[];

  const glass =
    "rounded-[28px] border border-black/10 bg-white/78 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60";

  const softCard =
    "rounded-2xl border border-black/10 bg-white/90 dark:border-white/10 dark:bg-zinc-950/45";

  const pill =
    "rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200";

  const primaryBtn =
    "inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300";

  const secondaryBtn =
    "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/90 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white";

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/${locale}/events`} className={secondaryBtn}>
          {isAr ? "الرجوع للفعاليات" : "Back to events"}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className={pill}>{typeLabel}</span>
          <span className={pill}>{formattedDate}</span>
        </div>
      </div>

      <section className={cx("relative overflow-hidden p-7 md:p-8", glass)}>
        <div className="absolute inset-0 -z-20 bg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-sky-50/70 to-transparent dark:from-amber-400/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-100/40 blur-3xl dark:bg-amber-300/10" />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="grid gap-4">
            <div className={cx("inline-flex w-fit items-center gap-2", pill)}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-amber-300" />
              <span>{isAr ? "فعالية SkillUp" : "SkillUp Event"}</span>
            </div>

            <div className="grid gap-3">
              <h1 className="text-3xl font-extrabold leading-tight text-zinc-950 dark:text-white md:text-5xl">
                {title}
              </h1>

              <p className="max-w-2xl text-sm leading-8 text-zinc-600 dark:text-zinc-300 md:text-base">
                {isAr
                  ? "استعرض تفاصيل الفعالية، موعدها، وطريقة الحضور أو رابط الانضمام إن وُجد."
                  : "View the event details, date, and attendance method or join link if available."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {type === "online" && event.location && locationIsUrl ? (
                <a
                  href={event.location}
                  target="_blank"
                  rel="noreferrer"
                  className={primaryBtn}
                >
                  {isAr ? "الانضمام إلى الفعالية" : "Join event"}
                </a>
              ) : null}

              {type === "offline" && event.location ? (
                <a
                  href={locationIsUrl ? event.location : undefined}
                  target={locationIsUrl ? "_blank" : undefined}
                  rel={locationIsUrl ? "noreferrer" : undefined}
                  className={secondaryBtn}
                >
                  {isAr ? "عرض المكان" : "View location"}
                </a>
              ) : null}

              <a href="#details" className={secondaryBtn}>
                {isAr ? "عرض التفاصيل" : "View details"}
              </a>

              {galleryImages.length > 0 ? (
                <a href="#gallery" className={secondaryBtn}>
                  {isAr ? "عرض الصور" : "View gallery"}
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {isAr ? "تاريخ الفعالية" : "Event date"}
              </div>
              <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-white">
                {formattedDate}
              </div>
            </div>

            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {isAr ? "نوع الفعالية" : "Event type"}
              </div>
              <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-white">
                {typeLabel}
              </div>
            </div>

            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {isAr ? "المكان / الرابط" : "Location / Link"}
              </div>
              <div className="mt-2 break-words text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {event.location || (isAr ? "غير محدد" : "Not specified")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {mainImage ? (
        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {isAr ? "الصورة الرئيسية" : "Main image"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isAr
                ? "الصورة الأساسية المرتبطة بالفعالية."
                : "The main image associated with this event."}
            </p>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
            <div className="relative aspect-[16/9] w-full">
              <img
                src={mainImage}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section id="details" className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            {isAr ? "تفاصيل الفعالية" : "Event details"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "كل المعلومات المتاحة عن الفعالية في مكان واحد."
              : "All available information about the event in one place."}
          </p>
        </div>

        <div className={cx("p-6", glass)}>
          <div
            className="prose max-w-none prose-headings:mb-3 prose-p:leading-8 dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html:
                description ||
                `<p>${isAr ? "لا توجد تفاصيل متاحة بعد." : "No details available yet."}</p>`
            }}
          />
        </div>
      </section>

      {galleryImages.length > 0 ? (
        <section id="gallery" className="grid gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {isAr ? "معرض الصور" : "Gallery"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isAr
                ? "صور إضافية مرتبطة بالفعالية أو الإعلان الخاص بها."
                : "Additional images related to the event or its announcement."}
            </p>
          </div>

          <div
            className={cx(
              "grid gap-4",
              galleryImages.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
            )}
          >
            {galleryImages.map((img, index) => (
              <div
                key={`${img}-${index}`}
                className="overflow-hidden rounded-[28px] border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-white/5"
              >
                <div className="relative aspect-[16/10] w-full">
                  <img
                    src={img}
                    alt={title}
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap gap-3">
        <Link href={`/${locale}/events`} className={secondaryBtn}>
          {isAr ? "الرجوع لكل الفعاليات" : "Back to all events"}
        </Link>

        {type === "online" && event.location && locationIsUrl ? (
          <a
            href={event.location}
            target="_blank"
            rel="noreferrer"
            className={primaryBtn}
          >
            {isAr ? "فتح رابط الفعالية" : "Open event link"}
          </a>
        ) : null}
      </section>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        {isAr
          ? "ملاحظة: إذا كان رابط الفعالية الأونلاين غير صالح، يمكن تحديثه من لوحة التحكم."
          : "Note: If the online event link is invalid, it can be updated from the admin dashboard."}
      </div>
    </div>
  );
}