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
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-xl font-semibold">{locale === "ar" ? "الفيديوهات" : "Videos"}</h2>
        <div className="text-xs opacity-70">
          {locale === "ar" ? "تشغيل داخل الموقع + قائمة فيديوهات تحت" : "In-page player + list below"}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
        <div className="relative aspect-video w-full">
          {playerUrl ? (
            <iframe
              src={playerUrl}
              title="YouTube player"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm opacity-70">
              {loading
                ? locale === "ar" ? "جارِ التحميل…" : "Loading…"
                : locale === "ar" ? "لا يوجد فيديو" : "No video"}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm opacity-70">{locale === "ar" ? "تحميل القائمة…" : "Loading list…"}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-black/10 p-4 text-sm opacity-75 dark:border-white/10">
          {locale === "ar" ? "لا يوجد فيديوهات في هذه القائمة بعد." : "No videos in this playlist yet."}
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((v) => {
            const active = v.videoId === activeId;
            return (
              <button
                key={v.videoId}
                type="button"
                onClick={() => setActiveId(v.videoId)}
                className={[
                  "flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition",
                  "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10",
                  active ? "ring-2 ring-black/10 dark:ring-white/10" : ""
                ].join(" ")}
              >
                <div className="relative h-16 w-28 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnail} alt="" className="h-full w-full object-cover" />
                  {v.durationSec ? (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                      {fmt(v.durationSec)}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium">{v.title}</div>
                  <div className="mt-1 text-xs opacity-70">{v.videoId}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}