"use client";

import { useRef } from "react";

type HomeHorizontalSliderProps = {
  children: React.ReactNode;
};

export default function HomeHorizontalSlider({
  children
}: HomeHorizontalSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  function scrollByAmount(direction: "prev" | "next") {
    const el = containerRef.current;
    if (!el) return;

    const amount = Math.max(320, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth"
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollByAmount("prev")}
        aria-label="Previous"
        className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/85 text-base shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-zinc-900/85 dark:hover:bg-zinc-900/95 md:flex"
      >
        ←
      </button>

      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scrollByAmount("next")}
        aria-label="Next"
        className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/85 text-base shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-zinc-900/85 dark:hover:bg-zinc-900/95 md:flex"
      >
        →
      </button>
    </div>
  );
}