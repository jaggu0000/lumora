import express from "express";
import { userRegistrationValidation, userLoginValidation } from "../validators/authValidator.js";
import { login, logout, signup, verifyOtp, resendOtp, forgotPassword, resetPasswordHandler } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/signup", userRegistrationValidation, signup);
authRouter.post("/login", userLoginValidation, login);
authRouter.post("/logout", logout);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/resend-otp", resendOtp);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPasswordHandler);

export default authRouter;
