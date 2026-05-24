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
  national_id: string | null;      // جديد
  city: string | null;
  age: number | null;
  member_status: string | null;    // جديد
  leadership_interest: string | null; // جديد
  education: string | null;
  grade: string | null;            // جديد
  university: string | null;
  faculty: string | null;          // جديد
  department: string | null;       // جديد
  postgrad_info: string | null;    // جديد
  graduation_year: number | null;
  profile_picture_url: string | null; // جديد
  sector_key: string;
  preferred_role: string | null;
  availability: string | null;
  heard_about_us: string | null;   // جديد
  skills: string | null;
  experience: string | null;
  linkedin: string | null;
  facebook: string | null;         // جديد
  portfolio: string | null;
  resume_url: string | null;       // جديد
  message: string | null;
  status: string | null;
  admin_status: string | null;
  admin_notes: string | null;
  consent: boolean | null;
  created_at: string;
};

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

// تحديث وتوحيد مسميات ومفاتيح القطاعات لتطابق الفورم الجديد تماماً
const SECTOR_LABEL: Record<string, string> = {
  hrm: "إدارة الموارد البشرية",
  meal: "المتابعة والتقييم والتعلم (MEAL)",
  media: "التسويق والإعلام الرقمي",
  logistics: "العلاقات العامة واللوجستيات",
  sustain: "التنمية المستدامة",
  training: "التدريب والتطوير",
  entrepreneurship: "ريادة الأعمال"
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
  return value ?? "—";
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
      .limit(1000); // رفعنا الليميت لاستيعاب حجم البيانات الأكبر

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
        (r.national_id ?? "").includes(s) ||
        (r.city ?? "").toLowerCase().includes(s) ||
        (r.skills ?? "").toLowerCase().includes(s) ||
        (r.experience ?? "").toLowerCase().includes(s) ||
        (r.university ?? "").toLowerCase().includes(s) ||
        (r.faculty ?? "").toLowerCase().includes(s) ||
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

      // بناء مصفوفة البيانات باللغة العربية الكاملة متضمنة كافة الـ 11 حقل الجديد
      const data = filtered.map((r, index) => ({
        "م": index + 1,
        "الاسم الكامل": cleanCell(r.full_name),
        "الرقم القومي": cleanCell(r.national_id),
        "البريد الإلكتروني": cleanCell(r.email),
        "رقم الهاتف": cleanCell(r.phone),
        "المدينة": cleanCell(r.city),
        "السن": cleanCell(r.age),
        "حالة الموقف الداخلي/التجنيد": cleanCell(r.member_status),
        "الاهتمام بالدور القيادي": cleanCell(r.leadership_interest),
        "المستوى التعليمي": cleanCell(r.education),
        "الفرقة الدراسية": cleanCell(r.grade),
        "الجامعة / المعهد": cleanCell(r.university),
        "الكلية": cleanCell(r.faculty),
        "القسم": cleanCell(r.department),
        "دراسات عليا / أخرى": cleanCell(r.postgrad_info),
        "سنة التخرج": cleanCell(r.graduation_year),
        "رابط الصورة الشخصية": cleanCell(r.profile_picture_url),
        "القطاع المطلوب": SECTOR_LABEL[r.sector_key] ?? r.sector_key,
        "الدور المفضل داخل القطاع": cleanCell(r.preferred_role),
        "ساعات التفرغ الأسبوعية": cleanCell(r.availability),
        "كيف عرفت عن SkillUp": cleanCell(r.heard_about_us),
        "المهارات واللغات": cleanCell(r.skills),
        "الخبرات والأنشطة التطوعية": cleanCell(r.experience),
        "رابط لينكدإن": cleanCell(r.linkedin),
        "رابط فيسبوك": cleanCell(r.facebook),
        "معرض الأعمال / بورتفوليو": cleanCell(r.portfolio),
        "رابط السيرة الذاتية (CV)": cleanCell(r.resume_url),
        "رسالة المتقدم": cleanCell(r.message),
        "حالة التقييم الإدارية": STATUS_LABEL[getStatusValue(r.admin_status)] ?? getStatusValue(r.admin_status),
        "ملاحظات لجنة الأدمن": cleanCell(r.admin_notes),
        "الموافقة على الشروط": r.consent ? "نعم" : "لا",
        "تاريخ التقديم": formatDateTime(r.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });

      // تطبيق وضع الاتجاه وإظهار خطوط المربعات الافتراضية
      if (!ws["!views"]) ws["!views"] = [];
      ws["!views"].push({ RTL: true, showGridLines: true });

      const objectKeys = Object.keys(data[0]);
      
      // تحديد وتجميل خلايا رأس الجدول (Header Style) وتظليلها بالكامل بشكل احترافي
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:AE1");
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellRef]) continue;
        
        ws[cellRef].s = {
          fill: {
            patternType: "solid",
            fgColor: { rgb: "10B981" } // خلفية الـ Header خضراء مميزة (Emerald)
          },
          font: {
            name: "Arial",
            sz: 12,
            bold: true,
            color: { rgb: "FFFFFF" } // لون النص أبيض وعريض
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            readingOrder: 2 // إجبار التوجيه من اليمين لليسار داخل الخلية
          },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "medium", color: { rgb: "047857" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };
      }

      // حساب تلقائي ذكي لعرض الأعمدة حتى لا تتداخل النصوص الطويلة
      ws["!cols"] = objectKeys.map((key) => {
        const maxLength = data.reduce((max, row) => {
          const val = row[key as keyof typeof row]?.toString() || "";
          return Math.max(max, val.length);
        }, key.length);
        return { wch: Math.min(Math.max(maxLength + 4, 14), 50) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "طلب انضمام SkillUp");

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `SkillUp-Join-Requests-${date}.xlsx`);

      setMessage("✅ تم تصدير ملف Excel احترافي بالكامل وبصيغة الـ RTL المطلوبة.");
    } catch (e: any) {
      setMessage(`❌ ${e?.message || "حدث خطأ غير متوقع أثناء عملية التصدير."}`);
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
      {/* الهيدر العلوي */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">لوحة تحكم طلبات الانضمام (المطور المحدث)</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            قراءة ومزامنة مباشرة متكاملة للبيانات والهيكل المحدث من الـ <code className="bg-zinc-100 px-1 py-0.5 rounded text-red-600 font-mono text-xs">public.join_requests</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => load()} disabled={loading}>
            تحديث ومزامنة البيانات
          </Button>
          <Button onClick={exportExcel} disabled={loading || filtered.length === 0} className="bg-emerald-600 text-white hover:bg-emerald-700">
            تصدير ملف Excel الاحترافي
          </Button>
        </div>
      </div>

      {/* العدادات الإحصائية الدقيقة */}
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

      {/* الفلاتر المحدثة بالقطاعات الجديدة */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-3 lg:grid-cols-6">
          <Input
            placeholder="ابحث بالاسم، الرقم القومي، الإيميل، الكلية أو المهارات..."
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
            <option value="all">كل القطاعات الجديدة</option>
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

      {/* رسائل تأكيد العمليات */}
      {message ? (
        <div className={`rounded-xl border p-4 text-sm font-medium ${messageClass(message)}`}>
          {message}
        </div>
      ) : null}

      {/* جدول البيانات المعروض للأدمن */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950">
            <TableRow>
              <TableHead className="text-right">المتقدم للإنضمام</TableHead>
              <TableHead className="text-right">القطاع المستهدف</TableHead>
              <TableHead className="text-right">المدينة</TableHead>
              <TableHead className="text-right">الحالة الإدارية</TableHead>
              <TableHead className="text-right">الهاتف والاتصال</TableHead>
              <TableHead className="text-right">تاريخ تقديم الطلب</TableHead>
              <TableHead className="text-center w-[360px]">الإجراءات والتحكم السريع</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-6 text-center opacity-50">
                    جاري سحب ومزامنة البيانات بهيكلها الجديد من السوبابيز...
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center font-medium text-zinc-500">
                  لا توجد أي طلبات مطابقة لمعايير البحث الحالية.
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
                      
                      {/* مودال العرض الكامل لكل الـ 24 حقل من حقول الاستمارة */}
                      <Dialog open={open && selected?.id === r.id} onOpenChange={(isOpen) => {
                        setOpen(isOpen);
                        if(!isOpen) setSelected(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => openDetails(r)} className="text-xs h-8">
                            التفاصيل والملاحظات الكاملة
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col" dir="rtl">
                          <DialogHeader className="text-right border-b pb-3">
                            <DialogTitle className="text-xl font-bold text-zinc-950">تفاصيل استمارة الانضمام والمزامنة الكاملة</DialogTitle>
                          </DialogHeader>

                          {selected ? (
                            <div className="flex-1 overflow-y-auto my-4 space-y-4 pe-2">
                              
                              {/* بطاقة البيانات الشخصية الكبرى */}
                              <div className="rounded-xl border bg-zinc-50/50 p-4 dark:bg-zinc-950/20">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-3">
                                  <div>
                                    <div className="text-lg font-bold text-zinc-900">{selected.full_name}</div>
                                    <div className="text-xs text-zinc-500">البريد: {selected.email}</div>
                                  </div>
                                  <div>{getStatusBadge(selected.admin_status)}</div>
                                </div>

                                <div className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2 md:grid-cols-3">
                                  <div><strong>الرقم القومي:</strong> <span className="font-mono select-all text-zinc-700">{selected.national_id ?? "—"}</span></div>
                                  <div><strong>رقم الهاتف:</strong> <span className="select-all font-mono text-zinc-700">{selected.phone ?? "—"}</span></div>
                                  <div><strong>المدينة والمحافظة:</strong> <span className="text-zinc-700">{selected.city ?? "—"}</span></div>
                                  <div><strong>العمر الحالي:</strong> <span className="text-zinc-700">{selected.age ? `${selected.age} عام` : "—"}</span></div>
                                  <div><strong>الموقف من التجنيد/العضوية:</strong> <span className="text-zinc-700">{selected.member_status ?? "—"}</span></div>
                                  <div><strong>رغبة بالترشح لقيادة فريق؟:</strong> <span className="font-medium text-amber-700">{selected.leadership_interest ?? "—"}</span></div>
                                </div>
                              </div>

                              {/* الموقف التعليمي والأكاديمي بالتفصيل */}
                              <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
                                <h3 className="text-xs font-bold text-zinc-900 border-b pb-1">البيانات الأكاديمية والتعليمية</h3>
                                <div className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2 md:grid-cols-3">
                                  <div><strong>المستوى التعليمي:</strong> <span className="text-zinc-700">{selected.education ?? "—"}</span></div>
                                  <div><strong>الفرقة الدراسية:</strong> <span className="text-zinc-700">{selected.grade ?? "—"}</span></div>
                                  <div><strong>الجامعة أو المعهد:</strong> <span className="text-zinc-700">{selected.university ?? "—"}</span></div>
                                  <div><strong>الكلية:</strong> <span className="text-zinc-700">{selected.faculty ?? "—"}</span></div>
                                  <div><strong>القسم التخصصي:</strong> <span className="text-zinc-700">{selected.department ?? "—"}</span></div>
                                  <div><strong>سنة التخرج المتوقعة:</strong> <span className="text-zinc-700 font-mono">{selected.graduation_year ?? "—"}</span></div>
                                </div>
                                {selected.postgrad_info && (
                                  <div className="text-xs pt-1 border-t">
                                    <strong>تفاصيل الدراسات العليا/الأخرى:</strong> <span className="text-zinc-600">{selected.postgrad_info}</span>
                                  </div>
                                )}
                              </div>

                              {/* خيارات القطاع والموثوقية */}
                              <div className="rounded-xl border bg-zinc-50/30 p-4 text-xs grid gap-4 sm:grid-cols-2">
                                <div>
                                  <p className="mb-1"><strong>القطاع المستهدف والمطلوب:</strong></p>
                                  <span className="font-bold text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">{SECTOR_LABEL[selected.sector_key] ?? selected.sector_key}</span>
                                </div>
                                <div>
                                  <p className="mb-1"><strong>الدور الوظيفي المفضل للعمل به:</strong></p>
                                  <span className="font-medium text-zinc-800 bg-zinc-100 px-2 py-1 rounded">{selected.preferred_role ?? "—"}</span>
                                </div>
                                <div><strong>ساعات التفرغ الأسبوعية للأنشطة:</strong> <span className="text-zinc-700">{selected.availability ?? "—"}</span></div>
                                <div><strong>كيف عرفت بالمبادرة؟:</strong> <span className="text-zinc-700">{selected.heard_about_us ?? "—"}</span></div>
                                <div><strong>تاريخ ملء الاستمارة:</strong> <span className="text-zinc-600 font-mono">{formatDateTime(selected.created_at)}</span></div>
                                <div><strong>الموافقة الصريحة والالتزام بالشروط:</strong> <span className="font-semibold text-emerald-600">{selected.consent ? "✅ نعم، وافق وملتزم بالكامل" : "❌ لم يوافق"}</span></div>
                              </div>

                              {/* الملاحظات الإدارية وروابط الويب المحدثة للـ CV والصورة الشخصية والفيسبوك */}
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-zinc-800">كل روابط وحسابات المتقدم المرفقة</label>
                                  <div className="rounded-xl border p-3.5 text-xs space-y-2.5 bg-white shadow-sm">
                                    <div>
                                      <strong>حساب LinkedIn الإحترافي: </strong>
                                      {selected.linkedin ? (
                                        <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noreferrer" href={selected.linkedin}>فتح الرابط</a>
                                      ) : "—"}
                                    </div>
                                    <div>
                                      <strong>حساب Facebook الشخصي: </strong>
                                      {selected.facebook ? (
                                        <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noreferrer" href={selected.facebook}>فتح الرابط</a>
                                      ) : "—"}
                                    </div>
                                    <div>
                                      <strong>معرض الأعمال (Portfolio): </strong>
                                      {selected.portfolio ? (
                                        <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noreferrer" href={selected.portfolio}>فتح الرابط</a>
                                      ) : "—"}
                                    </div>
                                    <div>
                                      <strong>رابط السيرة الذاتية (CV): </strong>
                                      {selected.resume_url ? (
                                        <a className="text-emerald-600 font-semibold underline hover:text-emerald-800" target="_blank" rel="noreferrer" href={selected.resume_url}>عرض ملف الـ CV</a>
                                      ) : "—"}
                                    </div>
                                    <div>
                                      <strong>رابط الصورة الشخصية للطلب: </strong>
                                      {selected.profile_picture_url ? (
                                        <a className="text-zinc-600 underline hover:text-zinc-800" target="_blank" rel="noreferrer" href={selected.profile_picture_url}>معاينة الصورة المرفوعة</a>
                                      ) : "—"}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-zinc-800">ملاحظات التقييم واللجنة والمراجعة المباشرة</label>
                                  <textarea
                                    className="w-full min-h-[140px] rounded-xl border bg-white p-2.5 text-xs outline-none focus:ring-1 focus:ring-zinc-400"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="اكتب تفاصيل أو ملاحظات اللجنة وتقييم المقابلة، أو أسباب القبول والرفض لحفظها بملف المتقدم..."
                                  />
                                </div>
                              </div>

                              {/* النصوص الطويلة والخبرات والرسائل الجوابية */}
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-800">المهارات الشخصية والتقنية واللغات الأساسية</label>
                                <div className="rounded-xl border p-3 text-xs text-zinc-700 bg-zinc-50/50 whitespace-pre-wrap leading-relaxed">{selected.skills || "—"}</div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-800">الخبرات التطوعية والأنشطة الطلابية السابقة بالتفصيل</label>
                                <div className="rounded-xl border p-3 text-xs text-zinc-700 bg-zinc-50/50 whitespace-pre-wrap leading-relaxed">{selected.experience || "—"}</div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-800">رسالة الانضمام الشغفية (لماذا تريد الالتحاق بمبادرة SkillUp؟)</label>
                                <div className="rounded-xl border p-3 text-xs text-zinc-700 bg-zinc-50/50 whitespace-pre-wrap leading-relaxed">{selected.message || "—"}</div>
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

                      {/* أزرار الإجراءات الفورية والسريعة في السطر */}
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

      {/* الفوتر التوجيهي والإرشادي لقطاع الـ MEAL والتحليل الداخلي */}
      <div className="text-xs text-zinc-400 text-left select-none mt-2">
        لوحة تحكم مسؤولي قطاع المتابعة والتقييم:{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          /ar/admin/login
        </code>
      </div>
    </div>
  );
}
