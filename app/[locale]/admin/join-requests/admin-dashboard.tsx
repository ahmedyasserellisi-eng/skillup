"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { supabaseBrowser } from "@/lib/supabase-browser";
import { 
  Search, Filter, Download, ExternalLink, CheckCircle, XCircle, 
  Clock, Award, Users, ChevronLeft, ChevronRight, RefreshCw, 
  FileText, ShieldAlert, Check, X, MapPin, Briefcase, GraduationCap,
  Calendar, User, Mail, Phone, Hash, BookOpen, Activity, Heart, 
  MessageSquare, Image, Link, BarChart3, UserCheck, HelpCircle, PhoneCall
} from 'lucide-react';

// --- 1. خرائط الترجمة والتوحيد لكافة الحقول الـ 27 ---
const SECTOR_MAPPING: Record<string, { ar: string; en: string }> = {
  "marketing-digital-media": { ar: "التسويق والإعلام الرقمي", en: "Marketing & Digital Media" },
  "human-resources": { ar: "إدارة الموارد البشرية", en: "Human Resources Management" },
  "strategic-planning": { ar: "التخطيط الاستراتيجي", en: "Strategic Planning" },
  "sustainable-development": { ar: "التنمية المستدامة", en: "Sustainable Development" },
  "logistics-organization": { ar: "التنظيم واللوجيستيات", en: "Logistics & Organization" },
  "entertainment-culture": { ar: "الترفيه والثقافة", en: "Entertainment & Culture" },
  "training-development": { ar: "التدريب والتطوير المهني", en: "Training & Development" },
  "public-relations": { ar: "العلاقات العامة والتواصل", en: "Public Relations" },
  "it-web-development": { ar: "تكنولوجيا المعلومات ومطورين الويب", en: "IT & Web Development" }
};

const GOV_MAPPING: Record<string, string> = {
  cairo: "القاهرة", giza: "الجيزة", alexandria: "الإسكندرية", qalyubia: "القليوبية",
  sharqia: "الشرقية", dakahliya: "الدقهلية", beheira: "البحيرة", gharbia: "الغربية",
  monufiya: "المنوفية", favyoum: "الفيوم", beni_suef: "بني سويف", minya: "المنيا",
  assiut: "أسيوط", sohag: "سوهاج", qena: "قنا", luxor: "الأقصر", aswan: "أسوان",
  red_sea: "البحر الأحمر", new_valley: "الوادي الجديد", matrouh: "مطروح",
  north_sinai: "شمال سيناء", south_sinai: "جنوب سيناء", port_said: "بور سعيد",
  ismailia: "الإسماعيلية", suez: "السويس", damietta: "دمياط", kafr_el_sheikh: "كفر الشيخ"
};

const GENDER_MAPPING: Record<string, string> = { male: "ذكر", female: "أنثى" };
const HEARD_MAPPING: Record<string, string> = {
  facebook: "فيسبوك", instagram: "إنستغرام", linkedin: "لينكد إن",
  whatsapp: "واتساب", friends: "عن طريق الأصدقاء", university: "الجامعة / الكلية", other: "وسائل أخرى"
};

const EDUCATION_MAPPING: Record<string, string> = {
  student: "طالب جامعي الحالي", graduate: "خريج جامعي", postgrad: "دراسات عليا (ماجستير/دكتوراه)", school: "طالب مدرسي"
};

interface JoinRequest {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  national_id: string;
  city: string;
  address: string;
  age: number | string;
  gender: string;
  member_status: string;
  leadership_interest: string;
  education: string;
  grade: string;
  university: string;
  faculty: string;
  department: string;
  postgrad_info: string;
  graduation_year: string;
  profile_picture_url: string;
  sector_key: string;
  preferred_role: string;
  availability: string;
  heard_about_us: string;
  skills: string;
  experience: string;
  linkedin: string;
  facebook: string;
  portfolio: string;
  resume_url: string;
  message: string;
  status: 'pending' | 'contacted' | 'accepted' | 'rejected';
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selected, setSelected] = useState<JoinRequest | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // جلب البيانات الفعلي والديناميكي من قاعدة بيانات سوبابيز
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseBrowser
        .from('join_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setRequests(data as JoinRequest[]);
      } else {
        console.error("Supabase Error:", error);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // دالة تحديث حالة الطلب الفورية وحفظها بـ Supabase
  const handleStatusChange = async (id: string, newStatus: 'pending' | 'contacted' | 'accepted' | 'rejected') => {
    setActionLoadingId(id);
    try {
      const { error } = await supabaseBrowser
        .from('join_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (!error) {
        setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
        if (selected && selected.id === id) {
          setSelected(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        alert("حدث خطأ أثناء تحديث الحالة في قاعدة البيانات");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // تصفية وبحث فائق الأداء والسرعة
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const name = req.full_name?.toLowerCase() || '';
      const email = req.email?.toLowerCase() || '';
      const phone = req.phone || '';
      const nationalId = req.national_id || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch = 
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        nationalId.includes(query);

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesSector = sectorFilter === 'all' || req.sector_key === sectorFilter;

      return matchesSearch && matchesStatus && matchesSector;
    });
  }, [requests, searchQuery, statusFilter, sectorFilter]);

  // حسابات التنقل بين الصفحات
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // حساب الإحصائيات الحية من قاعدة البيانات لـ 4 حالات كاملة
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      contacted: requests.filter(r => r.status === 'contacted').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  }, [requests]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-50 font-sans" dir="rtl">
      
      {/* رأس الصفحة وزر التحديث الفوري المزامِن لسوبابيز */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="text-zinc-900 dark:text-white" size={24} />
            <span>إدارة وفرز طلبات الانضمام الرسمية</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            مراجعة وفحص الملفات والبيانات الشخصية لـ 27 حقلاً تنظيمياً لمبادرة SkillUp.
          </p>
        </div>
        <button 
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition active:scale-95"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>مزامنة وتحديث البيانات حياً</span>
        </button>
      </div>

      {/* لوحة الإحصائيات المركزية المحدثة بـ 5 كروت كاملة ومتجاوبة */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl"><FileText size={18} /></div>
          <div>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">إجمالي الطلبات</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white">{stats.total}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl"><Clock size={18} /></div>
          <div>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">قيد الانتظار</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl"><PhoneCall size={18} /></div>
          <div>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">تم التواصل</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.contacted}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl"><CheckCircle size={18} /></div>
          <div>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">المعتمدين</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.accepted}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl"><XCircle size={18} /></div>
          <div>
            <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">مستبعد</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* فلاتر البحث والفرز المتقدمة متوافقة مع الوضع الداكن */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="ابحث باسم المتقدم، البريد، الرقم القومي، أو رقم الهاتف الشخصي..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 focus:bg-white dark:focus:bg-zinc-900 transition"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs w-full sm:w-auto">
            <Filter size={14} className="text-zinc-400 dark:text-zinc-500" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-zinc-700 dark:text-zinc-200 focus:outline-none font-medium cursor-pointer w-full sm:w-auto"
            >
              <option value="all">كل الحالات الإدارية</option>
              <option value="pending">قيد الانتظار</option>
              <option value="contacted">تم التواصل</option>
              <option value="accepted">مقبول ومعتمد</option>
              <option value="rejected">مستبعد</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs w-full sm:w-auto">
            <Briefcase size={14} className="text-zinc-400 dark:text-zinc-500" />
            <select 
              value={sectorFilter}
              onChange={(e) => { setSectorFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-zinc-700 dark:text-zinc-200 focus:outline-none font-medium cursor-pointer w-full sm:w-auto"
            >
              <option value="all">كافة القطاعات التنظيمية</option>
              {Object.entries(SECTOR_MAPPING).map(([key, val]) => (
                <option key={key} value={key}>{val.ar}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* جدول البيانات الرئيسي المتوافق مع الوضعين */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">المتقدم والمعلومات الأساسية</th>
                <th className="px-6 py-4">القطاع المستهدف وطبيعة الدور</th>
                <th className="px-6 py-4">المحافظة والسن</th>
                <th className="px-6 py-4">الحالة الإدارية</th>
                <th className="px-6 py-4 text-center">إجراءات الفرز</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400 dark:text-zinc-500 font-medium">جاري فحص وتحميل مصفوفة البيانات من سوبابيز...</td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400 dark:text-zinc-500 font-medium">لم يتم العثور على أي طلبات تطابق معايير البحث الحالية.</td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white font-black flex items-center justify-center shadow-inner text-sm uppercase">
                          {req.full_name ? req.full_name.trim().charAt(0) : '?'}
                        </div>
                        <div>
                          <span className="block font-bold text-zinc-900 dark:text-white text-sm">{req.full_name}</span>
                          <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{req.email} • {req.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                        {SECTOR_MAPPING[req.sector_key]?.ar || req.sector_key}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5 font-medium">الدور: {req.preferred_role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 block">{GOV_MAPPING[req.city] || req.city}</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mt-0.5 font-mono">{req.age} عاماً</span>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          قيد الانتظار
                        </span>
                      )}
                      {req.status === 'contacted' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          تم التواصل
                        </span>
                      )}
                      {req.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          مقبول ومعتمد
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          مستبعد
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setSelected(req)}
                          className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold rounded-lg hover:opacity-90 transition active:scale-95 shadow-sm"
                        >
                          فحص الملف الكامل
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* شريط ترقيم الصفحات المتجاوب */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>عرض {paginatedRequests.length} طلب من إجمالي {filteredRequests.length} طلب</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">الصفحة {currentPage} من {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* النافذة المنبثقة الكاملة (Modal) لدراسة الطلب من 5 محاور و 4 أزرار قرارات حية */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-100 dark:border-zinc-800">
            
            {/* رأس النافذة */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white font-black flex items-center justify-center text-md shadow-md">
                  {selected.full_name ? selected.full_name.trim().charAt(0) : '?'}
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 dark:text-white">{selected.full_name}</h2>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">معرف الطلب المركزي: {selected.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* محتوى الـ 27 حقل بالكامل متناسق للوضع الداكن */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-white dark:bg-zinc-900">
              
              {/* 1. الملف الشخصي والهوية الأساسية */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                  <User size={12} />
                  <span>1. الملف الشخصي والهوية الأساسية</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الاسم الكامل رباعياً:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.full_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الرقم القومي (14 رقم):</span>
                    <span className="font-bold font-mono text-zinc-800 dark:text-zinc-200 tracking-wide">{selected.national_id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">السن والجنس الحالي:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.age} سنة ({GENDER_MAPPING[selected.gender] || selected.gender})</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">المحافظة / المدينة:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{GOV_MAPPING[selected.city] || selected.city}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">العنوان التفصيلي الحالي:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.address || "لم يتم تسجيل عنوان تفصيلي"}</span>
                  </div>
                </div>
              </div>

              {/* 2. قنوات التواصل المهني */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                  <Link size={12} />
                  <span>2. قنوات التواصل المهني والشبكي الرسمي</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">البريد الإلكتروني المعتمد:</span>
                    <a href={`mailto:${selected.email}`} className="font-bold text-zinc-900 dark:text-white font-mono underline flex items-center gap-1 mt-0.5">
                      <Mail size={12} /> {selected.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">رقم الهاتف الشخصي المباشر:</span>
                    <a href={`tel:${selected.phone}`} className="font-bold text-zinc-900 dark:text-white font-mono underline flex items-center gap-1 mt-0.5">
                      <Phone size={12} /> {selected.phone}
                    </a>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {selected.linkedin ? (
                      <a href={selected.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:opacity-90 rounded-xl font-bold text-zinc-700 dark:text-zinc-200 transition">
                        LinkedIn
                      </a>
                    ) : <span className="text-center py-2 text-zinc-300 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">لا يوجد LinkedIn</span>}
                    
                    {selected.facebook ? (
                      <a href={selected.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:opacity-90 rounded-xl font-bold text-zinc-700 dark:text-zinc-200 transition">
                        Facebook
                      </a>
                    ) : <span className="text-center py-2 text-zinc-300 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">لا يوجد فيسبوك</span>}

                    {selected.portfolio ? (
                      <a href={selected.portfolio} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:opacity-90 rounded-xl font-bold text-zinc-700 dark:text-zinc-200 transition">
                        معرض الأعمال
                      </a>
                    ) : <span className="text-center py-2 text-zinc-300 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">لا يوجد أعمال</span>}
                  </div>
                </div>
              </div>

              {/* 3. المسار التعليمي والمؤهل */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                  <GraduationCap size={12} />
                  <span>3. المسار التعليمي والمؤهل الدراسي الحالي</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الحالة التعليمية:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{EDUCATION_MAPPING[selected.education] || selected.education}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الجامعة أو المؤسسة:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.university || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الكلية أو المعهد الملحق:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.faculty || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">التخصص / القسم الأكاديمي:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.department || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الفرقة الدراسية / التقدير الحالي:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.grade || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">سنة التخرج (المتوقعة/الفعلية):</span>
                    <span className="font-bold font-mono text-zinc-800 dark:text-zinc-200">{selected.graduation_year || "غير محدد"}</span>
                  </div>
                  {selected.postgrad_info && (
                    <div className="sm:col-span-3 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">تفاصيل وافية حول الدراسات العليا:</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selected.postgrad_info}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. الرغبة والمهارات */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                  <Briefcase size={12} />
                  <span>4. التفضيلات الهيكلية، المهارات والخبرات السابقة</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">القطاع التنظيمي المستهدف بالطلب:</span>
                    <span className="font-black text-zinc-900 dark:text-white bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {SECTOR_MAPPING[selected.sector_key]?.ar || selected.sector_key}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الدور الفني المفضل أو المقترح:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.preferred_role}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">التفرغ والقدرة على العمل التنظيمي:</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selected.availability === 'full_time' ? 'تفرغ كامل ومستمر' : 'تفرغ جزئي'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">طريقة معرفة المبادرة والوصول إلينا:</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{HEARD_MAPPING[selected.heard_about_us] || selected.heard_about_us}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">المهارات والتقنيات والأدوات الشخصية:</span>
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed font-mono">
                      {selected.skills}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">الخبرات التنظيمية والعملية السابقة بالتفصيل:</span>
                    <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                      {selected.experience || "لا توجد خبرات سابقة للمتقدم."}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. البيانات التنظيمية التكميلية */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                  <Activity size={12} />
                  <span>5. البيانات التنظيمية التكميلية ورسالة الدافع</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">حالة العضوية الحالية بالمبادرة:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.member_status === 'new' ? 'عضو جديد تماماً' : 'عضو سابق / حالي بالمبادرة'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">هل يمتلك اهتمام بالأدوار القيادية؟</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selected.leadership_interest === 'yes' ? 'نعم، مهتم بالأدوار القيادية' : 'لا، يفضل العمل التنفيذي فقط'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5 font-medium">رسالة إضافية موجهة لإدارة الموارد البشرية:</span>
                    <p className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                      " {selected.message || "لا توجد أي رسالة إضافية ملحقة من المتقدم."} "
                    </p>
                  </div>
                  <div className="sm:col-span-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-zinc-400 dark:text-zinc-500 block mb-1 font-medium">الملف المهني المرفق (السيرة الذاتية):</span>
                      {selected.resume_url ? (
                        <a 
                          href={selected.resume_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-xs hover:opacity-90 transition shadow-md shadow-zinc-900/10"
                        >
                          استعراض وتنزيل الـ CV الفعلي
                        </a>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 italic">ولم يرفع سيرة ذاتية.</span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                      تاريخ ملء الاستمارة: {new Date(selected.created_at).toLocaleString('ar-EG')}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ذيل النافذة المنبثقة: 4 أزرار متكاملة لاتخاذ القرار الحقيقي في سوبابيز */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => handleStatusChange(selected.id, 'contacted')}
                disabled={actionLoadingId === selected.id || selected.status === 'contacted'}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition transform active:scale-95 shadow-sm"
              >
                تعيين كـ "تم التواصل"
              </button>
              <button
                onClick={() => handleStatusChange(selected.id, 'accepted')}
                disabled={actionLoadingId === selected.id || selected.status === 'accepted'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition transform active:scale-95 shadow-sm"
              >
                قبول واعتماد فوري
              </button>
              <button
                onClick={() => handleStatusChange(selected.id, 'rejected')}
                disabled={actionLoadingId === selected.id || selected.status === 'rejected'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition transform active:scale-95 shadow-sm"
              >
                استبعاد ورفض الطلب
              </button>
              <button 
                onClick={() => setSelected(null)} 
                className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
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
