import SibApiV3Sdk from 'sib-api-v3-sdk';

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const api = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendVerificationEmail = async (toEmail, token) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const emailData = {
    sender: { name: 'PhotoJugaad', email: process.env.BREVO_SENDER_EMAIL },
    to: [{ email: toEmail }],
    subject: "Verify your email",
    htmlContent: `
      <p>Welcome to <b>PhotoJugaad</b> 🎉</p>
      <p>Click <a href="${verificationLink}">here</a> to verify your email.</p>
      <p>This link expires in 24 hours.</p>
    `
  };

  try {
    const response = await api.sendTransacEmail(emailData);
    console.log("✅ Verification email sent:", response.messageId || response);
  } catch (error) {
    console.error("❌ Email sending failed:", error?.response?.text || error.message);
    throw error;
  }
};
