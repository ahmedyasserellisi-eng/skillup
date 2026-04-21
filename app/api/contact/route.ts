import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

function normalizeCategory(value: string) {
  const allowed = new Set(["general", "partnership", "volunteering", "media"]);
  return allowed.has(value) ? value : "general";
}

function categoryLabel(category: string) {
  switch (category) {
    case "partnership":
      return "Partnership";
    case "volunteering":
      return "Volunteering";
    case "media":
      return "Media";
    default:
      return "General";
  }
}

function renderField(label: string, value: unknown) {
  const safeValue =
    value === null || value === undefined || String(value).trim() === ""
      ? "-"
      : escapeHtml(String(value));

  return `
    <tr>
      <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#fafafa;font-weight:600;width:180px;">
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
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // يدعم الفورمتين: name أو full_name
    const full_name = safeStr(body.full_name || body.name);
    const email = safeStr(body.email);
    const category = normalizeCategory(safeStr(body.category || "general"));
    const subject = nullableStr(body.subject);
    const message = safeStr(body.message);

    if (!full_name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

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

    const payload = {
      full_name,
      email,
      category,
      subject,
      message,
      status: "new"
    };

    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert(payload);

    if (dbError) {
      return NextResponse.json(
        { ok: false, error: dbError.message },
        { status: 500 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || "skillupyouth.eg@gmail.com";
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL || "SkillUp <onboarding@resend.dev>";

    if (!resendKey) {
      return NextResponse.json({
        ok: true,
        note: "Message saved to database, but email is not configured."
      });
    }

    const resend = new Resend(resendKey);

    const teamSubject = subject
      ? `SkillUp Contact — [${categoryLabel(category)}] ${subject}`
      : `SkillUp Contact — [${categoryLabel(category)}] New message`;

    const htmlToTeam = `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;">
        <h2 style="margin:0 0 16px;">New Contact Message — SkillUp</h2>

        <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">
          ${renderField("Full name", full_name)}
          ${renderField("Email", email)}
          ${renderField("Category", categoryLabel(category))}
          ${renderField("Subject", subject)}
        </table>

        <div style="margin-top:16px;">
          <div style="font-weight:700;margin-bottom:8px;">Message</div>
          <div style="white-space:pre-wrap;border:1px solid #e5e7eb;background:#fafafa;padding:12px;border-radius:10px;">
            ${escapeHtml(message)}
          </div>
        </div>
      </div>
    `;

    const { error: teamMailError } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: teamSubject,
      html: htmlToTeam
    });

    if (teamMailError) {
      return NextResponse.json({
        ok: true,
        note: `Message saved to database, but team email failed: ${teamMailError.message}`
      });
    }

    const htmlToSender = `
      <div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;">
        <h2 style="margin:0 0 16px;">SkillUp — Message Received</h2>
        <p>Hi ${escapeHtml(full_name)},</p>
        <p>We received your message successfully and our team will review it soon.</p>
        <p>Thank you for contacting SkillUp.</p>

        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />

        <h3 style="margin:0 0 12px;">تم استلام رسالتك</h3>
        <p>مرحبًا ${escapeHtml(full_name)}،</p>
        <p>تم استلام رسالتك بنجاح، وسيقوم فريق SkillUp بمراجعتها والرد عليك قريبًا.</p>
        <p>شكرًا لتواصلك معنا.</p>

        <p style="margin-top:24px;font-size:12px;color:#6b7280;">SkillUp Team</p>
      </div>
    `;

    const { error: senderMailError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "SkillUp — We received your message | تم استلام رسالتك",
      html: htmlToSender
    });

    if (senderMailError) {
      return NextResponse.json({
        ok: true,
        note: `Team email sent successfully, but auto-reply failed: ${senderMailError.message}`
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