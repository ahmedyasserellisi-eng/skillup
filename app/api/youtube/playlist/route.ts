import { NextResponse } from "next/server";

type Item = {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  durationSec: number;
};

function parseISODurationToSeconds(iso: string): number {
  // Examples: PT5M3S, PT1H2M, PT45S
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  return h * 3600 + min * 60 + s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playlistId = (searchParams.get("playlistId") || "").trim();

  if (!playlistId) {
    return NextResponse.json({ items: [], error: "Missing playlistId" }, { status: 400 });
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { items: [], error: "Missing YOUTUBE_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    // 1) Get playlist items (video IDs + titles + thumbnails)
    const itemsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    itemsUrl.searchParams.set("part", "snippet,contentDetails");
    itemsUrl.searchParams.set("maxResults", "25");
    itemsUrl.searchParams.set("playlistId", playlistId);
    itemsUrl.searchParams.set("key", key);

    const itemsRes = await fetch(itemsUrl.toString(), {
      // caching (اختياري)
      next: { revalidate: 300 }
    });

    const itemsJson = await itemsRes.json();
    if (!itemsRes.ok) {
      return NextResponse.json(
        { items: [], error: itemsJson?.error?.message || "YouTube playlistItems failed" },
        { status: 400 }
      );
    }

    const base = (itemsJson.items || []).map((it: any) => {
      const sn = it.snippet || {};
      const cd = it.contentDetails || {};
      const thumbs = sn.thumbnails || {};
      const best =
        thumbs.maxres?.url ||
        thumbs.standard?.url ||
        thumbs.high?.url ||
        thumbs.medium?.url ||
        thumbs.default?.url ||
        "";

      return {
        videoId: cd.videoId as string,
        title: (sn.title as string) || "",
        thumbnail: best,
        publishedAt: (sn.publishedAt as string) || ""
      };
    }).filter((x: any) => x.videoId);

    if (base.length === 0) {
      return NextResponse.json({ items: [] satisfies Item[] });
    }

    // 2) Get durations via videos endpoint
    const ids = base.map((x: any) => x.videoId).join(",");
    const vidsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    vidsUrl.searchParams.set("part", "contentDetails");
    vidsUrl.searchParams.set("id", ids);
    vidsUrl.searchParams.set("key", key);

    const vidsRes = await fetch(vidsUrl.toString(), { next: { revalidate: 300 } });
    const vidsJson = await vidsRes.json();

    const durationMap = new Map<string, number>();
    if (vidsRes.ok) {
      for (const v of vidsJson.items || []) {
        const id = v.id as string;
        const iso = v.contentDetails?.duration as string;
        durationMap.set(id, parseISODurationToSeconds(iso || ""));
      }
    }

    const out: Item[] = base.map((x: any) => ({
      ...x,
      durationSec: durationMap.get(x.videoId) ?? 0
    }));

    return NextResponse.json({ items: out });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || "Server error" }, { status: 500 });
  }
}