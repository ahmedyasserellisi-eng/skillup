import {
  CV_PAGE,
  CV_TEMPLATE_DESIGNS,
  CV_TYPOGRAPHY,
  experienceKindLabel,
  experiencePeriodLabel,
  projectKindLabel,
  sortExperiencesByDate,
  yearLevelLabel,
  type CVData,
} from "./cv-types";

export type CVExportData = CVData;

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

function addDescriptionBullets(
  content: PdfNode[],
  value: string,
  color: string,
  fontSize: number,
  lineHeight: number
): void {
  const items = descriptionLines(value);
  if (!items.length) return;
  content.push({
    ul: items,
    fontSize,
    color,
    margin: [0, 2, 0, 6],
    lineHeight
  });
}

function buildPdfDefinition(cv: CVExportData): Record<string, unknown> {
  const ar = cv.cvLanguage === "ar";
  const template = cv.template ?? "reference";
  const design = CV_TEMPLATE_DESIGNS[template];
  const isReference = template === "reference";
  const isClassic = template === "classic";
  const isContemporary = template === "contemporary";
  const isChronological = template === "chronological";
  const colors = design;
  const typography = CV_TYPOGRAPHY[cv.cvLanguage];
  const font = ar ? "Cairo" : "Roboto";
  const bodyFontSize = typography.bodyPt;
  const sectionFontSize = typography.sectionPt;
  const nameFontSize = typography.namePt;
  const targetFontSize = typography.targetPt;
  const contactFontSize = typography.contactPt;
  const bodyLineHeight = typography.lineHeight;
  const content: PdfNode[] = [];

  // A4 page dimensions and matching margins are shared with the browser preview.
  const { left: leftMargin, right: rightMargin, top: topMargin, bottom: bottomMargin } = CV_PAGE.marginsPt;
  const pageContentWidth = CV_PAGE.widthPt - leftMargin - rightMargin;

  const line = (margin: number[] = [0, 4, 0, 7], color = colors.rule, width = 0.7): PdfNode => ({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: pageContentWidth, y2: 0, lineWidth: width, lineColor: color }],
    margin
  });

  const sectionHeading = (title: string) => {
    const headingNodes: PdfNode[] = [];
    if (isReference) headingNodes.push(line([0, 11, 0, 4], colors.rule, 0.7));
    headingNodes.push({
      text: title,
      fontSize: sectionFontSize,
      bold: true,
      color: colors.primary,
      fillColor: isContemporary ? "#F1F7F6" : undefined,
      characterSpacing: isChronological ? 0.65 : isClassic ? 0.3 : isContemporary ? 0.15 : 0,
      margin: [0, isReference ? 0 : 10, 0, 5],
      alignment: ar ? "right" : "left"
    });
    if (!isReference) headingNodes.push(line([0, 0, 0, 5], colors.rule, isContemporary ? 1.1 : isClassic ? 0.9 : 0.6));
    // Keep the section title with its rule so a heading is not stranded at a page bottom.
    content.push({ unbreakable: true, stack: headingNodes, margin: [0, 0, 0, 0] });
  };

  const addEntryHeader = (title: string, subtitle: string, date: string, indent = 0) => {
    const leftStack: PdfNode[] = [];
    if (title.trim()) {
      leftStack.push({
        text: title.trim(),
        bold: true,
        fontSize: bodyFontSize,
        color: colors.body,
        margin: [0, 0, 0, 1]
      });
    }
    if (subtitle.trim()) {
      leftStack.push({
        text: subtitle.trim(),
        fontSize: bodyFontSize,
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
        ...(date.trim() ? [{ width: "auto", text: date.trim(), alignment: "right", color: colors.muted, fontSize: bodyFontSize, margin: [0, 0, 0, 0] }] : [])
      ],
      columnGap: 12,
      margin: [indent, 3, 0, 2]
    });
  };

  const contact = buildContactText(cv);
  const nameAlignment = design.headerAlignment === "center" ? "center" : (ar ? "right" : "left");
  const header: PdfNode[] = [];
  header.push({
    text: cv.fullName.trim() || (ar ? "الاسم بالكامل" : "Full Name"),
    fontSize: nameFontSize,
    bold: true,
    color: colors.primary,
    alignment: nameAlignment,
    margin: [0, 0, 0, 2]
  });
  if (cv.targetRole.trim()) {
    header.push({
      text: cv.targetRole.trim(),
      fontSize: targetFontSize,
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
      fontSize: contactFontSize,
      color: colors.muted,
      alignment: design.headerAlignment === "center" ? "center" : (ar ? "right" : "left"),
      margin: [0, 3, 0, 2]
    });
  }
  content.push({ stack: header, margin: [0, 0, 0, 0] });
  if (template === "reference") content.push(line([0, 4, 0, 0], colors.rule, 0.7));
  else if (isContemporary) content.push(line([0, 5, 0, 1], colors.secondary, 1.5));
  else content.push(line([0, 5, 0, 1], colors.rule, isClassic ? 1.4 : 0.8));

  if (cv.summary.trim()) {
    sectionHeading(ar ? "الملخص المهني" : "PROFESSIONAL SUMMARY");
    content.push({
      text: cv.summary.trim(),
      fontSize: bodyFontSize,
      color: colors.body,
      lineHeight: bodyLineHeight,
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
      cv.educationStatus === "studying" && yearLevelLabel(cv.yearLevel, cv.cvLanguage) ? `${ar ? "السنة الدراسية" : "Study year"}: ${yearLevelLabel(cv.yearLevel, cv.cvLanguage)}` : "",
      cv.gpa ? `${ar ? "التقدير" : "Grade"}: ${cv.gpa}` : ""
    ]);
    if (educationDetails.length) {
      content.push({ ul: educationDetails, fontSize: bodyFontSize, color: colors.body, margin: [0, 1, 0, 5], lineHeight: bodyLineHeight });
    }
  }

  const order = cv.sectionOrder.filter((id) => cv.selectedSections.includes(id));
  for (const id of order) {
    if (id === "experience") {
      const experienceItems = cv.experienceSortMode === "newest"
        ? sortExperiencesByDate(cv.experiences)
        : cv.experiences;
      const items = experienceItems.filter((item) => item.role || item.organization || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "الخبرات العملية والتدريب" : "PROFESSIONAL EXPERIENCE");
      for (const item of items) {
        addEntryHeader(item.role || experienceKindLabel(item.kind, cv.cvLanguage), unique([item.organization, item.location]).join(" · "), experiencePeriodLabel(item, cv.cvLanguage), 12);
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight);
      }
    }

    if (id === "projects") {
      const items = cv.projects.filter((item) => item.name || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "المشاريع" : "PROJECTS");
      for (const item of items) {
        addEntryHeader(item.name, unique([item.role, projectKindLabel(item.kind, cv.cvLanguage)]).join(" · "), item.date, 12);
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight);
        if (item.tools.trim()) {
          content.push({
            text: [{ text: ar ? "الأدوات والتقنيات: " : "Tools: ", bold: true }, { text: item.tools.trim() }],
            fontSize: bodyFontSize,
            color: colors.body,
            margin: [0, 1, 0, 2]
          });
        }
        if (item.url.trim()) {
          const url = normalizeWebUrl(item.url);
          content.push({
            text: item.url.trim(),
            fontSize: bodyFontSize,
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
      sectionHeading(ar ? "التطوع والأنشطة" : "LEADERSHIP & VOLUNTEERING");
      for (const item of items) {
        addEntryHeader(item.role || item.organization, item.role && item.organization ? item.organization : "", item.period, 12);
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight);
      }
    }

    if (id === "courses") {
      const items = cv.courses.filter((item) => item.name || item.provider || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "الكورسات والشهادات" : "COURSES & CERTIFICATIONS");
      for (const item of items) {
        addEntryHeader(item.name, item.provider, item.date, 12);
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight);
        if (item.certificateUrl.trim()) {
          const url = normalizeWebUrl(item.certificateUrl);
          content.push({
            text: item.certificateUrl.trim(),
            fontSize: bodyFontSize,
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
        content.push({ text: label, fontSize: bodyFontSize, bold: true, color: colors.body, margin: [0, 3, 0, 1] });
        content.push({ ul: values, fontSize: bodyFontSize, color: colors.body, margin: [0, 0, 0, 4], lineHeight: bodyLineHeight });
      };

      addSkillGroup(ar ? "المهارات الأساسية" : "Core Skills", skills);
      addSkillGroup(ar ? "الأدوات والمنصات" : "Tools & Platforms", tools);
      addSkillGroup(ar ? "اللغات" : "Languages", languages);
    }
  }

  return {
    // pdfMake paginates automatically; body font sizes are fixed and are never scaled to fit one page.
    pageSize: { width: CV_PAGE.widthPt, height: CV_PAGE.heightPt },
    pageMargins: [leftMargin, topMargin, rightMargin, bottomMargin],
    rtl: ar,
    info: {
      title: `${cv.fullName.trim() || "CV"} - SkillUp CV`,
      subject: "Professional CV",
      creator: "SkillUp CV Builder"
    },
    defaultStyle: { font, fontSize: bodyFontSize, color: colors.body, lineHeight: bodyLineHeight },
    content
  };
}

export async function downloadCvPdf(cv: CVExportData): Promise<void> {
  const pdfMake = await getPdfMake();
  const definition = buildPdfDefinition(cv);
  const safeName = cv.fullName.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "SkillUp_CV";
  pdfMake.createPdf(definition).download(`${safeName}_CV.pdf`);
}
