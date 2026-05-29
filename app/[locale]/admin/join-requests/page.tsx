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
  MapPin
} from "lucide-react";

// خريطة تعريب وتوحيد المحافظات المصرية لفرز دقيق وموثوق
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

// تعريف نوع البيانات المتوافق تماماً مع بنية قاعدة البيانات واستمارة المتقدمين
type JoinRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  national_id: string | null;
  city: string | null; 
  address: string | null; // حقل العنوان التفصيلي
  age: number | null;
  gender?: string | null;
  member_status?: string | null;
  leadership_interest?: string | null;
  education: string | null;
  university: string | null;
  faculty?: string | null;
  department?: string | null;
  grade?: string | null;
  graduation_year: number | null;
  sector_key: string;
  preferred_role: string | null;
  availability: string | null;
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

// قائمة مسؤولي الإدارة المخولين بالوصول للوحة التحكم الفرزية
const ALLOWED_ADMINS = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

// قواميس وقوائم التعريب الثابتة لتوحيد الواجهات والتقارير
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

// دالة ذكية لترجمة وتوحيد القطاعات الهيكلية بناءً على ملف البيانات المركزي
function getSectorLabel(sectorKey: any, lang: "ar" | "en" = "ar"): string {
  if (!sectorKey) return "غير محدد";
  const cleanKey = String(sectorKey).trim().toLowerCase();
  const sector = SECTORS.find((s: any) => 
    String(s.slug).toLowerCase() === cleanKey || 
    String(s.id).toLowerCase() === cleanKey
  ) as any;
  if (!sector) return String(sectorKey);
  if (lang === "ar") return sector.name_ar || sector.ar || sector.name || cleanKey;
  return sector.name_en || sector.en || sector.name || cleanKey;
}

// دالة تعريب خانة الرغبة في منصب قيادي والتعامل مع كافة أشكال الداتا المتوقعة
function getLeadershipInterestLabel(value: any): string {
  if (value === null || value === undefined || value === "") return "غير محدد";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "yes" || normalized === "true" || normalized === "1" || normalized === "نعم") return "نعم";
  if (normalized === "no" || normalized === "false" || normalized === "0" || normalized === "لا") return "لا";
  return String(value);
}

// دالة تعريب صفة العضوية المطلوبة
function getMemberStatusLabel(value: any): string {
  if (!value) return "غير محدد";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "member" || normalized === "عضو") return "عضو متطوع";
  if (normalized === "leader" || normalized === "قائد") return "قائد / مسؤول";
  return String(value);
}

function getStatusValue(v?: string | null) {
  return v ?? "new";
}

// إنشاء شارات الحالات الملونة المتوافقة مع النظام الداكن والمضيء لقراءة مرئية سريعة
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

// احتساب تلقائي للنوع بناءً على الرقم القومي في حال عدم توفر خانة صريحة
function getGenderText(nationalId?: string | null, genderField?: string | null) {
  if (genderField) {
    const g = genderField.trim().toLowerCase();
    if (g === "male" || g === "ذكر") return "ذكر";
    if (g === "female" || g === "أنثى") return "أنثى";
  }
  if (!nationalId) return "غير محدد";
  const cleanId = nationalId.trim();
  if (!/^\d{14}$/.test(cleanId)) return "غير محدد";
  const genderDigit = parseInt(cleanId.charAt(12), 10);
  return genderDigit % 2 === 0 ? "أنثى" : "ذكر";
}

export default function AdminJoinRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rows, setRows] = useState<JoinRequest[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "warning" | "">("");
  
  // حالات الفلاتر والبحث المتقدم
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // حالات نافذة التفاصيل والملاحظات
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<JoinRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // التحقق الصارم والمؤمن من هوية الجلسة الإدارية المخولة
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

  // جلب طلبات الانضمام كاملة من السيرفر
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

  // تجميع خيارات المحافظات المتاحة ديناميكياً للفلترة
  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => normalizeCity(r.city)).filter(Boolean))
    ).sort((a, b) => formatGovernorate(a).localeCompare(formatGovernorate(b), "ar"));
  }, [rows]);

  // منطق البحث الفوري والفرز المتقدم لجميع الحقول والمحافظات والعناوين بالتفصيل
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
        r.address ?? "", // البحث بكلمات مفتاحية من العنوان التفصيلي
        getSectorLabel(r.sector_key, "ar"),
        r.skills ?? "",
        r.experience ?? "",
        r.university ?? "",
        r.preferred_role ?? "",
        getMemberStatusLabel(r.member_status),
        getLeadershipInterestLabel(r.leadership_interest)
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q, status, sector, city, fromDate, toDate]);

  // احتساب الإحصائيات الفورية لعرضها في بطاقات علوية
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

  // تحديث حالة طلب متقدم من داخل نافذة المودال التفصيلية مع حفظ الملاحظات
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

  // تحديث حالة الطلب السريع بنقرة واحدة من شريط الجدول الخارجي
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

  // حذف سجل متقدم نهائياً وبشكل حرج من السيستم وقاعدة البيانات بعد التأكيد الإداري
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

  // تصدير التقارير الموحدة بصيغة Excel مع تنسيق اتجاه القراءة والتعريب الشامل
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
        "النوع": getGenderText(r.national_id, r.gender),
        "صفة العضوية": getMemberStatusLabel(r.member_status),
        "الرغبة في دور قيادي": getLeadershipInterestLabel(r.leadership_interest),
        "البريد الإلكتروني": cleanCell(r.email),
        "رقم الهاتف": cleanCell(r.phone),
        "المحافظة": formatGovernorate(r.city),
        "العنوان بالتفصيل": cleanCell(r.address), 
        "السن": cleanCell(r.age),
        "الحالة التعليمية": EDUCATION_LABEL[r.education ?? ""] ?? cleanCell(r.education),
        "الجامعة / المعهد": cleanCell(r.university),
        "الكلية": cleanCell(r.faculty),
        "القسم / التخصص": cleanCell(r.department),
        "الفرقة الدراسية": cleanCell(r.grade),
        "سنة التخرج": cleanCell(r.graduation_year),
        "القطاع المستهدف": getSectorLabel(r.sector_key, "ar"),
        "الدور المفضل": cleanCell(r.preferred_role),
        "ساعات التفرغ": cleanCell(r.availability),
        "المهارات والقدرات": cleanCell(r.skills),
        "الخبرات السابقة والأنشطة": cleanCell(r.experience),
        "رابط LinkedIn": cleanCell(r.linkedin),
        "رابط Facebook": cleanCell(r.facebook),
        "رابط معرض الأعمال Portfolio": cleanCell(r.portfolio),
        "رسالة المتقدم": cleanCell(r.message),
        "حالة الطلب الإدارية": STATUS_LABEL[getStatusValue(r.admin_status)] ?? getStatusValue(r.admin_status),
        "ملاحظات لجنة الفرز والتقييم الداخلي": cleanCell(r.admin_notes),
        "تاريخ وساعة التقديم": formatDateTime(r.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
      ws["!dir"] = "rtl"; // تحديد اتجاه ورقة العمل من اليمين لليسار للعربية
      ws["!cols"] = [
        { wch: 6 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
        { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 8 }, { wch: 18 }, 
        { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 30 }, 
        { wch: 20 }, { wch: 28 }, { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 30 }, 
        { wch: 30 }, { wch: 45 }, { wch: 18 }, { wch: 35 }, { wch: 24 }
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
      
      {/* رأس الصفحة والإجراءات العامة */}
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

      {/* شريط التنبيهات الفورية */}
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

      {/* لوحة عرض الإحصائيات الفورية لفرز الطلبات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: "إجمالي الطلبات", value: stats.total, icon: Users, color: "text-zinc-400 dark:text-zinc-500" },
          { title: "طلبات جديدة", value: stats.newCount, icon: UserPlus, color: "text-zinc-600 dark:text-zinc-400" },
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

      {/* أدوات الفرز والتصفية المتقدمة */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm grid gap-4">
        <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-bold text-sm border-b dark:border-zinc-800 pb-2.5">
          <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span>أدوات الفرز والتصفية المتقدمة</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم، العنوان، الهاتف، الرقم القومي..." className="pr-9 h-11 rounded-xl text-xs font-medium border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-zinc-200 dark:focus-visible:ring-zinc-800" />
          </div>

          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            className="h-11 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 px-3 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800"
          >
            <option value="all">كل حالات الطلبات</option>
            <option value="new">جديد</option>
            <option value="in_review">قيد المراجعة</option>
            <option value="contacted">تم التواصل</option>
            <option value="accepted">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select 
            value={sector} 
            onChange={(e) => setSector(e.target.value)} 
            className="h-11 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 px-3 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800"
          >
            <option value="all">كل القطاعات المستهدفة</option>
            {SECTORS.map((sec: any) => (
              <option key={sec.slug || sec.id} value={sec.slug || sec.id}>
                {sec.name_ar || sec.ar || sec.name}
              </option>
            ))}
          </select>

          <select 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            className="h-11 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 px-3 outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800"
          >
            <option value="all">كل المحافظات</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {formatGovernorate(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t dark:border-zinc-800/60">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>من تاريخ:</span>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-36 rounded-lg text-xs" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>إلى تاريخ:</span>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-36 rounded-lg text-xs" />
          </div>
          <Button onClick={resetFilters} variant="ghost" size="sm" className="h-9 text-zinc-500 hover:text-zinc-700 rounded-lg text-xs mr-auto font-semibold">
            تصفير الفلاتر
          </Button>
        </div>
      </div>

      {/* جدول عرض البيانات الرئيسي */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-950/60">
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                <TableHead className="text-right font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12 w-12">م</TableHead>
                <TableHead className="text-right font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12">الاسم وبيانات الاتصال</TableHead>
                <TableHead className="text-right font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12">المحافظة والعنوان</TableHead>
                <TableHead className="text-right font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12">القطاع المستهدف</TableHead>
                <TableHead className="text-right font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12">العضوية/القيادة</TableHead>
                <TableHead className="text-right font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12">الحالة الإدارية</TableHead>
                <TableHead className="text-right font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12">تاريخ التقديم</TableHead>
                <TableHead className="text-center font-bold text-xs text-zinc-500 dark:text-zinc-400 h-12 w-20">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-zinc-400 dark:text-zinc-500 font-medium text-xs">
                    لا توجد طلبات انضمام مطابقة للفرز والتصفية الحالية.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, idx) => (
                  <TableRow key={row.id} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                    <TableCell className="text-right font-medium text-xs text-zinc-400">{idx + 1}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{row.full_name}</span>
                        <span className="text-xs text-zinc-400 mt-0.5">{row.email} | {row.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" /> {formatGovernorate(row.city)}
                        </span>
                        <span className="text-[11px] text-zinc-400 max-w-[190px] truncate mt-0.5" title={row.address || ""}>
                          {row.address || "بدون عنوان مفصل"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-700 dark:text-zinc-300">
                        {getSectorLabel(row.sector_key, "ar")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <div><span className="text-zinc-400">الصفة:</span> <span className="font-medium">{getMemberStatusLabel(row.member_status)}</span></div>
                        <div><span className="text-zinc-400">قيادي:</span> <span className="font-medium">{getLeadershipInterestLabel(row.leadership_interest)}</span></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{getStatusBadge(row.admin_status)}</TableCell>
                    <TableCell className="text-right text-xs text-zinc-400 font-mono">{formatDateTime(row.created_at)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openDetails(row)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <Eye className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" disabled={isBusy(row.id)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              <MoreVertical className="w-4 h-4 text-zinc-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-right font-sans rounded-xl w-44 dark:bg-zinc-900 border dark:border-zinc-800">
                            <DropdownMenuLabel className="text-xs text-zinc-400">تحديث الحالة سريعاً</DropdownMenuLabel>
                            <DropdownMenuSeparator className="dark:border-zinc-800" />
                            {(["new", "in_review", "contacted", "accepted", "rejected"] as const).map((st) => {
                              const colors: Record<string, string> = {
                                new: "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                                in_review: "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20",
                                contacted: "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20",
                                accepted: "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                                rejected: "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              };
                              return (
                                <DropdownMenuItem 
                                  key={st} 
                                  disabled={isBusy(row.id)} 
                                  onClick={() => quickUpdateStatus(row, st)}
                                  className={`font-medium text-xs cursor-pointer ${colors[st]}`}
                                >
                                  تحديث: {STATUS_LABEL[st]}
                                </DropdownMenuItem>
                              );
                            })}
                            <DropdownMenuSeparator className="dark:border-zinc-800" />
                            <DropdownMenuItem 
                              disabled={isBusy(row.id)} 
                              onClick={() => remove(row.id, row.full_name)} 
                              className="font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> حذف السجل نهائياً
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
      </div>

      {/* نافذة المودال المنبثقة لاستعراض الملف الكامل والتقييم واتخاذ القرار */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 font-sans border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xl" dir="rtl">
          <DialogHeader className="text-right border-b pb-4 border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> <span>تفاصيل طلب الانضمام الكاملة</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-1">
              مراجعة البيانات الشخصية والمهنية والأكاديمية للمتقدم وإدارة حالة الطلب ونظام التقييم والفرز المعتمد.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-6 mt-4">
              
              {/* القسم الأول: البيانات الشخصية والأساسية */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <User className="w-4 h-4 text-zinc-400" /> البيانات الأساسية والشخصية
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الاسم الكامل:</span> <span className="font-bold">{selected.full_name}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الرقم القومي:</span> <span className="font-mono">{selected.national_id || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">البريد الإلكتروني:</span> <span className="font-medium">{selected.email}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">رقم الهاتف:</span> <span className="font-mono">{selected.phone || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">المحافظة:</span> <span className="font-semibold">{formatGovernorate(selected.city)}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">العنوان بالتفصيل:</span> <span className="font-medium">{selected.address || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">السن:</span> <span className="font-semibold">{selected.age || "غير محدد"} سنة</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">النوع:</span> <span className="font-semibold">{getGenderText(selected.national_id, selected.gender)}</span></div>
                </div>
              </div>

              {/* القسم الثاني: المسار التعليمي والأكاديمي */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <GraduationCap className="w-4 h-4 text-zinc-400" /> الحالة الأكاديمية والتعليمية
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">المستوى التعليمي:</span> <span className="font-semibold">{EDUCATION_LABEL[selected.education ?? ""] || selected.education || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الجامعة / المعهد:</span> <span className="font-semibold">{selected.university || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الكلية:</span> <span className="font-semibold">{selected.faculty || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">القسم / التخصص:</span> <span className="font-semibold">{selected.department || "غير محدد"}</span></div>
                  {selected.grade && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الفرقة الدراسية:</span> <span className="font-semibold">{selected.grade}</span></div>}
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">سنة التخرج:</span> <span className="font-mono font-semibold">{selected.graduation_year || "غير محدد"}</span></div>
                </div>
              </div>

              {/* القسم الثالث: التفضيلات والقطاع المستهدف بالهيكلة */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <Briefcase className="w-4 h-4 text-zinc-400" /> التفضيلات والقطاع المستهدف بالهيكلة
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">القطاع المختار:</span> <strong className="text-emerald-700 dark:text-emerald-400 font-black">{getSectorLabel(selected.sector_key, "ar")}</strong></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الدور أو المسؤولية المفضلة:</span> <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{selected.preferred_role || "غير محدد"}</strong></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">صفة العضوية المطلوبة:</span> <span className="font-semibold">{getMemberStatusLabel(selected.member_status)}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الرغبة في دور قيادي:</span> <span className="font-semibold">{getLeadershipInterestLabel(selected.leadership_interest)}</span></div>
                  <div className="md:col-span-2"><span className="text-zinc-400 dark:text-zinc-500 font-medium">ساعات التفرغ المتاحة أسبوعياً:</span> <span className="font-medium">{selected.availability || "غير محدد"}</span></div>
                </div>
              </div>

              {/* القسم الرابع: الخبرات والمهارات النصية */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <FileText className="w-4 h-4 text-zinc-400" /> الخبرات والمهارات الذاتية
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 font-medium block mb-1">المهارات والقدرات الشخصية:</span>
                    <p className="p-3 bg-white dark:bg-zinc-950 rounded-lg border text-xs whitespace-pre-wrap leading-relaxed">{selected.skills || "لم يتم إدخال أي مهارات"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 font-medium block mb-1">الخبرات السابقة والأنشطة الطلابية:</span>
                    <p className="p-3 bg-white dark:bg-zinc-950 rounded-lg border text-xs whitespace-pre-wrap leading-relaxed">{selected.experience || "لا توجد خبرات سابقة مسجلة"}</p>
                  </div>
                  {selected.message && (
                    <div>
                      <span className="text-zinc-400 dark:text-zinc-500 font-medium block mb-1">رسالة المتقدم التوجيهية للجنة:</span>
                      <p className="p-3 bg-white dark:bg-zinc-950 rounded-lg border text-xs whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* القسم الخامس: الروابط الرقمية والمرفقات المسجلة */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <Link2 className="w-4 h-4 text-zinc-400" /> الروابط الرقمية والمرفقات المرفوعة
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {selected.linkedin && (
                    <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      🔗 ملف LinkedIn الشخصي
                    </a>
                  )}
                  {selected.facebook && (
                    <a href={selected.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border text-blue-500 dark:text-blue-400 hover:underline font-medium">
                      🔗 ملف Facebook الشخصي
                    </a>
                  )}
                  {selected.portfolio && (
                    <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border text-zinc-700 dark:text-zinc-300 hover:underline font-medium">
                      💼 معرض الأعمال / Portfolio
                    </a>
                  )}
                  {selected.resume_url && (
                    <a href={selected.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border text-emerald-600 dark:text-emerald-400 hover:underline font-medium col-span-1 sm:col-span-2 md:col-span-1">
                      📄 رابط السيرة الذاتية (CV Drive)
                    </a>
                  )}
                  {selected.profile_picture_url && (
                    <a href={selected.profile_picture_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border text-amber-600 dark:text-amber-400 hover:underline font-medium">
                      🖼️ الصورة الشخصية المرفوعة
                    </a>
                  )}
                </div>
              </div>

              {/* القسم السادس: اتخاذ القرار وتقييم لجنة الفرز والمتابعة والتقييم (MEAL) */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-zinc-400" /> لوحة التحكم وتقييم لجنة الفرز الداخلي
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-bold text-zinc-500 block mb-1">ملاحظات وتقييم المتقدم (رؤية اللجنة الداخيلة):</span>
                    <textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="أدخل تقييم المتقدم الأولي، نقاط القوة، أو كود المتابعة والفرز المركزي هنا..." 
                      className="w-full h-24 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-xs outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none font-medium placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t dark:border-zinc-800/60">
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs h-9 rounded-xl font-bold border-blue-200 text-blue-700 bg-white dark:bg-zinc-950 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                      قيد المراجعة
                    </Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs h-9 rounded-xl font-bold border-amber-200 text-amber-700 bg-white dark:bg-zinc-950 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                      تم التواصل
                    </Button>
                    <Button size="sm" variant="destructive" disabled={saving} onClick={() => updateStatus("rejected")} className="text-xs h-9 rounded-xl font-bold">
                      استبعاد / رفض
                    </Button>
                    <Button size="sm" disabled={saving} onClick={() => updateStatus("accepted")} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs h-9 rounded-xl font-bold shadow-sm">
                      قبول وتعيين المتقدم
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* التذييل (Footer) */}
      <div className="border-t pt-5 border-zinc-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium gap-2">
        <div className="flex items-center gap-1">
          <span>نطاق حماية البيانات الإدارية مؤمن بالكامل. كود الفرز المركزي:</span>
          <code className="bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded font-mono text-[10px] text-zinc-500">SKILLUP-MEAL-MAIN</code>
        </div>
        <span>جميع الحقوق محفوظة لمبادرة SkillUp &copy; {new Date().getFullYear()}</span>
      </div>

    </div>
  );
}
