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
  status: string | null;       // متوافق مع قاعدة البيانات
  admin_status: string | null; // متوافق مع قاعدة البيانات للأدمن
  admin_notes: string | null;  // متوافق مع قاعدة البيانات للملاحظات
  consent: boolean | null;     // حقل الموافقة على الشروط
  created_at: string;
};

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

const SECTOR_LABEL: Record<string, string> = {
  hrm: "إدارة الموارد البشرية",
  meal: "المتابعة والتقييم والتعلّم",
  media: "الميديا والديجيتال ميديا",
  logistics: "التنظيم واللوجستيات",
  sustain: "الاستدامة والتنمية المستدامة",
  training: "التدريب والتطوير",
  culture: "الثقافة"
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
  switch (v) {
    case "accepted":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">مقبول</Badge>;
    case "rejected":
      return <Badge variant="destructive">مرفوض</Badge>;
    case "contacted":
      return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white border-none">تم التواصل</Badge>;
    case "in_review":
      return <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/5">قيد المراجعة</Badge>;
    default:
      return <Badge variant="outline" className="border-zinc-400 text-zinc-600 bg-zinc-100">جديد</Badge>;
  }
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
  if (message.startsWith("✅")) {
    return "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400";
  }
  if (message.startsWith("⚠️")) {
    return "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400";
  }
  return "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400";
}

export default function AdminJoinRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [rows, setRows] = useState<JoinRequest[]>([]);
  const [message, setMessage] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
      if (statusFilter !== "all" && getStatusValue(r.admin_status) !== statusFilter) return false;
      if (sector !== "all" && r.sector_key !== sector) return false;
      if (city !== "all" && normalizeCity(r.city) !== city) return false;

      if (fromDate || toDate) {
        const createdDateObj = r.created_at ? new Date(r.created_at) : null;
        if (createdDateObj) {
          const tzOffset = createdDateObj.getTimezoneOffset() * 60000;
          const localDate = new Date(createdDateObj.getTime() - tzOffset).toISOString().slice(0, 10);
          
          if (fromDate && localDate < fromDate) return false;
          if (toDate && localDate > toDate) return false;
        } else {
          return false;
        }
      }

      if (!s) return true;

      return (
        (r.full_name?.toLowerCase() ?? "").includes(s) ||
        (r.email?.toLowerCase() ?? "").includes(s) ||
        (r.phone ?? "").includes(s) ||
        (r.city ?? "").toLowerCase().includes(s) ||
        (r.skills ?? "").toLowerCase().includes(s) ||
        (r.experience ?? "").toLowerCase().includes(s) ||
        (r.university ?? "").toLowerCase().includes(s) ||
        (r.education ?? "").toLowerCase().includes(s)
      );
    });
  }, [rows, q, statusFilter, sector, city, fromDate, toDate]);

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
      setMessage("✅ تم تحديث الطلب والملاحظات بنجاح في قاعدة البيانات.");
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
      setMessage(`✅ تم تحديث حالة المتقدم (${row.full_name}) إلى ${STATUS_LABEL[newStatus]}.`);
    }

    setActionLoadingId(null);
  }

  async function remove(id: string, name?: string) {
    setMessage("");

    const ok = confirm(`هل تريد حذف هذا الطلب نهائياً من الـ Supabase؟\n\n${name || "طلب بدون اسم"}`);
    if (!ok) return;

    const session = await requireAllowedSession();
    if (!session) {
      setMessage("❌ غير مصرح. برجاء تسجيل الدخول مرة أخرى.");
      return;
    }

    setActionLoadingId(id);

    const { error } = await supabaseBrowser.from("join_requests").delete().eq("id", id);

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      await load();
      setMessage("✅ تم حذف الطلب نهائياً من قاعدة البيانات.");
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
        "التعليم": cleanCell(r.education),
        "الجامعة": cleanCell(r.university),
        "سنة التخرج": cleanCell(r.graduation_year),
        "الالتحاق بالقطاع": SECTOR_LABEL[r.sector_key] ?? r.sector_key,
        "الدور المفضل": cleanCell(r.preferred_role),
        "التفرغ (ساعات)": cleanCell(r.availability),
        "المهارات": cleanCell(r.skills),
        "الخبرات والأنشطة": cleanCell(r.experience),
        "رابط لينكدإن": cleanCell(r.linkedin),
        "معرض الأعمال": cleanCell(r.portfolio),
        "رسالة المتقدم": cleanCell(r.message),
        "حالة التقييم (Admin)": STATUS_LABEL[getStatusValue(r.admin_status)] ?? getStatusValue(r.admin_status),
        "ملاحظات الأدمن": cleanCell(r.admin_notes),
        "الموافقة على الشروط": r.consent ? "نعم" : "لا",
        "تاريخ التقديم": formatDateTime(r.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });

      if (!ws["!views"]) ws["!views"] = [];
      ws["!views"].push({ RTL: true, showGridLines: true });

      const objectKeys = Object.keys(data[0]);
      ws["!cols"] = objectKeys.map((key) => {
        const maxLength = data.reduce((max, row) => {
          const val = row[key as keyof typeof row]?.toString() || "";
          return Math.max(max, val.length);
        }, key.length);
        return { wch: Math.min(Math.max(maxLength + 4, 12), 45) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "طلبات الانضمام");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `طلبات-انضمام-SkillUp-${date}.xlsx`);

      setMessage("✅ تم تصدير ملف Excel بنجاح.");
    } catch (e: any) {
      setMessage(`❌ ${e?.message || "حدث خطأ أثناء التصدير."}`);
    }
  }

  function resetFilters() {
    setQ("");
    setStatusFilter("all");
    setSector("all");
    setCity("all");
    setFromDate("");
    setToDate("");
  }

  const isBusy = (id: string) => actionLoadingId === id;

  return (
    <div className="grid gap-5 p-2 sm:p-4" dir="rtl">
      {/* الهيدر */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">لوحة تحكم طلبات الانضمام</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            مزامنة كاملة وقراءة مباشرة من جدول <code className="bg-zinc-100 px-1 py-0.5 rounded text-red-600 font-mono text-xs">public.join_requests</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => load()} disabled={loading}>
            تحديث البيانات
          </Button>
          <Button onClick={exportExcel} disabled={loading || filtered.length === 0} className="bg-emerald-600 text-white hover:bg-emerald-700">
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* العدادات الإحصائية */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "إجمالي الطلبات", val: stats.total, color: "text-zinc-900 dark:text-white" },
          { label: "المعروض بالفلتر", val: stats.filtered, color: "text-blue-600" },
          { label: "جديد", val: stats.newCount, color: "text-zinc-500" },
          { label: "قيد المراجعة", val: stats.reviewCount, color: "text-amber-500" },
          { label: "تم التواصل", val: stats.contactedCount, color: "text-sky-500" },
          { label: "مقبول", val: stats.accepted, color: "text-emerald-500" },
          { label: "مرفوض", val: stats.rejected, color: "text-red-500" }
        ].map((item, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{item.label}</div>
            <div className={`mt-1 text-xl font-bold ${item.color}`}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* الفلاتر والبحث */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3 lg:grid-cols-6">
          <Input
            placeholder="ابحث بالاسم، الإيميل، المهارات أو الجامعة..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="lg:col-span-2 h-10"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
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
            className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">كل القطاعات</option>
            {Object.entries(SECTOR_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">كل المدن</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <Button variant="ghost" onClick={resetFilters} className="text-zinc-500 hover:text-zinc-900 border border-zinc-200 h-10">
            تصفير الفلاتر
          </Button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-zinc-500">من تاريخ الطلب</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9" />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-zinc-500">إلى تاريخ الطلب</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9" />
          </div>
        </div>
      </div>

      {/* رسائل التنبيه والنجاح */}
      {message ? (
        <div className={`rounded-xl border p-4 text-sm font-medium ${messageClass(message)}`}>
          {message}
        </div>
      ) : null}

      {/* الجدول الرئيسي */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
            <TableRow>
              <TableHead className="text-right">المتقدم</TableHead>
              <TableHead className="text-right">القطاع المطلوب</TableHead>
              <TableHead className="text-right">المدينة</TableHead>
              <TableHead className="text-right">الحالة الإدارية</TableHead>
              <TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">تاريخ تقديم الطلب</TableHead>
              <TableHead className="text-center w-[360px]">الإجراءات السريعة</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-6 text-center opacity-50">
                    جاري سحب ومزامنة البيانات من الـ Supabase...
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center font-medium text-zinc-500">
                  لا توجد طلبات مطابقة للبحث.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                  <TableCell>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{r.full_name}</div>
                    <div className="text-xs text-zinc-500 select-all">{r.email}</div>
                  </TableCell>

                  <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                    {SECTOR_LABEL[r.sector_key] ?? r.sector_key}
                  </TableCell>

                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">{r.city ?? "—"}</TableCell>

                  <TableCell>{getStatusBadge(r.admin_status)}</TableCell>

                  <TableCell className="text-xs font-mono text-zinc-600 dark:text-zinc-400 select-all">{r.phone ?? "—"}</TableCell>

                  <TableCell className="text-xs text-zinc-500">
                    {formatDateTime(r.created_at)}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* مودال التفاصيل الكاملة */}
                      <Dialog open={open && selected?.id === r.id} onOpenChange={(isOpen) => {
                        setOpen(isOpen);
                        if(!isOpen) setSelected(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => openDetails(r)} className="text-xs h-8">
                            التفاصيل والملاحظات
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
                          <DialogHeader className="text-right border-b pb-3">
                            <DialogTitle className="text-xl font-bold text-zinc-950">تفاصيل استمارة الانضمام الكاملة</DialogTitle>
                          </DialogHeader>

                          {selected ? (
                            <div className="flex-1 overflow-y-auto my-4 space-y-4 pe-1">
                              
                              {/* الكارت الأساسي */}
                              <div className="rounded-xl border bg-zinc-50/50 p-4 dark:bg-zinc-950/20">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="text-lg font-bold text-zinc-900">{selected.full_name}</div>
                                    <div className="text-xs text-zinc-500">{selected.email}</div>
                                  </div>
                                  <div>{getStatusBadge(selected.admin_status)}</div>
                                </div>

                                <div className="mt-4 grid gap-x-4 gap-y-2.5 text-xs sm:grid-cols-2">
                                  <div><strong>رقم الهاتف:</strong> <span className="select-all font-mono">{selected.phone ?? "—"}</span></div>
                                  <div><strong>المدينة:</strong> {selected.city ?? "—"}</div>
                                  <div><strong>السن:</strong> {selected.age ? `${selected.age} عام` : "—"}</div>
                                  <div><strong>المستوى التعليمي:</strong> {selected.education ?? "—"}</div>
                                  <div><strong>الجامعة / الكلية:</strong> {selected.university ?? "—"}</div>
                                  <div><strong>سنة التخرج:</strong> {selected.graduation_year ?? "—"}</div>
                                  <div><strong>القطاع المستهدف:</strong> <span className="font-semibold text-blue-600">{SECTOR_LABEL[selected.sector_key] ?? selected.sector_key}</span></div>
                                  <div><strong>الدور المفضل:</strong> {selected.preferred_role ?? "—"}</div>
                                  <div><strong>ساعات التفرغ:</strong> {selected.availability ?? "—"}</div>
                                  <div><strong>تاريخ التقديم:</strong> {formatDateTime(selected.created_at)}</div>
                                  <div><strong>الموافقة على الشروط والموثوقية:</strong> {selected.consent ? "✅ نعم، وافق" : "❌ لا"}</div>
                                </div>
                              </div>

                              {/* الروابط والملاحظات */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-zinc-700">روابط المتقدم</label>
                                  <div className="rounded-xl border p-3 text-xs space-y-2 bg-white shadow-sm">
                                    <div>
                                      <strong>حساب LinkedIn: </strong>
                                      {selected.linkedin ? (
                                        <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noreferrer" href={selected.linkedin}>فتح الرابط</a>
                                      ) : "—"}
                                    </div>
                                    <div>
                                      <strong>معرض الأعمال (Portfolio): </strong>
                                      {selected.portfolio ? (
                                        <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noreferrer" href={selected.portfolio}>فتح الرابط</a>
                                      ) : "—"}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-zinc-700">ملاحظات التقييم والمراجعة (الأدمن)</label>
                                  <textarea
                                    className="w-full min-h-[100px] rounded-xl border bg-white p-2.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="اكتب هنا ملاحظات المقابلة أو التقييم الداخلي..."
                                  />
                                </div>
                              </div>

                              {/* الحقول النصية الطويلة */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-700">المهارات والقدرات التقنية واللغوية</label>
                                <div className="rounded-xl border p-3 text-xs text-zinc-700 bg-zinc-50/30 whitespace-pre-wrap leading-relaxed">{selected.skills || "—"}</div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-700">الخبرات والأنشطة السابقة والأعمال التطوعية</label>
                                <div className="rounded-xl border p-3 text-xs text-zinc-700 bg-zinc-50/30 whitespace-pre-wrap leading-relaxed">{selected.experience || "—"}</div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-700">رسالة الانضمام (لماذا يريد الالتحاق بـ SkillUp؟)</label>
                                <div className="rounded-xl border p-3 text-xs text-zinc-700 bg-zinc-50/30 whitespace-pre-wrap leading-relaxed">{selected.message || "—"}</div>
                              </div>
                            </div>
                          ) : null}

                          <div className="flex flex-wrap gap-2 pt-3 border-t justify-end bg-white">
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs border-amber-500 text-amber-600 bg-amber-500/5">
                              مراجعة
                            </Button>
                            <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs border-blue-500 text-blue-600 bg-blue-50/5">
                              تم التواصل
                            </Button>
                            <Button size="sm" disabled={saving} onClick={() => updateStatus("accepted")} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                              قبول المتقدم
                            </Button>
                            <Button size="sm" disabled={saving} variant="destructive" onClick={() => updateStatus("rejected")} className="text-xs">
                              رفض الطلب
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* أزرار سريعة داخل الجدول */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => quickUpdateStatus(r, "in_review")}
                        disabled={isBusy(r.id)}
                      >
                        راجع
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => quickUpdateStatus(r, "contacted")}
                        disabled={isBusy(r.id)}
                      >
                        تواصل
                      </Button>

                      <Button
                        size="sm"
                        className="text-xs h-8 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50"
                        onClick={() => quickUpdateStatus(r, "accepted")}
                        disabled={isBusy(r.id)}
                      >
                        قبول
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
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

      {/* الرابط الاسترشادي تحت */}
      <div className="text-xs text-zinc-400 text-left select-none mt-2">
        لوحة تحكم مسؤولي قطاع المتابعة والتقييم:{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          /ar/admin/login
        </code>
      </div>
    </div>
  );
}
