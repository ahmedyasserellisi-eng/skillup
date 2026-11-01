"use client";

import type { CSSProperties } from "react";
import {
  CV_PAGE,
  CV_TEMPLATE_DESIGNS,
  CV_TYPOGRAPHY,
  sortExperiencesByDate,
  experienceKindLabel,
  experiencePeriodLabel,
  projectKindLabel,
  yearLevelLabel,
  type CVData,
  type CVTemplate
} from "./cv-types";

export { CV_TEMPLATE_OPTIONS } from "./cv-types";


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
  return value.split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•▪◦‣]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

function normalizeWebUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(?:https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function CVDescription({ value }: { value: string }) {
  const lines = descriptionLines(value);
  if (!lines.length) return null;
  return <ul className="cv-bullets">{lines.map((line, index) => <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>)}</ul>;
}

export function CVDocumentStyles() {
  return (
    <style jsx global>{`
      .cv-document { color: var(--cv-body); background: #fff; overflow-wrap: anywhere; font-size: var(--cv-body-size); line-height: var(--cv-line-height); }
      .cv-document .cv-document-header { border-bottom: 1px solid var(--cv-rule); padding-bottom: 14px; margin-bottom: 15px; text-align: start; }
      .cv-document .cv-name { margin: 0; color: var(--cv-primary); font-size: var(--cv-name-size); line-height: 1.12; font-weight: 800; letter-spacing: 0; }
      .cv-document .cv-target-role { margin: 4px 0 0; color: var(--cv-secondary); font-size: var(--cv-target-size); line-height: 1.12; font-weight: 600; }
      .cv-document .cv-contact { margin: 9px 0 0; color: var(--cv-muted); font-size: var(--cv-contact-size); line-height: 1.2; display: flex; flex-wrap: wrap; column-gap: 4px; row-gap: 2px; }
      .cv-document .cv-section { margin-top: 14px; break-inside: auto; }
      .cv-document .cv-section h2 { margin: 0 0 7px; padding-bottom: 4px; border-bottom: 1px solid var(--cv-rule); color: var(--cv-primary); font-size: var(--cv-section-size); line-height: 1.15; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }
      .cv-document .cv-section p { margin-top: 0; font-size: var(--cv-body-size); line-height: var(--cv-line-height); }
      .cv-document .cv-summary-text { margin: 0; }
      .cv-document .cv-education-layout { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
      .cv-document .cv-entry-title { margin: 0; font-size: var(--cv-body-size); line-height: 1.15; font-weight: 800; color: var(--cv-body); }
      .cv-document .cv-muted-line { margin: 2px 0 0; color: var(--cv-muted); font-size: var(--cv-body-size); }
      .cv-document .cv-education-meta { flex: 0 0 auto; text-align: end; color: var(--cv-muted); font-size: var(--cv-body-size); line-height: var(--cv-line-height); }
      .cv-document .cv-education-meta p { margin: 0; font-size: var(--cv-body-size); line-height: var(--cv-line-height); }
      .cv-document .cv-entry { margin: 0 0 11px; margin-inline-start: 16px; break-inside: avoid; page-break-inside: avoid; }
      .cv-document .cv-entry-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
      .cv-document .cv-entry-date { margin: 0; flex: 0 0 auto; color: var(--cv-muted); font-size: var(--cv-body-size) !important; white-space: nowrap; }
      .cv-document .cv-entry-subtitle { margin: 2px 0 0; color: var(--cv-body); font-size: var(--cv-body-size) !important; font-weight: 700; }
      .cv-document .cv-entry-detail { margin: 4px 0 0; font-size: var(--cv-body-size) !important; line-height: var(--cv-line-height); }
      .cv-document .cv-entry-link { margin: 4px 0 0; color: var(--cv-secondary); font-size: var(--cv-body-size) !important; line-height: var(--cv-line-height); }
      .cv-document .cv-bullets { margin: 3px 0 0; padding-inline-start: 20px; list-style: disc; }
      .cv-document .cv-bullets li { margin: 1px 0; padding-inline-start: 2px; font-size: var(--cv-body-size); line-height: var(--cv-line-height); }
      .cv-document .cv-skill-block { margin: 0 0 5px; }
      .cv-document .cv-skill-label { margin: 0 0 1px !important; font-size: var(--cv-body-size) !important; font-weight: 700; }
      .cv-document a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
      .cv-document a:hover { color: var(--cv-secondary); }
      .cv-template-reference .cv-document-header { text-align: center; padding-bottom: 14px; }
      .cv-template-reference .cv-contact { justify-content: center; }
      .cv-template-reference .cv-section h2 { border: 0; border-top: 1px solid var(--cv-rule); padding: 7px 0 0; margin-bottom: 7px; }
      .cv-template-classic .cv-document-header { border-bottom: 2px solid var(--cv-primary); padding-bottom: 16px; }
      .cv-template-classic .cv-section h2 { border-bottom: 1px solid var(--cv-primary); letter-spacing: .04em; }
      .cv-template-classic .cv-name { letter-spacing: .01em; }
      .cv-template-contemporary .cv-document-header { border-bottom: 2px solid var(--cv-secondary); border-inline-start: 4px solid var(--cv-secondary); padding: 3px 14px 9px; margin-bottom: 16px; }
      .cv-template-contemporary .cv-name { font-weight: 850; }
      .cv-template-contemporary .cv-section h2 { border-bottom: 0; border-inline-start: 3px solid var(--cv-secondary); padding: 2px 10px 3px; background: #F1F7F6; }
      .cv-template-contemporary .cv-entry { margin-inline-start: 12px; }
      .cv-template-chronological .cv-document-header { text-align: center; border-bottom: 1px solid var(--cv-primary); padding-bottom: 13px; }
      .cv-template-chronological .cv-contact { justify-content: center; }
      .cv-template-chronological .cv-name { font-weight: 800; letter-spacing: .035em; }
      .cv-template-chronological .cv-section h2 { border-bottom: 1px solid var(--cv-primary); padding-bottom: 3px; letter-spacing: .075em; }
      .cv-document[lang="ar"] .cv-section h2 { line-height: 1.2; }
      @media (max-width: 640px) {
        .cv-document .cv-entry-heading { gap: 8px; }
        .cv-document .cv-entry-date { white-space: normal; text-align: end; }
      }
    `}</style>
  );
}

export function CVDocument({ cv }: { cv: CVData }) {
  const ar = cv.cvLanguage === "ar";
  const template = cv.template ?? "reference";
  const design = CV_TEMPLATE_DESIGNS[template];
  const typography = CV_TYPOGRAPHY[cv.cvLanguage];
  const cssPx = (pt: number) => `${(pt * 96) / 72}px`;
  const documentStyle = {
    width: CV_PAGE.widthPx,
    minHeight: CV_PAGE.heightPx,
    boxSizing: "border-box",
    padding: `${CV_PAGE.marginsPx.top}px ${CV_PAGE.marginsPx.right}px ${CV_PAGE.marginsPx.bottom}px ${CV_PAGE.marginsPx.left}px`,
    // Match pdfMake's embedded font families: Cairo for Arabic and Roboto for English.
    fontFamily: ar ? "Cairo, Arial, 'Segoe UI', Tahoma, sans-serif" : "Roboto, Arial, 'Segoe UI', Tahoma, sans-serif",
    "--cv-primary": design.primary,
    "--cv-secondary": design.secondary,
    "--cv-rule": design.rule,
    "--cv-body": design.body,
    "--cv-muted": design.muted,
    "--cv-body-size": cssPx(typography.bodyPt),
    "--cv-section-size": cssPx(typography.sectionPt),
    "--cv-name-size": cssPx(typography.namePt),
    "--cv-target-size": cssPx(typography.targetPt),
    "--cv-contact-size": cssPx(typography.contactPt),
    "--cv-line-height": typography.lineHeight
  } as CSSProperties;

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
    gpa: ar ? "التقدير" : "Grade"
  };
  const contact = [cv.city, cv.phone, cv.email, cv.linkedin].filter(Boolean);
  const experiences = cv.experienceSortMode === "newest"
    ? sortExperiencesByDate(cv.experiences)
    : cv.experiences;
  const projects = cv.projects.filter((item) => item.name || item.description);
  const activities = cv.activities.filter((item) => item.organization || item.role || item.description);
  const courses = cv.courses.filter((item) => item.name || item.provider || item.description);
  const skills = listText(cv.skills);
  const tools = listText(cv.tools);
  const languages = listText(cv.languages);
  const degreeLine = cv.qualification.trim() || cv.major.trim();
  const majorIsAlreadyInDegree = Boolean(cv.qualification.trim() && cv.major.trim() && cv.qualification.toLocaleLowerCase().includes(cv.major.toLocaleLowerCase()));
  const educationPlace = uniqueText([cv.university, cv.college]).join(" · ");
  const educationLines = uniqueText([degreeLine, educationPlace]);
  const educationDetails = uniqueText([
    cv.qualification.trim() && cv.major.trim() && !majorIsAlreadyInDegree ? `${ar ? "التخصص" : "Major"}: ${cv.major}` : "",
    cv.educationStatus === "studying" && yearLevelLabel(cv.yearLevel, cv.cvLanguage) ? `${t.studyYear}: ${yearLevelLabel(cv.yearLevel, cv.cvLanguage)}` : "",
    cv.gpa ? `${t.gpa}: ${cv.gpa}` : ""
  ]);
  const hasEducation = educationLines.length > 0 || educationDetails.length > 0 || Boolean(cv.startYear || cv.graduationYear);

  return (
    <article className={`cv-document cv-template-${template} mx-auto bg-white`} dir={ar ? "rtl" : "ltr"} lang={cv.cvLanguage} style={documentStyle}>
      <header className="cv-document-header">
        <h1 className="cv-name">{cv.fullName || (ar ? "الاسم بالكامل" : "Full Name")}</h1>
        {cv.targetRole ? <p className="cv-target-role">{cv.targetRole}</p> : null}
        {contact.length ? (
          <p className="cv-contact" dir="ltr">
            {contact.map((value, index) => {
              const href = value === cv.email
                ? `mailto:${cv.email.trim()}`
                : value === cv.phone
                  ? `tel:${cv.phone.trim().replace(/[^\d+]/g, "")}`
                  : value === cv.linkedin ? normalizeWebUrl(cv.linkedin) : "";
              return <span key={`${value}-${index}`}>{href ? <a href={href} target={value === cv.linkedin ? "_blank" : undefined} rel={value === cv.linkedin ? "noreferrer" : undefined}>{value}</a> : value}{index < contact.length - 1 ? "  |  " : ""}</span>;
            })}
          </p>
        ) : null}
      </header>

      {cv.summary.trim() ? <section className="cv-section"><h2>{t.summary}</h2><p className="cv-summary-text">{cv.summary.trim()}</p></section> : null}

      {hasEducation ? (
        <section className="cv-section">
          <h2>{t.education}</h2>
          <div className="cv-education-layout">
            <div className="cv-education-details">
              {educationLines.map((line, index) => <p key={`${line}-${index}`} className={index === 0 ? "cv-entry-title" : "cv-muted-line"}>{line}</p>)}
              {educationDetails.length ? <ul className="cv-bullets">{educationDetails.map((line, index) => <li key={`education-${index}`}>{line}</li>)}</ul> : null}
            </div>
            <div className="cv-education-meta">
              {cv.startYear ? <p>{cv.startYear}{cv.graduationYear ? ` – ${cv.graduationYear}` : cv.educationStatus === "studying" ? ` – ${t.present}` : ""}</p> : null}
              {!cv.startYear && cv.graduationYear ? <p>{cv.educationStatus === "graduated" ? t.graduated : t.expected}: {cv.graduationYear}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {cv.sectionOrder.filter((id) => cv.selectedSections.includes(id)).map((sectionId) => {
        if (sectionId === "experience" && experiences.some((item) => item.role || item.organization || item.description)) {
          return <section className="cv-section" key={sectionId}>
            <h2>{t.experience}</h2>
            {experiences.filter((item) => item.role || item.organization || item.description).map((item) => <div className="cv-entry" key={item.id}>
              <div className="cv-entry-heading"><p className="cv-entry-title">{item.role || experienceKindLabel(item.kind, cv.cvLanguage)}</p>{experiencePeriodLabel(item, cv.cvLanguage) ? <p className="cv-entry-date">{experiencePeriodLabel(item, cv.cvLanguage)}</p> : null}</div>
              {item.organization || item.location ? <p className="cv-entry-subtitle">{[item.organization, item.location].filter(Boolean).join(" · ")}</p> : null}
              <CVDescription value={item.description} />
            </div>)}
          </section>;
        }
        if (sectionId === "projects" && projects.length) {
          return <section className="cv-section" key={sectionId}><h2>{t.projects}</h2>
            {projects.map((item) => <div className="cv-entry" key={item.id}>
              <div className="cv-entry-heading"><p className="cv-entry-title">{item.name}</p>{item.date ? <p className="cv-entry-date">{item.date}</p> : null}</div>
              {item.role || item.kind ? <p className="cv-entry-subtitle">{[item.role, projectKindLabel(item.kind, cv.cvLanguage)].filter(Boolean).join(" · ")}</p> : null}
              <CVDescription value={item.description} />
              {item.tools ? <p className="cv-entry-detail"><strong>{t.tools}: </strong>{item.tools}</p> : null}
              {item.url ? <p className="cv-entry-link" dir="ltr"><a href={normalizeWebUrl(item.url)} target="_blank" rel="noreferrer">{item.url}</a></p> : null}
            </div>)}
          </section>;
        }
        if (sectionId === "activities" && activities.length) {
          return <section className="cv-section" key={sectionId}><h2>{t.activities}</h2>
            {activities.map((item) => <div className="cv-entry" key={item.id}>
              <div className="cv-entry-heading"><p className="cv-entry-title">{item.role || item.organization}</p>{item.period ? <p className="cv-entry-date">{item.period}</p> : null}</div>
              {item.organization && item.role ? <p className="cv-entry-subtitle">{item.organization}</p> : null}
              <CVDescription value={item.description} />
            </div>)}
          </section>;
        }
        if (sectionId === "courses" && courses.length) {
          return <section className="cv-section" key={sectionId}><h2>{t.courses}</h2>
            {courses.map((item) => <div className="cv-entry" key={item.id}>
              <div className="cv-entry-heading"><p className="cv-entry-title">{item.name}</p>{item.date ? <p className="cv-entry-date">{item.date}</p> : null}</div>
              {item.provider ? <p className="cv-entry-subtitle">{item.provider}</p> : null}
              <CVDescription value={item.description} />
              {item.certificateUrl ? <p className="cv-entry-link" dir="ltr"><a href={normalizeWebUrl(item.certificateUrl)} target="_blank" rel="noreferrer">{item.certificateUrl}</a></p> : null}
            </div>)}
          </section>;
        }
        if (sectionId === "skills" && (skills.length || tools.length || languages.length)) {
          return <section className="cv-section" key={sectionId}><h2>{t.skills}</h2>
            {skills.length ? <div className="cv-skill-block"><p className="cv-skill-label">{ar ? "المهارات الأساسية" : "Core Skills"}</p><ul className="cv-bullets">{skills.map((item, index) => <li key={`skill-${index}`}>{item}</li>)}</ul></div> : null}
            {tools.length ? <div className="cv-skill-block"><p className="cv-skill-label">{t.tools}</p><ul className="cv-bullets">{tools.map((item, index) => <li key={`tool-${index}`}>{item}</li>)}</ul></div> : null}
            {languages.length ? <div className="cv-skill-block"><p className="cv-skill-label">{t.languages}</p><ul className="cv-bullets">{languages.map((item, index) => <li key={`language-${index}`}>{item}</li>)}</ul></div> : null}
          </section>;
        }
        return null;
      })}
    </article>
  );
}

export function TemplateThumbnail({ template, isAr }: { template: CVTemplate; isAr: boolean }) {
  const design = CV_TEMPLATE_DESIGNS[template];
  const align = design.headerAlignment === "center" ? "text-center" : isAr ? "text-right" : "text-left";
  const headings = isAr ? ["الملخص المهني", "التعليم", "الخبرات العملية", "المهارات"] : ["PROFESSIONAL SUMMARY", "EDUCATION", "EXPERIENCE", "SKILLS"];
  return (
    <div className="h-56 overflow-hidden rounded-xl border border-zinc-200 bg-[#eef1f4] p-3 dark:border-zinc-700">
      <div className="mx-auto h-full max-w-[190px] overflow-hidden bg-white px-3 py-3.5 shadow-sm" style={{ color: design.body, fontFamily: isAr ? "Cairo, Arial, sans-serif" : "Roboto, Arial, sans-serif" }}>
        <header className={align} style={{ borderBottom: `1px solid ${design.rule}`, borderInlineStart: template === "contemporary" ? `3px solid ${design.secondary}` : undefined, paddingBottom: 7, paddingInlineStart: template === "contemporary" ? 6 : 0 }}>
          <div className="truncate font-extrabold" style={{ color: design.primary, fontSize: 8.5, lineHeight: 1.25 }}>{isAr ? "اسمك بالكامل" : "YOUR NAME"}</div>
          <div className="mt-1 truncate font-semibold" style={{ color: design.secondary, fontSize: 5.5 }}>{isAr ? "المسمى الوظيفي المستهدف" : "TARGET JOB TITLE"}</div>
          <div className={`mt-2 flex flex-wrap gap-x-1 gap-y-0.5 text-[4px] text-slate-500 ${design.headerAlignment === "center" ? "justify-center" : ""}`}><span>email@example.com</span><span>•</span><span>+20 000</span><span>•</span><span>Cairo</span></div>
        </header>
        {headings.map((heading, index) => <section key={heading} className="mt-2">
          <div className="mb-1 truncate font-extrabold" style={{ color: design.primary, fontSize: 5.2, letterSpacing: template === "chronological" ? ".4px" : 0, borderBottom: template === "reference" ? "none" : `1px solid ${design.rule}`, borderTop: template === "reference" ? `1px solid ${design.rule}` : "none", borderInlineStart: template === "contemporary" ? `2px solid ${design.secondary}` : "none", padding: template === "reference" ? "3px 0 0" : template === "contemporary" ? "0 0 1px 4px" : "0 0 2px" }}>{heading}</div>
          <div className="space-y-[3px]"><div className="flex items-center justify-between gap-1"><div className="h-[3px] w-2/5 rounded-sm" style={{ background: design.secondary, opacity: .75 }} />{index > 0 ? <div className="h-[2px] w-1/5 rounded-sm bg-slate-300" /> : null}</div><div className="h-[2.5px] w-full rounded-sm bg-slate-200" /><div className="h-[2.5px] w-10/12 rounded-sm bg-slate-200" />{index === 2 ? <div className="ml-2 h-[2px] w-9/12 rounded-sm bg-slate-200" /> : null}</div>
        </section>)}
      </div>
    </div>
  );
}
