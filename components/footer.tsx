"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Facebook, Linkedin } from "lucide-react";

export default function Footer({ locale }: { locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const year = new Date().getFullYear();

  const href = (path: string) => `/${locale}${path}`;

  const links = [
    { label: isAr ? "البرامج" : "Programs", path: "/programs" },
    { label: isAr ? "الفعاليات" : "Events", path: "/events" },
    { label: isAr ? "القطاعات" : "Sectors", path: "/sectors" },
    { label: isAr ? "التكريمات" : "Awards", path: "/highlights" },
    { label: isAr ? "انضم إلينا" : "Join Us", path: "/join" },
    { label: isAr ? "تواصل" : "Contact", path: "/contact" }
  ];

  const social = {
    whatsapp: "https://whatsapp.com/channel/0029Van9eoJ3bbVDD7ySIl0T",
    facebook: "https://www.facebook.com/skillupyouth",
    linkedin: "https://www.linkedin.com/in/skill-up-8b84583aa",
    email: "mailto:skillupyouth.eg@gmail.com"
  };

  const socialBtnClass =
    "flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-100/80 bg-white/80 text-zinc-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-200 dark:hover:border-amber-300/20 dark:hover:bg-amber-400/10 dark:hover:text-amber-200";

  return (
    <footer className="mt-14 border-t border-sky-100/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="container-skillup py-8">
        <div className="grid gap-6 rounded-[28px] border border-sky-100/80 bg-white/72 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/55 md:grid-cols-[1.15fr_.9fr_.9fr] md:p-6">
          {/* Brand / Intro */}
          <div className="space-y-4">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-3 rounded-2xl p-1 transition hover:bg-sky-50/80 dark:hover:bg-white/5"
              aria-label="SkillUp home"
            >
              <div className="relative h-11 w-11 shrink-0">
                <Image
                  src="/brand/logo-blue.png"
                  alt="SkillUp logo"
                  fill
                  sizes="44px"
                  className="object-contain transition-opacity duration-200 dark:opacity-0"
                />
                <Image
                  src="/brand/logo-gold.png"
                  alt="SkillUp logo dark"
                  fill
                  sizes="44px"
                  className="object-contain opacity-0 transition-opacity duration-200 dark:opacity-100"
                />
              </div>

              <span className="text-xl font-extrabold tracking-tight text-sky-800 dark:text-amber-200">
                SkillUp
              </span>
            </Link>

            <p className="max-w-md text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {isAr
                ? "فريق شبابي يركز على تمكين الشباب من خلال التعلم التطبيقي، وتنمية المهارات، وبناء تجربة أقرب لبيئة العمل الحقيقية."
                : "A youth team focused on empowering young people through practical learning, skill development, and building workplace-like experiences."}
            </p>

            <a
              href={social.email}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700 active:scale-[0.99] dark:bg-amber-400 dark:text-zinc-950 dark:hover:bg-amber-300"
            >
              <Mail className="h-4 w-4" />
              <span>{isAr ? "راسلنا" : "Email Us"}</span>
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {isAr ? "روابط سريعة" : "Quick Links"}
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {links.map((item) => (
                <Link
                  key={item.path}
                  href={href(item.path)}
                  className="rounded-2xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-sky-50 hover:text-sky-800 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-amber-200"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact / Social */}
          <div>
            <h4 className="mb-4 text-sm font-extrabold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {isAr ? "تابعنا" : "Connect"}
            </h4>

            <p className="mb-4 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {isAr
                ? "تابع أخبار الفريق وتواصل معنا عبر منصاتنا المختلفة."
                : "Follow team updates and connect with us through our platforms."}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={social.whatsapp}
                target="_blank"
                rel="noreferrer"
                className={socialBtnClass}
                aria-label="WhatsApp Channel"
                title="WhatsApp Channel"
              >
                <Image
                  src="/icons/whatsapp.svg"
                  alt="WhatsApp"
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                />
              </a>

              <a
                href={social.facebook}
                target="_blank"
                rel="noreferrer"
                className={socialBtnClass}
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="h-[18px] w-[18px]" />
              </a>

              <a
                href={social.linkedin}
                target="_blank"
                rel="noreferrer"
                className={socialBtnClass}
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin className="h-[18px] w-[18px]" />
              </a>

              <a
                href={social.email}
                className={socialBtnClass}
                aria-label="Email"
                title="Email"
              >
                <Mail className="h-[18px] w-[18px]" />
              </a>
            </div>

            <div className="mt-5 rounded-2xl border border-sky-100/80 bg-sky-50/70 px-4 py-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              <span className="font-semibold text-sky-800 dark:text-amber-200">
                {isAr ? "البريد:" : "Email:"}
              </span>{" "}
              skillupyouth.eg@gmail.com
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-sky-100/80 pt-4 text-center text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400 md:flex-row md:items-center md:justify-between md:text-start">
          <p>
            © {year} SkillUp. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>

          <p>
            {isAr
              ? "واجهة واضحة وعصرية ومتوازنة في الوضعين الفاتح والداكن."
              : "A clean and balanced experience across both light and dark modes."}
          </p>
        </div>
      </div>
    </footer>
  );
}