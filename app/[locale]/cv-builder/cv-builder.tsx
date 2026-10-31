"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Plus,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";

import type { Locale } from "@/i18n";
import { downloadCvPdf } from "./pdf-export";

type SectionId = "experience" | "projects" | "activities" | "courses" | "skills";
type CVTemplate = "reference" | "signature" | "executive";
type WizardStep = "template" | "profile" | "education" | "sections" | SectionId | "review";
type EducationStatus = "studying" | "graduated";
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
  qualification: string;
  educationStatus: EducationStatus;
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
  template: CVTemplate;
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
  qualification: "",
  educationStatus: "studying",
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
  selectedSections: [],
  cvLanguage: "ar",
  template: "reference"
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const cx = (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(" ");

function listText(value: string): string[] {
  const result: string[] = [];
  for (const line of value.split(/\r?\n/)) {
    let current = "";
    let depth = 0;
    const push = () => {
      const cleaned = current.trim().replace(/^(?:[-*•▪◦]|\d+[.)])\s*/, "").trim();
      if (cleaned) result.push(cleaned);
      current = "";
    };
    for (const char of line) {
      if (char === "(" || char === "[" || char === "{") depth += 1;
      if (char === ")" || char === "]" || char === "}") depth = Math.max(0, depth - 1);
      if (depth === 0 && /[,،;؛]/.test(char)) push();
      else current += char;
    }
    push();
  }
  return result;
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

function uniqueText(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  return values.map((value) => (value ?? "").trim()).filter((value) => {
    if (!value) return false;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function descriptionLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•▪◦‣]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function CVDescription({ value }: { value: string }) {
  const lines = descriptionLines(value);
  if (!lines.length) return null;
  return (
    <ul className="cv-bullets">
      {lines.map((line, index) => <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>)}
    </ul>
  );
}

function CVDocument({ cv }: { cv: CVData }) {
  const ar = cv.cvLanguage === "ar";
  const template = cv.template ?? "reference";
  const t = {
    summary: ar ? "الملخص المهني" : "Professional Summary",
    education: ar ? "التعليم" : "Education",
    experience: ar ? "الخبرات العملية والتدريب" : "Professional Experience",
    projects: ar ? "المشاريع" : "Projects",
    activities: ar ? "التطوع والأنشطة" : "Leadership & Volunteering",
    courses: ar ? "الكورسات والشهادات" : "Courses & Certifications",
    skills: ar ? "المهارات" : "Skills",
    tools: ar ? "الأدوات والتقنيات" : "Tools & Technologies",
    languages: ar ? "اللغات" : "Languages",
    expected: ar ? "التخرج المتوقع" : "Expected Graduation",
    graduated: ar ? "سنة التخرج" : "Graduation",
    present: ar ? "حتى الآن" : "Present",
    studyYear: ar ? "السنة الدراسية" : "Study year",
    gpa: ar ? "التقدير" : "Grade",
  };
  const contact = [cv.email, cv.phone, cv.city, cv.linkedin].filter(Boolean);
  const experience = cv.experiences.filter((item) => item.role || item.organization || item.description);
  const projects = cv.projects.filter((item) => item.name || item.description);
  const activities = cv.activities.filter((item) => item.organization || item.role || item.description);
  const courses = cv.courses.filter((item) => item.name || item.provider);
  const skills = listText(cv.skills);
  const tools = listText(cv.tools);
  const languages = listText(cv.languages);
  const degreeLine = cv.qualification.trim() || cv.major.trim();
  const majorIsAlreadyInDegree = Boolean(cv.qualification.trim() && cv.major.trim() && cv.qualification.toLocaleLowerCase().includes(cv.major.toLocaleLowerCase()));
  const educationLines = uniqueText([
    degreeLine,
    cv.qualification.trim() && cv.major.trim() && !majorIsAlreadyInDegree ? `${ar ? "التخصص" : "Major"}: ${cv.major}` : "",
    cv.college,
    cv.university
  ]);
  const hasEducation = educationLines.length > 0 || Boolean(cv.startYear || cv.graduationYear || cv.gpa);
  const compact = template === "executive";

  return (
    <article
      className={`cv-document cv-template-${template} mx-auto bg-white text-[#20252b]`}
      dir={ar ? "rtl" : "ltr"}
      lang={cv.cvLanguage}
      style={{
        width: PAGE_WIDTH,
        minHeight: 1123,
        boxSizing: "border-box",
        padding: compact ? "38px 46px" : "48px 56px",
        fontFamily: "var(--font-sans-app), Arial, 'Segoe UI', Tahoma, sans-serif"
      }}
    >
      <header className="cv-document-header">
        <h1 className="cv-name">{cv.fullName || (ar ? "الاسم بالكامل" : "Full Name")}</h1>
        {cv.targetRole ? <p className="cv-target-role">{cv.targetRole}</p> : null}
        {contact.length ? (
          <p className="cv-contact" dir="ltr">
            {contact.map((value, index) => <span key={`${value}-${index}`}>{value}{index < contact.length - 1 ? "  |  " : ""}</span>)}
          </p>
        ) : null}
      </header>

      {cv.summary.trim() ? (
        <section className="cv-section">
          <h2>{t.summary}</h2>
          <p className="cv-summary-text">{cv.summary.trim()}</p>
        </section>
      ) : null}

      {hasEducation ? (
        <section className="cv-section">
          <h2>{t.education}</h2>
          <div className="cv-education-layout">
            <div className="cv-education-details">
              {educationLines.map((line, index) => <p key={`${line}-${index}`} className={index === 0 ? "cv-entry-title" : "cv-muted-line"}>{line}</p>)}
              {cv.yearLevel && !["أخرى", "Other"].includes(cv.yearLevel) && cv.educationStatus !== "graduated" ? <p className="cv-muted-line">{t.studyYear}: {cv.yearLevel}</p> : null}
            </div>
            <div className="cv-education-meta">
              {cv.startYear ? <p>{cv.startYear}{cv.graduationYear ? ` – ${cv.graduationYear}` : cv.educationStatus === "studying" ? ` – ${t.present}` : ""}</p> : null}
              {!cv.startYear && cv.graduationYear ? <p>{cv.educationStatus === "graduated" ? t.graduated : t.expected}: {cv.graduationYear}</p> : null}
              {cv.gpa ? <p>{t.gpa}: {cv.gpa}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {cv.sectionOrder.filter((id) => cv.selectedSections.includes(id)).map((sectionId) => {
        if (sectionId === "experience" && experience.length) {
          return (
            <section className="cv-section" key={sectionId}>
              <h2>{t.experience}</h2>
              {experience.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="cv-entry-heading">
                    <p className="cv-entry-title">{item.role || item.kind}</p>
                    {item.period ? <p className="cv-entry-date">{item.period}</p> : null}
                  </div>
                  {item.organization || item.location ? <p className="cv-entry-subtitle">{[item.organization, item.location].filter(Boolean).join(" · ")}</p> : null}
                  <CVDescription value={item.description} />
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "projects" && projects.length) {
          return (
            <section className="cv-section" key={sectionId}>
              <h2>{t.projects}</h2>
              {projects.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="cv-entry-heading">
                    <p className="cv-entry-title">{item.name}</p>
                    {item.date ? <p className="cv-entry-date">{item.date}</p> : null}
                  </div>
                  {item.role || item.kind ? <p className="cv-entry-subtitle">{[item.role, item.kind].filter(Boolean).join(" · ")}</p> : null}
                  <CVDescription value={item.description} />
                  {item.tools ? <p className="cv-entry-detail"><strong>{t.tools}: </strong>{item.tools}</p> : null}
                  {item.url ? <p className="cv-entry-link" dir="ltr">{item.url}</p> : null}
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "activities" && activities.length) {
          return (
            <section className="cv-section" key={sectionId}>
              <h2>{t.activities}</h2>
              {activities.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="cv-entry-heading">
                    <p className="cv-entry-title">{item.role || item.organization}</p>
                    {item.period ? <p className="cv-entry-date">{item.period}</p> : null}
                  </div>
                  {item.organization && item.role ? <p className="cv-entry-subtitle">{item.organization}</p> : null}
                  <CVDescription value={item.description} />
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "courses" && courses.length) {
          return (
            <section className="cv-section" key={sectionId}>
              <h2>{t.courses}</h2>
              {courses.map((item) => (
                <div className="cv-entry" key={item.id}>
                  <div className="cv-entry-heading">
                    <p className="cv-entry-title">{item.name}</p>
                    {item.date ? <p className="cv-entry-date">{item.date}</p> : null}
                  </div>
                  {item.provider ? <p className="cv-entry-subtitle">{item.provider}</p> : null}
                  {item.certificateUrl ? <p className="cv-entry-link" dir="ltr">{item.certificateUrl}</p> : null}
                </div>
              ))}
            </section>
          );
        }
        if (sectionId === "skills" && (skills.length || tools.length || languages.length)) {
          return (
            <section className="cv-section" key={sectionId}>
              <h2>{t.skills}</h2>
              {skills.length ? <p>{skills.join(" · ")}</p> : null}
              {tools.length ? <p className="cv-skill-group"><strong>{t.tools}: </strong>{tools.join(" · ")}</p> : null}
              {languages.length ? <p className="cv-skill-group"><strong>{t.languages}: </strong>{languages.join(" · ")}</p> : null}
            </section>
          );
        }
        return null;
      })}
    </article>
  );
}


function TemplateThumbnail({ template, isAr }: { template: CVTemplate; isAr: boolean }) {
  const isReference = template === "reference";
  const isSignature = template === "signature";
  const accent = isReference ? "#24466F" : isSignature ? "#182B36" : "#20252B";
  const secondary = isReference ? "#4D83C5" : isSignature ? "#8A6D1F" : "#515B66";
  const rule = isReference ? "#AFC3DE" : isSignature ? "#C8A448" : "#AAB1B8";
  const headings = isAr
    ? ["الملخص المهني", "التعليم", "الخبرات العملية", "المهارات"]
    : ["PROFESSIONAL SUMMARY", "EDUCATION", "EXPERIENCE", "SKILLS"];

  return (
    <div className="h-56 overflow-hidden rounded-xl border border-zinc-200 bg-[#eef1f4] p-3 dark:border-zinc-700">
      <div className="mx-auto h-full max-w-[190px] overflow-hidden bg-white px-3 py-3.5 shadow-sm" style={{ color: "#20252b" }}>
        <header className={isReference ? "text-center" : isAr ? "text-right" : "text-left"}>
          <div className="truncate font-extrabold" style={{ color: accent, fontSize: isSignature ? 9 : 8.5, lineHeight: 1.25 }}>
            {isAr ? "اسمك بالكامل" : "YOUR NAME"}
          </div>
          <div className="mt-1 truncate font-semibold" style={{ color: secondary, fontSize: 5.5, fontStyle: isReference ? "italic" : "normal", letterSpacing: isExecutiveTemplate(template) ? ".5px" : "0" }}>
            {isAr ? "المسمى الوظيفي المستهدف" : "TARGET JOB TITLE"}
          </div>
          <div className={`mt-2 flex flex-wrap gap-x-1 gap-y-0.5 text-[4px] text-slate-500 ${isReference ? "justify-center" : ""}`}>
            <span>email@example.com</span><span>•</span><span>+20 000</span><span>•</span><span>Cairo</span>
          </div>
        </header>
        <div className="mt-2.5 h-[2px] w-full" style={{ background: rule, height: isSignature ? 2.5 : 1 }} />
        {headings.map((heading, index) => (
          <section key={heading} className="mt-2">
            {isReference ? <div className="mb-1 h-px w-full" style={{ background: rule }} /> : null}
            <div className="mb-1 truncate font-extrabold" style={{ color: accent, fontSize: 5.2, letterSpacing: isExecutiveTemplate(template) ? ".35px" : "0" }}>{heading}</div>
            {!isReference ? <div className="mb-1 h-px w-full" style={{ background: rule, opacity: isSignature ? 1 : .8 }} /> : null}
            <div className="space-y-[3px]">
              <div className="flex items-center justify-between gap-1">
                <div className="h-[3px] w-2/5 rounded-sm" style={{ background: "#64748b", opacity: .65 }} />
                {index > 0 ? <div className="h-[2px] w-1/5 rounded-sm bg-slate-300" /> : null}
              </div>
              <div className="h-[2.5px] w-full rounded-sm bg-slate-200" />
              <div className="h-[2.5px] w-10/12 rounded-sm bg-slate-200" />
              {index === 2 ? <div className="ml-2 h-[2px] w-9/12 rounded-sm bg-slate-200" /> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function isExecutiveTemplate(template: CVTemplate): boolean {
  return template === "executive";
}

function CVPreviewModal({
  cv,
  isAr,
  onClose,
  onDownload,
  downloading,
  onTemplateChange
}: {
  cv: CVData;
  isAr: boolean;
  onClose: () => void;
  onDownload: () => void;
  downloading: boolean;
  onTemplateChange: (template: CVTemplate) => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(900);
  const [sheetHeight, setSheetHeight] = useState(1123);
  const [zoom, setZoom] = useState(1);
  const fitScale = Math.min(1, Math.max(0.2, viewportWidth / PAGE_WIDTH));
  const scale = fitScale * zoom;
  const templateOptions: Array<{ id: CVTemplate; title: string; description: string }> = isAr
    ? [
        { id: "reference", title: "Blue Professional", description: "نمط نموذج Word المرفق" },
        { id: "signature", title: "SkillUp Signature", description: "الكحلي والذهبي" },
        { id: "executive", title: "Executive Minimal", description: "رسمي أبيض وأسود" }
      ]
    : [
        { id: "reference", title: "Blue Professional", description: "Your reference template" },
        { id: "signature", title: "SkillUp Signature", description: "Navy and gold identity" },
        { id: "executive", title: "Executive Minimal", description: "Formal monochrome layout" }
      ];

  useEffect(() => {
    const viewport = viewportRef.current;
    const sheet = sheetRef.current;
    if (!viewport || !sheet) return;
    const measureViewport = () => {
      const horizontalPadding = window.matchMedia("(min-width: 640px)").matches ? 48 : 24;
      setViewportWidth(Math.max(240, (viewport.clientWidth || 900) - horizontalPadding));
      setSheetHeight(sheet.offsetHeight || 1123);
    };
    const observer = new ResizeObserver(measureViewport);
    observer.observe(viewport);
    observer.observe(sheet);
    measureViewport();
    window.addEventListener("resize", measureViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureViewport);
    };
  }, []);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const getFocusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []);
    window.requestAnimationFrame(() => (getFocusable()[0] ?? dialogRef.current)?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const currentTemplate = cv.template ?? "reference";

  return createPortal(
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[100] flex flex-col bg-[#e9edf2] text-zinc-900 outline-none" dir={isAr ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={isAr ? "معاينة السيرة الذاتية" : "CV preview"}>
      <header className="z-10 shrink-0 border-b border-zinc-200 bg-white shadow-sm">
        <div className="flex min-h-16 items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#182B36] text-white"><FileText className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold sm:text-base">{isAr ? "معاينة السيرة الذاتية" : "CV Preview"}</h2>
              <p className="text-[11px] text-zinc-500">{isAr ? "المعاينة تتحدث تلقائيًا مع كل تعديل" : "Preview updates automatically as you edit"}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onDownload} className="inline-flex items-center gap-2 rounded-xl bg-[#182B36] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#294653] disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:text-sm" disabled={downloading}>
              <Download className="h-4 w-4" /><span className="hidden sm:inline">{downloading ? (isAr ? "جاري تجهيز PDF..." : "Preparing PDF...") : (isAr ? "تحميل PDF" : "Download PDF")}</span><span className="sm:hidden">{downloading ? "…" : "PDF"}</span>
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-zinc-200 p-2.5 text-zinc-600 transition hover:bg-zinc-100" aria-label={isAr ? "إغلاق المعاينة" : "Close preview"}><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-3 py-2.5 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {templateOptions.map((option) => {
              const active = currentTemplate === option.id;
              return (
                <button key={option.id} type="button" onClick={() => onTemplateChange(option.id)} className={`min-w-[104px] rounded-xl border px-3 py-2 text-start transition sm:min-w-[145px] ${active ? "border-[#182B36] bg-[#182B36] text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"}`}>
                  <span className="block text-xs font-extrabold">{option.title}</span>
                  <span className={`mt-0.5 block text-[10px] ${active ? "text-white/75" : "text-zinc-500"}`}>{option.description}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-1">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.15).toFixed(2))))} disabled={zoom <= 0.7} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30" aria-label={isAr ? "تصغير" : "Zoom out"}><ZoomOut className="h-4 w-4" /></button>
            <span className="min-w-[48px] text-center text-[11px] font-bold tabular-nums text-zinc-600">{Math.round(scale * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(1.75, Number((value + 0.15).toFixed(2))))} disabled={zoom >= 1.75} className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30" aria-label={isAr ? "تكبير" : "Zoom in"}><ZoomIn className="h-4 w-4" /></button>
            <span className="mx-0.5 h-5 w-px bg-zinc-200" />
            <button type="button" onClick={() => setZoom(1)} className="rounded-lg px-2 py-2 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100">{isAr ? "ملاءمة" : "Fit"}</button>
          </div>
        </div>
      </header>

      <main ref={viewportRef} className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-6">
        <div className="mx-auto" style={{ width: PAGE_WIDTH * scale, height: sheetHeight * scale }}>
          <div ref={sheetRef} style={{ width: PAGE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left", boxShadow: "0 10px 38px rgba(15,23,42,.18)" }}>
            <CVDocument cv={cv} />
          </div>
        </div>
      </main>
      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-2 text-center text-[10px] text-zinc-500 sm:text-xs">
        {isAr ? "قالب بعمود واحد وعناوين قياسية لتحسين قابلية قراءة أنظمة ATS. راجع المحتوى قبل التقديم." : "Single-column layout with standard headings to support ATS readability. Review your content before applying."}
      </footer>
    </div>,
    document.body
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
    editItem: "تعديل العنصر",
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
    qualification: "المؤهل العلمي",
    educationStatus: "حالة الدراسة",
    studying: "ما زلت أدرس",
    graduated: "تخرجت",
    college: "الكلية",
    major: "التخصص الدراسي",
    yearLevel: "الفرقة الدراسية",
    startYear: "سنة الالتحاق",
    graduationYear: "سنة التخرج",
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
    print: "تحميل PDF",
    printHint: "سيتم تنزيل ملف PDF نصي مباشرةً دون فتح نافذة الطباعة.",
    saved: "يتم الحفظ تلقائيًا على هذا الجهاز",
    savedInfo: "بياناتك لا تُرسل إلى خادم SkillUp في هذه المرحلة.",
    reset: "مسح كل البيانات",
    resetConfirm: "هل تريد مسح بيانات السيرة الحالية من هذا الجهاز؟ لا يمكن التراجع عن ذلك.",
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
    removeSection: "إزالة القسم من السيرة",
    templates: "اختر تصميم سيرتك",
    templatesHint: "تقدر تغير التصميم في أي وقت دون التأثير على بياناتك.",
    templateBlue: "Blue Professional — القالب المستوحى من ملف Word المرفق",
    templateSignature: "SkillUp Signature — هوية SkillUp",
    templateExecutive: "Executive Minimal — أبيض وأسود",
    stepSections: "الأقسام المتاحة لديك",
    openPreview: "معاينة السيرة",
    closePreview: "العودة للمحرر",
    chooseTemplateTitle: "اختار شكل سيرتك الذاتية",
    chooseTemplateHint: "ابدأ باختيار تصميم رسمي، وبعدها هنمشي معاك خطوة بخطوة.",
    startBuilding: "التالي",
    nextStep: "التالي",
    previousStep: "السابق",
    skipStep: "تخطي الخطوة",
    finishSteps: "الوصول للمعاينة",
    stepOf: "من",
    reviewTitle: "راجع سيرتك الذاتية",
    downloadNow: "تحميل PDF مباشرة",
    loadingPdf: "جاري تجهيز الملف...",
    pdfError: "تعذر تجهيز ملف PDF. تحقق من اتصال الإنترنت وحاول مرة أخرى.",
    chooseAgain: "تغيير التصميم"
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
    editItem: "Edit item",
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
    qualification: "Qualification / degree",
    educationStatus: "Study status",
    studying: "Currently studying",
    graduated: "Graduated",
    college: "Faculty / school",
    major: "Major / field of study",
    yearLevel: "Current study year",
    startYear: "Start year",
    graduationYear: "Graduation / expected year",
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
    print: "Download PDF",
    printHint: "Your text-based PDF downloads directly without opening the print dialog.",
    saved: "Automatically saved on this device",
    savedInfo: "Your information is not sent to SkillUp servers at this stage.",
    reset: "Clear all data",
    resetConfirm: "Clear the current CV data from this device? This cannot be undone.",
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
    removeSection: "Remove section from CV",
    templates: "Choose your CV design",
    templatesHint: "Change the design any time without affecting your information.",
    templateBlue: "Blue Professional — inspired by your Word sample",
    templateSignature: "SkillUp Signature — SkillUp identity",
    templateExecutive: "Executive Minimal — monochrome",
    stepSections: "Your available sections",
    openPreview: "Preview CV",
    closePreview: "Back to editor",
    chooseTemplateTitle: "Choose your CV design",
    chooseTemplateHint: "Start with a formal design, then complete your CV one step at a time.",
    startBuilding: "Next",
    nextStep: "Next",
    previousStep: "Back",
    skipStep: "Skip this step",
    finishSteps: "Go to preview",
    stepOf: "of",
    reviewTitle: "Review your CV",
    downloadNow: "Download PDF directly",
    loadingPdf: "Preparing your file...",
    pdfError: "Could not prepare the PDF. Check your internet connection and try again.",
    chooseAgain: "Change design"
  }, [isAr]);

  const [cv, setCv] = useState<CVData>({ ...EMPTY_CV, cvLanguage: locale });
  const [loaded, setLoaded] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("template");
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
        const validSectionIds = Object.keys(SECTION_META) as SectionId[];
        const savedOrder = Array.isArray(parsed.sectionOrder)
          ? parsed.sectionOrder.filter((id): id is SectionId => validSectionIds.includes(id as SectionId))
          : [];
        const normalizedOrder = [...new Set(savedOrder)];
        const mergedOrder = [
          ...normalizedOrder,
          ...EMPTY_CV.sectionOrder.filter((id) => !normalizedOrder.includes(id))
        ];
        const savedSelected = Array.isArray(parsed.selectedSections)
          ? parsed.selectedSections.filter((id): id is SectionId => validSectionIds.includes(id as SectionId))
          : [...EMPTY_CV.selectedSections];
        const normalizedSelected = [...new Set(savedSelected)];
        const inferredSelected: SectionId[] = [];
        if (Array.isArray(parsed.experiences) && parsed.experiences.length) inferredSelected.push("experience");
        if (Array.isArray(parsed.projects) && parsed.projects.length) inferredSelected.push("projects");
        if (Array.isArray(parsed.activities) && parsed.activities.length) inferredSelected.push("activities");
        if (Array.isArray(parsed.courses) && parsed.courses.length) inferredSelected.push("courses");
        if ([parsed.skills, parsed.tools, parsed.languages].some((value) => typeof value === "string" && value.trim())) inferredSelected.push("skills");

        setCv({
          ...EMPTY_CV,
          ...parsed,
          qualification: parsed.qualification ?? "",
          educationStatus: parsed.educationStatus ?? "studying",
          template: parsed.template === "reference" || parsed.template === "signature" || parsed.template === "executive" ? parsed.template : parsed.template === "compact" ? "executive" : "signature",
          sectionOrder: mergedOrder,
          // selectedSections represents the user's intentional visibility choices.
          // Keep hidden sections hidden; every section remains available in the section manager.
          selectedSections: Array.isArray(parsed.selectedSections) ? normalizedSelected : inferredSelected,
          cvLanguage: parsed.cvLanguage ?? locale
        });
        // Remove the one-time migration backup only after the current CV JSON was parsed successfully.
        try { localStorage.removeItem("_backup_before_redesign"); } catch { /* storage may be read-only */ }
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

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const update = <K extends keyof CVData>(key: K, value: CVData[K]) => setCv((previous) => ({ ...previous, [key]: value }));
  const isActive = (id: SectionId) => cv.selectedSections.includes(id);
  const orderedSections = cv.sectionOrder.filter((id) => isActive(id));
  const isSectionStep = (step: WizardStep): step is SectionId => Object.prototype.hasOwnProperty.call(SECTION_META, step);
  const visibleActiveSection: SectionId = isSectionStep(wizardStep) ? wizardStep : orderedSections[0] ?? "experience";
  const wizardSteps: WizardStep[] = ["template", "profile", "education", "sections", ...orderedSections, "review"];
  // Exclude the initial template picker from the numbered progress steps.
  // The explicit type guard narrows the array element type for TypeScript.
  const visibleWizardSteps: Exclude<WizardStep, "template">[] = wizardSteps.filter(
    (step): step is Exclude<WizardStep, "template"> => step !== "template"
  );
  const currentWizardIndex = Math.max(0, wizardSteps.indexOf(wizardStep));
  const currentVisibleStepIndex =
    wizardStep === "template" ? -1 : visibleWizardSteps.indexOf(wizardStep);

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
    const section = visibleActiveSection;
    if (section === "skills") return;
    setEditingId(null);
    if (section === "experience") setExperienceDraft({ id: "", kind: "internship", role: "", organization: "", period: "", location: "", description: "" });
    if (section === "projects") setProjectDraft({ id: "", name: "", kind: "academic", role: "", date: "", tools: "", url: "", description: "" });
    if (section === "activities") setActivityDraft({ id: "", organization: "", role: "", period: "", description: "" });
    if (section === "courses") setCourseDraft({ id: "", name: "", provider: "", date: "", certificateUrl: "" });
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
    const section = visibleActiveSection;
    if (section === "experience") {
      const item = cv.experiences.find((entry) => entry.id === id);
      if (!item) return;
      setExperienceDraft({ ...item });
    } else if (section === "projects") {
      const item = cv.projects.find((entry) => entry.id === id);
      if (!item) return;
      setProjectDraft({ ...item });
    } else if (section === "activities") {
      const item = cv.activities.find((entry) => entry.id === id);
      if (!item) return;
      setActivityDraft({ ...item });
    } else if (section === "courses") {
      const item = cv.courses.find((entry) => entry.id === id);
      if (!item) return;
      setCourseDraft({ ...item });
    } else {
      return;
    }
    setEditingId(id);
    setFormOpen(true);
  };

  const removeItem = (id: string) => {
    const section = visibleActiveSection;
    if (section === "experience") update("experiences", cv.experiences.filter((item) => item.id !== id));
    if (section === "projects") update("projects", cv.projects.filter((item) => item.id !== id));
    if (section === "activities") update("activities", cv.activities.filter((item) => item.id !== id));
    if (section === "courses") update("courses", cv.courses.filter((item) => item.id !== id));
  };

  const toggleSection = (id: SectionId) => {
    if (isActive(id)) {
      const next = cv.selectedSections.filter((item) => item !== id);
      update("selectedSections", next);
      setFormOpen(false);
    } else {
      update("selectedSections", [...cv.selectedSections, id]);
    }
  };
  const moveSection = (id: SectionId, direction: -1 | 1) => {
    const selectedOrder = cv.sectionOrder.filter((sectionId) => cv.selectedSections.includes(sectionId));
    const index = selectedOrder.indexOf(id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= selectedOrder.length) return;
    [selectedOrder[index], selectedOrder[next]] = [selectedOrder[next], selectedOrder[index]];
    const hiddenOrder = cv.sectionOrder.filter((sectionId) => !cv.selectedSections.includes(sectionId));
    update("sectionOrder", [...selectedOrder, ...hiddenOrder]);
  };

  const reset = () => {
    if (!window.confirm(t.resetConfirm)) return;
    setCv({ ...EMPTY_CV, cvLanguage: locale });
    setWizardStep("template");
    setFormOpen(false);
    setShowPreview(false);
    setNotice("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const downloadCV = async () => {
    if (!cv.fullName.trim() || (!cv.email.trim() && !cv.phone.trim())) {
      setNotice(t.profileRequired);
      setShowPreview(false);
      setWizardStep("profile");
      return;
    }
    if (!(cv.university.trim() || cv.college.trim()) || !cv.major.trim()) {
      setNotice(t.educationRequired);
      setShowPreview(false);
      setWizardStep("education");
      return;
    }
    setNotice("");
    setDownloading(true);
    try {
      await downloadCvPdf(cv);
    } catch (error) {
      console.error("SkillUp PDF export failed", error);
      setNotice(t.pdfError);
    } finally {
      setDownloading(false);
    }
  };

  const goNextStep = () => {
    if (formOpen) {
      setNotice(isAr ? "احفظ العنصر الحالي أو ألغِ تعديله قبل الانتقال للخطوة التالية." : "Save or cancel the current item before moving to the next step.");
      return;
    }
    if (wizardStep === "profile" && (!cv.fullName.trim() || (!cv.email.trim() && !cv.phone.trim()))) {
      setNotice(t.profileRequired);
      return;
    }
    if (wizardStep === "education" && (!(cv.university.trim() || cv.college.trim()) || !cv.major.trim())) {
      setNotice(t.educationRequired);
      return;
    }
    const nextStep = wizardSteps[Math.min(currentWizardIndex + 1, wizardSteps.length - 1)];
    if (!nextStep) return;
    setNotice("");
    setFormOpen(false);
    setWizardStep(nextStep);
  };

  const goPreviousStep = () => {
    if (formOpen) {
      setNotice(isAr ? "احفظ العنصر الحالي أو ألغِ تعديله قبل الرجوع." : "Save or cancel the current item before going back.");
      return;
    }
    const previousStep = wizardSteps[Math.max(currentWizardIndex - 1, 0)];
    if (previousStep) {
      setNotice("");
      setShowPreview(false);
      setWizardStep(previousStep);
    }
  };


  const renderSectionForm = () => {
    if (visibleActiveSection === "experience") {
      return (
        <form onSubmit={saveExperience} className="grid gap-4">
          <Field label={t.kind}><select aria-label={t.kind} value={experienceDraft.kind} onChange={(event) => setExperienceDraft((draft) => ({ ...draft, kind: event.target.value }))} className="cv-select"><option value="internship">{t.internship}</option><option value="summer">{t.summer}</option><option value="part-time">{t.partTime}</option><option value="freelance">{t.freelance}</option><option value="work">{t.work}</option></select></Field>
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
    if (visibleActiveSection === "projects") {
      return (
        <form onSubmit={saveProject} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.projectName}><TextInput value={projectDraft.name} onChange={(value) => setProjectDraft((draft) => ({ ...draft, name: value }))} /></Field>
            <Field label={t.projectKind}><select aria-label={t.projectKind} value={projectDraft.kind} onChange={(event) => setProjectDraft((draft) => ({ ...draft, kind: event.target.value }))} className="cv-select"><option value="academic">{t.academic}</option><option value="personal">{t.personal}</option><option value="graduation">{t.graduation}</option></select></Field>
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
    if (visibleActiveSection === "activities") {
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
    if (visibleActiveSection === "courses") {
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
    if (visibleActiveSection === "skills") {
      const total = listText(cv.skills).length + listText(cv.tools).length + listText(cv.languages).length;
      return total ? <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-7 dark:border-zinc-700 dark:bg-zinc-900"><p><strong>{t.skills}: </strong>{listText(cv.skills).join("، ") || "—"}</p><p className="mt-2"><strong>{t.technical}: </strong>{listText(cv.tools).join("، ") || "—"}</p><p className="mt-2"><strong>{t.languages}: </strong>{listText(cv.languages).join("، ") || "—"}</p></div> : <EmptyState t={t} />;
    }
    const items = visibleActiveSection === "experience" ? cv.experiences : visibleActiveSection === "projects" ? cv.projects : visibleActiveSection === "activities" ? cv.activities : cv.courses;
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
                <button type="button" onClick={() => editItem(raw.id)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label={t.editItem}><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeItem(raw.id)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label={t.delete}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const sectionLabel = (id: SectionId) => isAr ? SECTION_META[id].titleAr : SECTION_META[id].titleEn;
  const templateOptions: Array<{ id: CVTemplate; name: string; description: string; badge: string }> = isAr
    ? [
        { id: "reference", name: "Blue Professional", description: "نفس أسلوب نموذج Word المرفق: عنوان مركزي وأقسام زرقاء واضحة.", badge: "القالب المرجعي" },
        { id: "signature", name: "SkillUp Signature", description: "هوية SkillUp بالكحلي والذهبي مع ترتيب مهني واضح.", badge: "هوية SkillUp" },
        { id: "executive", name: "Executive Minimal", description: "أبيض وأسود، بسيط ورسمي، مناسب للمحتوى المكثف.", badge: "رسمي وبسيط" }
      ]
    : [
        { id: "reference", name: "Blue Professional", description: "Inspired by your Word sample: centered header and clear blue section headings.", badge: "Reference style" },
        { id: "signature", name: "SkillUp Signature", description: "SkillUp navy and gold identity with a clear professional hierarchy.", badge: "SkillUp identity" },
        { id: "executive", name: "Executive Minimal", description: "Monochrome, minimal and formal, designed for content-rich CVs.", badge: "Formal minimal" }
      ];
  const currentStepLabel = wizardStep === "template" ? t.templates : wizardStep === "profile" ? t.stepProfile : wizardStep === "education" ? t.stepEducation : wizardStep === "sections" ? t.stepSections : wizardStep === "review" ? t.reviewTitle : sectionLabel(wizardStep);
  const progressPercent = currentVisibleStepIndex < 0
    ? 0
    : Math.round(((currentVisibleStepIndex + 1) / Math.max(1, visibleWizardSteps.length)) * 100);

  return (
    <div className="mx-auto max-w-5xl px-3 pb-28 sm:px-5 lg:px-6" dir={isAr ? "rtl" : "ltr"}>
      <style jsx global>{`
        .cv-select { width: 100%; border: 1px solid rgb(228 228 231); border-radius: .75rem; background: white; padding: .75rem .875rem; color: #18181b; font-size: .875rem; outline: none; }
        .dark .cv-select { background: #09090b; border-color: rgb(63 63 70); color: white; }
        .cv-select:focus { border-color: #C8A448; box-shadow: 0 0 0 2px rgb(200 164 72 / .15); }
        .cv-document { color: #20252b; background: #fff; overflow-wrap: anywhere; }
        .cv-document .cv-document-header { border-bottom: 2px solid #182B36; padding-bottom: 17px; margin-bottom: 20px; }
        .cv-document .cv-name { margin: 0; color: #182B36; font-size: 31px; line-height: 1.16; font-weight: 800; letter-spacing: -.025em; }
        .cv-document .cv-target-role { margin: 5px 0 0; color: #475569; font-size: 14px; line-height: 1.45; font-weight: 700; }
        .cv-document .cv-contact { margin: 12px 0 0; color: #475569; font-size: 10.5px; line-height: 1.7; display: flex; flex-wrap: wrap; column-gap: 3px; row-gap: 2px; }
        .cv-document .cv-section { margin-top: 17px; }
        .cv-document .cv-section h2 { margin: 0 0 8px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1; color: #182B36; font-size: 12.5px; line-height: 1.4; font-weight: 800; letter-spacing: .025em; text-transform: uppercase; }
        .cv-document .cv-section p { margin-top: 0; font-size: 11.5px; line-height: 1.55; }
        .cv-document .cv-summary-text { margin: 0; }
        .cv-document .cv-education-layout { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
        .cv-document .cv-entry-title { margin: 0; font-size: 12px; line-height: 1.45; font-weight: 800; color: #20252b; }
        .cv-document .cv-muted-line { margin: 2px 0 0; color: #4b5563; }
        .cv-document .cv-education-meta { flex: 0 0 auto; text-align: end; color: #64748b; font-size: 10.5px; line-height: 1.55; }
        .cv-document .cv-education-meta p { margin: 0; }
        .cv-document .cv-entry { margin: 0 0 10px; break-inside: avoid; }
        .cv-document .cv-entry-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
        .cv-document .cv-entry-date { margin: 0; flex: 0 0 auto; color: #64748b; font-size: 10.5px !important; white-space: nowrap; }
        .cv-document .cv-entry-subtitle { margin: 2px 0 0; color: #475569; font-size: 11px !important; font-weight: 600; }
        .cv-document .cv-entry-detail { margin: 4px 0 0; }
        .cv-document .cv-entry-link { margin: 4px 0 0; color: #475569; font-size: 10.5px !important; }
        .cv-document .cv-bullets { margin: 4px 0 0; padding-inline-start: 17px; list-style: disc; }
        .cv-document .cv-bullets li { margin: 2px 0; padding-inline-start: 2px; font-size: 11.25px; line-height: 1.5; }
        .cv-document .cv-skill-group { margin-top: 4px !important; }
        .cv-template-reference .cv-document-header { text-align: center; border-bottom: 1.25px solid #AFC3DE; padding-bottom: 18px; margin-bottom: 18px; }
        .cv-template-reference .cv-name { color: #24466F; font-size: 30px; letter-spacing: 0; }
        .cv-template-reference .cv-target-role { color: #4D83C5; font-size: 14px; font-style: italic; font-weight: 500; }
        .cv-template-reference .cv-contact { justify-content: center; color: #596574; }
        .cv-template-reference .cv-section h2 { border: 0; border-top: 1px solid #AFC3DE; padding: 7px 0 0; color: #24466F; letter-spacing: 0; margin-bottom: 8px; }
        .cv-template-signature .cv-document-header { border-bottom: 3px solid #182B36; padding-bottom: 17px; margin-bottom: 20px; }
        .cv-template-signature .cv-name { color: #182B36; font-size: 32px; }
        .cv-template-signature .cv-target-role { color: #8A6D1F; font-size: 14px; }
        .cv-template-signature .cv-section h2 { color: #182B36; border-bottom-color: #C8A448; }
        .cv-template-executive .cv-document-header { border-bottom: 1px solid #606A75; padding-bottom: 15px; margin-bottom: 17px; }
        .cv-template-executive .cv-name { color: #15191E; font-size: 29px; letter-spacing: -.01em; }
        .cv-template-executive .cv-target-role { color: #4B5563; font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
        .cv-template-executive .cv-section h2 { color: #20252B; border-bottom: 1.25px solid #717B85; letter-spacing: .08em; font-size: 11.5px; }
        .cv-template-executive .cv-section { margin-top: 15px; }
        .cv-template-executive .cv-section p { font-size: 11px; line-height: 1.48; }
        .cv-template-executive .cv-entry { margin-bottom: 8px; }
        .cv-template-executive .cv-entry-title { font-size: 11.75px; }
        .cv-template-executive .cv-bullets li { font-size: 10.75px; line-height: 1.42; }
        @media (max-width: 640px) {
          .cv-document .cv-entry-heading { gap: 8px; }
          .cv-document .cv-entry-date { white-space: normal; text-align: end; }
        }
      `}</style>

      <div className="mx-auto max-w-4xl pb-28 sm:pb-32">
        <header className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8A448]/40 bg-[#C8A448]/10 px-3 py-1.5 text-xs font-bold text-[#8A6D1F] dark:text-[#E2C46F]">
              <Sparkles className="h-3.5 w-3.5" /> {t.eyebrow}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t.saved}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-black tracking-tight text-[#182B36] dark:text-white md:text-3xl">{wizardStep === "template" ? t.chooseTemplateTitle : t.title}</h1>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{wizardStep === "template" ? t.chooseTemplateHint : t.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-950">
                <button type="button" onClick={() => update("cvLanguage", "ar")} className={cx("rounded-lg px-3 py-2 text-xs font-bold", cv.cvLanguage === "ar" ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "text-zinc-600 dark:text-zinc-300")}>{t.arabic}</button>
                <button type="button" onClick={() => update("cvLanguage", "en")} className={cx("rounded-lg px-3 py-2 text-xs font-bold", cv.cvLanguage === "en" ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "text-zinc-600 dark:text-zinc-300")}>{t.english}</button>
              </div>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"><RotateCcw className="h-3.5 w-3.5" />{t.reset}</button>
            </div>
          </div>
          {wizardStep !== "template" ? (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-zinc-700 dark:text-zinc-200">{currentStepLabel}</span>
                <span className="tabular-nums text-zinc-500">{currentVisibleStepIndex + 1} {t.stepOf} {visibleWizardSteps.length}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-[#C8A448] transition-all duration-300" style={{ width: `${progressPercent}%` }} /></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {visibleWizardSteps.map((step, index) => (
                  <span key={step} className={cx("rounded-full px-2.5 py-1 text-[10px] font-semibold", step === wizardStep ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : index < currentVisibleStepIndex ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400")}>{step === "profile" ? t.stepProfile : step === "education" ? t.stepEducation : step === "sections" ? t.sectionsTitle : step === "review" ? t.reviewTitle : sectionLabel(step as SectionId)}</span>
                ))}
              </div>
            </div>
          ) : null}
          {notice ? <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Close"><X className="h-4 w-4" /></button></div> : null}
        </header>

        {wizardStep === "template" ? (
          <section className="space-y-5">
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{isAr ? "اختار الشكل اللي يناسب تقديمك" : "Choose the style that fits your application"}</p>
              <p className="mt-1 text-xs text-zinc-500">{isAr ? "كل التصميمات رسمية وبعمود واحد ومهيأة لتكون سهلة القراءة بواسطة ATS." : "All three designs are formal, single-column and designed for ATS readability."}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {templateOptions.map((option) => {
                const active = cv.template === option.id;
                return (
                  <button key={option.id} type="button" onClick={() => update("template", option.id)} aria-pressed={active} className={cx("group rounded-2xl border bg-white p-3 text-start shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900", active ? "border-[#C8A448] ring-2 ring-[#C8A448]/25" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700")}>
                    <TemplateThumbnail template={option.id} isAr={isAr} />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div><span className="block text-sm font-extrabold text-zinc-900 dark:text-white">{option.name}</span><span className="mt-0.5 block text-[10px] font-semibold text-[#8A6D1F] dark:text-[#E2C46F]">{option.badge}</span></div>
                      {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <span className="h-5 w-5 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600" />}
                    </div>
                    <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {wizardStep === "profile" ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
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
        ) : null}

        {wizardStep === "education" ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#182B36]/[0.07] text-[#182B36] dark:bg-[#C8A448]/15 dark:text-[#E2C46F]"><GraduationCap className="h-5 w-5" /></div>
              <div><h2 className="font-extrabold text-zinc-900 dark:text-white">{t.stepEducation}</h2><p className="text-xs text-zinc-500">{t.educationNote}</p></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.university}><TextInput value={cv.university} onChange={(value) => update("university", value)} /></Field>
              <Field label={t.college}><TextInput value={cv.college} onChange={(value) => update("college", value)} /></Field>
              <Field label={t.qualification}><TextInput value={cv.qualification} onChange={(value) => update("qualification", value)} placeholder={isAr ? "مثال: بكالوريوس تجارة" : "e.g. Bachelor of Commerce"} /></Field>
              <Field label={t.major} required><TextInput value={cv.major} onChange={(value) => update("major", value)} /></Field>
              <Field label={t.educationStatus}><select aria-label={t.educationStatus} value={cv.educationStatus} onChange={(event) => update("educationStatus", event.target.value as EducationStatus)} className="cv-select"><option value="studying">{t.studying}</option><option value="graduated">{t.graduated}</option></select></Field>
              {cv.educationStatus === "studying" ? <Field label={t.yearLevel}><select aria-label={t.yearLevel} value={cv.yearLevel} onChange={(event) => update("yearLevel", event.target.value)} className="cv-select"><option value="">—</option>{(isAr ? ["الفرقة الأولى", "الفرقة الثانية", "الفرقة الثالثة", "الفرقة الرابعة", "دراسات عليا", "أخرى"] : ["First year", "Second year", "Third year", "Fourth year", "Postgraduate", "Other"]).map((value) => <option key={value}>{value}</option>)}</select></Field> : null}
              <Field label={t.startYear}><TextInput value={cv.startYear} onChange={(value) => update("startYear", value)} placeholder="2023" /></Field>
              <Field label={t.graduationYear}><TextInput value={cv.graduationYear} onChange={(value) => update("graduationYear", value)} placeholder={cv.educationStatus === "studying" ? "2027" : "2025"} /></Field>
              <Field label={t.gpa}><TextInput value={cv.gpa} onChange={(value) => update("gpa", value)} placeholder={isAr ? "مثال: جيد جدًا أو 3.4/4" : "e.g. Very Good or 3.4/4"} /></Field>
            </div>
          </section>
        ) : null}

        {wizardStep === "sections" ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
            <div className="mb-5"><h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{isAr ? "إيه الأقسام اللي عندك؟" : "Which sections can you add?"}</h2><p className="mt-1 text-sm leading-6 text-zinc-500">{isAr ? "اختار الأقسام اللي عندك بيانات فعلية ليها. تقدر تتخطى أي قسم وتضيفه لاحقًا." : "Select the sections you have real information for. You can skip any section and add it later."}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(SECTION_META) as SectionId[]).map((id) => {
                const Icon = SECTION_META[id].icon;
                const selected = isActive(id);
                const count = countFor(id);
                return (
                  <button key={id} type="button" aria-pressed={selected} onClick={() => toggleSection(id)} className={cx("flex min-h-28 items-start gap-3 rounded-2xl border p-4 text-start transition", selected ? "border-[#C8A448] bg-[#C8A448]/[0.07] ring-1 ring-[#C8A448]/20" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700")}>
                    <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300")}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-zinc-900 dark:text-white">{sectionLabel(id)}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{isAr ? SECTION_META[id].subAr : SECTION_META[id].subEn}</span><span className="mt-2 block text-[10px] font-semibold text-zinc-500">{count ? `${count} ${isAr ? "عناصر محفوظة" : "saved items"}` : isAr ? "لم تضف بيانات بعد" : "No data added yet"}</span></span>
                    <span className={cx("mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", selected ? "border-[#182B36] bg-[#182B36] text-white dark:border-[#C8A448] dark:bg-[#C8A448] dark:text-[#182B36]" : "border-zinc-300 text-transparent dark:border-zinc-600")}>{selected ? <Check className="h-4 w-4" /> : null}</span>
                  </button>
                );
              })}
            </div>
            {orderedSections.length ? <div className="mt-5 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950"><p className="mb-2 text-xs font-bold text-zinc-700 dark:text-zinc-200">{t.sectionOrder}</p><div className="flex flex-wrap gap-2">{orderedSections.map((id, index) => <span key={id} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{sectionLabel(id)}<button type="button" onClick={() => moveSection(id,-1)} disabled={index===0} aria-label={t.up} className="rounded p-0.5 hover:bg-zinc-100 disabled:opacity-30"><ChevronLeft className="h-3 w-3"/></button><button type="button" onClick={() => moveSection(id,1)} disabled={index===orderedSections.length-1} aria-label={t.down} className="rounded p-0.5 hover:bg-zinc-100 disabled:opacity-30"><ChevronRight className="h-3 w-3"/></button></span>)}</div></div> : <p className="mt-5 rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">{isAr ? "مش لازم تضيف أي أقسام دلوقتي؛ تقدر تكمل وتضيفها لاحقًا." : "You can continue without extra sections and add them later."}</p>}
          </section>
        ) : null}

        {isSectionStep(wizardStep) ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{sectionLabel(visibleActiveSection)}</h2><p className="mt-1 text-sm text-zinc-500">{isAr ? "كل الحقول اختيارية. أضف ما ينطبق عليك فقط، ويمكنك تخطي الخطوة." : "All fields are optional. Add only what applies to you, or skip this step."}</p></div>
              {visibleActiveSection !== "skills" && !formOpen ? <button type="button" onClick={beginAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-[#182B36] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36]"><Plus className="h-4 w-4" />{t.addNew}</button> : null}
            </div>
            {visibleActiveSection === "skills" ? renderSectionForm() : formOpen ? <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950"><div className="mb-4 flex items-center justify-between gap-3"><h4 className="text-sm font-bold">{editingId ? t.edit : t.addNew}</h4><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label={t.cancel}><X className="h-4 w-4" /></button></div>{renderSectionForm()}</div> : renderSectionItems()}
            {visibleActiveSection === "skills" ? <div className="mt-4 flex justify-end"><button type="button" onClick={() => setNotice(isAr ? "تم حفظ المهارات تلقائيًا." : "Skills are saved automatically.")} className="rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white dark:bg-[#C8A448] dark:text-[#182B36]">{t.save}</button></div> : null}
          </section>
        ) : null}

        {wizardStep === "review" ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{t.checklist}</h2><p className="mt-1 text-xs text-zinc-500">{isAr ? "راجع النقاط دي قبل ما تحمل ملفك." : "Review these points before downloading."}</p></div><span className="text-xl font-black text-[#8A6D1F] dark:text-[#E2C46F]">{readinessScore}%</span></div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-[#C8A448] transition-all" style={{ width: `${readinessScore}%` }} /></div>
            <div className="grid gap-2">{readiness.map((item) => <div key={item.text} className="flex items-start gap-2 text-xs leading-5"><CheckCircle2 className={cx("mt-0.5 h-4 w-4 shrink-0", item.done ? "text-emerald-600" : "text-zinc-300 dark:text-zinc-600")} /><span className={item.done ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-500"}>{item.text}</span></div>)}</div>
            <div className="mt-5 rounded-xl border border-[#C8A448]/30 bg-[#C8A448]/[0.07] p-3 text-xs leading-6 text-zinc-600 dark:text-zinc-300"><div className="mb-1 flex items-center gap-1.5 font-bold text-[#80621c] dark:text-[#E2C46F]"><Lightbulb className="h-3.5 w-3.5" /> ATS</div>{t.atsNote}</div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => setShowPreview(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#182B36] px-4 py-3 text-sm font-bold text-[#182B36] hover:bg-[#182B36]/5 dark:border-[#C8A448] dark:text-[#E2C46F]"><Eye className="h-4 w-4" />{t.openPreview}</button><button type="button" onClick={downloadCV} disabled={downloading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#182B36] px-4 py-3 text-sm font-bold text-white disabled:opacity-60 dark:bg-[#C8A448] dark:text-[#182B36]"><Download className="h-4 w-4" />{downloading ? t.loadingPdf : t.downloadNow}</button></div>
            <p className="mt-3 text-[11px] leading-5 text-zinc-500">{t.savedInfo}</p>
          </section>
        ) : null}
      </div>

      {wizardStep !== "template" ? (
        <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-4xl items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95 sm:inset-x-6 sm:p-3">
          <button type="button" onClick={goPreviousStep} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">{isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}{t.previousStep}</button>
          <div className="flex items-center gap-2">
            {isSectionStep(wizardStep) ? <button type="button" onClick={goNextStep} className="rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{t.skipStep}</button> : null}
            {wizardStep === "review" ? <button type="button" onClick={() => setShowPreview(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white dark:bg-[#C8A448] dark:text-[#182B36]"><Eye className="h-4 w-4" />{t.openPreview}</button> : <button type="button" onClick={goNextStep} className="inline-flex items-center gap-1.5 rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36]"><span>{t.nextStep}</span>{isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> }</button>}
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-4xl justify-end sm:inset-x-6"><button type="button" onClick={() => { setNotice(""); setWizardStep("profile"); }} className="inline-flex items-center gap-2 rounded-2xl bg-[#182B36] px-6 py-3.5 text-sm font-extrabold text-white shadow-xl hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36]">{t.startBuilding}{isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> }</button></div>
      )}

      {showPreview ? <CVPreviewModal cv={cv} isAr={isAr} onClose={() => setShowPreview(false)} onDownload={downloadCV} downloading={downloading} onTemplateChange={(template) => update("template", template)} /> : null}
    </div>
  );
}

function FormActions({ cancel, saveLabel, cancelLabel }: { cancel: () => void; saveLabel: string; cancelLabel: string }) {
  return <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"><button type="button" onClick={cancel} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{cancelLabel}</button><button type="submit" className="rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36]">{saveLabel}</button></div>;
}

function EmptyState({ t }: { t: LocaleCopy }) {
  return <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"><Plus className="h-5 w-5" /></div><p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t.noItems}</p><p className="mt-1 text-xs text-zinc-500">{t.noItemsHint}</p></div>;
}
