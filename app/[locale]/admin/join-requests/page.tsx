import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Download, ExternalLink, CheckCircle, XCircle, 
  Clock, Award, Users, ChevronLeft, ChevronRight, RefreshCw, 
  FileText, ShieldAlert, Check, X, MapPin, Briefcase, GraduationCap 
} from 'lucide-react';

// --- 1. الخرائط الرسمية الموحدة لتحويل البيانات وتطهيرها (Official Mapping) ---

const SECTOR_TRANSLATIONS: Record<string, string> = {
  // الحالات المكتوبة بالعربية في الاستمارة
  "التسويق والاعلام الرقمي": "Marketing & Digital Media",
  "ادارة الموارد البشرية": "Human Resources",
  "التخطيط الاستراتيجي": "Strategic Planning",
  "التنظيم واللوجستيات": "Logistics & Organization",
  "التدريب والتطوير المهني": "Training & Professional Development",
  "التنمية المستدامة": "Sustainable Development",
  "الترفيه والثقافة": "Entertainment & Culture",
  // الاحتياط في حال إدخالها بالإنجليزية مشوهة أو صغيرة
  "marketing & digital media": "Marketing & Digital Media",
  "human resources": "Human Resources",
  "strategic planning": "Strategic Planning",
  "logistics & organization": "Logistics & Organization",
  "training & professional development": "Training & Professional Development",
  "sustainable development": "Sustainable Development",
  "entertainment & culture": "Entertainment & Culture"
};

const CITY_TRANSLATIONS: Record<string, string> = {
  // المحافظات الإضافية والحدودية المطلوبة
  "شمال سيناء": "North Sinai",
  "جنوب سيناء": "South Sinai",
  "البحر الأحمر": "Red Sea",
  "الوادي الجديد": "New Valley",
  "مطروح": "Matrouh",
  // باقي المحافظات الأساسية لضمان التغطية الكاملة 100%
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

// دالة لتنظيف الروابط وتأمينها تماماً ضد أخطاء المسارات الداخلية والمحلية
const safeLink = (url: string | null): string => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

// دالة توحيد قيمة الموقف الحالي ليكون دائماً member بالإنجليزية وثابتة
const normalizeRole = (role: string | null): string => {
  if (!role) return "member";
  const r = role.toLowerCase().trim();
  if (r === "عضو" || r === "member") return "member";
  return r;
};

// تعريف هيكل بيانات المتقدم للربط مع Supabase (الحقول الـ 11 الجديدة)
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
  sector: string;
  role: string;
  facebook: string;
  cv_link: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  leadership_interest?: boolean;
}

interface DashboardProps {
  initialData: RequestData[];
  onStatusUpdate: (id: string, newStatus: 'accepted' | 'rejected') => Promise<boolean>;
  onRefreshData: () => Promise<void>;
}

export default function CompleteAdminDashboard({ initialData, onStatusUpdate, onRefreshData }: DashboardProps) {
  // الحالات الافتراضية للفلاتر والبحث والصفحات
  const [requests, setRequests] = useState<RequestData[]>(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [selected, setSelected] = useState<RequestData | null>(null);
  
  // حالات الـ Pagination للأعداد الكبيرة من المتقدمين
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // حالات التحميل التفاعلية والعمليات الحية
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // تحديث الحالة المحلية فور تغير الـ initialData القادمة من الـ Props السيرفر
  useEffect(() => {
    setRequests(initialData);
  }, [initialData]);

  // إخفاء الإشعارات التلقائي بعد فترة زمنية محددة لراحة العين
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // تحديث البيانات يدوياً وإعادة جلبها من الـ Supabase Backend
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

  // معالجة تغيير حالة المتقدم (قبول / رفض) بشكل حي مع السوبابيز
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

  // --- 2. معالجة البيانات وتوحيدها بالكامل عبر خط المزامنة (Data Cleaning Pipeline) ---
  const normalizedRequests = useMemo(() => {
    return requests.map(req => ({
      ...req,
      sector: SECTOR_TRANSLATIONS[req.sector.trim()] || req.sector,
      city: CITY_TRANSLATIONS[req.city.trim()] || req.city,
      role: normalizeRole(req.role)
    }));
  }, [requests]);

  // --- 3. نظام البحث الذكي والفلاتر المتقدمة الشامل والعميق ---
  const filteredRequests = useMemo(() => {
    return normalizedRequests.filter((r) => {
      const s = search.toLowerCase().trim();
      
      // نظام البحث الذكي الخارق (يغطي حقول التحديث الـ 11 الجديدة بالكامل)
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
      const matchesSector = sectorFilter === 'all' || r.sector === sectorFilter;
      const matchesCity = cityFilter === 'all' || r.city.toLowerCase() === cityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesSector && matchesCity;
    });
  }, [normalizedRequests, search, statusFilter, sectorFilter, cityFilter]);

  // إعادة التوجيه التلقائي للصفحة الأولى عند تغيير أي فلتر لمنع تضارب الفهرسة
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sectorFilter, cityFilter]);

  // --- 4. حساب العدادات الإحصائية المتقدمة والتحليلات الديموغرافية لقطاع الـ MEAL ---
  const stats = useMemo(() => {
    const total = normalizedRequests.length;
    const pending = normalizedRequests.filter(r => r.status === 'pending').length;
    const accepted = normalizedRequests.filter(r => r.status === 'accepted').length;
    const rejected = normalizedRequests.filter(r => r.status === 'rejected').length;
    
    // حساب معدل القبول العام ديناميكياً
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';

    // تحديد الكلية الأكثر تكراراً وإقبالاً كمؤشر إحصائي استراتيجي
    const facultyCounts: Record<string, number> = {};
    normalizedRequests.forEach(r => { 
      if (r.faculty) facultyCounts[r.faculty] = (facultyCounts[r.faculty] || 0) + 1; 
    });
    const topFaculty = Object.entries(facultyCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

    // حساب المحافظة الأكثر تفاعلاً بالطلبات
    const cityCounts: Record<string, number> = {};
    normalizedRequests.forEach(r => {
      if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1;
    });
    const topCity = Object.entries(cityCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'لا يوجد';

    return { total, pending, accepted, rejected, acceptanceRate, topFaculty, topCity };
  }, [normalizedRequests]);

  // --- 5. حسابات تقسيم الصفحات (Pagination Calculations) للأعداد الضخمة ---
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);
  // --- 6. دالة تصدير شيت الـ Excel النظيف والمطابق للأسئلة والأدمن 100% ---
  const exportToCSV = () => {
    // أسماء الأعمدة مطابقة تماماً لأسئلة الاستمارة الرسمية الحالية ولأعمدة الأدمن للـ MEAL
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
      `'${r.national_id}`, // لمنع الإكسيل من تخريب الأرقام القومية الكبيرة أو إخفاء الصفر
      `'${r.phone}`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.city}"`,
      `"${r.university.replace(/"/g, '""')}"`,
      `"${r.faculty.replace(/"/g, '""')}"`,
      `"${r.grade}"`,
      `"${r.sector}"`,
      `"${r.role}"`,
      `"${r.facebook}"`,
      `"${r.cv_link}"`,
      `"${r.status}"`
    ]);

    // توحيد ترميز الملف (BOM UTF-8) لتجنب تشوه الكلمات والرموز العربية داخل Excel
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
            title="تحديث ومزامنة البيانات من سوبابيز"
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
        
        {/* مؤشرات التحليل الديموغرافي وقياس الأداء الحصرية */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">نسبة القبول العامة</p><h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.acceptanceRate}%</h3></div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Award size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">الكلية الأعلى إقبالاً</p><h3 className="text-xs font-extrabold text-purple-700 mt-2 truncate w-24" title={stats.topFaculty}>{stats.topFaculty}</h3></div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><GraduationCap size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-xs text-gray-400">المحافظة الأكثر تفاعلاً</p><h3 className="text-xs font-extrabold text-teal-700 mt-2 truncate w-24" title={stats.topCity}>{stats.topCity}</h3></div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><MapPin size={20}/></div>
        </div>
      </div>

      {/* شريط أدوات الفلترة والبحث الذكي الشامل والعميق */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center mb-6">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute right-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث ذكي بالاسم، الرقم القومي، رقم الهاتف، الكلية، الفرقة الدراسية..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50/30"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* تصفية الحالات الإدارية */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Filter size={14} className="text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-gray-700 cursor-pointer">
              <option value="all">كل الحالات الإدارية</option>
              <option value="pending">قيد الانتظار (معلق)</option>
              <option value="accepted">تم قبولهم</option>
              <option value="rejected">تم استبعادهم</option>
            </select>
          </div>

          {/* تصفية القطاعات الـ 7 الرسمية لمبادرة SkillUp بالإنجليزية */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Briefcase size={14} className="text-gray-400" />
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-gray-700 cursor-pointer">
              <option value="all">كل القطاعات الفنية (7)</option>
              <option value="Marketing & Digital Media">Marketing & Digital Media</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Strategic Planning">Strategic Planning</option>
              <option value="Logistics & Organization">Logistics & Organization</option>
              <option value="Training & Professional Development">Training & Professional Development</option>
              <option value="Sustainable Development">Sustainable Development</option>
              <option value="Entertainment & Culture">Entertainment & Culture</option>
            </select>
          </div>

          {/* تصفية المحافظات بالكامل شاملة المحافظات الحدودية الجديدة (EN) */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <MapPin size={14} className="text-gray-400" />
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="text-xs font-bold bg-transparent focus:outline-none text-gray-700 cursor-pointer">
              <option value="all">كل المحافظات (EN)</option>
              {Object.values(CITY_TRANSLATIONS).filter((v, i, a) => a.indexOf(v) === i).sort().map(cityName => (
                <option key={cityName} value={cityName}>{cityName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* جدول البيانات الرئيسي */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-bold tracking-wide">
                <th className="p-4">بيانات المتقدم الأساسية</th>
                <th className="p-4">الخلفية التعليمية والأكاديمية</th>
                <th className="p-4">المحافظة</th>
                <th className="p-4">القطاع المطلوب الرسمي</th>
                <th className="p-4">الموقف الحالي بالسيستم</th>
                <th className="p-4">حالة الطلب الإدارية</th>
                <th className="p-4 text-center">إجراءات المراجعة والجدولة</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {paginatedRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/40 transition duration-150">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{req.full_name}</div>
                    <div className="text-xs font-mono text-gray-400 mt-1">{req.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-gray-800">{req.faculty}</div>
                    <div className="text-xs text-gray-400 mt-1">{req.university} - الفرقة {req.grade}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-200/50">
                      {req.city}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-blue-600 text-xs">{req.sector}</td>
                  <td className="p-4">
                    <span className="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                      {req.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      req.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-100' :
                      req.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' : 
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
                        className="p-1 text-green-600 hover:bg-green-50 rounded border border-transparent hover:border-green-200 transition disabled:opacity-30"
                        title="قبول طلب المتقدم فوراً"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.id, 'rejected')}
                        disabled={actionLoadingId === req.id || req.status === 'rejected'}
                        className="p-1 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition disabled:opacity-30"
                        title="استبعاد طلب المتقدم فوراً"
                      >
                        <X size={16} />
                      </button>
                      <div className="h-4 w-px bg-gray-200 mx-1"></div>
                      <button 
                        onClick={() => setSelected(req)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-extrabold underline px-1"
                      >
                        الملف الكامل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* واجهة عدم وجود بيانات */}
        {filteredRequests.length === 0 && (
          <div className="p-12 text-center text-gray-400 bg-white flex flex-col items-center justify-center gap-2">
            <ShieldAlert size={32} className="text-gray-300" />
            <p className="text-sm">لا توجد طلبات انضمام تطابق فلاتر التصفية أو محددات البحث الذكي الحالية.</p>
          </div>
        )}

        {/* شريط التحكم في الصفحات وجدولة الأعداد الضخمة (Pagination Controls) */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
          <div>
            عرض {Math.min(filteredRequests.length, (currentPage - 1) * itemsPerPage + 1)} إلى{" "}
            {Math.min(filteredRequests.length, currentPage * itemsPerPage)} من أصل{" "}
            <span className="text-gray-800 font-extrabold">{filteredRequests.length}</span> طلب متاح.
          </div>
          
          <div className="flex items-center gap-2" dir="ltr">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition disabled:opacity-40 shadow-sm"
            >
              <ChevronLeft size={14} />
            </button>
            
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold">
              صفحة {currentPage} من {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition disabled:opacity-40 shadow-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* مودال تفاصيل المتقدم الشامل والمطور الآمن من الـ Bad Paths */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* عنوان المودال */}
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-800">الملف التفصيلي للمتقدم للانضمام</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">ID: {selected.id}</p>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold leading-none p-1"
              >
                ×
              </button>
            </div>
            
            {/* جسم البيانات المفصلة للمتقدم */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              
              <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-50">
                <p className="text-xs text-gray-400">الاسم بالكامل (رباعي):</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selected.full_name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">الالرقم القومي (14 رقم):</p>
                  <p className="text-sm font-mono font-bold text-gray-800 bg-gray-50 px-2 py-1.5 rounded mt-1 border border-gray-100">
                    {selected.national_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">رقم الهاتف (واتساب):</p>
                  <p className="text-sm font-mono font-bold text-gray-800 bg-gray-50 px-2 py-1.5 rounded mt-1 border border-gray-100">
                    {selected.phone}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400">البريد الإلكتروني المعتمد:</p>
                <p className="text-sm font-mono text-gray-800 mt-1 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                  {selected.email}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">الجامعة:</p>
                  <p className="text-xs font-bold text-gray-800 mt-1">{selected.university}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">الكلية:</p>
                  <p className="text-xs font-bold text-gray-800 mt-1">{selected.faculty}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">الفرقة الدراسية:</p>
                  <p className="text-xs font-bold text-gray-800 mt-1">{selected.grade}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-gray-400">القطاع الفني المستهدف:</p>
                  <p className="text-xs font-extrabold text-blue-600 mt-1 flex items-center gap-1">
                    <Briefcase size={14} />
                    {selected.sector}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">الموقف الافتراضي بالسيستم:</p>
                  <p className="text-xs font-mono font-bold text-purple-700 mt-1">
                    {selected.role}
                  </p>
                </div>
              </div>

              {/* أزرار الروابط الخارجية المحمية من المسارات المشوهة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <a 
                  href={safeLink(selected.facebook)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-blue-200 text-blue-600 bg-blue-50/30 hover:bg-blue-50 p-2.5 rounded-lg text-xs font-bold transition"
                >
                  <ExternalLink size={14} />
                  معاينة حساب فيسبوك
                </a>
                <a 
                  href={safeLink(selected.cv_link)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white p-2.5 rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <FileText size={14} />
                  مراجعة السيرة الذاتية (CV)
                </a>
              </div>
            </div>
            
            {/* أزرار اتخاذ القرار الفورية من المودال لقطاع الـ MEAL والـ HR */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(selected.id, 'accepted')}
                  disabled={actionLoadingId === selected.id || selected.status === 'accepted'}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition"
                >
                  <Check size={14} />
                  قبول الانضمام
                </button>
                <button
                  onClick={() => handleStatusChange(selected.id, 'rejected')}
                  disabled={actionLoadingId === selected.id || selected.status === 'rejected'}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition"
                >
                  <X size={14} />
                  استبعاد الطلب
                </button>
              </div>
              
              <button 
                onClick={() => setSelected(null)} 
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition"
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
