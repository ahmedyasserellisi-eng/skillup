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
import { SECTORS } from "@/lib/sectors-data";
import { 
  Search, 
  RefreshCw, 
  Download, 
  SlidersHorizontal, 
  Eye, 
  Trash2, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  XCircle,
  HelpCircle,
  Calendar
} from "lucide-react";

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

const SECTOR_LABEL: Record<string, string> = Object.fromEntries(
  SECTORS.map((s) => [s.slug, s.name_ar])
);

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
  if (v === "accepted") {
    return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 gap-1"><UserCheck className="w-3.h-3" /> مقبول</Badge>;
  }
  if (v === "rejected") {
    return <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 gap-1"><XCircle className="w-3 h-3" /> مرفوض</Badge>;
  }
  if (v === "contacted") {
    return <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 gap-1"><CheckCircle className="w-3 h-3" /> تم التواصل</Badge>;
  }
  if (v === "in_review") {
    return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 gap-1"><Clock className="w-3 h-3" /> قيد المراجعة</Badge>;
  }
  return <Badge className="bg-zinc-500/10 text-zinc-700 hover:bg-zinc-500/20 dark:text-zinc-400 border border-zinc-500/20 gap-1"><HelpCircle className="w-3 h-3" /> جديد</Badge>;
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
      .update({
        admin_status: newStatus,
        admin_notes: row.admin_notes ?? null
      })
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
        "التعليم": EDUCATION_LABEL[r.education ?? ""] ?? cleanCell(r.education),
        "الجامعة": cleanCell(r.university),
        "سنة التخرج": cleanCell(r.graduation_year),
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
        { wch: 6 }, { wch: 28 }, { wch: 30 }, { wch: 18 }, { wch: 16 },
        { wch: 8 }, { wch: 18 }, { wch: 24 }, { wch: 14 }, { wch: 28 },
        { wch: 18 }, { wch: 28 }, { wch: 35 }, { wch: 28 }, { wch: 28 },
        { wch: 28 }, { wch: 40 }, { wch: 16 }, { wch: 35 }, { wch: 22 }
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
    <div className="grid gap-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">طلبات الانضمام</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            لوحة متابعة وفرز ومراجعة الطلبات بشكل متطور لإدارة الموارد البشرية.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button variant="outline" className="gap-2" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900" onClick={exportExcel} disabled={loading || filtered.length === 0}>
            <Download className="w-4 h-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "إجمالي الطلبات", value: stats.total, color: "border-l-zinc-500" },
          { label: "المعروض الآن", value: stats.filtered, color: "border-l-sky-500" },
          { label: "جديد", value: stats.newCount, color: "border-l-purple-500" },
          { label: "قيد المراجعة", value: stats.reviewCount, color: "border-l-blue-500" },
          { label: "تم التواصل", value: stats.contactedCount, color: "border-l-amber-500" },
          { label: "مقبول", value: stats.accepted, color: "border-l-emerald-500" },
          { label: "مرفوض", value: stats.rejected, color: "border-l-rose-500" }
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 border-l-4 ${s.color}`}
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{s.label}</div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Accordion/Box */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <SlidersHorizontal className="w-4 h-4" />
          <span>أدوات الفرز والتصفية المتقدمة</span>
        </div>
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="ابحث بالاسم، الإيميل، المهارات..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pr-9 rounded-lg bg-white dark:bg-zinc-950"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none shadow-sm dark:border-zinc-800 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:border-zinc-400"
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
            className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none shadow-sm dark:border-zinc-800 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:border-zinc-400"
          >
            <option value="all">كل القطاعات</option>
            {SECTORS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name_ar}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none shadow-sm dark:border-zinc-800 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 focus:border-zinc-400"
          >
            <option value="all">كل المدن</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <Button variant="outline" className="w-full rounded-lg" onClick={resetFilters}>
            تصفير الفلاتر
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> من تاريخ التقديم
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg bg-white dark:bg-zinc-950"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> إلى تاريخ التقديم
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg bg-white dark:bg-zinc-950"
            />
          </div>
        </div>
      </div>

      {message ? (
        <div className={`rounded-xl border p-4 text-sm font-medium shadow-sm transition-all ${messageClass(message)}`}>
          {message}
        </div>
      ) : null}

      {rows.length >= 500 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-sm text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2 shadow-sm">
          ⚠️ تنبيه: يتم عرض أول 500 طلب فقط لتسريع التصفح. يرجى تضييق نطاق البحث بالفلاتر إذا لم تجد طلباً معيناً.
        </div>
      )}

      {/* Main Table View */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="text-right font-semibold">المتقدم</TableHead>
              <TableHead className="text-right font-semibold">القطاع</TableHead>
              <TableHead className="text-right font-semibold">المدينة</TableHead>
              <TableHead className="text-right font-semibold">الحالة</TableHead>
              <TableHead className="text-right font-semibold">الهاتف</TableHead>
              <TableHead className="text-right font-semibold">تاريخ الطلب</TableHead>
              <TableHead className="text-center font-semibold w-[220px]">الإجراءات السريعة</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell><div className="h-9 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-32" /></TableCell>
                  <TableCell><div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-24" /></TableCell>
                  <TableCell><div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-16" /></TableCell>
                  <TableCell><div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full w-20" /></TableCell>
                  <TableCell><div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-24" /></TableCell>
                  <TableCell><div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-28" /></TableCell>
                  <TableCell><div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-full" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                  لا توجد طلبات مطابقة للفلاتر المحددة حالياً.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <TableCell className="py-3">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 max-w-[180px] truncate">{r.full_name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 max-w-[180px] truncate">{r.email}</div>
                  </TableCell>

                  <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                    {SECTOR_LABEL[r.sector_key] ?? r.sector_key}
                  </TableCell>

                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                    {r.city ?? "—"}
                  </TableCell>

                  <TableCell>{getStatusBadge(r.admin_status)}</TableCell>

                  <TableCell className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                    {r.phone ?? "—"}
                  </TableCell>

                  <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(r.created_at)}
                  </TableCell>

                  <TableCell className="py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* عرض التفاصيل مودال */}
                      <Dialog open={open && selected?.id === r.id} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2.5 shadow-sm" onClick={() => openDetails(r)}>
                            <Eye className="w-3.5 h-3.5" />
                            التفاصيل
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6 rounded-xl" dir="rtl">
                          <DialogHeader className="border-b pb-3">
                            <DialogTitle className="text-xl font-bold">تفاصيل طلب الانضمام الكاملة</DialogTitle>
                          </DialogHeader>

                          {selected ? (
                            <div className="flex-1 overflow-y-auto py-4 space-y-5 pe-1 text-zinc-800 dark:text-zinc-200">
                              {/* Basic Info Box */}
                              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="sm:col-span-2 lg:col-span-3 border-b pb-2 mb-1 flex items-center justify-between">
                                  <div>
                                    <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">{selected.full_name}</div>
                                    <div className="text-xs text-zinc-500 mt-0.5">{selected.email}</div>
                                  </div>
                                  <div>{getStatusBadge(selected.admin_status)}</div>
                                </div>
                                <div><strong>رقم الهاتف:</strong> <span className="font-mono">{selected.phone ?? "—"}</span></div>
                                <div><strong>المدينة:</strong> {selected.city ?? "—"}</div>
                                <div><strong>السن:</strong> {selected.age ?? "—"} مخرجات</div>
                                <div><strong>التعليم:</strong> {EDUCATION_LABEL[selected.education ?? ""] ?? selected.education ?? "—"}</div>
                                <div><strong>الجامعة:</strong> {selected.university ?? "—"}</div>
                                <div><strong>سنة التخرج:</strong> {selected.graduation_year ?? "—"}</div>
                                <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t text-sm grid gap-2 sm:grid-cols-2">
                                  <div><strong>القطاع المستهدف:</strong> <span className="font-semibold text-sky-600 dark:text-sky-400">{SECTOR_LABEL[selected.sector_key] ?? selected.sector_key}</span></div>
                                  <div><strong>الدور المفضل:</strong> {selected.preferred_role ?? "—"}</div>
                                  <div><strong>التفرغ الإسبوعي:</strong> {selected.availability ?? "—"}</div>
                                  <div><strong>تاريخ الإرسال:</strong> {formatDateTime(selected.created_at)}</div>
                                </div>
                              </div>

                              {/* Portfolio Links and Admin Notes Grid */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">روابط المتقدم الخارجية</span>
                                  <div className="flex-1 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 text-sm shadow-sm">
                                    <div className="flex items-center justify-between border-b pb-2">
                                      <span>رابط لينكد إن:</span>
                                      {selected.linkedin ? (
                                        <a className="text-sky-600 hover:underline font-medium text-xs" target="_blank" rel="noreferrer" href={selected.linkedin}>فتح الحساب الرسمي ↗</a>
                                      ) : <span className="text-zinc-400 text-xs">غير متوفر</span>}
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                      <span>رابط معرض الأعمال (Portfolio):</span>
                                      {selected.portfolio ? (
                                        <a className="text-emerald-600 hover:underline font-medium text-xs" target="_blank" rel="noreferrer" href={selected.portfolio}>تصفح معرض الأعمال ↗</a>
                                      ) : <span className="text-zinc-400 text-xs">غير متوفر</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">ملاحظات وتقييم الإدارة (داخلي)</span>
                                  <textarea
                                    className="w-full min-h-[100px] flex-1 rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 shadow-sm focus:border-zinc-400"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="اكتب التقييم الداخلي أو ملاحظات المقابلة هنا..."
                                  />
                                </div>
                              </div>

                              {/* Skills & Experience Details */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-1.5">
                                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">المهارات والقدرات</span>
                                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-3.5 text-xs whitespace-pre-wrap leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/20 max-h-[160px] overflow-y-auto">
                                    {selected.skills || "لم يتم إدخال مهارات محددة."}
                                  </div>
                                </div>

                                <div className="grid gap-1.5">
                                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">الخبرات السابقة والأنشطة</span>
                                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-3.5 text-xs whitespace-pre-wrap leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/20 max-h-[160px] overflow-y-auto">
                                    {selected.experience || "لم يتم إدخال خبرات سابقة."}
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-1.5">
                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">رسالة المتقدم للإدارة</span>
                                <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-3.5 text-xs whitespace-pre-wrap leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/20 max-h-[120px] overflow-y-auto">
                                  {selected.message || "لا توجد رسالة مرفقة من المتقدم."}
                                </div>
                              </div>

                              {/* Actions inside dialog */}
                              <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                                <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")}>
                                  نقل لقيد المراجعة
                                </Button>
                                <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20" disabled={saving} onClick={() => updateStatus("contacted")}>
                                  تم التواصل
                                </Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={() => updateStatus("accepted")}>
                                  قبول المتقدم
                                </Button>
                                <Button size="sm" variant="destructive" disabled={saving} onClick={() => updateStatus("rejected")}>
                                  رفض الطلب
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </DialogContent>
                      </Dialog>

                      {/* قائمة اختيارات سريعة مدمجة للحالة بدل زحمة الأزرار */}
                      <select
                        value={getStatusValue(r.admin_status)}
                        disabled={isBusy(r.id)}
                        onChange={(e) => quickUpdateStatus(r, e.target.value)}
                        className="h-8 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs outline-none shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium"
                      >
                        <option value="new">جديد</option>
                        <option value="in_review">مراجعة</option>
                        <option value="contacted">تواصل</option>
                        <option value="accepted">مقبول</option>
                        <option value="rejected">مرفوض</option>
                      </select>

                      {/* زر الحذف الأيقوني الأنيق */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        onClick={() => remove(r.id, r.full_name)}
                        disabled={isBusy(r.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 flex items-center gap-1">
        <span>جلسة العمل مؤمنة ومصرحة للإدارة. مسار الدخول الحالي:</span>
        <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px]">
          /ar/admin/login
        </code>
      </div>
    </div>
  );
}
