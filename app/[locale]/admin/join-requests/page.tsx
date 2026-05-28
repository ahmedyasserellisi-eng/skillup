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
  Eye, 
  Trash2, 
  UserCheck, 
  XCircle,
  HelpCircle,
  User,
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
  Clock,
  MapPin,
  Calendar,
  Award,
  MessageSquare
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

// قاموس محلي لضمان ترجمة كافة القطاعات بشكل صحيح ومطابق بنسبة 100% لفورم الانضمام
const LOCAL_SECTORS_MAP: Record<string, { ar: string; en: string }> = {
  "marketing-digital-media": { ar: "التسويق والإعلام الرقمي", en: "Marketing & Digital Media" },
  "human-resources": { ar: "إدارة الموارد البشرية", en: "Human Resources Management" },
  "strategic-planning": { ar: "التخطيط الاستراتيجي", en: "Strategic Planning" },
  "sustainable-development": { ar: "التنمية المستدامة", en: "Sustainable Development" },
  "logistics-organization": { ar: "التنظيم واللوجيستيات", en: "Logistics & Organization" },
  "entertainment-culture": { ar: "الترفيه والثقافة", en: "Entertainment & Culture" },
  "training-development": { ar: "التدريب والتطوير المهني", en: "Training & Professional Development" }
};

type JoinRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  national_id: string | null;
  city: string | null; 
  address?: string | null; 
  age: number | null;
  education: string | null;
  university: string | null;
  faculty?: string | null;
  department?: string | null;
  grade?: string | null;
  postgrad_info?: string | null;
  graduation_year: number | null;
  sector_key: string;
  preferred_role: string | null;
  availability: string | null;
  member_status?: string | null;
  leadership_interest?: string | null;
  heard_about_us?: string | null;
  skills: string | null;
  experience: string | null;
  linkedin: string | null;
  facebook?: string | null;
  portfolio: string | null;
  resume_url?: string | null;
  profile_picture_url?: string | null;
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

// دالة الترجمة المحسنة لحل مشكلة الإنجليزية في القطاعات المستهدفة
function getSectorLabel(sectorKey: string, lang: "ar" | "en" = "ar"): string {
  if (LOCAL_SECTORS_MAP[sectorKey]) {
    return lang === "ar" ? LOCAL_SECTORS_MAP[sectorKey].ar : LOCAL_SECTORS_MAP[sectorKey].en;
  }
  const sector = SECTORS?.find((s: any) => s.slug === sectorKey) as any;
  if (!sector) return sectorKey;
  if (lang === "ar") return sector.name_ar || sector.ar || sectorKey;
  return sector.name_en || sector.en || sectorKey;
}

// استخراج النوع ذكي وديناميكي بالكامل من الرقم القومي المصري دون الحاجة لحقل في قاعدة البيانات
function getGenderFromNationalId(nationalId?: string | null) {
  if (!nationalId || !/^\d{14}$/.test(nationalId.trim())) {
    return { text: "غير محدد", className: "bg-zinc-100 text-zinc-600 border-zinc-200" };
  }
  const id = nationalId.trim();
  const genderDigit = parseInt(id.charAt(12), 10);
  return genderDigit % 2 === 1 
    ? { text: "ذكر 🔵", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" }
    : { text: "أنثى 🌸", className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900" };
}

function getStatusBadge(status?: string | null) {
  const v = getStatusValue(status);
  switch (v) {
    case "accepted":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> مقبول
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> مرفوض
        </Badge>
      );
    case "contacted":
      return (
        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> تم التواصل
        </Badge>
      );
    case "in_review":
      return (
        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> قيد المراجعة
        </Badge>
      );
    default:
      return (
        <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300/60 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md">
          <UserPlus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> جديد
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
      const data = filtered.map((r, index) => {
        const genderInfo = getGenderFromNationalId(r.national_id);
        return {
          "م": index + 1,
          "الاسم الكامل": cleanCell(r.full_name),
          "النوع": genderInfo.text,
          "الرقم القومي (14 رقم)": cleanCell(r.national_id),
          "البريد الإلكتروني": cleanCell(r.email),
          "رقم الهاتف": cleanCell(r.phone),
          "المحافظة": formatGovernorate(r.city),
          "العنوان بالتفصيل": cleanCell(r.address),
          "السن": cleanCell(r.age),
          "صفة العضوية": cleanCell(r.member_status),
          "الحالة التعليمية": EDUCATION_LABEL[r.education ?? ""] ?? cleanCell(r.education),
          "الجامعة / المعهد": cleanCell(r.university),
          "الكلية": cleanCell(r.faculty),
          "القسم / التخصص": cleanCell(r.department),
          "الفرقة الدراسية": cleanCell(r.grade),
          "بيانات الدراسات العليا": cleanCell(r.postgrad_info),
          "سنة التخرج": cleanCell(r.graduation_year),
          "القطاع المستهدف": getSectorLabel(r.sector_key, "ar"),
          "الدور المفضل": cleanCell(r.preferred_role),
          "ساعات التفرغ": cleanCell(r.availability),
          "الرغبة في دور قيادي": cleanCell(r.leadership_interest),
          "كيف سمعت عنا": cleanCell(r.heard_about_us),
          "المهارات والقدرات": cleanCell(r.skills),
          "الخبرات السابقة والأنشطة": cleanCell(r.experience),
          "رابط LinkedIn": cleanCell(r.linkedin),
          "رابط Facebook": cleanCell(r.facebook),
          "رابط معرض الأعمال Portfolio": cleanCell(r.portfolio),
          "رسالة المتقدم": cleanCell(r.message),
          "حالة الطلب الإدارية": STATUS_LABEL[getStatusValue(r.admin_status)] ?? getStatusValue(r.admin_status),
          "ملاحظات لجنة الفرز والتقييم": cleanCell(r.admin_notes),
          "تاريخ وساعة التتقديم": formatDateTime(r.created_at)
        };
      });

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
      ws["!dir"] = "rtl";
      ws["!cols"] = [
        { wch: 6 }, { wch: 28 }, { wch: 10 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 18 },
        { wch: 30 }, { wch: 8 }, { wch: 16 }, { wch: 18 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, 
        { wch: 16 }, { wch: 25 }, { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 28 }, { wch: 20 },
        { wch: 20 }, { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 45 }, 
        { wch: 18 }, { wch: 35 }, { wch: 24 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "طلبات الانضمام الموحدة");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `SkillUp-Join-Requests-${dateStr}.xlsx`);
      showNotification("✅ تم إنشاء وتنزيل تقرير Excel بنجاح وتوحيد البيانات باللغة العربية ومن اليمين لليسار.", "success");
    } catch (e: any) {
      showNotification(`❌ حدث خطأ غير متوقع أثناء تصدير الملف: ${e?.message}`, "error");
    }
  }

  function resetFilters() {
    setQ("");
    setStatus("all");
    setSector("all");
    setCity("all");
    setFromDate("");
    setToDate("");
    showNotification("🔄 تم تصفير جميع فلاتر العرض.", "success");
  }

  const isBusy = (id: string) => actionLoadingId === id;

  return (
    <div className="grid gap-6 p-4 md:p-6 max-w-[1700px] mx-auto font-sans text-zinc-900 dark:text-zinc-100" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-600/10">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">إدارة طلبات الانضمام</h1>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              عرض وفرز المتقدمين لمبادرة SkillUp بنظام فرز مركزي مؤمن. (مطابق: {stats.filtered} من أصل {stats.total})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <Button onClick={load} disabled={loading} variant="outline" className="h-10 rounded-xl gap-2 font-semibold border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث البيانات
          </Button>
          <Button onClick={exportExcel} disabled={loading || filtered.length === 0} className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl gap-2 font-semibold shadow-sm">
            <Download className="w-4 h-4" /> تصدير Excel
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 font-medium text-sm animate-in fade-in duration-200 ${
          messageType === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300" :
          messageType === "error" ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300" : 
          "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300"
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: "إجمالي الطلبات", value: stats.total, icon: Users, color: "text-zinc-500" },
          { title: "قيد المراجعة", value: stats.reviewCount, icon: Clock, color: "text-blue-600 dark:text-blue-400" },
          { title: "تم التواصل", value: stats.contactedCount, icon: PhoneCall, color: "text-amber-600 dark:text-amber-400" },
          { title: "المقبولين", value: stats.accepted, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400" },
          { title: "المستبعدين", value: stats.rejected, icon: XCircle, color: "text-rose-600 dark:text-rose-400" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-500">
              <span className="text-xs font-bold">{item.title}</span>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm grid gap-4">
        <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-bold text-sm border-b dark:border-zinc-800 pb-2.5">
          <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span>أدوات الفرز والتصفية المتقدمة</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-zinc-400" />
            <Input placeholder="بحث بالاسم، الهاتف، الكلية..." value={q} onChange={(e) => setQ(e.target.value)} className="h-10 pr-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none">
            <option value="all">كل حالات الطلبات</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={sector} onChange={(e) => setSector(e.target.value)} className="h-10 rounded-xl px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none">
            <option value="all">كل القطاعات المستهدفة</option>
            {Object.keys(LOCAL_SECTORS_MAP).map((key) => (
              <option key={key} value={key}>{LOCAL_SECTORS_MAP[key].ar}</option>
            ))}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-xl px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none">
            <option value="all">كل المحافظات</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{formatGovernorate(c)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t dark:border-zinc-800/60 text-xs font-medium text-zinc-500">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>من تاريخ:</span>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 rounded-xl py-1 text-xs w-[140px] border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>إلى تاريخ:</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 rounded-xl py-1 text-xs w-[140px] border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" />
            </div>
          </div>
          <Button onClick={resetFilters} variant="ghost" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold h-9 rounded-xl gap-1 px-3 self-end sm:self-auto">
            تصفير فلاتر العرض
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-zinc-50/60 dark:bg-zinc-900/60 border-b dark:border-zinc-800 font-bold text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
          <span>جدول فرز طلبات المتقدمين المركزي</span>
          <span className="bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{filtered.length} طلب مطابق</span>
        </div>
        
        {/* تفعيل خاصية التثبيت لعمود الإجراءات بالـ CSS وعزل السحب الأفقي */}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader className="bg-zinc-50/40 dark:bg-zinc-900/40">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-right p-4 text-xs font-bold text-zinc-500">الاسم الكامل</th>
                <th className="text-right p-4 text-xs font-bold text-zinc-500">النوع (تلقائي)</th>
                <th className="text-right p-4 text-xs font-bold text-zinc-500">القطاع المستهدف</th>
                <th className="text-right p-4 text-xs font-bold text-zinc-500">المحافظة</th>
                <th className="text-right p-4 text-xs font-bold text-zinc-500">الهاتف</th>
                <th className="text-right p-4 text-xs font-bold text-zinc-500">الحالة</th>
                <th className="text-right p-4 text-xs font-bold text-zinc-500">تاريخ التقديم</th>
                {/* تم تثبيت العمود هنا في الـ Header */}
                <th className="sticky left-0 bg-zinc-50 dark:bg-zinc-900 z-20 text-center p-4 text-xs font-bold text-zinc-500 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] border-r dark:border-zinc-800 w-[80px]">الإجراءات</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-sm font-medium text-zinc-400">
                    جاري تحميل سجلات قاعدة البيانات الفيدرالية...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-sm font-medium text-zinc-400">
                    لا توجد أي طلبات انضمام تطابق فلاتر البحث الحالية.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const genderInfo = getGenderFromNationalId(row.national_id);
                  return (
                    <TableRow key={row.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors border-b border-zinc-100 dark:border-zinc-800/60">
                      <TableCell className="p-4 font-bold text-zinc-900 dark:text-zinc-100 text-xs">{row.full_name}</TableCell>
                      <TableCell className="p-4 text-xs">
                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${genderInfo.className}`}>
                          {genderInfo.text}
                        </span>
                      </TableCell>
                      <TableCell className="p-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">{getSectorLabel(row.sector_key, "ar")}</TableCell>
                      <TableCell className="p-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">{formatGovernorate(row.city)}</TableCell>
                      <TableCell className="p-4 text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">{row.phone || "—"}</TableCell>
                      <TableCell className="p-4 text-xs">{getStatusBadge(row.admin_status)}</TableCell>
                      <TableCell className="p-4 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 font-mono">{formatDateTime(row.created_at)}</TableCell>
                      
                      {/* العمود المثبت بالكامل مع إضافة خلفية صلبة وظل لمنع تداخل الكلام خلفه */}
                      <TableCell className="sticky left-0 bg-white dark:bg-zinc-900 z-10 text-center p-3 shadow-[-4px_0_10px_rgba(0,0,0,0.05)] border-r dark:border-zinc-800">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[190px] font-sans border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs shadow-md">
                            <DropdownMenuLabel className="text-right text-[11px] text-zinc-400 dark:text-zinc-500 font-bold">إجراءات سريعة</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDetails(row)} className="text-right font-medium gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-800">
                              <Eye className="w-3.5 h-3.5 text-zinc-400" /> عرض الملف بالكامل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {["in_review", "contacted", "accepted", "rejected"].map((st) => {
                              const colors: Record<string, string> = {
                                in_review: "text-blue-600 dark:text-blue-400",
                                contacted: "text-amber-600 dark:text-amber-400",
                                accepted: "text-emerald-600 dark:text-emerald-400",
                                rejected: "text-rose-600 dark:text-rose-400"
                              };
                              return (
                                <DropdownMenuItem key={st} disabled={isBusy(row.id)} onClick={() => quickUpdateStatus(row, st)} className={`text-right font-medium cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-800 ${colors[st]}`}>
                                  تحديث: {STATUS_LABEL[st]}
                                </DropdownMenuItem>
                              );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={isBusy(row.id)} onClick={() => remove(row.id, row.full_name)} className="text-right font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> حذف السجل نهائياً
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Premium Bento-Grid Style Modal Details UI */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto font-sans text-right p-0 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl" dir="rtl">
          {selected && (
            <>
              {/* Header Profile Section */}
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white p-6 relative overflow-hidden border-b border-zinc-800">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                <div className="relative flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-black text-xl text-white shadow-xl">
                      {selected.full_name ? selected.full_name.charAt(0) : "S"}
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-black tracking-tight">{selected.full_name}</DialogTitle>
                      <DialogDescription className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                        <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {getSectorLabel(selected.sector_key, "ar")}</span>
                        <span>•</span>
                        <span className="font-mono">تاريخ التقديم: {formatDateTime(selected.created_at)}</span>
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selected.admin_status)}
                  </div>
                </div>
              </div>

              {/* Bento Grid Content Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-700 dark:text-zinc-300">
                
                {/* Block 1: البيانات الشخصية والأساسية */}
                <div className="bg-zinc-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 grid gap-3.5 shadow-sm">
                  <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b dark:border-zinc-800 pb-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <User className="w-4 h-4" />
                    <span>البيانات الشخصية والأساسية</span>
                  </div>
                  <div className="grid gap-3 font-semibold">
                    <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900">
                      <span className="text-zinc-400 font-medium">النوع والنوع الاجتماعي:</span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getGenderFromNationalId(selected.national_id).className}`}>
                        {getGenderFromNationalId(selected.national_id).text}
                      </span>
                    </div>
                    <div><span className="text-zinc-400 font-medium">الرقم القومي:</span> <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-800 dark:text-zinc-200">{selected.national_id || "غير متوفر"}</span></div>
                    <div><span className="text-zinc-400 font-medium">السن الحالي:</span> <span className="font-mono">{selected.age || "غير محدد"} سنة</span></div>
                    <div><span className="text-zinc-400 font-medium">المحافظة:</span> {formatGovernorate(selected.city)}</div>
                    <div><span className="text-zinc-400 font-medium">العنوان بالتفصيل:</span> <span className="text-zinc-900 dark:text-zinc-100 font-bold">{selected.address || "لم يتم إدخال عنوان"}</span></div>
                    <div><span className="text-zinc-400 font-medium">صفة العضوية:</span> <Badge variant="outline" className="text-xs">{selected.member_status || "جديد"}</Badge></div>
                    <div><span className="text-zinc-400 font-medium">كيف سمعت عنا؟</span> <span className="text-zinc-500 italic">{selected.heard_about_us || "غير محدد"}</span></div>
                    <div className="border-t dark:border-zinc-800 pt-2 grid gap-1.5 font-mono text-[11px]">
                      <div><span className="text-zinc-400 font-sans font-medium">الهاتف:</span> {selected.phone || "—"}</div>
                      <div><span className="text-zinc-400 font-sans font-medium">البريد الالكتروني:</span> {selected.email}</div>
                    </div>
                  </div>
                </div>

                {/* Block 2: المسار التعليمي والأكاديمي */}
                <div className="bg-zinc-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 grid gap-3.5 shadow-sm">
                  <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b dark:border-zinc-800 pb-2 text-sm text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-4 h-4" />
                    <span>المسار التعليمي والأكاديمي</span>
                  </div>
                  <div className="grid gap-3 font-semibold">
                    <div><span className="text-zinc-400 font-medium">الحالة التعليمية:</span> {EDUCATION_LABEL[selected.education ?? ""] || selected.education || "غير محدد"}</div>
                    <div><span className="text-zinc-400 font-medium">الجامعة / المعهد:</span> {selected.university || "غير محدد"}</div>
                    {selected.faculty && <div><span className="text-zinc-400 font-medium">الكلية:</span> {selected.faculty}</div>}
                    {selected.department && <div><span className="text-zinc-400 font-medium">القسم / التخصص:</span> {selected.department}</div>}
                    {selected.grade && <div><span className="text-zinc-400 font-medium">الفرقة الدراسية:</span> <Badge className="bg-blue-100 text-blue-800 border-none">{selected.grade}</Badge></div>}
                    {selected.postgrad_info && (
                      <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
                        <span className="text-amber-700 dark:text-amber-400 font-bold block mb-1">بيانات الدراسات العليا:</span>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{selected.postgrad_info}</p>
                      </div>
                    )}
                    <div><span className="text-zinc-400 font-medium">سنة التخرج المتوقعة/الفعلية:</span> <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{selected.graduation_year || "غير محدد"}</span></div>
                  </div>
                </div>

                {/* Block 3: تفضيلات التطوع والخبرات */}
                <div className="md:col-span-2 bg-zinc-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 grid gap-4 shadow-sm">
                  <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b dark:border-zinc-800 pb-2 text-sm text-purple-600 dark:text-purple-400">
                    <Briefcase className="w-4 h-4" />
                    <span>تفضيلات التطوع والملف المهني</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-semibold">
                    <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 shadow-2xs">
                      <span className="text-zinc-400 font-medium block mb-1">الدور المفضل بالقطاع:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold text-xs">{selected.preferred_role || "غير محدد"}</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 shadow-2xs">
                      <span className="text-zinc-400 font-medium block mb-1">ساعات التفرغ الأسبوعية:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold text-xs">{selected.availability || "غير محدد"}</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-900 shadow-2xs">
                      <span className="text-zinc-400 font-medium block mb-1">الرغبة في دور قيادي:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold text-xs">{selected.leadership_interest || "غير محدد"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                    <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900">
                      <span className="text-purple-600 dark:text-purple-400 font-black flex items-center gap-1 mb-1.5"><Award className="w-3.5 h-3.5" /> المهارات والقدرات:</span>
                      <p className="whitespace-pre-line leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium">{selected.skills || "لا يوجد"}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900">
                      <span className="text-blue-600 dark:text-blue-400 font-black flex items-center gap-1 mb-1.5"><Briefcase className="w-3.5 h-3.5" /> الخبرات السابقة والأنشطة التطوعية:</span>
                      <p className="whitespace-pre-line leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium">{selected.experience || "لا يوجد"}</p>
                    </div>
                  </div>

                  {selected.message && (
                    <div className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900">
                      <span className="text-zinc-500 font-black flex items-center gap-1 mb-1.5"><MessageSquare className="w-3.5 h-3.5" /> رسالة دافع المتقدم:</span>
                      <p className="italic leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">{selected.message}</p>
                    </div>
                  )}
                </div>

                {/* Block 4: روابط التواصل والمرفقات الرقمية */}
                <div className="md:col-span-2 bg-zinc-50/50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 grid gap-3 shadow-sm">
                  <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b dark:border-zinc-800 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <Link2 className="w-4 h-4" />
                    <span>الروابط الخارجية والمرفقات الرقمية</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {selected.resume_url && (
                      <a href={selected.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs font-bold transition-all transform hover:-translate-y-0.5 text-xs">
                        <FileText className="w-4 h-4" /> 📄 استعراض السيرة الذاتية (CV)
                      </a>
                    )}
                    {selected.portfolio && (
                      <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs font-bold transition-all transform hover:-translate-y-0.5 text-xs">
                        <Award className="w-4 h-4" /> 🎨 معرض الأعمال (Portfolio)
                      </a>
                    )}
                    {selected.linkedin && (
                      <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs font-bold transition-all transform hover:-translate-y-0.5 text-xs animate-pulse">
                        <Link2 className="w-4 h-4" /> 💼 الحساب المهني LinkedIn
                      </a>
                    )}
                    {selected.facebook && (
                      <a href={selected.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs font-bold transition-all transform hover:-translate-y-0.5 text-xs">
                        <User className="w-4 h-4" /> 🔵 الملف الشخصي Facebook
                      </a>
                    )}
                  </div>
                </div>

                {/* Block 5: ملاحظات وقرار الفرز */}
                <div className="md:col-span-2 bg-amber-50/20 dark:bg-zinc-900/60 p-5 rounded-2xl border border-amber-100/70 dark:border-zinc-800 grid gap-3 shadow-xs">
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">ملاحظات وقرار لجنة الفرز والتقييم (MEAL):</div>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اكتب هنا التقييم الفني للمتقدم، التوصيات، أو أي ملاحظات أخرى لحفظها بالسجل المركزي..." className="w-full h-24 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium" />
                  <div className="flex flex-wrap items-center justify-end gap-2 mt-2">
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs h-9 rounded-xl font-bold border-blue-200 text-blue-700 bg-white hover:bg-blue-50">
                      قيد المراجعة
                    </Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs h-9 rounded-xl font-bold border-amber-200 text-amber-700 bg-white hover:bg-amber-50">
                      تم التواصل
                    </Button>
                    <Button size="sm" variant="destructive" disabled={saving} onClick={() => updateStatus("rejected")} className="text-xs h-9 rounded-xl font-bold shadow-xs">
                      استبعاد / رفض الطلب
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl font-bold shadow-md" disabled={saving} onClick={() => updateStatus("accepted")}>
                      قبول وتعيين المتقدم 🎉
                    </Button>
                  </div>
                </div>

              </div>

              {/* Footer System Info */}
              <div className="border-t p-4 border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 font-medium gap-2 bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="flex items-center gap-1">
                  <span>نطاق حماية البيانات الإدارية مؤمن بالكامل. كود الفرز المركزي:</span>
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-500 font-mono">SKILLUP-CENTRAL-2026</code>
                </div>
                <span>مبادرة SkillUp لتطوير الشباب ورفع المهارات</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
