import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

/**
 * Send an email. Falls back to console logging when SMTP is not configured.
 * Always resolves — email failures are caught and returned as { success: false, error }.
 */
export async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();

  if (!t) {
    // Dev mode: log instead of send
    console.log(`\n📧 [EMAIL LOG] ─────────────────────────`);
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${(text || html || '').slice(0, 200)}`);
    console.log(`──────────────────────────────────────────\n`);
    return { success: true, preview: 'logged-to-console' };
  }

  try {
    const info = await t.sendMail({
      from: `"RecruitPro ERP" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: html || `<pre>${text}</pre>`,
      text: text || subject,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}
