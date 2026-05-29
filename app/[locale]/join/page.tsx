import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";
import JoinForm from "./join-form";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sector?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  return {
    title: isAr ? "انضم إلى فريق SkillUp" : "Join SkillUp Team",
    description: isAr 
      ? "استمارة الانضمام الرسمية لمبادرة SkillUp - يرجى ملء البيانات بدقة لتقييم طلبك من قبل فريق المتابعة والتقييم (MEAL)."
      : "Official application form for SkillUp Initiative. Fill out the form to be reviewed by the MEAL team.",
    alternates: {
      languages: {
        ar: "/ar/join",
        en: "/en/join",
      },
    },
  };
}

export default async function JoinPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { sector } = await searchParams;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // تفعيل دالة الترجمة المستقرة في السيرفر لـ Next.js 15
  setRequestLocale(locale);

  return (
    <JoinForm locale={locale as "ar" | "en"} presetSector={sector || ""} />
  );
}
