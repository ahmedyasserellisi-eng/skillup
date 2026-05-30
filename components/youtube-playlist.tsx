"use client";

import * as React from "react";

type VideoItem = {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  durationSec: number;
};

function fmt(sec: number) {
  const s = Math.max(0, sec || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function YouTubePlaylist({
  playlistId,
  locale
}: {
  playlistId: string;
  locale: "ar" | "en";
}) {
  const [items, setItems] = React.useState<VideoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const [activeId, setActiveId] = React.useState<string>("");

  const isAr = locale === "ar";

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/youtube/playlist?playlistId=${encodeURIComponent(playlistId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load playlist");

        const list = (json.items || []) as VideoItem[];
        if (!cancelled) {
          setItems(list);
          setActiveId(list[0]?.videoId || "");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (playlistId) void run();
    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  const playerUrl = activeId
    ? `https://www.youtube.com/embed/${activeId}?rel=0&autoplay=0`
    : "";

  return (
    <section className="grid gap-4">
      {/* الترويسة العلوية للمكون */}
      <div className="flex items-end justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-3">
        <h3 className="text-lg font-bold text-zinc-950 dark:text-white">
          {isAr ? "فيديوهات ومحاضرات المسار" : "Videos & Lectures"}
        </h3>
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {isAr ? "تشغيل مباشر داخل الموقع" : "In-page responsive player"}
        </div>
      </div>

      {/* إطار مشغل الفيديو مع انحناءات متناسقة وتحميل كسول */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-zinc-950 shadow-inner">
        <div className="relative aspect-video w-full">
          {playerUrl ? (
            <iframe
              src={playerUrl}
              title="YouTube player"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              {loading
                ? isAr ? "جارٍ جلب وتجهيز قائمة الفيديوهات التدريبية…" : "Loading playlist data…"
                : isAr ? "لا توجد فيديوهات متاحة حاليًا" : "No video available"}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {/* قائمة الفيديوهات السفلية مع إبراز حالة النشاط بلون الهوية */}
      {loading ? (
        <div className="text-xs font-medium text-zinc-500 animate-pulse px-1">
          {isAr ? "جاري تحديث القائمة…" : "Loading track list…"}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-black/10 p-4 text-xs font-medium text-zinc-500 dark:border-white/10">
          {isAr ? "قائمة التشغيل الرقمية فارغة حالياً." : "No videos found in this playlist."}
        </div>
      ) : (
        <div className="grid gap-2 max-h-[360px] overflow-y-auto pr-1 pl-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {items.map((v) => {
            const active = v.videoId === activeId;
            return (
              <button
                key={v.videoId}
                type="button"
                onClick={() => setActiveId(v.videoId)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl border p-2 text-right transition active:scale-[0.995]",
                  "border-black/5 bg-white/50 hover:bg-black/[0.02] dark:border-white/5 dark:bg-zinc-950/20 dark:hover:bg-white/[0.02]",
                  active 
                    ? "ring-2 ring-[#182B36] border-transparent bg-zinc-50 dark:ring-[#C8A448] dark:bg-zinc-900/50" 
                    : ""
                ].join(" ")}
              >
                {/* الصورة المصغرة للفيديو ومدة العرض */}
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900">
                  <img src={v.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                  {v.durationSec ? (
                    <span className="absolute bottom-1 right-1 rounded bg-black/85 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider">
                      {fmt(v.durationSec)}
                    </span>
                  ) : null}
                </div>

                {/* عنوان الفيديو ومعرّفه الفني */}
                <div className="min-w-0 flex-1">
                  <div className={[
                    "line-clamp-2 text-xs font-semibold leading-relaxed transition-colors",
                    active ? "text-[#182B36] dark:text-[#C8A448]" : "text-zinc-800 dark:text-zinc-200"
                  ].join(" ")}>
                    {v.title}
                  </div>
                  <div className="mt-1 text-[10px] font-mono opacity-50 tracking-tight">
                    ID: {v.videoId}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
