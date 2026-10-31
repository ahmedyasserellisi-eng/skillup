type SectionId = "experience" | "projects" | "activities" | "courses" | "skills";
type CVTemplate = "reference" | "signature" | "executive";
type EducationStatus = "studying" | "graduated";

type Experience = {
  id: string; kind: string; role: string; organization: string; period: string; location: string; description: string;
};
type Project = {
  id: string; name: string; kind: string; role: string; date: string; tools: string; url: string; description: string;
};
type Activity = {
  id: string; organization: string; role: string; period: string; description: string;
};
type Course = {
  id: string; name: string; provider: string; date: string; certificateUrl: string;
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
          // The font bundle must be ready even if pdfMake was already added by another script.
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

function buildPdfDefinition(cv: CVExportData): Record<string, unknown> {
  const ar = cv.cvLanguage === "ar";
  const template = cv.template ?? "reference";
  const colors = template === "reference"
    ? { primary: "#24466F", secondary: "#4D83C5", rule: "#AFC3DE", body: "#222831", muted: "#5C6470" }
    : template === "signature"
      ? { primary: "#182B36", secondary: "#8A6D1F", rule: "#C8A448", body: "#20252B", muted: "#596574" }
      : { primary: "#20252B", secondary: "#515B66", rule: "#AAB1B8", body: "#252A30", muted: "#68717B" };
  const font = ar ? "Cairo" : "Roboto";
  const content: PdfNode[] = [];
  // Match the intentional white space used by the on-screen A4 preview.
  const horizontalMargin = template === "executive" ? 34.5 : 42;
  const verticalMargin = template === "executive" ? 28.5 : 36;
  const pageContentWidth = 595.28 - horizontalMargin * 2;

  const line = (margin: number[] = [0, 4, 0, 7], color = colors.rule, width = 0.8): PdfNode => ({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: pageContentWidth, y2: 0, lineWidth: width, lineColor: color }],
    margin
  });

  const sectionHeading = (title: string) => {
    if (template === "reference") content.push(line([0, 11, 0, 4], colors.rule, 0.8));
    content.push({ text: title, fontSize: template === "executive" ? 10.5 : 10.8, bold: true, color: colors.primary, characterSpacing: template === "executive" ? 0.5 : 0.1, margin: [0, template === "reference" ? 0 : 13, 0, 5], alignment: ar ? "right" : "left" });
    if (template !== "reference") content.push(line([0, 0, 0, 6], colors.rule, template === "signature" ? 0.7 : 0.45));
  };

  const addBullets = (value: string) => {
    const items = descriptionLines(value);
    if (items.length) content.push({ ul: items, fontSize: 9.4, color: colors.body, margin: [0, 2, 0, 7], lineHeight: 1.2 });
  };

  const addEntryHeader = (title: string, subtitle: string, date: string) => {
    const leftStack: PdfNode[] = [];
    if (title.trim()) leftStack.push({ text: title.trim(), bold: true, fontSize: 10.1, color: colors.body, margin: [0, 0, 0, 1] });
    if (subtitle.trim()) leftStack.push({ text: subtitle.trim(), fontSize: 9.2, bold: template === "reference", color: template === "reference" ? colors.body : colors.muted, margin: [0, 0, 0, 1] });
    if (!leftStack.length && !date.trim()) return;
    content.push({
      columns: [
        { width: "*", stack: leftStack },
        ...(date.trim() ? [{ width: "auto", text: date.trim(), alignment: "right", color: colors.muted, fontSize: 8.8, margin: [0, 1, 0, 0] }] : [])
      ],
      columnGap: 12,
      margin: [0, 3, 0, 2]
    });
  };

  const contact = [cv.city, cv.phone, cv.email, cv.linkedin].filter(Boolean).join("  |  ");
  const nameAlignment = template === "reference" ? "center" : (ar ? "right" : "left");
  const header: PdfNode[] = [];
  header.push({ text: cv.fullName.trim() || (ar ? "الاسم بالكامل" : "Full Name"), fontSize: template === "executive" ? 25 : 27, bold: true, color: colors.primary, alignment: nameAlignment, margin: [0, 0, 0, 3] });
  if (cv.targetRole.trim()) header.push({ text: cv.targetRole.trim(), fontSize: 11.5, italics: template === "reference", bold: template !== "reference", color: colors.secondary, alignment: nameAlignment, margin: [0, 0, 0, 5] });
  if (contact) header.push({ text: contact, fontSize: 8.4, color: colors.muted, alignment: template === "reference" ? "center" : (ar ? "right" : "left"), margin: [0, 3, 0, 2] });
  content.push({ stack: header, margin: [0, 0, 0, 0] });
  content.push(line([0, template === "reference" ? 17 : 11, 0, 3], colors.rule, template === "signature" ? 2 : 0.9));

  if (cv.summary.trim()) {
    sectionHeading(ar ? "الملخص المهني" : "PROFESSIONAL SUMMARY");
    content.push({ text: cv.summary.trim(), fontSize: 9.4, color: colors.body, lineHeight: 1.3, margin: [0, 0, 0, 1] });
  }

  const educationTitle = ar ? "التعليم" : "EDUCATION";
  const degree = cv.qualification.trim() || cv.major.trim();
  const educationPlace = unique([cv.university, cv.college]).join(" · ");
  const educationPeriod = cv.startYear
    ? `${cv.startYear} – ${cv.graduationYear || (cv.educationStatus === "studying" ? (ar ? "حتى الآن" : "Present") : "")}`.trim()
    : cv.graduationYear
      ? `${ar ? (cv.educationStatus === "studying" ? "التخرج المتوقع" : "سنة التخرج") : (cv.educationStatus === "studying" ? "Expected graduation" : "Graduation")}: ${cv.graduationYear}`
      : "";
  if (degree || educationPlace || cv.gpa || cv.yearLevel || educationPeriod) {
    sectionHeading(educationTitle);
    addEntryHeader(degree, educationPlace, educationPeriod);
    const majorAlreadyInDegree = Boolean(cv.qualification.trim() && cv.major.trim() && cv.qualification.toLocaleLowerCase().includes(cv.major.toLocaleLowerCase()));
    const educationDetails = unique([
      cv.major && cv.qualification && !majorAlreadyInDegree ? `${ar ? "التخصص" : "Major"}: ${cv.major}` : "",
      cv.educationStatus === "studying" && cv.yearLevel ? `${ar ? "السنة الدراسية" : "Study year"}: ${cv.yearLevel}` : "",
      cv.gpa ? `${ar ? "التقدير" : "Grade"}: ${cv.gpa}` : ""
    ]);
    if (educationDetails.length) content.push({ ul: educationDetails, fontSize: 9, color: colors.body, margin: [0, 1, 0, 4] });
  }

  const order = cv.sectionOrder.filter((id) => cv.selectedSections.includes(id));
  for (const id of order) {
    if (id === "experience") {
      const items = cv.experiences.filter((item) => item.role || item.organization || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "الخبرات العملية والتدريب" : "PROFESSIONAL EXPERIENCE");
      for (const item of items) {
        addEntryHeader(item.role || item.kind, unique([item.organization, item.location]).join(" · "), item.period);
        addBullets(item.description);
      }
    }
    if (id === "projects") {
      const items = cv.projects.filter((item) => item.name || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "المشاريع" : "PROJECTS");
      for (const item of items) {
        addEntryHeader(item.name, unique([item.role, item.kind]).join(" · "), item.date);
        addBullets(item.description);
        if (item.tools.trim()) content.push({ text: [{ text: ar ? "الأدوات والتقنيات: " : "Tools: ", bold: true }, { text: item.tools.trim() }], fontSize: 8.8, color: colors.body, margin: [0, 1, 0, 2] });
        if (item.url.trim()) content.push({ text: item.url.trim(), fontSize: 8.5, color: colors.secondary, link: item.url.trim(), margin: [0, 0, 0, 5] });
      }
    }
    if (id === "activities") {
      const items = cv.activities.filter((item) => item.organization || item.role || item.description);
      if (!items.length) continue;
      sectionHeading(ar ? "القيادة والتطوع والأنشطة" : "LEADERSHIP & VOLUNTEERING");
      for (const item of items) {
        addEntryHeader(item.role || item.organization, item.role && item.organization ? item.organization : "", item.period);
        addBullets(item.description);
      }
    }
    if (id === "courses") {
      const items = cv.courses.filter((item) => item.name || item.provider);
      if (!items.length) continue;
      sectionHeading(ar ? "الكورسات والشهادات" : "COURSES & CERTIFICATIONS");
      for (const item of items) {
        addEntryHeader(item.name, item.provider, item.date);
        if (item.certificateUrl.trim()) content.push({ text: item.certificateUrl.trim(), fontSize: 8.5, color: colors.secondary, link: item.certificateUrl.trim(), margin: [0, 0, 0, 4] });
      }
    }
    if (id === "skills") {
      const skills = listText(cv.skills);
      const tools = listText(cv.tools);
      const languages = listText(cv.languages);
      if (!skills.length && !tools.length && !languages.length) continue;
      sectionHeading(ar ? "المهارات" : "SKILLS");
      if (skills.length) content.push({ text: skills.join("  ·  "), fontSize: 9.2, color: colors.body, margin: [0, 0, 0, 3] });
      if (tools.length) content.push({ text: [{ text: ar ? "الأدوات والتقنيات: " : "Tools & Technologies: ", bold: true }, { text: tools.join("  ·  ") }], fontSize: 9.1, color: colors.body, margin: [0, 1, 0, 3] });
      if (languages.length) content.push({ text: [{ text: ar ? "اللغات: " : "Languages: ", bold: true }, { text: languages.join("  ·  ") }], fontSize: 9.1, color: colors.body, margin: [0, 1, 0, 3] });
    }
  }

  return {
    pageSize: "A4",
    pageMargins: [horizontalMargin, verticalMargin, horizontalMargin, verticalMargin],
    rtl: ar,
    info: {
      title: `${cv.fullName.trim() || "CV"} - SkillUp CV`,
      subject: "Professional CV",
      creator: "SkillUp CV Builder"
    },
    defaultStyle: { font, fontSize: 9.4, color: colors.body, lineHeight: 1.25 },
    content
  };
}

export async function downloadCvPdf(cv: CVExportData): Promise<void> {
  const pdfMake = await getPdfMake();
  const definition = buildPdfDefinition(cv);
  const safeName = cv.fullName.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "SkillUp_CV";
  pdfMake.createPdf(definition).download(`${safeName}_CV.pdf`);
}
