"use client";

import { useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

export default function AdminLoginPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "en" ? "en" : "ar";
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSendLink(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    setStatus("");
    const clean = email.trim().toLowerCase();

    if (!clean) {
      setStatus(isAr ? "اكتب البريد الإلكتروني أولًا." : "Please enter your email first.");
      return;
    }

    if (!ALLOWED.has(clean)) {
      setStatus(isAr ? "هذا البريد غير مخوّل للدخول." : "This email is not authorized.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/${locale}/admin/join-requests` : "",
        },
      });

      if (error) {
        setStatus(error.message);
      } else {
        setStatus(
          isAr
            ? "تم إرسال رابط الدخول إلى بريدك الإلكتروني بنجاح."
            : "Login link sent successfully to your email."
        );
      }
    } catch (err: any) {
      setStatus(
        err?.message ||
          (isAr
            ? "حدث خطأ أثناء إرسال رابط الدخول."
            : "An error occurred while sending the login link.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <Card className="rounded-3xl border-black/10 bg-white/80 shadow-sm dark:border-white/10 dark:bg-zinc-950/50">
        <CardHeader>
          <CardTitle>{isAr ? "تسجيل دخول الإدارة" : "Admin Login"}</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4" onSubmit={onSendLink}>
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="admin@skillupegypt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                dir="ltr"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? isAr
                  ? "جارٍ الإرسال..."
                  : "Sending..."
                : isAr
                  ? "إرسال رابط الدخول"
                  : "Send magic link"}
            </Button>
          </form>

          {status && (
            <p className="mt-4 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {status}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
