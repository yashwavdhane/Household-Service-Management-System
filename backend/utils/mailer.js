const nodemailer = require("nodemailer");

/**
 * Creates Nodemailer transporter if SMTP environment variables exist.
 * Otherwise returns null, triggering fallback simulation logging.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
      auth: { user, pass },
    });
  }

  // Common shortcut for Gmail service if SMTP_HOST not set
  if (user && pass && !host) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return null;
};

/**
 * Send an email with fallback simulation in development
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || `"Household Services" <${process.env.SMTP_USER || "no-reply@hsms.local"}>`;

  if (!transporter) {
    console.log(`\n📧 [EMAIL SIMULATION - No SMTP configured]`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${text || html?.replace(/<[^>]*>/g, "")}`);
    console.log(`   💡 Tip: Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env to send real emails.\n`);
    return { simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`📧 Email delivered to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send password reset OTP email
 */
const sendOtpEmail = async ({ to, name, otp }) => {
  const subject = "Your Password Reset OTP - Household Services";
  const text = `Hello ${name || "User"},\n\nYour 6-digit OTP for resetting your password is: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this message.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 15px;">Hello <strong>${name || "User"}</strong>,</p>
      <p style="color: #475569; font-size: 15px;">We received a request to reset your password. Use the verification code below to proceed:</p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 12px 28px; background: #f1f5f9; color: #0f172a; border-radius: 8px; border: 1px dashed #cbd5e1;">
          ${otp}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code is valid for <strong>10 minutes</strong>. For your security, do not share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
};
