"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  X
} from "lucide-react";

import type { Locale } from "@/i18n";

type SectionId = "experience" | "projects" | "activities" | "courses" | "skills";
type Experience = {
  id: string;
  kind: string;
  role: string;
  organization: string;
  period: string;
  location: string;
  description: string;
};
type Project = {
  id: string;
  name: string;
  kind: string;
  role: string;
  date: string;
  tools: string;
  url: string;
  description: string;
};
type Activity = {
  id: string;
  organization: string;
  role: string;
  period: string;
  description: string;
};
type Course = {
  id: string;
  name: string;
  provider: string;
  date: string;
  certificateUrl: string;
};
type CVData = {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  summary: string;
  university: string;
  college: string;
  major: string;
  yearLevel: string;
  startYear: string;
  graduationYear: string;
  gpa: string;
  experiences: Experience[];
  projects: Project[];
  activities: Activity[];
  courses: Course[];
  skills: string;
  tools: string;
  languages: string;
  sectionOrder: SectionId[];
  selectedSections: SectionId[];
  cvLanguage: "ar" | "en";
};

type LocaleCopy = {
  [key: string]: string;
};

const STORAGE_KEY = "skillup_cv_student_v1";
const PAGE_WIDTH = 794;

const SECTION_META: Record<SectionId, { icon: typeof BriefcaseBusiness; titleAr: string; titleEn: string; subAr: string; subEn: string }> = {
  experience: { icon: BriefcaseBusiness, titleAr: "التدريبات والخبرات", titleEn: "Experience & Internships", subAr: "تدريب، عمل جزئي، عمل حر أو خبرة عملية", subEn: "Internships, part-time work, freelance or other experience" },
  projects: { icon: FolderKanban, titleAr: "المشاريع", titleEn: "Projects", subAr: "مشاريع جامعية أو شخصية أو مشروع تخرج", subEn: "Academic, personal or graduation projects" },
  activities: { icon: Users, titleAr: "التطوع والأنشطة", titleEn: "Volunteering & Activities", subAr: "أنشطة طلابية، مبادرات، تطوع وقيادة فرق", subEn: "Student activities, volunteering and leadership" },
  courses: { icon: BookOpen, titleAr: "الكورسات والشهادات", titleEn: "Courses & Certifications", subAr: "الدورات التدريبية والشهادات المهنية", subEn: "Training courses and professional certificates" },
  skills: { icon: Wrench, titleAr: "المهارات واللغات", titleEn: "Skills & Languages", subAr: "المهارات التقنية والشخصية واللغات", subEn: "Technical skills, soft skills and languages" }
};

const EMPTY_CV: CVData = {
  fullName: "",
  targetRole: "",
  email: "",
  phone: "",
  city: "",
  linkedin: "",
  summary: "",
  university: "",
  college: "",
  major: "",
  yearLevel: "",
  startYear: "",
  graduationYear: "",
  gpa: "",
  experiences: [],
  projects: [],
  activities: [],
  courses: [],
  skills: "",
  tools: "",
  languages: "",
  sectionOrder: ["experience", "projects", "activities", "courses", "skills"],
  selectedSections: ["experience", "projects", "activities", "courses", "skills"],
  cvLanguage: "ar"
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const cx = (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(" ");

function listText(value: string): string[] {
  return value.split(/[\n,،;؛]+/).map((item) => item.trim()).filter(Boolean);
}

function Field({ label, children, hint, required }: { label: string; children: ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{hint}</span> : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  dir
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl" | "auto";
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      dir={dir}
      placeholder={placeholder}
      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C8A448] focus:ring-2 focus:ring-[#C8A448]/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C8A448] focus:ring-2 focus:ring-[#C8A448]/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
    />
  );
}

function CVDocument({ cv }: { cv: CVData }) {
  const ar = cv.cvLanguage === "ar";
  const t = {
    summary: ar ? "الملخص المهني" : "Professional Summary",
    education: ar ? "التعليم" : "Education",
    experience: ar ? "التدريبات والخبرات" : "Experience & Internships",
    projects: ar ? "المشاريع" : "Projects",
    activities: ar ? "التطوع والأنشطة" : "Volunteering & Activities",
    courses: ar ? "الكورسات والشهادات" : "Courses & Certifications",
    skills: ar ? "المهارات" : "Skills",
    tools: ar ? "الأدوات والتقنيات" : "Tools & Technologies",
    languages: ar ? "اللغات" : "Languages",
    expected: ar ? "متوقع التخرج" : "Expected graduation",
    year: ar ? "السنة الدراسية" : "Study year",
    gpa: ar ? "التقدير" : "GPA"
  };
  const contact = [cv.email, cv.phone, cv.city, cv.linkedin].filter(Boolean);
  const experience = cv.experiences.filter((item) => item.role || item.organization || item.description);
  const projects = cv.projects.filter((item) => item.name || item.description);
  const activities = cv.activities.filter((item) => item.organization || item.role || item.description);
  const courses = cv.courses.filter((item) => item.name || item.provider);
  const skills = listText(cv.skills);
  const tools = listText(cv.tools);
  const languages = listText(cv.languages);
  const hasEducation = [cv.university, cv.college, cv.major].some(Boolean);

  return (
    <article
      className="cv-document mx-auto bg-white text-[#20252b]"
      dir={ar ? "rtl" : "ltr"}
      lang={cv.cvLanguage}
      style={{ width: PAGE_WIDTH, minHeight: 1123, boxSizing: "border-box", padding: "54px 58px", fontFamily: "Cairo, Arial, 'Segoe UI', Tahoma, sans-serif" }}
    >
      <header className="border-b-2 border-[#182B36] pb-5">
        <h1 className="break-words text-[30px] font-bold leading-tight text-[#182B36]">{cv.fullName || (ar ? "الاسم بالكامل" : "Full Name")}</h1>
        {cv.targetRole ? <p className="mt-1 text-[15px] font-semibold text-[#475569]">{cv.targetRole}</p> : null}
        {contact.length ? (
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-5 text-[#475569]" dir="ltr">
            {contact.map((value, index) => <span key={`${value}-${index}`} className="break-all">{value}{index < contact.length - 1 ? "  |  " : ""}</span>)}
          </p>
        ) : null}
      </header>

      {cv.summary.trim() ? (
        <section className="cv-section mt-5">
          <h2>{t.summary}</h2>
          <p className="whitespace-pre-line">{cv.summary}</p>
        </section>
      ) : null}

      {hasEducation ? (
        <section className="cv-section mt-5">
          <h2>{t.education}</h2>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div>
              <p className="font-bold">{cv.major || cv.college}</p>
              {cv.college ? <p className="mt-0.5">{cv.college}</p> : null}
              {cv.university ? <p className="mt-0.5 text-[#4b5563]">{cv.university}</p> : null}
              {cv.yearLevel ? <p className="mt-0.5 text-[#4b5563]">{t.year}: {cv.yearLevel}</p> : null}
            </div>
            <div className="text-start text-[11px] text-[#4b5563]">
              {cv.startYear || cv.graduationYear ? <p>{[cv.startYear, cv.graduationYear].filter(Boolean).join(" – ")}</p> : null}
              {cv.graduationYear ? <p>{t.expected}: {cv.graduationYear}</p> : null}
              {cv.gpa ? <p>{t.gpa}: {cv.gpa}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {cv.sectionOrder.filter((id) => cv.selectedSections.includes(id)).map((sectionId) => {
        if (sectionId === "experience" && experience.length) {
          return (
            <section className="cv-section mt-5" key={sectionId}>
              <h2>{t.experience}</h2>
              {experience.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-bold">{item.role || item.kind}</p>
                    {item.period ? <p className="text-[11px] text-[#64748b]">{item.period}</p> : null}
                  </div>
                  {item.organization ? <p className="mt-0.5 font-semibold text-[#475569]">{item.organization}{item.location ? ` · ${item.location}` : ""}</p> : null}
                  {item.description ? <p className="mt-1 whitespace-pre-line">{item.description}</p> : null}
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "projects" && projects.length) {
          return (
            <section className="cv-section mt-5" key={sectionId}>
              <h2>{t.projects}</h2>
              {projects.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-bold">{item.name}</p>
                    {item.date ? <p className="text-[11px] text-[#64748b]">{item.date}</p> : null}
                  </div>
                  {item.role || item.kind ? <p className="mt-0.5 font-semibold text-[#475569]">{[item.role, item.kind].filter(Boolean).join(" · ")}</p> : null}
                  {item.description ? <p className="mt-1 whitespace-pre-line">{item.description}</p> : null}
                  {item.tools ? <p className="mt-1"><strong>{t.tools}: </strong>{item.tools}</p> : null}
                  {item.url ? <p className="mt-1 break-all text-[#475569]" dir="ltr">{item.url}</p> : null}
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "activities" && activities.length) {
          return (
            <section className="cv-section mt-5" key={sectionId}>
              <h2>{t.activities}</h2>
              {activities.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-bold">{item.role || item.organization}</p>
                    {item.period ? <p className="text-[11px] text-[#64748b]">{item.period}</p> : null}
                  </div>
                  {item.organization && item.role ? <p className="mt-0.5 font-semibold text-[#475569]">{item.organization}</p> : null}
                  {item.description ? <p className="mt-1 whitespace-pre-line">{item.description}</p> : null}
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "courses" && courses.length) {
          return (
            <section className="cv-section mt-5" key={sectionId}>
              <h2>{t.courses}</h2>
              {courses.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-bold">{item.name}</p>
                    {item.date ? <p className="text-[11px] text-[#64748b]">{item.date}</p> : null}
                  </div>
                  {item.provider ? <p className="mt-0.5 text-[#475569]">{item.provider}</p> : null}
                  {item.certificateUrl ? <p className="mt-1 break-all text-[#475569]" dir="ltr">{item.certificateUrl}</p> : null}
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "skills" && (skills.length || tools.length || languages.length)) {
          return (
            <section className="cv-section mt-5" key={sectionId}>
              <h2>{t.skills}</h2>
              {skills.length ? <p>{skills.join(" · ")}</p> : null}
              {tools.length ? <p className="mt-1"><strong>{t.tools}: </strong>{tools.join(" · ")}</p> : null}
              {languages.length ? <p className="mt-1"><strong>{t.languages}: </strong>{languages.join(" · ")}</p> : null}
            </section>
          );
        }
        return null;
      })}
    </article>
  );
}

function LivePreview({ cv, isAr }: { cv: CVData; isAr: boolean }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [boxWidth, setBoxWidth] = useState(500);
  const [sheetHeight, setSheetHeight] = useState(1123);
  const scale = Math.min(1, boxWidth / PAGE_WIDTH);

  useEffect(() => {
    const box = boxRef.current;
    const sheet = sheetRef.current;
    if (!box || !sheet) return;
    const observer = new ResizeObserver(() => {
      setBoxWidth(box.clientWidth);
      setSheetHeight(sheet.offsetHeight || 1123);
    });
    observer.observe(box);
    observer.observe(sheet);
    setBoxWidth(box.clientWidth);
    setSheetHeight(sheet.offsetHeight || 1123);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-200/80 p-2 dark:bg-zinc-950" ref={boxRef}>
      <div style={{ width: PAGE_WIDTH * scale, height: sheetHeight * scale, marginInline: "auto" }}>
        <div ref={sheetRef} style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left", boxShadow: "0 8px 28px rgba(0,0,0,.14)" }}>
          <CVDocument cv={cv} />
        </div>
      </div>
      <p className="px-2 pb-1 pt-3 text-center text-[11px] text-zinc-500">{isAr ? "معاينة تقريبية — قد تمتد السيرة لأكثر من صفحة حسب المحتوى." : "Preview only — the CV may span multiple pages depending on content."}</p>
    </div>
  );
}

export default function CvBuilder({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";
  const t: LocaleCopy = useMemo(() => isAr ? {
    eyebrow: "أداة مجانية من SkillUp",
    title: "ابنِ سيرتك الذاتية خطوة بخطوة",
    subtitle: "ابدأ بمعلوماتك الأساسية، ثم أضف الأقسام التي تناسب تجربتك كطالب جامعي. كل البيانات اختيارية ما عدا الحقول الأساسية، ويمكنك تعديلها في أي وقت.",
    stepProfile: "المعلومات الأساسية",
    stepEducation: "التعليم",
    sectionsTitle: "أقسام سيرتك الذاتية",
    sectionsSub: "الأقسام دي اخترتها لمسارك. افتح أي قسم لإضافة بياناتك، وتقدر تضيف أكتر من تجربة أو مشروع.",
    preview: "معاينة السيرة",
    edit: "تعديل البيانات",
    add: "إضافة",
    save: "حفظ البيانات",
    cancel: "إلغاء",
    delete: "حذف",
    update: "حفظ التعديل",
    addNew: "إضافة جديد",
    noItems: "لم تضف بيانات لهذا القسم بعد.",
    noItemsHint: "ابدأ بإضافة أول عنصر. تقدر تتخطى القسم وتكمله بعدين.",
    fullName: "الاسم بالكامل",
    targetRole: "المسمى أو المجال المستهدف",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    city: "المدينة والدولة",
    linkedin: "رابط LinkedIn أو Portfolio",
    summary: "نبذة مهنية قصيرة",
    summaryHint: "اكتب 2–3 جمل عن تخصصك واهتماماتك والفرصة التي تستهدفها. تجنب العبارات العامة غير المدعومة بأمثلة.",
    university: "الجامعة أو المعهد",
    college: "الكلية",
    major: "التخصص الدراسي",
    yearLevel: "الفرقة الدراسية",
    startYear: "سنة الالتحاق",
    graduationYear: "سنة التخرج المتوقعة",
    gpa: "التقدير أو المعدل (GPA)",
    required: "مطلوب",
    optional: "اختياري",
    role: "المسمى أو الدور",
    organization: "الشركة أو المؤسسة",
    kind: "نوع التجربة",
    period: "الفترة",
    location: "المكان",
    description: "المسؤوليات والإنجازات",
    descriptionHint: "اكتب ما قمت به فعلًا. استخدم نقاطًا قصيرة، وأضف أرقامًا فقط لو كانت حقيقية.",
    projectName: "اسم المشروع",
    projectKind: "نوع المشروع",
    projectRole: "دورك في المشروع",
    date: "التاريخ أو الفترة",
    tools: "الأدوات والتقنيات المستخدمة",
    url: "رابط المشروع",
    provider: "الجهة المقدمة",
    certificateUrl: "رابط الشهادة (إن وجد)",
    skills: "المهارات",
    skillsHint: "اكتب كل مهارة في سطر أو افصل بينها بفاصلة.",
    technical: "الأدوات والبرامج",
    languages: "اللغات ومستوى الإتقان",
    languageHint: "مثال: العربية — اللغة الأم، الإنجليزية — متوسط.",
    experienceType: "اختر النوع",
    internship: "تدريب عملي",
    summer: "تدريب صيفي",
    partTime: "عمل بدوام جزئي",
    freelance: "عمل حر",
    work: "خبرة عملية",
    academic: "مشروع جامعي",
    personal: "مشروع شخصي",
    graduation: "مشروع تخرج",
    activityName: "اسم الكيان أو المبادرة",
    courseName: "اسم الكورس أو الشهادة",
    coursesCount: "دورة / شهادة",
    experienceCount: "تجربة",
    projectCount: "مشروع",
    activityCount: "نشاط",
    skillsCount: "عنصر مهارة",
    educationNote: "بيانات التعليم أساسية في مسار الطالب. التقدير وسنة الالتحاق اختياريان.",
    language: "لغة السيرة",
    arabic: "العربية",
    english: "English",
    print: "تحميل PDF / طباعة",
    printHint: "في نافذة الطباعة اختر Save as PDF. استخدم ملف PDF نصي وليس صورة ممسوحة ضوئيًا.",
    saved: "يتم الحفظ تلقائيًا على هذا الجهاز",
    savedInfo: "بياناتك لا تُرسل إلى خادم SkillUp في هذه المرحلة.",
    reset: "مسح كل البيانات",
    resetConfirm: "هل تريد مسح كل بيانات السيرة المحفوظة على هذا الجهاز؟",
    checklist: "مراجعة قبل التحميل",
    checkContact: "أضف اسمك ووسيلة تواصل واحدة على الأقل.",
    checkEducation: "أضف الجامعة أو الكلية والتخصص.",
    checkTarget: "أضف المجال الوظيفي المستهدف ليسهل تخصيص السيرة.",
    checkContent: "راجع وصف خبراتك ومشاريعك واحذف أي معلومات غير دقيقة.",
    atsNote: "التنسيق الحالي عمود واحد بعناوين قياسية لتسهيل قراءة ATS. لا توجد أداة تضمن القبول في كل أنظمة ATS.",
    selectSections: "إدارة الأقسام",
    active: "مفعّل",
    disabled: "مخفي من السيرة",
    showSection: "إظهار القسم",
    hideSection: "إخفاء القسم",
    mobilePreview: "عرض المعاينة",
    mobileForm: "استكمال البيانات",
    sectionOrder: "ترتيب الأقسام في السيرة",
    up: "لأعلى",
    down: "لأسفل",
    noSummary: "يمكنك إضافة نبذة مختصرة لاحقًا.",
    profileRequired: "أكمل الاسم والبريد الإلكتروني أو رقم الهاتف.",
    educationRequired: "أضف اسم الجامعة أو الكلية والتخصص الدراسي.",
    complete: "جاهزية المحتوى",
    clear: "بدء سيرة جديدة",
    removeSection: "إزالة القسم من السيرة"
  } : {
    eyebrow: "A free tool by SkillUp",
    title: "Build your CV, one step at a time",
    subtitle: "Start with your basic details, then add the sections that fit your student experience. Optional information stays optional, and you can edit everything later.",
    stepProfile: "Basic information",
    stepEducation: "Education",
    sectionsTitle: "Your CV sections",
    sectionsSub: "These sections fit the student path. Open any section to add details. You can add multiple experiences or projects.",
    preview: "CV preview",
    edit: "Edit details",
    add: "Add",
    save: "Save details",
    cancel: "Cancel",
    delete: "Delete",
    update: "Save changes",
    addNew: "Add new",
    noItems: "You have not added anything here yet.",
    noItemsHint: "Add your first item, or skip this section and return later.",
    fullName: "Full name",
    targetRole: "Target role or field",
    email: "Email address",
    phone: "Phone number",
    city: "City and country",
    linkedin: "LinkedIn or portfolio URL",
    summary: "Short professional summary",
    summaryHint: "Write 2–3 sentences about your major, interests and target opportunity. Avoid generic claims without examples.",
    university: "University or institute",
    college: "Faculty / school",
    major: "Major / field of study",
    yearLevel: "Current study year",
    startYear: "Start year",
    graduationYear: "Expected graduation",
    gpa: "Grade or GPA (optional)",
    required: "Required",
    optional: "Optional",
    role: "Role or title",
    organization: "Company or organization",
    kind: "Experience type",
    period: "Period",
    location: "Location",
    description: "Responsibilities and achievements",
    descriptionHint: "Describe what you actually did. Use short bullets and include numbers only when they are accurate.",
    projectName: "Project name",
    projectKind: "Project type",
    projectRole: "Your role in the project",
    date: "Date or period",
    tools: "Tools and technologies used",
    url: "Project URL",
    provider: "Issuing organization",
    certificateUrl: "Certificate URL (if available)",
    skills: "Skills",
    skillsHint: "Enter one skill per line or separate skills with commas.",
    technical: "Tools and software",
    languages: "Languages and proficiency",
    languageHint: "Example: Arabic — Native; English — Intermediate.",
    experienceType: "Choose a type",
    internship: "Internship",
    summer: "Summer training",
    partTime: "Part-time job",
    freelance: "Freelance",
    work: "Work experience",
    academic: "Academic project",
    personal: "Personal project",
    graduation: "Graduation project",
    activityName: "Organization or initiative",
    courseName: "Course or certificate name",
    coursesCount: "Courses / certificates",
    experienceCount: "Experience items",
    projectCount: "Projects",
    activityCount: "Activities",
    skillsCount: "Skills",
    educationNote: "Education is important for student CVs. Grade and start year are optional.",
    language: "CV language",
    arabic: "العربية",
    english: "English",
    print: "Download PDF / Print",
    printHint: "Choose Save as PDF in the print dialog. Use a text-based PDF, not a scanned image.",
    saved: "Automatically saved on this device",
    savedInfo: "Your information is not sent to SkillUp servers at this stage.",
    reset: "Clear all data",
    resetConfirm: "Clear all saved CV data from this device?",
    checklist: "Before you download",
    checkContact: "Add your name and at least one contact method.",
    checkEducation: "Add your university or faculty and major.",
    checkTarget: "Add a target role to make your CV more focused.",
    checkContent: "Review your experience and project descriptions for accuracy.",
    atsNote: "This is a single-column layout with standard headings to support ATS readability. No tool can guarantee acceptance by every ATS.",
    selectSections: "Manage sections",
    active: "Active",
    disabled: "Hidden from CV",
    showSection: "Show section",
    hideSection: "Hide section",
    mobilePreview: "Preview CV",
    mobileForm: "Edit details",
    sectionOrder: "Section order in your CV",
    up: "Move up",
    down: "Move down",
    noSummary: "You can add a short summary later.",
    profileRequired: "Add your name and either email or phone number.",
    educationRequired: "Add your university or faculty and major.",
    complete: "Content readiness",
    clear: "Start a new CV",
    removeSection: "Remove section from CV"
  }, [isAr]);

  const [cv, setCv] = useState<CVData>({ ...EMPTY_CV, cvLanguage: locale });
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("experience");
  const [showPreview, setShowPreview] = useState(false);
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [experienceDraft, setExperienceDraft] = useState<Experience>({ id: "", kind: "internship", role: "", organization: "", period: "", location: "", description: "" });
  const [projectDraft, setProjectDraft] = useState<Project>({ id: "", name: "", kind: "academic", role: "", date: "", tools: "", url: "", description: "" });
  const [activityDraft, setActivityDraft] = useState<Activity>({ id: "", organization: "", role: "", period: "", description: "" });
  const [courseDraft, setCourseDraft] = useState<Course>({ id: "", name: "", provider: "", date: "", certificateUrl: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CVData>;
        setCv({ ...EMPTY_CV, ...parsed, cvLanguage: parsed.cvLanguage ?? locale });
      } else {
        setCv({ ...EMPTY_CV, cvLanguage: locale });
      }
    } catch {
      setCv({ ...EMPTY_CV, cvLanguage: locale });
    }
    setLoaded(true);
  }, [locale]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
    } catch {
      setNotice(isAr ? "مساحة التخزين في المتصفح غير كافية. احذف صورة أو بيانات قديمة." : "Browser storage is full. Remove older or large data.");
    }
  }, [cv, loaded, isAr]);

  const update = <K extends keyof CVData>(key: K, value: CVData[K]) => setCv((previous) => ({ ...previous, [key]: value }));
  const isActive = (id: SectionId) => cv.selectedSections.includes(id);

  const readiness = [
    { done: Boolean(cv.fullName.trim() && (cv.email.trim() || cv.phone.trim())), text: t.checkContact },
    { done: Boolean((cv.university.trim() || cv.college.trim()) && cv.major.trim()), text: t.checkEducation },
    { done: Boolean(cv.targetRole.trim()), text: t.checkTarget },
    { done: Boolean(cv.experiences.some((item) => item.description.trim()) || cv.projects.some((item) => item.description.trim()) || cv.activities.some((item) => item.description.trim())), text: t.checkContent }
  ];
  const readinessScore = Math.round((readiness.filter((item) => item.done).length / readiness.length) * 100);

  const countFor = (id: SectionId) => {
    if (id === "experience") return cv.experiences.length;
    if (id === "projects") return cv.projects.length;
    if (id === "activities") return cv.activities.length;
    if (id === "courses") return cv.courses.length;
    return listText(cv.skills).length + listText(cv.tools).length + listText(cv.languages).length;
  };

  const beginAdd = () => {
    setEditingId(null);
    setExperienceDraft({ id: "", kind: "internship", role: "", organization: "", period: "", location: "", description: "" });
    setProjectDraft({ id: "", name: "", kind: "academic", role: "", date: "", tools: "", url: "", description: "" });
    setActivityDraft({ id: "", organization: "", role: "", period: "", description: "" });
    setCourseDraft({ id: "", name: "", provider: "", date: "", certificateUrl: "" });
    setFormOpen(true);
  };

  const saveExperience = (event: FormEvent) => {
    event.preventDefault();
    const item = { ...experienceDraft, id: experienceDraft.id || uid() };
    update("experiences", editingId ? cv.experiences.map((entry) => entry.id === editingId ? item : entry) : [...cv.experiences, item]);
    setFormOpen(false);
  };
  const saveProject = (event: FormEvent) => {
    event.preventDefault();
    const item = { ...projectDraft, id: projectDraft.id || uid() };
    update("projects", editingId ? cv.projects.map((entry) => entry.id === editingId ? item : entry) : [...cv.projects, item]);
    setFormOpen(false);
  };
  const saveActivity = (event: FormEvent) => {
    event.preventDefault();
    const item = { ...activityDraft, id: activityDraft.id || uid() };
    update("activities", editingId ? cv.activities.map((entry) => entry.id === editingId ? item : entry) : [...cv.activities, item]);
    setFormOpen(false);
  };
  const saveCourse = (event: FormEvent) => {
    event.preventDefault();
    const item = { ...courseDraft, id: courseDraft.id || uid() };
    update("courses", editingId ? cv.courses.map((entry) => entry.id === editingId ? item : entry) : [...cv.courses, item]);
    setFormOpen(false);
  };

  const editItem = (id: string) => {
    setEditingId(id);
    if (activeSection === "experience") setExperienceDraft({ ...cv.experiences.find((item) => item.id === id)! });
    if (activeSection === "projects") setProjectDraft({ ...cv.projects.find((item) => item.id === id)! });
    if (activeSection === "activities") setActivityDraft({ ...cv.activities.find((item) => item.id === id)! });
    if (activeSection === "courses") setCourseDraft({ ...cv.courses.find((item) => item.id === id)! });
    setFormOpen(true);
  };

  const removeItem = (id: string) => {
    if (activeSection === "experience") update("experiences", cv.experiences.filter((item) => item.id !== id));
    if (activeSection === "projects") update("projects", cv.projects.filter((item) => item.id !== id));
    if (activeSection === "activities") update("activities", cv.activities.filter((item) => item.id !== id));
    if (activeSection === "courses") update("courses", cv.courses.filter((item) => item.id !== id));
  };

  const toggleSection = (id: SectionId) => {
    if (isActive(id)) {
      if (cv.selectedSections.length === 1) return;
      const next = cv.selectedSections.filter((item) => item !== id);
      update("selectedSections", next);
      if (activeSection === id) setActiveSection(next[0]);
      setFormOpen(false);
    } else {
      update("selectedSections", [...cv.selectedSections, id]);
      setActiveSection(id);
    }
  };

  const orderedSections = cv.sectionOrder.filter((id) => isActive(id));
  const moveSection = (id: SectionId, direction: -1 | 1) => {
    const order = [...cv.sectionOrder];
    const index = order.indexOf(id);
    const next = index + direction;
    if (next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    update("sectionOrder", order);
  };

  const reset = () => {
    if (!window.confirm(t.resetConfirm)) return;
    setCv({ ...EMPTY_CV, cvLanguage: locale });
    setActiveSection("experience");
    setFormOpen(false);
    setNotice("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const printCV = () => {
    if (!cv.fullName.trim() || (!cv.email.trim() && !cv.phone.trim())) {
      setNotice(t.profileRequired);
      setShowPreview(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!(cv.university.trim() || cv.college.trim()) || !cv.major.trim()) {
      setNotice(t.educationRequired);
      setShowPreview(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setNotice("");
    window.print();
  };

  const renderSectionForm = () => {
    if (activeSection === "experience") {
      return (
        <form onSubmit={saveExperience} className="grid gap-4">
          <Field label={t.kind}><select value={experienceDraft.kind} onChange={(event) => setExperienceDraft((draft) => ({ ...draft, kind: event.target.value }))} className="cv-select"><option value="internship">{t.internship}</option><option value="summer">{t.summer}</option><option value="part-time">{t.partTime}</option><option value="freelance">{t.freelance}</option><option value="work">{t.work}</option></select></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.role}><TextInput value={experienceDraft.role} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, role: value }))} placeholder={isAr ? "مثال: HR Intern" : "e.g. HR Intern"} /></Field>
            <Field label={t.organization}><TextInput value={experienceDraft.organization} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, organization: value }))} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.period}><TextInput value={experienceDraft.period} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, period: value }))} placeholder={isAr ? "يونيو 2026 – أغسطس 2026" : "Jun 2026 – Aug 2026"} /></Field>
            <Field label={t.location}><TextInput value={experienceDraft.location} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, location: value }))} /></Field>
          </div>
          <Field label={t.description} hint={t.descriptionHint}><TextArea value={experienceDraft.description} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, description: value }))} placeholder={isAr ? "• ساعدت في ...\n• شاركت في ..." : "• Supported ...\n• Contributed to ..."} /></Field>
          <FormActions cancel={() => setFormOpen(false)} saveLabel={editingId ? t.update : t.save} cancelLabel={t.cancel} />
        </form>
      );
    }
    if (activeSection === "projects") {
      return (
        <form onSubmit={saveProject} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.projectName}><TextInput value={projectDraft.name} onChange={(value) => setProjectDraft((draft) => ({ ...draft, name: value }))} /></Field>
            <Field label={t.projectKind}><select value={projectDraft.kind} onChange={(event) => setProjectDraft((draft) => ({ ...draft, kind: event.target.value }))} className="cv-select"><option value="academic">{t.academic}</option><option value="personal">{t.personal}</option><option value="graduation">{t.graduation}</option></select></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.projectRole}><TextInput value={projectDraft.role} onChange={(value) => setProjectDraft((draft) => ({ ...draft, role: value }))} /></Field>
            <Field label={t.date}><TextInput value={projectDraft.date} onChange={(value) => setProjectDraft((draft) => ({ ...draft, date: value }))} /></Field>
          </div>
          <Field label={t.tools}><TextInput value={projectDraft.tools} onChange={(value) => setProjectDraft((draft) => ({ ...draft, tools: value }))} placeholder={isAr ? "مثال: Excel، Power BI، Python" : "e.g. Excel, Power BI, Python"} /></Field>
          <Field label={t.url}><TextInput value={projectDraft.url} onChange={(value) => setProjectDraft((draft) => ({ ...draft, url: value }))} dir="ltr" placeholder="https://" /></Field>
          <Field label={t.description} hint={t.descriptionHint}><TextArea value={projectDraft.description} onChange={(value) => setProjectDraft((draft) => ({ ...draft, description: value }))} /></Field>
          <FormActions cancel={() => setFormOpen(false)} saveLabel={editingId ? t.update : t.save} cancelLabel={t.cancel} />
        </form>
      );
    }
    if (activeSection === "activities") {
      return (
        <form onSubmit={saveActivity} className="grid gap-4">
          <Field label={t.activityName}><TextInput value={activityDraft.organization} onChange={(value) => setActivityDraft((draft) => ({ ...draft, organization: value }))} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.role}><TextInput value={activityDraft.role} onChange={(value) => setActivityDraft((draft) => ({ ...draft, role: value }))} placeholder={isAr ? "مثال: عضو فريق التنظيم" : "e.g. Event Team Member"} /></Field>
            <Field label={t.period}><TextInput value={activityDraft.period} onChange={(value) => setActivityDraft((draft) => ({ ...draft, period: value }))} /></Field>
          </div>
          <Field label={t.description} hint={t.descriptionHint}><TextArea value={activityDraft.description} onChange={(value) => setActivityDraft((draft) => ({ ...draft, description: value }))} /></Field>
          <FormActions cancel={() => setFormOpen(false)} saveLabel={editingId ? t.update : t.save} cancelLabel={t.cancel} />
        </form>
      );
    }
    if (activeSection === "courses") {
      return (
        <form onSubmit={saveCourse} className="grid gap-4">
          <Field label={t.courseName}><TextInput value={courseDraft.name} onChange={(value) => setCourseDraft((draft) => ({ ...draft, name: value }))} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.provider}><TextInput value={courseDraft.provider} onChange={(value) => setCourseDraft((draft) => ({ ...draft, provider: value }))} /></Field>
            <Field label={t.date}><TextInput value={courseDraft.date} onChange={(value) => setCourseDraft((draft) => ({ ...draft, date: value }))} placeholder="2026" /></Field>
          </div>
          <Field label={t.certificateUrl}><TextInput value={courseDraft.certificateUrl} onChange={(value) => setCourseDraft((draft) => ({ ...draft, certificateUrl: value }))} dir="ltr" placeholder="https://" /></Field>
          <FormActions cancel={() => setFormOpen(false)} saveLabel={editingId ? t.update : t.save} cancelLabel={t.cancel} />
        </form>
      );
    }
    return (
      <div className="grid gap-4">
        <Field label={t.skills} hint={t.skillsHint}><TextArea value={cv.skills} onChange={(value) => update("skills", value)} rows={4} placeholder={isAr ? "التواصل الفعال\nالعمل الجماعي\nحل المشكلات" : "Communication\nTeamwork\nProblem solving"} /></Field>
        <Field label={t.technical} hint={t.skillsHint}><TextArea value={cv.tools} onChange={(value) => update("tools", value)} rows={3} placeholder={isAr ? "Microsoft Excel\nPowerPoint" : "Microsoft Excel\nPowerPoint"} /></Field>
        <Field label={t.languages} hint={t.languageHint}><TextArea value={cv.languages} onChange={(value) => update("languages", value)} rows={3} placeholder={isAr ? "العربية — اللغة الأم\nالإنجليزية — متوسط" : "Arabic — Native\nEnglish — Intermediate"} /></Field>
        <p className="text-xs leading-5 text-zinc-500">{isAr ? "اكتب مستويات اللغات بصدق، ولا تضف مهارة لمجرد أنها مطلوبة في إعلان الوظيفة." : "Describe language proficiency honestly, and only include skills you actually have."}</p>
      </div>
    );
  };

  const renderSectionItems = () => {
    if (activeSection === "skills") {
      const total = listText(cv.skills).length + listText(cv.tools).length + listText(cv.languages).length;
      return total ? <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-7 dark:border-zinc-700 dark:bg-zinc-900"><p><strong>{t.skills}: </strong>{listText(cv.skills).join("، ") || "—"}</p><p className="mt-2"><strong>{t.technical}: </strong>{listText(cv.tools).join("، ") || "—"}</p><p className="mt-2"><strong>{t.languages}: </strong>{listText(cv.languages).join("، ") || "—"}</p></div> : <EmptyState t={t} />;
    }
    const items = activeSection === "experience" ? cv.experiences : activeSection === "projects" ? cv.projects : activeSection === "activities" ? cv.activities : cv.courses;
    if (!items.length) return <EmptyState t={t} />;
    return (
      <div className="grid gap-2.5">
        {items.map((raw) => {
          const heading =
            ("role" in raw ? raw.role : "") ||
            ("name" in raw ? raw.name : "") ||
            ("organization" in raw ? raw.organization : "") ||
            ("kind" in raw ? raw.kind : "") ||
            (isAr ? "عنصر جديد" : "New item");
          const sub =
            ("organization" in raw ? raw.organization : "") ||
            ("provider" in raw ? raw.provider : "") ||
            ("date" in raw ? raw.date : "") ||
            ("period" in raw ? raw.period : "") ||
            ("kind" in raw ? raw.kind : "");
          const description = "description" in raw ? raw.description : "";
          return (
            <div key={raw.id} className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-zinc-900 dark:text-white">{heading}</p>
                {sub ? <p className="mt-1 break-words text-xs text-zinc-500">{sub}</p> : null}
                {description ? <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs leading-5 text-zinc-600 dark:text-zinc-300">{description}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => editItem(raw.id)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label={t.edit}><FileText className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeItem(raw.id)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label={t.delete}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const visibleActiveSection = isActive(activeSection) ? activeSection : orderedSections[0] ?? "experience";
  const sectionLabel = (id: SectionId) => isAr ? SECTION_META[id].titleAr : SECTION_META[id].titleEn;

  return (
    <div className="mx-auto max-w-7xl" dir={isAr ? "rtl" : "ltr"}>
      <style jsx global>{`
        .cv-select { width: 100%; border: 1px solid rgb(228 228 231); border-radius: .75rem; background: white; padding: .75rem .875rem; color: #18181b; font-size: .875rem; outline: none; }
        .dark .cv-select { background: #09090b; border-color: rgb(63 63 70); color: white; }
        .cv-select:focus { border-color: #C8A448; box-shadow: 0 0 0 2px rgb(200 164 72 / .15); }
        .cv-document .cv-section h2 { margin: 0 0 9px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1; color: #182B36; font-size: 13px; font-weight: 800; letter-spacing: .02em; }
        .cv-document .cv-section p { font-size: 11.5px; line-height: 1.65; }
        .cv-document .cv-entry { margin: 0 0 11px; break-inside: avoid; }
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: white !important; color: #20252b !important; }
          body > *:not(#skillup-cv-print-root) { display: none !important; }
          #skillup-cv-print-root { display: block !important; position: absolute !important; inset: 0 !important; width: 100% !important; }
          #skillup-cv-print-root .cv-document { width: 100% !important; min-height: 0 !important; padding: 0 !important; box-shadow: none !important; }
          #skillup-cv-print-root .cv-section { break-inside: auto; }
          #skillup-cv-print-root .cv-entry { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C8A448]/40 bg-[#C8A448]/10 px-3 py-1.5 text-xs font-bold text-[#8A6D1F] dark:text-[#E2C46F]">
            <Sparkles className="h-3.5 w-3.5" /> {t.eyebrow}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t.saved}
          </div>
        </div>
        <div className="max-w-3xl">
          <h1 className="text-2xl font-black tracking-tight text-[#182B36] dark:text-white md:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">{t.language}:</span>
            <button type="button" onClick={() => update("cvLanguage", "ar")} className={cx("rounded-lg border px-3 py-1.5 text-xs font-bold", cv.cvLanguage === "ar" ? "border-[#182B36] bg-[#182B36] text-white dark:border-[#C8A448] dark:bg-[#C8A448] dark:text-[#182B36]" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300")}>{t.arabic}</button>
            <button type="button" onClick={() => update("cvLanguage", "en")} className={cx("rounded-lg border px-3 py-1.5 text-xs font-bold", cv.cvLanguage === "en" ? "border-[#182B36] bg-[#182B36] text-white dark:border-[#C8A448] dark:bg-[#C8A448] dark:text-[#182B36]" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300")}>{t.english}</button>
          </div>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"><RotateCcw className="h-3.5 w-3.5" />{t.reset}</button>
        </div>
        {notice ? <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Close"><X className="h-4 w-4" /></button></div> : null}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.92fr)] xl:gap-6">
        <div className={cx("min-w-0 space-y-5", showPreview && "hidden lg:block")}>
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#182B36]/[0.07] text-[#182B36] dark:bg-[#C8A448]/15 dark:text-[#E2C46F]"><FileText className="h-5 w-5" /></div>
              <div><h2 className="font-extrabold text-zinc-900 dark:text-white">{t.stepProfile}</h2><p className="text-xs text-zinc-500">{isAr ? "معلومات تساعد جهة التوظيف على التواصل معك." : "Details employers need to identify and contact you."}</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.fullName} required><TextInput value={cv.fullName} onChange={(value) => update("fullName", value)} placeholder={isAr ? "الاسم كما تريد ظهوره في السيرة" : "Your name as it should appear on the CV"} /></Field>
              <Field label={t.targetRole}><TextInput value={cv.targetRole} onChange={(value) => update("targetRole", value)} placeholder={isAr ? "مثال: Marketing Intern" : "e.g. Marketing Intern"} /></Field>
              <Field label={t.email}><TextInput type="email" value={cv.email} onChange={(value) => update("email", value)} dir="ltr" placeholder="name@email.com" /></Field>
              <Field label={t.phone}><TextInput value={cv.phone} onChange={(value) => update("phone", value)} dir="ltr" placeholder="+20 ..." /></Field>
              <Field label={t.city}><TextInput value={cv.city} onChange={(value) => update("city", value)} /></Field>
              <Field label={t.linkedin}><TextInput value={cv.linkedin} onChange={(value) => update("linkedin", value)} dir="ltr" placeholder="https://linkedin.com/in/..." /></Field>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">{isAr ? "أدخل البريد الإلكتروني أو رقم الهاتف على الأقل." : "Enter at least an email address or a phone number."}</p>
            <div className="mt-4"><Field label={t.summary} hint={t.summaryHint}><TextArea value={cv.summary} onChange={(value) => update("summary", value)} rows={3} placeholder={isAr ? "طالب في كلية ... مهتم بمجال ... وأسعى لاكتساب خبرة في ..." : "University student majoring in ... interested in ... and seeking an opportunity to ..."} /></Field></div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#182B36]/[0.07] text-[#182B36] dark:bg-[#C8A448]/15 dark:text-[#E2C46F]"><GraduationCap className="h-5 w-5" /></div>
              <div><h2 className="font-extrabold text-zinc-900 dark:text-white">{t.stepEducation}</h2><p className="text-xs text-zinc-500">{t.educationNote}</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.university}><TextInput value={cv.university} onChange={(value) => update("university", value)} /></Field>
              <Field label={t.college}><TextInput value={cv.college} onChange={(value) => update("college", value)} /></Field>
              <Field label={t.major} required><TextInput value={cv.major} onChange={(value) => update("major", value)} /></Field>
              <Field label={t.yearLevel}><select value={cv.yearLevel} onChange={(event) => update("yearLevel", event.target.value)} className="cv-select"><option value="">—</option>{(isAr ? ["الفرقة الأولى", "الفرقة الثانية", "الفرقة الثالثة", "الفرقة الرابعة", "دراسات عليا", "أخرى"] : ["First year", "Second year", "Third year", "Fourth year", "Postgraduate", "Other"]).map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label={t.startYear}><TextInput value={cv.startYear} onChange={(value) => update("startYear", value)} placeholder="2023" /></Field>
              <Field label={t.graduationYear}><TextInput value={cv.graduationYear} onChange={(value) => update("graduationYear", value)} placeholder="2027" /></Field>
              <Field label={t.gpa}><TextInput value={cv.gpa} onChange={(value) => update("gpa", value)} placeholder={isAr ? "مثال: جيد جدًا أو 3.4/4" : "e.g. Very Good or 3.4/4"} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-extrabold text-zinc-900 dark:text-white">{t.sectionsTitle}</h2><p className="mt-1 text-xs leading-5 text-zinc-500">{t.sectionsSub}</p></div>
              <button type="button" onClick={() => setShowSectionManager((value) => !value)} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"><Wrench className="h-3.5 w-3.5" />{t.selectSections}<ChevronDown className={cx("h-3.5 w-3.5 transition", showSectionManager && "rotate-180")} /></button>
            </div>

            {showSectionManager ? (
              <div className="mb-4 grid gap-2 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700 sm:grid-cols-2">
                {(Object.keys(SECTION_META) as SectionId[]).map((id) => {
                  const Icon = SECTION_META[id].icon;
                  return <button key={id} type="button" onClick={() => toggleSection(id)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800"><Icon className="h-4 w-4 text-[#8A6D1F]" /><span className="flex-1">{sectionLabel(id)}</span>{isActive(id) ? <Check className="h-4 w-4 text-emerald-600" /> : <Plus className="h-4 w-4 text-zinc-400" />}</button>;
                })}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              {orderedSections.map((id) => {
                const Icon = SECTION_META[id].icon;
                const active = visibleActiveSection === id;
                return (
                  <button key={id} type="button" onClick={() => { setActiveSection(id); setFormOpen(false); }} className={cx("flex min-h-[94px] items-start gap-3 rounded-xl border p-3.5 text-start transition", active ? "border-[#C8A448] bg-[#C8A448]/[0.08] ring-1 ring-[#C8A448]/20" : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800")}>
                    <div className={cx("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", active ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1"><span className="block text-sm font-bold text-zinc-900 dark:text-white">{sectionLabel(id)}</span><span className="mt-1 block text-[11px] leading-5 text-zinc-500">{isAr ? SECTION_META[id].subAr : SECTION_META[id].subEn}</span><span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{countFor(id)} {id === "experience" ? t.experienceCount : id === "projects" ? t.projectCount : id === "activities" ? t.activityCount : id === "courses" ? t.coursesCount : t.skillsCount}</span></div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/60">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-extrabold text-zinc-900 dark:text-white">{sectionLabel(visibleActiveSection)}</h3><p className="mt-1 text-xs text-zinc-500">{isAr ? "كل الحقول هنا اختيارية. أضف ما ينطبق عليك فقط." : "All fields are optional. Add only what applies to you."}</p></div>
                {visibleActiveSection !== "skills" && !formOpen ? <button type="button" onClick={beginAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-[#182B36] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36] dark:hover:bg-[#d8b95d]"><Plus className="h-4 w-4" />{t.addNew}</button> : null}
              </div>
              {visibleActiveSection === "skills" ? renderSectionForm() : formOpen ? <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"><div className="mb-4 flex items-center justify-between gap-3"><h4 className="text-sm font-bold">{editingId ? t.edit : t.addNew}</h4><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label={t.cancel}><X className="h-4 w-4" /></button></div>{renderSectionForm()}</div> : renderSectionItems()}
              {visibleActiveSection === "skills" ? <div className="mt-4 flex justify-end"><button type="button" onClick={() => setNotice(isAr ? "تم حفظ المهارات تلقائيًا." : "Skills are saved automatically.")} className="rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white dark:bg-[#C8A448] dark:text-[#182B36]">{t.save}</button></div> : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {orderedSections.map((id, index) => <div key={id} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2 py-1 text-[10px] text-zinc-500 dark:border-zinc-700">{sectionLabel(id)}<button type="button" onClick={() => moveSection(id, -1)} disabled={index === 0} className="rounded p-0.5 hover:bg-zinc-100 disabled:opacity-25 dark:hover:bg-zinc-800" aria-label={t.up}><ChevronLeft className="h-3 w-3" /></button><button type="button" onClick={() => moveSection(id, 1)} disabled={index === orderedSections.length - 1} className="rounded p-0.5 hover:bg-zinc-100 disabled:opacity-25 dark:hover:bg-zinc-800" aria-label={t.down}><ChevronRight className="h-3 w-3" /></button></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-extrabold text-zinc-900 dark:text-white">{t.checklist}</h2><span className="text-sm font-black text-[#8A6D1F] dark:text-[#E2C46F]">{readinessScore}%</span></div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-[#C8A448] transition-all" style={{ width: `${readinessScore}%` }} /></div>
            <div className="grid gap-2">{readiness.map((item) => <div key={item.text} className="flex items-start gap-2 text-xs leading-5"><CheckCircle2 className={cx("mt-0.5 h-4 w-4 shrink-0", item.done ? "text-emerald-600" : "text-zinc-300 dark:text-zinc-600")} /><span className={item.done ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-500"}>{item.text}</span></div>)}</div>
            <div className="mt-4 rounded-xl border border-[#C8A448]/30 bg-[#C8A448]/[0.07] p-3 text-xs leading-6 text-zinc-600 dark:text-zinc-300"><div className="mb-1 flex items-center gap-1.5 font-bold text-[#80621c] dark:text-[#E2C46F]"><Lightbulb className="h-3.5 w-3.5" /> ATS</div>{t.atsNote}</div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] leading-5 text-zinc-500">{t.savedInfo}</p><button type="button" onClick={printCV} className="inline-flex items-center gap-2 rounded-xl bg-[#182B36] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36] dark:hover:bg-[#d8b95d]"><Download className="h-4 w-4" />{t.print}</button></div>
            <p className="mt-2 text-[11px] leading-5 text-zinc-500">{t.printHint}</p>
          </section>
        </div>

        <aside className={cx("min-w-0 lg:sticky lg:top-24", !showPreview && "hidden lg:block")}>
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-extrabold text-zinc-900 dark:text-white">{t.preview}</h2><p className="text-xs text-zinc-500">{isAr ? "تتحدث المعاينة تلقائيًا مع كل تعديل." : "The preview updates as you edit."}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><Eye className="h-3 w-3" /> Live</span></div>
          <LivePreview cv={cv} isAr={isAr} />
        </aside>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden dark:border-zinc-700 dark:bg-zinc-900/95">
        <button type="button" onClick={() => setShowPreview(false)} className={cx("rounded-xl px-3 py-3 text-xs font-bold", !showPreview ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "text-zinc-600 dark:text-zinc-300")}>{t.mobileForm}</button>
        <button type="button" onClick={() => setShowPreview(true)} className={cx("rounded-xl px-3 py-3 text-xs font-bold", showPreview ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "text-zinc-600 dark:text-zinc-300")}>{t.mobilePreview}</button>
      </div>
      <div className="h-20 lg:hidden" />

      {loaded && typeof document !== "undefined" ? createPortal(<div id="skillup-cv-print-root" style={{ display: "none" }}><CVDocument cv={cv} /></div>, document.body) : null}
    </div>
  );
}

function FormActions({ cancel, saveLabel, cancelLabel }: { cancel: () => void; saveLabel: string; cancelLabel: string }) {
  return <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"><button type="button" onClick={cancel} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{cancelLabel}</button><button type="submit" className="rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36]">{saveLabel}</button></div>;
}

function EmptyState({ t }: { t: LocaleCopy }) {
  return <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"><Plus className="h-5 w-5" /></div><p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t.noItems}</p><p className="mt-1 text-xs text-zinc-500">{t.noItemsHint}</p></div>;
}
