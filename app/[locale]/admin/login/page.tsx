"use client"; // [cite: 1]

import { useState, type FormEvent } from "react"; // [cite: 1]
import { useParams } from "next/navigation"; // [cite: 1]
import { supabaseBrowser } from "@/lib/supabase-browser"; // [cite: 2]
import { Button } from "@/components/ui/button"; // [cite: 2]
import { Input } from "@/components/ui/input"; // [cite: 2]
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // 

// جلب الإيميلات المصرح لها من متغيرات البيئة، أو استخدام الإيميلات الحالية كاحتياطي 
const envEmails = process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS 
  ? process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS.split(",") 
  : ["skillupyouth.eg@gmail.com", "ahmedyasserellisi@gmail.com"]; // 

const ALLOWED = new Set(envEmails.map(email => email.trim().toLowerCase()));

export default function AdminLoginPage() { // [cite: 4]
  const params = useParams<{ locale?: string }>(); // [cite: 4]
  const locale = params?.locale === "en" ? "en" : "ar"; // [cite: 4, 5]
  const isAr = locale === "ar"; // [cite: 5]

  const [email, setEmail] = useState(""); // [cite: 5]
  // تحويل الحالة إلى كائن لتحديد نوع الرسالة (خطأ أم نجاح) لتلوينها بدقة
  const [status, setStatus] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const [loading, setLoading] = useState(false); // [cite: 6]

  async function onSendLink(e?: FormEvent<HTMLFormElement>) { // [cite: 6]
    e?.preventDefault(); // [cite: 6]

    setStatus({ text: "", type: "" });
    const clean = email.trim().toLowerCase(); // [cite: 6]
    
    if (!clean) { // [cite: 7]
      setStatus({
        text: isAr ? "اكتب البريد الإلكتروني أولًا." : "Please enter your email first.", // [cite: 7]
        type: "error"
      });
      return; // [cite: 8]
    }

    if (!ALLOWED.has(clean)) { // [cite: 8]
      setStatus({
        text: isAr ? "هذا البريد غير مخوّل للدخول كمسؤول." : "This email is not authorized as admin.", // [cite: 8]
        type: "error"
      });
      return; // [cite: 9]
    }

    try {
      setLoading(true); // [cite: 9]

      const redirectTo = `${window.location.origin}/${locale}/admin`; // [cite: 9]
      const { error } = await supabaseBrowser.auth.signInWithOtp({ // [cite: 10]
        email: clean, // [cite: 10]
        options: {
          emailRedirectTo: redirectTo // [cite: 10]
        }
      });

      if (error) { // [cite: 11]
        setStatus({ text: error.message, type: "error" }); // [cite: 11]
      } else { // 
        setStatus({
          text: isAr
            ? "تم إرسال رابط الدخول إلى بريدك الإلكتروني بنجاح. افتح الرسالة واضغط على الرابط."
            : "A magic login link has been sent to your email. Open the message and click the link.", // 
          type: "success"
        });
      }
    } catch (err: any) { // [cite: 13]
      setStatus({
        text: err?.message || (isAr ? "حدث خطأ أثناء إرسال رابط الدخول." : "An error occurred while sending the login link."), // [cite: 13]
        type: "error"
      });
    } finally { // [cite: 14]
      setLoading(false); // [cite: 14]
    }
  }

  return (
    <div className="mx-auto max-w-md py-24 px-4">
      {/* كارت بتصميم مينيماليست فاخر مع حدود ناعمة وظل خفيف جداً */}
      <Card className="rounded-[28px] border border-zinc-100 bg-white/90 p-2 shadow-xl shadow-zinc-100/50 dark:border-zinc-800/80 dark:bg-zinc-950/70 dark:shadow-none backdrop-blur-md">
        <CardHeader className="pt-8 pb-4 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-[#182B36] dark:text-zinc-50 font-cairo">
            {isAr ? "تسجيل دخول الإدارة" : "Admin Login"} {/* [cite: 14] */}
          </CardTitle>
          <p className="text-sm text-zinc-500 mt-1">
            {isAr ? "منطقة محمية لمسؤولي نظام SkillUp" : "Protected area for SkillUp administrators"}
          </p>
        </CardHeader>

        <CardContent className="pb-8">
          <form className="grid gap-4" onSubmit={onSendLink}> {/* [cite: 14] */}
            <div className="space-y-1">
              <Input
                [cite_start]type="email" // [cite: 15]
                placeholder="admin@skillupegypt.com"
                [cite_start]value={email} // [cite: 15]
                [cite_start]onChange={(e) => setEmail(e.target.value)} // [cite: 15]
                autoComplete="email" // [cite: 15]
                dir="ltr" // [cite: 15]
                className="h-11 rounded-2xl border-zinc-200 bg-zinc-50/50 focus-visible:ring-[#C8A448] focus-visible:border-[#C8A448] dark:border-zinc-800 dark:bg-zinc-900/50 transition-all"
              />
            </div>

            {/* زر احترافي يحمل اللون الكحلي الرسمي الفاخر للبراند وتأثير ميكانيكي عند الضغط والتحميل */}
            <Button 
              [cite_start]type="submit" // [cite: 16]
              [cite_start]disabled={loading} // [cite: 16]
              className="w-full h-11 rounded-2xl font-medium text-white transition-all bg-[#182B36] hover:bg-[#182B36]/90 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? ( // [cite: 16]
                <span className="flex items-center gap-2 justify-center">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isAr ? "جارٍ التحقق والإرسال..." : "Verifying..."} {/* [cite: 16] */}
                </span>
              ) : isAr ? ( // [cite: 16]
                "إرسال رابط الدخول الآمن"
              ) : (
                "Send Secure Link" // [cite: 17]
              )}
            </Button>

            {/* تنبيه ذكي ملون ديناميكياً حسب نوع النتيجة لتوفير أفضل تجربة مستخدم */}
            {status.text ? (
              <div 
                className={`text-sm leading-6 p-3.5 rounded-2xl border flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
                  status.type === "error"
                    ? "bg-red-50/60 border-red-100 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400"
                    : "bg-emerald-50/60 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"
                }`}
              >
                <span className="mt-1 font-semibold">
                  {status.type === "error" ? "⚠️" : "✨"}
                </span>
                <p className="flex-1 font-medium">{status.text}</p>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} // [cite: 19]
