"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  MapPin,
  ShieldAlert
} from "lucide-react";

const EGYPT_GOVERNORATES_MAP: Record<string, string> = {
  "cairo": "القاهرة", "giza": "الجيزة", "alexandria": "الإسكندرية", "dakahlia": "الدقهلية",
  "red sea": "البحر الأحمر", "beheira": "البحيرة", "fayoum": "الفيوم", "gharbia": "الغربية",
  "ismailia": "الإسماعيلية", "monufia": "المنوفية", "minya": "المنيا", "qalyubia": "القليوبية",
  "new valley": "الوادي الجديد", "suez": "السويس", "sharqia": "الشرقية", "aswan": "أسوان",
  "asyut": "أسيوط", "beni suef": "بني سويف", "port said": "بورسعيد", "damietta": "دمياط",
  "south sinai": "جنوب سيناء", "kafr el sheikh": "كفر الشيخ", "matrouh": "مطروح",
  "luxor": "الأقصر", "qena": "قنا", "north sinai": "شمال سيناء", "sohag": "سوهاج"
};

type JoinRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  national_id: string | null;
  city: string | null; 
  address: string | null;
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

const ALLOWED_ADMINS = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

const EDUCATION_LABEL: Record<string, string> = {
  student: "طالب جامعي", graduate: "خريج", postgrad: "طالب دراسات عليا", school: "طالب ثانوي", other: "أخرى"
};

const STATUS_LABEL: Record<string, string> = {
  new: "جديد", in_review: "قيد المراجعة", contacted: "تم التواصل", accepted: "مقبول", rejected: "مرفوض"
};

function getSectorLabel(sectorKey: any, lang: "ar" | "en" = "ar"): string {
  if (!sectorKey) return "غير محدد";
  const cleanKey = String(sectorKey).trim().toLowerCase();
  const sector = SECTORS.find((s: any) => 
    String(s.slug).toLowerCase() === cleanKey || String(s.id).toLowerCase() === cleanKey
  ) as any;
  if (!sector) return String(sectorKey);
  if (lang === "ar") return sector.name_ar || sector.ar || sector.name || cleanKey;
  return sector.name_en || sector.en || sector.name || cleanKey;
}

function getLeadershipInterestLabel(value: any): string {
  if (value === null || value === undefined || value === "") return "غير محدد";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "yes" || normalized === "true" || normalized === "1" || normalized === "نعم") return "نعم";
  if (normalized === "no" || normalized === "false" || normalized === "0" || normalized === "لا") return "لا";
  return String(value);
}

function getMemberStatusLabel(value: any): string {
  if (!value) return "غير محدد";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "member" || normalized === "عضو") return "عضو متطوع";
  if (normalized === "leader" || normalized === "قائد") return "قائد / مسؤول";
  return String(value);
}

function getStatusValue(v?: string | null): string {
  return v ?? "new";
}

function getStatusBadge(status?: string | null) {
  const v = getStatusValue(status);
  switch (v) {
    case "accepted":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shadow-none pointer-events-none">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> مقبول
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shadow-none pointer-events-none">
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> مرفوض
        </Badge>
      );
    case "contacted":
      return (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shadow-none pointer-events-none">
          <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> تم التواصل
        </Badge>
      );
    case "in_review":
      return (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shadow-none pointer-events-none">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> قيد المراجعة
        </Badge>
      );
    default:
      return (
        <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-300/60 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md shadow-none pointer-events-none">
          <UserPlus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" /> جديد
        </Badge>
      );
  }
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("ar-EG", {
      year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
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

function getGenderText(nationalId?: string | null, genderField?: string | null) {
  if (genderField) {
    const g = genderField.trim().toLowerCase();
    if (g === "male" || g === "ذكر") return "ذكر";
    if (g === "female" || g === "أنثى") return "أنثى";
  }
  if (!nationalId) return "غير محدد";
  const cleanId = nationalId.trim();
  if (!/^\d{14}$/.test(cleanId)) return "غير مححدد";
  const genderDigit = parseInt(cleanId.charAt(12), 10);
  return genderDigit % 2 === 0 ? "أنثى" : "ذكر";
}

export default function AdminJoinRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
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

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((msg: string, type: "success" | "error" | "warning") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    setMessageType(type);
    timeoutRef.current = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const verifyAuthAndLoad = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabaseBrowser.auth.getSession();
      const email = data.session?.user?.email?.toLowerCase();
      
      if (!data.session || !email || !ALLOWED_ADMINS.has(email)) {
        setIsAuthorized(false);
        setRows([]);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);

      const { data: requests, error } = await supabaseBrowser
        .from("join_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        showNotification(`خطأ أثناء جلب البيانات: ${error.message}`, "error");
        setRows([]);
      } else {
        setRows((requests ?? []) as JoinRequest[]);
      }
    } catch (err: any) {
      showNotification(`خطأ غير متوقع: ${err?.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    void verifyAuthAndLoad();
  }, [verifyAuthAndLoad]);

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

      // أداء مثالي: اقتطاع النص مباشرة بدلاً من استدعاء كلاس الـ Date الثقيل في كل لفة فحص
      const createdDate = r.created_at ? r.created_at.slice(0, 10) : "";
      if (fromDate && createdDate < fromDate) return false;
      if (toDate && createdDate > toDate) return false;

      if (!s) return true;

      const hay = [
        r.full_name,
        r.email,
        r.phone ?? "",
        r.national_id ?? "",
        formatGovernorate(r.city),
        r.address ?? "",
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

  const stats = useMemo(() => {
    const total = rows.length;
    let filteredCount = filtered.length;
    let newCount = 0, reviewCount = 0, contactedCount = 0, accepted = 0, rejected = 0;

    for (let i = 0; i < total; i++) {
      const currentStatus = getStatusValue(rows[i].admin_status);
      if (currentStatus === "new") newCount++;
      else if (currentStatus === "in_review") reviewCount++;
      else if (currentStatus === "contacted") contactedCount++;
      else if (currentStatus === "accepted") accepted++;
      else if (currentStatus === "rejected") rejected++;
    }

    return { total, filtered: filteredCount, newCount, reviewCount, contactedCount, accepted, rejected };
  }, [rows, filtered.length]);

  function openDetails(r: JoinRequest) {
    setSelected(r);
    setNotes(r.admin_notes ?? "");
    setOpen(true);
  }

  async function updateStatus(newStatus: string) {
    if (!selected) return;
    setSaving(true);

    const { error } = await supabaseBrowser
      .from("join_requests")
      .update({ admin_status: newStatus, admin_notes: notes })
      .eq("id", selected.id);

    if (error) {
      showNotification(`❌ فشل التحديث: ${error.message}`, "error");
    } else {
      // تعديل الحالة محلياً بشكل فوري ودون إعادة جلب 1000 سجل من السيرفر
      setRows(prev => prev.map(item => item.id === selected.id ? { ...item, admin_status: newStatus, admin_notes: notes } : item));
      setSelected(prev => prev ? { ...prev, admin_status: newStatus, admin_notes: notes } : null);
      setOpen(false);
      showNotification("✅ تم تحديث بيانات المتقدم وحالة الطلب بنجاح.", "success");
    }
    setSaving(false);
  }

  async function quickUpdateStatus(row: JoinRequest, newStatus: string) {
    setActionLoadingId(row.id);

    const { error } = await supabaseBrowser
      .from("join_requests")
      .update({ admin_status: newStatus })
      .eq("id", row.id);

    if (error) {
      showNotification(`❌ خطأ: ${error.message}`, "error");
    } else {
      // تعديل فوري محلي فائق السرعة
      setRows(prev => prev.map(item => item.id === row.id ? { ...item, admin_status: newStatus } : item));
      showNotification("✅ تم تحديث الحالة فورياً وعزل العملية بنجاح.", "success");
    }
    setActionLoadingId(null);
  }

  async function remove(id: string, name?: string) {
    const ok = confirm(`تنبيه حرج للغاية: هل أنت متأكد من حذف طلب الانضمام التابع لـ:\n\n[ ${name || "طلب بدون اسم"} ] ؟\n\nلا يمكن الرجوع عن هذا القرار نهائياً.`);
    if (!ok) return;

    setActionLoadingId(id);
    const { error } = await supabaseBrowser.from("join_requests").delete().eq("id", id);
    if (error) {
      showNotification(`❌ فشل الحذف: ${error.message}`, "error");
    } else {
      // التطهير المحلي الفوري للسجل
      setRows(prev => prev.filter(item => item.id !== id));
      showNotification("✅ تم حذف السجل بالكامل من قاعدة البيانات محلياً وعالمياً.", "success");
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
      ws["!dir"] = "rtl"; 
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

  // حارس البوابة الرئيسي والآمن بالكامل (Security Gate UI Rendering)
  if (isAuthorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center" dir="rtl">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/50 shadow-sm">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">وصول غير مصرح به!</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
          عذراً، هذا الحساب غير مخول لولوج لوحة الفرز المركزية. يرجى تسجيل الدخول بحساب الإدارة المعتمد لمبادرة SkillUp.
        </p>
      </div>
    );
  }

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
          <Button onClick={verifyAuthAndLoad} disabled={loading} variant="outline" className="h-10 rounded-xl gap-2 font-semibold border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث البيانات
          </Button>
          <Button onClick={exportExcel} disabled={loading || filtered.length === 0} className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl gap-2 font-semibold shadow-sm">
            <Download className="w-4 h-4" /> تصدير Excel
          </Button>
        </div>
      </div>

      {/* شريط التنبيهات الفورية المستقر */}
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
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{loading ? "..." : item.value}</span>
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
          
          {[
            { value: status, onChange: setStatus, options: [{ v: "all", t: "كل حالات الطلبات" }, { v: "new", t: "جديد" }, { v: "in_review", t: "قيد المراجعة" }, { v: "contacted", t: "تم التواصل" }, { v: "accepted", t: "مقبول" }, { v: "rejected", t: "مرفوض" }] },
            { value: sector, onChange: setSector, type: "sectors" },
            { value: city, onChange: setCity, type: "cities" }
          ].map((sel, idx) => (
            <select 
              key={idx}
              value={sel.value} 
              onChange={(e) => sel.onChange(e.target.value)} 
              className="h-11 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-200 px-3 outline-none focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-800 cursor-pointer transition"
            >
              {sel.options ? sel.options.map(o => <option key={o.v} value={o.v} className="dark:bg-zinc-950">{o.t}</option>) :
               sel.type === "sectors" ? (
                 <>
                   <option value="all" className="dark:bg-zinc-950">كل القطاعات الهيكلية</option>
                   {SECTORS.map((s: any) => <option key={s.slug} value={s.slug} className="dark:bg-zinc-950">{s.name_ar || s.ar || s.slug}</option>)}
                 </>
               ) : (
                 <>
                   <option value="all" className="dark:bg-zinc-950">كل المحافظات</option>
                   {cityOptions.map((c) => <option key={c} value={c} className="dark:bg-zinc-950">{formatGovernorate(c)}</option>)}
                 </>
               )}
            </select>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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

      {/* الجدول المركزي المستقر والآمن تماماً من الـ Event Bubbling */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-zinc-50/60 dark:bg-zinc-900/60 border-b dark:border-zinc-800 font-bold text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
          <span>جدول فرز طلبات المتقدمين المركزي</span>
          <span className="bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{filtered.length} طلب مطابق</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/40 dark:bg-zinc-900/40">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800">
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">الاسم الكامل</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">القطاع المستهدف</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">المحافظة</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">السن / النوع</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">صفة العضوية</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">رغبة قيادية</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">تاريخ التقديم</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">حالة الطلب</TableHead>
                <TableHead className="text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11 w-[70px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-zinc-400 font-medium">جاري معالجة وفرز السجلات برمجياً...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-zinc-400">لا توجد طلبات مطابقة للفلاتر الحالية.</TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors">
                    {/* هندسة عزل متقدمة: الاسم هو العنصر التفاعلي لفتح المودال مع أيقونة الرؤية لثبات الـ Click Map */}
                    <TableCell className="py-3">
                      <button 
                        onClick={() => openDetails(row)}
                        className="flex items-center gap-2 text-right font-bold text-zinc-900 dark:text-zinc-50 hover:text-emerald-600 dark:hover:text-emerald-400 group transition-colors focus:outline-none"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                        <span>{row.full_name}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                      {getSectorLabel(row.sector_key, "ar")}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {formatGovernorate(row.city)}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                      {row.age ? `${row.age} سنة` : "غير محدد"} / {getGenderText(row.national_id, row.gender)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {getMemberStatusLabel(row.member_status)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <span className={String(row.leadership_interest).toLowerCase() === "yes" || String(row.leadership_interest).toLowerCase() === "true" ? "text-amber-600 dark:text-amber-400 font-bold" : "text-zinc-400"}>
                        {getLeadershipInterestLabel(row.leadership_interest)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(row.admin_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs shadow-md">
                          <DropdownMenuLabel className="text-right text-[11px] text-zinc-400 dark:text-zinc-500 font-bold">إجراءات سريعة</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openDetails(row)} className="text-right font-medium gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-800">
                            <Eye className="w-3.5 h-3.5 text-zinc-400" /> عرض الملف بالكامل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="dark:border-zinc-800" />
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
                          <DropdownMenuSeparator className="dark:border-zinc-800" />
                          <DropdownMenuItem disabled={isBusy(row.id)} onClick={() => remove(row.id, row.full_name)} className="text-right font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> حذف السجل نهائياً
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* نافذة المودال لعرض الملف بالكامل للمتقدم مع حقل العنوان بالتفصيل */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 font-sans border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xl" dir="rtl">
          <DialogHeader className="text-right border-b pb-4 border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <span>تفاصيل طلب الانضمام الكاملة</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-1">
              مراجعة البيانات الشخصية، المهنية، والأكاديمية للمتقدم وإدارة حالة الطلب.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-6 mt-4">
              {/* البيانات الأساسية */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> البيانات الأساسية والشخصية
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الاسم الكامل:</span> <span className="font-semibold">{selected.full_name}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الرقم القومي:</span> <span className="font-mono font-semibold">{selected.national_id || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">البريد الإلكتروني:</span> <span className="font-mono">{selected.email}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">رقم الهاتف:</span> <span className="font-mono">{selected.phone || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">المحافظة:</span> <span>{formatGovernorate(selected.city)}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">السن:</span> <span>{selected.age ? `${selected.age} سنة` : "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">النوع:</span> <span className="font-medium text-zinc-900 dark:text-zinc-50">{getGenderText(selected.national_id, selected.gender)}</span></div>
                  
                  {/* عرض حقل العنوان المسترجع بالتفصيل */}
                  <div className="md:col-span-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200/50 flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-zinc-400 dark:text-zinc-500 font-medium text-xs block">العنوان بالتفصيل المعين بسجلات المبادرة:</span>
                      <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">{selected.address || "غير محدد بالتفصيل"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* الخلفية التعليمية */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <GraduationCap className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> الخلفية التعليمية والأكاديمية
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الحالة التعليمية:</span> <strong className="font-semibold">{EDUCATION_LABEL[selected.education ?? ""] || selected.education || "غير محدد"}</strong></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الجامعة / المعهد:</span> <span className="font-semibold">{selected.university || "غير محدد"}</span></div>
                  {selected.faculty && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الكلية:</span> <span className="font-semibold">{selected.faculty}</span></div>}
                  {selected.department && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">القسم / التخصص:</span> <span className="font-semibold">{selected.department}</span></div>}
                  {selected.grade && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الفرقة الدراسية:</span> <span className="font-semibold">{selected.grade}</span></div>}
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">سنة التخرج:</span> <span className="font-mono font-semibold">{selected.graduation_year || "غير محدد"}</span></div>
                </div>
              </div>

              {/* التفضيلات والقطاع المستهدف بالهيكلة */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <Briefcase className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> التفضيلات والقطاع المستهدف بالهيكلة
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">القطاع المختار:</span> <strong className="text-emerald-700 dark:text-emerald-400 font-black">{getSectorLabel(selected.sector_key, "ar")}</strong></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الدور أو المسؤولية المفضلة:</span> <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{selected.preferred_role || "غير محدد"}</strong></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">ساعات التفرغ المتاحة:</span> <span>{selected.availability || "غير محدد"}</span></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">صفة العضوية:</span> <strong className="text-blue-600 dark:text-blue-400 font-bold">{getMemberStatusLabel(selected.member_status)}</strong></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الرغبة في دور قيادي:</span> <strong className="text-amber-600 dark:text-amber-400 font-bold">{getLeadershipInterestLabel(selected.leadership_interest)}</strong></div>
                </div>
              </div>

              {/* المهارات والخبرات */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <FileText className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> المهارات والخبرات السابقة
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium block mb-1">المهارات والقدرات:</span> <p className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 whitespace-pre-wrap text-xs font-medium text-zinc-700 dark:text-zinc-300">{selected.skills || "لا يوجد"}</p></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium block mb-1"> الخبرات السابقة والأنشطة:</span> <p className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 whitespace-pre-wrap text-xs font-medium text-zinc-700 dark:text-zinc-300">{selected.experience || "لا يوجد"}</p></div>
                  {selected.message && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium block mb-1">رسالة المتقدم الموجهة للإدارة:</span> <p className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 whitespace-pre-wrap text-xs font-medium text-zinc-700 dark:text-zinc-300">{selected.message}</p></div>}
                </div>
              </div>

              {/* المرفقات والروابط */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <Link2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> الروابط والملفات المرفقة
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selected.linkedin && (
                    <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      🔗 حساب LinkedIn الخاص بالمتقدم
                    </a>
                  )}
                  {selected.facebook && (
                    <a href={selected.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 text-blue-800 dark:text-blue-300 hover:underline font-medium">
                      🔵 حساب Facebook الخاص بالمتقدم
                    </a>
                  )}
                  {selected.portfolio && (
                    <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 text-purple-600 dark:text-purple-400 hover:underline font-medium">
                      🎨 رابط معرض الأعمال Portfolio
                    </a>
                  )}
                  {selected.resume_url && (
                    <a href={selected.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                      📄 رابط السيرة الذاتية (CV Drive)
                    </a>
                  )}
                  {selected.profile_picture_url && (
                    <a href={selected.profile_picture_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:underline font-medium">
                      🖼️ عرض الصورة الشخصية للمتقدم
                    </a>
                  )}
                </div>
              </div>

              {/* الملاحظات واتخاذ القرار */}
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">ملاحظات لجنة الفرز والتقييم الداخلي:</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اكتب ملاحظاتك الإدارية هنا حول المتقدم للرجوع إليها لاحقاً..."
                    className="w-full min-h-[80px] p-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 text-zinc-800 dark:text-zinc-200 resize-y"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>الحالة الحالية:</span>
                    {getStatusBadge(selected.admin_status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs h-9 rounded-xl font-bold border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-950 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                      قيد المراجعة
                    </Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs h-9 rounded-xl font-bold text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 bg-white dark:bg-zinc-950 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                      تم التواصل
                    </Button>
                    <Button size="sm" variant="destructive" disabled={saving} onClick={() => updateStatus("rejected")} className="text-xs h-9 rounded-xl font-bold">
                      استبعاد / رفض
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs h-9 rounded-xl font-bold shadow-sm" disabled={saving} onClick={() => updateStatus("accepted")}>
                      قبول وتعيين المتقدم
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* التذييل */}
      <div className="border-t pt-5 border-zinc-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium gap-2">
        <div className="flex items-center gap-1">
          <span>نطاق حماية البيانات الإدارية مؤمن بالكامل. كود الفرز المركزي:</span>
          <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-400">SKILLUP-MEAL-MAIN</code>
        </div>
        <div>جميع الحقوق محفوظة لمبادرة SkillUp © {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}
