export type SectionId = "experience" | "projects" | "activities" | "courses" | "skills";
export type WizardStep = "template" | "profile" | "education" | "sections" | SectionId | "review";
export type CVTemplate = "reference" | "classic" | "contemporary" | "chronological";
export type EducationStatus = "studying" | "graduated";
export type ExperienceSortMode = "manual" | "newest";

export type Experience = {
  id: string;
  kind: string;
  role: string;
  organization: string;
  // `period` is retained for backward compatibility with existing saved CVs.
  period: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  location: string;
  description: string;
};

export type Project = {
  id: string;
  name: string;
  kind: string;
  role: string;
  date: string;
  tools: string;
  url: string;
  description: string;
};

export type Activity = {
  id: string;
  organization: string;
  role: string;
  period: string;
  description: string;
};

export type ProfileLink = {
  id: string;
  label: string;
  url: string;
};

export type Course = {
  id: string;
  name: string;
  provider: string;
  date: string;
  description: string;
  certificateUrl: string;
};

export type CVData = {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  city: string;
  /** Optional postal / ZIP code; retained separately for regional formats. */
  postalCode?: string;
  /** New multiple profile links; `linkedin` remains for legacy localStorage migration. */
  profileLinks?: ProfileLink[];
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
  experienceSortMode: ExperienceSortMode;
};

export const CV_PAGE = {
  widthPx: 794,
  heightPx: 1123,
  widthPt: 595.28,
  heightPt: 841.89,
  marginsPx: { left: 67, right: 67, top: 62, bottom: 53 },
  marginsPt: { left: 50.4, right: 50.4, top: 46.8, bottom: 39.6 }
} as const;

// Shared measurements keep the browser preview and PDF export on the same A4 scale.
export const CV_TYPOGRAPHY = {
  en: {
    bodyPt: 10,
    sectionPt: 11,
    namePt: 18,
    targetPt: 11,
    contactPt: 9,
    lineHeight: 1.12
  },
  ar: {
    bodyPt: 11,
    sectionPt: 13,
    namePt: 19,
    targetPt: 12,
    contactPt: 10,
    lineHeight: 1.15
  }
} as const;

export const CV_TEMPLATE_DESIGNS: Record<CVTemplate, {
  primary: string;
  name: string;
  secondary: string;
  rule: string;
  body: string;
  muted: string;
  headerAlignment: "center" | "start";
  headerStyle: "reference" | "academic" | "panel" | "timeline";
  headingStyle: "reference" | "academic" | "accent" | "chronological";
}> = {
  reference: {
    // Blue Professional: follows the supplied Word/PDF reference closely.
    primary: "#1D3B63",
    name: "#1D2D45",
    secondary: "#4F83CC",
    rule: "#B7C9E0",
    body: "#15191F",
    muted: "#606A78",
    headerAlignment: "center",
    headerStyle: "reference",
    headingStyle: "reference"
  },
  classic: {
    // A restrained, monochrome academic layout with strong typographic hierarchy.
    primary: "#202326",
    name: "#111315",
    secondary: "#4B535B",
    rule: "#9AA0A6",
    body: "#25292D",
    muted: "#687078",
    headerAlignment: "start",
    headerStyle: "academic",
    headingStyle: "academic"
  },
  contemporary: {
    // A noticeably different teal banner and filled section-label treatment.
    primary: "#145B55",
    name: "#FFFFFF",
    secondary: "#287B73",
    rule: "#A7D1CB",
    body: "#20302E",
    muted: "#637471",
    headerAlignment: "start",
    headerStyle: "panel",
    headingStyle: "accent"
  },
  chronological: {
    // A date-led format with a separate date rail and vertical markers.
    primary: "#344A68",
    name: "#24344B",
    secondary: "#607FA8",
    rule: "#B8C6D8",
    body: "#263343",
    muted: "#677587",
    headerAlignment: "start",
    headerStyle: "timeline",
    headingStyle: "chronological"
  }
};

export const CV_TEMPLATE_OPTIONS = [
  {
    id: "reference" as const,
    title: "Blue Professional",
    descriptionAr: "قالب أزرق مطابق للمرجع: هيدر مركزي، بيانات التواصل في سطر وLinkedIn في سطر مستقل، وفواصل زرقاء رفيعة.",
    descriptionEn: "Reference-led blue CV with a centered header, separate LinkedIn line, and fine blue section dividers.",
    badgeAr: "مطابق للمرجع",
    badgeEn: "Reference style"
  },
  {
    id: "classic" as const,
    title: "Classic Academic",
    descriptionAr: "قالب أكاديمي أبيض وأسود بمحاذاة يسار، عناوين واضحة وخط سفلي تقليدي؛ مناسب للسير الرسمية وATS.",
    descriptionEn: "A monochrome, left-aligned academic layout with restrained typography and classic underlined headings.",
    badgeAr: "رسمي وبسيط",
    badgeEn: "Classic ATS"
  },
  {
    id: "contemporary" as const,
    title: "Contemporary Professional",
    descriptionAr: "قالب حديث بهيدر أخضر داكن ممتد وعناوين أقسام داخل شرائط فاتحة ولمسات لونية واضحة.",
    descriptionEn: "A modern teal profile banner with filled section labels and a more expressive visual hierarchy.",
    badgeAr: "حديث وملفت",
    badgeEn: "Modern design"
  },
  {
    id: "chronological" as const,
    title: "Traditional Chronological",
    descriptionAr: "قالب زمني بعمود مستقل للتواريخ وخط رأسي يربط تفاصيل الدراسة والخبرات والكورسات.",
    descriptionEn: "A date-led layout with a dedicated date rail and vertical markers for education and experience entries.",
    badgeAr: "تسلسل زمني",
    badgeEn: "Timeline layout"
  }
] as const;

export const YEAR_LEVELS: Record<string, { ar: string; en: string }> = {
  first: { ar: "الفرقة الأولى", en: "First year" },
  second: { ar: "الفرقة الثانية", en: "Second year" },
  third: { ar: "الفرقة الثالثة", en: "Third year" },
  fourth: { ar: "الفرقة الرابعة", en: "Fourth year" },
  postgrad: { ar: "دراسات عليا", en: "Postgraduate" },
  other: { ar: "أخرى", en: "Other" }
};

export function normalizeYearLevel(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const candidate = value.trim();
  if (Object.prototype.hasOwnProperty.call(YEAR_LEVELS, candidate)) return candidate;
  const match = Object.entries(YEAR_LEVELS).find(([, labels]) => labels.ar === candidate || labels.en === candidate);
  return match?.[0] ?? candidate;
}

export function yearLevelLabel(value: string, language: "ar" | "en"): string {
  const key = normalizeYearLevel(value);
  if (!key || key === "other") return "";
  const labels = YEAR_LEVELS[key];
  return labels ? labels[language] : value;
}

export function formatMonthYear(value: string | undefined, language: "ar" | "en"): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    month: "short", year: "numeric", timeZone: "UTC"
  }).format(date);
}

export function experiencePeriodLabel(item: Experience, language: "ar" | "en"): string {
  const start = formatMonthYear(item.startDate, language);
  const end = item.isCurrent ? (language === "ar" ? "حتى الآن" : "Present") : formatMonthYear(item.endDate, language);
  return [start, end].filter(Boolean).join(" – ") || item.period?.trim() || "";
}

export function experienceKindLabel(value: string, language: "ar" | "en"): string {
  const labels: Record<string, { ar: string; en: string }> = {
    internship: { ar: "تدريب عملي", en: "Internship" },
    summer: { ar: "تدريب صيفي", en: "Summer Training" },
    "part-time": { ar: "عمل بدوام جزئي", en: "Part-time Job" },
    freelance: { ar: "عمل حر", en: "Freelance" },
    work: { ar: "خبرة عملية", en: "Work Experience" }
  };
  return labels[value]?.[language] ?? value;
}

export function projectKindLabel(value: string, language: "ar" | "en"): string {
  const labels: Record<string, { ar: string; en: string }> = {
    academic: { ar: "مشروع جامعي", en: "Academic Project" },
    personal: { ar: "مشروع شخصي", en: "Personal Project" },
    graduation: { ar: "مشروع تخرج", en: "Graduation Project" }
  };
  return labels[value]?.[language] ?? value;
}

function parseExperienceDate(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  // Common legacy formats: 2024, 2024/06, 06/2024, or Jan 2024.
  const yearFirst = raw.match(/\b((?:19|20)\d{2})(?:[-/.\s](0?[1-9]|1[0-2]))?\b/);
  if (yearFirst) return Date.UTC(Number(yearFirst[1]), Number(yearFirst[2] ?? 1) - 1, 1);
  const monthFirst = raw.match(/\b(0?[1-9]|1[0-2])[-/.]((?:19|20)\d{2})\b/);
  if (monthFirst) return Date.UTC(Number(monthFirst[2]), Number(monthFirst[1]) - 1, 1);
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function sortExperiencesByDate(items: Experience[]): Experience[] {
  return items.map((item, index) => ({ item, index, timestamp: parseExperienceDate(item.startDate || item.period) }))
    .sort((a, b) => {
      if (a.timestamp === null && b.timestamp === null) return a.index - b.index;
      if (a.timestamp === null) return 1;
      if (b.timestamp === null) return -1;
      return b.timestamp - a.timestamp || a.index - b.index;
    })
    .map(({ item }) => item);
}
