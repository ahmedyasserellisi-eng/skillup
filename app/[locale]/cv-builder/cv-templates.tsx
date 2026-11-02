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
      .cv-document .cv-document-header { border-bottom: 0; padding-bottom: 10px; margin-bottom: 0; text-align: start; }
      .cv-document .cv-name { margin: 0; color: var(--cv-name); font-size: var(--cv-name-size); line-height: 1.12; font-weight: 800; letter-spacing: 0; }
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
      .cv-document .cv-entry-subtitle { margin: 2px 0 0; color: var(--cv-body); font-size: var(--cv-body-size) !important; font-weight: 400; }
      .cv-document .cv-entry-detail { margin: 4px 0 0; font-size: var(--cv-body-size) !important; line-height: var(--cv-line-height); }
      .cv-document .cv-entry-link { margin: 4px 0 0; color: var(--cv-secondary); font-size: var(--cv-body-size) !important; line-height: var(--cv-line-height); }
      .cv-document .cv-bullets { margin: 3px 0 0; padding-inline-start: 20px; list-style: disc; }
      .cv-document .cv-bullets li { margin: 1px 0; padding-inline-start: 2px; font-size: var(--cv-body-size); line-height: var(--cv-line-height); }
      .cv-document .cv-skill-block { margin: 0 0 5px; }
      .cv-document .cv-skill-label { margin: 0 0 1px !important; font-size: var(--cv-body-size) !important; font-weight: 700; }
      .cv-document a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
      .cv-document a:hover { color: var(--cv-secondary); }
      .cv-template-reference .cv-document-header { text-align: center; border-bottom: 1px solid var(--cv-rule); padding-bottom: 10px; }
      .cv-template-reference .cv-contact { justify-content: center; }
      .cv-template-reference .cv-linkedin { margin-top: 2px; }
      .cv-template-reference .cv-entry-subtitle { font-weight: 700; }
      .cv-template-reference .cv-section h2 { border: 0; padding: 0; margin-bottom: 7px; }
      .cv-template-reference .cv-section + .cv-section h2 { border-top: 1px solid var(--cv-rule); padding-top: 7px; }
      .cv-template-classic .cv-document-header { border-bottom: 2px solid var(--cv-primary); padding-bottom: 14px; margin-bottom: 5px; }
      .cv-template-classic .cv-section h2 { border-top: 0; border-bottom: 1px solid var(--cv-primary); padding: 0 0 4px; letter-spacing: .055em; }
      .cv-template-classic .cv-name { letter-spacing: .01em; }
      .cv-template-contemporary .cv-document-header { border-inline-start: 4px solid var(--cv-secondary); background: var(--cv-primary); color: #fff; padding: 12px 14px; margin-bottom: 8px; }
      .cv-template-contemporary .cv-name { color: #fff; }
      .cv-template-contemporary .cv-target-role, .cv-template-contemporary .cv-contact { color: #D7F0EC; }
      .cv-template-contemporary .cv-name { font-weight: 850; }
      .cv-template-contemporary .cv-section h2 { border: 0; border-inline-start: 3px solid var(--cv-secondary); padding: 5px 10px; background: #EDF6F4; }
      .cv-template-contemporary .cv-entry { margin-inline-start: 12px; }
      .cv-template-chronological .cv-document-header { text-align: start; border-top: 3px solid var(--cv-primary); border-bottom: 1px solid var(--cv-rule); padding: 9px 0 12px; margin-bottom: 6px; }
      .cv-template-chronological .cv-name { font-weight: 800; letter-spacing: .035em; }
      .cv-template-chronological .cv-section h2 { border-top: 0; border-bottom: 1px solid var(--cv-primary); padding: 0 0 4px; letter-spacing: .075em; }
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
    "--cv-name": design.name,
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
  const contact = [cv.city, cv.phone, cv.email, ...(template === "reference" ? [] : [cv.linkedin])].filter(Boolean);
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
        {template === "reference" && cv.linkedin ? (
          <p className="cv-contact cv-linkedin" dir="ltr">
            LinkedIn: <a href={normalizeWebUrl(cv.linkedin)} target="_blank" rel="noreferrer">{cv.linkedin}</a>
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
  const headings = isAr ? ["الملخص المهني", "التعليم", "الخبرات العملية", "المهارات"] : ["PROFESSIONAL SUMMARY", "EDUCATION", "EXPERIENCE", "SKILLS"];
  const isReference = template === "reference";
  const isClassic = template === "classic";
  const isContemporary = template === "contemporary";
  const isChronological = template === "chronological";

  const headerStyle: CSSProperties = isReference
    ? { textAlign: "center", borderBottom: `1px solid ${design.rule}`, paddingBottom: 7 }
    : isClassic
      ? { textAlign: isAr ? "right" : "left", borderBottom: `2px solid ${design.primary}`, paddingBottom: 8 }
      : isContemporary
        ? { textAlign: isAr ? "right" : "left", background: design.primary, color: "#fff", padding: "9px 8px", borderRadius: 3 }
        : { textAlign: isAr ? "right" : "left", borderTop: `3px solid ${design.primary}`, borderBottom: `1px solid ${design.rule}`, padding: "7px 0" };

  const headingStyle = (index: number): CSSProperties => {
    if (isReference) return { borderTop: index === 0 ? 0 : `1px solid ${design.rule}`, paddingTop: index === 0 ? 0 : 3 };
    if (isClassic) return { borderBottom: `1px solid ${design.rule}`, paddingBottom: 3, letterSpacing: ".35px" };
    if (isContemporary) return { background: "#EAF4F2", borderInlineStart: `3px solid ${design.secondary}`, padding: "3px 5px", borderRadius: 2 };
    return { borderBottom: `1px solid ${design.rule}`, borderInlineStart: `2px solid ${design.secondary}`, padding: "2px 4px", letterSpacing: ".25px" };
  };

  return (
    <div className="h-56 overflow-hidden rounded-xl border border-zinc-200 bg-[#eef1f4] p-3 dark:border-zinc-700">
      <div className="mx-auto h-full max-w-[190px] overflow-hidden bg-white px-3 py-3.5 shadow-sm" style={{ color: design.body, fontFamily: isAr ? "Cairo, Arial, sans-serif" : "Roboto, Arial, sans-serif" }}>
        <header style={headerStyle}>
          {isChronological ? <div className="mb-1 h-[2px] w-9" style={{ background: design.secondary }} /> : null}
          <div className="truncate font-extrabold" style={{ color: isContemporary ? "#FFFFFF" : design.name, fontSize: isContemporary ? 9.2 : 8.5, lineHeight: 1.25 }}> {isAr ? "اسمك بالكامل" : "YOUR NAME"}</div>
          <div className={`mt-1 truncate ${isReference ? "italic" : "font-semibold"}`} style={{ color: isContemporary ? "#D7F0EC" : design.secondary, fontSize: 5.5 }}>{isAr ? "المسمى الوظيفي المستهدف" : "TARGET JOB TITLE"}</div>
          <div className={`mt-2 flex flex-wrap gap-x-1 gap-y-0.5 text-[4px] ${isReference ? "justify-center" : ""}`} style={{ color: isContemporary ? "#F3FAF8" : design.muted }}>
            <span>email@example.com</span><span>{isContemporary ? "•" : "|"}</span><span>+20 000</span><span>{isContemporary ? "•" : "|"}</span><span>Cairo</span>
          </div>
          {isReference ? <div className="mt-1 text-center text-[4px] underline" style={{ color: design.secondary }}>LinkedIn: linkedin.com/in/yourname</div> : null}
        </header>
        {headings.map((heading, index) => (
          <section key={heading} className={isContemporary ? "mt-2" : "mt-2.5"}>
            <div className="mb-1 truncate font-extrabold" style={{ color: design.primary, fontSize: 5.1, ...headingStyle(index) }}>{heading}</div>
            {isChronological ? (
              <div className="flex gap-1.5">
                <div className="w-6 shrink-0 border-r pr-1" style={{ borderColor: design.rule }}>
                  <div className="rounded-sm px-0.5 text-[3.4px] font-semibold" style={{ background: "#EEF2F7", color: design.secondary }}>2024</div>
                  <div className="ml-1 mt-1 h-5 w-px" style={{ background: design.rule }} />
                </div>
                <div className="flex-1 space-y-[3px]"><div className="h-[3px] w-2/5 rounded-sm" style={{ background: design.secondary, opacity: .85 }} /><div className="h-[2.5px] w-full rounded-sm bg-slate-200" /><div className="h-[2.5px] w-10/12 rounded-sm bg-slate-200" /></div>
              </div>
            ) : isContemporary ? (
              <div className="space-y-[4px] rounded-sm border border-[#E5EFED] p-1.5">
                <div className="h-[3px] w-2/5 rounded-sm" style={{ background: design.secondary }} />
                <div className="h-[2.5px] w-full rounded-sm bg-slate-200" />
                <div className="flex gap-1"><div className="h-[3px] w-7 rounded-full" style={{ background: "#D5E9E5" }} /><div className="h-[3px] w-8 rounded-full" style={{ background: "#D5E9E5" }} /></div>
              </div>
            ) : (
              <div className="space-y-[3px]">
                <div className="flex items-center justify-between gap-1"><div className="h-[3px] w-2/5 rounded-sm" style={{ background: design.secondary, opacity: .75 }} />{index > 0 ? <div className="h-[2px] w-1/5 rounded-sm bg-slate-300" /> : null}</div>
                <div className="h-[2.5px] w-full rounded-sm bg-slate-200" />
                <div className="h-[2.5px] w-10/12 rounded-sm bg-slate-200" />
                {index === 2 ? <div className="ml-2 h-[2px] w-9/12 rounded-sm bg-slate-200" /> : null}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
