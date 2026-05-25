"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Download, ExternalLink, CheckCircle, XCircle, 
  Clock, Award, Users, ChevronLeft, ChevronRight, RefreshCw, 
  FileText, ShieldAlert, Check, X, MapPin, Briefcase, GraduationCap,
  Calendar, User, Mail, Phone, Hash, BookOpen, Activity, Heart, 
  MessageSquare, Image, Link, BarChart3, UserCheck, HelpCircle
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

// دالة تنظيف وتأمين الروابط الخارجية لمنع الـ Broken Links والتوجيهات الخاطئة
const safeLink = (url: string | null | undefined): string => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "#") return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

// واجهة البيانات الكاملة والشاملة للمتقدم (27 حقلاً متطابقاً مع قاعدة البيانات والفورم)
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
  // الحالات الافتراضية للفلاتر والبحث المتقدم
  const [requests, setRequests] = useState<RequestData[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [eduFilter, setEduFilter] = useState('all');
  const [leadershipFilter, setLeadershipFilter] = useState('all');
  const [selected, setSelected] = useState<RequestData | null>(null);
  
  // حالات الـ Pagination للتحكم في الأعداد الكبيرة
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // حالات التحميل التفاعلية والعمليات الحية والإشعارات
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // مزامنة البيانات فور تغير القيمة القادمة من السيرفر
  useEffect(() => {
    setRequests(initialData);
  }, [initialData]);

  // إخفاء الإشعارات التلقائي بعد 4 ثوانٍ لراحة المستخدم
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // تحديث البيانات حياً عبر السيرفر
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

  // معالجة تغيير حالة المتقدم (قبول / رفض)
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

  // تصفية ذكية وعميقة مبنية على مصفوفة الفلاتر بالكامل
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const s = search.toLowerCase().trim();
      
      // نظام البحث الخارق لجميع حقول النص المتاحة
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

  // تصفير الصفحة عند تغير الفلاتر لحماية الفهرسة
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sectorFilter, cityFilter, eduFilter, leadershipFilter]);

  // حساب العدادات الإحصائية والتحليلات الديموغرافية المتقدمة لقطاع الـ MEAL
  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => r.status === 'pending').length;
    const accepted = filteredRequests.filter(r => r.status === 'accepted').length;
    const rejected = filteredRequests.filter(r => r.status === 'rejected').length;
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';

    // حساب متوسط الأعمار بدقة
    const ageSum = filteredRequests.reduce((sum, r) => sum + (Number(r.age) || 0), 0);
    const avgAge = total > 0 ? (ageSum / total).toFixed(1) : '0';

    // الكلية الأكثر تكراراً وإقبالاً
    const facultyCounts: Record<string, number> = {};
    filteredRequests.forEach(r => { if (r.faculty) facultyCounts[r.faculty] = (facultyCounts[r.faculty] || 0) + 1; });
    const topFaculty = Object.entries(facultyCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

    // المحافظة الأكثر تفاعلاً
    const cityCounts: Record<string, number> = {};
    filteredRequests.forEach(r => { if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1; });
    const topCityRaw = Object.entries(cityCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || '';
    const topCity = CITY_MAPPING[topCityRaw] || topCityRaw || 'لا يوجد';

    return { total, pending, accepted, rejected, acceptanceRate, avgAge, topFaculty, topCity };
  }, [filteredRequests]);

  // حسابات الـ Pagination تقسيم الصفحات
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // تصدير الشيت الكامل والشامل المتوافق 100% مع أوفيس إكسيل
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
      `'${r.national_id ?? ""}`, // حماية الترقيم القومي الطويل في إكسيل
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
    link.setAttribute("download", `SkillUp_MEAL_Comprehensive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen text-right font-sans" dir="rtl">
      
      {/* نظام التنبيهات العائمة للعمليات الحية */}
      {notification && (
        <div className={`fixed top-5 left-5 z-50 p-4 rounded-2xl shadow-2xl border text-xs md:text-sm font-bold transition-all transform animate-bounce flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18} className="text-emerald-600" /> : <ShieldAlert size={18} className="text-rose-600" />}
          {notification.message}
        </div>
      )}

      {/* الهيدر الرئيسي للمنظومة */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
            منظومة المتابعة والجدولة الشاملة لطلبات الانضمام 🛡️
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            الإدارة المركزية الذكية لقطاع المتابعة والتقييم والمساءلة والتعلم (MEAL) | مبادرة SkillUp للتطوير والتخطيط الاستراتيجي
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition disabled:opacity-50 shadow-sm flex items-center justify-center"
            title="تحديث البيانات الفوري من الخادم"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl transition text-xs md:text-sm font-bold flex-1 lg:flex-none shadow-md shadow-emerald-600/10"
          >
            <Download size={18} />
            تصدير الشيت الشامل (Excel)
          </button>
        </div>
      </div>

      {/* العدادات الإحصائية والتحليلات الديموغرافية لقطاع الـ MEAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">إجمالي الطلبات</p><h3 className="text-xl md:text-2xl font-black text-slate-800 mt-1">{stats.total}</h3></div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">قيد الانتظار</p><h3 className="text-xl md:text-2xl font-black text-amber-600 mt-1">{stats.pending}</h3></div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">المقبولين</p><h3 className="text-xl md:text-2xl font-black text-emerald-600 mt-1">{stats.accepted}</h3></div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">المستبعدين</p><h3 className="text-xl md:text-2xl font-black text-rose-600 mt-1">{stats.rejected}</h3></div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><XCircle size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">معدل القبول</p><h3 className="text-xl md:text-2xl font-black text-indigo-600 mt-1">{stats.acceptanceRate}%</h3></div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Award size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">متوسط الأعمار</p><h3 className="text-xl md:text-2xl font-black text-orange-600 mt-1">{stats.avgAge} عام</h3></div>
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><BarChart3 size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">الكلية الأعلى إقبالاً</p><h3 className="text-[11px] font-black text-purple-700 mt-2 truncate w-24" title={stats.topFaculty}>{stats.topFaculty}</h3></div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><GraduationCap size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[11px] text-slate-400 font-bold">المحافظة الأكثر تفاعلاً</p><h3 className="text-[11px] font-black text-teal-700 mt-2 truncate w-24" title={stats.topCity}>{stats.topCity}</h3></div>
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl"><MapPin size={20}/></div>
        </div>
      </div>

      {/* لوحة التحكم بالفلاتر المتقدمة والبحث الذكي الشامل */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 mb-6">
        <div className="relative w-full">
          <Search className="absolute right-4 top-3.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث ذكي شامل (بالاسم، الرقم القومي، رقم الهاتف، الكلية، الجامعة، التخصص، أو المهارات الفنية)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-11 py-3 border border-slate-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 bg-slate-50/40 font-medium transition"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          {/* فلتر الحالة */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter size={14} className="text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-slate-700 cursor-pointer w-full">
              <option value="all">كل الحالات الإدارية</option>
              <option value="pending">قيد الانتظار (معلق)</option>
              <option value="accepted">المقبولين رسمياً</option>
              <option value="rejected">المستبعدين</option>
            </select>
          </div>

          {/* فلتر القطاعات السبعة الموحدة */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Briefcase size={14} className="text-slate-400" />
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-slate-700 cursor-pointer w-full">
              <option value="all">كل القطاعات الفنية السبعة</option>
              {Object.entries(SECTOR_MAPPING).map(([key, val]) => (
                <option key={key} value={key}>{val.ar}</option>
              ))}
            </select>
          </div>

          {/* فلتر المحافظة */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <MapPin size={14} className="text-slate-400" />
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-slate-700 cursor-pointer w-full">
              <option value="all">كل المحافظات المصرية</option>
              {Object.entries(CITY_MAPPING).map(([enKey, arVal]) => (
                <option key={enKey} value={enKey}>{arVal}</option>
              ))}
            </select>
          </div>

          {/* فلتر الحالة التعليمية */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <GraduationCap size={14} className="text-slate-400" />
            <select value={eduFilter} onChange={(e) => setEduFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-slate-700 cursor-pointer w-full">
              <option value="all">كل الحالات التعليمية</option>
              {Object.entries(EDUCATION_MAPPING).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>
          </div>

          {/* فلتر الاهتمام بالقيادة */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 col-span-2 md:col-span-1">
            <UserCheck size={14} className="text-slate-400" />
            <select value={leadershipFilter} onChange={(e) => setLeadershipFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-slate-700 cursor-pointer w-full">
              <option value="all">كل رغبات القيادة</option>
              {Object.entries(LEADERSHIP_MAPPING).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* الجدول الرئيسي لعرض الطلبات باحترافية استثنائية */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-bold tracking-wide">
                <th className="p-4">بيانات المتقدم الأساسية</th>
                <th className="p-4">الخلفية التعليمية والأكاديمية</th>
                <th className="p-4">العمر والمحافظة</th>
                <th className="p-4">القطاع الفني المستهدف</th>
                <th className="p-4">الدور والموقف الحالي</th>
                <th className="p-4">حالة الطلب الإدارية</th>
                <th className="p-4 text-center">إجراءات المراجعة والجدولة</th>
              </tr>
            </thead>
            <tbody className="text-xs md:text-sm text-slate-700 divide-y divide-slate-100">
              {paginatedRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/30 transition duration-150">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-sm">{req.full_name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{req.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-slate-800">{req.faculty}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{req.university} - {GRADE_MAPPING[req.grade] || req.grade}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-semibold text-slate-800">{CITY_MAPPING[req.city] || req.city}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{req.age} عام</div>
                  </td>
                  <td className="p-4 font-bold text-blue-600 text-xs">
                    {SECTOR_MAPPING[req.sector_key]?.ar || req.sector_key}
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 inline-block">
                      {req.preferred_role}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">الصفة: {MEMBER_STATUS_MAPPING[req.member_status] || req.member_status}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide inline-block ${
                      req.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {req.status === 'accepted' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleStatusChange(req.id, 'accepted')}
                        disabled={actionLoadingId === req.id || req.status === 'accepted'}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition disabled:opacity-30"
                        title="قبول طلب المتقدم فوراً"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.id, 'rejected')}
                        disabled={actionLoadingId === req.id || req.status === 'rejected'}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition disabled:opacity-30"
                        title="استبعاد طلب المتقدم فوراً"
                      >
                        <X size={16} />
                      </button>
                      <div className="h-4 w-px bg-slate-200 mx-1"></div>
                      <button 
                        onClick={() => setSelected(req)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-black underline px-2 py-1 hover:bg-blue-50 rounded-lg transition"
                      >
                        الملف الكامل والـ 27 حقل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* واجهة غياب البيانات أو عدم العثور على نتائج للتصفية */}
        {filteredRequests.length === 0 && (
          <div className="p-16 text-center text-slate-400 bg-white flex flex-col items-center justify-center gap-2">
            <ShieldAlert size={36} className="text-slate-300 transform scale-110 mb-2" />
            <p className="text-sm font-bold text-slate-600">عذراً، لا توجد طلبات انضمام تطابق محددات البحث الفوري أو الفلاتر الذكية الحالية.</p>
            <p className="text-xs text-slate-400">يرجى التأكد من الكلمات الدليليلة أو تهيئة الفلاتر العلوية بشكل صحيح.</p>
          </div>
        )}

        {/* شريط التحكم التفاعلي بالصفحات وجدولة البيانات الضخمة (Pagination Controls) */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500">
          <div>
            عرض {Math.min(filteredRequests.length, (currentPage - 1) * itemsPerPage + 1)} إلى{" "}
            {Math.min(filteredRequests.length, currentPage * itemsPerPage)} من أصل{" "}
            <span className="text-slate-800 font-black text-sm">{filteredRequests.length}</span> طلب متاح في السجلات المصفاة.
          </div>
          
          <div className="flex items-center gap-2" dir="ltr">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-40 shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-[11px]">
              صفحة {currentPage} من {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-40 shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* المودال الشامل والعملاق لعرض الـ 27 حقلاً بالكامل بدون حذف حرف واحد */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 transform transition-all scale-100 my-auto">
            
            {/* هيدر المودال التفاعلي */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {selected.profile_picture_url && selected.profile_picture_url !== "#" ? (
                  <img src={selected.profile_picture_url} alt="Profile" className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-sm bg-slate-200" onError={(e)=>{e.currentTarget.style.display='none'}} />
                ) : (
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full"><User size={20} /></div>
                )}
                <div>
                  <h3 className="text-base font-black text-slate-800">الملف التفصيلي الشامل للمتقدم (27 حقلاً فحصياً)</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">معرف السجل الفريد بالنظام الرقمي: {selected.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="text-slate-400 hover:text-slate-600 text-3xl font-light leading-none p-2 transition"
              >
                &times;
              </button>
            </div>
            
            {/* جسم البيانات الشامل والمقسم تكتيكياً لراحة عيون موظفي الـ MEAL والـ HR */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs md:text-sm">
              
              {/* القسم الأول: الهوية الشخصية والبيانات المدنية */}
              <div>
                <h4 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5"><User size={14}/> البيانات الأساسية والمدنية</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><User size={12}/> الاسم الكامل رباعياً (مطابق للبطاقة):</p>
                    <p className="text-xs font-black text-slate-900 mt-1">{selected.full_name}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Hash size={12}/> الرقم القومي للمتقدم (14 رقماً):</p>
                    <p className="text-xs font-mono font-black text-slate-800 mt-1 tracking-wider">{selected.national_id}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Mail size={12}/> البريد الإلكتروني الرسمي المعين:</p>
                    <p className="text-xs font-mono font-bold text-blue-600 mt-1 break-all">{selected.email}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Phone size={12}/> رقم الهاتف (الواتساب المفعل للتواصل):</p>
                    <p className="text-xs font-mono font-black text-slate-800 mt-1 tracking-wide">{selected.phone}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><MapPin size={12}/> محافظة الإقامة الحالية:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{CITY_MAPPING[selected.city] || selected.city}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={12}/> العمر الزمني الحالي المقيد:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{selected.age} عاماً طبقا للميلاد</p>
                  </div>
                </div>
              </div>

              {/* القسم الثاني: المسار التعليمي والخلفية الأكاديمية */}
              <div>
                <h4 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5"><GraduationCap size={14}/> المسار التعليمي والخلفية الأكاديمية</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><BookOpen size={12}/> الحالة التعليمية المقيدة:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{EDUCATION_MAPPING[selected.education] || selected.education}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><GraduationCap size={12}/> الجامعة أو المعهد الأكاديمي:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{selected.university}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">الكلية والتبعية المؤسسية:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{selected.faculty}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">القسم الدراسي والتخصص الدقيق:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{selected.department}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">الفرقة الدراسية أو الصف الحالي:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{GRADE_MAPPING[selected.grade] || selected.grade}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={12}/> سنة التخرج الفعلية / المتوقعة:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">عام {selected.graduation_year}</p>
                  </div>
                  {selected.postgrad_info && (
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                      <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">تفاصيل وبيانات الدراسات العليا الاختيارية:</p>
                      <p className="text-xs font-medium text-slate-800 mt-1">{selected.postgrad_info}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* القسم الثالث: التفضيلات الفنية وإحصائيات الاستهداف داخل المبادرة */}
              <div>
                <h4 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5"><Briefcase size={14}/> التفضيلات الفنية والموقف الهيكلي</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Briefcase size={12}/> القطاع الفني الموحد المطلوب بالطلب:</p>
                    <p className="text-xs font-black text-blue-600 mt-1">{SECTOR_MAPPING[selected.sector_key]?.ar || selected.sector_key}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">الدور الفني أو المسؤولية المفضلة للمستخدم:</p>
                    <p className="text-xs font-black text-purple-700 mt-1">{selected.preferred_role}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">صفة القيد أو رتبة العضوية بالنظام:</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{MEMBER_STATUS_MAPPING[selected.member_status] || selected.member_status}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Heart size={12}/> الرغبة والتأهيل لتولي أدوار قيادية بالقطاع:</p>
                    <p className="text-xs font-black text-indigo-700 mt-1">{LEADERSHIP_MAPPING[selected.leadership_interest] || selected.leadership_interest}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><Activity size={12}/> الوقت المتاح والجاهزية الأسبوعية للعمل التطوعي:</p>
                    <p className="text-xs font-medium text-slate-800 mt-1">{selected.availability}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1"><HelpCircle size={12}/> القناة الإعلانية (كيف سمعت عنا؟):</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{HEARD_MAPPING[selected.heard_about_us] || selected.heard_about_us}</p>
                  </div>
                </div>
              </div>

              {/* القسم الرابع: المهارات المسرودة والخبرات العملية والميدانية بالتفصيل */}
              <div>
                <h4 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5"><Activity size={14}/> الجدارة الفنية والخبرات والمبررات</h4>
                <div className="space-y-3">
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400">المهارات الأساسية والتقنية التي يتقنها المتقدم:</p>
                    <p className="text-xs font-medium text-slate-800 mt-1 leading-relaxed whitespace-pre-line">{selected.skills}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400">الأنشطة الطلابية، المبادرات، أو الخبرات المهنية السابقة بالتفصيل:</p>
                    <p className="text-xs font-medium text-slate-800 mt-1 leading-relaxed whitespace-pre-line">{selected.experience}</p>
                  </div>
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400"><MessageSquare size={12} className="inline ml-1"/> دافع الانضمام الفعلي (لماذا ترغب في الانضمام لفريق SkillUp؟):</p>
                    <p className="text-xs font-medium text-slate-800 mt-1 leading-relaxed whitespace-pre-line">{selected.message}</p>
                  </div>
                </div>
              </div>

              {/* القسم الخامس: الروابط الرقمية والملفات الثبوتية المرفوعة */}
              <div>
                <h4 className="text-xs font-black text-slate-400 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-1.5"><Link size={14}/> الروابط والملفات الرقمية المؤكدة</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a href={safeLink(selected.resume_url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition font-medium">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><FileText size={16} className="text-slate-600"/> مراجعة وفحص السيرة الذاتية (CV)</span>
                    <ExternalLink size={14} className="text-slate-400"/>
                  </a>
                  <a href={safeLink(selected.profile_picture_url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition font-medium">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><Image size={16} className="text-slate-600"/> رابط الصورة الشخصية المرفوعة</span>
                    <ExternalLink size={14} className="text-slate-400"/>
                  </a>
                  <a href={safeLink(selected.facebook)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition font-medium">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><Link size={16} className="text-blue-600"/> معاينة الحساب الشخصي (فيس بوك)</span>
                    <ExternalLink size={14} className="text-slate-400"/>
                  </a>
                  <a href={safeLink(selected.linkedin)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition font-medium">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><Link size={16} className="text-indigo-600"/> مراجعة الملف المهني (لينكد إن)</span>
                    <ExternalLink size={14} className="text-slate-400"/>
                  </a>
                  <a href={safeLink(selected.portfolio)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition font-medium sm:col-span-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><Briefcase size={16} className="text-amber-600"/> رابط معرض الأعمال والملف التعريفي (Portfolio)</span>
                    <ExternalLink size={14} className="text-slate-400"/>
                  </a>
                </div>
              </div>

            </div>
            
            {/* أزرار اتخاذ القرار الإداري الفوري لقطاع الـ MEAL والـ HR */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(selected.id, 'accepted')}
                  disabled={actionLoadingId === selected.id || selected.status === 'accepted'}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/10"
                >
                  <Check size={14} />
                  قبول واعتماد انضمامه فوراً
                </button>
                <button
                  onClick={() => handleStatusChange(selected.id, 'rejected')}
                  disabled={actionLoadingId === selected.id || selected.status === 'rejected'}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/10"
                >
                  <X size={14} />
                  استبعاد الطلب وحفظ الأسباب
                </button>
              </div>
              
              <button 
                onClick={() => setSelected(null)} 
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition shadow-sm"
              >
                إغلاق نافذة الفحص
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
