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
  Clock
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
        "الالكلية": cleanCell(r.faculty),
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
        "ملاحظات لجنة الفرز والتقييم": cleanCell(r.admin_notes),
        "تاريخ وساعة التقديم": formatDateTime(r.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
      ws["!dir"] = "rtl";

      ws["!cols"] = [
        { wch: 6 }, { wch: 28 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 18 },
        { wch: 8 }, { wch: 18 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, 
        { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 28 }, { wch: 40 }, { wch: 40 }, 
        { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 45 }, { wch: 18 }, { wch: 35 }, 
        { wch: 24 }
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

      {/* Stats Cards Section */}
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

      {/* Advanced Filters Card */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm grid gap-4">
        <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-bold text-sm border-b dark:border-zinc-800 pb-2.5">
          <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span>أدوات الفرز والتصفية المتقدمة</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم، الهاتف، الرقم القومي..." className="pr-9 h-11 rounded-xl text-xs font-medium border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-zinc-200 dark:focus-visible:ring-zinc-800" />
          </div>
          
          {/* Custom Select styling to ensure clear rendering in Dark Mode */}
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

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-zinc-50/60 dark:bg-zinc-900/60 border-b dark:border-zinc-800 font-bold text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
          <span>جدول فرز طلبات المتقدمين المركزي</span>
          <span className="bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md">{filtered.length} طلب مطابق</span>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/40 dark:bg-zinc-900/40">
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800">
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11 w-[200px]">الاسم الكامل</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">القطاع المستهدف</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">المحافظة</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">الحالة التعليمية</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">تاريخ التقديم</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11">الحالة</TableHead>
                <TableHead className="text-center text-xs font-bold text-zinc-500 dark:text-zinc-400 h-11 w-[80px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
                    <TableCell><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-32" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-24" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-16" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-20" /></TableCell>
                    <TableCell><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-28" /></TableCell>
                    <TableCell><div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded-md w-20" /></TableCell>
                    <TableCell><div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded w-8 mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-zinc-400 dark:text-zinc-500 font-medium text-xs">
                    <HelpCircle className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    لا توجد طلبات انضمام مطابقة لمعايير التصفية الحالية.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 border-b border-zinc-100/80 dark:border-zinc-800/80 transition duration-150">
                    <TableCell className="font-bold text-zinc-900 dark:text-zinc-100 text-xs py-3 max-w-[200px] truncate">
                      {row.full_name}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                      {getSectorLabel(row.sector_key, "ar")}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                      {formatGovernorate(row.city)}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {EDUCATION_LABEL[row.education ?? ""] || row.education || "غير محدد"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400 dark:text-zinc-500 font-medium font-mono" dir="ltr">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                    <TableCell className="py-2">
                      {getStatusBadge(row.admin_status)}
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <MoreVertical className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 font-sans rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs shadow-md">
                          <DropdownMenuLabel className="text-right text-[11px] text-zinc-400 dark:text-zinc-500 font-bold">إجراءات سريعة</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openDetails(row)} className="text-right font-medium gap-2 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-800">
                            <Eye className="w-3.5 h-3.5 text-zinc-400" /> عرض الملف بالكامل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator dark-border-zinc-800="true" />
                          {["in_review", "contacted", "accepted", "rejected"].map((st) => {
                            const colors: Record<string, string> = { in_review: "text-blue-600 dark:text-blue-400", contacted: "text-amber-600 dark:text-amber-400", accepted: "text-emerald-600 dark:text-emerald-400", rejected: "text-rose-600 dark:text-rose-400" };
                            return (
                              <DropdownMenuItem key={st} disabled={isBusy(row.id)} onClick={() => quickUpdateStatus(row, st)} className={`text-right font-medium cursor-pointer focus:bg-zinc-50 dark:focus:bg-zinc-800 ${colors[st]}`}>
                                تحديث: {STATUS_LABEL[st]}
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator dark-border-zinc-800="true" />
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

      {/* Comprehensive Full Details Overlay Dialog Sheet */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 font-sans border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xl" dir="rtl">
          <DialogHeader className="text-right border-b pb-4 border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>ملف المتقدم الكامل وبطاقة التقييم</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mt-1">
              مراجعة مدخلات استمارة الانضمام الرسمية وتعديل الحالة الإدارية للمتقدم.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="grid gap-6 py-4 text-xs">
              
              {/* Block 1: Basic Information */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> البيانات الشخصية الأساسية
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[{ t: "الاسم الكامل:", v: selected.full_name, b: true }, { t: "الرقم القومي (14 رقم):", v: selected.national_id, m: true }, { t: "البريد الإلكتروني:", v: selected.email, m: true }, { t: "رقم الهاتف:", v: selected.phone, m: true }, { t: "المحافظة / المدينة:", v: formatGovernorate(selected.city), b: true }, { t: "العمر والسن:", v: selected.age ? `${selected.age} عامًا` : null }].map((item, i) => (
                    <div key={i}><span className="text-zinc-400 dark:text-zinc-500 font-medium">{item.t}</span> <strong className={`text-zinc-900 dark:text-zinc-100 ${item.b ? "font-bold" : item.m ? "font-mono" : "font-semibold"}`}>{item.v || "غير مسجل"}</strong></div>
                  ))}
                </div>
              </div>

              {/* Block 2: Educational Background */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <GraduationCap className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> الخلفية الأكاديمية والتعليمية
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-900 dark:text-zinc-100 font-semibold">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الحالة التعليمية:</span> {EDUCATION_LABEL[selected.education ?? ""] || selected.education || "غير محدد"}</div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الجامعة / المعهد:</span> {selected.university || "غير محدد"}</div>
                  {selected.faculty && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الكلية:</span> {selected.faculty}</div>}
                  {selected.department && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">القسم / التخصص:</span> {selected.department}</div>}
                  {selected.grade && <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الفرقة الدراسية:</span> {selected.grade}</div>}
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">سنة التخرج:</span> <span className="font-mono">{selected.graduation_year || "غير محدد"}</span></div>
                </div>
              </div>

              {/* Block 3: Preferences & Requirements */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <Briefcase className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> التفضيلات والقطاع المستهدف بالهيكلة
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">القطاع المختار:</span> <strong className="text-emerald-700 dark:text-emerald-400 font-black">{getSectorLabel(selected.sector_key, "ar")}</strong></div>
                  <div><span className="text-zinc-400 dark:text-zinc-500 font-medium">الدور أو المسؤولية المفضلة:</span> <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{selected.preferred_role || "غير محدد"}</strong></div>
                  <div className="md:col-span-2"><span className="text-zinc-400 dark:text-zinc-500 font-medium">الوقت المتاح أسبوعياً وتفاصيل التفرغ:</span> <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{selected.availability || "غير محدد"}</strong></div>
                </div>
              </div>

              {/* Block 4: Skills & Previous Experiences */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <FileText className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> القدرات والخبرات العملية والأنشطة الطلابية
                </div>
                <div className="grid gap-2.5">
                  {[
                    { label: "المهارات والقدرات الأساسية:", val: selected.skills, none: "لم يتم إدخال مهارات" },
                    { label: "الخبرات والأنشطة السابقة بالتفصيل:", val: selected.experience, none: "لم يتم إدخال خبرات سابقة" },
                    { label: "لماذا ترغب في الانضمام إلى مبادرة SkillUp؟", val: selected.message, none: "لم تكتب رسالة" }
                  ].map((block, idx) => (
                    <div key={idx} className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                      <span className="text-zinc-400 dark:text-zinc-500 block font-medium mb-1">{block.label}</span>
                      <p className="text-zinc-900 dark:text-zinc-200 font-semibold whitespace-pre-wrap leading-relaxed">{block.val || block.none}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 5: Digital Profiles Links */}
              <div className="grid gap-3 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b dark:border-zinc-800 pb-1.5 text-xs">
                  <Link2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> الروابط الرقمية وملفات الأعمال
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-zinc-700 dark:text-zinc-300">
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
                      🖼️ رابط الصورة الشخصية المرفوعة
                    </a>
                  )}
                </div>
              </div>

              {/* Valuation Evaluation Form & Admin Decision Notes Input */}
              <div className="grid gap-3 border-t dark:border-zinc-800 pt-4">
                <label className="font-bold text-zinc-700 dark:text-zinc-300 text-xs block">
                  ملاحظات لجنة الفرز والتقييم الداخلي (تُحفظ داخل النظام):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب التقييم المبدئي، ملاحظات المقابلة، أو سبب القبول/الاستبعاد هنا..."
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 outline-none focus:border-zinc-300 dark:focus:border-zinc-600 focus:ring-4 focus:ring-zinc-50 dark:focus:ring-zinc-900/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-semibold leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Dialog Action Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4 border-zinc-100 dark:border-zinc-800 mt-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="text-xs h-9 rounded-xl font-bold order-last sm:order-first w-full sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              إغلاق النافذة
            </Button>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("in_review")} className="text-xs h-9 rounded-xl font-semibold text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 bg-white dark:bg-zinc-950 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                قيد المراجعة
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus("contacted")} className="text-xs h-9 rounded-xl font-semibold text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 bg-white dark:bg-zinc-950 hover:bg-amber-50 dark:hover:bg-amber-950/20">
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
        </DialogContent>
      </Dialog>

      {/* Footer System Info */}
      <div className="border-t pt-5 border-zinc-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium gap-2">
        <div className="flex items-center gap-1">
          <span>نطاق حماية البيانات الإدارية مؤمن بالكامل. كود الفرز المركزي:</span>
          <code className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700">SKILLUP-CORE-MEAL-v2</code>
        </div>
        <span>جميع الحقوق محفوظة لمبادرة SkillUp © {new Date().getFullYear()}</span>
      </div>

    </div>
  );
}
