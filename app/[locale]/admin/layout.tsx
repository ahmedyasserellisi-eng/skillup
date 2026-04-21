"use client";

import "../../globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({
  href,
  label,
  pathname
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 transition ${
        active
          ? "bg-black/10 font-semibold dark:bg-white/20"
          : "hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-3xl border border-black/10 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
          {/* Logo */}
          <div className="mb-6">
            <div className="text-xs opacity-70">SkillUp Dashboard</div>
            <div className="text-xl font-bold">
              {isAr ? "لوحة الإدارة" : "Admin Panel"}
            </div>
          </div>

          {/* Navigation */}
          <nav className="grid gap-1 text-sm">
            <NavItem
              href={`/${locale}/admin`}
              label={isAr ? "لوحة التحكم" : "Dashboard"}
              pathname={pathname}
            />

            <NavItem
              href={`/${locale}/admin/highlights`}
              label={isAr ? "التكريمات" : "Highlights"}
              pathname={pathname}
            />

            <NavItem
              href={`/${locale}/admin/events`}
              label={isAr ? "الفعاليات" : "Events"}
              pathname={pathname}
            />

            <NavItem
              href={`/${locale}/admin/programs`}
              label={isAr ? "البرامج" : "Programs"}
              pathname={pathname}
            />

            <NavItem
              href={`/${locale}/admin/join-requests`}
              label={isAr ? "طلبات الانضمام" : "Join Requests"}
              pathname={pathname}
            />

            <NavItem
              href={`/${locale}/admin/messages`}
              label={isAr ? "الرسائل" : "Messages"}
              pathname={pathname}
            />

            <div className="my-3 h-px bg-black/10 dark:bg-white/10" />

            <NavItem
              href={`/${locale}/admin/settings`}
              label={isAr ? "الإعدادات" : "Settings"}
              pathname={pathname}
            />

            <Link
              href={`/${locale}/admin/login`}
              className="rounded-xl px-3 py-2 text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
            >
              {isAr ? "تسجيل الدخول" : "Login"}
            </Link>
          </nav>

          <div className="mt-6 text-xs opacity-60">
            {isAr ? "Tip: استخدم" : "Tip: use"}{" "}
            <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
              /{locale}/admin/login
            </code>
          </div>
        </aside>

        {/* Main */}
        <div className="grid gap-4">
          {/* Header */}
          <header className="rounded-3xl border border-black/10 bg-white/60 px-5 py-3 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {isAr ? "لوحة تحكم SkillUp" : "SkillUp Admin Dashboard"}
              </div>

              <Link
                href={`/${locale}`}
                className="rounded-xl border border-black/10 px-3 py-1 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
              >
                {isAr ? "عرض الموقع" : "View Website"}
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="rounded-3xl border border-black/10 bg-white/60 p-6 backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}