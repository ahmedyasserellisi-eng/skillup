"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Menu, X } from "lucide-react";

import ThemeToggle from "./theme-toggle";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type NavKey = "programs" | "events" | "sectors" | "highlights" | "contact";
type NavItem = { key: NavKey; href: string };

export default function Navbar({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActiveHref = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getLabel = (key: NavKey) => {
    if (locale === "ar") {
      const ar: Record<NavKey, string> = {
        programs: "البرامج",
        events: "الفعاليات",
        sectors: "القطاعات",
        highlights: "التكريمات",
        contact: "تواصل"
      };
      return ar[key];
    }

    const en: Record<NavKey, string> = {
      programs: "Programs",
      events: "Events",
      sectors: "Sectors",
      highlights: "Awards",
      contact: "Contact"
    };
    return en[key];
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
      <div className="container-skillup flex items-center justify-between py-3">
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="SkillUp home"
        >
          <div className="relative h-11 w-11 shrink-0">
            <Image
              src="/brand/logo-blue.png"
              alt="SkillUp logo"
              fill
              sizes="44px"
              className="object-contain transition-opacity duration-200 dark:opacity-0"
              priority
            />
            <Image
              src="/brand/logo-gold.png"
              alt="SkillUp logo dark"
              fill
              sizes="44px"
              className="object-contain opacity-0 transition-opacity duration-200 dark:opacity-100"
              priority
            />
          </div>

          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            SkillUp
          </span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <nav className="flex items-center gap-1 rounded-2xl border border-black/10 bg-white/75 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            {items.map((item) => {
              const active = isActiveHref(item.href);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cx(
                    "relative whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
                    active
                      ? "text-zinc-950 dark:text-white"
                      : "text-zinc-700 hover:bg-black/5 hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="desktop-nav-active-pill"
                      className="absolute inset-0 rounded-xl border border-black/10 bg-black/[0.04] shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}

                  <span className="relative z-10">{getLabel(item.key)}</span>
                </Link>
              );
            })}
          </nav>

          <Link
            href={`/${locale}/join`}
            className="whitespace-nowrap rounded-2xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300"
          >
            {locale === "ar" ? "انضم إلينا" : "Join Us"}
          </Link>

          <button
            type="button"
            onClick={() => router.push(otherHref)}
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-black/5 hover:text-zinc-950 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            <span>{other.toUpperCase()}</span>
          </button>

          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => router.push(otherHref)}
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/75 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-black/5 hover:text-zinc-950 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            <span>{other.toUpperCase()}</span>
          </button>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/75 p-2.5 text-zinc-700 transition hover:bg-black/5 hover:text-zinc-950 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-black/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 lg:hidden"
          >
            <div className="container-skillup grid grid-cols-2 gap-2 py-4">
              {items.map((item) => {
                const active = isActiveHref(item.href);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cx(
                      "rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition",
                      active
                        ? "border-black/10 bg-black/[0.04] text-zinc-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
                        : "border-transparent text-zinc-700 hover:border-black/10 hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-200 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    {getLabel(item.key)}
                  </Link>
                );
              })}

              <Link
                href={`/${locale}/join`}
                className="col-span-2 mt-1 inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300"
              >
                {locale === "ar" ? "انضم إلينا" : "Join Us"}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}