import crypto from "crypto";

export const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return { token, expiry };
};
