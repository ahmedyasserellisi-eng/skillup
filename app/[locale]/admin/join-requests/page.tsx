"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type JoinRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  age: number | null;
  education: string | null;
  university: string | null;
  graduation_year: number | null;
  sector_key: string;
  preferred_role: string | null;
  availability: string | null;
  skills: string | null;
  experience: string | null;
  linkedin: string | null;
  portfolio: string | null;
  message: string | null;
  admin_status: string | null;
  admin_notes: string | null;
  created_at: string;
};

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

// ✅ slugs مطابقة لـ sectors-data.ts
const SECTOR_LABEL: Record<string, string> = {
  hrm: "إدارة الموارد البشرية",
  meal: "المتابعة والتقييم والتعلّم",
  "digital-marketing": "التسويق والإعلام الرقمي",
  logistics: "التنظيم والعمليات",
  "sustainable-development": "التنمية المستدامة والشراكات",
  "training-development": "التدريب والتطوير",
  "culture-entertainment": "الثقافة والترفيه"
};

// ✅ ترجمة قيم education
const EDUCATION_LABEL: Record<string, string> = {
  student: "طالب",
  graduate: "خريج",
  employed: "موظف",
  other: "أخرى"
};

const STATUS_LABEL: Record<string, string> = {
  new: "جديد",
  in_review: "قيد المراجعة",
  contacted: "تم التواصل",
  accepted: "مقبول",
  rejected: "مرفوض"
};

function getStatusValue(v?: string | null) {
  return v ?? "new";
}

function getStatusBadge(status?: string | null) {
  const v = getStatusValue(status);
  if (v === "accepted") return <Badge variant="secondary">مقبول</Badge>;
  if (v === "rejected") return <Badge variant="destructive">مرفوض</Badge>;
  if (v === "contacted") return <Badge variant="outline">تم التواصل</Badge>;
  if (v === "in_review") return <Badge variant="outline">قيد المراجعة</Badge>;
  return <Badge variant="outline">جديد</Badge>;
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}

function cleanCell(value: unknown) {
  return value ?? "";
}

function normalizeCity(city?: string | null) {
  return (city ?? "").trim();
}

function messageClass(message: string) {
  if (!message) return "";
  if (message.startsWith("✅"))
    return "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400";
  if (message.startsWith("⚠️"))
    return "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400";
  return "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400";
}

export default function AdminJoinRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [rows, setRows] = useState<JoinRequest[]>([]);
  const [message, setMessage] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JoinRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const requireAllowedSession = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const email = data.session?.user?.email?.toLowerCase();
    if (!data.session || !email || !ALLOWED.has(email)) return null;
    return data.session;
  }, []);

  const load = useCallback(async () => {
    setMessage("");
    setLoading(true);

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ غير مصرح لك بالدخول. سجّل الدخول بحساب الإدارة.");
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser
      .from("join_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setMessage(`❌ ${error.message}`);
      setRows([]);
    } else {
      setRows((data ?? []) as JoinRequest[]);
    }

    setLoading(false);
  }, [requireAllowedSession]);

  useEffect(() => {
    void load();
  }, [load]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((r) => normalizeCity(r.city))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "ar"));
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (status !== "all" && getStatusValue(r.admin_status) !== status) return false;
      if (sector !== "all" && r.sector_key !== sector) return false;
      if (city !== "all" && normalizeCity(r.city) !== city) return false;

      const createdDate = r.created_at
        ? new Date(r.created_at).toISOString().slice(0, 10)
        : "";

      if (fromDate && createdDate < fromDate) return false;
      if (toDate && createdDate > toDate) return false;

      if (!s) return true;

      const hay = [
        r.full_name,
        r.email,
        r.phone ?? "",
        r.city ?? "",
        r.sector_key,
        r.skills ?? "",
        r.experience ?? "",
        r.message ?? "",
        r.preferred_role ?? "",
        r.university ?? "",
        r.education ?? ""
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [rows, q, status, sector, city, fromDate, toDate]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      filtered: filtered.length,
      newCount: rows.filter((r) => getStatusValue(r.admin_status) === "new").length,
      reviewCount: rows.filter((r) => getStatusValue(r.admin_status) === "in_review").length,
      contactedCount: rows.filter((r) => getStatusValue(r.admin_status) === "contacted").length,
      accepted: rows.filter((r) => getStatusValue(r.admin_status) === "accepted").length,
      rejected: rows.filter((r) => getStatusValue(r.admin_status) === "rejected").length
    };
  }, [rows, filtered]);

  function openDetails(r: JoinRequest) {
    setSelected(r);
    setNotes(r.admin_notes ?? "");
    setOpen(true);
  }

  async function updateStatus(newStatus: string) {
    if (!selected) return;
    setSaving(true);
    setMessage("");

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ غير مصرح. برجاء تسجيل الدخول مرة أخرى.");
      setSaving(false);
      return;
    }

    const { error } = await supabaseBrowser
      .from("join_requests")
      .update({ admin_status: newStatus, admin_notes: notes })
      .eq("id", selected.id);

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setOpen(false);
      await load();
      setMessage("✅ تم تحديث الطلب بنجاح.");
    }

    setSaving(false);
  }

  async function quickUpdateStatus(row: JoinRequest, newStatus: string) {
    setActionLoadingId(row.id);
    setMessage("");

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ غير مصرح. برجاء تسجيل الدخول مرة أخرى.");
      setActionLoadingId(null);
      return;
    }

    const { error } = await supabaseBrowser
      .from("join_requests")
      .update({ admin_status: newStatus })
      .eq("id", row.id);

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      await load();
      setMessage("✅ تم تحديث الحالة بنجاح.");
    }

    setActionLoadingId(null);
  }

  async function remove(id: string, name?: string) {
    setMessage("");

    const ok = confirm(`هل تريد حذف هذا الطلب؟\n\n${name || "طلب بدون اسم"}`);
    if (!ok) return;

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ غير مصرح. برجاء تسجيل الدخول مرة أخرى.");
      return;
    }

    setActionLoadingId(id);

    const { error } = await supabaseBrowser
      .from("join_requests")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      await load();
      setMessage("✅ تم حذف الطلب بنجاح.");
    }

    setActionLoadingId(null);
  }

  async function exportExcel() {
    try {
      if (filtered.length === 0) {
        setMessage("⚠️ لا توجد بيانات للتصدير.");
        return;
      }

      const XLSX = await import("xlsx");

      const data = filtered.map((r, index) => ({
        "م": index + 1,
        "الاسم الكامل": cleanCell(r.full_name),
        "البريد الإلكتروني": cleanCell(r.email),
        "رقم الهاتف": cleanCell(r.phone),
        "المدينة": cleanCell(r.city),
        "السن": cleanCell(r.age),
        // ✅ عرض التعليم بالعربية
        "التعليم": EDUCATION_LABEL[r.education ?? ""] ?? cleanCell(r.education),
        "الجامعة": cleanCell(r.university),
        "سنة التخرج": cleanCell(r.graduation_year),
        // ✅ عرض القطاع بالعربية مع slugs صحيحة
        "القطاع": SECTOR_LABEL[r.sector_key] ?? r.sector_key,
        "الدور المفضل": cleanCell(r.preferred_role),
        "التفرغ": cleanCell(r.availability),
        "المهارات": cleanCell(r.skills),
        "الخبرات": cleanCell(r.experience),
        "لينكدإن": cleanCell(r.linkedin),
        "البورتفوليو": cleanCell(r.portfolio),
        "رسالة المتقدم": cleanCell(r.message),
        "الحالة": STATUS_LABEL[getStatusValue(r.admin_status)] ?? getStatusValue(r.admin_status),
        "ملاحظات الإدارة": cleanCell(r.admin_notes),
        "تاريخ الطلب": formatDateTime(r.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });

      ws["!cols"] = [
        { wch: 6 },
        { wch: 28 },
        { wch: 30 },
        { wch: 18 },
        { wch: 16 },
        { wch: 8 },
        { wch: 18 },
        { wch: 24 },
        { wch: 14 },
        { wch: 26 },
        { wch: 18 },
        { wch: 28 },
        { wch: 35 },
        { wch: 28 },
        { wch: 28 },
        { wch: 28 },
        { wch: 40 },
        { wch: 16 },
        { wch: 35 },
        { wch: 22 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "طلبات الانضمام");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `طلبات-الانضمام-${date}.xlsx`);

      setMessage("✅ تم تصدير ملف Excel بنجاح.");
    } catch (e: any) {
      setMessage(`❌ ${e?.message || "حدث خطأ أثناء التصدير."}`);
    }
  }

  function resetFilters() {
    setQ("");
    setStatus("all");
    setSector("all");
    setCity("all");
    setFromDate("");
    setToDate("");
  }

  const isBusy = (id: string) => actionLoadingId === id;

  return (
    <div className="grid gap-5" dir="rtl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">طلبات الانضمام</h1>
          <p className="text-sm opacity-75">
            لوحة متابعة وفرز ومراجعة الطلبات بشكل أقرب لإدارة الموارد البشرية.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => load()} disabled={loading}>
            تحديث
          </Button>
          <Button onClick={exportExcel} disabled={loading || filtered.length === 0}>
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {[
          { label: "إجمالي الطلبات", value: stats.total },
          { label: "المعروض الآن", value: stats.filtered },
          { label: "جديد", value: stats.newCount },
          { label: "قيد المراجعة", value: stats.reviewCount },
          { label: "تم التواصل", value: stats.contactedCount },
          { label: "مقبول", value: stats.accepted },
          { label: "مرفوض", value: stats.rejected }
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40"
          >
            <div className="text-xs opacity-70">{s.label}</div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-zinc-950/40">
        <div className="grid gap-3 lg:grid-cols-6">
          <Input
            placeholder="ابحث بالاسم أو الإيميل أو المهارات أو الجامعة..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="lg:col-span-2"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-zinc-950/40"
          >
            <option value="all">كل الحالات</option>
            <option value="new">جديد</option>
            <option value="in_review">قيد المراجعة</option>
            <option value="contacted">تم التواصل</option>
            <option value="accepted">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-zinc-950/40"
          >
            <option value="all">كل القطاعات</option>
            {Object.entries(SECTOR_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-zinc-950/40"
          >
            <option value="all">كل المدن</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <Button variant="secondary" onClick={resetFilters}>
            تصفير الفلاتر
          </Button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs opacity-70">من تاريخ</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs opacity-70">إلى تاريخ</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {message ? (
        <div className={`rounded-2xl border p-4 text-sm ${messageClass(message)}`}>
          {message}
        </div>
      ) : null}

      {/* Table */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المتقدم</TableHead>
              <TableHead>القطاع</TableHead>
              <TableHead>المدينة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>تاريخ الطلب</TableHead>
              <TableHead className="w-[430px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-6 text-center opacity-50">
                    جاري تحميل الطلبات...
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center opacity-70">
                  لا توجد طلبات مطابقة للفلاتر الحالية.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs opacity-70">{r.email}</div>
                  </TableCell>

                  <TableCell>
                    {SECTOR_LABEL[r.sector_key] ?? r.sector_key}
                  </TableCell>

                  <TableCell className="text-sm opacity-80">
                    {r.city ?? "—"}
                  </TableCell>

                  <TableCell>{getStatusBadge(r.admin_status)}</TableCell>

                  <TableCell className="text-xs opacity-80">
                    {r.phone ?? "—"}
                  </TableCell>

                  <TableCell className="text-xs opacity-75">
                    {formatDateTime(r.created_at)}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Dialog
                        open={open && selected?.id === r.id}
                        onOpenChange={setOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="secondary"
                            onClick={() => openDetails(r)}
                          >
                            عرض التفاصيل
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>تفاصيل طلب الانضمام</DialogTitle>
                          </DialogHeader>

                          {selected ? (
                            <div className="max-h-[75vh] overflow-y-auto pe-2">
                              <div className="grid gap-4 text-sm">
                                <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <div className="text-lg font-semibold">
                                        {selected.full_name}
                                      </div>
                                      <div className="text-xs opacity-70">
                                        {selected.email}
                                      </div>
                                    </div>
                                    <div>{getStatusBadge(selected.admin_status)}</div>
                                  </div>

                                  <div className="mt-4 grid gap-2 text-xs opacity-85 sm:grid-cols-2">
                                    <div><strong>رقم الهاتف:</strong> {selected.phone ?? "—"}</div>
                                    <div><strong>المدينة:</strong> {selected.city ?? "—"}</div>
                                    <div><strong>السن:</strong> {selected.age ?? "—"}</div>
                                    <div>
                                      <strong>التعليم:</strong>{" "}
                                      {EDUCATION_LABEL[selected.education ?? ""] ?? selected.education ?? "—"}
                                    </div>
                                    <div><strong>الجامعة:</strong> {selected.university ?? "—"}</div>
                                    <div><strong>سنة التخرج:</strong> {selected.graduation_year ?? "—"}</div>
                                    <div>
                                      <strong>القطاع:</strong>{" "}
                                      {SECTOR_LABEL[selected.sector_key] ?? selected.sector_key}
                                    </div>
                                    <div><strong>الدور المفضل:</strong> {selected.preferred_role ?? "—"}</div>
                                    <div><strong>التفرغ:</strong> {selected.availability ?? "—"}</div>
                                    <div><strong>تاريخ الطلب:</strong> {formatDateTime(selected.created_at)}</div>
                                  </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="grid gap-2">
                                    <div className="text-xs font-semibold opacity-80">الروابط</div>
                                    <div className="rounded-2xl border border-black/10 p-3 text-xs dark:border-white/10">
                                      <div className="grid gap-2">
                                        <div>
                                          <strong>لينكدإن: </strong>
                                          {selected.linkedin ? (
                                            <a
                                              className="underline"
                                              target="_blank"
                                              rel="noreferrer"
                                              href={selected.linkedin}
                                            >
                                              فتح الرابط
                                            </a>
                                          ) : "—"}
                                        </div>
                                        <div>
                                          <strong>البورتفوليو: </strong>
                                          {selected.portfolio ? (
                                            <a
                                              className="underline"
                                              target="_blank"
                                              rel="noreferrer"
                                              href={selected.portfolio}
                                            >
                                              فتح الرابط
                                            </a>
                                          ) : "—"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid gap-2">
                                    <div className="text-xs font-semibold opacity-80">
                                      ملاحظات الإدارة
                                    </div>
                                    <textarea
                                      className="min-h-[130px] rounded-2xl border border-black/10 bg-white/70 p-3 text-sm outline-none dark:border-white/10 dark:bg-zinc-950/40"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="اكتب ملاحظات داخلية هنا..."
                                    />
                                  </div>
                                </div>

                                <div className="grid gap-2">
                                  <div className="text-xs font-semibold opacity-80">المهارات</div>
                                  <div className="rounded-2xl border border-black/10 p-3 text-xs whitespace-pre-wrap dark:border-white/10">
                                    {selected.skills || "—"}
                                  </div>
                                </div>

                                <div className="grid gap-2">
                                  <div className="text-xs font-semibold opacity-80">الخبرات</div>
                                  <div className="rounded-2xl border border-black/10 p-3 text-xs whitespace-pre-wrap dark:border-white/10">
                                    {selected.experience || "—"}
                                  </div>
                                </div>

                                <div className="grid gap-2">
                                  <div className="text-xs font-semibold opacity-80">رسالة المتقدم</div>
                                  <div className="rounded-2xl border border-black/10 p-3 text-xs whitespace-pre-wrap dark:border-white/10">
                                    {selected.message || "—"}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Button
                                    disabled={saving}
                                    onClick={() => updateStatus("in_review")}
                                  >
                                    نقل إلى قيد المراجعة
                                  </Button>
                                  <Button
                                    disabled={saving}
                                    variant="secondary"
                                    onClick={() => updateStatus("contacted")}
                                  >
                                    تعليم كـ تم التواصل
                                  </Button>
                                  <Button
                                    disabled={saving}
                                    onClick={() => updateStatus("accepted")}
                                  >
                                    قبول الطلب
                                  </Button>
                                  <Button
                                    disabled={saving}
                                    variant="destructive"
                                    onClick={() => updateStatus("rejected")}
                                  >
                                    رفض الطلب
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="secondary"
                        onClick={() => quickUpdateStatus(r, "in_review")}
                        disabled={isBusy(r.id)}
                      >
                        قيد المراجعة
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => quickUpdateStatus(r, "contacted")}
                        disabled={isBusy(r.id)}
                      >
                        تم التواصل
                      </Button>

                      <Button
                        onClick={() => quickUpdateStatus(r, "accepted")}
                        disabled={isBusy(r.id)}
                      >
                        قبول
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => remove(r.id, r.full_name)}
                        disabled={isBusy(r.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs opacity-60">
        تسجيل الدخول من{" "}
        <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
          /ar/admin/login
        </code>
      </div>
    </div>
  );
}
