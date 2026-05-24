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
  national_id: string; // جديد
  city: string;
  age: string;
  member_status: string; // جديد (عضو - خبير)
  leadership_interest: string; // جديد (أرغب وجاهز - بأهل نفسي لسه)
  education: string; // محدث ليكون قائمة منسدلة
  grade: string; // جديد (الفرقة الدراسية)
  university: string;
  faculty: string; // جديد
  department: string; // جديد
  postgrad_info: string; // جديد (غير مطلوب)
  graduation_year: string;
  profile_picture_url: string; // جديد (رابط الصورة على درايف)
  sector_key: string; // مطابَق للقطاعات السبعة الموحدة
  preferred_role: string;
  availability: string;
  heard_about_us: string; // جديد (كيف سمعت عنا)
  skills: string;
  experience: string;
  linkedin: string; // أصبحت غير مطلوبة
  facebook: string; // جديد وغير مطلوب
  portfolio: string; // أصبحت غير مطلوبة
  resume_url: string; // جديد وغير مطلوب (رابط السيرة الذاتية على درايف)
  message: string;
  consent: boolean;
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
  { ar: "القاهرة", en: "Cairo" }, { ar: "الجيزة", en: "Giza" }, { ar: "الإسكندرية", en: "Alexandria" },
  { ar: "الدقهلية", en: "Dakahlia" }, { ar: "البحر الأحمر", en: "Red Sea" }, { ar: "البحيرة", en: "Beheira" },
  { ar: "الفيوم", en: "Fayoum" }, { ar: "الغربية", en: "Gharbia" }, { ar: "الإسماعيلية", en: "Ismailia" },
  { ar: "المنوفية", en: "Monufia" }, { ar: "المنيا", en: "Minya" }, { ar: "القليوبية", en: "Qalyubia" },
  { ar: "الوادي الجديد", en: "New Valley" }, { ar: "السويس", en: "Suez" }, { ar: "الشرقية", en: "Sharqia" },
  { ar: "أسوان", en: "Aswan" }, { ar: "أسيوط", en: "Asyut" }, { ar: "بني سويف", en: "Beni Suef" },
  { ar: "بورسعيد", en: "Port Said" }, { ar: "دمياط", en: "Damietta" }, { ar: "جنوب سيناء", en: "South Sinai" },
  { ar: "كفر الشيخ", en: "Kafr El Sheikh" }, { ar: "مطروح", en: "Matrouh" }, { ar: "الأقصر", en: "Luxor" },
  { ar: "قنا", en: "Qena" }, { ar: "شمال سيناء", en: "North Sinai" }, { ar: "سوهاج", en: "Sohag" }
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
      sending: "جاري إرسال البيانات...",
      ok: "تم إرسال طلبك بنجاح! سيقوم فريق المتابعة والتقييم بالتواصل معك قريبًا.",
      errRequired: "برجاء استكمال جميع الحقول الإجبارية المعلّمة بنجمة (*).",
      errEmail: "يرجى إدخال بريد إلكتروني صحيح بشكل سليم.",
      errNationalId: "الرقم القومي غير صحيح، يجب أن يتكون من 14 رقماً بالضبط.",
      errAge: "يرجى إدخال عمر منطقي وصحيح.",
      selectGovernorate: "اختر المحافظة",
      selectOption: "اختر من القائمة...",
      memberOptions: { member: "عضو", expert: "خبير (لديك خبرة كبيرة)" },
      leadershipOptions: { ready: "أرغب وجاهز لتولي مسؤولية قيادية", learning: "بأهل نفسي لسه" },
      educationOptions: { student: "طالب جامعي", graduate: "خريج", postgrad: "طالب دراسات عليا", school: "طالب ثانوي" },
      gradeOptions: { g1: "الأولى", g2: "الثانية", g3: "الثالثة", g4: "الرابعة", g5: "الخامسة", g6: "السادسة", grad: "خريج" },
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
      sending: "Submitting data...",
      ok: "Your application has been submitted successfully! The MEAL team will contact you soon.",
      errRequired: "Please complete all mandatory fields marked with an asterisk (*).",
      errEmail: "Please enter a valid email address.",
      errNationalId: "National ID must be exactly 14 digits.",
      errAge: "Please enter a valid age.",
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
    linkedin: "", facebook: "", portfolio: "", resume_url: "", message: "", consent: false
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setForm((prev) => ({ ...prev, sector_key: getSafeSectorKey(presetSector) }));
  }, [presetSector]);

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:bg-zinc-950/60 dark:focus:ring-white/10";

  const labelClass = "mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200";
  const cardClass = "rounded-[28px] border border-black/10 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/45 md:p-6";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errorMsg) setErrorMsg("");
    if (done) setDone(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg("");
    setDone(false);

    // التحقق من كافة الحقول المطلوبة (مع استبعاد الحقول الاختيارية الأربعة: لينكد إن، فيسبوك، معرض الأعمال، السيرة الذاتية، والدراسات العليا)
    if (
      !form.full_name.trim() || !form.email.trim() || !form.phone.trim() ||
      !form.national_id.trim() || !form.city || !form.age.trim() ||
      !form.member_status || !form.leadership_interest || !form.education ||
      !form.grade || !form.university.trim() || !form.faculty.trim() ||
      !form.department.trim() || !form.graduation_year.trim() ||
      !form.profile_picture_url.trim() || !form.sector_key ||
      !form.preferred_role.trim() || !form.availability.trim() ||
      !form.heard_about_us || !form.skills.trim() || !form.experience.trim() ||
      !form.message.trim() || !form.consent
    ) {
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
          age: ageNum,
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

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to submit application.");
      }

      setDone(true);
      // إعادة تصفير الفورم مع الاحتفاظ بالقطاع الحالي المختار
      setForm({
        full_name: "", email: "", phone: "", national_id: "", city: "", age: "",
        member_status: "", leadership_interest: "", education: "", grade: "",
        university: "", faculty: "", department: "", postgrad_info: "", graduation_year: "",
        profile_picture_url: "", sector_key: form.sector_key,
        preferred_role: "", availability: "", heard_about_us: "", skills: "", experience: "",
        linkedin: "", facebook: "", portfolio: "", resume_url: "", message: "", consent: false
      });
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6" dir={isAr ? "rtl" : "ltr"}>
      <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/50 md:p-7">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white md:text-3xl">{t.title}</h1>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{t.sub}</p>
        <p className="mt-3 text-xs font-semibold text-red-500 dark:text-red-400">
          * {isAr ? "جميع الحقول مميزة بنجمة هي حقول مطلوبة وإلزامية" : "Fields with an asterisk * are strictly required."}
        </p>
      </section>

      <form className="grid gap-5" onSubmit={submit} noValidate>
        {/* Section 1: Basic Information */}
        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section1}</h2>
            <span className="text-xs font-mono text-zinc-400">01</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="full_name" className={labelClass}>{t.name} <span className="text-red-500">*</span></label>
              <input id="full_name" className={inputClass} placeholder={t.placeholders.name} value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
            </div>

            <div>
              <label htmlFor="national_id" className={labelClass}>{t.nationalId} <span className="text-red-500">*</span></label>
              <input id="national_id" className={inputClass} placeholder={t.placeholders.id} value={form.national_id} onChange={(e) => updateField("national_id", e.target.value)} inputMode="numeric" maxLength={14} />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>{t.email} <span className="text-red-500">*</span></label>
              <input id="email" type="email" className={inputClass} placeholder="example@domain.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>{t.phone} <span className="text-red-500">*</span></label>
              <input id="phone" type="tel" className={inputClass} placeholder={t.placeholders.phone} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>

            <div>
              <label htmlFor="city" className={labelClass}>{t.city} <span className="text-red-500">*</span></label>
              <select id="city" className={inputClass} value={form.city} onChange={(e) => updateField("city", e.target.value)}>
                <option value="">{t.selectGovernorate}</option>
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov.en} value={gov.en}>{isAr ? gov.ar : gov.en}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="age" className={labelClass}>{t.age} <span className="text-red-500">*</span></label>
              <input id="age" className={inputClass} placeholder="e.g. 21" value={form.age} onChange={(e) => updateField("age", e.target.value)} inputMode="numeric" />
            </div>

            <div>
              <label htmlFor="member_status" className={labelClass}>{t.memberStatus} <span className="text-red-500">*</span></label>
              <select id="member_status" className={inputClass} value={form.member_status} onChange={(e) => updateField("member_status", e.target.value)}>
                <option value="">{t.selectOption}</option>
                <option value="member">{t.memberOptions.member}</option>
                <option value="expert">{t.memberOptions.expert}</option>
              </select>
            </div>

            <div>
              <label htmlFor="leadership_interest" className={labelClass}>{t.leadershipInterest} <span className="text-red-500">*</span></label>
              <select id="leadership_interest" className={inputClass} value={form.leadership_interest} onChange={(e) => updateField("leadership_interest", e.target.value)}>
                <option value="">{t.selectOption}</option>
                <option value="ready">{t.leadershipOptions.ready}</option>
                <option value="learning">{t.leadershipOptions.learning}</option>
              </select>
            </div>

            <div>
              <label htmlFor="education" className={labelClass}>{t.education} <span className="text-red-500">*</span></label>
              <select id="education" className={inputClass} value={form.education} onChange={(e) => updateField("education", e.target.value)}>
                <option value="">{t.selectOption}</option>
                <option value="student">{t.educationOptions.student}</option>
                <option value="graduate">{t.educationOptions.graduate}</option>
                <option value="postgrad">{t.educationOptions.postgrad}</option>
                <option value="school">{t.educationOptions.school}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="profile_picture_url" className={labelClass}>{t.profilePicture} <span className="text-red-500">*</span></label>
              <input id="profile_picture_url" type="url" className={inputClass} placeholder={t.placeholders.url} value={form.profile_picture_url} onChange={(e) => updateField("profile_picture_url", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Section 2: Educational & Professional Background */}
        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section2}</h2>
            <span className="text-xs font-mono text-zinc-400">02</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="university" className={labelClass}>{t.university} <span className="text-red-500">*</span></label>
              <input id="university" className={inputClass} placeholder={t.placeholders.university} value={form.university} onChange={(e) => updateField("university", e.target.value)} />
            </div>

            <div>
              <label htmlFor="faculty" className={labelClass}>{t.faculty} <span className="text-red-500">*</span></label>
              <input id="faculty" className={inputClass} placeholder={t.placeholders.faculty} value={form.faculty} onChange={(e) => updateField("faculty", e.target.value)} />
            </div>

            <div>
              <label htmlFor="department" className={labelClass}>{t.department} <span className="text-red-500">*</span></label>
              <input id="department" className={inputClass} placeholder={t.placeholders.department} value={form.department} onChange={(e) => updateField("department", e.target.value)} />
            </div>

            <div>
              <label htmlFor="grade" className={labelClass}>{t.grade} <span className="text-red-500">*</span></label>
              <select id="grade" className={inputClass} value={form.grade} onChange={(e) => updateField("grade", e.target.value)}>
                <option value="">{t.selectOption}</option>
                <option value="1">{t.gradeOptions.g1}</option>
                <option value="2">{t.gradeOptions.g2}</option>
                <option value="3">{t.gradeOptions.g3}</option>
                <option value="4">{t.gradeOptions.g4}</option>
                <option value="5">{t.gradeOptions.g5}</option>
                <option value="6">{t.gradeOptions.g6}</option>
                <option value="graduated">{t.gradeOptions.grad}</option>
              </select>
            </div>

            <div>
              <label htmlFor="graduation_year" className={labelClass}>{t.graduation} <span className="text-red-500">*</span></label>
              <input id="graduation_year" className={inputClass} placeholder="e.g. 2026" value={form.graduation_year} onChange={(e) => updateField("graduation_year", e.target.value)} inputMode="numeric" />
            </div>

            <div>
              <label htmlFor="postgrad_info" className={labelClass}>{t.postgradInfo}</label>
              <input id="postgrad_info" className={inputClass} placeholder={t.placeholders.postgrad} value={form.postgrad_info} onChange={(e) => updateField("postgrad_info", e.target.value)} />
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
              <textarea id="experience" className={`${inputClass} min-h-[110px] resize-none`} placeholder={t.placeholders.experience} value={form.experience} onChange={(e) => updateField("experience", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Section 3: Preferences & Interests */}
        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section3}</h2>
            <span className="text-xs font-mono text-zinc-400">03</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="sector_key" className={labelClass}>{t.sector} <span className="text-red-500">*</span></label>
              <select id="sector_key" className={inputClass} value={form.sector_key} onChange={(e) => updateField("sector_key", e.target.value)}>
                {SECTORS_LIST.map((sec) => (
                  <option key={sec.slug} value={sec.slug}>{isAr ? sec.ar : sec.en}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="preferred_role" className={labelClass}>{t.role} <span className="text-red-500">*</span></label>
              <input id="preferred_role" className={inputClass} placeholder={t.placeholders.role} value={form.preferred_role} onChange={(e) => updateField("preferred_role", e.target.value)} />
            </div>

            <div>
              <label htmlFor="availability" className={labelClass}>{t.availability} <span className="text-red-500">*</span></label>
              <input id="availability" className={inputClass} placeholder={t.placeholders.availability} value={form.availability} onChange={(e) => updateField("availability", e.target.value)} />
            </div>

            <div>
              <label htmlFor="heard_about_us" className={labelClass}>{t.heardAboutUs} <span className="text-red-500">*</span></label>
              <select id="heard_about_us" className={inputClass} value={form.heard_about_us} onChange={(e) => updateField("heard_about_us", e.target.value)}>
                <option value="">{t.selectOption}</option>
                <option value="facebook">{t.heardOptions.facebook}</option>
                <option value="linkedin">{t.heardOptions.linkedin}</option>
                <option value="friend">{t.heardOptions.friend}</option>
                <option value="university">{t.heardOptions.university}</option>
                <option value="other">{t.heardOptions.other}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="skills" className={labelClass}>{t.skills} <span className="text-red-500">*</span></label>
              <input id="skills" className={inputClass} placeholder={t.placeholders.skills} value={form.skills} onChange={(e) => updateField("skills", e.target.value)} />
            </div>
          </div>
        </section>

        {/* Section 4: Your Message & Consent */}
        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section4}</h2>
            <span className="text-xs font-mono text-zinc-400">04</span>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="message" className={labelClass}>{t.message} <span className="text-red-500">*</span></label>
              <textarea id="message" className={`${inputClass} min-h-[140px] resize-none`} placeholder={t.placeholders.message} value={form.message} onChange={(e) => updateField("message", e.target.value)} />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200 cursor-pointer select-none">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-zinc-900 dark:accent-white" checked={form.consent} onChange={(e) => updateField("consent", e.target.checked)} />
              <span>{t.consent}</span>
            </label>

            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900">
              {loading ? t.sending : t.submit}
            </button>

            <div aria-live="polite" className="grid gap-3">
              {done && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  {t.ok}
                </div>
              )}
              {errorMsg && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
