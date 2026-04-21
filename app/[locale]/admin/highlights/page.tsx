"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { SECTORS } from "@/lib/sectors-data";
import { Badge } from "@/components/ui/badge";

const ALLOWED = new Set(["skillupyouth.eg@gmail.com", "ahmedyasserellisi@gmail.com"]);
const BUCKET = "highlights-images";

type MonthlyAwardsRow = {
  award_month: string;
  best_sector_slug: string | null;

  best_head_name: string | null;
  best_head_sector_slug: string | null;
  best_head_photo_url: string | null;

  best_deputy_name: string | null;
  best_deputy_sector_slug: string | null;
  best_deputy_photo_url: string | null;

  is_published: boolean;
};

type SectorTopRow = {
  award_month: string;
  sector_slug: string;
  member_name: string;
  member_photo_url: string | null;
  member_role: string | null;
  sort_order: number;
  is_published: boolean;
};

function cx(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(" ");
}

function toMonthStart(v: string) {
  const s = (v || "").trim();
  if (!s) return "";
  if (s.length === 10) return s;
  return `${s}-01`;
}

function getSectorName(locale: "ar" | "en", slug: string | null) {
  const s = SECTORS.find((x) => x.slug === slug);
  if (!s) return "—";
  return locale === "ar" ? s.name_ar : s.name_en;
}

function glass() {
  return "rounded-3xl border border-black/10 bg-white/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/40";
}

function glassHover() {
  return "transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white/70 hover:shadow-md dark:hover:border-white/20 dark:hover:bg-zinc-950/50";
}

function normStr(v: unknown) {
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
}

function messageBoxClass(msg: string) {
  if (msg.startsWith("✅")) {
    return "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400";
  }
  if (msg.startsWith("⚠️")) {
    return "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400";
  }
  return "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400";
}

export default function AdminHighlightsPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale: "ar" | "en" = pathname.startsWith("/en") ? "en" : "ar";
  const isAr = locale === "ar";

  const [checking, setChecking] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const [monthKey, setMonthKey] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  const [awards, setAwards] = useState<MonthlyAwardsRow>(() => ({
    award_month: toMonthStart(monthKey),
    best_sector_slug: null,
    best_head_name: null,
    best_head_sector_slug: null,
    best_head_photo_url: null,
    best_deputy_name: null,
    best_deputy_sector_slug: null,
    best_deputy_photo_url: null,
    is_published: false
  }));

  const [tops, setTops] = useState<Record<string, SectorTopRow>>({});
  const sectors = useMemo(() => SECTORS, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      const email = data.session?.user?.email?.toLowerCase() ?? "";

      if (!data.session) {
        router.replace(`/${locale}/admin/login`);
        return;
      }

      if (!email || !ALLOWED.has(email)) {
        await supabaseBrowser.auth.signOut();
        router.replace(`/${locale}/admin/login`);
        return;
      }

      setChecking(false);
    })();
  }, [router, locale]);

  useEffect(() => {
    if (checking) return;

    void (async () => {
      setMsg("");
      setLoadingMonth(true);

      try {
        const awardMonth = toMonthStart(monthKey);
        if (!awardMonth) return;

        const { data: aRow, error: aErr } = await supabaseBrowser
          .from("monthly_awards")
          .select(
            "award_month,best_sector_slug,best_head_name,best_head_sector_slug,best_head_photo_url,best_deputy_name,best_deputy_sector_slug,best_deputy_photo_url,is_published"
          )
          .eq("award_month", awardMonth)
          .maybeSingle();

        if (aErr) {
          setMsg(`❌ ${aErr.message}`);
        }

        const baseAwards: MonthlyAwardsRow = aRow
          ? (aRow as MonthlyAwardsRow)
          : {
              award_month: awardMonth,
              best_sector_slug: null,
              best_head_name: null,
              best_head_sector_slug: null,
              best_head_photo_url: null,
              best_deputy_name: null,
              best_deputy_sector_slug: null,
              best_deputy_photo_url: null,
              is_published: false
            };

        setAwards(baseAwards);

        const { data: tRows, error: tErr } = await supabaseBrowser
          .from("sector_monthly_top")
          .select("award_month,sector_slug,member_name,member_photo_url,member_role,sort_order,is_published")
          .eq("award_month", awardMonth)
          .order("sector_slug", { ascending: true })
          .order("sort_order", { ascending: true });

        if (tErr) {
          setMsg((m) => (m ? `${m}\n❌ ${tErr.message}` : `❌ ${tErr.message}`));
        }

        const map: Record<string, SectorTopRow> = {};
        for (const s of sectors) {
          for (const order of [1, 2] as const) {
            const key = `${s.slug}:${order}`;
            map[key] = {
              award_month: awardMonth,
              sector_slug: s.slug,
              member_name: "",
              member_photo_url: null,
              member_role: null,
              sort_order: order,
              is_published: false
            };
          }
        }

        for (const r of (tRows ?? []) as SectorTopRow[]) {
          const key = `${r.sector_slug}:${r.sort_order}`;
          map[key] = r;
        }

        setTops(map);
      } finally {
        setLoadingMonth(false);
      }
    })();
  }, [monthKey, checking, sectors]);

  async function uploadImage(file: File) {
    const { data } = await supabaseBrowser.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) throw new Error("Unauthorized");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 6);
    const path = `monthly/${toMonthStart(monthKey)}/${uid}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabaseBrowser.storage.from(BUCKET).upload(path, file, {
      upsert: false
    });
    if (error) throw error;

    const pub = supabaseBrowser.storage.from(BUCKET).getPublicUrl(path);
    return pub.data.publicUrl;
  }

  async function pickUpload(cb: (url: string) => void, file?: File | null) {
    setMsg("");
    if (!file) return;

    setUploadingCount((c) => c + 1);
    try {
      const url = await uploadImage(file);
      cb(url);
      setMsg(isAr ? "✅ تم رفع الصورة بنجاح" : "✅ Image uploaded successfully");
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Upload failed"}`);
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  }

  function setTop(sectorSlug: string, order: 1 | 2, patch: Partial<SectorTopRow>) {
    const key = `${sectorSlug}:${order}`;
    setTops((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch }
    }));
  }

  async function saveAll() {
    setSaving(true);
    setMsg("");

    try {
      const awardMonth = toMonthStart(monthKey);
      if (!awardMonth) {
        setMsg(isAr ? "⚠️ اختار شهر صحيح." : "⚠️ Pick a valid month.");
        return;
      }

      if (uploadingCount > 0) {
        setMsg(
          isAr
            ? "⚠️ استنى لحد ما رفع الصور يخلص وبعدين احفظ."
            : "⚠️ Please wait for uploads to finish, then save."
        );
        return;
      }

      const awardsPayload: MonthlyAwardsRow = {
        ...awards,
        award_month: awardMonth,
        best_sector_slug: normStr(awards.best_sector_slug) as any,
        best_head_name: normStr(awards.best_head_name),
        best_head_sector_slug: normStr(awards.best_head_sector_slug) as any,
        best_head_photo_url: normStr(awards.best_head_photo_url),
        best_deputy_name: normStr(awards.best_deputy_name),
        best_deputy_sector_slug: normStr(awards.best_deputy_sector_slug) as any,
        best_deputy_photo_url: normStr(awards.best_deputy_photo_url),
        is_published: !!awards.is_published
      };

      const { error: upA } = await supabaseBrowser
        .from("monthly_awards")
        .upsert(awardsPayload, { onConflict: "award_month" });

      if (upA) throw upA;

      const list = Object.values(tops).map((r) => ({
        ...r,
        award_month: awardMonth,
        member_name: (r.member_name || "").trim(),
        member_role: normStr(r.member_role),
        member_photo_url: normStr(r.member_photo_url),
        is_published: !!r.is_published
      }));

      const { error: upT } = await supabaseBrowser
        .from("sector_monthly_top")
        .upsert(list, { onConflict: "award_month,sector_slug,sort_order" });

      if (upT) throw upT;

      const { data: verifyRow, error: vErr } = await supabaseBrowser
        .from("monthly_awards")
        .select("award_month,best_head_photo_url,best_deputy_photo_url")
        .eq("award_month", awardMonth)
        .maybeSingle();

      if (vErr) {
        setMsg(
          (isAr ? "✅ تم الحفظ، لكن فشل التحقق.\n" : "✅ Saved, but verify failed.\n") +
            vErr.message
        );
        return;
      }

      const headOk = !!verifyRow?.best_head_photo_url;
      const deputyOk = !!verifyRow?.best_deputy_photo_url;

      if (
        !headOk &&
        !deputyOk &&
        (awardsPayload.best_head_photo_url || awardsPayload.best_deputy_photo_url)
      ) {
        setMsg(
          (isAr
            ? "⚠️ تم الحفظ، لكن روابط الصور لم تُسجَّل في الجدول. غالبًا أسماء الأعمدة في الداتابيز مختلفة.\n"
            : "⚠️ Saved, but image URLs were not stored. Likely DB column names mismatch.\n") +
            `Debug:\nSaved payload head=${awardsPayload.best_head_photo_url ?? "NULL"}\nSaved payload deputy=${awardsPayload.best_deputy_photo_url ?? "NULL"}\nDB returned head=${verifyRow?.best_head_photo_url ?? "NULL"}\nDB returned deputy=${verifyRow?.best_deputy_photo_url ?? "NULL"}`
        );
        return;
      }

      setMsg(isAr ? "✅ تم الحفظ بنجاح" : "✅ Saved successfully");
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Save failed"}`);
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploadingCount > 0;
  const publishedTopCount = Object.values(tops).filter((x) => x.is_published).length;

  if (checking) {
    return (
      <div className={cx(glass(), "p-6 text-sm opacity-80")}>
        {isAr ? "جاري التحقق..." : "Checking..."}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            {isAr ? "لوحة تكريمات الشهر" : "Monthly Highlights Admin"}
          </h1>

          {awards.is_published ? (
            <Badge variant="secondary">{isAr ? "منشور" : "Published"}</Badge>
          ) : (
            <Badge variant="outline">{isAr ? "Draft" : "Draft"}</Badge>
          )}

          {uploadingCount > 0 ? (
            <Badge variant="outline">{isAr ? "رفع صور..." : "Uploading..."}</Badge>
          ) : null}
        </div>

        <p className="text-sm opacity-75">
          {isAr
            ? "تعديل أفضل قطاع + أفضل رئيس/نائب + أفضل 2 من كل قطاع، مع رفع صورهم ونشر الشهر."
            : "Edit best sector + head/deputy + top 2 per sector, upload images and publish the month."}
        </p>

        {loadingMonth ? (
          <div className="text-sm opacity-70">
            {isAr ? "جاري تحميل بيانات الشهر..." : "Loading selected month..."}
          </div>
        ) : null}
      </header>

      {msg ? (
        <div className={cx(glass(), "p-4 text-sm whitespace-pre-line border", messageBoxClass(msg))}>
          {msg}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={cx(glass(), "p-4")}>
          <div className="text-xs opacity-70">{isAr ? "الشهر الحالي" : "Current month"}</div>
          <div className="mt-2 text-lg font-bold">{monthKey}</div>
        </div>

        <div className={cx(glass(), "p-4")}>
          <div className="text-xs opacity-70">{isAr ? "الحالة" : "Status"}</div>
          <div className="mt-2 text-lg font-bold">
            {awards.is_published ? (isAr ? "منشور" : "Published") : "Draft"}
          </div>
        </div>

        <div className={cx(glass(), "p-4")}>
          <div className="text-xs opacity-70">{isAr ? "الفائزون المنشورون" : "Published winners"}</div>
          <div className="mt-2 text-lg font-bold">{publishedTopCount}</div>
        </div>

        <div className={cx(glass(), "p-4")}>
          <div className="text-xs opacity-70">{isAr ? "العمليات الجارية" : "Running tasks"}</div>
          <div className="mt-2 text-lg font-bold">
            {busy ? (isAr ? "نشط" : "Active") : (isAr ? "جاهز" : "Ready")}
          </div>
        </div>
      </section>

      <section className={cx(glass(), "p-6 grid gap-4")}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="text-sm font-semibold">{isAr ? "الشهر" : "Month"}</div>
            <input
              type="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950/40"
            />
            <div className="text-xs opacity-60">
              {isAr ? "يتم الحفظ كـ YYYY-MM-01 داخل قاعدة البيانات." : "Saved as YYYY-MM-01 in database."}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-semibold">{isAr ? "نشر التكريمات" : "Publish"}</div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!awards.is_published}
                onChange={(e) => setAwards((p) => ({ ...p, is_published: e.target.checked }))}
              />
              {isAr ? "إظهار هذا الشهر للزوار" : "Show this month publicly"}
            </label>
            <div className="text-xs opacity-60">
              {isAr
                ? "الصفحة العامة تقرأ آخر شهر منشور فقط."
                : "The public page reads the latest published month only."}
            </div>
          </div>
        </div>
      </section>

      <section className={cx(glass(), "p-6 grid gap-5")}>
        <h2 className="text-lg font-bold">{isAr ? "الأفضل على مستوى القطاعات" : "Overall winners"}</h2>

        <div className={cx(glass(), "p-5")}>
          <div className="text-sm font-semibold">{isAr ? "🏅 أفضل قطاع" : "🏅 Best sector"}</div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_280px]">
            <select
              value={awards.best_sector_slug ?? ""}
              onChange={(e) => setAwards((p) => ({ ...p, best_sector_slug: e.target.value || null }))}
              className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950/40"
            >
              <option value="">{isAr ? "اختر القطاع" : "Select sector"}</option>
              {sectors.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {isAr ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>

            <div className="text-sm opacity-75">
              {isAr ? "المختار: " : "Selected: "}
              <span className="font-semibold">{getSectorName(locale, awards.best_sector_slug)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className={cx(glass(), glassHover(), "p-5")}>
            <div className="text-sm font-semibold">{isAr ? "⭐ أفضل رئيس قطاع" : "⭐ Best Head"}</div>

            <div className="mt-3 grid gap-2">
              <input
                value={awards.best_head_name ?? ""}
                onChange={(e) => setAwards((p) => ({ ...p, best_head_name: e.target.value }))}
                placeholder={isAr ? "اسم الرئيس" : "Head name"}
                className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950/40"
              />

              <select
                value={awards.best_head_sector_slug ?? ""}
                onChange={(e) => setAwards((p) => ({ ...p, best_head_sector_slug: e.target.value || null }))}
                className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950/40"
              >
                <option value="">{isAr ? "قطاعه" : "Sector"}</option>
                {sectors.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {isAr ? s.name_ar : s.name_en}
                  </option>
                ))}
              </select>

              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) =>
                  void pickUpload(
                    (url) => setAwards((p) => ({ ...p, best_head_photo_url: url })),
                    e.target.files?.[0]
                  )
                }
              />

              {awards.best_head_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={awards.best_head_photo_url}
                  alt=""
                  className="h-20 w-20 rounded-3xl border border-black/10 object-cover dark:border-white/10"
                />
              ) : null}
            </div>
          </div>

          <div className={cx(glass(), glassHover(), "p-5")}>
            <div className="text-sm font-semibold">{isAr ? "🔥 أفضل نائب" : "🔥 Best Deputy"}</div>

            <div className="mt-3 grid gap-2">
              <input
                value={awards.best_deputy_name ?? ""}
                onChange={(e) => setAwards((p) => ({ ...p, best_deputy_name: e.target.value }))}
                placeholder={isAr ? "اسم النائب" : "Deputy name"}
                className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950/40"
              />

              <select
                value={awards.best_deputy_sector_slug ?? ""}
                onChange={(e) => setAwards((p) => ({ ...p, best_deputy_sector_slug: e.target.value || null }))}
                className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950/40"
              >
                <option value="">{isAr ? "قطاعه" : "Sector"}</option>
                {sectors.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {isAr ? s.name_ar : s.name_en}
                  </option>
                ))}
              </select>

              <input
                type="file"
                accept="image/*"
                className="text-sm"
                onChange={(e) =>
                  void pickUpload(
                    (url) => setAwards((p) => ({ ...p, best_deputy_photo_url: url })),
                    e.target.files?.[0]
                  )
                }
              />

              {awards.best_deputy_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={awards.best_deputy_photo_url}
                  alt=""
                  className="h-20 w-20 rounded-3xl border border-black/10 object-cover dark:border-white/10"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={cx(glass(), "p-6 grid gap-4")}>
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-bold">{isAr ? "🌟 أفضل 2 من كل قطاع" : "🌟 Top 2 per sector"}</h2>

          <button
            onClick={() => void saveAll()}
            disabled={busy}
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {busy
              ? isAr
                ? uploadingCount > 0
                  ? "جارٍ رفع الصور..."
                  : "جارٍ الحفظ..."
                : uploadingCount > 0
                  ? "Uploading..."
                  : "Saving..."
              : isAr
                ? "حفظ"
                : "Save"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => {
            const k1 = `${s.slug}:1`;
            const k2 = `${s.slug}:2`;
            const r1 = tops[k1];
            const r2 = tops[k2];

            return (
              <div key={s.slug} className={cx(glass(), glassHover(), "p-5")}>
                <div className="text-xs font-semibold opacity-70">{s.short}</div>
                <div className="mt-1 text-base font-bold">{isAr ? s.name_ar : s.name_en}</div>

                <div className="mt-4 grid gap-2 rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                  <div className="text-xs font-semibold opacity-75">{isAr ? "🥇 الأول" : "🥇 First"}</div>

                  <input
                    value={r1?.member_name ?? ""}
                    onChange={(e) => setTop(s.slug, 1, { member_name: e.target.value })}
                    placeholder={isAr ? "اسم العضو" : "Member name"}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950/40"
                  />
                  <input
                    value={r1?.member_role ?? ""}
                    onChange={(e) => setTop(s.slug, 1, { member_role: e.target.value })}
                    placeholder={isAr ? "الدور (اختياري)" : "Role (optional)"}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950/40"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={(e) =>
                      void pickUpload(
                        (url) => setTop(s.slug, 1, { member_photo_url: url }),
                        e.target.files?.[0]
                      )
                    }
                  />

                  {r1?.member_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r1.member_photo_url}
                      alt=""
                      className="h-16 w-16 rounded-2xl border border-black/10 object-cover dark:border-white/10"
                    />
                  ) : null}

                  <label className="mt-1 flex items-center gap-2 text-xs opacity-80">
                    <input
                      type="checkbox"
                      checked={!!r1?.is_published}
                      onChange={(e) => setTop(s.slug, 1, { is_published: e.target.checked })}
                    />
                    {isAr ? "نشر" : "Publish"}
                  </label>
                </div>

                <div className="mt-3 grid gap-2 rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-zinc-950/40">
                  <div className="text-xs font-semibold opacity-75">{isAr ? "🥈 الثاني" : "🥈 Second"}</div>

                  <input
                    value={r2?.member_name ?? ""}
                    onChange={(e) => setTop(s.slug, 2, { member_name: e.target.value })}
                    placeholder={isAr ? "اسم العضو" : "Member name"}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950/40"
                  />
                  <input
                    value={r2?.member_role ?? ""}
                    onChange={(e) => setTop(s.slug, 2, { member_role: e.target.value })}
                    placeholder={isAr ? "الدور (اختياري)" : "Role (optional)"}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950/40"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={(e) =>
                      void pickUpload(
                        (url) => setTop(s.slug, 2, { member_photo_url: url }),
                        e.target.files?.[0]
                      )
                    }
                  />

                  {r2?.member_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r2.member_photo_url}
                      alt=""
                      className="h-16 w-16 rounded-2xl border border-black/10 object-cover dark:border-white/10"
                    />
                  ) : null}

                  <label className="mt-1 flex items-center gap-2 text-xs opacity-80">
                    <input
                      type="checkbox"
                      checked={!!r2?.is_published}
                      onChange={(e) => setTop(s.slug, 2, { is_published: e.target.checked })}
                    />
                    {isAr ? "نشر" : "Publish"}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void saveAll()}
            disabled={busy}
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {busy
              ? isAr
                ? uploadingCount > 0
                  ? "جارٍ رفع الصور..."
                  : "جارٍ الحفظ..."
                : uploadingCount > 0
                  ? "Uploading..."
                  : "Saving..."
              : isAr
                ? "حفظ كل البيانات"
                : "Save all"}
          </button>

          <button
            type="button"
            onClick={() => router.push(`/${locale}/highlights`)}
            className="rounded-2xl border border-black/10 bg-white/60 px-5 py-3 text-sm font-semibold transition hover:bg-white/80 dark:border-white/10 dark:bg-zinc-950/40 dark:hover:bg-zinc-950/60"
          >
            {isAr ? "فتح صفحة التكريمات العامة" : "Open public highlights"}
          </button>
        </div>
      </section>
    </div>
  );
}