type SectionId = "experience" | "projects" | "activities" | "courses" | "skills";
type CVTemplate = "reference" | "executive" | "yale";
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
  description: string;
  certificateUrl: string;
};

export type CVExportData = {
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

type PdfNode = Record<string, unknown>;
type PdfMakeApi = {
  createPdf: (definition: Record<string, unknown>) => { download: (filename: string) => void };
};

declare global {
  interface Window {
    pdfMake?: PdfMakeApi;
  }
}

const PDFMAKE_VERSION = "2.1.2";
const PDFMAKE_BASES = [
  `https://cdn.jsdelivr.net/npm/@digicole/pdfmake-rtl@${PDFMAKE_VERSION}/build/`,
  `https://unpkg.com/@digicole/pdfmake-rtl@${PDFMAKE_VERSION}/build/`
];
let pdfMakeLoader: Promise<PdfMakeApi> | null = null;

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PDF library failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("PDF library failed to load."));
    };
    document.head.appendChild(script);
  });
}

async function getPdfMake(): Promise<PdfMakeApi> {
  if (typeof window === "undefined") throw new Error("PDF export is available in the browser only.");
  if (!pdfMakeLoader) {
    pdfMakeLoader = (async () => {
      let lastError: unknown;
      for (const base of PDFMAKE_BASES) {
        try {
          if (!window.pdfMake?.createPdf) {
            await loadScript(`${base}pdfmake.min.js`, "skillup-pdfmake-core");
          }
          // Ensure the embedded Cairo / Roboto font bundle is available before creating the document.
          await loadScript(`${base}vfs_fonts.js`, "skillup-pdfmake-fonts");
          if (window.pdfMake?.createPdf) return window.pdfMake;
        } catch (error) {
          lastError = error;
          document.getElementById("skillup-pdfmake-core")?.remove();
          document.getElementById("skillup-pdfmake-fonts")?.remove();
        }
      }
      throw lastError instanceof Error ? lastError : new Error("Could not initialize PDF export.");
    })().catch((error) => {
      pdfMakeLoader = null;
      throw error;
    });
  }
  return pdfMakeLoader;
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

function descriptionLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•▪◦‣]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

const unique = (values: Array<string | undefined>) => [...new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))];

function normalizeWebUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function normalizePhoneUrl(value: string): string {
  const phone = value.trim().replace(/[^\d+]/g, "");
  return phone ? `tel:${phone}` : "";
}

function buildContactText(cv: CVExportData): PdfNode[] {
  const items: Array<{ value: string; href?: string }> = [];
  if (cv.city.trim()) items.push({ value: cv.city.trim() });
  if (cv.phone.trim()) items.push({ value: cv.phone.trim(), href: normalizePhoneUrl(cv.phone) });
  if (cv.email.trim()) items.push({ value: cv.email.trim(), href: `mailto:${cv.email.trim()}` });
  if (cv.linkedin.trim()) items.push({ value: cv.linkedin.trim(), href: normalizeWebUrl(cv.linkedin) });

  const richText: PdfNode[] = [];
  items.forEach((item, index) => {
    if (index) richText.push({ text: "  |  " });
    richText.push(item.href
      ? { text: item.value, link: item.href, color: "#111111", decoration: "underline" }
      : { text: item.value });
  });
  return richText;
}

function addDescriptionBullets(content: PdfNode[], value: string, color: string): void {
  const items = descriptionLines(value);
  if (!items.length) return;
  content.push({
    ul: items,
    fontSize: 10,
    color,
    margin: [0, 2, 0, 6],
    lineHeight: 1.18
  });
}

function addPlainDescription(content: PdfNode[], value: string, color: string): void {
  const lines = descriptionLines(value);
  if (!lines.length) return;
  content.push({
    text: lines.join(" "),
    fontSize: 10,
    color,
    lineHeight: 1.18,
    margin: [0, 1, 0, 5]
  });
}

function buildPdfDefinition(cv: CVExportData): Record<string, unknown> {
  const ar = cv.cvLanguage === "ar";
  const template = cv.template ?? "reference";
  const isReference = template === "reference";
  const isYale = template === "yale";
  const colors = isReference
    ? { primary: "#24466F", secondary: "#4D83C5", rule: "#AFC3DE", body: "#111111", muted: "#4D4D4D" }
    : { primary: "#111111", secondary: "#333333", rule: "#333333", body: "#111111", muted: "#4D4D4D" };
  const font = ar ? "Cairo" : "Roboto";
  const content: PdfNode[] = [];

  // US Letter, matching the attached Word reference (8.5 x 11 in).
  // Word margins: 0.70 in left/right, 0.65 in top, 0.55 in bottom.
  const horizontalMargin = 50.4;
  const topMargin = 46.8;
  const bottomMargin = 39.6;
  const pageContentWidth = 612 - horizontalMargin * 2;

  const line = (margin: number[] = [0, 4, 0, 7], color = colors.rule, width = 0.7): PdfNode => ({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: pageContentWidth, y2: 0, lineWidth: width, lineColor: color }],
    margin
  });

  const sectionHeading = (title: string) => {
    const headingNodes: PdfNode[] = [];
    if (isReference) headingNodes.push(line([0, 11, 0, 4], colors.rule, 0.7));
    headingNodes.push({
      text: title,
      fontSize: 11,
      bold: true,
      color: colors.primary,
      characterSpacing: isYale ? 0.35 : 0,
      margin: [0, isReference ? 0 : 10, 0, 5],
      alignment: ar ? "right" : "left"
    });
    if (!isReference) headingNodes.push(line([0, 0, 0, 5], colors.rule, isYale ? 0.9 : 0.6));
    // Keep the section title with its rule so a heading is not stranded at a page bottom.
    content.push({ unbreakable: true, stack: headingNodes, margin: [0, 0, 0, 0] });
  };

  const addEntryHeader = (title: string, subtitle: string, date: string, indent = 0) => {
    const leftStack: PdfNode[] = [];
    if (title.trim()) {
      leftStack.push({
        text: title.trim(),
        bold: true,
        fontSize: 10,
        color: colors.body,
        margin: [0, 0, 0, 1]
      });
    }
    if (subtitle.trim()) {
      leftStack.push({
        text: subtitle.trim(),
        fontSize: 10,
        bold: true,
        color: colors.body,
        margin: [0, 0, 0, 1]
      });
    }
    if (!leftStack.length && !date.trim()) return;

    // Keep the reading order deterministic: title, organization, then date.
    content.push({
      columns: [
        { width: "*", stack: leftStack },
        ...(date.trim() ? [{ width: "auto", text: date.trim(), alignment: "right", color: colors.muted, fontSize: 10, margin: [0, 0, 0, 0] }] : [])
      ],
      columnGap: 12,
      margin: [indent, 3, 0, 2]
    });
  };

  const contact = buildContactText(cv);
  const nameAlignment = isReference ? "center" : (ar ? "right" : "left");
  const header: PdfNode[] = [];
  header.push({
    text: cv.fullName.trim() || (ar ? "الاسم بالكامل" : "Full Name"),
    fontSize: 18,
    bold: true,
    color: colors.primary,
    alignment: nameAlignment,
    margin: [0, 0, 0, 2]
  });
  if (cv.targetRole.trim()) {
    header.push({
      text: cv.targetRole.trim(),
      fontSize: 11,
      italics: isReference,
      bold: !isReference,
      color: colors.secondary,
      alignment: nameAlignment,
      margin: [0, 0, 0, 4]
    });
  }
  if (contact.length) {
    header.push({
      text: contact,
      fontSize: 9,
      color: colors.muted,
      alignment: isReference ? "center" : (ar ? "right" : "left"),
      margin: [0, 3, 0, 2]
    });
  }
  content.push({ stack: header, margin: [0, 0, 0, 0] });

  if (cv.summary.trim()) {
    sectionHeading(ar ? "الملخص المهني" : "PROFESSIONAL SUMMARY");
    content.push({
      text: cv.summary.trim(),
      fontSize: 10,
      color: colors.body,
      lineHeight: 1.18,
      margin: [0, 0, 0, 2]
    });
  }

  const degree = cv.qualification.trim() || cv.major.trim();
  const educationPlace = unique([cv.university, cv.college]).join(" · ");
  const educationPeriod = cv.startYear
    ? `${cv.startYear} – ${cv.graduationYear || (cv.educationStatus === "studying" ? (ar ? "حتى الآن" : "Present") : "")}`.trim()
    : cv.graduationYear
      ? `${ar ? (cv.educationStatus === "studying" ? "التخرج المتوقع" : "سنة التخرج") : (cv.educationStatus === "studying" ? "Expected graduation" : "Graduation")}: ${cv.graduationYear}`
      : "";
  if (degree || educationPlace || cv.gpa || cv.yearLevel || educationPeriod) {
    sectionHeading(ar ? "التعليم" : "EDUCATION");
    addEntryHeader(degree, educationPlace, educationPeriod);
    const majorAlreadyInDegree = Boolean(cv.qualification.trim() && cv.major.trim() && cv.qualification.toLocaleLowerCase().includes(cv.major.toLocaleLowerCase()));
    const educationDetails = unique([
      cv.major && cv.qualification && !majorAlreadyInDegree ? `${ar ? "التخصص" : "Major"}: ${cv.major}` : "",
      cv.educationStatus === "studying" && cv.yearLevel ? `${ar ? "السنة الدراسية" : "Study year"}: ${cv.yearLevel}` : "",
      cv.gpa ? `${ar ? "التقدير" : "Grade"}: ${cv.gpa}` : ""
    ]);
    if (educationDetails.length) {
      content.push({ ul: educationDetails, fontSize: 10, color: colors.body, margin: [0, 1, 0, 5], lineHeight: 1.16 });
    }
  }

  const order = cv.sectionOrder.filter((id) => cv.selectedSections.includes(id));
  for (const id of order) {
    if (id === "experience") {
      const items = cv.experiences.filter((item) => item.role || item.organization || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "الخبرات العملية والتدريب" : "PROFESSIONAL EXPERIENCE");
      for (const item of items) {
        addEntryHeader(item.role || item.kind, unique([item.organization, item.location]).join(" · "), item.period, 12);
        addDescriptionBullets(content, item.description, colors.body);
      }
    }

    if (id === "projects") {
      const items = cv.projects.filter((item) => item.name || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "المشاريع" : "PROJECTS");
      for (const item of items) {
        addEntryHeader(item.name, unique([item.role, item.kind]).join(" · "), item.date, 12);
        addPlainDescription(content, item.description, colors.body);
        if (item.tools.trim()) {
          content.push({
            text: [{ text: ar ? "الأدوات والتقنيات: " : "Tools: ", bold: true }, { text: item.tools.trim() }],
            fontSize: 10,
            color: colors.body,
            margin: [0, 1, 0, 2]
          });
        }
        if (item.url.trim()) {
          const url = normalizeWebUrl(item.url);
          content.push({
            text: item.url.trim(),
            fontSize: 10,
            color: colors.secondary,
            link: url,
            decoration: "underline",
            margin: [0, 0, 0, 5]
          });
        }
      }
    }

    if (id === "activities") {
      const items = cv.activities.filter((item) => item.organization || item.role || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "القيادة والتطوع والأنشطة" : "LEADERSHIP & VOLUNTEERING");
      for (const item of items) {
        addEntryHeader(item.role || item.organization, item.role && item.organization ? item.organization : "", item.period, 12);
        addDescriptionBullets(content, item.description, colors.body);
      }
    }

    if (id === "courses") {
      const items = cv.courses.filter((item) => item.name || item.provider || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "الكورسات والشهادات" : "COURSES & CERTIFICATIONS");
      for (const item of items) {
        addEntryHeader(item.name, item.provider, item.date, 12);
        addDescriptionBullets(content, item.description, colors.body);
        if (item.certificateUrl.trim()) {
          const url = normalizeWebUrl(item.certificateUrl);
          content.push({
            text: item.certificateUrl.trim(),
            fontSize: 10,
            color: colors.secondary,
            link: url,
            decoration: "underline",
            margin: [0, 0, 0, 4]
          });
        }
      }
    }

    if (id === "skills") {
      const skills = listText(cv.skills);
      const tools = listText(cv.tools);
      const languages = listText(cv.languages);
      if (!skills.length && !tools.length && !languages.length) continue;
      sectionHeading(ar ? "المهارات" : "SKILLS");

      const addSkillGroup = (label: string, values: string[]) => {
        if (!values.length) return;
        content.push({ text: label, fontSize: 10, bold: true, color: colors.body, margin: [0, 3, 0, 1] });
        content.push({ ul: values, fontSize: 10, color: colors.body, margin: [0, 0, 0, 4], lineHeight: 1.15 });
      };

      addSkillGroup(ar ? "المهارات الأساسية" : "Core Skills", skills);
      addSkillGroup(ar ? "الأدوات والمنصات" : "Tools & Platforms", tools);
      addSkillGroup(ar ? "اللغات" : "Languages", languages);
    }
  }

  return {
    // pdfMake paginates automatically; body font sizes are fixed and are never scaled to fit one page.
    pageSize: { width: 612, height: 792 },
    pageMargins: [horizontalMargin, topMargin, horizontalMargin, bottomMargin],
    rtl: ar,
    info: {
      title: `${cv.fullName.trim() || "CV"} - SkillUp CV`,
      subject: "Professional CV",
      creator: "SkillUp CV Builder"
    },
    defaultStyle: { font, fontSize: 10, color: colors.body, lineHeight: 1.18 },
    content
  };
}

export async function downloadCvPdf(cv: CVExportData): Promise<void> {
  const pdfMake = await getPdfMake();
  const definition = buildPdfDefinition(cv);
  const safeName = cv.fullName.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "SkillUp_CV";
  pdfMake.createPdf(definition).download(`${safeName}_CV.pdf`);
}
