import express from "express";
import { register, login, getMe, verifyEmail, resendVerification } from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-verification", resendVerification);
router.get("/auth/me", authRequired, getMe);

export default router;