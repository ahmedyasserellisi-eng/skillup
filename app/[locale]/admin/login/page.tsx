"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSendLink() {
    setStatus("");
    const clean = email.trim().toLowerCase();

    if (!clean) {
      setStatus("اكتب البريد الإلكتروني أولًا.");
      return;
    }

    if (!ALLOWED.has(clean)) {
      setStatus("هذا البريد غير مخوّل للدخول.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo: `${window.location.origin}/ar/admin`
        }
      });

      if (error) {
        setStatus(error.message);
      } else {
        setStatus("تم إرسال رابط الدخول إلى بريدك. افتح الإيميل واضغط على الرابط.");
      }
    } catch (err: any) {
      setStatus(err?.message || "حدث خطأ أثناء إرسال رابط الدخول.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3">
          <Input
            type="email"
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button onClick={onSendLink} disabled={loading}>
            {loading ? "Sending..." : "Send magic link"}
          </Button>

          {status ? <p className="text-sm opacity-80">{status}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}