"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

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
  age: string;
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

const SECTORS_LIST = [
  { slug: "marketing-digital-media", ar: "التسويق والإعلام الرقمي", en: "Marketing & Digital Media" },
  { slug: "human-resources", ar: "إدارة الموارد البشرية", en: "Human Resources Management" },
  { slug: "strategic-planning", ar: "التخطيط الاستراتيجي", en: "Strategic Planning" },
  { slug: "sustainable-development", ar: "التنمية المستدامة", en: "Sustainable Development" },
  { slug: "logistics-organization", ar: "التنظيم واللوجيستيات", en: "Logistics & Organization" },
  { slug: "entertainment-culture", ar: "الترفيه والثقافة", en: "Entertainment & Culture" },
  { slug: "training-development", ar: "التدريب والتطوير المهني", en: "Training & Professional Development" }
];

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

  const t = useMemo(() => {
    const ar = {
      title: "انضم إلى فريق SkillUp",
      sub: "املأ النموذج بدقة، وسيقوم فريق المتابعة والتقييم بمراجعة طلبك وتحديد المسار الأنسب لك.",
      section1: "البيانات الأساسية",
      section2: "الخلفية التعليمية والمهنية",
      section3: "التفضيلات والاهتمامات",
      section4: "رسالتك وإقرار الجدية",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      nationalId: "الرقم القومي (14 رقم)",
      city: "المحافظة",
      age: "العمر",
      memberStatus: "صفة العضوية",
      leadershipInterest: "الرغبة في القيادة",
      education: "الحالة التعليمية الحالية",
      grade: "الفرقة الدراسية",
      university: "الجامعة / المعهد",
      faculty: "الكلية",
      department: "القسم",
      postgradInfo: "بيانات الدراسات العليا (إن وجد)",
      graduation: "سنة التخرج",
      profilePicture: "رابط الصورة الشخصية (يرجى رفعها على Drive ووضع الرابط)",
      sector: "القطاع المراد الانضمام إليه",
      role: "الدور أو المسؤولية المفضلة",
      availability: "الوقت المتاح أسبوعيًا",
      heardAboutUs: "كيف سمعت عنا؟",
      skills: "المهارات الأساسية",
      experience: "خبرات أو أنشطة سابقة",
      linkedin: "رابط حساب لينكد إن (اختياري)",
      facebook: "رابط حساب فيس بوك (اختياري)",
      portfolio: "رابط معرض الأعمال Portfolio (اختياري)",
      resumeUrl: "رابط السيرة الذاتية (يرجى رفعها على Drive ووضع الرابط - اختياري)",
      message: "لماذا ترغب في الانضمام إلى SkillUp؟",
      consent: "أقر بأن جميع البيانات المسجلة صحيحة وأوافق على تواصل الفريق معي لتقييم الطلب.",
      submit: "إرسال طلب الانضمام",
      next: "التالي",
      prev: "السابق",
      stepOf: "خطوة {step} من 4",
      sending: "جاري إرسال البيانات...",
      ok: "تم تسجيل البيانات بنجاح واننا هنتواصل معاك قريباً.",
      anotherResponse: "إرسال رد آخر (فورم جديد)",
      errRequired: "برجاء استكمال جميع الحقول الإجبارية المعلّمة بنجمة (*).",
      errEmail: "يرجى إدخال بريد إلكتروني صحيح بشكل سليم.",
      errNationalId: "الرقم القومي غير صحيح، يجب أن يتكون من 14 رقماً بالضبط.",
      errAge: "يرجى إدخال عمر منطقي وصحيح (بين 15 و 70 سنة).",
      selectGovernorate: "اختر المحافظة",
      selectOption: "اختر من القائمة...",
      memberOptions: { member: "عضو", expert: "خبير (لديك خبرة كبيرة)" },
      leadershipOptions: { ready: "أرغب وجاهز لتولي مسؤولية قيادية", learning: "بأهل نفسي لسه" },
      educationOptions: { student: "طالب جامعي", graduate: "خريج", postgrad: "طالب دراسات عليا", school: "طالب ثانوي" },
      gradeOptions: { g1: "الأولى", g2: "الثانية", g3: "الثالثة", g4: "الرابعة", g5: "الخامسة", g6: "السابعة", grad: "خريج" },
      heardOptions: { facebook: "فيسبوك", linkedin: "لينكد إن", friend: "ترشيح من صديق", university: "الجامعة", other: "أخرى" },
      placeholders: {
        name: "اكتب اسمك الرباعي كما هو في البطاقة الشخصية",
        id: "14 رقم مكتوب بالبطاقة",
        phone: "01xxxxxxxxx",
        university: "مثال: جامعة القاهرة / معهد ...",
        faculty: "مثال: كلية الهندسة / كلية التجارة",
        department: "مثال: قسم حاسبات / قسم محاسبة / عام",
        postgrad: "اكتب التخصص الدراسي الحالي أو الدبلومة إن وجد",
        url: "https://drive.google.com/...",
        role: "مثال: صانع محتوى / منسق ميداني / مدرب / محلل بيانات",
        availability: "مثال: 10 ساعات أسبوعيًا أو الأيام المتاحة",
        skills: "اكتب أهم المهارات التقنية أو الشخصية التي تتقنها",
        experience: "اذكر المبادرات أو الأنشطة الطلابية أو الأعمال السابقة بالتفصيل",
        message: "اكتب تطلعاتك من الانضمام والقطاع والسبب الرئيسي لرغبتك"
      }
    };

    const en = {
      title: "Join SkillUp Team",
      sub: "Fill out the form accurately, and the MEAL team will review your application to determine the best path for you.",
      section1: "Basic Information",
      section2: "Educational & Professional Background",
      section3: "Preferences & Interests",
      section4: "Your Message & Consent",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      nationalId: "National ID (14 digits)",
      city: "Governorate",
      age: "Age",
      memberStatus: "Membership Status",
      leadershipInterest: "Leadership Interest",
      education: "Current Educational Status",
      grade: "Academic Year / Grade",
      university: "University / Institute",
      faculty: "Faculty",
      department: "Department",
      postgradInfo: "Postgraduate Info (Optional)",
      graduation: "Graduation Year",
      profilePicture: "Profile Picture Link (Please upload to Drive and paste link)",
      sector: "Sector You Wish to Join",
      role: "Preferred Role / Responsibility",
      availability: "Weekly Availability",
      heardAboutUs: "How did you hear about us?",
      skills: "Core Skills",
      experience: "Previous Experience / Activities",
      linkedin: "LinkedIn Profile URL (Optional)",
      facebook: "Facebook Profile URL (Optional)",
      portfolio: "Portfolio URL (Optional)",
      resumeUrl: "Resume Link (Please upload to Drive and paste link - Optional)",
      message: "Why do you want to join SkillUp?",
      consent: "I confirm that all registered data is correct and agree to be contacted by the team.",
      submit: "Submit Application",
      next: "Next",
      prev: "Back",
      stepOf: "Step {step} of 4",
      sending: "Submitting data...",
      ok: "Data registered successfully! We will contact you soon.",
      anotherResponse: "Submit another response",
      errRequired: "Please complete all mandatory fields marked with an asterisk (*).",
      errEmail: "Please enter a valid email address.",
      errNationalId: "National ID must be exactly 14 digits.",
      errAge: "Please enter a valid age (between 15 and 70).",
      selectGovernorate: "Select Governorate",
      selectOption: "Select an option...",
      memberOptions: { member: "Member", expert: "Expert (Highly experienced)" },
      leadershipOptions: { ready: "I want and am ready to take a leadership role", learning: "I am still preparing myself" },
      educationOptions: { student: "Undergraduate Student", graduate: "Graduate", postgrad: "Postgraduate Student", school: "High School Student" },
      gradeOptions: { g1: "1st Year", g2: "2nd Year", g3: "3rd Year", g4: "4th Year", g5: "5th Year", g6: "6th Year", grad: "Graduated" },
      heardOptions: { facebook: "Facebook", linkedin: "LinkedIn", friend: "Friend Recommendation", university: "University", other: "Other" },
      placeholders: {
        name: "Enter your full legal name",
        id: "14 digits National ID",
        phone: "01xxxxxxxxx",
        university: "e.g., Cairo University / Institute",
        faculty: "e.g., Faculty of Engineering",
        department: "e.g., Computers Department / Accounting / General",
        postgrad: "Write your current postgraduate study field if applicable",
        url: "https://drive.google.com/...",
        role: "e.g., Content Creator / Logistics Coordinator / MEAL Analyst",
        availability: "e.g., 10 hours per week",
        skills: "Technical and soft skills you master",
        experience: "Mention any previous initiatives, student activities, or jobs",
        message: "Write your message, motivations and expectations here"
      }
    };

    return isAr ? ar : en;
  }, [isAr]);

  const [form, setForm] = useState<FormState>({
    full_name: "", email: "", phone: "", national_id: "", city: "", age: "",
    member_status: "", leadership_interest: "", education: "", grade: "",
    university: "", faculty: "", department: "", postgrad_info: "", graduation_year: "",
    profile_picture_url: "", sector_key: getSafeSectorKey(presetSector),
    preferred_role: "", availability: "", heard_about_us: "", skills: "", experience: "",
    linkedin: "", facebook: "", portfolio: "", resume_url: "", message: "", consent: false,
    website: "", hidden_honey: ""
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setForm((prev) => ({ ...prev, sector_key: getSafeSectorKey(presetSector) }));
  }, [presetSector]);

  // الكلاس الخاص بحقول الإدخال النصية
  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:bg-zinc-950/60 dark:focus:ring-white/10";
  
  // الكلاس الجديد المخصص للـ Select لمنع مشاكل الـ Click والمقاطعة في المتصفحات
  const selectClass =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:focus:border-white/20 dark:focus:bg-zinc-950 dark:focus:ring-white/10 cursor-pointer";

  const labelClass = "mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200";
  const cardClass = "rounded-[28px] border border-black/10 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/45 md:p-6 transition-all duration-300";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errorMsg) setErrorMsg("");
  }

  function validateCurrentStep(): boolean {
    setErrorMsg("");
    if (currentStep === 1) {
      if (
        !form.full_name.trim() || !form.email.trim() || !form.phone.trim() ||
        !form.national_id.trim() || !form.city || !form.age.trim() ||
        !form.member_status || !form.leadership_interest || !form.education ||
        !form.profile_picture_url.trim()
      ) {
        setErrorMsg(t.errRequired);
        return false;
      }
      if (!isValidEmail(form.email)) {
        setErrorMsg(t.errEmail);
        return false;
      }
      if (!isValidNationalId(form.national_id)) {
        setErrorMsg(t.errNationalId);
        return false;
      }
      const ageNum = Number(form.age);
      if (isNaN(ageNum) || ageNum < 15 || ageNum > 70) {
        setErrorMsg(t.errAge);
        return false;
      }
    }

    if (currentStep === 2) {
      if (
        !form.university.trim() || !form.faculty.trim() || !form.department.trim() ||
        !form.grade || !form.graduation_year.trim() || !form.experience.trim()
      ) {
        setErrorMsg(t.errRequired);
        return false;
      }
    }

    if (currentStep === 3) {
      if (
        !form.sector_key || !form.preferred_role.trim() || 
        !form.availability.trim() || !form.heard_about_us || !form.skills.trim()
      ) {
        setErrorMsg(t.errRequired);
        return false;
      }
    }

    return true;
  }

  function handleNextStep() {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handlePrevStep() {
    setErrorMsg("");
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");
    
    if (form.website || form.hidden_honey) {
      setDone(true);
      return;
    }

    if (!form.message.trim() || !form.consent) {
      setErrorMsg(t.errRequired);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          national_id: form.national_id.trim(),
          age: Number(form.age),
          university: form.university.trim(),
          faculty: form.faculty.trim(),
          department: form.department.trim(),
          postgrad_info: form.postgrad_info.trim() || null,
          graduation_year: Number(form.graduation_year),
          profile_picture_url: form.profile_picture_url.trim(),
          preferred_role: form.preferred_role.trim(),
          availability: form.availability.trim(),
          skills: form.skills.trim(),
          experience: form.experience.trim(),
          linkedin: form.linkedin.trim() || null,
          facebook: form.facebook.trim() || null,
          portfolio: form.portfolio.trim() || null,
          resume_url: form.resume_url.trim() || null,
          message: form.message.trim()
        })
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json?.error === "duplicate_entry") {
          throw new Error(
            isAr 
              ? "عذراً، هذا الرقم القومي أو البريد الإلكتروني مسجل لدينا بالفعل!" 
              : "This National ID or Email is already registered!"
          );
        }
        throw new Error(json?.error || "Failed to submit application.");
      }

      setDone(true);
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      
      setForm({
        full_name: "", email: "", phone: "", national_id: "", city: "", age: "",
        member_status: "", leadership_interest: "", education: "", grade: "",
        university: "", faculty: "", department: "", postgrad_info: "", graduation_year: "",
        profile_picture_url: "", sector_key: form.sector_key,
        preferred_role: "", availability: "", heard_about_us: "", skills: "", 
        experience: "", linkedin: "", facebook: "", portfolio: "", resume_url: "", 
        message: "", consent: false, website: "", hidden_honey: ""
      });
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6" dir={isAr ? "rtl" : "ltr"}>
      
      {done ? (
        /* ================= شاشة النجاح ================= */
        <section className="rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/50 text-center py-14 transition-all">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-white md:text-3xl">
            {t.ok}
          </h1>
          
          <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            {isAr 
              ? "تم استلام معلوماتك بالكامل في قاعدة البيانات، وسيقوم مسؤول قطاع المتابعة والتقييم بفرز طلبك." 
              : "Your data has been successfully securely stored. Our MEAL team will review it shortly."}
          </p>
          
          <button
            type="button"
            onClick={() => setDone(false)}
            className="mt-8 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900 shadow-md"
          >
            {t.anotherResponse}
          </button>
        </section>
      ) : (
        /* ================= خطوات الفورم ================= */
        <>
          <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/50 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white md:text-3xl">{t.title}</h1>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{t.sub}</p>
              </div>
              <span className="inline-flex self-start items-center rounded-full bg-zinc-900/5 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-white/10 dark:text-zinc-200">
                {t.stepOf.replace("{step}", String(currentStep))}
              </span>
            </div>

            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div 
                className="h-full bg-zinc-900 transition-all duration-500 ease-out dark:bg-white"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>

            <div className="mt-4 flex justify-between text-xs font-medium text-zinc-400">
              <span className={`transition-colors ${currentStep >= 1 ? "text-zinc-950 font-semibold dark:text-white" : ""}`}>{isAr ? "1. الأساسية" : "1. Basic"}</span>
              <span className={`transition-colors ${currentStep >= 2 ? "text-zinc-950 font-semibold dark:text-white" : ""}`}>{isAr ? "2. التعليم" : "2. Education"}</span>
              <span className={`transition-colors ${currentStep >= 3 ? "text-zinc-950 font-semibold dark:text-white" : ""}`}>{isAr ? "3. التفضيلات" : "3. Preferences"}</span>
              <span className={`transition-colors ${currentStep >= 4 ? "text-zinc-950 font-semibold dark:text-white" : ""}`}>{isAr ? "4. التأكيد" : "4. Consent"}</span>
            </div>
          </section>

          <form className="grid gap-5" onSubmit={submit} noValidate>
            
            <div className="hidden" aria-hidden="true">
              <input type="text" name="website" value={form.website} onChange={(e) => updateField("website", e.target.value)} tabIndex={-1} autoComplete="off" />
              <input type="text" name="hidden_honey" value={form.hidden_honey} onChange={(e) => updateField("hidden_honey", e.target.value)} tabIndex={-1} autoComplete="off" />
            </div>

            {/* الخطوة الأولى: البيانات الأساسية */}
            {currentStep === 1 && (
              <section className={cardClass}>
                <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section1}</h2>
                  <span className="text-xs font-mono text-zinc-400">01 / 04</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="full_name" className={labelClass}>{t.name} <span className="text-red-500">*</span></label>
                    <input id="full_name" type="text" className={inputClass} placeholder={t.placeholders.name} value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="national_id" className={labelClass}>{t.nationalId} <span className="text-red-500">*</span></label>
                    <input id="national_id" type="text" className={inputClass} placeholder={t.placeholders.id} value={form.national_id} onChange={(e) => updateField("national_id", e.target.value)} inputMode="numeric" maxLength={14} required />
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>{t.email} <span className="text-red-500">*</span></label>
                    <input id="email" type="email" className={inputClass} placeholder="example@domain.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>{t.phone} <span className="text-red-500">*</span></label>
                    <input id="phone" type="tel" className={inputClass} placeholder={t.placeholders.phone} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="city" className={labelClass}>{t.city} <span className="text-red-500">*</span></label>
                    <select id="city" className={selectClass} value={form.city} onChange={(e) => updateField("city", e.target.value)} required>
                      <option value="">{t.selectGovernorate}</option>
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov.en} value={gov.en} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{isAr ? gov.ar : gov.en}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="age" className={labelClass}>{t.age} <span className="text-red-500">*</span></label>
                    <input id="age" type="text" className={inputClass} placeholder="e.g. 21" value={form.age} onChange={(e) => updateField("age", e.target.value)} inputMode="numeric" required />
                  </div>

                  <div>
                    <label htmlFor="member_status" className={labelClass}>{t.memberStatus} <span className="text-red-500">*</span></label>
                    <select id="member_status" className={selectClass} value={form.member_status} onChange={(e) => updateField("member_status", e.target.value)} required>
                      <option value="">{t.selectOption}</option>
                      <option value="member" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.memberOptions.member}</option>
                      <option value="expert" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.memberOptions.expert}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="leadership_interest" className={labelClass}>{t.leadershipInterest} <span className="text-red-500">*</span></label>
                    <select id="leadership_interest" className={selectClass} value={form.leadership_interest} onChange={(e) => updateField("leadership_interest", e.target.value)} required>
                      <option value="">{t.selectOption}</option>
                      <option value="ready" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.leadershipOptions.ready}</option>
                      <option value="learning" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.leadershipOptions.learning}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="education" className={labelClass}>{t.education} <span className="text-red-500">*</span></label>
                    <select id="education" className={selectClass} value={form.education} onChange={(e) => updateField("education", e.target.value)} required>
                      <option value="">{t.selectOption}</option>
                      <option value="student" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.educationOptions.student}</option>
                      <option value="graduate" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.educationOptions.graduate}</option>
                      <option value="postgrad" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.educationOptions.postgrad}</option>
                      <option value="school" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.educationOptions.school}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="profile_picture_url" className={labelClass}>{t.profilePicture} <span className="text-red-500">*</span></label>
                    <input id="profile_picture_url" type="url" className={inputClass} placeholder={t.placeholders.url} value={form.profile_picture_url} onChange={(e) => updateField("profile_picture_url", e.target.value)} required />
                  </div>
                </div>
              </section>
            )}

            {/* الخطوة الثانية: الخلفية التعليمية والمهنية */}
            {currentStep === 2 && (
              <section className={cardClass}>
                <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section2}</h2>
                  <span className="text-xs font-mono text-zinc-400">02 / 04</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="university" className={labelClass}>{t.university} <span className="text-red-500">*</span></label>
                    <input id="university" type="text" className={inputClass} placeholder={t.placeholders.university} value={form.university} onChange={(e) => updateField("university", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="faculty" className={labelClass}>{t.faculty} <span className="text-red-500">*</span></label>
                    <input id="faculty" type="text" className={inputClass} placeholder={t.placeholders.faculty} value={form.faculty} onChange={(e) => updateField("faculty", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="department" className={labelClass}>{t.department} <span className="text-red-500">*</span></label>
                    <input id="department" type="text" className={inputClass} placeholder={t.placeholders.department} value={form.department} onChange={(e) => updateField("department", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="grade" className={labelClass}>{t.grade} <span className="text-red-500">*</span></label>
                    <select id="grade" className={selectClass} value={form.grade} onChange={(e) => updateField("grade", e.target.value)} required>
                      <option value="">{t.selectOption}</option>
                      <option value="1" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.gradeOptions.g1}</option>
                      <option value="2" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.gradeOptions.g2}</option>
                      <option value="3" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.gradeOptions.g3}</option>
                      <option value="4" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.gradeOptions.g4}</option>
                      <option value="5" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.gradeOptions.g5}</option>
                      <option value="6" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.gradeOptions.g6}</option>
                      <option value="graduated" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.gradeOptions.grad}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="graduation_year" className={labelClass}>{t.graduation} <span className="text-red-500">*</span></label>
                    <input id="graduation_year" type="text" className={inputClass} placeholder="e.g. 2026" value={form.graduation_year} onChange={(e) => updateField("graduation_year", e.target.value)} inputMode="numeric" required />
                  </div>

                  <div>
                    <label htmlFor="postgrad_info" className={labelClass}>{t.postgradInfo}</label>
                    <input id="postgrad_info" type="text" className={inputClass} placeholder={t.placeholders.postgrad} value={form.postgrad_info} onChange={(e) => updateField("postgrad_info", e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="linkedin" className={labelClass}>{t.linkedin}</label>
                    <input id="linkedin" type="url" className={inputClass} placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="facebook" className={labelClass}>{t.facebook}</label>
                    <input id="facebook" type="url" className={inputClass} placeholder="https://facebook.com/..." value={form.facebook} onChange={(e) => updateField("facebook", e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="resume_url" className={labelClass}>{t.resumeUrl}</label>
                    <input id="resume_url" type="url" className={inputClass} placeholder={t.placeholders.url} value={form.resume_url} onChange={(e) => updateField("resume_url", e.target.value)} />
                  </div>

                  <div>
                    <label htmlFor="portfolio" className={labelClass}>{t.portfolio}</label>
                    <input id="portfolio" type="url" className={inputClass} placeholder="https://..." value={form.portfolio} onChange={(e) => updateField("portfolio", e.target.value)} />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="experience" className={labelClass}>{t.experience} <span className="text-red-500">*</span></label>
                    <textarea id="experience" className={`${inputClass} min-h-[120px] resize-none`} placeholder={t.placeholders.experience} value={form.experience} onChange={(e) => updateField("experience", e.target.value)} required />
                  </div>
                </div>
              </section>
            )}

            {/* الخطوة الثالثة: التفضيلات والاهتمامات */}
            {currentStep === 3 && (
              <section className={cardClass}>
                <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section3}</h2>
                  <span className="text-xs font-mono text-zinc-400">03 / 04</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="sector_key" className={labelClass}>{t.sector} <span className="text-red-500">*</span></label>
                    <select id="sector_key" className={selectClass} value={form.sector_key} onChange={(e) => updateField("sector_key", e.target.value)} required>
                      {SECTORS_LIST.map((sec) => (
                        <option key={sec.slug} value={sec.slug} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{isAr ? sec.ar : sec.en}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="preferred_role" className={labelClass}>{t.role} <span className="text-red-500">*</span></label>
                    <input id="preferred_role" type="text" className={inputClass} placeholder={t.placeholders.role} value={form.preferred_role} onChange={(e) => updateField("preferred_role", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="availability" className={labelClass}>{t.availability} <span className="text-red-500">*</span></label>
                    <input id="availability" type="text" className={inputClass} placeholder={t.placeholders.availability} value={form.availability} onChange={(e) => updateField("availability", e.target.value)} required />
                  </div>

                  <div>
                    <label htmlFor="heard_about_us" className={labelClass}>{t.heardAboutUs} <span className="text-red-500">*</span></label>
                    <select id="heard_about_us" className={selectClass} value={form.heard_about_us} onChange={(e) => updateField("heard_about_us", e.target.value)} required>
                      <option value="">{t.selectOption}</option>
                      <option value="facebook" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.heardOptions.facebook}</option>
                      <option value="linkedin" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.heardOptions.linkedin}</option>
                      <option value="friend" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.heardOptions.friend}</option>
                      <option value="university" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.heardOptions.university}</option>
                      <option value="other" className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white">{t.heardOptions.other}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="skills" className={labelClass}>{t.skills} <span className="text-red-500">*</span></label>
                    <input id="skills" type="text" className={inputClass} placeholder={t.placeholders.skills} value={form.skills} onChange={(e) => updateField("skills", e.target.value)} required />
                  </div>
                </div>
              </section>
            )}

            {/* الخطوة الرابعة: الرسالة وإقرار الجدية */}
            {currentStep === 4 && (
              <section className={cardClass}>
                <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section4}</h2>
                  <span className="text-xs font-mono text-zinc-400">04 / 04</span>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label htmlFor="message" className={labelClass}>{t.message} <span className="text-red-500">*</span></label>
                    <textarea id="message" className={`${inputClass} min-h-[140px] resize-none`} placeholder={t.placeholders.message} value={form.message} onChange={(e) => updateField("message", e.target.value)} required />
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200 cursor-pointer select-none">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-zinc-900 dark:accent-white" checked={form.consent} onChange={(e) => updateField("consent", e.target.checked)} required />
                    <span>{t.consent}</span>
                  </label>
                </div>
              </section>
            )}

            {/* أزرار التحكم السفلية */}
            <div className="flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                >
                  {t.prev}
                </button>
              ) : (
                <div aria-hidden="true" />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900"
                >
                  {t.next}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
                >
                  {loading ? t.sending : t.submit}
                </button>
              )}
            </div>

            {/* عرض رسائل الخطأ */}
            <div aria-live="polite" className="grid gap-3 mt-2">
              {errorMsg && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}
            </div>

          </form>
        </>
      )}
    </div>
  );
}
