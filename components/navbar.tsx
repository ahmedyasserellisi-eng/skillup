"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Languages, Menu, X } from "lucide-react";

import ThemeToggle from "./theme-toggle";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavKey = "programs" | "events" | "sectors" | "highlights" | "contact";
type NavItem = { key: NavKey; href: string };

// 🔹 نقل النصوص خارج المكون لتحسين الأداء ونظافة الكود
const NAV_LABELS: Record<"ar" | "en", Record<NavKey, string>> = {
  ar: {
    programs: "البرامج",
    events: "الفعاليات",
    sectors: "القطاعات",
    highlights: "التكريمات",
    contact: "تواصل"
  },
  en: {
    programs: "Programs",
    events: "Events",
    sectors: "Sectors",
    highlights: "Awards",
    contact: "Contact"
  }
};

// 🔹 تم تحديد النوع هنا كـ Variants لحل مشكلة الـ TypeScript في الـ Build تماماً
const menuVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.25,
      ease: "easeInOut",
      staggerChildren: 0.05,
      when: "beforeChildren"
    }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Navbar({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // نضمن إن الـ logo والتفاعلات تظهر بعد الـ hydration بأمان
  useEffect(() => {
    setMounted(true);
  }, []);

  const other: "ar" | "en" = locale === "ar" ? "en" : "ar";
  const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");
  const otherHref = `/${other}${rest || ""}`;

  const items: NavItem[] = useMemo(
    () => [
      { key: "programs", href: `/${locale}/programs` },
      { key: "events", href: `/${locale}/events` },
      { key: "sectors", href: `/${locale}/sectors` },
      { key: "highlights", href: `/${locale}/highlights` },
      { key: "contact", href: `/${locale}/contact` }
    ],
    [locale]
  );

  // إغلاق القائمة عند تغيير الصفحة تلقائياً
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // إغلاق القائمة عند الضغط على زر Escape لدعم الوصولية (Accessibility)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActiveHref = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/80">
      <div className="container-skillup flex items-center justify-between py-3">

        {/* ── Logo ── */}
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-900"
          aria-label="SkillUp home"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden">
            {mounted ? (
              <>
                <Image
                  src="/brand/logo-blue.png"
                  alt="SkillUp logo"
                  fill
                  sizes="44px"
                  className="object-contain dark:opacity-0"
                  priority
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <Image
                  src="/brand/logo-gold.png"
                  alt="SkillUp logo dark"
                  fill
                  sizes="44px"
                  className="object-contain opacity-0 dark:opacity-100"
                  priority
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </>
            ) : (
              <div className="h-full w-full rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            )}
          </div>

          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            SkillUp
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <div className="hidden items-center gap-2 lg:flex">
          <nav className="flex items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/75 p-1 shadow-sm backdrop-blur dark:border-zinc-800/50 dark:bg-zinc-900/60">
            {items.map((item) => {
              const active = isActiveHref(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cx(
                    "relative whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
                    active
                      ? "text-[#182B36] dark:text-[#C8A448]"
                      : "text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-white"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="desktop-nav-active-pill"
                      className="absolute inset-0 rounded-xl border border-zinc-200 bg-zinc-100/80 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-800/70"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                  <span className="relative z-10">{NAV_LABELS[locale][item.key]}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href={`/${locale}/join`}
            className="whitespace-nowrap rounded-2xl bg-[#182B36] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99] dark:bg-[#C8A448] dark:text-zinc-950 dark:hover:opacity-90"
          >
            {locale === "ar" ? "انضم إلينا" : "Join Us"}
          </Link>

          <button
            type="button"
            onClick={() => router.push(otherHref)}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/75 px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            <span>{other.toUpperCase()}</span>
          </button>

          <ThemeToggle />
        </div>

        {/* ── Mobile Controls ── */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => router.push(otherHref)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white/75 px-2.5 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            <span>{other.toUpperCase()}</span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white/75 p-2.5 text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {open ? (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden border-t border-zinc-200 bg-white/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden"
          >
            <div className="container-skillup grid gap-4 py-5">
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => {
                  const active = isActiveHref(item.href);
                  return (
                    <motion.div key={item.key} variants={itemVariants}>
                      <Link
                        href={item.href}
                        className={cx(
                          "block rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-all duration-200",
                          active
                            ? "border-zinc-200 bg-zinc-100 text-[#182B36] font-bold dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-[#C8A448]"
                            : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
                        )}
                      >
                        {NAV_LABELS[locale][item.key]}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div variants={itemVariants} className="w-full pt-1">
                <Link
                  href={`/${locale}/join`}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#182B36] px-4 py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99] dark:bg-[#C8A448] dark:text-zinc-950 dark:hover:opacity-90"
                >
                  {locale === "ar" ? "انضم إلينا" : "Join Us"}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
