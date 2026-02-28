// functions/src/index.ts
// Cloud Function: onNewContactMessage
//
// Triggered when a new document is created in the "messages" collection.
// Sends an email notification via Gmail SMTP.

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {defineSecret} from "firebase-functions/params";
import * as nodemailer from "nodemailer";
import * as admin from "firebase-admin";

admin.initializeApp();

const gmailUser = defineSecret("GMAIL_USER");
const gmailAppPass = defineSecret("GMAIL_APP_PASS");

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
    const createdAt = data.createdAt;

    const timestamp = createdAt?.toDate ?
      createdAt.toDate().toLocaleString("hu-HU", {
        timeZone: "Europe/Budapest",
      }) :
      new Date().toLocaleString("hu-HU", {
        timeZone: "Europe/Budapest",
      });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser.value(),
        pass: gmailAppPass.value(),
      },
    });

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
