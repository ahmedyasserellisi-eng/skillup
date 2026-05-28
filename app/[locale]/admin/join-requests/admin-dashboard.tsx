"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Download, ExternalLink, CheckCircle, XCircle, 
  Clock, Award, Users, ChevronLeft, ChevronRight, RefreshCw, 
  FileText, ShieldAlert, Check, X, MapPin, Briefcase, GraduationCap,
  Calendar, User, Mail, Phone, Hash, BookOpen, Activity, Heart, 
  MessageSquare, Image, Link, BarChart3, UserCheck, HelpCircle, Laptop, Mobile
} from 'lucide-react';

// --- 1. خرائط الترجمة والتوحيد الرسمية لكافة الحقول الـ 27 ---
const SECTOR_MAPPING: Record<string, { ar: string; en: string }> = {
  "marketing-digital-media": { ar: "التسويق والإعلام الرقمي", en: "Marketing & Digital Media" },
  "human-resources": { ar: "إدارة الموارد البشرية", en: "Human Resources Management" },
  "strategic-planning": { ar: "التخطيط الاستراتيجي", en: "Strategic Planning" },
  "sustainable-development": { ar: "التنمية المستدامة", en: "Sustainable Development" },
  "logistics-organization": { ar: "التنظيم واللوجيستيات", en: "Logistics & Organization" },
  "entertainment-culture": { ar: "الترفيه والثقافة", en: "Entertainment & Culture" },
  "training-development": { ar: "التدريب والتطوير المهني", en: "Training & Professional Development" }
};

const CITY_MAPPING: Record<string, string> = {
  "Cairo": "القاهرة", "Giza": "الجيزة", "Alexandria": "الإسكندرية",
  "Dakahlia": "الدقهلية", "Red Sea": "البحر الأحمر", "Beheira": "البحيرة",
  "Fayoum": "الفيوم", "Gharbia": "الغربية", "Ismailia": "الإسماعيلية",
  "Monufia": "المنوفية", "Minya": "المنيا", "Qalyubia": "القليوبية",
  "New Valley": "الوادي الجديد", "Suez": "السويس", "Sharqia": "الشرقية",
  "Aswan": "أسوان", "Asyut": "أسيوط", "Beni Suef": "بني سويف",
  "Port Said": "بورسعيد", "Damietta": "دمياط", "South Sinai": "جنوب سيناء",
  "Kafr El Sheikh": "كفر الشيخ", "Matrouh": "مطروح", "Luxor": "الأقصر",
  "Qena": "قنا", "North Sinai": "شمال سيناء", "Sohag": "سوهاج"
};

const EDUCATION_MAPPING: Record<string, string> = {
  "student": "طالب جامعي",
  "graduate": "خريج",
  "postgrad": "طالب دراسات عليا",
  "school": "طالب ثانوي"
};

const GRADE_MAPPING: Record<string, string> = {
  "1": "الفرقة الأولى",
  "2": "الفرقة الثانية",
  "3": "الفرقة الثالثة",
  "4": "الفرقة الرابعة",
  "5": "الفرقة الخامسة",
  "6": "الفرقة السادسة",
  "graduated": "خريج بالفعل"
};

const MEMBER_STATUS_MAPPING: Record<string, string> = {
  "member": "عضو",
  "expert": "خبير (لديه خبرة كبيرة)"
};

const LEADERSHIP_MAPPING: Record<string, string> = {
  "ready": "أرغب وجاهز لتولي مسؤولية قيادية",
  "learning": "يؤهل نفسه للمسؤولية"
};

const HEARD_MAPPING: Record<string, string> = {
  "facebook": "فيسبوك",
  "linkedin": "لينكد إن",
  "friend": "ترشيح من صديق",
  "university": "الجامعة",
  "other": "أخرى"
};

const safeLink = (url: string | null | undefined): string => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "#") return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

export interface RequestData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  national_id: string;
  city: string;
  age: number;
  member_status: string;
  leadership_interest: string;
  education: string;
  grade: string;
  university: string;
  faculty: string;
  department: string;
  postgrad_info: string | null;
  graduation_year: number;
  profile_picture_url: string;
  sector_key: string;
  preferred_role: string;
  availability: string;
  heard_about_us: string;
  skills: string;
  experience: string;
  linkedin: string | null;
  facebook: string | null;
  portfolio: string | null;
  resume_url: string | null;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface DashboardProps {
  initialData: RequestData[];
  onStatusUpdate: (id: string, newStatus: 'accepted' | 'rejected') => Promise<boolean>;
  onRefreshData: () => Promise<void>;
}

export default function CompleteAdminDashboard({ initialData, onStatusUpdate, onRefreshData }: DashboardProps) {
  const [requests, setRequests] = useState<RequestData[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [eduFilter, setEduFilter] = useState('all');
  const [leadershipFilter, setLeadershipFilter] = useState('all');
  const [selected, setSelected] = useState<RequestData | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // مثالي للعرض المزدوج

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setRequests(initialData);
  }, [initialData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
      setNotification({ message: "تم مزامنة وتحديث البيانات بنجاح من قاعدة البيانات الرئيسية", type: 'success' });
    } catch (err) {
      setNotification({ message: "فشل تحديث البيانات، يرجى فحص الاتصال وقاعدة البيانات", type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'accepted' | 'rejected') => {
    setActionLoadingId(id);
    try {
      const success = await onStatusUpdate(id, newStatus);
      if (success) {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
        if (selected && selected.id === id) {
          setSelected(prev => prev ? { ...prev, status: newStatus } : null);
        }
        setNotification({ 
          message: `تم تسجيل تعديل الطلب إلى [${newStatus === 'accepted' ? 'مقبول' : 'مستبعد'}] وتحديث السجلات الفورية.`, 
          type: 'success' 
        });
      } else {
        throw new Error();
      }
    } catch (err) {
      setNotification({ message: "حدث خطأ غير متوقع أثناء تحديث الحالة برمجياً في السيرفر", type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const s = search.toLowerCase().trim();
      const matchesSearch = !s || 
        (r.full_name?.toLowerCase() ?? "").includes(s) ||
        (r.email?.toLowerCase() ?? "").includes(s) ||
        (r.phone ?? "").includes(s) ||
        (r.national_id ?? "").includes(s) ||
        (r.faculty ?? "").toLowerCase().includes(s) ||
        (r.university ?? "").toLowerCase().includes(s) ||
        (r.skills ?? "").toLowerCase().includes(s) ||
        (r.preferred_role ?? "").toLowerCase().includes(s) ||
        (r.department ?? "").toLowerCase().includes(s);

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSector = sectorFilter === 'all' || r.sector_key === sectorFilter;
      const matchesCity = cityFilter === 'all' || r.city === cityFilter;
      const matchesEdu = eduFilter === 'all' || r.education === eduFilter;
      const matchesLeadership = leadershipFilter === 'all' || r.leadership_interest === leadershipFilter;

      return matchesSearch && matchesStatus && matchesSector && matchesCity && matchesEdu && matchesLeadership;
    });
  }, [requests, search, statusFilter, sectorFilter, cityFilter, eduFilter, leadershipFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sectorFilter, cityFilter, eduFilter, leadershipFilter]);

  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => r.status === 'pending').length;
    const accepted = filteredRequests.filter(r => r.status === 'accepted').length;
    const rejected = filteredRequests.filter(r => r.status === 'rejected').length;
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';
    const ageSum = filteredRequests.reduce((sum, r) => sum + (Number(r.age) || 0), 0);
    const avgAge = total > 0 ? (ageSum / total).toFixed(1) : '0';

    const facultyCounts: Record<string, number> = {};
    filteredRequests.forEach(r => { if (r.faculty) facultyCounts[r.faculty] = (facultyCounts[r.faculty] || 0) + 1; });
    const topFaculty = Object.entries(facultyCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

    const cityCounts: Record<string, number> = {};
    filteredRequests.forEach(r => { if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1; });
    const topCityRaw = Object.entries(cityCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || '';
    const topCity = CITY_MAPPING[topCityRaw] || topCityRaw || 'لا يوجد';

    return { total, pending, accepted, rejected, acceptanceRate, avgAge, topFaculty, topCity };
  }, [filteredRequests]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const exportToCSV = () => {
    const headers = [
      "الاسم بالكامل", "الرقم القومي", "رقم الهاتف", "البريد الإلكتروني", "المحافظة", "العمر",
      "صفة العضوية", "الرغبة في القيادة", "الحالة التعليمية", "الفرقة الدراسية", "الجامعة",
      "الكلية", "القسم", "بيانات الدراسات العليا", "سنة التخرج", "رابط الصورة الشخصية",
      "القطاع الفني", "الدور المفضل", "الوقت المتاح أسبوعيا", "كيف سمعت عنا", "المهارات",
      "الخبرات السابقة", "حساب لينكد إن", "حساب فيسبوك", "معرض الأعمال", "رابط السيرة الذاتية",
      "رسالة الانضمام", "حالة الطلب الإدارية", "تاريخ التقديم"
    ];
    const rows = filteredRequests.map(r => [
      `"${r.full_name?.replace(/"/g, '""') ?? ""}"`,
      `'${r.national_id ?? ""}`,
      `'${r.phone ?? ""}`,
      `"${r.email?.replace(/"/g, '""') ?? ""}"`,
      `"${CITY_MAPPING[r.city] || r.city || ""}"`,
      `"${r.age ?? ""}"`,
      `"${MEMBER_STATUS_MAPPING[r.member_status] || r.member_status || ""}"`,
      `"${LEADERSHIP_MAPPING[r.leadership_interest] || r.leadership_interest || ""}"`,
      `"${EDUCATION_MAPPING[r.education] || r.education || ""}"`,
      `"${GRADE_MAPPING[r.grade] || r.grade || ""}"`,
      `"${r.university?.replace(/"/g, '""') ?? ""}"`,
      `"${r.faculty?.replace(/"/g, '""') ?? ""}"`,
      `"${r.department?.replace(/"/g, '""') ?? ""}"`,
      `"${r.postgrad_info?.replace(/"/g, '""') ?? ""}"`,
      `"${r.graduation_year ?? ""}"`,
      `"${r.profile_picture_url ?? ""}"`,
      `"${SECTOR_MAPPING[r.sector_key]?.ar ?? r.sector_key ?? ""}"`,
      `"${r.preferred_role?.replace(/"/g, '""') ?? ""}"`,
      `"${r.availability?.replace(/"/g, '""') ?? ""}"`,
      `"${HEARD_MAPPING[r.heard_about_us] || r.heard_about_us || ""}"`,
      `"${r.skills?.replace(/"/g, '""') ?? ""}"`,
      `"${r.experience?.replace(/"/g, '""') ?? ""}"`,
      `"${r.linkedin ?? ""}"`,
      `"${r.facebook ?? ""}"`,
      `"${r.portfolio ?? ""}"`,
      `"${r.resume_url ?? ""}"`,
      `"${r.message?.replace(/"/g, '""') ?? ""}"`,
      `"${r.status ?? ""}"`,
      `"${r.created_at ?? ""}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SkillUp_MEAL_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 sm:p-6 bg-zinc-950/5 min-h-screen text-right font-sans antialiased" dir="rtl">
      
      {/* التنبيهات الذكية */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 sm:right-auto z-50 p-4 rounded-2xl shadow-xl border text-xs sm:text-sm font-bold backdrop-blur-md transition-all flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* الهيدر الرئيسي - تدرج شبابي عصري */}
      <div className="relative overflow-hidden mb-6 bg-gradient-to-br from-zinc-900 via-zinc-800 to-indigo-950 text-white p-6 rounded-3xl shadow-lg border border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">Admin Hub</span>
              <span className="text-zinc-400 text-xs">v2.0 Responsive</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight mt-1 bg-clip-text text-transparent bg-gradient-to-l from-white via-zinc-100 to-indigo-200">
              منظومة المتابعة والجدولة الذكية 🛡️
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-xl font-medium">
              الإدارة المركزية لقطاع المتابعة والتقييم (MEAL) | مبادرة SkillUp للتخطيط الاستراتيجي.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center backdrop-blur-sm shadow-inner"
              title="تحديث فوري"
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin text-indigo-400" : "text-zinc-300"} />
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-750 text-white px-5 py-3 rounded-2xl transition-all transform active:scale-95 text-xs sm:text-sm font-bold flex-1 md:flex-none shadow-md shadow-indigo-500/20"
            >
              <Download size={16} />
              <span>تصدير إكسيل</span>
            </button>
          </div>
        </div>
      </div>

      {/* العدادات الإحصائية - شبكة مرنة متجاوبة من حقل واحد في الهاتف إلى 4 في الشاشات الكبيرة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between transition-all hover:shadow-md">
          <div><p className="text-[10px] sm:text-xs text-zinc-400 font-bold">إجمالي الطلبات</p><h3 className="text-lg sm:text-2xl font-black text-zinc-800 mt-0.5">{stats.total}</h3></div>
          <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Users size={18}/></div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between transition-all hover:shadow-md">
          <div><p className="text-[10px] sm:text-xs text-zinc-400 font-bold">قيد الانتظار</p><h3 className="text-lg sm:text-2xl font-black text-amber-500 mt-0.5">{stats.pending}</h3></div>
          <div className="p-2 bg-amber-50 text-amber-500 rounded-xl"><Clock size={18}/></div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between transition-all hover:shadow-md">
          <div><p className="text-[10px] sm:text-xs text-zinc-400 font-bold">المقبولين</p><h3 className="text-lg sm:text-2xl font-black text-emerald-500 mt-0.5">{stats.accepted}</h3></div>
          <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><CheckCircle size={18}/></div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between transition-all hover:shadow-md">
          <div><p className="text-[10px] sm:text-xs text-zinc-400 font-bold">المستبعدين</p><h3 className="text-lg sm:text-2xl font-black text-rose-500 mt-0.5">{stats.rejected}</h3></div>
          <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><XCircle size={18}/></div>
        </div>
      </div>

      {/* تفاصيل إضافية ميكروسكوبية لـ MEAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900 text-zinc-100 p-3 rounded-2xl flex items-center gap-3 border border-zinc-800">
          <div className="p-1.5 bg-zinc-800 rounded-lg text-indigo-400"><Award size={14}/></div>
          <div className="truncate"><p className="text-[10px] text-zinc-400 font-medium">معدل القبول</p><p className="text-xs font-bold">{stats.acceptanceRate}%</p></div>
        </div>
        <div className="bg-zinc-900 text-zinc-100 p-3 rounded-2xl flex items-center gap-3 border border-zinc-800">
          <div className="p-1.5 bg-zinc-800 rounded-lg text-orange-400"><BarChart3 size={14}/></div>
          <div className="truncate"><p className="text-[10px] text-zinc-400 font-medium">متوسط الأعمار</p><p className="text-xs font-bold">{stats.avgAge} عام</p></div>
        </div>
        <div className="bg-zinc-900 text-zinc-100 p-3 rounded-2xl flex items-center gap-3 border border-zinc-800">
          <div className="p-1.5 bg-zinc-800 rounded-lg text-purple-400"><GraduationCap size={14}/></div>
          <div className="truncate"><p className="text-[10px] text-zinc-400 font-medium">الأعلى إقبالاً</p><p className="text-xs font-bold truncate">{stats.topFaculty}</p></div>
        </div>
        <div className="bg-zinc-900 text-zinc-100 p-3 rounded-2xl flex items-center gap-3 border border-zinc-800">
          <div className="p-1.5 bg-zinc-800 rounded-lg text-teal-400"><MapPin size={14}/></div>
          <div className="truncate"><p className="text-[10px] text-zinc-400 font-medium">المحافظة الأكثر نشاطاً</p><p className="text-xs font-bold truncate">{stats.topCity}</p></div>
        </div>
      </div>

      {/* لوحة البحث والفلترة الذكية المتقدمة */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-zinc-100 flex flex-col gap-3 mb-6">
        <div className="relative w-full">
          <Search className="absolute right-4 top-3.5 text-zinc-400" size={16} />
          <input 
            type="text" 
            placeholder="بحث ذكي شامل (بالاسم، المحافظة، الهاتف، الكلية، أو المهارات الفنية)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 focus:border-zinc-400 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-zinc-100 font-medium transition-all"
          />
        </div>
        
        {/* فلاتر سريعة بنظام التمرير الأفقي في الموبايل لعدم تشويه الواجهة */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 shrink-0">
            <Filter size={12} className="text-zinc-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-[11px] font-bold bg-transparent focus:outline-none text-zinc-700 cursor-pointer">
              <option value="all">كل الحالات الإدارية</option>
              <option value="pending">قيد الانتظار</option>
              <option value="accepted">المقبولين</option>
              <option value="rejected">المستبعدين</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 shrink-0">
            <Briefcase size={12} className="text-zinc-400" />
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="text-[11px] font-bold bg-transparent focus:outline-none text-zinc-700 cursor-pointer max-w-[150px]">
              <option value="all">كل القطاعات</option>
              {Object.entries(SECTOR_MAPPING).map(([key, val]) => (
                <option key={key} value={key}>{val.ar}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 shrink-0">
            <MapPin size={12} className="text-zinc-400" />
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="text-[11px] font-bold bg-transparent focus:outline-none text-zinc-700 cursor-pointer">
              <option value="all">كل المحافظات</option>
              {Object.entries(CITY_MAPPING).map(([k,v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 shrink-0">
            <GraduationCap size={12} className="text-zinc-400" />
            <select value={eduFilter} onChange={(e) => setEduFilter(e.target.value)} className="text-[11px] font-bold bg-transparent focus:outline-none text-zinc-700 cursor-pointer">
              <option value="all">الكل التعليمي</option>
              {Object.entries(EDUCATION_MAPPING).map(([k,v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- عرض الموبايل الذكي: يظهر فقط على الهواتف والشاشات الصغيرة --- */}
      <div className="block md:hidden space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span className="flex items-center gap-1"><Mobile size={12}/> عرض بطاقات الهواتف الذكية</span>
          <span>{filteredRequests.length} طلب متاح</span>
        </div>
        {paginatedRequests.length === 0 ? (
          <div className="bg-white text-center py-12 rounded-3xl border border-zinc-100 text-zinc-400 text-xs">لا توجد طلبات تطابق فلاتر البحث الحالية.</div>
        ) : (
          paginatedRequests.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-200 to-indigo-100 flex items-center justify-center font-bold text-zinc-700 text-xs overflow-hidden">
                    {req.profile_picture_url ? (
                      <img src={req.profile_picture_url} alt="" className="w-full h-full object-cover"/>
                    ) : <User size={14}/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-xs">{req.full_name}</h4>
                    <p className="text-[10px] text-zinc-400 font-medium">{CITY_MAPPING[req.city] || req.city} • {req.age} عام</p>
                  </div>
                </div>
                
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  req.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  req.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                  'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {req.status === 'accepted' ? 'مقبول' : req.status === 'rejected' ? 'مستبعد' : 'معلق'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                <div>
                  <span className="text-zinc-400 block font-medium">القطاع الفني:</span>
                  <span className="font-bold text-zinc-700 truncate block">{SECTOR_MAPPING[req.sector_key]?.ar || req.sector_key}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block font-medium">الدور المفضل:</span>
                  <span className="font-bold text-indigo-600 truncate block">{req.preferred_role || "غير محدد"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setSelected(req)}
                  className="text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <FileText size={12}/>
                  فحص وتعديل الحالة
                </button>
                <span className="text-[9px] text-zinc-400 font-mono">{new Date(req.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- عرض الكمبيوتر المتقدم: يظهر فقط على شاشات المكتوب واللاب توب --- */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-3 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1"><Laptop size={12}/> جدول العرض المتقدم للكمبيوتر</span>
          <span>إجمالي السجلات المفهرسة: {filteredRequests.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 text-[11px] font-bold tracking-wide">
                <th className="p-3">بيانات المتقدم الأساسية</th>
                <th className="p-3">الخلفية الأكاديمية</th>
                <th className="p-3">الموقع والسن</th>
                <th className="p-3">القطاع المستهدف</th>
                <th className="p-3">الدور المفضل</th>
                <th className="p-3">الحالة الإدارية</th>
                <th className="p-3 text-center">إجراءات المراجعة</th>
              </tr>
            </thead>
            <tbody className="text-xs text-zinc-700 divide-y divide-zinc-100">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-400">لا توجد طلبات تطابق المعايير.</td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50/30 transition duration-150 group">
                    <td className="p-3">
                      <div className="font-bold text-zinc-900 text-xs sm:text-sm">{req.full_name}</div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{req.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-zinc-800">{req.faculty}</div>
                      <div className="text-[10px] text-zinc-400 font-medium">{req.university || "جامعة غير مسجلة"}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-zinc-800">{CITY_MAPPING[req.city] || req.city}</div>
                      <div className="text-[10px] text-zinc-400 font-bold font-mono">{req.age} عام</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] border border-indigo-100">
                        {SECTOR_MAPPING[req.sector_key]?.ar || req.sector_key}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-purple-700 max-w-[120px] truncate" title={req.preferred_role || ""}>{req.preferred_role}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        req.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${req.status === 'accepted' ? 'bg-emerald-500' : req.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {req.status === 'accepted' ? 'مقبول' : req.status === 'rejected' ? 'مستبعد' : 'قيد الانتظار'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelected(req)}
                        className="opacity-90 group-hover:opacity-100 bg-zinc-950 text-white text-[10px] font-black px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition shadow-sm active:scale-95"
                      >
                        فتح الملف الكامل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* شريط التحكم في الصفحات (Pagination Controls) متجاوب بالكامل */}
      <div className="mt-4 p-3 sm:p-4 bg-white rounded-2xl border border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-bold text-zinc-400 shadow-sm">
        <div className="text-center sm:text-right">
          عرض {Math.min(filteredRequests.length, (currentPage - 1) * itemsPerPage + 1)} إلى{" "}
          {Math.min(filteredRequests.length, currentPage * itemsPerPage)} من أصل{" "}
          <span className="text-zinc-800 font-black">{filteredRequests.length}</span> طلب.
        </div>
        
        <div className="flex items-center gap-2" dir="ltr">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1} 
            className="p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-3 py-1 bg-zinc-50 rounded-lg text-zinc-700 font-mono text-[10px]">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages} 
            className="p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* --- نافذة الفحص الشاملة والعميقة (Inspection Window Mode) --- */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[90vh] sm:h-[85vh] rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden border border-zinc-100 flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* رأس النافذة المنبثقة التفصيلي */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white flex justify-between items-center border-b border-zinc-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 p-0.5 border border-white/20 overflow-hidden shrink-0">
                  {selected.profile_picture_url ? (
                    <img src={selected.profile_picture_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : <User className="w-full h-full p-2 text-zinc-400" />}
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-black tracking-tight">{selected.full_name}</h2>
                  <p className="text-[10px] text-zinc-400 font-medium">معاينة الطلب المركزي الموحد ورقمه المعين</p>
                </div>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition text-zinc-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* جسم البيانات المتكامل الـ 27 حقل بالكامل مقسم لـ 4 أقسام احترافية */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-right flex-1 scrollbar-thin">
              
              {/* الموقف الإداري الحالي */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-bold">الحالة القانونية الحالية للطلب بالنظام:</span>
                <span className={`px-3 py-1 rounded-full font-black text-[10px] ${
                  selected.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                  selected.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selected.status === 'accepted' ? 'مقبول ومعتمد' : selected.status === 'rejected' ? 'مستبعد من السجلات' : 'قيد الفحص والمراجعة حالياً'}
                </span>
              </div>

              {/* القسم الأول: البيانات الشخصية والأساسية */}
              <div>
                <h3 className="text-xs font-black text-indigo-600 mb-2 flex items-center gap-1.5">
                  <User size={14}/> البيانات الشخصية والرقمية الأساسية
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">الرقم القومي للتحقق الإداري:</p>
                    <p className="text-xs font-mono font-bold text-zinc-800 mt-0.5">{selected.national_id}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">البريد الإلكتروني للاتصال:</p>
                    <p className="text-xs font-mono font-bold text-zinc-800 mt-0.5 break-all select-all">{selected.email}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">رقم الهاتف (الواتساب المعتمد):</p>
                    <p className="text-xs font-mono font-bold text-zinc-800 mt-0.5 select-all">{selected.phone}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">محافظة الإقامة الحالية والسن:</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{CITY_MAPPING[selected.city] || selected.city} ({selected.age} عام)</p>
                  </div>
                </div>
              </div>

              {/* القسم الثاني: المسار التعليمي والأكاديمي التخصصي */}
              <div>
                <h3 className="text-xs font-black text-violet-600 mb-2 flex items-center gap-1.5">
                  <GraduationCap size={14}/> الخلفية التعليمية والمستوى الأكاديمي
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">الحالة الأكاديمية والفرقة الدراسية:</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{EDUCATION_MAPPING[selected.education] || selected.education} • {GRADE_MAPPING[selected.grade] || selected.grade}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">الجامعة والمعهد التعليمي والمؤسسة:</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{selected.university}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">الكلية والمسار العلمي المدرج:</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{selected.faculty}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">التخصص الدقيق وسنة التخرج المحددة:</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{selected.department} ({selected.graduation_year})</p>
                  </div>
                </div>
                {selected.postgrad_info && (
                  <div className="mt-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 text-xs">
                    <span className="text-zinc-400 text-[10px] block">بيانات إضافية عن الدراسات العليا:</span>
                    <span className="font-medium text-zinc-800">{selected.postgrad_info}</span>
                  </div>
                )}
              </div>

              {/* القسم الثالث: الرغبات التطوعية وتفضيلات القيد */}
              <div>
                <h3 className="text-xs font-black text-amber-600 mb-2 flex items-center gap-1.5">
                  <Briefcase size={14}/> الرغبات التخصصية وتفضيلات القيد بالمنظومة
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">القطاع الفني المطلوب بالطلب:</p>
                    <p className="text-xs font-black text-indigo-600 mt-0.5">{SECTOR_MAPPING[selected.sector_key]?.ar || selected.sector_key}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">الدور والمسمى الوظيفي المفضل:</p>
                    <p className="text-xs font-bold text-purple-700 mt-0.5">{selected.preferred_role}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">رتبة القيد وهل يطمح لقيادة تخصصية:</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{MEMBER_STATUS_MAPPING[selected.member_status] || selected.member_status} • {LEADERSHIP_MAPPING[selected.leadership_interest] || selected.leadership_interest}</p>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400">ساعات التفرغ وكيف سمع عنا:</p>
                    <p className="text-xs font-bold text-zinc-800 mt-0.5">{selected.availability} أسبوعياً ({HEARD_MAPPING[selected.heard_about_us] || selected.heard_about_us})</p>
                  </div>
                </div>
              </div>

              {/* المنصات والروابط - أزرار لمس كبيرة وسهلة للموبايل والكمبيوتر */}
              <div>
                <h3 className="text-xs font-black text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Link size={14}/> المنصات والمستندات الرقمية المرفقة
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a href={safeLink(selected.facebook)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 border border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition text-xs font-bold">
                    <span>حساب فيسبوك</span> <ExternalLink size={12} className="text-zinc-400" />
                  </a>
                  <a href={safeLink(selected.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 border border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition text-xs font-bold">
                    <span>حساب لينكد إن</span> <ExternalLink size={12} className="text-zinc-400" />
                  </a>
                  <a href={safeLink(selected.portfolio)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 border border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition text-xs font-bold">
                    <span>معرض الأعمال</span> <ExternalLink size={12} className="text-zinc-400" />
                  </a>
                  <a href={safeLink(selected.resume_url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition text-xs font-bold shadow-sm">
                    <span>السيرة الذاتية (CV)</span> <FileText size={12} className="text-zinc-300" />
                  </a>
                </div>
              </div>

              {/* المهارات الفنية والخبرات والرسالة النصية */}
              <div className="space-y-3 bg-zinc-50/50 p-3 sm:p-4 rounded-2xl border border-zinc-100 text-xs">
                <div>
                  <h4 className="font-black text-zinc-800 flex items-center gap-1"><Activity size={12}/> المهارات والبرامج والأدوات المكتسبة:</h4>
                  <p className="text-zinc-600 mt-1 leading-relaxed bg-white p-2.5 rounded-xl border border-zinc-100">{selected.skills || "لا يوجد"}</p>
                </div>
                <div>
                  <h4 className="font-black text-zinc-800 flex items-center gap-1"><History size={12} /> الخبرات السابقة والأنشطة التطوعية:</h4>
                  <p className="text-zinc-600 mt-1 leading-relaxed bg-white p-2.5 rounded-xl border border-zinc-100">{selected.experience || "لا يوجد"}</p>
                </div>
                <div>
                  <h4 className="font-black text-zinc-800 flex items-center gap-1"><MessageSquare size={12}/> رسالة الحافز والهدف من طلب الانضمام للـ SkillUp:</h4>
                  <p className="text-zinc-700 mt-1 font-medium bg-white p-2.5 rounded-xl border border-zinc-100 whitespace-pre-wrap leading-relaxed">{selected.message || "لا توجد رسالة."}</p>
                </div>
              </div>

            </div>

            {/* شريط اتخاذ القرار الحاسم السفلي - متجاوب وأزراره عريضة ومريحة للموبايل */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row justify-end items-center gap-2 shrink-0">
              <button
                onClick={() => handleStatusChange(selected.id, 'accepted')}
                disabled={actionLoadingId === selected.id || selected.status === 'accepted'}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold transition transform active:scale-95 shadow-md disabled:opacity-40"
              >
                <Check size={14} />
                <span>قبول واعتماد فوري</span>
              </button>
              <button
                onClick={() => handleStatusChange(selected.id, 'rejected')}
                disabled={actionLoadingId === selected.id || selected.status === 'rejected'}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl text-xs font-bold transition transform active:scale-95 shadow-md disabled:opacity-40"
              >
                <X size={14} />
                <span>استبعاد وتجميد الطلب</span>
              </button>
              <button 
                onClick={() => setSelected(null)} 
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-50 transition shadow-sm"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// أيقونة التاريخ المفقودة برمجياً
function History({ size, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
