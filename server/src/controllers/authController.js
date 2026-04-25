import {
	addNewUser,
	loginUser,
	verifySignupOtp,
	resendSignupOtp,
	sendForgotPasswordOtp,
	resetPassword,
} from "../services/authServices.js";
import { generateToken } from "../utils/tokenUtils.js";

const cookieOptions = (isProduction) => ({
	httpOnly: true,
	secure: isProduction,
	sameSite: isProduction ? "none" : "strict",
});

// User Signup — creates user, sends OTP, does NOT set cookie
export const signup = async (req, res) => {
	try {
		await addNewUser(req.body);
		res.status(201).json({
			status: "Success",
			message: "OTP sent to your email. Please verify your account.",
		});
	} catch (error) {
		res.status(500).json({
			status: "Error",
			message: "User registration failed",
			error: error.message,
		});
	}
};

// Verify OTP after signup
export const verifyOtp = async (req, res) => {
	try {
		const { email, otp } = req.body;
		if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

		await verifySignupOtp(email, otp);
		res.status(200).json({ success: true, message: "Email verified successfully. You can now log in." });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

// Resend signup OTP
export const resendOtp = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ success: false, message: "Email is required" });

		await resendSignupOtp(email);
		res.status(200).json({ success: true, message: "OTP resent successfully" });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

// Forgot password — sends OTP to email
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ success: false, message: "Email is required" });

		await sendForgotPasswordOtp(email);
		res.status(200).json({ success: true, message: "OTP sent to your email" });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

// Reset password — validate OTP and set new password
export const resetPasswordHandler = async (req, res) => {
	try {
		const { email, otp, newPassword } = req.body;
		if (!email || !otp || !newPassword)
			return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
		if (newPassword.length < 6)
			return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

		await resetPassword(email, otp, newPassword);
		res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

// User Login
export const login = async (req, res) => {
	try {
		const { identifier, password } = req.body;
		const { user, token } = await loginUser(identifier, password);

		const isProduction = process.env.NODE_ENV === "production";
		res.cookie("token", token, cookieOptions(isProduction));

		res.status(200).json({
			success: true,
			token,
			data: {
				username: user.username,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		const isUnverified = error.message.includes("verify your email");
		res.status(isUnverified ? 403 : 401).json({
			success: false,
			message: error.message,
			unverified: isUnverified,
		});
	}
};

// User Logout
export const logout = async (req, res) => {
	try {
		const isProduction = process.env.NODE_ENV === "production";
		res.clearCookie("token", cookieOptions(isProduction));
		res.status(200).json({ success: true, message: "Logged out successfully" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};
