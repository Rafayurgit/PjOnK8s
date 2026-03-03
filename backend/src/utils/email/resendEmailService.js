// src/utils/emailService.js
import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send verification email via Resend
 * @param {string} toEmail
 * @param {string} token
 */
export const sendVerificationEmail = async (toEmail, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const from = process.env.MAIL_FROM || "DesiPix <onboarding@resend.dev>";

  const html = `
    <div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111;">
      <h2>Welcome to <strong>DesiPix</strong> 🎉</h2>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}" target="_blank" rel="noopener">Verify your email</a></p>
      <p style="font-size:0.9rem;color:#666">This link expires in 24 hours.</p>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from,
      to: toEmail,
      subject: "Verify your email — DesiPix",
      html,
    });

    console.log("✅ Resend: verification email queued:", { id: response.id, to: toEmail });
    return response;
  } catch (err) {
    // Resend returns useful error objects — log fully for debugging
    console.error("❌ Resend email failed:", err);
    // Re-throw so calling code can handle (your current code catches and logs)
    throw err;
  }
};

export const sendPasswordResetEmail = async (toEmail, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const emailData = {
    from: "noreply@desipix.com",
    to: toEmail,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
      <p>This link expires in 20 minutes.</p>
    `,
  };

  await resend.emails.send(emailData);
};

