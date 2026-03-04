// functions/src/index.ts
// Cloud Functions:
// 1. onNewContactMessage — triggered on new "messages" document
// 2. onNewBugReport — triggered on new "bug-reports" document
//
// Both send email notifications via Gmail SMTP.

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {defineSecret} from "firebase-functions/params";
import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";

admin.initializeApp();

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPass = defineSecret("GMAIL_APP_PASS");

// ── Helper: create transporter ──
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser.value(),
      pass: gmailAppPass.value(),
    },
  });
}

// ── Helper: format timestamp ──
function formatTimestamp(createdAt: any): string {
  return createdAt?.toDate ?
    createdAt.toDate().toLocaleString("hu-HU", {
      timeZone: "Europe/Budapest",
    }) :
    new Date().toLocaleString("hu-HU", {
      timeZone: "Europe/Budapest",
    });
}

// ══════════════════════════════════════════════════════════
// 1. Contact Message Notification
// ══════════════════════════════════════════════════════════

export const onNewContactMessage = onDocumentCreated(
  {
    document: "messages/{messageId}",
    secrets: [gmailUser, gmailAppPass],
    region: "europe-west1",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data in event");
      return;
    }

    const data = snapshot.data();
    const name = data.name as string;
    const email = data.email as string;
    const subject = data.subject as string;
    const message = data.message as string;
    const timestamp = formatTimestamp(data.createdAt);

    const transporter = createTransporter();

    const htmlBody = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',
  sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);
    padding:24px 32px;border-radius:12px 12px 0 0;">
    <h2 style="color:#63B3ED;margin:0 0 4px;font-size:18px;">
      Új üzenet érkezett! 📬</h2>
    <p style="color:#8896AB;margin:0;font-size:13px;">
      Portfolio kapcsolatfelvételi űrlap</p>
  </div>
  <div style="background:#0d1117;padding:24px 32px;
    border:1px solid #1e293b;border-top:none;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;width:80px;
          vertical-align:top;">Név</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#F0F4F8;font-size:14px;
          font-weight:600;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;vertical-align:top;">Email</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;">
          <a href="mailto:${escapeHtml(email)}"
            style="color:#63B3ED;font-size:14px;
            text-decoration:none;">${escapeHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;vertical-align:top;">Tárgy</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#F0F4F8;font-size:14px;">${escapeHtml(subject)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#8896AB;font-size:13px;
          vertical-align:top;">Üzenet</td>
        <td style="padding:12px 0;color:#CBD5E0;font-size:14px;
          line-height:1.6;
          white-space:pre-wrap;">${escapeHtml(message)}</td>
      </tr>
    </table>
  </div>
  <div style="background:#0a0e14;padding:16px 32px;
    border-radius:0 0 12px 12px;border:1px solid #1e293b;
    border-top:none;">
    <p style="color:#5A6B80;margin:0;font-size:12px;">
      📅 ${timestamp} ·
      <a href="mailto:${escapeHtml(email)}?subject=Re:%20${encodeURIComponent(subject)}"
        style="color:#63B3ED;text-decoration:none;">↩ Válasz küldése</a>
    </p>
  </div>
</div>`;

    const textBody = [
      "Új üzenet érkezett a portfolió oldalról!",
      "",
      `Név:     ${name}`,
      `Email:   ${email}`,
      `Tárgy:   ${subject}`,
      `Időpont: ${timestamp}`,
      "",
      "Üzenet:",
      message,
      "",
      "---",
      `Válasz: mailto:${email}`,
    ].join("\n");

    const mailOptions = {
      from: `"Portfolio Contact" <${gmailUser.value()}>`,
      to: gmailUser.value(),
      replyTo: email,
      subject: `📬 Portfolio: ${subject}`,
      html: htmlBody,
      text: textBody,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent for message from ${name} <${email}>`);
    } catch (error) {
      console.error("❌ Failed to send email:", error);
    }
  }
);

// ══════════════════════════════════════════════════════════
// 2. Bug Report Notification
// ══════════════════════════════════════════════════════════

const severityColors: Record<string, string> = {
  low: "#22C55E",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

const severityLabels: Record<string, string> = {
  low: "Alacsony",
  medium: "Közepes",
  high: "Magas",
  critical: "Kritikus",
};

const categoryLabels: Record<string, string> = {
  ui: "🎨 Felület",
  functionality: "⚙️ Funkció",
  performance: "⚡ Teljesítmény",
  translation: "🌍 Fordítás",
  other: "📋 Egyéb",
};

export const onNewBugReport = onDocumentCreated(
  {
    document: "bug-reports/{reportId}",
    secrets: [gmailUser, gmailAppPass],
    region: "europe-west1",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data in event");
      return;
    }

    const data = snapshot.data();
    const category = data.category as string;
    const severity = data.severity as string;
    const title = data.title as string;
    const description = data.description as string;
    const reproduceSteps = data.reproduceSteps as string || "";
    const email = data.email as string || "";
    const timestamp = formatTimestamp(data.createdAt);
    const sevColor = severityColors[severity] || "#F59E0B";
    const sevLabel = severityLabels[severity] || severity;
    const catLabel = categoryLabels[category] || category;

    const transporter = createTransporter();

    const stepsRow = reproduceSteps ? `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;vertical-align:top;">Lépések</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#CBD5E0;font-size:14px;line-height:1.6;
          white-space:pre-wrap;">${escapeHtml(reproduceSteps)}</td>
      </tr>` : "";

    const emailRow = email ? `
      <tr>
        <td style="padding:12px 0;color:#8896AB;font-size:13px;
          vertical-align:top;">Email</td>
        <td style="padding:12px 0;">
          <a href="mailto:${escapeHtml(email)}"
            style="color:#63B3ED;font-size:14px;
            text-decoration:none;">${escapeHtml(email)}</a></td>
      </tr>` : "";

    const htmlBody = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',
  sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);
    padding:24px 32px;border-radius:12px 12px 0 0;">
    <h2 style="color:#EF4444;margin:0 0 4px;font-size:18px;">
      Új hibajelentés érkezett! 🐛</h2>
    <p style="color:#8896AB;margin:0;font-size:13px;">
      Portfolio hibabejelentő</p>
  </div>
  <div style="background:#0d1117;padding:24px 32px;
    border:1px solid #1e293b;border-top:none;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;width:100px;
          vertical-align:top;">Kategória</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#F0F4F8;font-size:14px;
          font-weight:600;">${escapeHtml(catLabel)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;vertical-align:top;">Súlyosság</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;">
          <span style="display:inline-block;padding:2px 10px;
            border-radius:12px;font-size:13px;font-weight:600;
            color:${sevColor};
            background:${sevColor}22;">${escapeHtml(sevLabel)}</span></td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;vertical-align:top;">Cím</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#F0F4F8;font-size:14px;
          font-weight:600;">${escapeHtml(title)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#8896AB;font-size:13px;vertical-align:top;">Leírás</td>
        <td style="padding:12px 0;border-bottom:1px solid #1e293b;
          color:#CBD5E0;font-size:14px;line-height:1.6;
          white-space:pre-wrap;">${escapeHtml(description)}</td>
      </tr>${stepsRow}${emailRow}
    </table>
  </div>
  <div style="background:#0a0e14;padding:16px 32px;
    border-radius:0 0 12px 12px;border:1px solid #1e293b;
    border-top:none;">
    <p style="color:#5A6B80;margin:0;font-size:12px;">
      📅 ${timestamp}${email ? ` · <a href="mailto:${escapeHtml(email)}?subject=Re:%20Bug:%20${encodeURIComponent(title)}" style="color:#63B3ED;text-decoration:none;">↩ Válasz</a>` : ""}
    </p>
  </div>
</div>`;

    const textBody = [
      "Új hibajelentés érkezett a portfolió oldalról!",
      "",
      `Kategória:  ${catLabel}`,
      `Súlyosság:  ${sevLabel}`,
      `Cím:        ${title}`,
      `Időpont:    ${timestamp}`,
      "",
      "Leírás:",
      description,
      ...(reproduceSteps ? ["", "Reprodukálási lépések:", reproduceSteps] : []),
      ...(email ? ["", `Bejelentő email: ${email}`] : []),
      "",
      "---",
    ].join("\n");

    const mailOptions = {
      from: `"Portfolio Bug Report" <${gmailUser.value()}>`,
      to: gmailUser.value(),
      ...(email ? {replyTo: email} : {}),
      subject: `🐛 Bug [${sevLabel}]: ${title}`,
      html: htmlBody,
      text: textBody,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Bug report email sent: "${title}" [${severity}]`);
    } catch (error) {
      console.error("❌ Failed to send bug report email:", error);
    }
  }
);

/**
 * Escape HTML entities to prevent XSS in the email body.
 * @param {string} text - The text to escape
 * @return {string} The escaped text
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
