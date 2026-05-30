"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import RichTextEditor from "@/components/rich-text-editor";

type Program = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  youtube_playlist: string | null;
  cover_url: string | null;
  extra_images: string[] | null;
  created_at: string | null;
  is_published: boolean | null;
  is_featured_home: boolean | null;
  featured_order: number | null;
};

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

const BUCKET = "program-images";

const emptyForm = {
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  youtube_playlist: "",
  cover_url: "",
  extra_images: [] as string[],
  is_published: false,
  is_featured_home: false,
  featured_order: 1
};

function safeArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[];
  return [];
}

function extractPlaylistId(input: string) {
  const v = (input || "").trim();
  if (!v) return "";
  if (!v.includes("http") && !v.includes("youtube") && !v.includes("youtu.be")) {
    return v;
  }

  try {
    const url = new URL(v);
    return url.searchParams.get("list") || "";
  } catch {
    return "";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  } catch {
    return "—";
  }
}

export default function AdminProgramsPage() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const isAr = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [rows, setRows] = useState<Program[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [editLang, setEditLang] = useState<"ar" | "en">("ar");
  const [form, setForm] = useState({ ...emptyForm });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [q, setQ] = useState("");

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const extraInputRef = useRef<HTMLInputElement | null>(null);

  const requireAllowedSession = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const email = data.session?.user?.email?.toLowerCase();

    if (!data.session) {
      router.replace(`/${locale}/admin/login`);
      return null;
    }

    if (!email || !ALLOWED.has(email)) {
      await supabaseBrowser.auth.signOut();
      router.replace(`/${locale}/admin/login`);
      return null;
    }

    return data.session;
  }, [locale, router]);

  const load = useCallback(async () => {
    setMessage("");
    setLoading(true);

    const session = await requireAllowedSession();
    if (!session) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser
      .from("programs")
      .select("*")
      .order("is_featured_home", { ascending: false })
      .order("featured_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`❌ ${error.message}`);
      setRows([]);
    } else {
      const mapped = (data ?? []).map((r: any) => ({
        ...r,
        extra_images: safeArray(r.extra_images),
        is_published: !!r.is_published,
        is_featured_home: !!r.is_featured_home,
        featured_order: typeof r.featured_order === "number" ? r.featured_order : null
      })) as Program[];

      setRows(mapped);
    }

    setLoading(false);
  }, [requireAllowedSession]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm({ ...emptyForm });
    setEditing(null);
    setEditLang("ar");
    setMessage("");
  }

  function startCreate() {
    resetForm();
    setOpen(true);
  }

  function startEdit(p: Program) {
    setEditing(p);
    setEditLang("ar");
    setMessage("");
    setForm({
      title_ar: p.title_ar ?? "",
      title_en: p.title_en ?? "",
      description_ar: p.description_ar ?? "",
      description_en: p.description_en ?? "",
      youtube_playlist: p.youtube_playlist ?? "",
      cover_url: p.cover_url ?? "",
      extra_images: safeArray(p.extra_images),
      is_published: !!p.is_published,
      is_featured_home: !!p.is_featured_home,
      featured_order: typeof p.featured_order === "number" ? p.featured_order : 1
    });
    setOpen(true);
  }

  async function uploadToStorage(file: File) {
    const session = await requireAllowedSession();
    if (!session) throw new Error("Unauthorized");

    const ext = file.name.split(".").pop() || "jpg";
    const safeExt = ext.toLowerCase().slice(0, 6);
    const path = `programs/${session.user.id}/${crypto.randomUUID()}.${safeExt}`;

    const { error: upErr } = await supabaseBrowser.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (upErr) throw upErr;

    const { data } = supabaseBrowser.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function pickCover(file: File | null) {
    if (!file) return;
    setMessage("");
    setMediaUploading(true);
    try {
      const url = await uploadToStorage(file);
      setForm((f) => ({ ...f, cover_url: url }));
      setMessage(isAr ? "✅ تم رفع الغلاف بنجاح." : "✅ Cover uploaded successfully.");
    } catch (e: any) {
      setMessage(`❌ ${e?.message || "Upload failed"}`);
    } finally {
      setMediaUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function pickExtras(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMessage("");

    const arr = Array.from(files);
    const remaining = Math.max(0, 2 - (form.extra_images?.length || 0));
    const toUpload = arr.slice(0, remaining);

    if (toUpload.length === 0) {
      setMessage(isAr ? "⚠️ الحد الأقصى صورتان إضافيتان فقط." : "⚠️ You can upload up to 2 extra images only.");
      if (extraInputRef.current) extraInputRef.current.value = "";
      return;
    }

    setMediaUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of toUpload) {
        const url = await uploadToStorage(f);
        uploaded.push(url);
      }

      setForm((prev) => ({
        ...prev,
        extra_images: [...(prev.extra_images || []), ...uploaded]
      }));
      setMessage(isAr ? "✅ تم رفع الصور الإضافية." : "✅ Extra images uploaded successfully.");
    } catch (e: any) {
      setMessage(`❌ ${e?.message || "Upload failed"}`);
    } finally {
      setMediaUploading(false);
      if (extraInputRef.current) extraInputRef.current.value = "";
    }
  }

  function removeExtra(url: string) {
    setForm((f) => ({
      ...f,
      extra_images: (f.extra_images || []).filter((x) => x !== url)
    }));
  }

  async function save() {
    setMessage("");
    setSaving(true);
    try {
      const session = await requireAllowedSession();
      if (!session) {
        setMessage("❌ Unauthorized. Please login again.");
        return;
      }

      if (!form.title_ar.trim() && !form.title_en.trim()) {
        setMessage(isAr ? "⚠️ اكتب عنوان عربي أو إنجليزي على الأقل." : "⚠️ Add Arabic or English title at least.");
        return;
      }

      // تحسين احترافي: تنظيف رابط اليوتيوب وحفظ الـ ID الصافي مباشرة لقاعدة البيانات
      const cleanPlaylistId = extractPlaylistId(form.youtube_playlist);

      const payload = {
        title_ar: form.title_ar || null,
        title_en: form.title_en || null,
        description_ar: form.description_ar || null,
        description_en: form.description_en || null,
        youtube_playlist: cleanPlaylistId || null,
        cover_url: form.cover_url || null,
        extra_images: form.extra_images || [],
        is_published: !!form.is_published,
        is_featured_home: !!form.is_featured_home,
        featured_order: form.is_featured_home ? Number(form.featured_order || 1) : null
      };

      if (editing) {
        const { error } = await supabaseBrowser
          .from("programs")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseBrowser.from("programs").insert(payload);
        if (error) throw error;
      }

      setOpen(false);
      resetForm();
      await load();
      setMessage(editing ? "✅ Program updated successfully." : "✅ Program created successfully.");
    } catch (e: any) {
      setMessage(`❌ ${e?.message || "Failed"}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string, title?: string | null) {
    setMessage("");
    const ok = confirm(
      isAr
        ? `هل تريد حذف البرنامج؟\n\n${title || "بدون عنوان"}`
        : `Delete this program?\n\n${title || "Untitled"}`
    );
    if (!ok) return;

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ Unauthorized. Please login again.");
      return;
    }

    setActionLoadingId(id);

    const { error } = await supabaseBrowser.from("programs").delete().eq("id", id);
    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      await load();
      setMessage("✅ Program deleted successfully.");
    }

    setActionLoadingId(null);
  }

  async function togglePublish(p: Program) {
    setMessage("");
    setActionLoadingId(p.id);

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ Unauthorized. Please login again.");
      setActionLoadingId(null);
      return;
    }

    const { error } = await supabaseBrowser
      .from("programs")
      .update({ is_published: !p.is_published })
      .eq("id", p.id);
    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      await load();
      setMessage(!p.is_published ? "✅ Program published successfully." : "✅ Program unpublished successfully.");
    }

    setActionLoadingId(null);
  }

  async function toggleFeatured(p: Program) {
    setMessage("");
    setActionLoadingId(p.id);

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ Unauthorized. Please login again.");
      setActionLoadingId(null);
      return;
    }

    const nextFeatured = !p.is_featured_home;
    const payload = {
      is_featured_home: nextFeatured,
      featured_order: nextFeatured ? Number(p.featured_order || 1) : null
    };

    const { error } = await supabaseBrowser
      .from("programs")
      .update(payload)
      .eq("id", p.id);
    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      await load();
      setMessage(nextFeatured ? "✅ Program added to Home successfully." : "✅ Program removed from Home successfully.");
    }

    setActionLoadingId(null);
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((p) => {
      const ar = (p.title_ar || "").toLowerCase();
      const en = (p.title_en || "").toLowerCase();
      const y = (p.youtube_playlist || "").toLowerCase();
      return ar.includes(s) || en.includes(s) || y.includes(s);
    });
  }, [rows, q]);

  const playlistId = useMemo(
    () => extractPlaylistId(form.youtube_playlist),
    [form.youtube_playlist]
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const published = rows.filter((r) => r.is_published).length;
    const featured = rows.filter((r) => r.is_featured_home).length;
    const withPlaylist = rows.filter((r) => !!extractPlaylistId(r.youtube_playlist || "")).length;

    return { total, published, featured, withPlaylist };
  }, [rows]);

  const isBusy = (id: string) => actionLoadingId === id;

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "إدارة البرامج" : "Programs Admin"}</h1>
          <p className="text-sm opacity-75">
            {isAr
              ? "إضافة البرامج، رفع الصور، ربط Playlists، والتحكم في النشر والظهور بالرئيسية."
              : "Create programs, upload images, connect playlists, and control publishing/home visibility."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Input
            placeholder={isAr ? "ابحث بالعنوان أو Playlist..." : "Search by title or playlist..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:w-[300px]"
          />

          <Button variant="secondary" onClick={() => load()} disabled={loading}>
            {isAr ? "تحديث" : "Refresh"}
          </Button>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={startCreate}>{isAr ? "إضافة برنامج" : "Add Program"}</Button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl p-0">
              <div className="border-b border-black/10 p-4 dark:border-white/10">
                <DialogHeader>
                  <DialogTitle>
                    {editing ? (isAr ? "تعديل برنامج" : "Edit Program") : (isAr ? "إضافة برنامج" : "Add Program")}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <ScrollArea className="max-h-[80vh]">
                <div className="grid gap-5 p-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{isAr ? "لغة المحتوى" : "Content language"}</div>
                      <div className="flex gap-2">
                        {/* أزرار اختيار اللغة مدمجة بألوان الهوية المعتمدة هندسياً */}
                        <Button
                          type="button"
                          variant={editLang === "ar" ? "default" : "secondary"}
                          className={editLang === "ar" ? "bg-[#182B36] hover:bg-[#182B36]/90 text-white dark:bg-[#C8A448] dark:hover:bg-[#C8A448]/90 dark:text-zinc-950" : ""}
                          onClick={() => setEditLang("ar")}
                        >
                          عربي
                        </Button>
                        <Button
                          type="button"
                          variant={editLang === "en" ? "default" : "secondary"}
                          className={editLang === "en" ? "bg-[#182B36] hover:bg-[#182B36]/90 text-white dark:bg-[#C8A448] dark:hover:bg-[#C8A448]/90 dark:text-zinc-950" : ""}
                          onClick={() => setEditLang("en")}
                        >
                          English
                        </Button>
                      </div>
                    </div>

                    {editLang === "ar" ? (
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <div className="text-xs opacity-70">{isAr ? "العنوان بالعربية" : "Arabic title"}</div>
                          <Input
                            value={form.title_ar}
                            onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))}
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="text-xs opacity-70">{isAr ? "الوصف بالعربية" : "Arabic description"}</div>
                          <RichTextEditor
                            dir="rtl"
                            value={form.description_ar}
                            onChange={(html) => setForm((f) => ({ ...f, description_ar: html }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        <div className="grid gap-2">
                          <div className="text-xs opacity-70">Title in English</div>
                          <Input
                            value={form.title_en}
                            onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="text-xs opacity-70">Description in English</div>
                          <RichTextEditor
                            dir="ltr"
                            value={form.description_en}
                            onChange={(html) => setForm((f) => ({ ...f, description_en: html }))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <div className="text-sm font-medium">YouTube Playlist</div>
                      <Input
                        placeholder="Paste full playlist URL or playlist ID"
                        value={form.youtube_playlist}
                        onChange={(e) => setForm((f) => ({ ...f, youtube_playlist: e.target.value }))}
                      />
                      {playlistId ? (
                        <div className="text-xs opacity-70">
                          Detected playlist ID:{" "}
                          <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">{playlistId}</code>
                        </div>
                      ) : (
                        <div className="text-xs opacity-60">
                          {isAr ? "اتركه فارغًا إذا لم يوجد." : "Leave empty if not available."}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
                      <div className="text-sm font-semibold">{isAr ? "الظهور والنشر" : "Visibility"}</div>

                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={!!form.is_published}
                          onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                        />
                        <span>{isAr ? "منشور (يظهر في صفحة البرامج)" : "Published (visible on programs page)"}</span>
                      </label>

                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={!!form.is_featured_home}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              is_featured_home: e.target.checked
                            }))
                          }
                        />
                        <span>{isAr ? "إظهار في الصفحة الرئيسية" : "Show on Home page"}</span>
                      </label>

                      <div className="grid gap-2">
                        <div className="text-xs opacity-70">{isAr ? "ترتيب الظهور في الرئيسية" : "Featured Order"}</div>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={form.featured_order}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              featured_order: Number(e.target.value || 1)
                            }))
                          }
                          disabled={!form.is_featured_home}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs opacity-70">
                        {isAr ? "صورة رئيسية + حتى صورتين إضافيتين" : "Cover + up to 2 extra images"}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => setOpen(false)}
                          disabled={saving || mediaUploading}
                        >
                          {isAr ? "إلغاء" : "Cancel"}
                        </Button>

                        <Button type="button" onClick={save} disabled={saving || mediaUploading}>
                          {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : editing ? (isAr ? "حفظ" : "Save") : (isAr ? "إنشاء" : "Create")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-semibold">{isAr ? "الصور" : "Images"}</div>
                        <Badge variant="secondary">{(form.extra_images?.length || 0)}/2 extra</Badge>
                      </div>

                      <div className="grid gap-2">
                        <div className="text-xs opacity-70">{isAr ? "الصورة الرئيسية" : "Cover"}</div>

                        {form.cover_url ? (
                          <div className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                            <div className="relative aspect-[16/9] w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={form.cover_url} alt="cover" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-black/20 p-6 text-center text-xs opacity-70 dark:border-white/20">
                            {isAr ? "لا توجد صورة رئيسية بعد" : "No cover yet"}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            disabled={mediaUploading || saving}
                            onChange={(e) => void pickCover(e.target.files?.[0] || null)}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setForm((f) => ({ ...f, cover_url: "" }))}
                            disabled={!form.cover_url || mediaUploading || saving}
                          >
                            {isAr ? "حذف" : "Remove"}
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid gap-2">
                        <div className="text-xs opacity-70">{isAr ? "صور إضافية (حد أقصى 2)" : "Extra images (max 2)"}</div>

                        <div className="grid grid-cols-2 gap-2">
                          {(form.extra_images || []).map((u) => (
                            <div
                              key={u}
                              className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10"
                            >
                              <div className="relative aspect-[4/3] w-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={u} alt="extra" className="h-full w-full object-cover" />
                              </div>

                              <button
                                className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white"
                                onClick={() => removeExtra(u)}
                                disabled={mediaUploading || saving}
                                type="button"
                              >
                                {isAr ? "حذف" : "Remove"}
                              </button>
                            </div>
                          ))}

                          {form.extra_images?.length === 0 ? (
                            <div className="col-span-2 rounded-xl border border-dashed border-black/20 p-6 text-center text-xs opacity-70 dark:border-white/20">
                              {isAr ? "لا توجد صور إضافية" : "No extra images"}
                            </div>
                          ) : null}
                        </div>

                        <Input
                          ref={extraInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={mediaUploading || saving}
                          onChange={(e) => void pickExtras(e.target.files)}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                      <div className="mb-2 text-sm font-semibold">{isAr ? "معاينة" : "Preview"}</div>

                      <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                        <div className="relative aspect-[16/9] w-full bg-black/5 dark:bg-white/5">
                          {form.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={form.cover_url} alt="preview cover" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs opacity-70">
                              {isAr ? "معاينة الغلاف" : "Cover preview"}
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="text-base font-semibold">
                            {form.title_ar || form.title_en || (isAr ? "عنوان البرنامج" : "Program title")}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {form.is_published ? <Badge variant="secondary">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                            {form.is_featured_home ? (
                              <Badge variant="secondary">Home #{form.featured_order || 1}</Badge>
                            ) : (
                              <Badge variant="outline">Not on Home</Badge>
                            )}
                            {playlistId ? <Badge variant="secondary">Playlist</Badge> : <Badge variant="outline">No playlist</Badge>}
                            <Badge variant="outline">Extra: {form.extra_images?.length || 0}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
          <div className="text-xs opacity-70">{isAr ? "إجمالي البرامج" : "Total Programs"}</div>
          <div className="mt-2 text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
          <div className="text-xs opacity-70">{isAr ? "المنشور" : "Published"}</div>
          <div className="mt-2 text-2xl font-bold">{stats.published}</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
          <div className="text-xs opacity-70">{isAr ? "المميز في الرئيسية" : "Featured on Home"}</div>
          <div className="mt-2 text-2xl font-bold">{stats.featured}</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
          <div className="text-xs opacity-70">{isAr ? "بها Playlist" : "With Playlist"}</div>
          <div className="mt-2 text-2xl font-bold">{stats.withPlaylist}</div>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl border border-black/10 p-4 text-sm dark:border-white/10">
          {message}
        </div>
      ) : null}

      {/* تحسين هندسي: إضافة حاوية التمرير الأفقي لحماية الجدول من الانكسار البصري */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? "العنوان (AR)" : "Title (AR)"}</TableHead>
              <TableHead>{isAr ? "العنوان (EN)" : "Title (EN)"}</TableHead>
              <TableHead>{isAr ? "منشور" : "Published"}</TableHead>
              <TableHead>{isAr ? "الرئيسية" : "Home"}</TableHead>
              <TableHead>{isAr ? "الغلاف" : "Cover"}</TableHead>
              <TableHead>Playlist</TableHead>
              <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
              <TableHead className="w-[320px]">{isAr ? "الإجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8} className="py-6 text-center opacity-50">
                    {isAr ? "جارٍ تحميل البرامج..." : "Loading programs..."}
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>{isAr ? "لا توجد برامج بعد." : "No programs yet."}</TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const pid = extractPlaylistId(p.youtube_playlist || "");
                const published = !!p.is_published;
                const home = !!p.is_featured_home;

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title_ar || "-"}</TableCell>
                    <TableCell>{p.title_en || "-"}</TableCell>

                    <TableCell>
                      {published ? <Badge variant="secondary">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                    </TableCell>

                    <TableCell>
                      {home ? <Badge variant="secondary">Home #{p.featured_order ?? 1}</Badge> : <Badge variant="outline">Not on Home</Badge>}
                    </TableCell>

                    <TableCell>
                      {p.cover_url ? (
                        <div className="relative h-10 w-16 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.cover_url} alt="cover" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-xs opacity-60">-</span>
                      )}
                    </TableCell>

                    <TableCell className="opacity-80">
                      {pid ? (
                        <code className="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">{pid}</code>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>{formatDate(p.created_at)}</TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => togglePublish(p)}
                          disabled={isBusy(p.id)}
                        >
                          {published ? (isAr ? "إلغاء النشر" : "Unpublish") : (isAr ? "نشر" : "Publish")}
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => toggleFeatured(p)}
                          disabled={isBusy(p.id)}
                        >
                          {home ? (isAr ? "إزالة من الرئيسية" : "Remove Home") : (isAr ? "إضافة للرئيسية" : "Feature Home")}
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => startEdit(p)}
                          disabled={isBusy(p.id)}
                        >
                          {isAr ? "تعديل" : "Edit"}
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => remove(p.id, p.title_ar || p.title_en)}
                          disabled={isBusy(p.id)}
                        >
                          {isAr ? "حذف" : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs opacity-60">
        {isAr ? "لو ظهرت رسالة Unauthorized، سجّل الدخول من " : 'If you see "Unauthorized", login from '}
        <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
          /{locale}/admin/login
        </code>
      </div>
    </div>
  );
}
