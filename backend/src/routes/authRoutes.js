import express from "express";
import { signup, login, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

/* SIGNUP */
router.post("/signup", signup);

/* LOGIN → SEND OTP */
router.post("/login", login);

/* VERIFY OTP */
router.post("/verify-otp", verifyOtp);

export default router;