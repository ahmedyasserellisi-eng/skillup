import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { locales, type Locale } from "@/i18n";
import { MotionSection, fadeUp } from "@/components/motion";
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
  is_published: boolean | null;
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

function formatDate(locale: "ar" | "en", value?: string | null) {
  if (!value) return "—";

  try {
    const d = new Date(value);
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit"
    });
  } catch {
    return value;
  }
}

function pickText(locale: "ar" | "en", ar?: string | null, en?: string | null) {
  return locale === "ar" ? ar || en || "" : en || ar || "";
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const safeLocale: "ar" | "en" = locale === "en" ? "en" : "ar";

  const sb = supabaseServer();

  const { data } = await sb
    .from("programs")
    .select("title_ar,title_en")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  const title = pickText(safeLocale, data?.title_ar, data?.title_en) || "Program";

  return {
    title: `${title} | SkillUp`,
    description:
      safeLocale === "ar"
        ? "صفحة برنامج تدريبي من SkillUp."
        : "Training program page by SkillUp."
  };
}

export default async function ProgramDetailsPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!locales.includes(locale as Locale)) notFound();

  const safeLocale = locale as Locale;
  const isAr = safeLocale === "ar";

  setRequestLocale(safeLocale);

  const sb = supabaseServer();

  const { data, error } = await sb
    .from("programs")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) notFound();

  const program = data as Program;

  const title =
    pickText(safeLocale, program.title_ar, program.title_en) ||
    (isAr ? "برنامج تدريبي" : "Training Program");

  const description = pickText(
    safeLocale,
    program.description_ar,
    program.description_en
  );

  const playlistId = extractPlaylistId(program.youtube_playlist || "");
  const playlistUrl = playlistId
    ? `https://www.youtube.com/playlist?list=${playlistId}`
    : "";
  const playlistEmbedUrl = playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0`
    : "";

  const createdAt = formatDate(safeLocale, program.created_at);
  const galleryImages = (program.extra_images ?? []).filter(Boolean);

  const href = (path: string) => `/${safeLocale}${path}`;

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
        <Link href={href("/programs")} className={secondaryBtn}>
          {isAr ? "الرجوع إلى البرامج" : "Back to programs"}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className={pill}>
            {isAr ? "برنامج تدريبي" : "Training Program"}
          </span>

          {playlistId ? (
            <span className={pill}>
              {isAr ? "يتضمن فيديوهات" : "Includes videos"}
            </span>
          ) : null}
        </div>
      </div>

      <MotionSection
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={cx("relative overflow-hidden p-7 md:p-8", glass)}
      >
        <div className="absolute inset-0 -z-20 bg-grid opacity-50" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-sky-50/70 to-transparent dark:from-amber-400/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-100/40 blur-3xl dark:bg-amber-300/10" />

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="grid gap-4">
            <div className={pill}>
              {isAr ? "برنامج من SkillUp" : "A SkillUp Program"}
            </div>

            <div className="grid gap-3">
              <h1 className="text-3xl font-extrabold leading-tight text-zinc-950 dark:text-white md:text-5xl">
                {title}
              </h1>

              <p className="max-w-2xl text-sm leading-8 text-zinc-600 dark:text-zinc-300 md:text-base">
                {isAr
                  ? "تجمع هذه الصفحة وصف البرنامج، المواد المرئية المرتبطة به، وأي صور إضافية متاحة."
                  : "This page brings together the program description, related video content, and any available additional images."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {playlistUrl ? (
                <a
                  href={playlistUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={primaryBtn}
                >
                  {isAr ? "فتح قائمة التشغيل" : "Open playlist"}
                </a>
              ) : (
                <span className={pill}>
                  {isAr ? "لا توجد قائمة تشغيل بعد" : "No playlist yet"}
                </span>
              )}

              <a href="#description" className={secondaryBtn}>
                {isAr ? "الوصف" : "Description"}
              </a>

              {playlistUrl ? (
                <a href="#videos" className={secondaryBtn}>
                  {isAr ? "الفيديوهات" : "Videos"}
                </a>
              ) : null}

              {galleryImages.length > 0 ? (
                <a href="#images" className={secondaryBtn}>
                  {isAr ? "الصور" : "Images"}
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isAr ? "تاريخ الإضافة" : "Published"}
              </div>
              <div className="mt-2 text-base font-bold text-zinc-950 dark:text-white">
                {createdAt}
              </div>
            </div>

            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isAr ? "الفيديوهات" : "Videos"}
              </div>
              <div className="mt-2 text-base font-bold text-zinc-950 dark:text-white">
                {playlistUrl
                  ? isAr
                    ? "متاحة"
                    : "Available"
                  : isAr
                    ? "غير متاحة حاليًا"
                    : "Not available yet"}
              </div>
            </div>

            <div className={cx("p-4", softCard)}>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {isAr ? "الصور الإضافية" : "Extra images"}
              </div>
              <div className="mt-2 text-base font-bold text-zinc-950 dark:text-white">
                {galleryImages.length}
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            {isAr ? "صورة البرنامج الرئيسية" : "Program Cover"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "الصورة الأساسية المعروضة لهذا البرنامج."
              : "The main cover image displayed for this program."}
          </p>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
          {program.cover_url ? (
            <img
              src={program.cover_url}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
              {isAr ? "لا توجد صورة متاحة" : "No image available"}
            </div>
          )}
        </div>
      </section>

      <section id="description" className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            {isAr ? "وصف البرنامج" : "Program Description"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "تفاصيل البرنامج كما تم إعدادها داخل لوحة التحكم."
              : "Program details as prepared in the admin dashboard."}
          </p>
        </div>

        <div className={cx("p-6", glass)}>
          <div
            className="prose max-w-none prose-zinc dark:prose-invert prose-p:leading-8 prose-headings:mb-3"
            dangerouslySetInnerHTML={{
              __html:
                description ||
                `<p>${isAr ? "لا يوجد وصف متاح حاليًا." : "No description available yet."}</p>`
            }}
          />
        </div>
      </section>

      {playlistUrl ? (
        <section id="videos" className="grid gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {isAr ? "فيديوهات البرنامج" : "Program Videos"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isAr
                ? "يمكن مشاهدة قائمة التشغيل مباشرة من المشغل التالي أو فتحها على يوتيوب."
                : "You can watch the playlist directly in the player below or open it on YouTube."}
            </p>
          </div>

          <div className={cx("overflow-hidden p-3", glass)}>
            <div className="overflow-hidden rounded-[24px] border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
              <div className="relative aspect-video w-full">
                <iframe
                  src={playlistEmbedUrl}
                  title={isAr ? "مشغل قائمة تشغيل يوتيوب" : "YouTube playlist player"}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={playlistUrl}
              target="_blank"
              rel="noreferrer"
              className={secondaryBtn}
            >
              {isAr ? "فتح القائمة على يوتيوب" : "Open playlist on YouTube"}
            </a>
          </div>
        </section>
      ) : null}

      {galleryImages.length > 0 ? (
        <section id="images" className="grid gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
              {isAr ? "صور إضافية" : "Additional Images"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isAr
                ? "صور إضافية مرتبطة بالبرنامج أو أنشطته."
                : "Additional images related to the program or its activities."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {galleryImages.map((img) => (
              <div
                key={img}
                className="overflow-hidden rounded-[28px] border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-white/5"
              >
                <img
                  src={img}
                  alt={title}
                  className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap gap-3">
        <Link href={href("/programs")} className={secondaryBtn}>
          {isAr ? "الرجوع إلى كل البرامج" : "Back to all programs"}
        </Link>

        {playlistUrl ? (
          <a
            href={playlistUrl}
            target="_blank"
            rel="noreferrer"
            className={primaryBtn}
          >
            {isAr ? "فتح على يوتيوب" : "Open on YouTube"}
          </a>
        ) : null}
      </section>
    </div>
  );
}