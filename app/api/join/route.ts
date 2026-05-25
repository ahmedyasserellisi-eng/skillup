import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// إعداد حماية الـ Rate Limiting اختيارياً لعدم تعطيل السيرفر إذا لم تكن المفاتيح جاهزة في الـ .env
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.fixedWindow(3, "5 m"), // السماح بـ 3 طلبات فقط كل 5 دقائق لكل IP
      analytics: true,
    });
  } catch (e) {
    console.error("Rate limiting failed to initialize, skipping safely:", e);
  }
}

function safeStr(value: unknown) {
  return String(value ?? "").trim();
}

function nullableStr(value: unknown) {
  const v = safeStr(value);
  return v || null;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toNullableInt(value: unknown) {
  const raw = safeStr(value);
  if (!raw) return null;

  const num = Number(raw);
  if (!Number.isInteger(num)) return null;

  return num;
}

function renderField(label: string, value: unknown) {
  const safeValue =
    value === null || value === undefined || String(value).trim() === ""
      ? "-"
      : escapeHtml(String(value));

  return `
    <tr>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#fafafa;font-weight:600;width:220px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;">
        ${safeValue}
      </td>
    </tr>
  `;
}

export async function POST(req: Request) {
  try {
    // 1. حماية الـ Rate Limiting لمنع الـ Flooding
    if (ratelimit) {
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { ok: false, error: "Too many requests. Please try again after 5 minutes." },
          { status: 429 }
        );
      }
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // 2. حماية الـ Honeypot ضد البوتات المبرمجة سبام
    if (body.website || body.hidden_honey) {
      return NextResponse.json({ ok: true, message: "Spam filtered successfully." });
    }

    const full_name = safeStr(body.full_name);
    const email = safeStr(body.email);
    const sector_key = safeStr(body.sector_key);
    const message = safeStr(body.message);
    const consent = Boolean(body.consent);
    const phone = safeStr(body.phone);
    const national_id = safeStr(body.national_id);

    // 3. التحقق من الحقول الإلزامية في الخلفية (مع استثناء الحقول الـ 5 الاختيارية)
    if (
      !full_name || !email || !sector_key || !message || !consent ||
      !national_id || !phone || !safeStr(body.city) ||
      !safeStr(body.member_status) || !safeStr(body.leadership_interest) ||
      !safeStr(body.education) || !safeStr(body.grade) || !safeStr(body.university) ||
      !safeStr(body.faculty) || !safeStr(body.department) || !safeStr(body.profile_picture_url) ||
      !safeStr(body.preferred_role) || !safeStr(body.availability) || !safeStr(body.heard_about_us) ||
      !safeStr(body.skills) || !safeStr(body.experience)
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields or consent not accepted" },
        { status: 400 }
      );
    }

    // 4. التحقق من البريد الإلكتروني
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // 5. التحقق الصارم من التليفون المصري
    if (!/^01[0125]\d{8}$/.test(phone)) {
      return NextResponse.json(
        { ok: false, error: "Invalid Egyptian phone number format" },
        { status: 400 }
      );
    }

    // 6. التحقق الصارم من الرقم القومي (14 رقم بالضبط)
    if (!/^\d{14}$/.test(national_id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid National ID (must be exactly 14 digits)" },
        { status: 400 }
      );
    }

    // 7. التحقق من السن التوافقي للفرونت إند (بين 15 و 70 سنة)
    const age = toNullableInt(body.age);
    if (age === null || age < 15 || age > 70) {
      return NextResponse.json(
        { ok: false, error: "Invalid age value (must be between 15 and 70)" },
        { status: 400 }
      );
    }

    // 8. التحقق من سنة التخرج
    const graduation_year = toNullableInt(body.graduation_year);
    if (graduation_year === null || graduation_year < 1950 || graduation_year > 2100) {
      return NextResponse.json(
        { ok: false, error: "Invalid graduation year value" },
        { status: 400 }
      );
    }

    // 9. التحقق من متغيرات البيئة لقاعدة البيانات
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase environment variables are missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // 10. فحص ومنع التسجيل المكرر بالبريد الإلكتروني أو الرقم القومي
    const { data: existingRequest, error: checkError } = await supabase
      .from("join_requests")
      .select("id")
      .or(`email.eq.${email},national_id.eq.${national_id}`)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { ok: false, error: "Database verification failed: " + checkError.message },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        { ok: false, error: "duplicate_entry" },
        { status: 400 }
      );
    }

    // 11. بناء كتل الـ Payload الكامل لـ 26 حقل بالتسميات الموحدة والآمنة للتخزين
    const payload = {
      full_name,
      email,
      phone: nullableStr(body.phone),
      national_id: nullableStr(body.national_id),
      city: nullableStr(body.city),
      age,
      member_status: nullableStr(body.member_status),
      leadership_interest: nullableStr(body.leadership_interest),
      education: nullableStr(body.education),
      grade: nullableStr(body.grade),
      university: nullableStr(body.university),
      faculty: nullableStr(body.faculty),
      department: nullableStr(body.department),
      postgrad_info: nullableStr(body.postgrad_info), // اختياري
      graduation_year,
      profile_picture_url: nullableStr(body.profile_picture_url),
      sector_key,
      preferred_role: nullableStr(body.preferred_role),
      availability: nullableStr(body.availability),
      heard_about_us: nullableStr(body.heard_about_us),
      skills: nullableStr(body.skills),
      experience: nullableStr(body.experience),
      linkedin: nullableStr(body.linkedin), // اختياري
      facebook: nullableStr(body.facebook), // اختياري
      portfolio: nullableStr(body.portfolio), // اختياري
      resume_url: nullableStr(body.resume_url), // اختياري
      message,
      consent,
      admin_status: "new"
    };

    // 12. إدراج الطلب داخل جدول سوبابيز
    const { error: dbError } = await supabase.from("join_requests").insert(payload);

    if (dbError) {
      return NextResponse.json(
        { ok: false, error: dbError.message },
        { status: 500 }
      );
    }

    // 13. إرسال الإشعارات عبر Resend
    const resendKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || "skillupyouth.eg@gmail.com";
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL || "SkillUp <onboarding@resend.dev>";

    if (!resendKey) {
      return NextResponse.json({
        ok: true,
        note: "Application saved to database, but RESEND_API_KEY is missing so no email was sent."
      });
    }

    const resend = new Resend(resendKey);

    // قالب البريد الإلكتروني الكامل والتفصيلي لإدارة المبادرة
    const htmlToTeam = `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;">
        <h2 style="margin:0 0 16px;">New Join Request — SkillUp</h2>

        <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">
          ${renderField("Full Name", full_name)}
          ${renderField("National ID", payload.national_id)}
          ${renderField("Email", email)}
          ${renderField("Phone", payload.phone)}
          ${renderField("City", payload.city)}
          ${renderField("Age", payload.age)}
          ${renderField("Membership Status", payload.member_status)}
          ${renderField("Leadership Interest", payload.leadership_interest)}
          ${renderField("Education Status", payload.education)}
          ${renderField("Academic Grade", payload.grade)}
          ${renderField("University / Institute", payload.university)}
          ${renderField("Faculty", payload.faculty)}
          ${renderField("Department", payload.department)}
          ${renderField("Postgraduate Info", payload.postgrad_info)}
          ${renderField("Graduation Year", payload.graduation_year)}
          ${renderField("Profile Picture URL", payload.profile_picture_url)}
          ${renderField("Target Sector", sector_key)}
          ${renderField("Preferred Role", payload.preferred_role)}
          ${renderField("Availability", payload.availability)}
          ${renderField("How did they hear about us", payload.heard_about_us)}
          ${renderField("Core Skills", payload.skills)}
          ${renderField("LinkedIn", payload.linkedin)}
          ${renderField("Facebook", payload.facebook)}
          ${renderField("Portfolio", payload.portfolio)}
          ${renderField("Resume (Drive Link)", payload.resume_url)}
        </table>

        <div style="margin-top:16px;">
          <div style="font-weight:700;margin-bottom:8px;">Experience / Previous Activities:</div>
          <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#fafafa;padding:12px;border-radius:10px;margin-bottom:16px;">
            ${escapeHtml(payload.experience)}
          </div>

          <div style="font-weight:700;margin-bottom:8px;">Why do they want to join SkillUp?</div>
          <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#fafafa;padding:12px;border-radius:10px;">
            ${escapeHtml(message)}
          </div>
        </div>
      </div>
    `;

    const teamRes = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `SkillUp Join — ${full_name} (${sector_key})`,
      html: htmlToTeam
    });

    if (teamRes.error) {
      return NextResponse.json({
        ok: true,
        note: `Application saved to database, but team email failed: ${teamRes.error.message}`
      });
    }

    // قالب الرد التلقائي الآمن للمتقدم لمنع أي كسر برميجي بالرموز الخاصة
    const applicantHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;">
        <h2 style="margin:0 0 16px;">SkillUp — Application Received</h2>
        <p>Hi ${escapeHtml(full_name)},</p>
        <p>We received your application successfully and it is now under review.</p>
        <p>Our team will contact you soon if there is a next step.</p>

        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />

        <h3 style="margin:0 0 12px;">تم استلام طلبك</h3>
        <p>مرحبًا ${escapeHtml(full_name)}،</p>
        <p>تم استلام طلب الانضمام الخاص بك بنجاح، وهو الآن قيد المراجعة.</p>
        <p>سيقوم فريق SkillUp بالتواصل معك في أقرب وقت إذا كانت هناك خطوة تالية.</p>

        <p style="margin-top:24px;font-size:12px;color:#6b7280;">SkillUp Team</p>
      </div>
    `;

    const applicantRes = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "SkillUp — Application Received | تم استلام طلبك",
      html: applicantHtml
    });

    if (applicantRes.error) {
      return NextResponse.json({
        ok: true,
        note: `Team email sent successfully, but applicant auto-reply failed: ${applicantRes.error.message}`
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Server error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
