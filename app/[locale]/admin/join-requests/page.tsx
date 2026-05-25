import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Download, ExternalLink, CheckCircle, XCircle, 
  Clock, Award, Users, ChevronLeft, ChevronRight, RefreshCw, 
  FileText, ShieldAlert, Check, X, MapPin, Briefcase, GraduationCap 
} from 'lucide-react';

// --- 1. الخرائط الرسمية الموحدة لتحويل البيانات وتطهيرها (Official Mapping) ---

const SECTOR_TRANSLATIONS: Record<string, string> = {
  // مطابقة الـ Slugs القادمة من الفورم مباشرة لمنع أي تعارض في الفلترة
  "marketing-digital-media": "Marketing & Digital Media",
  "human-resources": "Human Resources",
  "strategic-planning": "Strategic Planning",
  "logistics-organization": "Logistics & Organization",
  "training-development": "Training & Professional Development",
  "sustainable-development": "Sustainable Development",
  "entertainment-culture": "Entertainment & Culture",
  // الاحتياط للحالات المكتوبة بالعربية
  "التسويق والاعلام الرقمي": "Marketing & Digital Media",
  "التسويق والإعلام الرقمي": "Marketing & Digital Media",
  "ادارة الموارد البشرية": "Human Resources",
  "إدارة الموارد البشرية": "Human Resources",
  "التخطيط الاستراتيجي": "Strategic Planning",
  "التنظيم واللوجستيات": "Logistics & Organization",
  "التنظيم واللوجيستيات": "Logistics & Organization",
  "التدريب والتطوير المهني": "Training & Professional Development",
  "التنمية المستدامة": "Sustainable Development",
  "الترفيه والثقافة": "Entertainment & Culture"
};

const CITY_TRANSLATIONS: Record<string, string> = {
  "شمال سيناء": "North Sinai",
  "جنوب سيناء": "South Sinai",
  "البحر الأحمر": "Red Sea",
  "الوادي الجديد": "New Valley",
  "مطروح": "Matrouh",
  "القاهرة": "Cairo",
  "الجيزة": "Giza",
  "الإسكندرية": "Alexandria",
  "الدقهلية": "Dakahlia",
  "الشرقية": "Sharqia",
  "العريش": "North Sinai", 
  "طور سيناء": "South Sinai",
  "الغردقة": "Red Sea",
  "الخارجة": "New Valley",
  "مرسى مطروح": "Matrouh",
  "القليوبية": "Qalyubia",
  "الغربية": "Gharbia",
  "المنوفية": "Monufia",
  "الفيوم": "Fayoum",
  "البحيرة": "Beheira",
  "الإسماعيلية": "Ismailia",
  "السويس": "Suez",
  "بورسعيد": "Port Said",
  "دمياط": "Damietta",
  "المنيا": "Minya",
  "أسيوط": "Asyut",
  "سوهاج": "Sohag",
  "قنا": "Qena",
  "الأقصر": "Luxor",
  "أسوان": "Aswan",
  "كفر الشيخ": "Kafr El-Sheikh",
  "بني سويف": "Beni Suef"
};

const safeLink = (url: string | null): string => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

const normalizeRole = (role: string | null): string => {
  if (!role) return "member";
  const r = role.toLowerCase().trim();
  if (r === "عضو" || r === "member") return "member";
  return r;
};

// تم تعديل حقول الواجهة لتطابق أسماء حقول الإرسال بالفورم (resume_url و sector_key و نصية القيادة)
interface RequestData {
  id: string;
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  city: string;
  university: string;
  faculty: string;
  grade: string;
  sector_key: string; 
  member_status: string;
  facebook: string;
  resume_url: string; 
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  leadership_interest?: string; 
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
  const [selected, setSelected] = useState<RequestData | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const normalizedRequests = useMemo(() => {
    return requests.map(req => ({
      ...req,
      sector_key: SECTOR_TRANSLATIONS[req.sector_key?.trim()] || req.sector_key,
      city: CITY_TRANSLATIONS[req.city?.trim()] || req.city,
      member_status: normalizeRole(req.member_status)
    }));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return normalizedRequests.filter((r) => {
      const s = search.toLowerCase().trim();
      
      const matchesSearch = !s || 
        (r.full_name?.toLowerCase() ?? "").includes(s) ||
        (r.email?.toLowerCase() ?? "").includes(s) ||
        (r.phone ?? "").includes(s) ||
        (r.national_id ?? "").includes(s) ||
        (r.faculty ?? "").toLowerCase().includes(s) ||
        (r.grade ?? "").toLowerCase().includes(s) ||
        (r.city ?? "").toLowerCase().includes(s) ||
        (r.university ?? "").toLowerCase().includes(s);

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSector = sectorFilter === 'all' || r.sector_key === sectorFilter;
      const matchesCity = cityFilter === 'all' || r.city.toLowerCase() === cityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesSector && matchesCity;
    });
  }, [normalizedRequests, search, statusFilter, sectorFilter, cityFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sectorFilter, cityFilter]);

  const stats = useMemo(() => {
    const total = normalizedRequests.length;
    const pending = normalizedRequests.filter(r => r.status === 'pending').length;
    const accepted = normalizedRequests.filter(r => r.status === 'accepted').length;
    const rejected = normalizedRequests.filter(r => r.status === 'rejected').length;
    
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';

    const facultyCounts: Record<string, number> = {};
    normalizedRequests.forEach(r => { 
      if (r.faculty) facultyCounts[r.faculty] = (facultyCounts[r.faculty] || 0) + 1; 
    });
    const topFaculty = Object.entries(facultyCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

    const cityCounts: Record<string, number> = {};
    normalizedRequests.forEach(r => {
      if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1;
    });
    const topCity = Object.entries(cityCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

    return { total, pending, accepted, rejected, acceptanceRate, topFaculty, topCity };
  }, [normalizedRequests]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const exportToCSV = () => {
    const headers = [
      "الاسم بالكامل", 
      "الرقم القومي", 
      "رقم الهاتف (واتساب)", 
      "البريد الإلكتروني", 
      "المحافظة (EN)", 
      "الجامعة", 
      "الكلية", 
      "الفرقة الدراسية", 
      "القطاع المطلوب", 
      "الموقف الحالي", 
      "رابط حساب فيسبوك", 
      "رابط السيرة الذاتية CV", 
      "حالة الطلب في المبادرة"
    ];

    const rows = filteredRequests.map(r => [
      `"${r.full_name.replace(/"/g, '""')}"`,
      `'${r.national_id}`, 
      `'${r.phone}`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.city}"`,
      `"${r.university.replace(/"/g, '""')}"`,
      `"${r.faculty.replace(/"/g, '""')}"`,
      `"${r.grade}"`,
      `"${r.sector_key}"`,
      `"${r.member_status}"`,
      `"${r.facebook}"`,
      `"${r.resume_url}"`,
      `"${r.status}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SkillUp_Official_MEAL_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

return (
    <div className="p-6 bg-gray-50 min-h-screen text-right font-sans" dir="rtl">
      
      {/* نظام الإشعارات العائمة للتنبيه بالعمليات الحية */}
      {notification && (
        <div className={`fixed top-5 left-5 z-50 p-4 rounded-xl shadow-xl border text-sm font-bold transition-all transform animate-bounce flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          {notification.message}
        </div>
      )}

      {/* الهيدر وعناوين لوحة التحكم */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            منظومة إدارة وجدولة طلبات الانضمام الرسمية 🚀
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            قطاع المتابعة والتقييم والمساءلة والتعلم (MEAL) | التخطيط الاستراتيجي لمبادرة SkillUp
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg transition disabled:opacity-50 shadow-sm"
            title="تحديث ومزامنة البيانات من قاعدة البيانات"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg transition text-sm font-bold flex-1 md:flex-none shadow-sm"
          >
            <Download size={18} />
            تصدير التقرير الموحد النظيف (Excel)
          </button>
        </div>
      </div>

      {/* صف العدادات الإحصائية والتحليلية المتطورة لقطاع الـ MEAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">إجمالي الطلبات</p><h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</h3></div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">طلبات معلقة</p><h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</h3></div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">المقبولين</p><h3 className="text-2xl font-bold text-green-600 mt-1">{stats.accepted}</h3></div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">المستبعدين</p><h3 className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</h3></div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><XCircle size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">نسبة القبول العامة</p><h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.acceptanceRate}%</h3></div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Award size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">الكلية الأعلى إقبالاً</p><h3 className="text-xs font-extrabold text-purple-700 mt-2 truncate w-24" title={stats.topFaculty}>{stats.topFaculty}</h3></div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><GraduationCap size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">المحافظة الأكثر تفاعلاً</p><h3 className="text-sm font-bold text-teal-600 mt-1">{stats.topCity}</h3></div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><MapPin size={20}/></div>
        </div>
      </div>

      {/* قسم الفلترة والبحث المتقدم السريع */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="البحث بالاسم، الهاتف، الرقم القومي، الكلية، الجامعة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition shadow-sm text-right"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-500"
          >
            <option value="all">كل الحالات</option>
            <option value="pending">معلق</option>
            <option value="accepted">مقبول</option>
            <option value="rejected">مستبعد</option>
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-500"
          >
            <option value="all">كل القطاعات</option>
            {Object.values(SECTOR_TRANSLATIONS).filter((v, i, a) => a.indexOf(v) === i).map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-indigo-500"
          >
            <option value="all">كل المحافظات</option>
            {Object.values(CITY_TRANSLATIONS).filter((v, i, a) => a.indexOf(v) === i).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول عرض البيانات المنظم للـ MEAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm font-semibold">
                <th className="p-4">الاسم بالكامل</th>
                <th className="p-4">القطاع المطلوب</th>
                <th className="p-4">المحافظة</th>
                <th className="p-4">الكلية والفرقة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-50">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-400">لا توجد طلبات مطابقة لفلاتر البحث الحالية.</td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-medium text-gray-950">{req.full_name}</td>
                    <td className="p-4 text-indigo-600 font-semibold">{req.sector_key}</td>
                    <td className="p-4 text-gray-600">{req.city}</td>
                    <td className="p-4 text-gray-500">{req.faculty} - {req.grade}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'accepted' ? 'bg-green-50 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {req.status === 'accepted' ? 'مقبول' : req.status === 'rejected' ? 'مستبعد' : 'معلق'}
                      </span>
                    </td>
                    <td className="p-4 text-center flex items-center justify-center">
                      <button
                        onClick={() => setSelected(req)}
                        className="text-xs px-3 py-1.5 border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 text-gray-600 rounded-lg transition font-medium"
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* أزرار التنقل بين الصفحات (Pagination Panel) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-50 flex justify-between items-center bg-gray-50/50">
            <span className="text-xs text-gray-500">الصفحة {currentPage} من {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* نافذة تفاصيل المتقدم المنبثقة الشاملة (Modal Display) */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div className="text-right">
                <h2 className="text-lg font-bold text-gray-900">{selected.full_name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">معرف المتقدم الفوري: {selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">الرقم القومي</span>
                  <span className="text-sm font-medium text-gray-800">{selected.national_id}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">رقم الهاتف (واتساب)</span>
                  <span className="text-sm font-medium text-gray-800" dir="ltr">{selected.phone}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">البريد الإلكتروني</span>
                  <span className="text-sm font-medium text-gray-800">{selected.email}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">المحافظة السكنية</span>
                  <span className="text-sm font-medium text-gray-800">{selected.city}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">الجامعة والكلية</span>
                  <span className="text-sm font-medium text-gray-800">{selected.university} - {selected.faculty}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">الفرقة الدراسية الحالية</span>
                  <span className="text-sm font-medium text-gray-800">{selected.grade}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">القطاع الموجه إليه الطلب</span>
                  <span className="text-sm font-bold text-indigo-600">{selected.sector_key}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block">الموقف والصفة الأساسية</span>
                  <span className="text-sm font-medium text-gray-800">{selected.member_status}</span>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs text-gray-400 block">الرغبة في المسؤولية والمهام القيادية</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selected.leadership_interest === 'ready' ? 'أرغب وجاهز لتولي مسؤولية قيادية داخل الهيكل المباشر' : 'بأهل نفسي حالياً للقيادة مستقبلاً'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-start">
                <a
                  href={safeLink(selected.facebook)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition"
                >
                  <ExternalLink size={14} /> فتح ملف فيسبوك الشخصي
                </a>
                <a
                  href={safeLink(selected.resume_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 font-medium rounded-lg hover:bg-purple-100 transition"
                >
                  <FileText size={14} /> فحص السيرة الذاتية (CV) على درايف
                </a>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(selected.id, 'accepted')}
                  disabled={actionLoadingId === selected.id || selected.status === 'accepted'}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <Check size={14} />
                  قبول الانضمام
                </button>
                <button
                  onClick={() => handleStatusChange(selected.id, 'rejected')}
                  disabled={actionLoadingId === selected.id || selected.status === 'rejected'}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <X size={14} />
                  استبعاد الطلب
                </button>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition shadow-sm"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
