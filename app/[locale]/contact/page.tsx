"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Mail,
  Facebook,
  Linkedin,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

type Status = "success" | "error" | null;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale() as "ar" | "en";
  const isAr = locale === "ar";

  const social = {
    whatsapp: "https://whatsapp.com/channel/0029Van9eoJ3bbVDD7ySIl0T",
    facebook: "https://www.facebook.com/skillupyouth",
    linkedin: "https://www.linkedin.com/in/skill-up-8b84583aa",
    email: "mailto:skillupyouth.eg@gmail.com"
  };

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const glass =
    "rounded-[28px] border border-black/10 bg-white/78 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60";

  const softCard =
    "rounded-2xl border border-black/10 bg-white/90 dark:border-white/10 dark:bg-zinc-950/45";

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white dark:border-white/10 dark:bg-zinc-950/45 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white/20 dark:focus:bg-zinc-950/60";

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300";

  const secondaryBtn =
    "inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 active:scale-[0.99] dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10 dark:hover:text-white";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setStatusMsg("");

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedMessage = form.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatus("error");
      setStatusMsg(
        isAr
          ? "من فضلك املأ جميع الحقول المطلوبة."
          : "Please fill in all required fields."
      );
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setStatus("error");
      setStatusMsg(
        isAr
          ? "من فضلك أدخل بريدًا إلكترونيًا صحيحًا."
          : "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
            (isAr ? "تعذر إرسال الرسالة." : "Failed to send message.")
        );
      }

      setStatus("success");
      setStatusMsg(
        data?.note
          ? isAr
            ? `تم حفظ رسالتك بنجاح. ملاحظة: ${data.note}`
            : `Your message was saved successfully. Note: ${data.note}`
          : isAr
            ? "تم إرسال رسالتك بنجاح. سنراجعها ونتواصل معك في أقرب وقت."
            : "Your message has been sent successfully. We will review it and get back to you soon."
      );

      setForm({
        name: "",
        email: "",
        message: ""
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : isAr
            ? "حدث خطأ أثناء إرسال الرسالة."
            : "An error occurred while sending your message.";

      setStatus("error");
      setStatusMsg(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8">
      <section className={cx("relative overflow-hidden p-7 md:p-8", glass)}>
        <div className="absolute inset-0 -z-20 bg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-sky-50/70 to-transparent dark:from-amber-400/5 dark:to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-100/40 blur-3xl dark:bg-amber-300/10" />

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-amber-300" />
              <span>{isAr ? "تواصل مع فريق SkillUp" : "Contact SkillUp Team"}</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold text-zinc-950 dark:text-white md:text-5xl">
              {t("title")}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-8 text-zinc-600 dark:text-zinc-300 md:text-base">
              {t("desc")}
            </p>
          </div>

          <div className={cx("p-4 text-sm", softCard)}>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {isAr ? "البريد الرسمي" : "Official email"}
            </div>
            <div className="mt-2 font-medium text-zinc-900 dark:text-white">
              skillupyouth.eg@gmail.com
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <aside className="grid gap-4 lg:col-span-2">
          <div className={cx("p-6", glass)}>
            <div className="text-sm font-bold text-zinc-900 dark:text-white">
              {isAr ? "قنوات التواصل الرسمية" : "Official channels"}
            </div>

            <div className="mt-4 grid gap-3">
              <a
                href={social.email}
                className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100 dark:hover:bg-white/10"
              >
                <Mail size={16} />
                <span>skillupyouth.eg@gmail.com</span>
              </a>

              <SocialCard
                href={social.whatsapp}
                title={isAr ? "واتساب" : "WhatsApp"}
                desc={
                  isAr
                    ? "لمتابعة التحديثات والإعلانات."
                    : "For updates and announcements."
                }
                icon={<MessageCircle size={16} />}
              />

              <SocialCard
                href={social.facebook}
                title={isAr ? "فيسبوك" : "Facebook"}
                desc={
                  isAr
                    ? "للاطلاع على المحتوى والمنشورات."
                    : "For posts, updates, and public content."
                }
                icon={<Facebook size={16} />}
              />

              <SocialCard
                href={social.linkedin}
                title={isAr ? "لينكدإن" : "LinkedIn"}
                desc={
                  isAr
                    ? "للحضور المهني والتواصل المؤسسي."
                    : "For professional presence and institutional networking."
                }
                icon={<Linkedin size={16} />}
              />
            </div>
          </div>

          <div className={cx("p-6", glass)}>
            <div className="text-sm font-bold text-zinc-900 dark:text-white">
              {isAr ? "الانضمام إلى الفريق" : "Join the team"}
            </div>

            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {isAr
                ? "إذا كنت مهتمًا بالانضمام إلى SkillUp، يمكنك التقديم مباشرة من خلال صفحة الانضمام."
                : "If you are interested in joining SkillUp, you can apply directly through the join page."}
            </p>

            <Link href={`/${locale}/join`} className={cx("mt-4", secondaryBtn)}>
              {isAr ? "الانتقال إلى صفحة الانضمام" : "Go to join page"}
            </Link>
          </div>
        </aside>

        <section className="lg:col-span-3">
          <form onSubmit={onSubmit} className={cx("grid gap-4 p-6", glass)} noValidate>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                {isAr ? "أرسل رسالة" : "Send a message"}
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {isAr ? "سيتم إرسال الرسالة إلى" : "Message will be sent to"}{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  skillupyouth.eg@gmail.com
                </span>
              </div>
            </div>

            {status ? (
              <div
                className={cx(
                  "flex items-start gap-3 rounded-2xl border p-4 text-sm",
                  status === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                )}
                aria-live="polite"
              >
                {status === "success" ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                )}
                <div className="leading-6">{statusMsg}</div>
              </div>
            ) : null}

            <div className="grid gap-1.5">
              <label
                htmlFor="contact-name"
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400"
              >
                {t("name")}
              </label>
              <input
                id="contact-name"
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("name")}
                autoComplete="name"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="contact-email"
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400"
              >
                {t("email")}
              </label>
              <input
                id="contact-email"
                className={inputClass}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t("email")}
                autoComplete="email"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="contact-message"
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400"
              >
                {t("message")}
              </label>
              <textarea
                id="contact-message"
                className={cx(inputClass, "min-h-[180px] resize-none")}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t("message")}
                required
              />
            </div>

            <button type="submit" disabled={loading} className={primaryBtn}>
              <Send size={16} />
              <span>{loading ? (isAr ? "جاري الإرسال..." : "Sending...") : t("send")}</span>
            </button>

            <div className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">
              {t("note")}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function SocialCard({
  href,
  title,
  desc,
  icon
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-start gap-3 rounded-2xl border border-black/10 bg-white/90 p-4 transition hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950/45 dark:hover:bg-white/10"
    >
      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/90 text-zinc-700 transition dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200">
        {icon}
      </div>

      <div className="grid gap-1">
        <div className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</div>
        <div className="text-xs leading-6 text-zinc-500 dark:text-zinc-400">{desc}</div>
      </div>
    </a>
  );
}