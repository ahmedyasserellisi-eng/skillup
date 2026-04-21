import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";
import { SECTORS } from "@/lib/sectors-data";
import { MotionDiv, MotionSection, fadeUp, stagger } from "@/components/motion";

function cx(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default async function SectorsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === "ar";
  const href = (path: string) => `/${locale}${path}`;

  const glass =
    "rounded-[28px] border border-black/10 bg-white/78 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60";

  const softCard =
    "rounded-2xl border border-black/10 bg-white/90 dark:border-white/10 dark:bg-zinc-950/45";

  const cardHover =
    "transition duration-200 will-change-transform hover:-translate-y-1 hover:border-black/15 hover:shadow-lg hover:shadow-black/5 dark:hover:border-white/15 dark:hover:shadow-black/20";

  const pill =
    "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200";

  const primaryBtn =
    "rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300";

  const secondaryBtn =
    "rounded-2xl border border-black/10 bg-white/90 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white";

  const ghostLink =
    "text-sm font-semibold text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white";

  const summaryCards = [
    {
      number: "01",
      title: isAr ? "محاكاة بيئة العمل" : "Workplace simulation",
      desc: isAr
        ? "كل قطاع يمثل مساحة عمل واضحة تتيح للأعضاء ممارسة أدوار فعلية بشكل منظم."
        : "Each sector represents a structured work area where members practice real roles."
    },
    {
      number: "02",
      title: isAr ? "حدود واضحة بلا تداخل" : "Clear non-overlapping roles",
      desc: isAr
        ? "الهيكل التنظيمي مصمم بحيث يعرف كل قطاع مسؤولياته وحدوده وعلاقته بباقي القطاعات."
        : "The structure defines each sector’s responsibilities, boundaries, and relation to other sectors."
    },
    {
      number: "03",
      title: isAr ? "عائد مهني مباشر" : "Direct professional value",
      desc: isAr
        ? "العضو لا يشارك فقط، بل يكتسب خبرة قابلة للترجمة إلى سلوك مهني وخبرة عملية."
        : "Members do not just participate. They gain practical experience and professional behavior."
    }
  ];

  const workModel = [
    {
      title: isAr ? "أدوار متخصصة" : "Specialized roles",
      desc: isAr
        ? "لكل قطاع مجال عمل محدد يساعد على التخصص واكتساب خبرة أوضح."
        : "Each sector has a defined scope that supports specialization and clearer experience-building."
    },
    {
      title: isAr ? "تكامل بين القطاعات" : "Cross-sector collaboration",
      desc: isAr
        ? "القطاعات لا تعمل بشكل منفصل، بل تتكامل داخل تجربة واحدة أقرب لبيئة المؤسسات."
        : "Sectors do not work in isolation. They collaborate within one experience closer to real organizations."
    },
    {
      title: isAr ? "تطوير مستمر" : "Continuous development",
      desc: isAr
        ? "الهيكل مصمم ليمنح العضو فرصة للتعلم، التجربة، ثم التطور داخل مسار واضح."
        : "The structure is designed to help members learn, practice, and grow through a clear path."
    }
  ];

  return (
    <div className="grid gap-10">
      <MotionSection
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className={cx("relative overflow-hidden p-7 md:p-10", glass)}
      >
        <div className="absolute inset-0 -z-20 bg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-sky-50/70 to-transparent dark:from-amber-400/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-100/40 blur-3xl dark:bg-amber-300/10" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-sky-100/30 blur-3xl dark:bg-amber-200/10" />

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="grid gap-5">
            <div className={pill}>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-amber-300" />
              <span>
                {isAr ? "القطاعات والهيكل التنظيمي" : "Sectors & Organizational Structure"}
              </span>
            </div>

            <div className="grid gap-3">
              <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-zinc-950 dark:text-white md:text-5xl">
                {isAr ? "قطاعات فريق SkillUp" : "SkillUp Team Sectors"}
              </h1>

              <p className="max-w-3xl text-sm leading-8 text-zinc-600 dark:text-zinc-300 md:text-base">
                {isAr
                  ? "القطاعات هي الإطار الذي ينظم تجربة SkillUp ويحوّل المشاركة من متابعة عامة إلى ممارسة فعلية لأدوار واضحة داخل بيئة عمل محاكاة، مع توزيع مسؤوليات يضمن التكامل ويمنع التداخل."
                  : "Sectors are the framework that organizes the SkillUp experience, turning participation from general involvement into real role practice inside a simulated work environment, with clear responsibilities that ensure collaboration without overlap."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={href("/join")} className={primaryBtn}>
                {isAr ? "انضم إلى الفريق" : "Join the team"}
              </Link>

              <Link href={href("/contact")} className={secondaryBtn}>
                {isAr ? "تواصل معنا" : "Contact us"}
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {summaryCards.map((item) => (
              <div key={item.number} className={cx("p-4", softCard)}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                    {item.number}
                  </span>

                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                      {item.desc}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MotionSection>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            {isAr ? "كيف تعمل القطاعات داخل الفريق؟" : "How sectors work inside the team"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isAr
              ? "الهيكل لا يوزع المسميات فقط، لكنه يوزع المسؤولية والخبرة والتكامل بين الأعضاء."
              : "The structure does not distribute titles only. It distributes responsibility, experience, and collaboration."}
          </p>
        </div>

        <MotionDiv
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {workModel.map((item, index) => (
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
              {isAr ? "القطاعات المتاحة" : "Available sectors"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isAr
                ? "كل قطاع هنا يمثل مساحة تخصصية داخل الفريق، مع تعريف مختصر يمهد للصفحة التفصيلية."
                : "Each sector represents a specialized area inside the team, with a concise overview leading to its detailed page."}
            </p>
          </div>

          <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {isAr ? `${SECTORS.length} قطاعات` : `${SECTORS.length} sectors`}
          </div>
        </div>

        <MotionDiv
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {SECTORS.map((s, index) => (
            <MotionDiv key={s.slug} variants={fadeUp}>
              <article className={cx("group h-full p-5", glass, cardHover)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {(index + 1).toString().padStart(2, "0")} · {s.short}
                    </div>

                    <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
                      {isAr ? s.name_ar : s.name_en}
                    </h3>
                  </div>

                  <Link
                    href={href(`/sectors/${encodeURIComponent(s.slug)}`)}
                    className="shrink-0 rounded-2xl border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {isAr ? "التفاصيل" : "Details"}
                  </Link>
                </div>

                <p className="mt-3 min-h-[72px] text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {isAr ? s.note_ar : s.note_en}
                </p>

                <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {isAr ? "أبرز المسؤوليات" : "Key responsibilities"}
                  </div>

                  <ul className="mt-3 grid gap-2">
                    {(isAr ? s.responsibilities_ar : s.responsibilities_en)
                      .slice(0, 3)
                      .map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500 dark:bg-zinc-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/10 pt-4 dark:border-white/10">
                  <Link
                    href={href(`/join?sector=${encodeURIComponent(s.slug)}`)}
                    className={ghostLink}
                  >
                    {isAr ? "التقديم لهذا القطاع" : "Apply to this sector"}
                  </Link>

                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isAr ? "وضوح دور" : "Clear scope"}
                  </span>
                </div>
              </article>
            </MotionDiv>
          ))}
        </MotionDiv>
      </section>

      <section className={cx("p-6", glass)}>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              {isAr ? "هل تريد اختيار القطاع الأنسب لك؟" : "Need help choosing the right sector?"}
            </h2>
            <p className="mt-1 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {isAr
                ? "يمكنك قراءة التفاصيل الكاملة لكل قطاع أو التقديم مباشرة بالقطاع الأقرب لاهتماماتك الحالية."
                : "You can read the full details of each sector or apply directly to the one that best matches your current interests."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={href("/join")} className={primaryBtn}>
              {isAr ? "ابدأ التقديم" : "Start application"}
            </Link>

            <Link href={href("/contact")} className={secondaryBtn}>
              {isAr ? "استفسر أولًا" : "Ask first"}
            </Link>
          </div>
        </div>
      </section>

      <div className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
        {isAr
          ? "تمت صياغة هذه الصفحة بالاستناد إلى الدليل التنظيمي للقطاعات مع تحديث اللغة لتناسب هوية SkillUp كفريق."
          : "This page is aligned with the sector guide, while the wording is adapted to reflect SkillUp as a team."}
      </div>
    </div>
  );
}