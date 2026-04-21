"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import RichTextEditor from "@/components/rich-text-editor";

type EventType = "online" | "offline";
type SortKey = "date_asc" | "date_desc" | "created_desc";

type EventRow = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  event_type: EventType | null;
  location: string | null;
  event_date: string | null;
  image1_url: string | null;
  image2_url: string | null;
  created_at: string;
  is_published: boolean | null;
  is_featured_home: boolean | null;
  featured_order: number | null;
};

const ADMIN_EMAILS = ["skillupyouth.eg@gmail.com", "ahmedyasserellisi@gmail.com"];
const BUCKET = "event-images";

const emptyForm = {
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  event_type: "online" as EventType,
  location: "",
  event_date: "",
  is_published: false,
  is_featured_home: false,
  featured_order: 1
};

function safeLower(v: string | null | undefined) {
  return (v ?? "").toLowerCase();
}

function extractStoragePath(publicUrl: string) {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

function toCSV(rows: EventRow[]) {
  const header = [
    "id",
    "title_ar",
    "title_en",
    "event_type",
    "event_date",
    "location",
    "is_published",
    "is_featured_home",
    "featured_order",
    "image1_url",
    "image2_url",
    "created_at"
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? "");
    const needs = s.includes(",") || s.includes('"') || s.includes("\n");
    const out = s.replace(/"/g, '""');
    return needs ? `"${out}"` : out;
  };

  return [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.title_ar,
        r.title_en,
        r.event_type,
        r.event_date,
        r.location,
        r.is_published,
        r.is_featured_home,
        r.featured_order,
        r.image1_url,
        r.image2_url,
        r.created_at
      ]
        .map(escape)
        .join(",")
    )
  ].join("\n");
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
    return value;
  }
}

export default function AdminEventsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [msg, setMsg] = useState<string>("");

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EventType>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date_asc");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [editLang, setEditLang] = useState<"ar" | "en">("ar");
  const [form, setForm] = useState({ ...emptyForm });

  const [image1File, setImage1File] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image1Preview, setImage1Preview] = useState<string | null>(null);
  const [image2Preview, setImage2Preview] = useState<string | null>(null);

  async function checkAdmin() {
    const { data } = await supabaseBrowser.auth.getUser();
    const email = (data.user?.email ?? "").toLowerCase();
    return ADMIN_EMAILS.includes(email);
  }

  async function load() {
    setLoading(true);
    setMsg("");

    const ok = await checkAdmin();
    if (!ok) {
      setRows([]);
      setMsg("Not authorized. Please login with an admin email.");
      setLoading(false);
      return;
    }

    let q = supabaseBrowser.from("events").select("*");

    if (sortKey === "date_asc") {
      q = q.order("event_date", { ascending: true }).order("created_at", { ascending: false });
    }
    if (sortKey === "date_desc") {
      q = q.order("event_date", { ascending: false }).order("created_at", { ascending: false });
    }
    if (sortKey === "created_desc") {
      q = q.order("created_at", { ascending: false });
    }

    const { data, error } = await q.limit(300);

    if (error) {
      setRows([]);
      setMsg(`❌ ${error.message}`);
    } else {
      setRows((data ?? []) as EventRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [sortKey]);

  function resetEditor() {
    setEditing(null);
    setForm({ ...emptyForm });
    setImage1File(null);
    setImage2File(null);
    setImage1Preview(null);
    setImage2Preview(null);
    setEditLang("ar");
  }

  function startCreate() {
    setMsg("");
    resetEditor();
    setEditorOpen(true);
  }

  function startEdit(r: EventRow) {
    setMsg("");
    setEditing(r);
    setForm({
      title_ar: r.title_ar ?? "",
      title_en: r.title_en ?? "",
      description_ar: r.description_ar ?? "",
      description_en: r.description_en ?? "",
      event_type: (r.event_type ?? "online") as EventType,
      location: r.location ?? "",
      event_date: r.event_date ?? "",
      is_published: !!r.is_published,
      is_featured_home: !!r.is_featured_home,
      featured_order: typeof r.featured_order === "number" ? r.featured_order : 1
    });
    setImage1Preview(r.image1_url ?? null);
    setImage2Preview(r.image2_url ?? null);
    setImage1File(null);
    setImage2File(null);
    setEditLang("ar");
    setEditorOpen(true);
  }

  function onPickImage1(f: File | null) {
    setImage1File(f);
    if (f) setImage1Preview(URL.createObjectURL(f));
    else setImage1Preview(editing?.image1_url ?? null);
  }

  function onPickImage2(f: File | null) {
    setImage2File(f);
    if (f) setImage2Preview(URL.createObjectURL(f));
    else setImage2Preview(editing?.image2_url ?? null);
  }

  async function uploadImage(file: File, eventId: string, index: 1 | 2) {
    const ext = file.name.split(".").pop() || "jpg";
    const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${eventId}/${index}.${safeExt}`;

    const { error } = await supabaseBrowser.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) throw error;

    const { data } = supabaseBrowser.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function save() {
    setMsg("");
    setSaving(true);

    try {
      if (!form.event_date) {
        setMsg("⚠️ Please choose an event date.");
        return;
      }

      if (!form.title_ar.trim() && !form.title_en.trim()) {
        setMsg("⚠️ اكتب عنوان عربي أو إنجليزي على الأقل.");
        return;
      }

      const payload = {
        title_ar: form.title_ar.trim() || null,
        title_en: form.title_en.trim() || null,
        description_ar: (form.description_ar || "").trim() || null,
        description_en: (form.description_en || "").trim() || null,
        event_type: form.event_type,
        location: form.location.trim() || null,
        event_date: form.event_date || null,
        is_published: !!form.is_published,
        is_featured_home: !!form.is_featured_home,
        featured_order: form.is_featured_home ? Number(form.featured_order || 1) : null
      };

      let eventId = editing?.id;

      if (!editing) {
        const { data, error } = await supabaseBrowser
          .from("events")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          setMsg(`❌ ${error.message}`);
          return;
        }
        eventId = data.id;
      } else {
        const { error } = await supabaseBrowser
          .from("events")
          .update(payload)
          .eq("id", editing.id);

        if (error) {
          setMsg(`❌ ${error.message}`);
          return;
        }
      }

      const updates: Record<string, string> = {};
      if (image1File) updates.image1_url = await uploadImage(image1File, eventId!, 1);
      if (image2File) updates.image2_url = await uploadImage(image2File, eventId!, 2);

      if (Object.keys(updates).length) {
        const { error } = await supabaseBrowser
          .from("events")
          .update(updates)
          .eq("id", eventId!);

        if (error) {
          setMsg(`❌ ${error.message}`);
          return;
        }
      }

      setEditorOpen(false);
      resetEditor();
      await load();
      setMsg(editing ? "✅ Event updated successfully." : "✅ Event created successfully.");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Image upload failed"}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStorageImages(r: EventRow) {
    const paths: string[] = [];
    if (r.image1_url) {
      const p = extractStoragePath(r.image1_url);
      if (p) paths.push(p);
    }
    if (r.image2_url) {
      const p = extractStoragePath(r.image2_url);
      if (p) paths.push(p);
    }
    if (!paths.length) return;
    await supabaseBrowser.storage.from(BUCKET).remove(paths);
  }

  async function remove(r: EventRow) {
    const ok = confirm(
      `Are you sure you want to delete this event?\n\n${r.title_ar || r.title_en || "Untitled"}`
    );
    if (!ok) return;

    setActionLoadingId(r.id);
    setMsg("");

    try {
      await deleteStorageImages(r);
      const { error } = await supabaseBrowser.from("events").delete().eq("id", r.id);

      if (error) {
        setMsg(`❌ ${error.message}`);
      } else {
        await load();
        setMsg("✅ Event deleted successfully.");
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  async function togglePublish(r: EventRow) {
    setActionLoadingId(r.id);
    setMsg("");

    const { error } = await supabaseBrowser
      .from("events")
      .update({ is_published: !r.is_published })
      .eq("id", r.id);

    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      await load();
      setMsg(
        !r.is_published
          ? "✅ Event published successfully."
          : "✅ Event unpublished successfully."
      );
    }

    setActionLoadingId(null);
  }

  async function toggleFeatured(r: EventRow) {
    setActionLoadingId(r.id);
    setMsg("");

    const nextFeatured = !r.is_featured_home;
    const payload = {
      is_featured_home: nextFeatured,
      featured_order: nextFeatured ? Number(r.featured_order || 1) : null
    };

    const { error } = await supabaseBrowser
      .from("events")
      .update(payload)
      .eq("id", r.id);

    if (error) {
      setMsg(`❌ ${error.message}`);
    } else {
      await load();
      setMsg(
        nextFeatured
          ? "✅ Event added to Home successfully."
          : "✅ Event removed from Home successfully."
      );
    }

    setActionLoadingId(null);
  }

  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skillup-events-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg("✅ CSV exported successfully.");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      const typeOk = typeFilter === "all" ? true : (r.event_type ?? "online") === typeFilter;
      if (!typeOk) return false;

      if (fromDate && (r.event_date ?? "") < fromDate) return false;
      if (toDate && (r.event_date ?? "") > toDate) return false;

      if (!q) return true;

      const hay = [
        safeLower(r.title_ar),
        safeLower(r.title_en),
        safeLower(r.description_ar),
        safeLower(r.description_en),
        safeLower(r.location),
        safeLower(r.event_type),
        safeLower(r.event_date)
      ].join(" ");

      return hay.includes(q);
    });
  }, [rows, query, typeFilter, fromDate, toDate]);

  const stats = useMemo(() => {
    const online = rows.filter((r) => (r.event_type ?? "online") === "online").length;
    const offline = rows.filter((r) => (r.event_type ?? "online") === "offline").length;
    const published = rows.filter((r) => !!r.is_published).length;
    const featured = rows.filter((r) => !!r.is_featured_home).length;
    return { total: rows.length, online, offline, published, featured };
  }, [rows]);

  const isBusy = (id: string) => actionLoadingId === id;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm opacity-75">
            Admin panel for events with quick actions, filters, export, and publishing controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button variant="secondary" onClick={exportCSV} disabled={loading || filtered.length === 0}>
            Export CSV
          </Button>
          <Button onClick={startCreate}>Add event</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-sm">Published</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.published}</CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-sm">Featured</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.featured}</CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-sm">Online</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.online}</CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-sm">Offline</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.offline}</CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]">
            <Input
              placeholder="Search by title, description, location, date..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  {typeFilter === "all" ? "All types" : typeFilter.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTypeFilter("all")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("online")}>Online</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter("offline")}>Offline</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  {sortKey === "date_asc" ? "Date ↑" : sortKey === "date_desc" ? "Date ↓" : "Newest"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortKey("date_asc")}>Date Asc</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey("date_desc")}>Date Desc</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey("created_desc")}>Newest First</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {msg ? (
            <div className="mt-3 rounded-2xl border border-black/10 p-3 text-sm dark:border-white/10">
              {msg}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">All events</CardTitle>
          <div className="text-xs opacity-70">
            {loading ? "Loading…" : `${filtered.length} shown`}
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-black/10 dark:border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Images</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[110px]">Type</TableHead>
                  <TableHead className="w-[120px]">Published</TableHead>
                  <TableHead className="w-[120px]">Home</TableHead>
                  <TableHead className="w-[130px]">Date</TableHead>
                  <TableHead className="w-[320px]">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="py-6 text-center opacity-50">
                        Loading events...
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center opacity-70">
                      No events match filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex gap-2">
                          <div className="h-12 w-12 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                            {r.image1_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.image1_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-black/5 dark:bg-white/10" />
                            )}
                          </div>

                          <div className="h-12 w-12 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                            {r.image2_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.image2_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-black/5 dark:bg-white/10" />
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="grid gap-1">
                          <div className="font-medium">{r.title_ar || r.title_en || "Untitled"}</div>
                          <div className="text-xs opacity-70">{r.location || "—"}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          {(r.event_type ?? "online").toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {r.is_published ? (
                          <Badge variant="secondary">Published</Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {r.is_featured_home ? (
                          <Badge variant="secondary">Home #{r.featured_order ?? 1}</Badge>
                        ) : (
                          <Badge variant="outline">Not on Home</Badge>
                        )}
                      </TableCell>

                      <TableCell className="opacity-80">
                        {formatDate(r.event_date)}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => togglePublish(r)}
                            disabled={isBusy(r.id)}
                          >
                            {r.is_published ? "Unpublish" : "Publish"}
                          </Button>

                          <Button
                            variant="secondary"
                            onClick={() => toggleFeatured(r)}
                            disabled={isBusy(r.id)}
                          >
                            {r.is_featured_home ? "Remove Home" : "Feature Home"}
                          </Button>

                          <Button
                            variant="secondary"
                            onClick={() => startEdit(r)}
                            disabled={isBusy(r.id)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() => remove(r)}
                            disabled={isBusy(r.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={editorOpen}
        onOpenChange={(v) => {
          setEditorOpen(v);
          if (!v) resetEditor();
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          <div className="border-b border-black/10 p-4 dark:border-white/10">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit event" : "Add event"}</DialogTitle>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[80vh]">
            <div className="grid gap-5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Content language</div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editLang === "ar" ? "default" : "secondary"}
                    onClick={() => setEditLang("ar")}
                  >
                    عربي
                  </Button>
                  <Button
                    type="button"
                    variant={editLang === "en" ? "default" : "secondary"}
                    onClick={() => setEditLang("en")}
                  >
                    English
                  </Button>
                </div>
              </div>

              {editLang === "ar" ? (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <div className="text-xs opacity-70">العنوان بالعربي</div>
                    <Input
                      value={form.title_ar}
                      onChange={(e) => setForm((s) => ({ ...s, title_ar: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-xs opacity-70">الوصف بالعربي</div>
                    <RichTextEditor
                      dir="rtl"
                      value={form.description_ar}
                      onChange={(html) => setForm((s) => ({ ...s, description_ar: html }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <div className="text-xs opacity-70">Title in English</div>
                    <Input
                      value={form.title_en}
                      onChange={(e) => setForm((s) => ({ ...s, title_en: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="text-xs opacity-70">Description in English</div>
                    <RichTextEditor
                      dir="ltr"
                      value={form.description_en}
                      onChange={(html) => setForm((s) => ({ ...s, description_en: html }))}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-2">
                  <div className="text-xs opacity-70">Type</div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={form.event_type === "online" ? "default" : "secondary"}
                      onClick={() => setForm((s) => ({ ...s, event_type: "online" }))}
                    >
                      Online
                    </Button>
                    <Button
                      type="button"
                      variant={form.event_type === "offline" ? "default" : "secondary"}
                      onClick={() => setForm((s) => ({ ...s, event_type: "offline" }))}
                    >
                      Offline
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="text-xs opacity-70">Date</div>
                  <Input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm((s) => ({ ...s, event_date: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="text-xs opacity-70">Location / Link</div>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
                <div className="text-sm font-semibold">Visibility</div>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_published}
                    onChange={(e) => setForm((s) => ({ ...s, is_published: e.target.checked }))}
                  />
                  <span>Published (تظهر في صفحة الفعاليات)</span>
                </label>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_featured_home}
                    onChange={(e) => setForm((s) => ({ ...s, is_featured_home: e.target.checked }))}
                  />
                  <span>Show on Home (تظهر في الرئيسية)</span>
                </label>

                <div className="grid gap-2">
                  <div className="text-xs opacity-70">Featured Order</div>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={form.featured_order}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        featured_order: Number(e.target.value || 1)
                      }))
                    }
                    disabled={!form.is_featured_home}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="text-xs opacity-70">Image 1</div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage1(e.target.files?.[0] ?? null)}
                  />
                  {image1Preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image1Preview} alt="" className="h-44 w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="h-44 w-full rounded-2xl border border-dashed border-black/10 dark:border-white/10" />
                  )}
                </div>

                <div className="grid gap-2">
                  <div className="text-xs opacity-70">Image 2</div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage2(e.target.files?.[0] ?? null)}
                  />
                  {image2Preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image2Preview} alt="" className="h-44 w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="h-44 w-full rounded-2xl border border-dashed border-black/10 dark:border-white/10" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pb-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save changes" : "Create event"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditorOpen(false);
                    resetEditor();
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}