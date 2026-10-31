import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { locales, type Locale } from "@/i18n";
import CvBuilder from "./cv-builder";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  return {
    title: isAr ? "صانع السيرة الذاتية | SkillUp" : "CV Builder | SkillUp",
    description: isAr
      ? "أنشئ سيرة ذاتية احترافية ومناسبة لأنظمة ATS مجانًا، خطوة بخطوة."
      : "Build a professional, ATS-friendly CV for free with SkillUp."
  };
}

export default async function CvBuilderPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  return <CvBuilder locale={locale as Locale} />;
}
