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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isArabic = pathname.startsWith("/ar");
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
        "group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition duration-200",
        "border-sky-100 bg-white/80 text-zinc-700 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
        "dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:border-amber-300/20 dark:hover:bg-amber-400/10 dark:hover:text-amber-200",
        !mounted && "cursor-wait opacity-80"
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">
        {mounted ? (
          isDark ? (
            <Sun className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
          ) : (
            <Moon className="h-4 w-4 transition-transform duration-200 group-hover:-rotate-12" />
          )
        ) : (
          <Moon className="h-4 w-4" />
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