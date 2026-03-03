import { Router } from "express";
import {
  signUp,
  signIn,
  logOut,
  refreshAccessToken,
  changeCurrentPassword,
  verifyEmail,
  googleRedirect,
  googleCallback,
  forgotPassword,
  resetPassword
} from "../controller/auth.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/signUp", signUp);
router.post("/signIn", signIn);
router.get("/verify-email", verifyEmail);

// Google OAuth routes
router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);

// Semi-protected routes (uses refresh token)
router.post("/refresh", refreshAccessToken);

// Protected routes (require access token)
router.post("/logOut", verifyJwt, logOut);
router.post("/changePassword", verifyJwt, changeCurrentPassword);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;