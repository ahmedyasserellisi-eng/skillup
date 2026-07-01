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
  ShieldAlert,
  Compass,
  Info,
  Lock,
  Unlock
} from "lucide-react";

// قاموس حماية مركزي لضمان ترجمة كافة القطاعات للعربية حتى لو اختلف التكويد بالخلفية
const SECTORS_TRANSLATION_MAP: Record<string, string> = {
  "marketing-digital-media": "التسويق والإعلام الرقمي",
  "human-resources": "الموارد البشرية",
  "hr": "الموارد البشرية",
  "logistics-organization": "اللوجستيات والتنظيم",
  "logistics": "اللوجستيات والتنظيم",
  "public-relations-partnerships": "العلاقات العامة والشراكات",
  "pr": "العلاقات العامة والشراكات",
  "it-web-development": "تكنولوجيا المعلومات وتطوير المواقع",
  "it": "تكنولوجيا المعلومات وتطوير المواقع",
  "coaching-education": "التدريب والتعليم",
  "media-production-photography": "الإنتاج الإعلامي والتصوير"
};

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
  student: "طالب جامعي", graduate: "خريج", postgrad: "طالب دراسات عليا", school: "طالب ثانوي", other: "أخرى"
};

const STATUS_LABEL: Record<string, string> = {
  new: "جديد", in_review: "قيد المراجعة", contacted: "تم التواصل", accepted: "مقبول", rejected: "مرفوض"
};

function getSectorLabel(sectorKey: any): string {
  if (!sectorKey) return "غير محدد";
  const cleanKey = String(sectorKey).trim().toLowerCase();
  
  if (SECTORS_TRANSLATION_MAP[cleanKey]) {
    return SECTORS_TRANSLATION_MAP[cleanKey];
  }

  const sector = SECTORS.find((s: any) => 
    String(s.slug).toLowerCase() === cleanKey || String(s.id).toLowerCase() === cleanKey
  ) as any;

  if (sector) {
    return sector.name_ar || sector.ar || sector.name || cleanKey;
  }
  return cleanKey;
}

function getLeadershipInterestLabel(value: any): string {
  if (value === null || value === undefined) return "غير محدد";
  const str = String(value).trim().toLowerCase();
  if (str === "") return "غير محدد";
  if (str === "yes" || str === "true" || str === "نعم" || value === true) return "نعم";
  if (str === "no" || str === "false" || str === "لا" || value === false) return "لا";
  return str;
}

function getMemberStatusLabel(value: any): string {
  if (!value) return "غير محدد";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "member" || normalized === "عضو") return "عضو";
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
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md shadow-none pointer-events-none">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> مقبول
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md shadow-none pointer-events-none">
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> مرفوض
        </Badge>
      );
    case "contacted":
      return (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md shadow-none pointer-events-none">
          <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> تم التواصل
        </Badge>
      );
    case "in_review":
      return (
        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900 gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md shadow-none pointer-events-none">
          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> قيد المراجعة
        </Badge>
      );
    default:
      return (
        <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-300/60 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md shadow-none pointer-events-none">
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

// دالة لتعديل اللون الذهبي بناءً على الثيم المختار للهوية
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
  if (!/^\d{14}$/.test(cleanId)) return "غير محدد";
  const genderDigit = parseInt(cleanId.charAt(12), 10);
  return genderDigit % 2 === 0 ? "أنثى" : "ذكر";
}

function cleanCell(value: unknown) {
  return value ?? "";
}

export default function AdminJoinRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rows, setRows] = useState<JoinRequest[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "warning" | "">("");
  
  const [isFormOpen, setIsFormOpen] = useState<boolean>(true);
  const [togglingForm, setTogglingForm] = useState<boolean>(false);

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

      const { data: settingsData, error: settingsError } = await supabaseBrowser
        .from("site_settings")
        .select("value")
        .eq("key", "is_join_form_open")
        .single();

      if (!settingsError && settingsData) {
        setIsFormOpen(settingsData.value === "true" || settingsData.value === true);
      }

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

  async function toggleFormStatus() {
    setTogglingForm(true);
    const nextState = !isFormOpen;
    
    try {
      const { error } = await supabaseBrowser
        .from("site_settings")
        .update({ value: String(nextState) })
        .eq("key", "is_join_form_open");

      if (error) {
        showNotification(`❌ فشل تحديث حالة الاستمارة: ${error.message}`, "error");
      } else {
        setIsFormOpen(nextState);
        showNotification(
          nextState ? "🔓 تم فتح باب التسجيل واستقبل الطلبات بنجاح." : "🔒 تم إغلاق باب التسجيل ووقف استقبال الطلبات.", 
          "success"
        );
      }
    } catch (err: any) {
      showNotification(`❌ حدث خطأ غير متوقع: ${err?.message}`, "error");
    } finally {
      setTogglingForm(false);
    }
  }

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
        getSectorLabel(r.sector_key),
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
        "تاريخ وساعة التقديم": formatDateTime(r.created_at),
        "حالة الطلب الإدارية": STATUS_LABEL[getStatusValue(r.admin_status)] ?? getStatusValue(r.admin_status),
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
        "القسم / التخصص الداخلي": cleanCell(r.department),
        "الفرقة الدراسية": cleanCell(r.grade),
        "سنة التخرج": cleanCell(r.graduation_year),
        "القطاع المستهدف": getSectorLabel(r.sector_key),
        "الدور المفضل": cleanCell(r.preferred_role),
        "ساعات التفرغ": cleanCell(r.availability),
        "عرفت عنا من خلال": cleanCell(r.heard_about_us),
        "المهارات والقدرات": cleanCell(r.skills),
        "الخبرات السابقة والأنشطة": cleanCell(r.experience),
        "رابط LinkedIn": cleanCell(r.linkedin),
        "رابط Facebook": cleanCell(r.facebook),
        "رابط معرض الأعمال Portfolio": cleanCell(r.portfolio),
        "رسالة المتقدم": cleanCell(r.message),
        "ملاحظات لجنة الفرز والتقييم الداخلي": cleanCell(r.admin_notes)
      }));

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
      ws["!dir"] = "rtl"; 
      ws["!cols"] = [
        { wch: 6 }, { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 30 },
        { wch: 8 }, { wch: 18 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 16 },
        { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 28 }, { wch: 20 }, { wch: 40 },
        { wch: 40 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 45 }, { wch: 35 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "طلبات الانضمام الموحدة");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `SkillUp-Join-Requests-${dateStr}.xlsx`);
      
      showNotification("✅ تم إنشاء وتنزيل تقرير Excel بنجاح وتوحيد كافة البيانات بالعربية بالترتيب الجديد.", "success");
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
      
      {/* رأس الصفحة والإجراءات العامة المصممة بالهوية الرسمية */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#182b36] border border-[#C8A448]/30 rounded-xl text-[#C8A448] shadow-md shadow-zinc-900/10">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#182b36] dark:text-zinc-50">إدارة طلبات الانضمام</h1>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              عرض وفرز المتقدمين لمبادرة SkillUp بنظام فرز مركزي مؤمن. (مطابق: {stats.filtered} من أصل {stats.total})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          <Button 
            onClick={toggleFormStatus} 
            disabled={togglingForm || loading} 
            variant={isFormOpen ? "outline" : "destructive"}
            className={`h-10 rounded-xl gap-2 font-semibold transition-all ${
              isFormOpen 
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" 
                : "shadow-sm animate-pulse hover:animate-none"
            }`}
          >
            {isFormOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isFormOpen ? "الفورم: مفتوح استقبال الطلبات" : "الفورم: مغلق حالياً"}
          </Button>

          <Button onClick={verifyAuthAndLoad} disabled={loading} variant="outline" className="h-10 rounded-xl gap-2 font-semibold border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث البيانات
          </Button>
          <Button onClick={exportExcel} disabled={loading || filtered.length === 0} className="h-10 bg-[#182b36] border border-[#C8A448]/30 hover:bg-[#182b36]/90 text-[#C8A448] rounded-xl gap-2 font-bold shadow-sm">
            <Download className="w-4 h-4 text-[#C8A448]" /> تصدير Excel
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

      {/* أدوات الفرز والتصفية المتقدمة بالهوية المحدثة */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm grid gap-4">
        <div className="flex items-center gap-1.5 text-[#182b36] dark:text-[#C8A448] font-black text-sm border-b dark:border-zinc-800 pb-2.5">
          <Filter className="w-4 h-4 text-[#C8A448]" />
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

      {/* الجدول المركزي المنظم بالهوية البصرية والترتيب الجديد */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-[#182b36] border-b border-[#C8A448]/20 font-bold text-xs text-white flex items-center justify-between">
          <span>جدول فرز طلبات المتقدمين الموحد (اضغط على السطر لعرض الاستمارة كاملة)</span>
          <span className="bg-[#C8A448] text-[#182b36] px-2.5 py-1 rounded-md font-black">{filtered.length} طلب مطابق</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-900/80 border-b dark:border-zinc-800">
              <TableRow className="hover:bg-transparent">
                {/* تم تعديل الترتيب هنا لتصبح التواريخ والحالات في البداية تماماً كـ جوجل فورم */}
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">تاريخ وساعة التقديم</TableHead>
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">حالة الطلب الإدارية</TableHead>
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">الاسم الكامل</TableHead>
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">القطاع المستهدف</TableHead>
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">المحافظة</TableHead>
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">السن / النوع</TableHead>
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">صفة العضوية</TableHead>
                <TableHead className="text-right text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12">رغبة قيادية</TableHead>
                <TableHead className="text-center text-xs font-black text-[#182b36] dark:text-[#C8A448] h-12 w-[70px]">إجراءات</TableHead>
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
                  <TableRow 
                    key={row.id} 
                    onClick={() => openDetails(row)}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors cursor-pointer select-none border-b border-zinc-100 dark:border-zinc-800"
                  >
                    {/* 1. تاريخ ووقت التقديم */}
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono font-bold">
                      {formatDateTime(row.created_at)}
                    </TableCell>

                    {/* 2. حالة الطلب */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(row.admin_status)}
                    </TableCell>

                    {/* 3. الاسم الكامل */}
                    <TableCell className="py-3 font-bold text-zinc-900 dark:text-zinc-50">
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{row.full_name}</span>
                      </div>
                    </TableCell>

                    {/* 4. القطاع المستهدف */}
                    <TableCell className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {getSectorLabel(row.sector_key)}
                    </TableCell>

                    {/* 5. المحافظة */}
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {formatGovernorate(row.city)}
                    </TableCell>

                    {/* 6. السن / النوع */}
                    <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                      {row.age ? `${row.age} سنة` : "غير محدد"} / {getGenderText(row.national_id, row.gender)}
                    </TableCell>

                    {/* 7. صفة العضوية */}
                    <TableCell className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {getMemberStatusLabel(row.member_status)}
                    </TableCell>

                    {/* 8. رغبة قيادية */}
                    <TableCell className="text-xs font-bold">
                      <span className={getLeadershipInterestLabel(row.leadership_interest) === "نعم" ? "text-[#C8A448] font-black" : "text-zinc-400"}>
                        {getLeadershipInterestLabel(row.leadership_interest)}
                      </span>
                    </TableCell>

                    {/* 9. الإجراءات المنسدلة */}
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
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
                              <DropdownMenuItem key={st} disabled={isBusy(row.id)} onClick={() => quickUpdateStatus(row, st)} className={`text-right font-bold cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-800 ${colors[st]}`}>
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

      {/* نافذة عرض الملف التفصيلية المنظمة بأقسام واضحة وملونة بالهوية */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl p-0 font-sans border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-2xl block" dir="rtl">
          
          <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 p-5 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#182b36] border border-[#C8A448]/30 text-[#C8A448] rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-[#182b36] dark:text-zinc-50">
                  {selected?.full_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">
                  رقم طلب الانضمام المركزي الآلي: <span className="font-mono text-zinc-600 dark:text-zinc-400">{selected?.id?.slice(0, 8)}</span>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[11px] font-mono text-zinc-400 pl-2">{selected && formatDateTime(selected.created_at)}</span>
              {selected && getStatusBadge(selected.admin_status)}
            </div>
          </div>

          {selected && (
            <div className="p-6 space-y-6">
              
              {/* قسم البيانات الشخصية */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-white bg-[#182b36] px-3 py-2 rounded-xl border-r-4 border-[#C8A448] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#C8A448]" /> البيانات الشخصية والاتصال
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-0.5">الرقم القومي (14 رقم):</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-sm">{selected.national_id || "غير مسجل"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">رقم الهاتف:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-sm" dir="ltr">{selected.phone || "غير مسجل"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">البريد الإلكتروني:</span>
                    <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 break-all">{selected.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">المحافظة:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatGovernorate(selected.city)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">السن الحالي:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.age ? `${selected.age} عاماً` : "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">النوع:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{getGenderText(selected.national_id, selected.gender)}</span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-zinc-400 text-[11px] block font-medium">العنوان بالتفصيل المعين بسجلات المبادرة:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.address || "لم يتم تعيين عنوان تفصيلي"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* قسم الحالة الأكاديمية */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-white bg-[#182b36] px-3 py-2 rounded-xl border-r-4 border-[#C8A448] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#C8A448]" /> الحالة الأكاديمية والتعليمية
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-0.5">المستوى التعليمي الحالي:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{EDUCATION_LABEL[selected.education ?? ""] || selected.education || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">الجامعة / المعهد:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.university || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">الكلية:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.faculty || "غير محدد"}</span>
                  </div>
                  {selected.department && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">القسم / التخصص الداخلي:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.department}</span>
                    </div>
                  )}
                  {selected.grade && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">الفرقة الدراسية الحالية:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.grade}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-400 block mb-0.5">سنة التخرج المتوقعة/الفعلية:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{selected.graduation_year || "غير محدد"}</span>
                  </div>
                </div>
              </div>

              {/* قسم تفضيلات التعيين ورغبات الهيكلة */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-white bg-[#182b36] px-3 py-2 rounded-xl border-r-4 border-[#C8A448] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#C8A448]" /> تفضيلات التعيين ورغبات الهيكلة التابعة لمبادرة SkillUp
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div className="sm:col-span-2 md:col-span-1 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200/40 dark:border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5 font-medium">القطاع المستهدف والمختار:</span>
                    <span className="font-black text-[#C8A448] text-sm">{getSectorLabel(selected.sector_key)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">الدور أو المسؤولية المفضلة:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.preferred_role || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">عدد ساعات التفرغ المتاحة أسبوعياً:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.availability || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">صفة العضوية المطلوبة:</span>
                    <span className="font-black text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{getMemberStatusLabel(selected.member_status)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5">هل يمتلك المتقدم رغبة في دور قيادي؟</span>
                    <span className={`px-2 py-0.5 rounded-md font-black ${getLeadershipInterestLabel(selected.leadership_interest) === "نعم" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"}`}>
                      {getLeadershipInterestLabel(selected.leadership_interest)}
                    </span>
                  </div>
                  {selected.heard_about_us && (
                    <div>
                      <span className="text-zinc-400 block mb-0.5">قناة الوصول والتسويق للمبادرة:</span>
                      <span className="font-medium text-purple-700 dark:text-purple-400 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 shrink-0" /> {selected.heard_about_us}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* قسم المهارات والخبرات */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-white bg-[#182b36] px-3 py-2 rounded-xl border-r-4 border-[#C8A448] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8A448]" /> القدرات التقنية والتحليل السلوكي للخبرات
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 font-bold block mb-1">المهارات والأدوات والقدرات الشخصية:</span>
                    <p className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 whitespace-pre-wrap font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                      {selected.skills || "لا توجد مهارات مسجلة."}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-bold block mb-1">الخبرات السابقة والأنشطة التطوعية/العملية:</span>
                    <p className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 whitespace-pre-wrap font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                      {selected.experience || "لا توجد خبرات سابقة مسجلة."}
                    </p>
                  </div>
                  {selected.message && (
                    <div>
                      <span className="text-zinc-400 font-bold block mb-1">رسالة المتقدم الموجهة للجنة الفرز والتقييم:</span>
                      <p className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 whitespace-pre-wrap font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px]">
                        {selected.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* قسم المرفقات والروابط */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-white bg-[#182b36] px-3 py-2 rounded-xl border-r-4 border-[#C8A448] flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#C8A448]" /> المرفقات الرقمية والروابط الموثقة للملف الشخصي
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
                  {selected.resume_url ? (
                    <a href={selected.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50 rounded-xl border border-emerald-100 dark:border-emerald-900/40 transition">
                      📄 عرض السيرة الذاتية الرسمية للمتقدم (CV Drive)
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-zinc-50 text-zinc-400 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 pointer-events-none">
                      ⚠️ لم يقم المتقدم برفع ملف السيرة الذاتية
                    </div>
                  )}

                  {selected.portfolio && (
                    <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-purple-50 hover:bg-purple-100/70 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-950/50 rounded-xl border border-purple-100 dark:border-purple-900/40 transition">
                      🎨 رابط معرض الأعمال التخصصي Portfolio
                    </a>
                  )}
                  {selected.linkedin && (
                    <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100/70 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50 rounded-xl border border-blue-100 dark:border-blue-900/40 transition">
                      🔗 زيارة حساب المتقدم على شبكة LinkedIn
                    </a>
                  )}
                  {selected.facebook && (
                    <a href={selected.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/60 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 transition">
                      🔵 زيارة الملف الشخصي على منصة Facebook
                    </a>
                  )}
                  {selected.profile_picture_url && (
                    <a href={selected.profile_picture_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50 rounded-xl border border-amber-100 dark:border-amber-900/40 transition sm:col-span-2">
                      🖼️ فتح وعرض الصورة الشخصية الرسمية المرفقة (Google Drive)
                    </a>
                  )}
                </div>
              </div>

              {/* اتخاذ القرار الإداري والملاحظات */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-800 p-5 shadow-md space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Info className="w-4 h-4 text-zinc-400" /> ملاحظات لجنة المتابعة والتقييم الداخلي (MEAL):
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اكتب ملاحظات التقييم، التقييم السلوكي، المقابلة أو أسباب الاستبعاد هنا للرجوع إليها لاحقاً برمجياً..."
                    className="w-full min-h-[100px] p-3 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 text-zinc-800 dark:text-zinc-200 resize-y font-medium leading-relaxed"
                  />
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-3 border-t dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 font-bold flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border dark:border-zinc-800 w-full md:w-auto">
                    <span>حالة الطلب الإدارية الحالية:</span>
                    {getStatusBadge(selected.admin_status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs h-9 rounded-xl font-bold border-blue-200 text-blue-600 bg-white dark:bg-zinc-950 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                      قيد المراجعة
                    </Button>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs h-9 rounded-xl font-bold text-amber-600 border-amber-200 bg-white dark:bg-zinc-950 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                      تم التواصل
                    </Button>
                    <Button size="sm" variant="destructive" disabled={saving} onClick={() => updateStatus("rejected")} className="text-xs h-9 rounded-xl font-bold px-4">
                      استبعاد الطلب
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs h-9 rounded-xl font-bold shadow-md px-5" disabled={saving} onClick={() => updateStatus("accepted")}>
                      قبول وتعيين المتطوع
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
