"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Props = {
  locale: "ar" | "en";
  presetSector: string;
};

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  national_id: string;
  city: string;
  address: string;
  age: string;
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
  consent: boolean;
  website: string;
  hidden_honey: string;
};

// المصفوفة المركزية الموحدة لضمان التوافق التام مع لوحة الإدارة والفرز
const SECTORS_LIST = [
  { slug: "hrm", ar: "إدارة الموارد البشرية", en: "Human Resources Management" },
  { slug: "meal", ar: "التخطيط الاستراتيجي والمتابعة والتقييم", en: "Strategic Planning & MEAL" },
  { slug: "digital-marketing", ar: "التسويق والإعلام الرقمي", en: "Marketing & Digital Media" },
  { slug: "logistics", ar: "التنظيم واللوجيستيات", en: "Logistics & Organization" },
  { slug: "sustainable-development", ar: "التنمية المستدامة", en: "Sustainable Development" },
  { slug: "training-development", ar: "التدريب والتطوير المهني", en: "Training & Professional Development" },
  { slug: "culture-entertainment", ar: "الترفيه والثقافة", en: "Entertainment & Culture" }
];

// قائمة محافظات جمهورية مصر العربية كاملة بدون إسقاط
const EGYPT_GOVERNORATES = [
  { ar: "القاهرة", en: "Cairo" },
  { ar: "الجيزة", en: "Giza" },
  { ar: "الإسكندرية", en: "Alexandria" },
  { ar: "الدقهلية", en: "Dakahlia" },
  { ar: "البحر الأحمر", en: "Red Sea" },
  { ar: "البحيرة", en: "Beheira" },
  { ar: "الفيوم", en: "Fayoum" },
  { ar: "الغربية", en: "Gharbia" },
  { ar: "الإسماعيلية", en: "Ismailia" },
  { ar: "المنوفية", en: "Monufia" },
  { ar: "المنيا", en: "Minya" },
  { ar: "القليوبية", en: "Qalyubia" },
  { ar: "الوادي الجديد", en: "New Valley" },
  { ar: "السويس", en: "Suez" },
  { ar: "الشرقية", en: "Sharqia" },
  { ar: "أسوان", en: "Aswan" },
  { ar: "أسيوط", en: "Asyut" },
  { ar: "بني سويف", en: "Beni Suef" },
  { ar: "بورسعيد", en: "Port Said" },
  { ar: "دمياط", en: "Damietta" },
  { ar: "جنوب سيناء", en: "South Sinai" },
  { ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  { ar: "مطروح", en: "Matrouh" },
  { ar: "الأقصر", en: "Luxor" },
  { ar: "قنا", en: "Qena" },
  { ar: "شمال سيناء", en: "North Sinai" },
  { ar: "سوهاج", en: "Sohag" }
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidNationalId(value: string) {
  return /^\d{14}$/.test(value.trim());
}

function getSafeSectorKey(value: string) {
  const found = SECTORS_LIST.find((s) => s.slug === value);
  return found ? found.slug : "training-development";
}

export default function JoinForm({ locale, presetSector }: Props) {
  const isAr = locale === "ar";
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const t = useMemo(() => {
    const ar = {
      title: "انضم إلى فريق SkillUp",
      sub: "املأ النموذج بدقة، وسيقوم فريق المتابعة والتقييم بمراجعة طلبك وتحديد المسار الأنسب لك.",
      section1: "البيانات الأساسية للمتقدم",
      section2: "الخلفية التعليمية والمهنية",
      section3: "التفضيلات والاهتمامات داخل المبادرة",
      section4: "الروابط ورسالة الدوافع وإقرار الجدية",
      name: "الاسم الكامل (رباعي كما هو بالبطاقة)",
      email: "البريد الإلكتروني الحالي",
      phone: "رقم الهاتف (واتساب فعّال)",
      nationalId: "الرقم القومي (14 رقم بالكامل)",
      city: "المحافظة",
      address: "العنوان الحالي بالتفصيل (المركز / الحي / الشارع)",
      age: "العمر",
      gender: "النوع",
      memberStatus: "صفة العضوية المرغوبة",
      leadershipInterest: "هل لديك رغبة في تولي مناصب قيادية مستقبلاً؟",
      education: "الحالة التعليمية الحالية",
      grade: "الفرقة الدراسية أو الصف",
      university: "الجامعة / المعهد التعليمي",
      faculty: "الكلية / المدرسة",
      department: "التخصص الدراسي / القسم",
      postgradInfo: "بيانات وتخصص الدراسات العليا (إن وجد)",
      graduation: "سنة التخرج",
      profilePicture: "رابط الصورة الشخصية (يرجى رفعها على Google Drive ووضع الرابط هنا بشكل عام)",
      sector: "القطاع الرئيسي المراد الانضمام إليه",
      role: "الدور أو المسؤولية المفضلة لديك داخل القطاع",
      availability: "عدد الساعات المتاحة للتطوع أسبوعياً",
      heardAboutUs: "كيف تعرفت على مبادرة SkillUp؟",
      skills: "المهارات الأساسية التي تتقنها (التقنية والشخصية)",
      experience: "الخبرات السابقة، المبادرات، أو الأنشطة الطلابية التي شاركت بها بالتفصيل",
      linkedin: "رابط حساب لينكد إن الخاص بك (اختياري)",
      facebook: "رابط حساب فيسبوك الخاص بك (اختياري)",
      portfolio: "رابط معرض أعمالك Portfolio / Behance / GitHub (اختياري)",
      resumeUrl: "رابط السيرة الذاتية CV (يرجى رفعه على Google Drive ووضع الرابط مفتوحاً للجميع)",
      message: "لماذا ترغب في الانضمام إلى مبادرة SkillUp تحديداً؟ وماذا تتوقع منا؟",
      consent: "أقر وأتعهد بأن جميع البيانات والمعلومات المسجلة أعلاه صحيحة تماماً وعلى مسؤوليتي الشخصية، وأوافق على قيام فريق التقييم بالتواصل معي عبر الهاتف أو الواتساب.",
      submit: "إرسال طلب الانضمام الرسمي",
      next: "الخطوة التالية",
      prev: "الرجوع للخلف",
      stepOf: "الخطوة {step} من أصل 4 خطوات",
      sending: "جاري تشفير وإرسال البيانات بأمان...",
      ok: "تم تسجيل وتأمين بياناتك بنجاح! سيقوم فريق المتابعة والتقييم (MEAL) بالاتصال بك في أقرب وقت.",
      anotherResponse: "إرسال طلب جديد باسم آخر",
      errRequired: "برجاء التأكد من ملء جميع الحقول الإجبارية التي تحتوي على علامة (*) قبل الانتقال.",
      errEmail: "البريد الإلكتروني المكتوب غير صحيح، يرجى كتابته بشكل سليم (اسم@نطاق.كوم).",
      errNationalId: "الرقم القومي غير صحيح، يجب أن يتكون من 14 رقماً كاملاً بدون أي حروف.",
      errAge: "العمر غير منطقي، يرجى إدخال عمر صحيح يقع بين 15 و 70 عاماً.",
      selectGovernorate: "اختر المحافظة من القائمة",
      selectOption: "اختر الخيار المناسب...",
      genderOptions: { male: "ذكر", female: "أنثى" },
      memberOptions: { member: "عضو متطوع (ترغب في التعلم والمشاركة)", expert: "خبير وموجه (لديك خبرة عملية سابقة في المجال)" },
      leadershipOptions: { ready: "نعم، أرغب وجاهز تماماً لتولي مسؤولية وإدارة فريق", learning: "في الوقت الحالي أرغب في العمل كعضو وصقل مهاراتي أولاً" },
      educationOptions: { student: "طالب جامعي", graduate: "خريج", postgrad: "طالب دراسات عليا (ماجستير/دبلومة)", school: "طالب في المرحلة الثانوية" },
      gradeOptions: { g1: "الفرقة الأولى / الصف الأول", g2: "الفرقة الثانية / الصف الثاني", g3: "الفرقة الثالثة / الصف الثالث", g4: "الفرقة الرابعة / الصف الرابع", g5: "الفرقة الخامسة", g6: "الفرقة السادسة / السابعة", grad: "خريج بالفعل" },
      heardOptions: { facebook: "منصة فيسبوك (Facebook)", linkedin: "منصة لينكد إن (LinkedIn)", friend: "عن طريق ترشيح من صديق أو زميل", university: "ندوة أو إعلان داخل الجامعة", other: "وسائل وأماكن أخرى" },
      placeholders: {
        name: "اكتب اسمك كاملاً كما هو مدون في بطاقة الرقم القومي",
        id: "أدخل الـ 14 رقماً من اليسار إلى اليمين باللغة الإنجليزية",
        phone: "رقم الموبايل المربوط بحساب الواتساب الخاص بك",
        address: "اكتب اسم المدينة، الشارع، ورقم العقار إن وجد لسهولة التواصل والتوزيع الجغرافي",
        university: "مثال: جامعة القاهرة / جامعة عين شمس / معهد تكنولوجي",
        faculty: "مثال: كلية الهندسة / كلية التجارة / كلية الآداب",
        department: "مثال: قسم نظم المعلومات / قسم المحاسبة / عام",
        postgrad: "اكتب التخصص الأكاديمي الحالي للدراسات العليا",
        url: "https://drive.google.com/...",
        role: "مثال: صانع محتوى / منسق علاقات عامة / مدرب محترف / مصمم جرافيك",
        availability: "مثال: 12 ساعة أسبوعياً موزعة على أيام معينة",
        skills: "اكتب كل المهارات البرمجية، التنظيمية، اللغوية، أو الشخصية التي تمتلكها وتود استغلالها",
        experience: "اذكر الأماكن، الشركات، المبادرات، أو الأنشطة الطلابية التي عملت بها سابقاً بالتفصيل والمسمى الوظيفي الخاص بك",
        message: "عبر بكلماتك عن شغفك، أهدافك، وما الذي يمكن أن تضيفه لفريق سكيل أب عند قبولك"
      }
    };
    const en = {
      title: "Join SkillUp Team",
      sub: "Fill out the form accurately, and the MEAL team will review your application to determine the best path for you.",
      section1: "Basic Information",
      section2: "Educational & Professional Background",
      section3: "Preferences & Interests within the Initiative",
      section4: "Links, Motivation Letter & Consent",
      name: "Full Name (As in National ID)",
      email: "Current Email Address",
      phone: "Phone Number (Active WhatsApp)",
      nationalId: "National ID (14 digits)",
      city: "Governorate",
      address: "Detailed Current Address (City / District / Street)",
      age: "Age",
      gender: "Gender",
      memberStatus: "Desired Membership Status",
      leadershipInterest: "Do you have a desire to hold leadership positions in the future?",
      education: "Current Educational Status",
      grade: "Academic Year / Grade",
      university: "University / Educational Institute",
      faculty: "Faculty / School",
      department: "Academic Department / Major",
      postgradInfo: "Postgraduate Details (If applicable)",
      graduation: "Graduation Year",
      profilePicture: "Profile Picture URL (Please upload to Google Drive and set link to public)",
      sector: "Main Sector You Wish to Join",
      role: "Preferred Role or Responsibility within the Sector",
      availability: "Available Volunteering Hours per Week",
      heardAboutUs: "How did you hear about SkillUp Initiative?",
      skills: "Core Mastered Skills (Technical & Soft Skills)",
      experience: "Previous experiences, initiatives, or student activities you participated in details",
      linkedin: "Your LinkedIn Profile URL (Optional)",
      facebook: "Your Facebook Profile URL (Optional)",
      portfolio: "Your Portfolio URL / Behance / GitHub (Optional)",
      resumeUrl: "Resume/CV Link (Please upload to Google Drive and set link access to anyone with link)",
      message: "Why do you specifically want to join SkillUp Initiative? What do you expect from us?",
      consent: "I hereby declare and confirm that all data and information registered above are completely correct under my personal responsibility, and I agree to be contacted by the evaluation team via phone or WhatsApp.",
      submit: "Submit Official Join Application",
      next: "Next Step",
      prev: "Go Back",
      stepOf: "Step {step} of 4 steps",
      sending: "Encrypting and transmitting data securely...",
      ok: "Your data has been successfully secured! The MEAL team will contact you very soon.",
      anotherResponse: "Submit another application with a different name",
      errRequired: "Please make sure to fill in all mandatory fields marked with an asterisk (*) before proceeding.",
      errEmail: "The email address entered is invalid, please type it correctly (name@domain.com).",
      errNationalId: "National ID is invalid, it must consist of exactly 14 numeric digits with no letters.",
      errAge: "Age is unrealistic, please enter a valid age between 15 and 70 years old.",
      selectGovernorate: "Select Governorate from the list",
      selectOption: "Select the appropriate option...",
      genderOptions: { male: "Male", female: "Female" },
      memberOptions: { member: "Volunteer Member (Wish to learn and participate)", expert: "Expert & Mentor (Have prior practical experience in the field)" },
      leadershipOptions: { ready: "Yes, I am willing and fully ready to take responsibility and manage a team", learning: "Currently, I prefer to work as a member and hone my skills first" },
      educationOptions: { student: "Undergraduate Student", graduate: "Graduate", postgrad: "Postgraduate Student (Master/Diploma)", school: "High School Student" },
      gradeOptions: { g1: "1st Year / Grade 1", g2: "2nd Year / Grade 2", g3: "3rd Year / Grade 3", g4: "4th Year / Grade 4", g5: "5th Year", g6: "6th / 7th Year", grad: "Already Graduated" },
      heardOptions: { facebook: "Facebook Platform", linkedin: "LinkedIn Platform", friend: "Through a recommendation from a friend or colleague", university: "Seminar or advertisement inside the university", other: "Other means and places" },
      placeholders: {
        name: "Enter your full name as it appears on your national identity card",
        id: "Enter 14 digits from left to right in English digits",
        phone: "Your mobile number connected to your active WhatsApp account",
        address: "Write the name of the city, street, and building number for ease of communication and geographical distribution",
        university: "e.g., Cairo University / Ain Shams University / Technological Institute",
        faculty: "e.g., Faculty of Engineering / Faculty of Commerce / Faculty of Arts",
        department: "e.g., Information Systems Department / Accounting Department / General",
        postgrad: "Write your current academic specialization for postgraduate studies",
        url: "https://drive.google.com/...",
        role: "e.g., Content Creator / PR Coordinator / Professional Trainer / Graphic Designer",
        availability: "e.g., 12 hours per week distributed over specific days",
        skills: "Write all programming, organizational, linguistic, or soft skills you have and want to utilize",
        experience: "Mention the places, companies, initiatives, or student activities you worked at previously with your job titles in details",
        message: "Express in your own words your passion, goals, and what you can add to the SkillUp team upon acceptance"
      }
    };
    return isAr ? ar : en;
  }, [isAr]);

  const [form, setForm] = useState<FormState>({
    full_name: "", email: "", phone: "", national_id: "", city: "", address: "",
    age: "", gender: "", member_status: "member", leadership_interest: "learning",
    education: "student", grade: "g1", university: "", faculty: "", department: "",
    postgrad_info: "", graduation_year: "", profile_picture_url: "",
    sector_key: "training-development", preferred_role: "", availability: "",
    heard_about_us: "facebook", skills: "", experience: "", linkedin: "",
    facebook: "", portfolio: "", resume_url: "", message: "", consent: false,
    website: "", hidden_honey: ""
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, sector_key: getSafeSectorKey(presetSector) }));
  }, [presetSector]);

  useEffect(() => {
    if (/^\d{14}$/.test(form.national_id)) {
      const id = form.national_id;
      const genderDigit = parseInt(id.charAt(12), 10);
      const extractedGender = genderDigit % 2 === 1 ? "male" : "female";
      
      const birthCentury = id.charAt(0) === "3" ? "20" : "19";
      const birthYear = birthCentury + id.substring(1, 3);
      const currentYear = new Date().getFullYear();
      const extractedAge = (currentYear - parseInt(birthYear, 10)).toString();

      setForm((prev) => ({
        ...prev,
        gender: prev.gender || extractedGender,
        age: prev.age || extractedAge
      }));
    }
  }, [form.national_id]);

  const updateField = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrorMsg("");
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim() || !form.national_id.trim() || !form.city || !form.address.trim() || !form.age.trim() || !form.gender) {
        setErrorMsg(t.errRequired);
        return;
      }
      if (!isValidEmail(form.email)) {
        setErrorMsg(t.errEmail);
        return;
      }
      if (!isValidNationalId(form.national_id)) {
        setErrorMsg(t.errNationalId);
        return;
      }
      const ageNum = Number(form.age);
      if (isNaN(ageNum) || ageNum < 15 || ageNum > 70) {
        setErrorMsg(t.errAge);
        return;
      }
    }
    if (currentStep === 2) {
      if (!form.university.trim() || !form.faculty.trim() || !form.department.trim() || !form.grade || !form.graduation_year.trim() || !form.experience.trim()) {
        setErrorMsg(t.errRequired);
        return;
      }
    }
    if (currentStep === 3) {
      if (!form.sector_key || !form.preferred_role.trim() || !form.availability.trim() || !form.skills.trim()) {
        setErrorMsg(t.errRequired);
        return;
      }
    }
    setCurrentStep((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.consent) return;

    // حظر الروبوتات وهجمات السبام برمجياً بشكل صامت تماماً لحماية قاعدة البيانات
    if (form.website || form.hidden_honey) {
      console.warn("Spam Bot submission filtered out securely.");
      setDone(true);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // عزل حقول السخام لعدم الإخلال بجدول السوبابيز
      const { website, hidden_honey, ...cleanData } = form;

      const { error } = await supabaseBrowser
        .from("join_requests")
        .insert([
          {
            ...cleanData,
            age: parseInt(cleanData.age, 10),
            graduation_year: parseInt(cleanData.graduation_year, 10),
            admin_status: "new" // إسناد حالة الطلب الجديد التلقائية لتظهر في قائمة الأدمن فوراً المعلقة
          }
        ]);

      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected central storage error occurred. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm outline-none transition focus:border-black/30 dark:border-white/10 dark:bg-white/[0.02] dark:focus:border-white/30 text-zinc-900 dark:text-white placeholder:text-zinc-400 font-sans text-right";
  const labelClass = "mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300 select-none text-right";

  return (
    <div className="mx-auto grid max-w-4xl gap-6" dir={isAr ? "rtl" : "ltr"}>
      {done ? (
        <section className="rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/50 text-center py-14 transition-all">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{t.title}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">{t.ok}</p>
          <button type="button" onClick={() => { setDone(false); setCurrentStep(1); setForm((p) => ({ ...p, full_name: "", email: "", phone: "", national_id: "", consent: false })); }} className="mt-8 rounded-2xl bg-zinc-900 px-6 py-3 text-xs font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900">
            {t.anotherResponse}
          </button>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/50 md:p-8">
          <div className="mb-8 border-b border-black/5 pb-5 dark:border-white/5 text-right">
            <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-white mb-1.5">{t.title}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{t.sub}</p>
            <div className="mt-4 text-[11px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 inline-block px-3 py-1 rounded-md">{t.stepOf.replace("{step}", currentStep.toString())}</div>
          </div>

          {/* حقول الأمان المخفية تماماً لمنع الروبوتات من تعبئة البيانات تلقائياً */}
          <div className="hidden" aria-hidden="true">
            <input type="text" value={form.website} onChange={(e) => updateField("website", e.target.value)} tabIndex={-1} autoComplete="off" />
            <input type="text" value={form.hidden_honey} onChange={(e) => updateField("hidden_honey", e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          {/* الخطوة الأولى: البيانات الأساسية */}
          {currentStep === 1 && (
            <div className="grid gap-5">
              <div className="border-b border-black/5 pb-2 dark:border-white/5 text-right">
                <h2 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1">📍 {t.section1}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.name} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.name} value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.nationalId} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.id} value={form.national_id} onChange={(e) => updateField("national_id", e.target.value.replace(/\D/g, ""))} maxLength={14} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.email} <span className="text-red-500">*</span></label>
                  <input type="email" className={inputClass} placeholder="example@gmail.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.phone} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.phone} value={form.phone} onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.age} <span className="text-red-500">*</span></label>
                  <input type="number" className={inputClass} placeholder="21" value={form.age} onChange={(e) => updateField("age", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.gender} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.gender} onChange={(e) => updateField("gender", e.target.value)} required>
                    <option value="">{t.selectOption}</option>
                    <option value="male">{t.genderOptions.male}</option>
                    <option value="female">{t.genderOptions.female}</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.city} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.city} onChange={(e) => updateField("city", e.target.value)} required>
                    <option value="">{t.selectGovernorate}</option>
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g.en} value={g.en}>{isAr ? g.ar : g.en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.address} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.address} value={form.address} onChange={(e) => updateField("address", e.target.value)} required />
                </div>
              </div>
            </div>
          )}

          {/* الخطوة الثانية: الخلفية التعليمية والمهنية */}
          {currentStep === 2 && (
            <div className="grid gap-5">
              <div className="border-b border-black/5 pb-2 dark:border-white/5 text-right">
                <h2 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1">🎓 {t.section2}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.education} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.education} onChange={(e) => updateField("education", e.target.value)} required>
                    {Object.entries(t.educationOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.grade} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.grade} onChange={(e) => updateField("grade", e.target.value)} required>
                    {Object.entries(t.gradeOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>{t.university} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.university} value={form.university} onChange={(e) => updateField("university", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.faculty} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.faculty} value={form.faculty} onChange={(e) => updateField("faculty", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.department} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.department} value={form.department} onChange={(e) => updateField("department", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.graduation} <span className="text-red-500">*</span></label>
                  <input type="number" className={inputClass} placeholder="2027" value={form.graduation_year} onChange={(e) => updateField("graduation_year", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.postgradInfo}</label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.postgrad} value={form.postgrad_info} onChange={(e) => updateField("postgrad_info", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.experience} <span className="text-red-500">*</span></label>
                <textarea rows={4} className={`${inputClass} resize-none`} placeholder={t.placeholders.experience} value={form.experience} onChange={(e) => updateField("experience", e.target.value)} required />
              </div>
            </div>
          )}

          {/* الخطوة الثالثة: التفضيلات والاهتمامات داخل المبادرة */}
          {currentStep === 3 && (
            <div className="grid gap-5">
              <div className="border-b border-black/5 pb-2 dark:border-white/5 text-right">
                <h2 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1">💼 {t.section3}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.sector} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.sector_key} onChange={(e) => updateField("sector_key", e.target.value)} required>
                    {SECTORS_LIST.map((s) => <option key={s.slug} value={s.slug}>{isAr ? s.ar : s.en}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.role} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.role} value={form.preferred_role} onChange={(e) => updateField("preferred_role", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>{t.availability} <span className="text-red-500">*</span></label>
                  <input type="text" className={inputClass} placeholder={t.placeholders.availability} value={form.availability} onChange={(e) => updateField("availability", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.memberStatus} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.member_status} onChange={(e) => updateField("member_status", e.target.value)} required>
                    {Object.entries(t.memberOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.leadershipInterest} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.leadership_interest} onChange={(e) => updateField("leadership_interest", e.target.value)} required>
                    {Object.entries(t.leadershipOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t.skills} <span className="text-red-500">*</span></label>
                <textarea rows={4} className={`${inputClass} resize-none`} placeholder={t.placeholders.skills} value={form.skills} onChange={(e) => updateField("skills", e.target.value)} required />
              </div>
            </div>
          )}

          {/* الخطوة الرابعة: الروابط ورسالة الدوافع والموافقة */}
          {currentStep === 4 && (
            <div className="grid gap-5">
              <div className="border-b border-black/5 pb-2 dark:border-white/5 text-right">
                <h2 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1">🔗 {t.section4}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>{t.linkedin}</label>
                  <input type="url" className={inputClass} placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{t.facebook}</label>
                  <input type="url" className={inputClass} placeholder="https://facebook.com/..." value={form.facebook} onChange={(e) => updateField("facebook", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{t.portfolio}</label>
                  <input type="url" className={inputClass} placeholder="https://behance.net/..." value={form.portfolio} onChange={(e) => updateField("portfolio", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.resumeUrl}</label>
                  <input type="url" className={inputClass} placeholder={t.placeholders.url} value={form.resume_url} onChange={(e) => updateField("resume_url", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>{t.profilePicture} <span className="text-red-500">*</span></label>
                  <input type="url" className={inputClass} placeholder={t.placeholders.url} value={form.profile_picture_url} onChange={(e) => updateField("profile_picture_url", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>{t.message} <span className="text-red-500">*</span></label>
                  <textarea rows={4} className={`${inputClass} resize-none`} placeholder={t.placeholders.message} value={form.message} onChange={(e) => updateField("message", e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>{t.heardAboutUs} <span className="text-red-500">*</span></label>
                  <select className={inputClass} value={form.heard_about_us} onChange={(e) => updateField("heard_about_us", e.target.value)} required>
                    {Object.entries(t.heardOptions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border">
                <input id="consent" type="checkbox" checked={form.consent} onChange={(e) => updateField("consent", e.target.checked)} className="mt-1 h-4 w-4 rounded border-black/10 text-zinc-900 focus:ring-zinc-900 dark:border-white/10 dark:text-white cursor-pointer" required />
                <label htmlFor="consent" className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed select-none text-right cursor-pointer">{t.consent}</label>
              </div>
            </div>
          )}

          {/* أزرار التحكم بالتنقل عبر الخطوات */}
          <div className="mt-8 flex items-center justify-between border-t border-black/5 pt-5 dark:border-white/5">
            {currentStep > 1 ? (
              <button type="button" onClick={() => setCurrentStep((p) => p - 1)} className="rounded-2xl border border-black/10 bg-white px-6 py-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800">
                {t.prev}
              </button>
            ) : <div aria-hidden="true" />}

            {currentStep < 4 ? (
              <button type="button" onClick={handleNextStep} className="rounded-2xl bg-zinc-900 px-6 py-3 text-xs font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900">
                {t.next}
              </button>
            ) : (
              <button type="submit" disabled={loading || !form.consent} className="rounded-2xl bg-zinc-900 px-8 py-3 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900">
                {loading ? t.sending : t.submit}
              </button>
            )}
          </div>

          {/* شريط عرض الأخطاء التحذيرية الموحد */}
          {errorMsg && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-600 dark:text-red-400 text-right">
              ⚠️ {errorMsg}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
