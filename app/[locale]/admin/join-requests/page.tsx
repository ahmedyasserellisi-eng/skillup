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
  Filter,
  Users,
  UserPlus,
  PhoneCall,
  Layers,
  ChevronLeft
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
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> مقبول
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> مرفوض
        </Badge>
      );
    case "contacted":
      return (
        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <PhoneCall className="w-3.5 h-3.5 text-amber-600" /> تم التواصل
        </Badge>
      );
    case "in_review":
      return (
        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <Clock className="w-3.5 h-3.5 text-blue-600" /> قيد المراجعة
        </Badge>
      );
    default:
      return (
        <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300/60 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <UserPlus className="w-3.5 h-3.5 text-zinc-500" /> جديد
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
    <div className="grid gap-6 p-4 md:p-8 max-w-[1700px] mx-auto font-sans bg-zinc-50/40 min-h-screen" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm dark:bg-zinc-950 dark:border-zinc-900">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/10">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">إدارة طلبات الانضمام</h1>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                قطاع التخطيط الاستراتيجي والمتابعة والتقييم (MEAL) • مبادرة SkillUp
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 h-11 px-4 border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold shadow-sm rounded-xl transition-all" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 text-zinc-500 ${loading ? "animate-spin" : ""}`} />
            تحديث الهيكل
          </Button>
          <Button className="gap-2 h-11 px-5 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold shadow-sm border-0 rounded-xl transition-all dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200" onClick={exportExcel} disabled={loading || filtered.length === 0}>
            <Download className="w-4 h-4" />
            تصدير تقرير Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "إجمالي الاستمارات", value: stats.total, icon: Users, color: "text-zinc-600 bg-zinc-100/70 border-zinc-200" },
          { label: "المطابق للتصفية", value: stats.filtered, icon: Filter, color: "text-sky-600 bg-sky-50/50 border-sky-100" },
          { label: "طلبات جديدة", value: stats.newCount, icon: UserPlus, color: "text-purple-600 bg-purple-50/50 border-purple-100" },
          { label: "قيد المراجعة", value: stats.reviewCount, icon: Clock, color: "text-blue-600 bg-blue-50/50 border-blue-100" },
          { label: "تم التواصل", value: stats.contactedCount, icon: PhoneCall, color: "text-amber-600 bg-amber-50/50 border-amber-100" },
          { label: "المقبولين نهائياً", value: stats.accepted, icon: UserCheck, color: "text-emerald-600 bg-emerald-50/50 border-emerald-100" },
          { label: "المستبعدين", value: stats.rejected, icon: XCircle, color: "text-rose-600 bg-rose-50/50 border-rose-100" }
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-zinc-950 dark:border-zinc-900 group`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-500 transition-colors">{s.label}</span>
                <div className={`p-1.5 rounded-lg border ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Advanced Filters Box */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4 mb-5 border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>لوحة التصفية المتقدمة ونطاق المعالجة</span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold h-8 px-3 rounded-lg transition-colors">
            تصفير الفلاتر
          </Button>
        </div>
        
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative xl:col-span-2 grid gap-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
              البحث النصي الذكي
            </label>
            <div className="relative">
              <Search className="absolute right-3.5 top-3 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="ابحث بالاسم، الرقم القومي، الهاتف، الكلية..." 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                className="pr-10 h-10 rounded-xl bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all shadow-none" 
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">تصفية بحالة الطلب</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-semibold outline-none shadow-none text-zinc-700 focus:bg-white focus:border-zinc-300 transition-all">
              <option value="all">جميع الحالات الإدارية</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">القطاع الهيكلي</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-semibold outline-none shadow-none text-zinc-700 focus:bg-white focus:border-zinc-300 transition-all">
              <option value="all">كل قطاعات المبادرة</option>
              {SECTORS.map((s: any) => <option key={s.slug} value={s.slug}>{s.name_ar || s.ar}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">التوزيع الجغرافي</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 text-xs font-semibold outline-none shadow-none text-zinc-700 focus:bg-white focus:border-zinc-300 transition-all">
              <option value="all">كل المحافظات المسجلة</option>
              {cityOptions.map((c) => <option key={c} value={c}>{formatGovernorate(c)}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">نطاق تاريخ التقديم</label>
            <div className="flex gap-1.5 items-center">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 rounded-xl bg-zinc-50/50 border-zinc-200 text-xs p-2 shadow-none" />
              <span className="text-zinc-400 text-[11px] font-bold">إلى</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 rounded-xl bg-zinc-50/50 border-zinc-200 text-xs p-2 shadow-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications banner */}
      {message && (
        <div className={`p-4 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center gap-2.5 animate-in fade-in duration-200 ${
          messageType === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : 
          messageType === "warning" ? "bg-amber-50 border-amber-200 text-amber-900" :
          "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0 opacity-80" />
          <span>{message}</span>
        </div>
      )}

      {rows.length >= 1000 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 text-xs text-amber-900 dark:text-amber-300 font-medium flex items-center gap-2">
          ⚠️ تنبيه حركية النظام: تم جلب أحدث 1000 استمارة لضمان استقرار وسرعة معالجة العمليات، يرجى تضييق خيارات الفرز والتصفية للوصول للمستهدف بدقة.
        </div>
      )}

      {/* Main Data Table View */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-900 dark:bg-zinc-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-200/80">
            <TableRow>
              <TableHead className="font-extrabold text-zinc-900 dark:text-zinc-200 py-4 text-xs">بيانات المتقدم الأساسية</TableHead>
              <TableHead className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs">الرقم القومي</TableHead>
              <TableHead className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs">رقم هاتف التواصل</TableHead>
              <TableHead className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs">المحافظة</TableHead>
              <TableHead className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs">القطاع الفني</TableHead>
              <TableHead className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs">حالة الفرز</TableHead>
              <TableHead className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs text-left pl-6 w-[130px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse border-b last:border-0">
                  <TableCell className="py-4">
                    <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-40 mb-2" />
                    <div className="h-3 bg-zinc-50 dark:bg-zinc-900 rounded w-24" />
                  </TableCell>
                  <TableCell><div className="h-4 bg-zinc-100 rounded w-28" /></TableCell>
                  <TableCell><div className="h-4 bg-zinc-100 rounded w-24" /></TableCell>
                  <TableCell><div className="h-4 bg-zinc-100 rounded w-16" /></TableCell>
                  <TableCell><div className="h-6 bg-zinc-100 rounded-lg w-28" /></TableCell>
                  <TableCell><div className="h-6 bg-zinc-100 rounded-lg w-16" /></TableCell>
                  <TableCell><div className="h-8 bg-zinc-100 rounded-xl w-20 float-left" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-zinc-400 font-semibold text-sm">
                  لا توجد استمارات أو طلبات انضمام مطابقة لمعايير البحث والتصفية المحددة حالياً.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors border-b border-zinc-100 dark:border-zinc-900 last:border-0 group">
                  <TableCell className="py-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 transition-colors">{r.full_name}</div>
                    <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-[220px] truncate">{r.email}</div>
                  </TableCell>
                  
                  <TableCell className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    {r.national_id ? r.national_id : (
                      <span className="text-zinc-300 dark:text-zinc-800 font-sans italic text-[11px]">غير مسجل</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-zinc-700 dark:text-zinc-300 font-mono font-bold text-xs">
                    {r.phone}
                  </TableCell>
                  
                  <TableCell className="text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                    {formatGovernorate(r.city)}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="font-bold bg-zinc-50 text-zinc-700 border-zinc-200 rounded-md text-[11px] px-2 py-0.5">
                      {getSectorLabel(r.sector_key, "ar")}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>{getStatusBadge(r.admin_status)}</TableCell>
                  
                  <TableCell className="text-left pl-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors" onClick={() => openDetails(r)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-700 rounded-lg" disabled={isBusy(r.id)}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[170px] rounded-xl border border-zinc-200 p-1.5 shadow-lg bg-white">
                          <DropdownMenuLabel className="text-right text-[11px] font-bold text-zinc-400 px-2 py-1">تحديث فرز الحالة</DropdownMenuLabel>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem className="text-right text-xs font-medium cursor-pointer rounded-lg py-1.5" onClick={() => quickUpdateStatus(r, "new")}>طلب جديد</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs font-medium cursor-pointer text-blue-600 rounded-lg py-1.5" onClick={() => quickUpdateStatus(r, "in_review")}>قيد المراجعة</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs font-medium cursor-pointer text-amber-600 rounded-lg py-1.5" onClick={() => quickUpdateStatus(r, "contacted")}>تم التواصل</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs font-bold cursor-pointer text-emerald-600 rounded-lg py-1.5" onClick={() => quickUpdateStatus(r, "accepted")}>مقبول مبدئياً</DropdownMenuItem>
                          <DropdownMenuItem className="text-right text-xs font-medium cursor-pointer text-rose-600 rounded-lg py-1.5" onClick={() => quickUpdateStatus(r, "rejected")}>مرفوض / استبعاد</DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem className="text-right text-xs font-bold cursor-pointer text-rose-600 focus:bg-rose-50 rounded-lg py-1.5" onClick={() => remove(r.id, r.full_name)}>
                            <Trash2 className="w-3.5 h-3.5 ml-1.5 inline" /> حذف السجل نهائياً
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

      {/* Detailed Modal Section */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl bg-white">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-black text-zinc-900 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700">
                    <User className="w-4 h-4" />
                  </div>
                  <span>ملف الاستمارة الفني للمتقدم</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-1 font-medium">
                  مراجعة شاملة لبيانات ومؤهلات المتقدم لقطاعات مبادرة SkillUp الإدارية.
                </DialogDescription>
              </div>
              {selected && <div className="shrink-0">{getStatusBadge(selected.admin_status)}</div>}
            </div>
          </div>

          {selected ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm">
              
              {/* Personal Section */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" /> البيانات الشخصية والتعريفية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-zinc-100 p-4 bg-zinc-50/30">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">الاسم الكامل:</span>
                    <span className="font-extrabold text-zinc-900 text-sm mt-0.5 block">{selected.full_name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-zinc-400" /> الرقم القومي (14 رقم):
                    </span>
                    <span className="font-mono font-bold text-zinc-800 text-xs mt-0.5 block tracking-wide">
                      {selected.national_id || "غير متوفر"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">البريد الإلكتروني:</span>
                    <span className="font-mono font-semibold text-zinc-600 text-xs mt-0.5 block">{selected.email}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block flex items-center gap-1">
                      <Phone className="w-3 h-3 text-zinc-400" /> رقم الهاتف المحمول:
                    </span>
                    <span className="font-mono font-bold text-zinc-800 text-xs mt-0.5 block">{selected.phone}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">النطاق الجغرافي:</span>
                    <span className="font-bold text-zinc-700 mt-0.5 block">{formatGovernorate(selected.city)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">العمر الحالي:</span>
                    <span className="font-semibold text-zinc-700 mt-0.5 block">{selected.age ? `${selected.age} عاماً` : "غير محدد"}</span>
                  </div>
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-400" /> الموقف الأكاديمي والتعليمي
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-zinc-100 p-4 bg-zinc-50/30">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">الحالة التعليمية الحالية:</span>
                    <span className="font-bold text-zinc-800 mt-0.5 block text-xs">
                      {EDUCATION_LABEL[selected.education ?? ""] || selected.education || "غير محدد"}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[11px] font-bold text-zinc-400 block">الجامعة / المعهد / الكلية:</span>
                    <span className="font-bold text-zinc-800 mt-0.5 block text-xs">{selected.university || "غير مسجل"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">سنة التخرج:</span>
                    <span className="font-mono font-bold text-zinc-600 mt-0.5 block">{selected.graduation_year || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" /> الرغبات والملاءمة في المبادرة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-zinc-100 p-4 bg-zinc-50/30">
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">القطاع المستهدف:</span>
                    <span className="font-black text-emerald-700 text-xs mt-0.5 block">
                      {getSectorLabel(selected.sector_key, "ar")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">الدور المفضل بالقطاع:</span>
                    <span className="font-bold text-zinc-800 mt-0.5 block">{selected.preferred_role || "عضو قطاع"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 block">ساعات الاتاحية الأسبوعية:</span>
                    <span className="font-semibold text-zinc-700 mt-0.5 block">{selected.availability || "غير محدد"}</span>
                  </div>
                </div>
              </div>

              {/* Links Section */}
              <div className="space-y-2">
                <span className="text-xs font-black text-zinc-400 block flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-zinc-400" /> الروابط والملفات الخارجية المرفقة
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-100 p-3 bg-zinc-50/20 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-600">الحساب الرسمي LinkedIn:</span>
                    {selected.linkedin ? (
                      <a href={selected.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 font-extrabold hover:underline flex items-center gap-0.5">استعراض <ChevronLeft className="w-3 h-3" /></a>
                    ) : <span className="text-zinc-300 italic">لم يرفق</span>}
                  </div>
                  <div className="rounded-xl border border-zinc-100 p-3 bg-zinc-50/20 flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-600">معرض الأعمال Portfolio:</span>
                    {selected.portfolio ? (
                      <a href={selected.portfolio} target="_blank" rel="noreferrer" className="text-emerald-600 font-extrabold hover:underline flex items-center gap-0.5">استعراض <ChevronLeft className="w-3 h-3" /></a>
                    ) : <span className="text-zinc-300 italic">لم يرفق</span>}
                  </div>
                </div>
              </div>

              {/* Text Fields Blocks */}
              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <span className="text-xs font-black text-zinc-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" /> المهارات الفنية والتقنية والشخصية
                  </span>
                  <p className="bg-zinc-50/60 text-xs text-zinc-700 p-3.5 rounded-xl border border-zinc-100 leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto font-medium">
                    {selected.skills || "لم يسجل مهارات إضافية."}
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-black text-zinc-400 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-400" /> الأنشطة الطلابية والخبرات التطوعية والعملية
                  </span>
                  <p className="bg-zinc-50/60 text-xs text-zinc-700 p-3.5 rounded-xl border border-zinc-100 leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto font-medium">
                    {selected.experience || "لا توجد خبرات سابقة."}
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-black text-zinc-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" /> دافع ورسالة المتقدم للانضمام
                  </span>
                  <p className="bg-zinc-50/60 text-xs text-zinc-700 p-3.5 rounded-xl border border-zinc-100 leading-relaxed whitespace-pre-wrap max-h-[110px] overflow-y-auto font-medium">
                    {selected.message || "لا توجد رسالة مرفقة."}
                  </p>
                </div>
              </div>

              {/* Admin Internal Evaluation Notes */}
              <div className="pt-4 border-t border-zinc-100 space-y-2.5">
                <label className="block text-xs font-black text-zinc-800">
                  ملاحظات تقييم لجنة الفرز والمقابلة الإدارية (حفظ تلقائي مع تحديث الحالة):
                </label>
                <textarea 
                  className="w-full min-h-[95px] rounded-xl border border-zinc-200 p-3 text-xs font-medium outline-none focus:border-zinc-400 focus:bg-zinc-50/30 transition-all resize-none font-sans" 
                  placeholder="اكتب هنا نتائج مرحلة الـ Screening والمقابلة الشخصية والتقييم الهيكلي للمتقدم للفرز الحالي..."
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                />
              </div>

            </div>
          ) : null}

          {/* Dialog Action Buttons */}
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 px-6">
            <span className="text-[11px] font-bold text-zinc-400 font-mono">التقديم: {selected ? formatDateTime(selected.created_at) : "—"}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving} className="text-xs h-9 rounded-xl font-semibold">
                إغلاق
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs h-9 rounded-xl font-semibold text-blue-600 border-blue-100 hover:bg-blue-50">
                قيد المراجعة
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs h-9 rounded-xl font-semibold text-amber-600 border-amber-100 hover:bg-amber-50">
                تم التواصل
              </Button>
              <Button size="sm" variant="destructive" disabled={saving} onClick={() => updateStatus("rejected")} className="text-xs h-9 rounded-xl font-bold">
                استبعاد / رفض
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl font-bold shadow-sm" disabled={saving} onClick={() => updateStatus("accepted")}>
                قبول وتعيين المتقدم
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer System Info */}
      <div className="border-t pt-5 border-zinc-200/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 font-medium gap-2">
        <div className="flex items-center gap-1">
          <span>نطاق حماية البيانات الإدارية مؤمن بالكامل. كود الفرز المركزي:</span>
          <code className="bg-zinc-100 px-1.5 py-0.5 rounded font-mono text-zinc-500 font-bold">MEAL-STRUCTURE-CENTRAL-2026</code>
        </div>
        <span>جميع الحقوق محفوظة لمبادرة SkillUp © ٢٠٢٦</span>
      </div>

    </div>
  );
}
