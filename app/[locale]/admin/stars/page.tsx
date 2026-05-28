"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SECTORS, type Sector } from "@/lib/sectors-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  month: string;
  sector_slug: string;
  rank: number;
  name: string;
  title: string | null;
  photo_url: string | null;
  profile_url: string | null;
};

type ByKey = Map<string, Row>;

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

function monthStartISO(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

// ─── Component منفصل لكل Rank داخل القطاع ───────────────────────
type RankRowProps = {
  rank: 1 | 2;
  sector: Sector;
  month: string;
  initial: Row | undefined;
  isAr: boolean;
  onSave: (payload: Omit<Row, "id"> & { id?: string }) => Promise<void>;
  onDelete: (id?: string) => Promise<void>;
};

function RankRow({ rank, sector, month, initial, isAr, onSave, onDelete }: RankRowProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [photo, setPhoto] = useState(initial?.photo_url ?? "");
  const [profile, setProfile] = useState(initial?.profile_url ?? "");

  // إعادة ضبط القيم لما يتغير الشهر أو يُحمَّل بيانات جديدة
  useEffect(() => {
    setName(initial?.name ?? "");
    setTitle(initial?.title ?? "");
    setPhoto(initial?.photo_url ?? "");
    setProfile(initial?.profile_url ?? "");
  }, [initial]);

  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
      <div className="mb-3 text-sm font-semibold">
        {rank === 1 ? "🥇" : "🥈"} {isAr ? "المركز" : "Rank"} {rank}
      </div>

      <div className="grid gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isAr ? "الاسم" : "Name"}
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isAr ? "الوصف/اللقب (اختياري)" : "Title (optional)"}
        />
        <Input
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
          placeholder={isAr ? "رابط الصورة (اختياري)" : "Photo URL (optional)"}
        />
        <Input
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          placeholder={isAr ? "رابط البروفايل (اختياري)" : "Profile URL (optional)"}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={() =>
            void onSave({
              id: initial?.id,
              month,
              sector_slug: sector.slug,
              rank,
              name: name.trim() || (isAr ? "بدون اسم" : "Unnamed"),
              title: title.trim() || null,
              photo_url: photo.trim() || null,
              profile_url: profile.trim() || null
            })
          }
        >
          {isAr ? "حفظ" : "Save"}
        </Button>

        <Button
          variant="destructive"
          onClick={() => void onDelete(initial?.id)}
          disabled={!initial?.id}
        >
          {isAr ? "حذف" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

// ─── Component كامل للقطاع ────────────────────────────────────────
type SectorCardProps = {
  sector: Sector;
  month: string;
  byKey: ByKey;
  isAr: boolean;
  onSave: (payload: Omit<Row, "id"> & { id?: string }) => Promise<void>;
  onDelete: (id?: string) => Promise<void>;
};

function SectorCard({ sector, month, byKey, isAr, onSave, onDelete }: SectorCardProps) {
  const r1 = byKey.get(`${sector.slug}:1`);
  const r2 = byKey.get(`${sector.slug}:2`);

  return (
    <section className="rounded-3xl border border-black/10 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold opacity-70">{sector.short}</div>
          <div className="mt-1 text-lg font-semibold">
            {isAr ? sector.name_ar : sector.name_en}
          </div>
        </div>
        <div className="text-xs opacity-70">{month}</div>
      </div>

      <div className="mt-4 grid gap-4">
        <RankRow
          rank={1}
          sector={sector}
          month={month}
          initial={r1}
          isAr={isAr}
          onSave={onSave}
          onDelete={onDelete}
        />
        <RankRow
          rank={2}
          sector={sector}
          month={month}
          initial={r2}
          isAr={isAr}
          onSave={onSave}
          onDelete={onDelete}
        />
      </div>
    </section>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────
export default function AdminStarsPage() {
  const params = useParams<{ locale: "ar" | "en" }>();
  const locale = params?.locale ?? "ar";
  const isAr = locale === "ar";

  const [month, setMonth] = useState(monthStartISO());
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const requireAllowedSession = async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const email = data.session?.user?.email?.toLowerCase();
    if (!data.session || !email || !ALLOWED.has(email)) return null;
    return data.session;
  };

  const load = async () => {
    setErrorMsg("");
    setLoading(true);

    const session = await requireAllowedSession();
    if (!session) {
      setErrorMsg("Unauthorized. Please login with an allowed email.");
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser
      .from("sector_stars")
      .select("*")
      .eq("month", month)
      .order("sector_slug", { ascending: true })
      .order("rank", { ascending: true });

    if (error) setErrorMsg(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // بناء Map من الـ rows للوصول السريع
  const byKey: ByKey = new Map(
    rows.map((r) => [`${r.sector_slug}:${r.rank}`, r])
  );

  const upsert = async (payload: Omit<Row, "id"> & { id?: string }) => {
    setErrorMsg("");
    const session = await requireAllowedSession();
    if (!session) {
      setErrorMsg("Unauthorized. Please login again.");
      return;
    }

    const { error } = await supabaseBrowser
      .from("sector_stars")
      .upsert({
        id: payload.id,
        month: payload.month,
        sector_slug: payload.sector_slug,
        rank: payload.rank,
        name: payload.name,
        title: payload.title,
        photo_url: payload.photo_url,
        profile_url: payload.profile_url
      });

    if (error) setErrorMsg(error.message);
    else await load();
  };

  const remove = async (id?: string) => {
    if (!id) return;
    setErrorMsg("");
    const session = await requireAllowedSession();
    if (!session) {
      setErrorMsg("Unauthorized. Please login again.");
      return;
    }

    const { error } = await supabaseBrowser
      .from("sector_stars")
      .delete()
      .eq("id", id);

    if (error) setErrorMsg(error.message);
    else await load();
  };

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-xl font-semibold">
          {isAr ? "أفضل 2 شهريًا لكل قطاع" : "Top 2 Monthly per Sector"}
        </h1>
        <p className="text-sm opacity-75">
          {isAr
            ? "اختار الشهر وعدّل الفائزين."
            : "Pick a month and update winners."}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="month"
            value={month.slice(0, 7)}
            onChange={(e) => setMonth(`${e.target.value}-01`)}
            className="max-w-[220px]"
          />
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            {isAr ? "تحديث" : "Refresh"}
          </Button>

          <a
            href={`/${locale}/stars?month=${month}`}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            target="_blank"
            rel="noreferrer"
          >
            {isAr ? "عرض الصفحة العامة" : "Open public page"}
          </a>
        </div>
      </header>

      {errorMsg ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm opacity-70">
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {SECTORS.map((sector) => (
            <SectorCard
              key={sector.slug}
              sector={sector}
              month={month}
              byKey={byKey}
              isAr={isAr}
              onSave={upsert}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
