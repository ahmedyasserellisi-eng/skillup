import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";
import { getSectorBySlug } from "@/lib/sectors-data";

function Card({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
      <h2 className="text-sm font-semibold opacity-80">{title}</h2>
      <div className="mt-3 text-sm leading-7 opacity-90">{children}</div>
    </section>
  );
}

export default async function SectorDetailsPage({
  params
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const s = getSectorBySlug(slug);
  if (!s) notFound();

  const isAr = locale === "ar";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/${locale}/sectors`}
          className="rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm hover:bg-white/80 dark:border-white/10 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60"
        >
          {isAr ? "← العودة للقطاعات" : "← Back to sectors"}
        </Link>

        <Link
          href={`/${locale}/join?sector=${encodeURIComponent(s.slug)}`}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900"
        >
          {isAr ? "انضم لهذا القطاع" : "Join this sector"}
        </Link>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white/60 p-7 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
        <div className="grid gap-2">
          <div className="text-xs font-semibold opacity-70">{s.short}</div>
          <h1 className="text-3xl font-bold">{isAr ? s.name_ar : s.name_en}</h1>
          <p className="max-w-3xl text-sm leading-7 opacity-80">
            {isAr ? s.note_ar : s.note_en}
          </p>
        </div>

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-black/5 blur-3xl dark:bg-white/5" />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card title={isAr ? "الدور الأساسي" : "Core role"}>
            {isAr ? s.role_ar : s.role_en}
          </Card>

          <Card title={isAr ? "الاختصاصات والمهام" : "Responsibilities"}>
            <ul className="list-disc ps-5">
              {(isAr ? s.responsibilities_ar : s.responsibilities_en).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Card>

          <Card title={isAr ? "حدود الدور (منع التداخل)" : "Boundaries (avoid overlap)"}>
            {isAr ? s.boundaries_ar : s.boundaries_en}
          </Card>
        </div>

        <div className="grid gap-4">
          <Card title={isAr ? "العائد على العضو" : "Member benefits"}>
            {isAr ? s.benefits_ar : s.benefits_en}
          </Card>

          <div className="rounded-3xl border border-black/10 bg-white/60 p-6 text-sm opacity-85 dark:border-white/10 dark:bg-zinc-950/40">
            <div className="font-semibold">{isAr ? "جاهز تبدأ؟" : "Ready to start?"}</div>
            <p className="mt-2 opacity-80">
              {isAr
                ? "قدّم طلب الانضمام واختر القطاع، وسيتم التواصل معك بعد المراجعة."
                : "Submit your application and we’ll reach out after review."}
            </p>

            <Link
              href={`/${locale}/join?sector=${encodeURIComponent(s.slug)}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
            >
              {isAr ? "قدّم طلب انضمام" : "Apply now"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}