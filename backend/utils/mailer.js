import nodemailer from "nodemailer";

const brevoApiKey = process.env.BREVO_API_KEY;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = Number(process.env.SMTP_PORT) || 2525;

let transporter = null;
if (!brevoApiKey && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
}

const from = process.env.EMAIL_FROM || (smtpUser ? `Expense Tracker <${smtpUser}>` : "Expense Tracker");

const clientUrl = () =>
  process.env.CLIENT_URL || "http://localhost:3000";

export const buildVerificationLink = (token) =>
  `${clientUrl()}/verify-email?token=${encodeURIComponent(token)}`;

const html = (name, link) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;padding:24px">
    <h2 style="color:#059669">Welcome${name ? `, ${name}` : ""}!</h2>
    <p>Thanks for signing up for Expense Tracker. Confirm your email address to finish creating your account and start splitting expenses.</p>
    <p>
      <a href="${link}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px">
        Verify my email
      </a>
    </p>
    <p style="color:#64748b;font-size:13px">Or copy this link: ${link}</p>
    <p style="color:#94a3b8;font-size:12px">This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.</p>
  </div>
`;

const sendViaBrevoApi = async ({ to, name, link }) => {
  const senderMatch = String(from).match(/^(.*?)\s*<([^>]+)>$/);
  const senderEmail = senderMatch ? senderMatch[2] : from;
  const senderName = senderMatch ? senderMatch[1].trim() : "Expense Tracker";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": brevoApiKey,
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to, name: name || to }],
      subject: "Verify your email — Expense Tracker",
      htmlContent: html(name, link),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo API ${res.status}: ${text.slice(0, 300)}`);
  }
  return { sent: true, dev: false };
};

export const sendVerificationEmail = async ({ to, name, link }) => {
  if (brevoApiKey) return sendViaBrevoApi({ to, name, link });
  if (transporter) {
    await transporter.sendMail({
      from,
      to,
      subject: "Verify your email — Expense Tracker",
      html: html(name, link),
    });
    return { sent: true, dev: false };
  }
  console.log(`[mailer:dev] Verification email for ${to}\n${link}`);
  return { sent: false, dev: true };
};

if (brevoApiKey) {
  console.log(`[mailer] Brevo REST API ready (sender: ${from})`);
} else if (transporter) {
  console.log(`[mailer] SMTP ready -> ${smtpHost}:${smtpPort} as ${smtpUser}`);
} else {
  console.log(`[mailer] Email NOT configured; will log links to console (dev mode)`);
}