import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import { setRequestLocale } from "next-intl/server";
import JoinForm from "./join-form";

export default async function JoinPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sector?: string }>;
}) {
  const { locale } = await params;
  const { sector } = await searchParams;

  if (!locales.includes(locale as Locale)) notFound();

  const safeLocale = locale as Locale;
  setRequestLocale(safeLocale);

  return <JoinForm locale={safeLocale} presetSector={sector ?? ""} />;
}