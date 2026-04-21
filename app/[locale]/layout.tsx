import "../globals.css";

import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Cairo, Roboto_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { locales, type Locale } from "@/i18n";

import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { PageTransition } from "@/components/motion";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans-app",
  display: "swap"
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono-app",
  display: "swap"
});

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<LocaleLayoutProps>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`../../messages/${locale}.json`)).default;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={[
          cairo.variable,
          robotoMono.variable,
          "flex min-h-screen flex-col font-sans antialiased"
        ].join(" ")}
      >
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Navbar locale={locale} />

            <main className="flex-1">
              <div className="container-skillup py-8 md:py-10">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>

            <Footer locale={locale} />
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}