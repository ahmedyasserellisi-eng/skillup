"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Mail, Send } from "lucide-react";

type ContactCategory = "general" | "partnership" | "volunteering" | "media";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ContactForm({ locale }: { locale: "ar" | "en" }) {
  const isAr = locale === "ar";

  const t = useMemo(() => {
    const ar = {
      sectionTitle: "أرسل رسالة",
      sectionDesc:
        "يمكنك إرسال استفسارك أو رسالتك مباشرة إلى فريق SkillUp، وسيتم مراجعتها والرد عليك في أقرب وقت.",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      category: "نوع الرسالة",
      subject: "عنوان الرسالة",
      message: "الرسالة",
      send: "إرسال الرسالة",
      sending: "جارِ الإرسال...",
      ok: "تم إرسال رسالتك بنجاح. سنراجعها ونتواصل معك قريبًا.",
      err: "من فضلك تأكد من استكمال البيانات المطلوبة ثم حاول مرة أخرى.",
      note: "سيتم توجيه الرسائل إلى: skillupyouth.eg@gmail.com",
      quickInfo: "معلومات سريعة",
      quickInfoDesc:
        "للاستفسارات العامة أو الشراكات أو التطوع، يمكنك استخدام النموذج أو التواصل عبر البريد الرسمي.",
      officialEmail: "البريد الرسمي",
      joinTitle: "الانضمام إلى الفريق",
      joinDesc:
        "إذا كانت رسالتك خاصة بالانضمام، فالأفضل استخدام صفحة الانضمام المخصصة لتسهيل مراجعة الطلب.",
      joinCta: "الانتقال إلى صفحة الانضمام",
      required: "هذا الحقل مطلوب",
      cat: {
        general: "استفسار عام",
        partnership: "شراكة أو رعاية",
        volunteering: "تطوع أو انضمام",
        media: "إعلام أو تغطية"
      }
    };

    const en = {
      sectionTitle: "Send a message",
      sectionDesc:
        "You can send your inquiry directly to the SkillUp team and we will review it and get back to you as soon as possible.",
      name: "Full name",
      email: "Email",
      category: "Category",
      subject: "Subject",
      message: "Message",
      send: "Send message",
      sending: "Sending...",
      ok: "Your message has been sent successfully. We will review it and get back to you soon.",
      err: "Please make sure the required fields are completed, then try again.",
      note: "Messages will be sent to: skillupyouth.eg@gmail.com",
      quickInfo: "Quick info",
      quickInfoDesc:
        "For general inquiries, partnerships, or volunteering, you can use the form or contact the official email.",
      officialEmail: "Official email",
      joinTitle: "Join the team",
      joinDesc:
        "If your message is about joining, it is better to use the dedicated join page so your application can be reviewed properly.",
      joinCta: "Go to join page",
      required: "This field is required",
      cat: {
        general: "General inquiry",
        partnership: "Partnership or sponsorship",
        volunteering: "Volunteering or joining",
        media: "Media or press"
      }
    };

    return isAr ? ar : en;
  }, [isAr]);

  const [form, setForm] = useState<{
    full_name: string;
    email: string;
    category: ContactCategory;
    subject: string;
    message: string;
  }>({
    full_name: "",
    email: "",
    category: "general",
    subject: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const glass =
    "rounded-[28px] border border-black/10 bg-white/78 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60";

  const softCard =
    "rounded-2xl border border-black/10 bg-white/90 dark:border-white/10 dark:bg-zinc-950/45";

  const labelClass =
    "text-xs font-semibold text-zinc-500 dark:text-zinc-400";

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white dark:border-white/10 dark:bg-zinc-950/45 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:bg-zinc-950/60";

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300";

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMsg("");
    setDone(false);

    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg(t.err);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed");
      }

      setDone(true);
      setForm({
        full_name: "",
        email: "",
        category: "general",
        subject: "",
        message: ""
      });
    } catch {
      setErrorMsg(t.err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]" dir={isAr ? "rtl" : "ltr"}>
      <section className={cx("p-6 md:p-7", glass)}>
        <div className="mb-5 grid gap-2">
          <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">
            {t.sectionTitle}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {t.sectionDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {(done || errorMsg) && (
            <div
              aria-live="polite"
              className={cx(
                "flex items-start gap-3 rounded-2xl border p-4 text-sm",
                done
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
              )}
            >
              {done ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              )}

              <div className="leading-6">{done ? t.ok : errorMsg}</div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className={labelClass}>
                {t.name} <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder={t.name}
                autoComplete="name"
              />
            </div>

            <div className="grid gap-1.5">
              <label className={labelClass}>
                {t.email} <span className="text-red-500">*</span>
              </label>
              <input
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder={t.email}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className={labelClass}>{t.category}</label>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => updateField("category", e.target.value as ContactCategory)}
              >
                <option value="general">{t.cat.general}</option>
                <option value="partnership">{t.cat.partnership}</option>
                <option value="volunteering">{t.cat.volunteering}</option>
                <option value="media">{t.cat.media}</option>
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className={labelClass}>{t.subject}</label>
              <input
                className={inputClass}
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                placeholder={t.subject}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className={labelClass}>
              {t.message} <span className="text-red-500">*</span>
            </label>
            <textarea
              className={cx(inputClass, "min-h-[180px] resize-none")}
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              placeholder={t.message}
            />
          </div>

          <button type="submit" disabled={loading} className={primaryBtn}>
            <Send size={16} />
            <span>{loading ? t.sending : t.send}</span>
          </button>

          <p className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
            {t.note}
          </p>
        </form>
      </section>

      <aside className="grid gap-4 self-start">
        <div className={cx("p-5", glass)}>
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            {t.quickInfo}
          </div>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {t.quickInfoDesc}
          </p>

          <div className={cx("mt-4 p-4", softCard)}>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <Mail size={14} />
              <span>{t.officialEmail}</span>
            </div>
            <div className="mt-2 break-words text-sm font-medium text-zinc-900 dark:text-white">
              skillupyouth.eg@gmail.com
            </div>
          </div>
        </div>

        <div className={cx("p-5", glass)}>
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            {t.joinTitle}
          </div>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {t.joinDesc}
          </p>

          <Link
            href={`/${locale}/join`}
            className="mt-4 inline-flex rounded-2xl border border-black/10 bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {t.joinCta}
          </Link>
        </div>
      </aside>
    </div>
  );
}
