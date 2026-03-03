import dotenv from "dotenv";
dotenv.config();
import { randomBytes } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/auth/generateToken.js";
import jwt from "jsonwebtoken";
import { generateVerificationToken } from "../utils/auth/tokenHelpers.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email/resendEmailService.js";

// const isProduction = process.env.NODE_ENV === "production";

// // FIXED: Cookie options - if sameSite=none, secure MUST be true
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true in production
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// export const cookieOptions = {
//   httpOnly: true,
//   secure: false, // false for localhost; true in production
//   sameSite: "lax", // ⬅️ REQUIRED for cross-origin cookies
//   path: "/",
//   maxAge: 7 * 24 * 60 * 60 * 1000,
// };

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // e.g. https://your-backend.com/auth/google/callback
);

export const googleRedirect = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline", // ask for refresh token at first consent
    prompt: "consent",
    scope: ["openid", "profile", "email"],
  });
  return res.redirect(url);
};

export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.redirect(`${process.env.CLIENT_URL}/auth/failure`);

    const { tokens } = await oauth2Client.getToken(code);
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name;
    const avatar = payload.picture;
    const emailVerified = payload.email_verified;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = "google";
        user.isVerified = user.isVerified || emailVerified;
        user.avatar = user.avatar || avatar;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      const baseUsername =
        email?.split("@")[0] ||
        fullName?.replace(/\s+/g, "").toLowerCase() ||
        `user${Date.now()}`;
      let username = baseUsername.toLowerCase();

      let suffix = 0;
      while (await User.findOne({ username })) {
        suffix++;
        username = `${baseUsername}${suffix}`;
      }

      const randomPassword = Math.random().toString(36).slice(2, 12);

      user = await User.create({
        fullName,
        username,
        email,
        password: randomPassword,
        googleId,
        provider: "google",
        avatar,
        isVerified: emailVerified,
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .redirect(`${process.env.CLIENT_URL}/auth/google/callback`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.redirect(`${process.env.CLIENT_URL}/login`);
  }
};

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("❌ User not found:", userId);
      throw new Error("User not found");
    }

    console.log("✅ User found:", user._id);
    console.log(
      "🔑 ACCESS_SECRET:",
      process.env.JWT_ACCESS_SECRET ? "Loaded" : "MISSING"
    );
    console.log(
      "🔑 REFRESH_SECRET:",
      process.env.JWT_REFRESH_SECRET ? "Loaded" : "MISSING"
    );

    const accessToken = await generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    // throw new Error(
    //   "Something went wrong while generating refresh and access token"
    // );
    throw error;
  }
};

const signUp = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    if (
      [fullName, username, email, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existUser) {
      return res
        .status(409)
        .json({ error: "User with email or username already exist" });
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
    });

    const { token, expiry } = generateVerificationToken();
    user.verificationToken = token;
    user.verificationTokenExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user.email, token);
    } catch (err) {
      console.error("Email sending failed:", err);
      // optionally continue without blocking signup
    }

    //now to send user data back to frontend for keeping it login
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      return res
        .status(500)
        .json({ error: "something went wrong while registering user" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({ message: "User created successfully", user: createdUser });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const signIn = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email)
    return res.status(400).json({ error: "Email or username required" });

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    return res.status(404).json({ error: "User does not exist SingUP first!" });
  }

  if (!user.isVerified) {
    // Optionally send a new verification email
    try {
      const { token, expiry } = generateVerificationToken();
      user.verificationToken = token;
      user.verificationTokenExpiry = expiry;
      await user.save({ validateBeforeSave: false });

      await sendVerificationEmail(user.email, token);
    } catch (err) {
      console.error("Failed to resend verification email:", err);
      // continue without blocking login
    }

    return res.status(403).json({
      error: "Please verify your email before logging in.",
      message: "A new verification email has been sent to your inbox.",
    });
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ error: "Invalid Password" });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
    console.log("🍪 Setting cookies with options:", cookieOptions);
  console.log("🔑 Access Token Length:", accessToken?.length);
  console.log("🔑 Refresh Token Length:", refreshToken?.length);

   console.log("📤 Response headers:", response.getHeaders?.());

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({ message: "User loggedIn successfully", accessToken: accessToken, user: loggedUser  });
};

const logOut = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({ message: " User logged Out " });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const refreshAccessToken = async (req, res) => {
  console.log("All cookies received:", req.headers.cookie);
  console.log("req.cookies object:", req.cookies);

  console.log("Cookies received:", req.cookies);
  console.log("Body received:", req.body);

  const incomingRefreshToken = req.cookies?.refreshToken || null;
  console.log("Incoming refresh token:", incomingRefreshToken);

  if (!incomingRefreshToken) {
    console.error("No refresh token found in cookies");
    return res.status(401).json({ error: "Unauthorized request" });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    const user = await User.findById(decodedToken._id);

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(401).json({ error: "Refresh Token expired or used" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({ message: "Access token refreshed", accessToken: accessToken });
  } catch (error) {
    return res
      .status(401)
      .json({ error: error.message || "Invalid refresh token" });
  }
};

const changeCurrentPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    return res.status(400).json({ error: "Invalid old password" });
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ message: "Password changes successfully" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "No user found with this email" });
  }

  // const resetToken = crypto.randomBytes(32).toString("hex");
  const resetToken = randomBytes(32).toString("hex");

  const resetTokenExpiry = Date.now() + 1000 * 60 * 20; // 20 mins

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiry = resetTokenExpiry;
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (error) {
    console.error("Failed to send reset email:", error);
  }

  return res.json({ message: "Password reset email sent" });
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: "Invalid request" });

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  return res.json({ message: "Password reset successfully" });
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token missing" });

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ message: "Email verified successfully" });
};

export {
  signUp,
  signIn,
  logOut,
  refreshAccessToken,
  changeCurrentPassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
