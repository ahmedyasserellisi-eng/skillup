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
  GripVertical,
  ArrowUp,
  ArrowDown
} from "lucide-react";

import type { Locale } from "@/i18n";
import { createCvPdfBlob, downloadCvPdf } from "./pdf-export";
import { AnimatePresence, motion } from "framer-motion";
import {
  YEAR_LEVELS,
  normalizeYearLevel,
  sortExperiencesByDate,
  type Activity,
  type CVData,
  type CVTemplate,
  type EducationStatus,
  type Course,
  type Experience,
  type Project,
  type SectionId,
  type WizardStep
} from "./cv-types";
import { TemplateThumbnail, CV_TEMPLATE_OPTIONS } from "./cv-templates";

type LocaleCopy = {
  [key: string]: string;
};

const STORAGE_KEY = "skillup_cv_student_v1";
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
  sectionOrder: ["experience", "courses", "skills", "projects", "activities"],
  selectedSections: [],
  cvLanguage: "ar",
  template: "reference",
  experienceSortMode: "newest"
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const cx = (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(" ");

function normalizeTemplate(value: unknown): CVTemplate {
  if (value === "reference" || value === "classic" || value === "contemporary" || value === "chronological") return value;
  // Legacy layouts that were visually near-identical now use the retained Classic Academic design.
  if (value === "executive" || value === "signature" || value === "compact" || value === "yale" || value === "modern") return "classic";
  return "reference";
}

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

type CvLanguageField = { labelAr: string; labelEn: string; value: string; detectedLetters?: string };

type LetterScript = "Arabic" | "Latin";

/**
 * Detect actual alphabetic letters only.
 * Arabic Unicode blocks also contain punctuation, numeric symbols and direction marks;
 * those must never block a CV export on their own.
 */

function collectCvLanguageFields(cv: CVData): CvLanguageField[] {
  const fields: CvLanguageField[] = [
    { labelAr: "الاسم", labelEn: "Full name", value: cv.fullName },
    { labelAr: "المسمى الوظيفي المستهدف", labelEn: "Target role", value: cv.targetRole },
    { labelAr: "المدينة والدولة", labelEn: "City and country", value: cv.city },
    { labelAr: "الملخص المهني", labelEn: "Professional summary", value: cv.summary },
    { labelAr: "الجامعة", labelEn: "University", value: cv.university },
    { labelAr: "المؤهل العلمي", labelEn: "Qualification", value: cv.qualification },
    { labelAr: "الكلية", labelEn: "Faculty / school", value: cv.college },
    { labelAr: "التخصص", labelEn: "Major", value: cv.major },
    { labelAr: "التقدير", labelEn: "Grade / GPA", value: cv.gpa },
    { labelAr: "المهارات", labelEn: "Skills", value: cv.skills },
    { labelAr: "الأدوات والتقنيات", labelEn: "Tools and technologies", value: cv.tools },
    { labelAr: "اللغات", labelEn: "Languages", value: cv.languages }
  ];

  cv.experiences.forEach((item, index) => {
    const n = index + 1;
    fields.push(
      { labelAr: `الخبرة ${n}: المسمى`, labelEn: `Experience ${n}: role`, value: item.role },
      { labelAr: `الخبرة ${n}: جهة العمل`, labelEn: `Experience ${n}: organization`, value: item.organization },
      { labelAr: `الخبرة ${n}: المكان`, labelEn: `Experience ${n}: location`, value: item.location },
      { labelAr: `الخبرة ${n}: الوصف`, labelEn: `Experience ${n}: description`, value: item.description }
    );
    // Start/end dates and legacy period values are metadata, not language-bearing CV prose.
  });

  cv.projects.forEach((item, index) => {
    const n = index + 1;
    fields.push(
      { labelAr: `المشروع ${n}: الاسم`, labelEn: `Project ${n}: name`, value: item.name },
      { labelAr: `المشروع ${n}: الدور`, labelEn: `Project ${n}: role`, value: item.role },
      { labelAr: `المشروع ${n}: الأدوات`, labelEn: `Project ${n}: tools`, value: item.tools },
      { labelAr: `المشروع ${n}: الوصف`, labelEn: `Project ${n}: description`, value: item.description }
    );
  });

  cv.activities.forEach((item, index) => {
    const n = index + 1;
    fields.push(
      { labelAr: `النشاط ${n}: الجهة`, labelEn: `Activity ${n}: organization`, value: item.organization },
      { labelAr: `النشاط ${n}: الدور`, labelEn: `Activity ${n}: role`, value: item.role },
      { labelAr: `النشاط ${n}: الوصف`, labelEn: `Activity ${n}: description`, value: item.description }
    );
  });

  cv.courses.forEach((item, index) => {
    const n = index + 1;
    fields.push(
      { labelAr: `الكورس ${n}: الاسم`, labelEn: `Course ${n}: name`, value: item.name },
      { labelAr: `الكورس ${n}: الجهة المقدمة`, labelEn: `Course ${n}: provider`, value: item.provider },
      { labelAr: `الكورس ${n}: الوصف`, labelEn: `Course ${n}: description`, value: item.description }
    );
  });

  // yearLevel is a system-controlled option. Exclude it entirely, including unknown
  // legacy values, because it is translated by yearLevelLabel before display/export.
  return fields.filter((field) => typeof field.value === "string" && field.value.trim().length > 0);
}

function findLanguageMismatches(cv: CVData): CvLanguageField[] {
  const wrongScript: LetterScript = cv.cvLanguage === "en" ? "Arabic" : "Latin";
  return collectCvLanguageFields(cv).flatMap((field) => {
    const detectedLetters = [...new Set(
      Array.from(field.value).filter((character) =>
        /\p{L}/u.test(character) && (wrongScript === "Arabic"
          ? /\p{Script=Arabic}/u.test(character)
          : /\p{Script=Latin}/u.test(character))
      )
    )].slice(0, 8).join(" ");
    return detectedLetters ? [{ ...field, detectedLetters }] : [];
  });
}

function normalizedWords(value: string): string[] {
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "your", "you", "role", "job",
    "intern", "internship", "junior", "senior", "entry", "level", "professional", "assistant",
    "specialist", "officer", "coordinator", "manager", "executive", "trainee"
  ]);
  return (value.toLocaleLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((word) => !stopWords.has(word));
}

function getCvQualityWarnings(cv: CVData, isAr: boolean): string[] {
  const warnings: string[] = [];
  const targetWords = normalizedWords(cv.targetRole);
  const supportingText = [
    cv.summary,
    ...cv.experiences.map((item) => item.role),
    ...cv.projects.map((item) => item.role || item.name)
  ].join(" ");
  const supportingWords = new Set(normalizedWords(supportingText));

  if (targetWords.length && supportingWords.size && !targetWords.some((word) => supportingWords.has(word))) {
    warnings.push(isAr
      ? "راجع توافق المسمى المستهدف مع الملخص والمسميات الوظيفية؛ قد يكون هناك اختلاف في المجال أو الصياغة."
      : "Check that the target role matches the summary and experience/project titles. They may describe different fields.");
  }

  const incompleteExperience = cv.experiences.some((item) => {
    const hasAnyData = [item.role, item.organization, item.period, item.startDate ?? "", item.endDate ?? "", item.location, item.description].some((value) => value.trim());
    if (!hasAnyData) return false;
    return !item.role.trim() || !item.description.trim() || (!item.organization.trim() && item.kind !== "freelance");
  });
  if (incompleteExperience) {
    warnings.push(isAr
      ? "يوجد تدريب أو خبرة ينقصها المسمى أو الجهة أو وصف المسؤوليات. راجع العنصر قبل التقديم."
      : "At least one experience item is missing a role, organization, or responsibility description. Review it before applying.");
  }

  const incompleteProjects = cv.projects.some((item) => {
    const hasAnyData = [item.name, item.kind, item.role, item.date, item.description, item.tools, item.url].some((value) => value.trim());
    return hasAnyData && (!item.name.trim() || !item.description.trim());
  });
  if (incompleteProjects) {
    warnings.push(isAr
      ? "يوجد مشروع ينقصه الاسم أو وصف مختصر لما قمت بتنفيذه."
      : "At least one project is missing its name or a short description of what you built or contributed.");
  }

  const incompleteActivities = cv.activities.some((item) => {
    const hasAnyData = [item.organization, item.role, item.period, item.description].some((value) => value.trim());
    return hasAnyData && (!item.organization.trim() || !item.role.trim() || !item.description.trim());
  });
  if (incompleteActivities) {
    warnings.push(isAr
      ? "يوجد نشاط أو تطوع ينقصه اسم الجهة أو الدور أو وصف المشاركة."
      : "At least one activity is missing its organization, role, or description of your contribution.");
  }

  const incompleteCourses = cv.courses.some((item) => (item.provider.trim() || item.date.trim() || item.description.trim() || item.certificateUrl.trim()) && !item.name.trim());
  if (incompleteCourses) {
    warnings.push(isAr
      ? "يوجد كورس أو شهادة بدون اسم واضح."
      : "At least one course or certificate is missing its name.");
  }

  const placeholders = new Set(["gg", "test", "xxx", "xxxx", "n/a", "na", "none", "tbd", "example", "lorem ipsum"]);
  const validShortTerms = new Set(["hr", "it", "qa", "ai", "ux", "ui", "bi", "sql", "3d", "c", "r", "go", "c#", "c++"]);
  const unclearSkills = [...listText(cv.skills), ...listText(cv.tools), ...listText(cv.languages)]
    .some((item) => {
      const normalized = item.trim().toLocaleLowerCase();
      return placeholders.has(normalized) || (normalized.length <= 2 && !validShortTerms.has(normalized));
    });
  if (unclearSkills) {
    warnings.push(isAr
      ? "توجد قيمة في المهارات أو الأدوات أو اللغات تبدو كقيمة تجريبية أو غير مكتملة. راجعها."
      : "A skill, tool, or language entry looks like a placeholder or test value. Review it.");
  }

  return warnings;
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const templateOptions = CV_TEMPLATE_OPTIONS.map((option) => ({
    id: option.id,
    title: option.title,
    description: isAr ? option.descriptionAr : option.descriptionEn
  }));

  // Preview the exact PDF generated by the export pipeline. This removes the
  // separate HTML pagination/layout path and keeps every page, font and margin
  // identical to the downloaded file.
  useEffect(() => {
    let cancelled = false;
    let generatedUrl: string | null = null;

    setPreviewUrl(null);
    setPreviewError("");
    setPreviewLoading(true);

    createCvPdfBlob(cv)
      .then((blob) => {
        if (cancelled) return;
        generatedUrl = URL.createObjectURL(blob);
        setPreviewUrl(generatedUrl);
        setPreviewLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("SkillUp PDF preview failed", error);
        setPreviewError(isAr
          ? "تعذر تجهيز معاينة PDF. تحقق من اتصال الإنترنت وحاول إعادة المحاولة أو حمّل الملف مباشرة."
          : "Could not prepare the PDF preview. Check your internet connection, retry, or download the file directly.");
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [cv, isAr, previewAttempt]);

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
  const pdfViewerUrl = previewUrl ? `${previewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH` : "";

  return createPortal(
    <motion.div ref={dialogRef} tabIndex={-1} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: "easeOut" }} className="fixed inset-0 z-[100] flex flex-col bg-[#e9edf2] text-zinc-900 outline-none" dir={isAr ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={isAr ? "معاينة السيرة الذاتية" : "CV preview"}>
      <header className="z-10 shrink-0 border-b border-zinc-200 bg-white shadow-sm">
        <div className="flex min-h-16 items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#182B36] text-white"><FileText className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-extrabold sm:text-base">{isAr ? "معاينة السيرة الذاتية" : "CV Preview"}</h2>
              <p className="text-[11px] text-zinc-500">{isAr ? "دي معاينة ملف PDF الفعلي بنفس تقسيم الصفحات والتنسيق." : "This is the actual PDF preview, with the same pagination and formatting as the download."}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {previewUrl ? <a href={pdfViewerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-2.5 text-[10px] font-bold text-zinc-700 transition hover:bg-zinc-50 sm:gap-2 sm:px-3 sm:text-xs"><span className="sm:hidden">{isAr ? "فتح" : "Open"}</span><span className="hidden sm:inline">{isAr ? "فتح في تبويب جديد" : "Open in new tab"}</span></a> : null}
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
          <div className="text-[10px] text-zinc-500 sm:text-xs">
            {previewLoading
              ? (isAr ? "جاري إنشاء المعاينة..." : "Generating preview...")
              : previewUrl
                ? (isAr ? "استخدم أدوات عارض PDF للتنقل بين الصفحات والتكبير." : "Use the PDF viewer controls to navigate pages and zoom.")
                : (isAr ? "المعاينة غير متاحة حاليًا." : "Preview is currently unavailable.")}
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden bg-[#dfe4ea]">
        {previewLoading ? (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-zinc-600">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-zinc-300 border-t-[#182B36]" />
            <span>{isAr ? "بنجهز صفحات السيرة الذاتية..." : "Preparing your CV pages..."}</span>
          </div>
        ) : null}
        {previewError ? (
          <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">{previewError}</p>
              <button type="button" onClick={() => setPreviewAttempt((value) => value + 1)} className="mt-4 rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#294653]">{isAr ? "إعادة المحاولة" : "Try again"}</button>
            </div>
          </div>
        ) : null}
        {previewUrl && !previewLoading ? (
          <iframe
            key={previewUrl}
            src={pdfViewerUrl}
            title={isAr ? "معاينة ملف السيرة الذاتية PDF" : "CV PDF preview"}
            className="h-full min-h-0 w-full border-0 bg-[#e9edf2]"
          />
        ) : null}
      </main>
      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-2 text-center text-[10px] text-zinc-500 sm:text-xs">
        {isAr ? "المعروض هنا هو ملف PDF نفسه؛ لذلك عدد الصفحات والخطوط والهوامش يطابق الملف الذي سيتم تحميله." : "This viewer displays the PDF itself, so page count, fonts and margins match the downloaded file."}
      </footer>
    </motion.div>,
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
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    currentlyWorking: "ما زلت أعمل أو أتدرب هنا حاليًا",
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
    templateBlue: "Blue Professional — قالب احترافي أزرق بعناوين واضحة ومساحات منظمة",
    templateClassic: "Classic Academic — تصميم أكاديمي رسمي أبيض وأسود",
    templateContemporary: "Contemporary Professional — تصميم حديث بلمسة لونية هادئة",
    templateChronological: "Traditional Chronological — تنسيق تقليدي واضح",
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
    startDate: "Start date",
    endDate: "End date",
    currentlyWorking: "I currently work or train here",
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
    templateBlue: "Blue Professional — structured blue-accented resume with clear section hierarchy",
    templateClassic: "Classic Academic — formal black-and-white layout",
    templateContemporary: "Contemporary Professional — subtle teal accent",
    templateChronological: "Traditional Chronological — clean reverse-chronological layout",
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
  const [experienceDraft, setExperienceDraft] = useState<Experience>({ id: "", kind: "internship", role: "", organization: "", period: "", startDate: "", endDate: "", isCurrent: false, location: "", description: "" });
  const [projectDraft, setProjectDraft] = useState<Project>({ id: "", name: "", kind: "academic", role: "", date: "", tools: "", url: "", description: "" });
  const [activityDraft, setActivityDraft] = useState<Activity>({ id: "", organization: "", role: "", period: "", description: "" });
  const [courseDraft, setCourseDraft] = useState<Course>({ id: "", name: "", provider: "", date: "", description: "", certificateUrl: "" });
  const [draggingExperienceId, setDraggingExperienceId] = useState<string | null>(null);
  const [dragOverExperienceId, setDragOverExperienceId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CVData>;
        const validSectionIds = Object.keys(SECTION_META) as SectionId[];
        const savedOrder = Array.isArray(parsed.sectionOrder)
          ? parsed.sectionOrder.filter((id): id is SectionId => validSectionIds.includes(id as SectionId))
          : [];
        const previousDefaultOrder: SectionId[] = ["experience", "projects", "activities", "courses", "skills"];
        const isPreviousDefaultOrder = savedOrder.length === previousDefaultOrder.length
          && previousDefaultOrder.every((id, index) => savedOrder[index] === id);
        // Update only the old untouched default order; preserve any order the user customized.
        const normalizedOrder = isPreviousDefaultOrder ? [...EMPTY_CV.sectionOrder] : [...new Set(savedOrder)];
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
          yearLevel: normalizeYearLevel(parsed.yearLevel),
          template: normalizeTemplate(parsed.template),
          experienceSortMode: parsed.experienceSortMode === "newest" ? "newest" : "manual",
          sectionOrder: mergedOrder,
          // selectedSections represents the user's intentional visibility choices.
          // Keep hidden sections hidden; every section remains available in the section manager.
          selectedSections: Array.isArray(parsed.selectedSections) ? normalizedSelected : inferredSelected,
          experiences: parsed.experienceSortMode === "newest"
            ? sortExperiencesByDate(Array.isArray(parsed.experiences) ? parsed.experiences.map((item) => ({
                ...item,
                startDate: typeof item.startDate === "string" ? item.startDate : "",
                endDate: typeof item.endDate === "string" ? item.endDate : "",
                isCurrent: Boolean(item.isCurrent)
              })) : [])
            : (Array.isArray(parsed.experiences) ? parsed.experiences.map((item) => ({
                ...item,
                startDate: typeof item.startDate === "string" ? item.startDate : "",
                endDate: typeof item.endDate === "string" ? item.endDate : "",
                isCurrent: Boolean(item.isCurrent)
              })) : []),
          courses: Array.isArray(parsed.courses) ? parsed.courses.map((item) => ({ ...item, description: typeof item.description === "string" ? item.description : "" })) : [],
          cvLanguage: parsed.cvLanguage ?? locale
        });
        // Remove the one-time migration backup only after the current CV JSON was parsed successfully.
        try { localStorage.removeItem(`${STORAGE_KEY}_backup_before_redesign`); } catch { /* storage may be read-only */ }
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
  const languageMismatchFields = findLanguageMismatches(cv);
  const languageMismatch = languageMismatchFields.length > 0;
  const qualityWarnings = getCvQualityWarnings(cv, isAr);

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
    if (section === "experience") setExperienceDraft({ id: "", kind: "internship", role: "", organization: "", period: "", startDate: "", endDate: "", isCurrent: false, location: "", description: "" });
    if (section === "projects") setProjectDraft({ id: "", name: "", kind: "academic", role: "", date: "", tools: "", url: "", description: "" });
    if (section === "activities") setActivityDraft({ id: "", organization: "", role: "", period: "", description: "" });
    if (section === "courses") setCourseDraft({ id: "", name: "", provider: "", date: "", description: "", certificateUrl: "" });
    setFormOpen(true);
  };

  const saveExperience = (event: FormEvent) => {
    event.preventDefault();

    const startDate = experienceDraft.startDate ?? "";
    const endDate = experienceDraft.isCurrent ? "" : (experienceDraft.endDate ?? "");
    const hasStructuredDates = Boolean(startDate || endDate || experienceDraft.isCurrent);

    // Keep legacy entries editable without forcing their old free-text period to be re-entered.
    if (hasStructuredDates && !startDate) {
      setNotice(isAr ? "أدخل تاريخ البداية أولًا." : "Please enter a start date.");
      return;
    }
    if (startDate && !experienceDraft.isCurrent && !endDate) {
      setNotice(isAr ? "أدخل تاريخ النهاية أو فعّل اختيار (ما زلت أعمل هنا)." : "Enter an end date or mark this as a current role.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setNotice(isAr ? "تاريخ النهاية لا يمكن أن يسبق تاريخ البداية." : "The end date cannot be earlier than the start date.");
      return;
    }

    const item = {
      ...experienceDraft,
      id: experienceDraft.id || uid(),
      startDate,
      endDate
    };
    const nextExperiences = editingId
      ? cv.experiences.map((entry) => entry.id === editingId ? item : entry)
      : [...cv.experiences, item];
    update("experiences", cv.experienceSortMode === "newest" ? sortExperiencesByDate(nextExperiences) : nextExperiences);
    setNotice("");
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

  const reorderExperiences = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const reordered = [...cv.experiences];
    const from = reordered.findIndex((item) => item.id === sourceId);
    const to = reordered.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    update("experiences", reordered);
    update("experienceSortMode", "manual");
    setDraggingExperienceId(null);
    setDragOverExperienceId(null);
  };

  const moveExperience = (id: string, direction: -1 | 1) => {
    const ordered = [...cv.experiences];
    const index = ordered.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    update("experiences", ordered);
    update("experienceSortMode", "manual");
  };

  const setExperienceSortMode = (mode: "manual" | "newest") => {
    update("experienceSortMode", mode);
    if (mode === "newest") update("experiences", sortExperiencesByDate(cv.experiences));
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
            <Field label={t.startDate}><TextInput type="date" value={experienceDraft.startDate ?? ""} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, startDate: value }))} dir="ltr" /></Field>
            {!experienceDraft.isCurrent ? <Field label={t.endDate}><TextInput type="date" value={experienceDraft.endDate ?? ""} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, endDate: value }))} dir="ltr" /></Field> : null}
            <Field label={t.location}><TextInput value={experienceDraft.location} onChange={(value) => setExperienceDraft((draft) => ({ ...draft, location: value }))} /></Field>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <input type="checkbox" checked={Boolean(experienceDraft.isCurrent)} onChange={(event) => setExperienceDraft((draft) => ({ ...draft, isCurrent: event.target.checked, endDate: event.target.checked ? "" : draft.endDate }))} className="h-4 w-4 accent-[#182B36]" />
            <span>{t.currentlyWorking}</span>
          </label>
          {experienceDraft.period && !experienceDraft.startDate && !experienceDraft.endDate ? <p className="text-xs text-zinc-500">{isAr ? `الفترة المحفوظة من نسخة سابقة: ${experienceDraft.period}. يمكنك إدخال تاريخين جديدين لاستبدالها.` : `Saved legacy period: ${experienceDraft.period}. Enter structured dates above to replace it.`}</p> : null}
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
          <Field label={t.description} hint={t.descriptionHint}><TextArea value={courseDraft.description} onChange={(value) => setCourseDraft((draft) => ({ ...draft, description: value }))} rows={2} placeholder={isAr ? "• أهم الموضوعات أو المهارات التي تعلمتها" : "• Key topics or skills covered"} /></Field>
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
    const items = visibleActiveSection === "experience"
      ? (cv.experienceSortMode === "newest" ? sortExperiencesByDate(cv.experiences) : cv.experiences)
      : visibleActiveSection === "projects" ? cv.projects
        : visibleActiveSection === "activities" ? cv.activities : cv.courses;
    if (!items.length) return <EmptyState t={t} />;
    return (
      <motion.div layout className="grid gap-2.5">
        <AnimatePresence initial={false}>
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
          const isExperience = visibleActiveSection === "experience";
          const canDrag = isExperience && items.length > 1 && cv.experienceSortMode === "manual";
          const experienceIndex = isExperience ? items.findIndex((entry) => entry.id === raw.id) : -1;
          return (
            <motion.div
              key={raw.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.985 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {/* Keep native HTML drag events on a regular div. Framer Motion's
                  motion.div uses its own drag gesture event types. */}
              <div
                draggable={canDrag}
                onDragStart={(event) => {
                  if (!canDrag) return;
                  setDraggingExperienceId(raw.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", raw.id);
                }}
                onDragOver={(event) => {
                  if (!canDrag || !draggingExperienceId) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverExperienceId(raw.id);
                }}
                onDrop={(event) => {
                  if (!canDrag) return;
                  event.preventDefault();
                  const sourceId = event.dataTransfer.getData("text/plain") || draggingExperienceId;
                  if (sourceId) reorderExperiences(sourceId, raw.id);
                }}
                onDragEnd={() => { setDraggingExperienceId(null); setDragOverExperienceId(null); }}
                className={cx(
                  "flex items-start justify-between gap-3 rounded-xl border bg-white p-3.5 transition dark:bg-zinc-900",
                  dragOverExperienceId === raw.id ? "border-[#C8A448] ring-2 ring-[#C8A448]/20" : "border-zinc-200 dark:border-zinc-700",
                  draggingExperienceId === raw.id ? "opacity-45" : "",
                  canDrag ? "cursor-grab active:cursor-grabbing" : ""
                )}
              >
                <div className="flex min-w-0 items-start gap-2">
                {canDrag ? <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                  <GripVertical className="h-4 w-4 text-zinc-400" aria-label={isAr ? "اسحب لإعادة الترتيب" : "Drag to reorder"} />
                  <div className="flex flex-col">
                    <button type="button" onClick={() => moveExperience(raw.id, -1)} disabled={experienceIndex === 0} className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-25 dark:hover:bg-zinc-800" aria-label={isAr ? "تحريك لأعلى" : "Move up"}><ArrowUp className="h-3 w-3" /></button>
                    <button type="button" onClick={() => moveExperience(raw.id, 1)} disabled={experienceIndex === items.length - 1} className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-25 dark:hover:bg-zinc-800" aria-label={isAr ? "تحريك لأسفل" : "Move down"}><ArrowDown className="h-3 w-3" /></button>
                  </div>
                </div> : null}
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-zinc-900 dark:text-white">{heading}</p>
                  {sub ? <p className="mt-1 break-words text-xs text-zinc-500">{sub}</p> : null}
                  {description ? <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs leading-5 text-zinc-600 dark:text-zinc-300">{description}</p> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={() => editItem(raw.id)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label={t.editItem}><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeItem(raw.id)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label={t.delete}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </motion.div>
    );
  };

  const sectionLabel = (id: SectionId) => isAr ? SECTION_META[id].titleAr : SECTION_META[id].titleEn;
  const templateOptions = CV_TEMPLATE_OPTIONS.map((option) => ({
    id: option.id,
    name: option.title,
    description: isAr ? option.descriptionAr : option.descriptionEn,
    badge: isAr ? option.badgeAr : option.badgeEn
  }));
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
          {languageMismatch ? <div role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-xs leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><p className="font-bold">{cv.cvLanguage === "en" ? (isAr ? "السيرة باللغة الإنجليزية، لكن توجد حروف عربية في الحقول الموضحة. يمكنك تحميل السيرة بعد المراجعة أو بدون تعديلها." : "English CV selected; Arabic letters were found in the fields listed below. You can still download your CV.") : (isAr ? "السيرة باللغة العربية، لكن توجد حروف إنجليزية في الحقول الموضحة. يمكنك تحميل السيرة بعد المراجعة أو بدون تعديلها." : "Arabic CV selected; Latin letters were found in the fields listed below. You can still download your CV.")}</p><p>{isAr ? "الحقول التي تحتاج مراجعة:" : "Fields to review:"}</p><ul className="list-disc ps-5">{languageMismatchFields.slice(0, 8).map((field, index) => <li key={`${field.labelEn}-${index}`}>{isAr ? field.labelAr : field.labelEn}<span className="ms-1 font-mono opacity-80">({field.detectedLetters})</span></li>)}</ul>{languageMismatchFields.length > 8 ? <p>{isAr ? `و ${languageMismatchFields.length - 8} حقول أخرى.` : `And ${languageMismatchFields.length - 8} more field(s).`}</p> : null}</div> : null}
        </header>

        {wizardStep === "template" ? (
          <section className="space-y-5">
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{isAr ? "اختار الشكل اللي يناسب تقديمك" : "Choose the style that fits your application"}</p>
              <p className="mt-1 text-xs text-zinc-500">{isAr ? "كل التصميمات رسمية وبعمود واحد ومهيأة لتكون سهلة القراءة بواسطة ATS." : "All four designs are formal, single-column and designed for ATS readability."}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {templateOptions.map((option, index) => {
                const active = cv.template === option.id;
                return (
                  <motion.button key={option.id} type="button" onClick={() => update("template", option.id)} aria-pressed={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: index * 0.045 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }} className={cx("group rounded-2xl border bg-white p-3 text-start shadow-sm transition dark:bg-zinc-900", active ? "border-[#C8A448] ring-2 ring-[#C8A448]/25" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700")}>
                    <TemplateThumbnail template={option.id} isAr={isAr} />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div><span className="block text-sm font-extrabold text-zinc-900 dark:text-white">{option.name}</span><span className="mt-0.5 block text-[10px] font-semibold text-[#8A6D1F] dark:text-[#E2C46F]">{option.badge}</span></div>
                      {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <span className="h-5 w-5 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600" />}
                    </div>
                    <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-500">{option.description}</p>
                  </motion.button>
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
              {cv.educationStatus === "studying" ? <Field label={t.yearLevel}><select aria-label={t.yearLevel} value={cv.yearLevel} onChange={(event) => update("yearLevel", event.target.value)} className="cv-select"><option value="">—</option>{Object.entries(YEAR_LEVELS).map(([key, labels]) => <option key={key} value={key}>{labels[isAr ? "ar" : "en"]}</option>)}</select></Field> : null}
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
              <div><h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">{sectionLabel(visibleActiveSection)}</h2><p className="mt-1 text-sm text-zinc-500">{isAr ? "كل الحقول اختيارية. أضف ما ينطبق عليك فقط، ويمكنك تخطي الخطوة." : "All fields are optional. Add only what applies to you, or skip this step."}</p>
                {visibleActiveSection === "experience" && cv.experiences.length > 1 ? <div className="mt-3 inline-flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-950">
                  <button type="button" onClick={() => setExperienceSortMode("manual")} aria-pressed={cv.experienceSortMode === "manual"} className={cx("rounded-lg px-3 py-1.5 text-[11px] font-bold transition", cv.experienceSortMode === "manual" ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "text-zinc-600 dark:text-zinc-300")}>{isAr ? "ترتيب يدوي" : "Manual order"}</button>
                  <button type="button" onClick={() => setExperienceSortMode("newest")} aria-pressed={cv.experienceSortMode === "newest"} className={cx("rounded-lg px-3 py-1.5 text-[11px] font-bold transition", cv.experienceSortMode === "newest" ? "bg-[#182B36] text-white dark:bg-[#C8A448] dark:text-[#182B36]" : "text-zinc-600 dark:text-zinc-300")}>{isAr ? "الأحدث أولًا" : "Newest first"}</button>
                </div> : null}
                {visibleActiveSection === "experience" && cv.experiences.length > 1 ? <p className="mt-1 text-[10px] text-zinc-500">{cv.experienceSortMode === "manual" ? (isAr ? "اسحب العناصر لإعادة ترتيبها، أو استخدم الأسهم." : "Drag entries to reorder them, or use the arrow controls.") : (isAr ? "يتم ترتيب الخبرات تلقائيًا من الأحدث إلى الأقدم حسب تاريخ البداية." : "Experience is sorted automatically by start date, newest first.")}</p> : null}
              </div>
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
            {qualityWarnings.length ? <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><p className="mb-1 font-extrabold">{isAr ? "ملاحظات لمراجعتها قبل التقديم" : "Content checks to review before applying"}</p><ul className="list-disc space-y-1 ps-5">{qualityWarnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul><p className="mt-2 text-[11px]">{isAr ? "دي تنبيهات إرشادية فقط؛ لن يتم تعديل أو حذف أي معلومة تلقائيًا." : "These are guidance warnings only. No information is automatically changed or deleted."}</p></div> : null}
            {languageMismatch ? <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><p className="font-extrabold">{cv.cvLanguage === "en" ? (isAr ? "ملاحظة: توجد حروف عربية في بعض حقول السيرة الإنجليزية. يمكنك مراجعتها أو متابعة التحميل كما هي." : "Arabic letters were found in the fields listed below. You can still download your CV.") : (isAr ? "ملاحظة: توجد حروف إنجليزية في بعض حقول السيرة العربية. يمكنك مراجعتها أو متابعة التحميل كما هي." : "Latin letters were found in the fields listed below. You can still download your CV.")}</p><ul className="mt-1 list-disc space-y-1 ps-5">{languageMismatchFields.map((field, index) => <li key={`${field.labelEn}-${index}`}>{isAr ? field.labelAr : field.labelEn}<span className="ms-1 font-mono opacity-80">({field.detectedLetters})</span></li>)}</ul><p className="mt-2">{isAr ? "الاختيارات الجاهزة مثل حالة الدراسة والسنة الدراسية لا تدخل في هذا الفحص؛ يتم عرضها حسب لغة السيرة." : "System choices such as study status and study year are excluded and displayed in the selected CV language."}</p></div> : null}
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

      <AnimatePresence>
        {showPreview ? <CVPreviewModal key="cv-preview-modal" cv={cv} isAr={isAr} onClose={() => setShowPreview(false)} onDownload={downloadCV} downloading={downloading} onTemplateChange={(template) => update("template", template)} /> : null}
      </AnimatePresence>
    </div>
  );
}

function FormActions({ cancel, saveLabel, cancelLabel }: { cancel: () => void; saveLabel: string; cancelLabel: string }) {
  return <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800"><button type="button" onClick={cancel} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{cancelLabel}</button><button type="submit" className="rounded-xl bg-[#182B36] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#294653] dark:bg-[#C8A448] dark:text-[#182B36]">{saveLabel}</button></div>;
}

function EmptyState({ t }: { t: LocaleCopy }) {
  return <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800"><Plus className="h-5 w-5" /></div><p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t.noItems}</p><p className="mt-1 text-xs text-zinc-500">{t.noItemsHint}</p></div>;
}
