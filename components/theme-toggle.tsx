"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname() ?? "";

  const [mounted, setMounted] = React.useState(false);

  // نضمن استقرار المكون بعد الـ Hydration لمنع وميض الأيقونات
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isArabic = pathname.startsWith("/ar") || pathname.includes("/ar/");
  const isDark = resolvedTheme === "dark";

  const nextThemeLabel = isDark
    ? isArabic
      ? "الوضع الفاتح"
      : "Light Mode"
    : isArabic
      ? "الوضع الداكن"
      : "Dark Mode";

  const buttonLabel = isArabic ? "تبديل وضع العرض" : "Toggle theme";

  return (
    <button
      type="button"
      onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
      aria-label={buttonLabel}
      title={nextThemeLabel}
      disabled={!mounted}
      className={cx(
        "group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98]",
        
        // 🔹 الوضع الفاتح: متناسق تماماً مع الكحلي الرسمي للهوية البصرية (#182B36) عند الـ Hover
        "border-zinc-200 bg-white/80 text-zinc-700 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 hover:text-[#182B36]",
        
        // 🔹 الوضع الداكن: متناسق تماماً مع الذهبي الفخم للهوية البصرية (#C8A448) عند الـ Hover
        "dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300 dark:hover:border-[#C8A448]/30 dark:hover:bg-[#C8A448]/10 dark:hover:text-[#C8A448]",
        
        !mounted && "cursor-wait opacity-80"
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        {mounted ? (
          isDark ? (
            <Sun className="h-4 w-4 text-[#C8A448] transition-transform duration-200 group-hover:rotate-12" />
          ) : (
            <Moon className="h-4 w-4 text-[#182B36] transition-transform duration-200 group-hover:-rotate-12" />
          )
        ) : (
          <Moon className="h-4 w-4 text-zinc-400" />
        )}
      </span>

      <span className="hidden sm:inline">
        {mounted
          ? nextThemeLabel
          : isArabic
            ? "الوضع"
            : "Theme"}
      </span>
    </button>
  );
}
