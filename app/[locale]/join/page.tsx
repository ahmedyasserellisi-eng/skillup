import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";
import JoinForm from "./join-form";
import type { Metadata } from "next";

// تعريف الأنواع بدقة لضمان استقرار الـ Typescript بالكامل
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sector?: string }>;
};

// تحسين الأداء وتهيئة السيو (SEO) بشكل ديناميكي للغتين بناءً على الـ Locale
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

// المكون الرئيسي للصفحة مع معالجة الـ Promises بطريقة Next.js الآمنة
export default async function JoinPage({ params, searchParams }: Props) {
  // استقبال الـ params والـ searchParams بشكل غير متزامن (Async) لضمان التوافق الكامل
  const { locale } = await params;
  const { sector } = await searchParams;

  // التحقق الصارم من أن اللغة الممررة مدعومة في نظام i18n
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const safeLocale = locale as Locale;
  
  // تفعيل الاستهلاك الساكن والمستقر للغات داخل مكونات الخادم
  setRequestLocale(safeLocale);

  // إرجاع الفورم بكامل خصائصه ومميزاته مع تمرير القطاع الافتراضي إن وجد
  return (
    <JoinForm 
      locale={safeLocale} 
      presetSector={sector ?? ""} 
    />
  );
}
