"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SECTORS } from "@/lib/sectors-data";

type Props = {
  locale: "ar" | "en";
  presetSector: string;
};

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  age: string;
  education: string;
  university: string;
  graduation_year: string;
  sector_key: string;
  preferred_role: string;
  availability: string;
  skills: string;
  experience: string;
  linkedin: string;
  portfolio: string;
  message: string;
  consent: boolean;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidOptionalNumber(value: string, min: number, max: number) {
  if (!value.trim()) return true;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

function getSafeSectorKey(value: string) {
  const found = SECTORS.find((sector) => sector.slug === value);
  return found ? found.slug : "training-development";
}

export default function JoinForm({ locale, presetSector }: Props) {
  const isAr = locale === "ar";

  const t = useMemo(() => {
    const ar = {
      title: "انضم إلى فريق SkillUp",
      sub: "املأ النموذج بدقة، وسيقوم فريق SkillUp بمراجعة طلبك وتحديد القطاع أو المسار الأنسب لك.",
      intro: "تأكد من كتابة بياناتك بشكل واضح وصحيح حتى يسهل التواصل معك ومراجعة طلبك بشكل احترافي.",
      section1: "البيانات الأساسية",
      section2: "الخلفية التعليمية والمهنية",
      section3: "التفضيلات والاهتمامات",
      section4: "رسالتك",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      city: "المدينة",
      age: "العمر",
      education: "الحالة التعليمية",
      university: "الجامعة / المعهد",
      graduation: "سنة التخرج",
      sector: "القطاع المطلوب",
      role: "الدور أو المسؤولية المفضلة",
      availability: "الوقت المتاح أسبوعيًا",
      skills: "المهارات",
      experience: "خبرات أو أنشطة سابقة",
      linkedin: "رابط LinkedIn",
      portfolio: "رابط Portfolio / Behance / Drive",
      message: "لماذا ترغب في الانضمام؟",
      consent: "أوافق على استخدام هذه البيانات لغرض التواصل ومراجعة طلب الانضمام.",
      submit: "إرسال الطلب",
      sending: "جارٍ إرسال الطلب...",
      ok: "تم إرسال طلبك بنجاح. سيقوم الفريق بمراجعته والتواصل معك قريبًا.",
      warnTitle: "تم حفظ الطلب مع ملاحظة",
      warn:
        "تم حفظ الطلب، لكن تعذر إرسال الإشعار البريدي التلقائي. سيقوم الفريق بمتابعة الطلب يدويًا.",
      errRequired: "من فضلك أكمل الحقول المطلوبة ووافق على الإقرار.",
      errEmail: "من فضلك أدخل بريدًا إلكترونيًا صحيحًا.",
      errAge: "من فضلك أدخل عمرًا صحيحًا.",
      errGraduation: "من فضلك أدخل سنة تخرج صحيحة.",
      noteRequired: "الحقول المعلّمة بعلامة * مطلوبة.",
      placeholders: {
        name: "اكتب اسمك الكامل",
        email: "example@email.com",
        phone: "01xxxxxxxxx",
        city: "مثال: الزقازيق",
        age: "مثال: 22",
        university: "اسم الجامعة أو المعهد",
        graduation: "مثال: 2027",
        role: "مثال: كتابة المحتوى / التنسيق / التدريب",
        availability: "مثال: 6 ساعات أسبوعيًا",
        skills: "مثال: كتابة - تصميم - تنظيم - تواصل",
        experience: "اكتب أي خبرات أو أنشطة أو مشاركات سابقة",
        linkedin: "https://linkedin.com/in/...",
        portfolio: "https://...",
        message: "عرّفنا بنفسك، ولماذا تريد الانضمام، وكيف ترى أنك ستضيف للفريق"
      },
      educationOptions: {
        student: "طالب",
        graduate: "خريج",
        employed: "موظف",
        other: "أخرى"
      }
    };

    const en = {
      title: "Join SkillUp Team",
      sub: "Complete the form carefully, and the SkillUp team will review your application and place you in the most suitable sector.",
      intro: "Please provide clear and accurate information so the team can review your application and contact you professionally.",
      section1: "Basic Information",
      section2: "Educational & Professional Background",
      section3: "Preferences & Interests",
      section4: "Your Message",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      city: "City",
      age: "Age",
      education: "Education Status",
      university: "University / Institute",
      graduation: "Graduation Year",
      sector: "Preferred Sector",
      role: "Preferred Role / Responsibility",
      availability: "Weekly Availability",
      skills: "Skills",
      experience: "Previous Experience / Activities",
      linkedin: "LinkedIn URL",
      portfolio: "Portfolio / Behance / Drive URL",
      message: "Why do you want to join?",
      consent: "I agree to use this data for contact and application review purposes.",
      submit: "Submit Application",
      sending: "Submitting...",
      ok: "Your application has been submitted successfully. The team will review it and contact you soon.",
      warnTitle: "Application saved with a note",
      warn:
        "Your application was saved, but the automatic email notification could not be sent. The team can still review your application manually.",
      errRequired: "Please complete all required fields and accept the consent statement.",
      errEmail: "Please enter a valid email address.",
      errAge: "Please enter a valid age.",
      errGraduation: "Please enter a valid graduation year.",
      noteRequired: "Fields marked with * are required.",
      placeholders: {
        name: "Enter your full name",
        email: "example@email.com",
        phone: "+20...",
        city: "Example: Zagazig",
        age: "Example: 22",
        university: "University or institute name",
        graduation: "Example: 2027",
        role: "Example: Content Writing / Coordination / Training",
        availability: "Example: 6 hours per week",
        skills: "Example: Writing - Design - Organization - Communication",
        experience: "Write any previous experience, activities, or participation",
        linkedin: "https://linkedin.com/in/...",
        portfolio: "https://...",
        message:
          "Tell us about yourself, why you want to join, and how you think you can add value to the team"
      },
      educationOptions: {
        student: "Student",
        graduate: "Graduate",
        employed: "Employed",
        other: "Other"
      }
    };

    return isAr ? ar : en;
  }, [isAr]);

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    education: "student",
    university: "",
    graduation_year: "",
    sector_key: getSafeSectorKey(presetSector),
    preferred_role: "",
    availability: "",
    skills: "",
    experience: "",
    linkedin: "",
    portfolio: "",
    message: "",
    consent: false
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [noteMsg, setNoteMsg] = useState("");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      sector_key: getSafeSectorKey(presetSector)
    }));
  }, [presetSector]);

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-black/5 dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:bg-zinc-950/60 dark:focus:ring-white/10";

  const labelClass =
    "mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200";

  const cardClass =
    "rounded-[28px] border border-black/10 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/45";

  const mutedClass = "text-xs leading-6 text-zinc-500 dark:text-zinc-400";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errorMsg) setErrorMsg("");
    if (done) setDone(false);
    if (noteMsg) setNoteMsg("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMsg("");
    setNoteMsg("");
    setDone(false);

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.sector_key ||
      !form.message.trim() ||
      !form.consent
    ) {
      setErrorMsg(t.errRequired);
      return;
    }

    if (!isValidEmail(form.email)) {
      setErrorMsg(t.errEmail);
      return;
    }

    if (!isValidOptionalNumber(form.age, 10, 80)) {
      setErrorMsg(t.errAge);
      return;
    }

    if (!isValidOptionalNumber(form.graduation_year, 1950, 2100)) {
      setErrorMsg(t.errGraduation);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        age: form.age.trim() ? Number(form.age) : null,
        education: form.education || null,
        university: form.university.trim() || null,
        graduation_year: form.graduation_year.trim() ? Number(form.graduation_year) : null,
        sector_key: form.sector_key,
        preferred_role: form.preferred_role.trim() || null,
        availability: form.availability.trim() || null,
        skills: form.skills.trim() || null,
        experience: form.experience.trim() || null,
        linkedin: form.linkedin.trim() || null,
        portfolio: form.portfolio.trim() || null,
        message: form.message.trim(),
        consent: form.consent
      };

      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to submit application.");
      }

      setDone(true);

      if (json?.note) {
        setNoteMsg(String(json.note));
      }

      setForm({
        full_name: "",
        email: "",
        phone: "",
        city: "",
        age: "",
        education: "student",
        university: "",
        graduation_year: "",
        sector_key: form.sector_key,
        preferred_role: "",
        availability: "",
        skills: "",
        experience: "",
        linkedin: "",
        portfolio: "",
        message: "",
        consent: false
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : isAr
            ? "حدث خطأ أثناء إرسال الطلب."
            : "An error occurred while submitting the application.";

      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6" dir={isAr ? "rtl" : "ltr"}>
      <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/50 md:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-zinc-50/80 to-transparent dark:from-white/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-black/5 blur-3xl dark:bg-white/5" />

        <div className="relative grid gap-3">
          <span className="inline-flex w-fit rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200">
            {t.title}
          </span>

          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white md:text-3xl">
            {t.title}
          </h1>

          <p className="max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {t.sub}
          </p>

          <p className={mutedClass}>{t.intro}</p>
        </div>
      </section>

      <form className="grid gap-4" onSubmit={submit} noValidate>
        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section1}</h2>
            <span className="text-xs font-medium text-zinc-400">01</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="full_name" className={labelClass}>
                {t.name} <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                className={inputClass}
                placeholder={t.placeholders.name}
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                {t.email} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                placeholder={t.placeholders.email}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                {t.phone}
              </label>
              <input
                id="phone"
                type="tel"
                className={inputClass}
                placeholder={t.placeholders.phone}
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="city" className={labelClass}>
                {t.city}
              </label>
              <input
                id="city"
                className={inputClass}
                placeholder={t.placeholders.city}
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                autoComplete="address-level2"
              />
            </div>

            <div>
              <label htmlFor="age" className={labelClass}>
                {t.age}
              </label>
              <input
                id="age"
                className={inputClass}
                placeholder={t.placeholders.age}
                inputMode="numeric"
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="education" className={labelClass}>
                {t.education}
              </label>
              <select
                id="education"
                className={inputClass}
                value={form.education}
                onChange={(e) => updateField("education", e.target.value)}
              >
                <option value="student">{t.educationOptions.student}</option>
                <option value="graduate">{t.educationOptions.graduate}</option>
                <option value="employed">{t.educationOptions.employed}</option>
                <option value="other">{t.educationOptions.other}</option>
              </select>
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section2}</h2>
            <span className="text-xs font-medium text-zinc-400">02</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="university" className={labelClass}>
                {t.university}
              </label>
              <input
                id="university"
                className={inputClass}
                placeholder={t.placeholders.university}
                value={form.university}
                onChange={(e) => updateField("university", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="graduation_year" className={labelClass}>
                {t.graduation}
              </label>
              <input
                id="graduation_year"
                className={inputClass}
                placeholder={t.placeholders.graduation}
                inputMode="numeric"
                value={form.graduation_year}
                onChange={(e) => updateField("graduation_year", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="linkedin" className={labelClass}>
                {t.linkedin}
              </label>
              <input
                id="linkedin"
                type="url"
                className={inputClass}
                placeholder={t.placeholders.linkedin}
                value={form.linkedin}
                onChange={(e) => updateField("linkedin", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="portfolio" className={labelClass}>
                {t.portfolio}
              </label>
              <input
                id="portfolio"
                type="url"
                className={inputClass}
                placeholder={t.placeholders.portfolio}
                value={form.portfolio}
                onChange={(e) => updateField("portfolio", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="experience" className={labelClass}>
                {t.experience}
              </label>
              <textarea
                id="experience"
                className={`${inputClass} min-h-[120px] resize-none`}
                placeholder={t.placeholders.experience}
                value={form.experience}
                onChange={(e) => updateField("experience", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section3}</h2>
            <span className="text-xs font-medium text-zinc-400">03</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="sector_key" className={labelClass}>
                {t.sector} <span className="text-red-500">*</span>
              </label>
              <select
                id="sector_key"
                className={inputClass}
                value={form.sector_key}
                onChange={(e) => updateField("sector_key", e.target.value)}
              >
                {SECTORS.map((sector) => (
                  <option key={sector.slug} value={sector.slug}>
                    {isAr ? sector.name_ar : sector.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="preferred_role" className={labelClass}>
                {t.role}
              </label>
              <input
                id="preferred_role"
                className={inputClass}
                placeholder={t.placeholders.role}
                value={form.preferred_role}
                onChange={(e) => updateField("preferred_role", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="availability" className={labelClass}>
                {t.availability}
              </label>
              <input
                id="availability"
                className={inputClass}
                placeholder={t.placeholders.availability}
                value={form.availability}
                onChange={(e) => updateField("availability", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="skills" className={labelClass}>
                {t.skills}
              </label>
              <input
                id="skills"
                className={inputClass}
                placeholder={t.placeholders.skills}
                value={form.skills}
                onChange={(e) => updateField("skills", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{t.section4}</h2>
            <span className="text-xs font-medium text-zinc-400">04</span>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="message" className={labelClass}>
                {t.message} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                className={`${inputClass} min-h-[170px] resize-none`}
                placeholder={t.placeholders.message}
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.consent}
                onChange={(e) => updateField("consent", e.target.checked)}
              />
              <span>{t.consent}</span>
            </label>

            <p className={mutedClass}>{t.noteRequired}</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            >
              {loading ? t.sending : t.submit}
            </button>

            <div aria-live="polite" className="grid gap-3">
              {done ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  {t.ok}
                </div>
              ) : null}

              {noteMsg ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
                  <div className="font-medium">{t.warnTitle}</div>
                  <div className="mt-1 leading-6">{t.warn}</div>
                  <div className="mt-2 break-all font-mono text-xs opacity-80">{noteMsg}</div>
                </div>
              ) : null}

              {errorMsg ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}