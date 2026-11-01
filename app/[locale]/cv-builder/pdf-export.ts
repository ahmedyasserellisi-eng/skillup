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
  type CVTemplate,
} from "./cv-types";

export type CVExportData = CVData;

type PdfNode = Record<string, unknown>;
type PdfMakeDocument = {
  download: (filename: string) => Promise<void>;
  getBlob: () => Promise<Blob>;
};

type PdfMakeApi = {
  createPdf: (definition: Record<string, unknown>) => PdfMakeDocument;
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

function parseInlineEmphasis(value: string): PdfNode[] {
  const nodes: PdfNode[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) nodes.push({ text: value.slice(cursor, match.index) });
    nodes.push({ text: match[1], bold: true });
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) nodes.push({ text: value.slice(cursor) });
  return nodes.length ? nodes : [{ text: value }];
}

function buildContactItems(cv: CVExportData): Array<{ value: string; href?: string; kind: "plain" | "phone" | "email" | "linkedin" }> {
  const items: Array<{ value: string; href?: string; kind: "plain" | "phone" | "email" | "linkedin" }> = [];
  if (cv.city.trim()) items.push({ value: cv.city.trim(), kind: "plain" });
  if (cv.phone.trim()) items.push({ value: cv.phone.trim(), href: normalizePhoneUrl(cv.phone), kind: "phone" });
  if (cv.email.trim()) items.push({ value: cv.email.trim(), href: `mailto:${cv.email.trim()}`, kind: "email" });
  if (cv.linkedin.trim()) {
    const linkedinValue = cv.linkedin.trim().replace(/^linkedin\s*:\s*/i, "");
    items.push({ value: linkedinValue, href: normalizeWebUrl(linkedinValue), kind: "linkedin" });
  }
  return items;
}

function contactInlineNodes(
  items: ReturnType<typeof buildContactItems>,
  colors: typeof CV_TEMPLATE_DESIGNS[CVTemplate],
  separator = "  |  "
): PdfNode[] {
  const nodes: PdfNode[] = [];
  items.forEach((item, index) => {
    if (index) nodes.push({ text: separator, color: colors.muted });
    const display = item.kind === "linkedin"
      ? item.value.replace(/^linkedin\s*:\s*/i, "")
      : item.value;
    nodes.push({
      text: display,
      ...(item.href ? { link: item.href } : {}),
      color: item.kind === "linkedin" ? colors.secondary : colors.muted,
      ...(item.kind === "linkedin" ? { decoration: "underline" } : {})
    });
  });
  return nodes;
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
    ul: items.map((item) => ({ text: parseInlineEmphasis(item) })),
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
  const contactItems = buildContactItems(cv);

  // The same A4 page box and margins are shared by all templates.
  const { left: leftMargin, right: rightMargin, top: topMargin, bottom: bottomMargin } = CV_PAGE.marginsPt;
  const pageContentWidth = CV_PAGE.widthPt - leftMargin - rightMargin;
  const line = (margin: number[] = [0, 4, 0, 7], color = colors.rule, width = 0.7): PdfNode => ({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: pageContentWidth, y2: 0, lineWidth: width, lineColor: color }],
    margin
  });

  const sectionHeading = (title: string) => {
    const headingNodes: PdfNode[] = [];

    if (isReference) {
      // One rule above the heading. It also separates the header from the first section,
      // so we deliberately do not add a second rule directly after the profile header.
      headingNodes.push(line([0, 9, 0, 4], colors.rule, 0.7));
      headingNodes.push({
        text: title,
        fontSize: sectionFontSize,
        bold: true,
        color: colors.primary,
        margin: [0, 0, 0, 4],
        alignment: ar ? "right" : "left"
      });
    } else if (isClassic) {
      headingNodes.push({
        text: title,
        fontSize: sectionFontSize,
        bold: true,
        color: colors.primary,
        characterSpacing: 0.45,
        margin: [0, 10, 0, 2],
        alignment: ar ? "right" : "left"
      });
      headingNodes.push(line([0, 0, 0, 5], colors.rule, 0.9));
    } else if (isContemporary) {
      headingNodes.push({
        table: {
          widths: [3, "*"],
          body: [[
            { text: "", fillColor: colors.secondary, border: [false, false, false, false], margin: [0, 0, 0, 0] },
            {
              text: title,
              bold: true,
              fontSize: sectionFontSize,
              color: colors.primary,
              fillColor: "#EDF6F4",
              margin: [6, 5, 6, 5],
              border: [false, false, false, false],
              alignment: ar ? "right" : "left"
            }
          ]]
        },
        layout: "noBorders",
        margin: [0, 10, 0, 5]
      });
    } else {
      headingNodes.push({
        text: title,
        fontSize: sectionFontSize,
        bold: true,
        color: colors.primary,
        characterSpacing: 0.8,
        margin: [0, 10, 0, 3],
        alignment: ar ? "right" : "left"
      });
      headingNodes.push(line([0, 0, 0, 5], colors.rule, 0.8));
    }

    // Keep each section label with its rule so a heading is not stranded at a page bottom.
    content.push({ unbreakable: true, stack: headingNodes, margin: [0, 0, 0, 0] });
  };

  const addEntryHeader = (
    title: string,
    subtitle: string,
    date: string,
    options: { indent?: number; subtitleBold?: boolean; subtitleColor?: string } = {}
  ) => {
    const indent = options.indent ?? 0;
    const leftStack: PdfNode[] = [];
    if (title.trim()) {
      leftStack.push({
        text: title.trim(),
        bold: true,
        fontSize: bodyFontSize,
        color: isContemporary ? colors.primary : colors.body,
        margin: [0, 0, 0, 1]
      });
    }
    if (subtitle.trim()) {
      leftStack.push({
        text: subtitle.trim(),
        fontSize: bodyFontSize,
        bold: options.subtitleBold ?? false,
        color: options.subtitleColor ?? colors.body,
        margin: [0, 0, 0, 1]
      });
    }
    if (!leftStack.length && !date.trim()) return;

    const dateNode: PdfNode = {
      width: "auto",
      text: date.trim(),
      alignment: isChronological ? (ar ? "right" : "left") : (ar ? "left" : "right"),
      color: colors.muted,
      fontSize: isChronological ? Math.max(8, contactFontSize) : bodyFontSize,
      italics: isClassic,
      margin: [0, 0, 0, 0]
    };

    if (isChronological && date.trim()) {
      const contentColumn: PdfNode = { width: "*", stack: leftStack };
      const columns = ar
        ? [contentColumn, dateNode]
        : [dateNode, contentColumn];
      content.push({ columns, columnGap: 12, margin: [indent, 4, 0, 2] });
    } else {
      content.push({
        columns: [
          { width: "*", stack: leftStack },
          ...(date.trim() ? [dateNode] : [])
        ],
        columnGap: 12,
        margin: [indent, 3, 0, 2]
      });
    }
  };

  const nameAlignment = design.headerAlignment === "center" ? "center" : (ar ? "right" : "left");
  const header: PdfNode[] = [];
  header.push({
    text: cv.fullName.trim() || (ar ? "الاسم بالكامل" : "Full Name"),
    fontSize: isContemporary ? nameFontSize + 1 : nameFontSize,
    bold: true,
    color: colors.name,
    alignment: nameAlignment,
    characterSpacing: isChronological ? 0.45 : 0,
    margin: [0, 0, 0, 2]
  });

  if (cv.targetRole.trim()) {
    header.push({
      text: cv.targetRole.trim(),
      fontSize: targetFontSize,
      italics: isReference || isChronological,
      bold: isClassic || isContemporary,
      color: colors.secondary,
      alignment: nameAlignment,
      margin: [0, 0, 0, 4]
    });
  }

  if (isReference) {
    const firstContactLine = contactItems.filter((item) => item.kind !== "linkedin");
    if (firstContactLine.length) {
      header.push({
        text: contactInlineNodes(firstContactLine, colors),
        fontSize: contactFontSize,
        alignment: "center",
        margin: [0, 3, 0, 1]
      });
    }
    const linkedIn = contactItems.find((item) => item.kind === "linkedin");
    if (linkedIn) {
      const linkedInLabel = linkedIn.value.replace(/^linkedin\s*:\s*/i, "");
      header.push({
        text: [
          { text: "LinkedIn: ", color: colors.muted },
          { text: linkedInLabel, link: linkedIn.href, color: colors.secondary, decoration: "underline" }
        ],
        fontSize: contactFontSize,
        alignment: "center",
        margin: [0, 1, 0, 4]
      });
    }
  } else if (contactItems.length) {
    header.push({
      text: contactInlineNodes(contactItems, colors),
      fontSize: contactFontSize,
      alignment: nameAlignment,
      margin: [0, 4, 0, 1]
    });
  }

  if (isContemporary) {
    content.push({
      table: {
        widths: ["*"],
        body: [[{
          stack: header,
          fillColor: "#F0F7F5",
          margin: [11, 10, 11, 10],
          border: [false, false, false, false]
        }]]
      },
      layout: "noBorders",
      margin: [0, 0, 0, 2]
    });
    content.push(line([0, 7, 0, 1], colors.secondary, 1.5));
  } else {
    content.push({ stack: header, margin: [0, 0, 0, 0] });
    if (isClassic) content.push(line([0, 5, 0, 2], colors.rule, 1.25));
    if (isChronological) content.push(line([0, 6, 0, 2], colors.primary, 1.1));
    // Blue Professional intentionally has no extra header line: the first section's
    // top rule is the single separator visible in the provided reference document.
  }

  if (cv.summary.trim()) {
    sectionHeading(isReference || isClassic ? (ar ? "الملخص المهني" : "PROFESSIONAL SUMMARY") : (ar ? "الملخص المهني" : "PROFILE"));
    content.push({
      text: parseInlineEmphasis(cv.summary.trim()),
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
    // In the Blue Professional reference the qualification is bold, while the university is regular.
    addEntryHeader(degree, educationPlace, educationPeriod, { subtitleBold: false });
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
        addEntryHeader(
          item.role || experienceKindLabel(item.kind, cv.cvLanguage),
          unique([item.organization, item.location]).join(" · "),
          experiencePeriodLabel(item, cv.cvLanguage),
          { indent: 12, subtitleBold: isReference || isContemporary }
        );
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight);
      }
    }

    if (id === "projects") {
      const items = cv.projects.filter((item) => item.name || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "المشاريع" : "Projects");
      for (const item of items) {
        addEntryHeader(
          item.name,
          unique([item.role, projectKindLabel(item.kind, cv.cvLanguage)]).join(" · "),
          item.date,
          { indent: 12, subtitleBold: false }
        );
        const projectDescription = descriptionLines(item.description).join(" ");
        if (projectDescription) {
          content.push({
            text: parseInlineEmphasis(projectDescription),
            fontSize: bodyFontSize,
            color: colors.body,
            lineHeight: bodyLineHeight,
            margin: [0, 0, 0, 5]
          });
        }
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
          const label = /github\.com/i.test(item.url) ? (ar ? "GitHub: " : "GitHub: ")
            : /vercel\.app|netlify\.app|\.com\/demo/i.test(item.url) ? (ar ? "عرض مباشر: " : "Live Demo: ")
              : (ar ? "الرابط: " : "Link: ");
          content.push({
            text: [
              { text: label, bold: true, color: colors.body },
              { text: item.url.trim(), color: colors.secondary, link: url, decoration: "underline" }
            ],
            fontSize: bodyFontSize,
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
        addEntryHeader(
          item.role || item.organization,
          item.role && item.organization ? item.organization : "",
          item.period,
          { indent: 12, subtitleBold: false }
        );
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight);
      }
    }

    if (id === "courses") {
      const items = cv.courses.filter((item) => item.name || item.provider || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "الكورسات والشهادات" : "Courses & Certifications");
      for (const item of items) {
        addEntryHeader(item.name, item.provider, item.date, { indent: 12, subtitleBold: isReference || isContemporary });
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight);
        if (item.certificateUrl.trim()) {
          const url = normalizeWebUrl(item.certificateUrl);
          content.push({
            text: [
              { text: ar ? "الشهادة: " : "Certificate: ", bold: true, color: colors.body },
              { text: item.certificateUrl.trim(), color: colors.secondary, link: url, decoration: "underline" }
            ],
            fontSize: bodyFontSize,
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
      sectionHeading(ar ? "المهارات" : "Skills");

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
    // pdfMake paginates automatically; font sizes are not scaled to force content onto one page.
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

/**
 * Build a PDF Blob for the live preview. The preview uses the same document
 * definition as downloadCvPdf, so it cannot drift from the exported layout.
 */
export async function createCvPdfBlob(cv: CVExportData): Promise<Blob> {
  const pdfMake = await getPdfMake();
  const definition = buildPdfDefinition(cv);

  return pdfMake.createPdf(definition).getBlob();
}

export async function downloadCvPdf(cv: CVExportData): Promise<void> {
  const pdfMake = await getPdfMake();
  const definition = buildPdfDefinition(cv);
  const safeName = cv.fullName.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "SkillUp_CV";
  await pdfMake.createPdf(definition).download(`${safeName}_CV.pdf`);
}
