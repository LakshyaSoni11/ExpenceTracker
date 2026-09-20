import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 465;

const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
      })
    : null;

if (transporter) {
  console.log(`[mailer] SMTP ready -> ${smtpHost}:${smtpPort} as ${smtpUser}`);
} else {
  console.log(`[mailer] SMTP NOT configured (missing SMTP_USER/PASS); will log links to console instead`);
}

const from = process.env.EMAIL_FROM || (smtpUser ? `Expense Tracker <${smtpUser}>` : "Expense Tracker");

const clientUrl = () =>
  process.env.CLIENT_URL || "http://localhost:3000";

export const buildVerificationLink = (token) =>
  `${clientUrl()}/verify-email?token=${encodeURIComponent(token)}`;

export const sendVerificationEmail = async ({ to, name, link }) => {
  if (!transporter) {
    console.log(`[mailer:dev] Verification email for ${to}\n${link}`);
    return { sent: false, dev: true };
  }
  await transporter.sendMail({
    from,
    to,
    subject: "Verify your email — Expense Tracker",
    html: `
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
    `,
  });
  return { sent: true, dev: false };
};