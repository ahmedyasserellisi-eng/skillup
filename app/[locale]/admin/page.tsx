"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function cx(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

type AdminCard = {
  href: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");

  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const isAr = locale === "ar";

  const cards: AdminCard[] = useMemo(
    () => [
      {
        href: `/${locale}/admin/highlights`,
        icon: "🏆",
        titleAr: "تكريمات الشهر",
        titleEn: "Monthly Highlights",
        descAr: "اختيار أفضل قطاع، أفضل رئيس قطاع، أفضل نائب، وأفضل 2 من كل قطاع.",
        descEn: "Pick best sector, best head, best deputy, and top 2 members per sector."
      },
      {
        href: `/${locale}/admin/stars`,
        icon: "⭐",
        titleAr: "نجوم الشهر",
        titleEn: "Monthly Stars",
        descAr: "إدارة أفضل عضوين شهريًا من كل قطاع مع صورهم وروابطهم.",
        descEn: "Manage top 2 monthly members per sector with photos and profile links."
      },
      {
        href: `/${locale}/admin/events`,
        icon: "📅",
        titleAr: "الفعاليات",
        titleEn: "Events",
        descAr: "إضافة وتعديل الفعاليات الأونلاين والأوفلاين وربط الصور والتفاصيل.",
        descEn: "Create and manage online/offline events with images and details."
      },
      {
        href: `/${locale}/admin/programs`,
        icon: "🎓",
        titleAr: "البرامج",
        titleEn: "Programs",
        descAr: "إدارة البرامج التدريبية، الصور، الـ Playlist، والنشر في الرئيسية.",
        descEn: "Manage training programs, images, playlists, and Home visibility."
      },
      {
        href: `/${locale}/admin/join-requests`,
        icon: "📝",
        titleAr: "طلبات الانضمام",
        titleEn: "Join Requests",
        descAr: "عرض طلبات الانضمام ومراجعتها وتنظيمها.",
        descEn: "View, review, and organize join requests."
      },
      {
        href: `/${locale}/admin/messages`,
        icon: "✉️",
        titleAr: "الرسائل",
        titleEn: "Messages",
        descAr: "عرض الرسائل الواردة من صفحة تواصل معنا.",
        descEn: "Review incoming messages from the Contact page."
      },
      {
        href: `/${locale}/admin/settings`,
        icon: "⚙️",
        titleAr: "الإعدادات",
        titleEn: "Settings",
        descAr: "الإعدادات العامة الخاصة بالموقع ولوحة التحكم.",
        descEn: "General website and dashboard settings."
      }
    ],
    [locale]
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const userEmail = data.session?.user?.email?.toLowerCase() ?? "";

      if (!data.session) {
        router.replace(`/${locale}/admin/login`);
        return;
      }

      if (!userEmail || !ALLOWED.has(userEmail)) {
        await supabaseBrowser.auth.signOut();
        router.replace(`/${locale}/admin/login`);
        return;
      }

      setEmail(userEmail);
      setChecking(false);
    })();
  }, [router, locale]);

  async function logout() {
    await supabaseBrowser.auth.signOut();
    router.replace(`/${locale}/admin/login`);
  }

  const glass =
    "rounded-3xl border border-black/10 bg-white/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/40";

  const hover =
    "transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white/70 hover:shadow-md dark:hover:border-white/20 dark:hover:bg-zinc-950/50";

  if (checking) {
    return (
      <div className={cx(glass, "p-6 text-sm opacity-80")}>
        {isAr ? "جاري التحقق من الجلسة..." : "Checking session..."}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Top summary */}
      <section className={cx(glass, "p-6")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm opacity-70">
              {isAr ? "مرحبًا بك في لوحة التحكم" : "Welcome to the dashboard"}
            </div>
            <h1 className="mt-1 text-2xl font-bold">
              {isAr ? "لوحة تحكم SkillUp" : "SkillUp Admin Dashboard"}
            </h1>
            <p className="mt-2 text-sm opacity-75">
              {isAr
                ? "من هنا تقدر تدير البرامج، الفعاليات، التكريمات، الطلبات، والرسائل بشكل منظم."
                : "Manage programs, events, highlights, requests, and messages from one place."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950/40">
              <div className="text-xs opacity-60">
                {isAr ? "الحساب الحالي" : "Current account"}
              </div>
              <div className="mt-1 font-medium break-all">{email}</div>
            </div>

            <button
              onClick={logout}
              className="rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
            >
              {isAr ? "تسجيل الخروج" : "Logout"}
            </button>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={cx(glass, hover, "group block p-5")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-3xl">{c.icon}</div>
              <div className="text-xs opacity-60">{isAr ? "إدارة" : "Manage"}</div>
            </div>

            <div className="mt-4 text-lg font-semibold">
              {isAr ? c.titleAr : c.titleEn}
            </div>

            <div className="mt-2 text-sm opacity-75">
              {isAr ? c.descAr : c.descEn}
            </div>

            <div className="mt-4 text-sm font-semibold opacity-90 underline underline-offset-4">
              {isAr ? "فتح القسم" : "Open section"} →
            </div>
          </Link>
        ))}
      </section>

      {/* Extra info */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className={cx(glass, "p-5")}>
          <h2 className="text-base font-semibold">
            {isAr ? "ملاحظات سريعة" : "Quick notes"}
          </h2>

          <div className="mt-3 grid gap-2 text-sm opacity-80">
            <div>
              {isAr
                ? "• البرامج والفعاليات لا تظهر في الموقع إلا بعد ضبط حالة النشر."
                : "• Programs and events appear on the website only after publishing them."}
            </div>
            <div>
              {isAr
                ? "• العناصر المميزة في الرئيسية تعتمد على إعدادات Home/Featured."
                : "• Featured Home sections depend on Home/Featured settings."}
            </div>
            <div>
              {isAr
                ? "• التكريمات تقرأ آخر شهر منشور فقط في الصفحة العامة."
                : "• Highlights page reads only the latest published month."}
            </div>
          </div>
        </div>

        <div className={cx(glass, "p-5")}>
          <h2 className="text-base font-semibold">
            {isAr ? "اختصارات" : "Shortcuts"}
          </h2>

          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { href: `/${locale}`, labelAr: "عرض الموقع", labelEn: "View website" },
              { href: `/${locale}/admin/programs`, labelAr: "البرامج", labelEn: "Programs" },
              { href: `/${locale}/admin/events`, labelAr: "الفعاليات", labelEn: "Events" },
              { href: `/${locale}/admin/highlights`, labelAr: "التكريمات", labelEn: "Highlights" },
              { href: `/${locale}/admin/stars`, labelAr: "نجوم الشهر", labelEn: "Stars" }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium transition hover:bg-white/90 dark:border-white/10 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60"
              >
                {isAr ? item.labelAr : item.labelEn}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
