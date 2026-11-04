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
  // Keep the user-entered phone formatting in the visible PDF; strip separators only in the tel: target.
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

function formatContactLocation(city: string, postalCode?: string): string {
  const location = city.trim();
  const code = (postalCode ?? "").trim();
  if (!location) return code;
  if (!code || location.replace(/\s/g, "").includes(code.replace(/\s/g, ""))) return location;

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const country = parts.pop() as string;
    const region = parts.pop() as string;
    parts.push(`${region} ${code}`, country);
    return parts.join(", ");
  }
  return `${location} ${code}`;
}

type ContactItem = {
  value: string;
  href?: string;
  kind: "plain" | "phone" | "email" | "profile";
  label?: string;
};

function buildContactItems(cv: CVExportData): ContactItem[] {
  const items: ContactItem[] = [];
  const location = formatContactLocation(cv.city, cv.postalCode);
  if (location) items.push({ value: location, kind: "plain" });
  if (cv.phone.trim()) items.push({ value: cv.phone.trim(), href: normalizePhoneUrl(cv.phone), kind: "phone" });
  if (cv.email.trim()) items.push({ value: cv.email.trim(), href: `mailto:${cv.email.trim()}`, kind: "email" });

  const profileLinks = (cv.profileLinks ?? []).filter((item) => item && item.url?.trim());
  const linksToRender = profileLinks.length
    ? profileLinks
    : (cv.linkedin.trim() ? [{ id: "legacy-linkedin", label: "LinkedIn", url: cv.linkedin.trim() }] : []);
  linksToRender.forEach((item) => {
    const url = item.url.trim();
    items.push({ value: url, href: normalizeWebUrl(url), kind: "profile", label: item.label.trim() || (cv.cvLanguage === "ar" ? "رابط" : "Website") });
  });
  return items;
}

function contactInlineNodes(
  items: ContactItem[],
  colors: typeof CV_TEMPLATE_DESIGNS[CVTemplate],
  separator = "  |  "
): PdfNode[] {
  const nodes: PdfNode[] = [];
  items.forEach((item, index) => {
    if (index) nodes.push({ text: separator, color: colors.muted });
    nodes.push({
      text: item.value,
      ...(item.href ? { link: item.href } : {}),
      color: item.kind === "profile" ? colors.secondary : colors.muted,
      ...(item.kind === "profile" ? { decoration: "underline" } : {})
    });
  });
  return nodes;
}

function profileLinkInlineNodes(items: ContactItem[], colors: typeof CV_TEMPLATE_DESIGNS[CVTemplate]): PdfNode[] {
  const nodes: PdfNode[] = [];
  items.forEach((item, index) => {
    if (index) nodes.push({ text: "  |  ", color: colors.muted });
    if (item.label) nodes.push({ text: `${item.label}: `, color: colors.muted });
    nodes.push({
      text: item.value,
      ...(item.href ? { link: item.href } : {}),
      color: colors.secondary,
      decoration: "underline"
    });
  });
  return nodes;
}

function addDescriptionBullets(
  content: PdfNode[],
  value: string,
  color: string,
  fontSize: number,
  lineHeight: number,
  indent = 0,
  rtl = false
): void {
  const items = descriptionLines(value);
  if (!items.length) return;
  content.push({
    ul: items.map((item) => ({ text: parseInlineEmphasis(item) })),
    fontSize,
    color,
    margin: rtl ? [0, 2, indent, 6] : [indent, 2, 0, 6],
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

  // All four templates share the same A4 dimensions and page margins.
  const { left: leftMargin, right: rightMargin, top: topMargin, bottom: bottomMargin } = CV_PAGE.marginsPt;
  const pageContentWidth = CV_PAGE.widthPt - leftMargin - rightMargin;
  const line = (margin: number[] = [0, 4, 0, 7], color = colors.rule, width = 0.7): PdfNode => ({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: pageContentWidth, y2: 0, lineWidth: width, lineColor: color }],
    margin
  });

  let sectionCount = 0;
  const sectionHeading = (title: string) => {
    const headingNodes: PdfNode[] = [];

    if (isReference) {
      // Header divider is already drawn once after the profile block.
      // Subsequent sections receive one divider above the heading, never two adjacent rules.
      if (sectionCount > 0) headingNodes.push(line([0, 8, 0, 4], colors.rule, 0.75));
      headingNodes.push({
        text: title,
        fontSize: sectionFontSize,
        bold: true,
        color: colors.primary,
        margin: [0, 0, 0, 5],
        alignment: ar ? "right" : "left"
      });
    } else if (isClassic) {
      headingNodes.push({
        text: title,
        fontSize: sectionFontSize,
        bold: true,
        color: colors.primary,
        characterSpacing: 0.65,
        margin: [0, 9, 0, 2],
        alignment: ar ? "right" : "left"
      });
      headingNodes.push(line([0, 1, 0, 5], colors.rule, 0.7));
    } else if (isContemporary) {
      headingNodes.push({
        table: {
          widths: [4, "*"],
          body: [[
            { text: "", fillColor: colors.secondary, border: [false, false, false, false], margin: [0, 0, 0, 0] },
            {
              text: title,
              bold: true,
              fontSize: sectionFontSize,
              color: colors.primary,
              fillColor: "#EAF4F2",
              margin: [8, 5, 8, 5],
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
        characterSpacing: 0.5,
        margin: [0, 10, 0, 4],
        alignment: ar ? "right" : "left"
      });
      headingNodes.push(line([0, 0, 0, 5], colors.rule, 0.9));
    }

    content.push({ unbreakable: true, stack: headingNodes, margin: [0, 0, 0, 0] });
    sectionCount += 1;
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

    if (isChronological) {
      const dateCell: PdfNode = {
        text: date.trim(),
        fontSize: contactFontSize,
        bold: Boolean(date.trim()),
        color: colors.secondary,
        fillColor: "#EEF2F7",
        alignment: ar ? "right" : "left",
        margin: [5, 4, 5, 4],
        border: [false, false, false, false]
      };
      const railCell: PdfNode = {
        text: "",
        fillColor: colors.secondary,
        margin: [0, 0, 0, 0],
        border: [false, false, false, false]
      };
      const entryCell: PdfNode = {
        stack: leftStack,
        margin: [7, 2, 1, 2],
        border: [false, false, false, false]
      };
      const widths = ar ? ["*", 2.5, 76] : [76, 2.5, "*"];
      const cells = ar ? [entryCell, railCell, dateCell] : [dateCell, railCell, entryCell];
      content.push({
        table: { widths, body: [cells] },
        layout: "noBorders",
        margin: [0, 4, 0, 1]
      });
      return;
    }

    const dateNode: PdfNode = {
      width: "auto",
      text: date.trim(),
      alignment: ar ? "left" : "right",
      color: colors.muted,
      fontSize: bodyFontSize,
      italics: isClassic,
      margin: [0, 0, 0, 0]
    };

    content.push({
      columns: [
        { width: "*", stack: leftStack },
        ...(date.trim() ? [dateNode] : [])
      ],
      columnGap: 12,
      margin: [indent, 3, 0, 2]
    });
  };

  const nameAlignment = design.headerAlignment === "center" ? "center" : (ar ? "right" : "left");
  const header: PdfNode[] = [];
  header.push({
    text: cv.fullName.trim() || (ar ? "الاسم بالكامل" : "Full Name"),
    fontSize: isContemporary ? nameFontSize + 1 : nameFontSize,
    bold: true,
    color: isContemporary ? "#FFFFFF" : colors.name,
    alignment: nameAlignment,
    characterSpacing: isChronological ? 0.35 : 0,
    margin: [0, 0, 0, 2]
  });

  if (cv.targetRole.trim()) {
    header.push({
      text: cv.targetRole.trim(),
      fontSize: targetFontSize,
      italics: isReference,
      bold: isClassic || isContemporary,
      color: isContemporary ? "#D7F0EC" : colors.secondary,
      alignment: nameAlignment,
      margin: [0, 1, 0, 4]
    });
  }

  const panelContactColors = isContemporary
    ? { ...colors, muted: "#F3FAF8", secondary: "#D7F0EC" }
    : colors;

  const primaryContactItems = contactItems.filter((item) => item.kind !== "profile");
  const profileContactItems = contactItems.filter((item) => item.kind === "profile");
  const headerAlignment = isReference ? "center" : nameAlignment;

  if (primaryContactItems.length) {
    header.push({
      text: contactInlineNodes(primaryContactItems, panelContactColors, isContemporary ? "   •   " : "  |  "),
      fontSize: contactFontSize,
      alignment: headerAlignment,
      margin: [0, 4, 0, profileContactItems.length ? 1 : 5]
    });
  }
  if (profileContactItems.length) {
    header.push({
      text: profileLinkInlineNodes(profileContactItems, panelContactColors),
      fontSize: contactFontSize,
      alignment: headerAlignment,
      margin: [0, 1, 0, 5]
    });
  }

  if (isContemporary) {
    content.push({
      table: {
        widths: ["*"],
        body: [[{
          stack: header,
          fillColor: colors.primary,
          margin: [13, 12, 13, 12],
          border: [false, false, false, false]
        }]]
      },
      layout: "noBorders",
      margin: [0, 0, 0, 0]
    });
    content.push(line([0, 0, 0, 6], colors.secondary, 2));
  } else {
    if (isChronological) content.push(line([0, 0, 0, 7], colors.primary, 1.8));
    content.push({ stack: header, margin: [0, 0, 0, 0] });
    if (isReference) content.push(line([0, 8, 0, 4], colors.rule, 0.9));
    if (isClassic) content.push(line([0, 5, 0, 3], colors.primary, 1.25));
    if (isChronological) content.push(line([0, 6, 0, 3], colors.primary, 1));
  }

  if (cv.summary.trim()) {
    sectionHeading(isReference || isClassic ? (ar ? "الملخص المهني" : "PROFESSIONAL SUMMARY") : (ar ? "الملخص المهني" : "PROFILE"));
    content.push({
      text: parseInlineEmphasis(cv.summary.trim()),
      fontSize: bodyFontSize,
      color: colors.body,
      lineHeight: bodyLineHeight,
      margin: [0, 0, 0, 3]
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
    // Degree is emphasized; university/college and dates stay regular in every template.
    addEntryHeader(degree, educationPlace, educationPeriod, { subtitleBold: false });
    const majorAlreadyInDegree = Boolean(cv.qualification.trim() && cv.major.trim() && cv.qualification.toLocaleLowerCase().includes(cv.major.toLocaleLowerCase()));
    const educationDetails = unique([
      cv.major && cv.qualification && !majorAlreadyInDegree ? `${ar ? "التخصص" : "Major"}: ${cv.major}` : "",
      cv.educationStatus === "studying" && yearLevelLabel(cv.yearLevel, cv.cvLanguage) ? `${ar ? "السنة الدراسية" : "Study year"}: ${yearLevelLabel(cv.yearLevel, cv.cvLanguage)}` : "",
      cv.gpa ? `${ar ? "التقدير" : "Grade"}: ${cv.gpa}` : ""
    ]);
    if (educationDetails.length) {
      const indent = isChronological ? 82 : 0;
      content.push({
        ul: educationDetails,
        fontSize: bodyFontSize,
        color: colors.body,
        margin: ar ? [0, 1, indent, 5] : [indent, 1, 0, 5],
        lineHeight: bodyLineHeight
      });
    }
  }

  const order = cv.sectionOrder.filter((id) => cv.selectedSections.includes(id));
  const descriptionIndent = isChronological ? 82 : 0;
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
          { indent: 12, subtitleBold: isReference }
        );
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight, descriptionIndent, ar);
      }
    }

    if (id === "projects") {
      const items = cv.projects.filter((item) => item.name || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "المشاريع" : "PROJECTS");
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
            margin: ar ? [0, 0, descriptionIndent, 5] : [descriptionIndent, 0, 0, 5]
          });
        }
        if (item.tools.trim()) {
          content.push({
            text: [{ text: ar ? "الأدوات والتقنيات: " : "Tools: ", bold: true }, { text: item.tools.trim() }],
            fontSize: bodyFontSize,
            color: colors.body,
            margin: ar ? [0, 1, descriptionIndent, 2] : [descriptionIndent, 1, 0, 2]
          });
        }
        if (item.url.trim()) {
          const url = normalizeWebUrl(item.url);
          const label = /github\.com/i.test(item.url) ? "GitHub: "
            : /vercel\.app|netlify\.app|\.com\/demo/i.test(item.url) ? (ar ? "عرض مباشر: " : "Live Demo: ")
              : (ar ? "الرابط: " : "Link: ");
          content.push({
            text: [
              { text: label, bold: true, color: colors.body },
              { text: item.url.trim(), color: colors.secondary, link: url, decoration: "underline" }
            ],
            fontSize: bodyFontSize,
            margin: ar ? [0, 0, descriptionIndent, 5] : [descriptionIndent, 0, 0, 5]
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
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight, descriptionIndent, ar);
      }
    }

    if (id === "courses") {
      const items = cv.courses.filter((item) => item.name || item.provider || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "الكورسات والشهادات" : "COURSES & CERTIFICATIONS");
      for (const item of items) {
        addEntryHeader(item.name, item.provider, item.date, { indent: 12, subtitleBold: isReference });
        addDescriptionBullets(content, item.description, colors.body, bodyFontSize, bodyLineHeight, descriptionIndent, ar);
        if (item.certificateUrl.trim()) {
          const url = normalizeWebUrl(item.certificateUrl);
          content.push({
            text: [
              { text: ar ? "الشهادة: " : "Certificate: ", bold: true, color: colors.body },
              { text: item.certificateUrl.trim(), color: colors.secondary, link: url, decoration: "underline" }
            ],
            fontSize: bodyFontSize,
            margin: ar ? [0, 0, descriptionIndent, 4] : [descriptionIndent, 0, 0, 4]
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
        if (isContemporary) {
          content.push({
            columns: [
              { width: 94, text: label, fontSize: bodyFontSize, bold: true, color: colors.primary, alignment: ar ? "right" : "left" },
              { width: "*", text: values.join("  •  "), fontSize: bodyFontSize, color: colors.body, alignment: ar ? "right" : "left" }
            ],
            columnGap: 8,
            margin: [0, 3, 0, 5]
          });
        } else {
          content.push({ text: label, fontSize: bodyFontSize, bold: true, color: colors.body, margin: [descriptionIndent, 3, 0, 1] });
          content.push({
            ul: values,
            fontSize: bodyFontSize,
            color: colors.body,
            margin: ar ? [0, 0, descriptionIndent, 4] : [descriptionIndent, 0, 0, 4],
            lineHeight: bodyLineHeight
          });
        }
      };

      addSkillGroup(ar ? "المهارات الأساسية" : "Core Skills", skills);
      addSkillGroup(ar ? "الأدوات والمنصات" : "Tools & Platforms", tools);
      addSkillGroup(ar ? "اللغات" : "Languages", languages);
    }
  }

  return {
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
