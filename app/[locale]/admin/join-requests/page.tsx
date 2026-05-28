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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Calendar,
  User,
  CreditCard,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Link2,
  FileText,
  MoreVertical,
  AlertCircle,
  Filter
} from "lucide-react";

const EGYPT_GOVERNORATES_MAP: Record<string, string> = {
  "cairo": "القاهرة",
  "giza": "الجيزة",
  "alexandria": "الإسكندرية",
  "dakahlia": "الدقهلية",
  "red sea": "البحر الأحمر",
  "beheira": "البحيرة",
  "fayoum": "الفيوم",
  "gharbia": "الغربية",
  "ismailia": "الإسماعيلية",
  "monufia": "المنوفية",
  "minya": "المنيا",
  "qalyubia": "القليوبية",
  "new valley": "الوادي الجديد",
  "suez": "السويس",
  "sharqia": "الشرقية",
  "aswan": "أسوان",
  "asyut": "أسيوط",
  "beni suef": "بني سويف",
  "port said": "بورسعيد",
  "damietta": "دمياط",
  "south sinai": "جنوب سيناء",
  "kafr el sheikh": "كفر الشيخ",
  "matrouh": "مطروح",
  "luxor": "الأقصر",
  "qena": "قنا",
  "north sinai": "شمال سيناء",
  "sohag": "سوهاج"
};

type JoinRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  national_id: string | null; 
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

const ALLOWED_ADMINS = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

const EDUCATION_LABEL: Record<string, string> = {
  student: "طالب جامعي",
  graduate: "خريج",
  postgrad: "طالب دراسات عليا",
  school: "طالب ثانوي",
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

function getSectorLabel(sectorKey: string, lang: "ar" | "en" = "ar"): string {
  const sector = SECTORS.find((s: any) => s.slug === sectorKey) as any;
  if (!sector) return sectorKey;
  if (lang === "ar") return sector.name_ar || sector.ar || sectorKey;
  return sector.name_en || sector.en || sectorKey;
}

function getStatusBadge(status?: string | null) {
  const v = getStatusValue(status);
  switch (v) {
    case "accepted":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 gap-1 px-2 py-1 text-xs font-medium">
          <UserCheck className="w-3 h-3" /> مقبول
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 gap-1 px-2 py-1 text-xs font-medium">
          <XCircle className="w-3 h-3" /> مرفوض
        </Badge>
      );
    case "contacted":
      return (
        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 gap-1 px-2 py-1 text-xs font-medium">
          <CheckCircle className="w-3 h-3" /> تم التواصل
        </Badge>
      );
    case "in_review":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 gap-1 px-2 py-1 text-xs font-medium">
          <Clock className="w-3 h-3" /> قيد المراجعة
        </Badge>
      );
    default:
      return (
        <Badge className="bg-zinc-500/10 text-zinc-700 hover:bg-zinc-500/20 dark:text-zinc-400 border border-zinc-500/20 gap-1 px-2 py-1 text-xs font-medium">
          <HelpCircle className="w-3 h-3" /> جديد
        </Badge>
      );
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

function formatGovernorate(city?: string | null) {
  if (!city) return "غير محدد";
  const cleaned = city.trim().toLowerCase();
  return EGYPT_GOVERNORATES_MAP[cleaned] || city.trim();
}

function normalizeCity(city?: string | null) {
  return (city ?? "").trim();
}

export default function AdminJoinRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [rows, setRows] = useState<JoinRequest[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "warning" | "">("");
  
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
    if (!data.session || !email || !ALLOWED_ADMINS.has(email)) return null;
    return data.session;
  }, []);

  const showNotification = (msg: string, type: "success" | "error" | "warning") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 6000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const session = await requireAllowedSession();
    if (!session) {
      showNotification("❌ غير مصرح لك بالدخول. يرجى تسجيل الدخول بحساب الإدارة المخول.", "error");
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser
      .from("join_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      showNotification(`خطأ أثناء جلب البيانات: ${error.message}`, "error");
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
      new Set(rows.map((r) => normalizeCity(r.city)).filter(Boolean))
    ).sort((a, b) => formatGovernorate(a).localeCompare(formatGovernorate(b), "ar"));
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    return rows.filter((r) => {
      if (status !== "all" && getStatusValue(r.admin_status) !== status) return false;
      if (sector !== "all" && r.sector_key !== sector) return false;
      if (city !== "all" && normalizeCity(r.city) !== city) return false;

      const createdDate = r.created_at ? new Date(r.created_at).toISOString().slice(0, 10) : "";
      if (fromDate && createdDate < fromDate) return false;
      if (toDate && createdDate > toDate) return false;

      if (!s) return true;

      const hay = [
        r.full_name,
        r.email,
        r.phone ?? "",
        r.national_id ?? "",
        formatGovernorate(r.city),
        getSectorLabel(r.sector_key, "ar"),
        r.skills ?? "",
        r.experience ?? "",
        r.university ?? "",
        r.preferred_role ?? ""
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

    const session = await requireAllowedSession();
    if (!session) {
      showNotification("❌ انتهت الجلسة أو غير مصرح لك. يرجى إعادة تسجيل الدخول.", "error");
      setSaving(false);
      return;
    }

    const { error } = await supabaseBrowser
      .from("join_requests")
      .update({ admin_status: newStatus, admin_notes: notes })
      .eq("id", selected.id);

    if (error) {
      showNotification(`❌ فشل التحديث: ${error.message}`, "error");
    } else {
      setOpen(false);
      await load();
      showNotification("✅ تم تحديث بيانات المتقدم وحالة الطلب بنجاح.", "success");
    }
    setSaving(false);
  }

  async function quickUpdateStatus(row: JoinRequest, newStatus: string) {
    setActionLoadingId(row.id);

    const session = await requireAllowedSession();
    if (!session) {
      showNotification("❌ غير مصرح لك بإجراء تعديلات سريعة.", "error");
      setActionLoadingId(null);
      return;
    }

    const { error } = await supabaseBrowser
      .from("join_requests")
      .update({ admin_status: newStatus, admin_notes: row.admin_notes ?? null })
      .eq("id", row.id);

    if (error) {
      showNotification(`❌ خطأ: ${error.message}`, "error");
    } else {
      await load();
      showNotification("✅ تم تحديث الحالة فورياً.", "success");
    }
    setActionLoadingId(null);
  }

  async function remove(id: string, name?: string) {
    const ok = confirm(`تنبيه حرج: هل أنت متأكد تماماً من حذف طلب الانضمام التابع لـ:\n\n[ ${name || "طلب بدون اسم"} ] ؟\n\nلا يمكن التراجع عن هذا الإجراء.`);
    if (!ok) return;

    const session = await requireAllowedSession();
    if (!session) {
      showNotification("❌ صلاحيات غير كافية لحذف الملفات.", "error");
      return;
    }

    setActionLoadingId(id);
    const { error } = await supabaseBrowser.from("join_requests").delete().eq("id", id);
    
    if (error) {
      showNotification(`❌ فشل الحذف: ${error.message}`, "error");
    } else {
      await load();
      showNotification("✅ تم حذف السجل بالكامل من قاعدة البيانات.", "success");
    }
    setActionLoadingId(null);
  }

  async function exportExcel() {
    try {
      if (filtered.length === 0) {
        showNotification("⚠️ لا توجد بيانات مطابقة لتصديرها حالياً.", "warning");
        return;
      }

      const XLSX = await import("xlsx");
      const data = filtered.map((r, index) => ({
        "م": index + 1,
        "الاسم الكامل": cleanCell(r.full_name),
        "الرقم القومي (14 رقم)": cleanCell(r.national_id), 
        "البريد الإلكتروني": cleanCell(r.email),
        "رقم الهاتف": cleanCell(r.phone),
        "المحافظة": formatGovernorate(r.city), 
        "السن": cleanCell(r.age),
        "الحالة التعليمية": EDUCATION_LABEL[r.education ?? ""] ?? cleanCell(r.education),
        "الجامعة / المعهد": cleanCell(r.university),
        "سنة التخرج": cleanCell(r.graduation_year),
        "القطاع المستهدف": getSectorLabel(r.sector_key, "ar"), 
        "الدور المفضل": cleanCell(r.preferred_role),
        "ساعات التفرغ": cleanCell(r.availability),
        "المهارات والقدرات": cleanCell(r.skills),
        "الخبرات السابقة والأنشطة": cleanCell(r.experience),
        "رابط LinkedIn": cleanCell(r.linkedin),
        "رابط معرض الأعمال Portfolio": cleanCell(r.portfolio),
        "رسالة المتقدم": cleanCell(r.message),
        "حالة الطلب الإدارية": STATUS_LABEL[getStatusValue(r.admin_status)] ?? getStatusValue(r.admin_status),
        "ملاحظات لجنة الفرز والتقييم": cleanCell(r.admin_notes),
        "تاريخ وساعة التقديم": formatDateTime(r.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
      ws["!cols"] = [
        { wch: 6 }, { wch: 28 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 18 },
        { wch: 8 }, { wch: 18 }, { wch: 26 }, { wch: 14 }, { wch: 30 }, { wch: 20 },
        { wch: 28 }, { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 45 },
        { wch: 18 }, { wch: 35 }, { wch: 24 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "طلبات الانضمام الموحدة");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `SkillUp-Join-Requests-${dateStr}.xlsx`);
      showNotification("✅ تم إنشاء وتنزيل تقرير Excel بنجاح وتوحيد القطاعات والمحافظات للغة العربية.", "success");
    } catch (e: any) {
      showNotification(`❌ حدث خطأ غير متوقع أثناء تصدير الملف: ${e?.message}`, "error");
    }
  }

  function resetFilters() {
    setQ(""); setStatus("all"); setSector("all"); setCity("all"); setFromDate(""); setToDate("");
    showNotification("🔄 تم تصفير جميع فلاتر العرض.", "success");
  }

  const isBusy = (id: string) => actionLoadingId === id;

  return (
    <div className="grid gap-6 p-4 md:p-6 max-w-[1600px] mx-auto font-sans" dir="rtl">
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">إدارة طلبات الانضمام للفريق</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            لوحة الإدارة المركزية والفرز لقطاع المتابعة والتقييم والتعلّم (MEAL) مبادرة SkillUp.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 h-11 px-4 border-zinc-200 shadow-sm" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث البيانات
          </Button>
          <Button className="gap-2 h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-0" onClick={exportExcel} disabled={loading || filtered.length === 0}>
            <Download className="w-4 h-4" />
            تصدير تقرير Excel الموحد
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "إجمالي طلبات السير", value: stats.total, color: "border-l-zinc-400 bg-zinc-50/40" },
          { label: "المطابق للفرز الحالي", value: stats.filtered, color: "border-l-sky-500 bg-sky-50/20" },
          { label: "طلبات جديدة", value: stats.newCount, color: "border-l-purple-500 bg-purple-50/20" },
          { label: "قيد المراجعة والفحص", value: stats.reviewCount, color: "border-l-blue-500 bg-blue-50/20" },
          { label: "تم التواصل معهم", value: stats.contactedCount, color: "border-l-amber-500 bg-amber-50/20" },
          { label: "المقبولين نهائياً", value: stats.accepted, color: "border-l-emerald-500 bg-emerald-50/20" },
          { label: "المرفوضين", value: stats.rejected, color: "border-l-rose-500 bg-rose-50/20" }
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 border-l-4 ${s.color}`}>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.label}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-4 border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
            <span>وحدة الفرز والتصفية المتقدمة وتحديد النطاق الجغرافي والزمني</span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-rose-600 hover:bg-rose-50 font-medium h-8">
            إعادة تعيين كافة الفلاتر
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative xl:col-span-2 grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Search className="w-3 h-3" /> البحث النصي الذكي
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="ابحث بالاسم، الرقم القومي، الهاتف، الكلية..." 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                className="pr-9 h-10 rounded-lg bg-white dark:bg-zinc-950 border-zinc-200" 
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> تصفية بحالة الطلب
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none shadow-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 focus:border-zinc-400">
              <option value="all">جميع الحالات الإدارية</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> فرز بحسب القطاع المستهدف
            </label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none shadow-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 focus:border-zinc-400">
              <option value="all">كل قطاعات المبادرة</option>
              {SECTORS.map((s: any) => <option key={s.slug} value={s.slug}>{s.name_ar || s.ar}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> فرز بالمحافظات المصرية
            </label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none shadow-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 focus:border-zinc-400">
              <option value="all">كل محافظات مصر الجمهورية</option>
              {cityOptions.map((c) => <option key={c} value={c}>{formatGovernorate(c)}</option>)}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> النطاق الزمني للتقديم
            </label>
            <div className="flex gap-2 items-center">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 rounded-lg bg-white border-zinc-200 text-xs p-2" />
              <span className="text-zinc-400 text-xs">إلى</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 rounded-lg bg-white border-zinc-200 text-xs p-2" />
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${
          messageType === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : 
          messageType === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
          "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {rows.length >= 1000 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-2">
          ⚠️ تنبيه حركية النظام: تم جلب أحدث 1000 استمارة لضمان استقرار وسرعة معالجة العمليات، يرجى تضييق خيارات الفرز والتصفية للوصول للمستهدف بدقة.
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/60 border-b">
            <TableRow>
              <TableHead className="font-bold text-zinc-800 dark:text-zinc-200 py-4">بيانات المتقدم الأساسية</TableHead>
              <TableHead className="font-bold text-zinc-800 dark:text-zinc-200">الرقم القومي (14 رقم)</TableHead>
              <TableHead className="font-bold text-zinc-800 dark:text-zinc-200">رقم الهاتف التواصل</TableHead>
              <TableHead className="font-bold text-zinc-800 dark:text-zinc-200">المحافظة</TableHead>
              <TableHead className="font-bold text-zinc-800 dark:text-zinc-200">القطاع المطلوب</TableHead>
              <TableHead className="font-bold text-zinc-800 dark:text-zinc-200">مرحلة الفرز</TableHead>
              <TableHead className="font-bold text-zinc-800 dark:text-zinc-200 text-left pl-8 w-[160px]">إجراءات الفحص</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="py-4">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-36 mb-2" />
                    <div className="h-3 bg-zinc-50 dark:bg-zinc-900 rounded w-28" />
                  </TableCell>
                  <TableCell><div className="h-4 bg-zinc-100 rounded w-28 font-mono" /></TableCell>
                  <TableCell><div className="h-4 bg-zinc-100 rounded w-24" /></TableCell>
                  <TableCell><div className="h-4 bg-zinc-100 rounded w-16" /></TableCell>
                  <TableCell><div className="h-6 bg-zinc-100 rounded-full w-32" /></TableCell>
                  <TableCell><div className="h-6 bg-zinc-100 rounded-full w-20" /></TableCell>
                  <TableCell><div className="h-8 bg-zinc-100 rounded-lg w-full" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-500 font-medium">
                  لا توجد استمارات أو طلبات انضمام مطابقة لمعايير البحث والتصفية المحددة حالياً.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-all border-b last:border-0">
                  <TableCell className="py-3.5">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{r.full_name}</div>
                    <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-[200px] truncate">{r.email}</div>
                  </TableCell>
                  
                  <TableCell className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {r.national_id ? (
                      r.national_id
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700 font-sans italic text-[11px]">غير مسجل بالنظام</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-zinc-800 dark:text-zinc-200 font-mono font-medium text-xs">
                    {r.phone}
                  </TableCell>
                  
                  <TableCell className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {formatGovernorate(r.city)}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200">
                      {getSectorLabel(r.sector_key, "ar")}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>{getStatusBadge(r.admin_status)}</TableCell>
                  
                  <TableCell className="text-left pl-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => openDetails(r)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500" disabled={isBusy(r.id)}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]" dir="rtl">
                          <DropdownMenuLabel className="text-right text-xs">تحديث الحالة فوراً</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-right text-xs cursor-pointer" onClick={() => quickUpdateStatus(r, "new")}>طلب جديد</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs cursor-pointer text-blue-600" onClick={() => quickUpdateStatus(r, "in_review")}>تحويل للمراجعة</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs cursor-pointer text-amber-600" onClick={() => quickUpdateStatus(r, "contacted")}>تم التواصل هاتفيًا</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs cursor-pointer text-emerald-600 font-bold" onClick={() => quickUpdateStatus(r, "accepted")}>قبول مبدئي</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs cursor-pointer text-rose-600" onClick={() => quickUpdateStatus(r, "rejected")}>استبعاد / رفض</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-right text-xs cursor-pointer text-rose-600 focus:bg-rose-50" onClick={() => remove(r.id, r.full_name)}>
                            <Trash2 className="w-3.5 h-3.5 ml-1 inline" /> حذف السجل نهائياً
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl border-zinc-200 shadow-2xl" dir="rtl">
          <div className="p-6 border-b bg-zinc-50/60 dark:bg-zinc-900/40">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    <span>ملف بيانات المتقدم التفصيلي للمراجعة</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 mt-1">
                    يرجى تدقيق ومطابقة البيانات قبل اتخاذ قرار القبول أو الاستبعاد النهائي.
                  </DialogDescription>
                </div>
                {selected && <div className="ml-6">{getStatusBadge(selected.admin_status)}</div>}
              </div>
            </div>
          </div>

          {selected ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> البيانات الشخصية والتعريفية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border p-4 bg-zinc-50/30">
                  <div>
                    <span className="text-xs text-zinc-400 block">الاسم الرباعي الكامل:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-50 text-base mt-0.5 block">{selected.full_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> الرقم القومي الشخصي (14 رقم موثق):
                    </span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-sm mt-0.5 block tracking-wider">
                      {selected.national_id || "غير متوفر / لم يسجل"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">البريد الإلكتروني الأساسي:</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 mt-0.5 block">{selected.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block flex items-center gap-1">
                      <Phone className="w-3 h-3" /> رقم هاتف التواصل (واتساب):
                    </span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block">{selected.phone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">المحافظة السكنية:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">{formatGovernorate(selected.city)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">السن الحالي بالسنوات:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block">{selected.age ? `${selected.age} عاماً` : "غير محدد"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> الخلفية الأكاديمية والتعليمية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border p-4 bg-zinc-50/30">
                  <div>
                    <span className="text-xs text-zinc-400 block">الموقف التعليمي الحالي:</span>
                    <span className="font-semibold text-zinc-800 mt-0.5 block">
                      {EDUCATION_LABEL[selected.education ?? ""] || selected.education || "غير محدد"}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-xs text-zinc-400 block">الجامعة / الكلية / المعهد التعليمي:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 block">{selected.university || "غير مسجل"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">سنة التخرج المتوقعة/الفعلية:</span>
                    <span className="font-mono font-medium text-zinc-700 mt-0.5 block">{selected.graduation_year || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> الرغبات والملاءمة الهيكلية للمبادرة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border p-4 bg-zinc-50/30">
                  <div>
                    <span className="text-xs text-zinc-400 block">القطاع الفني المطلوب:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm mt-0.5 block">
                      {getSectorLabel(selected.sector_key, "ar")}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">الدور المفضل/المسمى الوظيفي:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 block">{selected.preferred_role || "عضو قطاع عام"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block">التفرغ والاتاحية الأسبوعية:</span>
                    <span className="font-medium text-zinc-700 mt-0.5 block">{selected.availability || "غير محدد"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 block flex items-center gap-1">
                  <Link2 className="w-3 h-3" /> الروابط والملفات الخارجية المرفقة
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 bg-white dark:bg-zinc-950 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-600">الحساب الرسمي على LinkedIn:</span>
                    {selected.linkedin ? (
                      <a href={selected.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">استعراض الحساب ↗</a>
                    ) : <span className="text-zinc-300 italic">لم يرفق رابط</span>}
                  </div>
                  <div className="rounded-lg border p-3 bg-white dark:bg-zinc-950 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-600">ملف الأعمال والـ Portfolio:</span>
                    {selected.portfolio ? (
                      <a href={selected.portfolio} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">تصفح الأعمال المرفقة ↗</a>
                    ) : <span className="text-zinc-300 italic">لم يرفق رابط</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-1">
                  <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> المهارات الفنية والتقنية والشخصية الأساسية
                  </span>
                  <p className="bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 p-3.5 rounded-xl border leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto">
                    {selected.skills || "لا يوجد تعليق مضاف."}
                  </p>
                </div>

                <div className="grid gap-1">
                  <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> الأنشطة الطلابية السابقة والخبرات التطوعية والعملية
                  </span>
                  <p className="bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 p-3.5 rounded-xl border leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto">
                    {selected.experience || "لا توجد خبرات سابقة مسجلة."}
                  </p>
                </div>

                <div className="grid gap-1">
                  <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> دافع ورسالة المتقدم (لماذا يريد التقديم في SkillUp؟)
                  </span>
                  <p className="bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 p-3.5 rounded-xl border leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                    {selected.message || "لا توجد رسالة تغطية مضافه."}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3 dark:border-zinc-800">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  ملاحظات تقييم المقابلة والفرز الداخلي (تعديل وحفظ تلقائي للملف):
                </label>
                <textarea 
                  className="w-full min-h-[90px] rounded-xl border border-zinc-200 p-3 text-xs outline-none focus:border-zinc-400 resize-none font-sans" 
                  placeholder="اكتب هنا نتائج مرحلة الـ Screening والمقابلة الشخصية وملاحظات التقييم الهيكلية للمتقدم..."
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                />
              </div>

            </div>
          ) : null}

          <div className="p-4 bg-zinc-50 border-t flex flex-wrap items-center justify-between gap-3 px-6 dark:bg-zinc-900/60 dark:border-zinc-800">
            <span className="text-xs text-zinc-400 font-mono">تاريخ التقديم: {selected ? formatDateTime(selected.created_at) : "—"}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving} className="text-xs h-9">
                إغلاق
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs h-9 text-blue-600 border-blue-200">
                وضع قيد المراجعة
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs h-9 text-amber-600 border-amber-200">
                تحديث لـ تم التواصل
              </Button>
              <Button size="sm" variant="destructive" disabled={saving} onClick={() => updateStatus("rejected")} className="text-xs h-9">
                استبعاد ورفض الطلب
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-sm" disabled={saving} onClick={() => updateStatus("accepted")}>
                قبول وتعيين المتقدم
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border-t pt-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-1">
          <span>نطاق حماية البيانات مؤمن للآدمن. كود الفرز المركزي النشط:</span>
          <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-600 font-mono">MEAL-SECTOR-SYSTEM-2026</code>
        </div>
        <span>جميع الحقوق محفوظة لمبادرة SkillUp © ٢٠٢٦</span>
      </div>

    </div>
  );
}
