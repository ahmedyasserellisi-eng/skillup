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

// واجهة تعريف بيانات المتقدم القادمة من قاعدة البيانات لتطابق الحقول الـ 27 تماماً
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
  status: 'pending' | 'accepted' | 'rejected';
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

  // جلب البيانات الفعلي ومحاكاة الربط مع Supabase بذكاء وحماية مدمجة
  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        // ملاحظة: هنا يمكنك ربط كود سوبابيز الفعلي الخاص بك مستقبلاً
        // const { data } = await supabaseBrowser.from('join_requests').select('*').order('created_at', { ascending: false });
        
        // بيانات تجريبية هيكلية مطابقة تماماً للحقول الـ 27 لضمان عدم توقف الفرز
        const mockData: JoinRequest[] = [
          {
            id: 'req-101',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            full_name: 'أحمد رأفت الشناوي',
            email: 'ahmed.rafat@gmail.com',
            phone: '01012345678',
            national_id: '30105120104875',
            city: 'sharqia',
            address: 'الزقازيق - شارع المحافظة بجوار البنك الأهلي',
            age: 23,
            gender: 'male',
            member_status: 'new',
            leadership_interest: 'yes',
            education: 'student',
            grade: 'الفرقة الرابعة',
            university: 'جامعة الزقازيق',
            faculty: 'الحاسبات والمعلومات',
            department: 'علوم الحاسب CS',
            postgrad_info: '',
            graduation_year: '2026',
            profile_picture_url: '',
            sector_key: 'it-web-development',
            preferred_role: 'Frontend Developer (Next.js)',
            availability: 'part_time',
            heard_about_us: 'facebook',
            skills: 'React, Next.js, TypeScript, TailwindCSS, Git & GitHub',
            experience: 'قمت ببناء موقع تعريفي لشركة تجارية صغيرة واستخدمت تقنيات حديثة.',
            linkedin: 'https://linkedin.com/in/mock',
            facebook: 'https://facebook.com/mock',
            portfolio: 'https://github.com/mock',
            resume_url: '#',
            message: 'أتطلع بشدة للانضمام لعائلة سكيل أب والمساهمة في تطوير الأنظمة الرقمية للمبادرة.',
            status: 'pending'
          },
          {
            id: 'req-102',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            full_name: 'سارة محمود عبد العزيز',
            email: 'sara.m@outlook.com',
            phone: '01288877665',
            national_id: '29908151205468',
            city: 'cairo',
            address: 'مصر الجديدة - ميدان تريومف',
            age: 26,
            gender: 'female',
            member_status: 'old',
            leadership_interest: 'no',
            education: 'graduate',
            grade: 'تخرجت بتقدير امتياز مع مرتبة الشرف',
            university: 'جامعة القاهرة',
            faculty: 'التجارة',
            department: 'إدارة الأعمال باللغة الإنجليزية',
            postgrad_info: 'تمهيدي ماجستير إدارة الموارد البشرية',
            graduation_year: '2022',
            profile_picture_url: '',
            sector_key: 'human-resources',
            preferred_role: 'HR Specialist / Recruiter',
            availability: 'full_time',
            heard_about_us: 'linkedin',
            skills: 'Talent Acquisition, Interviewing, Performance Management, Excel',
            experience: 'خبرة سنة ونصف كمسؤولة توظيف مبتدئة في شركة شحن وتوزيع وتنسيق المقابلات.',
            linkedin: 'https://linkedin.com/in/mock',
            facebook: '',
            portfolio: '',
            resume_url: '#',
            message: 'شغوفة بمساعدة الكوادر الشبابية وتوجيههم للمكان المناسب لهم داخل الهيكل الإداري.',
            status: 'accepted'
          }
        ];
        setRequests(mockData);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  // دالة تغيير حالة الطلب (قبول / استبعاد)
  const handleStatusChange = async (id: string, newStatus: 'accepted' | 'rejected') => {
    setActionLoadingId(id);
    try {
      // محاكاة الاتصال بقاعدة البيانات لمدة نصف ثانية
      await new Promise(resolve => setTimeout(resolve, 500));
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      if (selected && selected.id === id) {
        setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // نظام تصفية وبحث متطور فائق الأداء
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.phone.includes(searchQuery) ||
        req.national_id.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesSector = sectorFilter === 'all' || req.sector_key === sectorFilter;

      return matchesSearch && matchesStatus && matchesSector;
    });
  }, [requests, searchQuery, statusFilter, sectorFilter]);

  // حسابات الترقيم والصفحات (Pagination)
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // إحصائيات حية وديناميكية معبرة
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  }, [requests]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-zinc-50 min-h-screen text-zinc-900 font-sans" dir="rtl">
      
      {/* رأس الصفحة وزر التحديث الفوري */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 flex items-center gap-2">
            <Users className="text-zinc-900" size={24} />
            <span>إدارة وفرز طلبات الانضمام الرسمية</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            مراجعة وفحص الملفات والبيانات الشخصية لـ 27 حقلاً تنظيمياً لمبادرة SkillUp.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold shadow-sm hover:bg-zinc-50 transition active:scale-95"
        >
          <RefreshCw size={14} />
          <span>تحديث البيانات الحالية</span>
        </button>
      </div>

      {/* لوحة الإحصائيات المركزية الفاخرة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl"><FileText size={20} /></div>
          <div>
            <span className="block text-[11px] text-zinc-400 font-bold">إجمالي الطلبات</span>
            <span className="text-xl font-black text-zinc-900">{stats.total}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
          <div>
            <span className="block text-[11px] text-zinc-400 font-bold">قيد الفحص والمراجعة</span>
            <span className="text-xl font-black text-amber-600">{stats.pending}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={20} /></div>
          <div>
            <span className="block text-[11px] text-zinc-400 font-bold">المقبولين والمُعتمدين</span>
            <span className="text-xl font-black text-emerald-600">{stats.accepted}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><XCircle size={20} /></div>
          <div>
            <span className="block text-[11px] text-zinc-400 font-bold">طلبات مستبعدة</span>
            <span className="text-xl font-black text-rose-600">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* شريط البحث الاحترافي والفلاتر المتقدمة */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text"
            placeholder="ابحث باسم المتقدم، البريد، الرقم القومي، أو رقم الهاتف الشخصي..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:bg-white transition"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs w-full sm:w-auto">
            <Filter size={14} className="text-zinc-400" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none text-zinc-700 font-medium cursor-pointer w-full sm:w-auto"
            >
              <option value="all">كل الحالات الإدارية</option>
              <option value="pending">قيد الانتظار</option>
              <option value="accepted">مقبول ومعتمد</option>
              <option value="rejected">مستبعد</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs w-full sm:w-auto">
            <Briefcase size={14} className="text-zinc-400" />
            <select 
              value={sectorFilter}
              onChange={(e) => { setSectorFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none text-zinc-700 font-medium cursor-pointer w-full sm:w-auto"
            >
              <option value="all">كافة القطاعات التنظيمية</option>
              {Object.entries(SECTOR_MAPPING).map(([key, val]) => (
                <option key={key} value={key}>{val.ar}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* جدول استعراض الطلبات والبيانات الحية */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">المتقدم والمعلومات الأساسية</th>
                <th className="px-6 py-4">القطاع المستهدف وطبيعة الدور</th>
                <th className="px-6 py-4">المحافظة والسن</th>
                <th className="px-6 py-4">الحالة الإدارية</th>
                <th className="px-6 py-4 text-center">إجراءات الفرز المعجل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400 font-medium">جاري فحص وتحميل مصفوفة البيانات...</td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400 font-medium">لم يتم العثور على أي طلبات تطابق معايير البحث الحالية.</td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50/80 transition duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white font-black flex items-center justify-center shadow-inner text-sm uppercase">
                          {req.full_name.trim().charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold text-zinc-900 text-sm">{req.full_name}</span>
                          <span className="block text-[11px] text-zinc-400 font-mono mt-0.5">{req.email} • {req.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-800 block">
                        {SECTOR_MAPPING[req.sector_key]?.ar || req.sector_key}
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5 font-medium">الدور: {req.preferred_role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-zinc-700 block">{GOV_MAPPING[req.city] || req.city}</span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5 font-mono">{req.age} عاماً</span>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          قيد الانتظار
                        </span>
                      )}
                      {req.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          مقبول ومعتمد
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          مستبعد
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setSelected(req)}
                          className="px-3 py-1.5 bg-zinc-900 text-white text-[11px] font-bold rounded-lg hover:bg-zinc-800 transition active:scale-95 shadow-sm"
                        >
                          فحص الملف الكامل
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(req.id, 'accepted')}
                              disabled={actionLoadingId !== null}
                              className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition disabled:opacity-40"
                              title="قبول فوري"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(req.id, 'rejected')}
                              disabled={actionLoadingId !== null}
                              className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition disabled:opacity-40"
                              title="استبعاد فوري"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* أزرار التنقل والترقيم الذكي للمصفوفة */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>عرض {paginatedRequests.length} طلب من إجمالي {filteredRequests.length} مفلترين</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronRight size={14} />
            </button>
            <span className="text-zinc-800 font-bold">الصفحة {currentPage} من {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 transition disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* النافذة المنبثقة الكاملة (Modal) لفحص كافة الحقول الـ 27 بدقة متناهية */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-100">
            
            {/* رأس النافذة المنبثقة */}
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-black flex items-center justify-center text-md shadow-md">
                  {selected.full_name.trim().charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900">{selected.full_name}</h2>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">معرف الطلب المرجعي المركزي: {selected.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* محتوى الاستمارة الكامل الموزع باحترافية */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* القسم الأول: البيانات الشخصية الحساسة */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <User size={12} />
                  <span>1. الملف الشخصي والهوية الأساسية</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">الاسم الكامل رباعياً:</span>
                    <span className="font-bold text-zinc-800">{selected.full_name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">الرقم القومي (14 رقم):</span>
                    <span className="font-bold font-mono text-zinc-800 tracking-wide">{selected.national_id}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">السن والجنس الحالي:</span>
                    <span className="font-bold text-zinc-800">{selected.age} سنة ({GENDER_MAPPING[selected.gender] || selected.gender})</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">المحافظة / المدينة:</span>
                    <span className="font-bold text-zinc-800">{GOV_MAPPING[selected.city] || selected.city}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 block mb-0.5 font-medium">العنوان التفصيلي الحالي:</span>
                    <span className="font-bold text-zinc-800">{selected.address || "لم يتم إدخاله برمجياً"}</span>
                  </div>
                </div>
              </div>

              {/* القسم الثاني: الاتصال والروابط المهنية */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Link size={12} />
                  <span>2. قنوات التواصل المهني والشبكي الرسمي</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">البريد الإلكتروني المعتمد:</span>
                    <a href={`mailto:${selected.email}`} className="font-bold text-zinc-900 font-mono underline flex items-center gap-1 mt-0.5">
                      <Mail size={12} /> {selected.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">رقم الهاتف الشخصي المباشر:</span>
                    <a href={`tel:${selected.phone}`} className="font-bold text-zinc-900 font-mono underline flex items-center gap-1 mt-0.5">
                      <Phone size={12} /> {selected.phone}
                    </a>
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100">
                    {selected.linkedin ? (
                      <a href={selected.linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl font-bold text-zinc-700 transition">
                        <UserCheck size={12} /> LinkedIn
                      </a>
                    ) : <span className="text-center py-2 text-zinc-300 font-medium border border-dashed rounded-xl">لا يوجد LinkedIn</span>}
                    
                    {selected.facebook ? (
                      <a href={selected.facebook} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl font-bold text-zinc-700 transition">
                        <MessageSquare size={12} /> Facebook
                      </a>
                    ) : <span className="text-center py-2 text-zinc-300 font-medium border border-dashed rounded-xl">لا يوجد فيسبوك</span>}

                    {selected.portfolio ? (
                      <a href={selected.portfolio} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl font-bold text-zinc-700 transition">
                        <ExternalLink size={12} /> معرض الأعمال
                      </a>
                    ) : <span className="text-center py-2 text-zinc-300 font-medium border border-dashed rounded-xl">لا يوجد أعمال</span>}
                  </div>
                </div>
              </div>

              {/* القسم الثالث: الخلفية التعليمية والأكاديمية */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <GraduationCap size={12} />
                  <span>3. المسار التعليمي والمؤهل الدراسي الحالي</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">الحالة التعليمية:</span>
                    <span className="font-bold text-zinc-800">{EDUCATION_MAPPING[selected.education] || selected.education}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">الجامعة أو المؤسسة:</span>
                    <span className="font-bold text-zinc-800">{selected.university || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">الكلية أو المعهد الملحق:</span>
                    <span className="font-bold text-zinc-800">{selected.faculty || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">التخصص / القسم الأكاديمي:</span>
                    <span className="font-bold text-zinc-800">{selected.department || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">الفرقة الدراسية / التقدير الحالي:</span>
                    <span className="font-bold text-zinc-800">{selected.grade || "غير محدد"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">سنة التخرج (المتوقعة/الفعلية):</span>
                    <span className="font-bold font-mono text-zinc-800">{selected.graduation_year || "غير محدد"}</span>
                  </div>
                  {selected.postgrad_info && (
                    <div className="sm:col-span-3 bg-white p-2.5 rounded-xl border border-zinc-100">
                      <span className="text-zinc-400 block mb-0.5 font-medium">تفاصيل وافية حول الدراسات العليا:</span>
                      <span className="font-semibold text-zinc-700">{selected.postgrad_info}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* القسم الرابع: الرغبة التنظيمية والمهارات الفنية */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Briefcase size={12} />
                  <span>4. التفضيلات الهيكلية، المهارات والخبرات السابقة</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">القطاع التنظيمي المستهدف بالطلب:</span>
                    <span className="font-black text-zinc-900 bg-zinc-200/60 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {SECTOR_MAPPING[selected.sector_key]?.ar || selected.sector_key}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">الدور الفني المفضل أو المقترح:</span>
                    <span className="font-bold text-zinc-800">{selected.preferred_role}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">التفرغ والقدرة على العمل التنظيمي:</span>
                    <span className="font-semibold text-zinc-700">{selected.availability === 'full_time' ? 'تفرغ كامل ومستمر' : 'تفرغ جزئي'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">طريقة معرفة المبادرة والوصول إلينا:</span>
                    <span className="font-semibold text-zinc-700">{HEARD_MAPPING[selected.heard_about_us] || selected.heard_about_us}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 block mb-0.5 font-medium">المهارات والتقنيات والأدوات الشخصية:</span>
                    <div className="p-2.5 bg-white rounded-xl border border-zinc-200 text-zinc-800 font-medium leading-relaxed font-mono">
                      {selected.skills}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 block mb-0.5 font-medium">الخبرات التنظيمية والعملية السابقة بالتفصيل:</span>
                    <div className="p-2.5 bg-white rounded-xl border border-zinc-200 text-zinc-800 font-medium leading-relaxed">
                      {selected.experience || "لا توجد خبرات سابقة للمتقدم."}
                    </div>
                  </div>
                </div>
              </div>

              {/* القسم الخامس: معلومات تنظيمية وإضافية */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Activity size={12} />
                  <span>5. البيانات التنظيمية التكميلية ورسالة الدافع</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">حالة العضوية الحالية بالمبادرة:</span>
                    <span className="font-bold text-zinc-800">{selected.member_status === 'new' ? 'عضو جديد تماماً' : 'عضو سابق / حالي بالمبادرة'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block mb-0.5 font-medium">هل يمتلك اهتمام بالأدوار والمسؤوليات القيادية؟</span>
                    <span className="font-bold text-zinc-800">{selected.leadership_interest === 'yes' ? 'نعم، مهتم بشدة بالأدوار القيادية' : 'لا، يفضل العمل التنفيذي فقط'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-400 block mb-0.5 font-medium">رسالة إضافية موجهة لإدارة الموارد البشرية:</span>
                    <p className="p-3 bg-white rounded-xl border border-zinc-200 font-medium text-zinc-700 italic leading-relaxed">
                      " {selected.message || "لا توجد أي رسالة إضافية ملحقة من المتقدم."} "
                    </p>
                  </div>
                  <div className="sm:col-span-2 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 block mb-0.5 font-medium">المستند التعريفي والملف المهني (الـ CV):</span>
                      <a 
                        href={selected.resume_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:opacity-90 transition shadow-md shadow-zinc-900/10"
                      >
                        <Download size={12} /> تحميل / استعراض السيرة الذاتية (Resume)
                      </a>
                    </div>
                    <div className="text-left font-mono text-[10px] text-zinc-400">
                      تاريخ ملء الاستمارة: {new Date(selected.created_at).toLocaleString('ar-EG')}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ذيل النافذة المنبثقة: أزرار حاسمة لتعديل الحالة الإدارية */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 flex flex-col sm:flex-row items-center justify-end gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleStatusChange(selected.id, 'accepted')}
                  disabled={actionLoadingId === selected.id || selected.status === 'accepted'}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold transition transform active:scale-95 shadow-md disabled:opacity-40"
                >
                  <Check size={14} />
                  <span>قبول وتعيين المتقدم فوراً</span>
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
