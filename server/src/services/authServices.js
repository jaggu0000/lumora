import User from "../models/UserDB/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/tokenUtils.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";
import { sendOtpEmail } from "../utils/sendOtp.js";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Creates a new user and sends signup OTP
export const addNewUser = async (data) => {
	const { username, email, password } = data;

	const hashPassword = await bcrypt.hash(password, 10);
	const otp = generateOtp();
	const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

	const newUser = new User({
		username,
		email,
		password: hashPassword,
		role: "user",
		verified: false,
		otp,
		otpExpiry,
	});

	const user = await newUser.save();
	if (!user) throw new Error("Failed to create user");

	const newUserMetadata = new UserMetadata({ userId: user._id });
	const userMetadata = await newUserMetadata.save();
	if (!userMetadata) throw new Error("Failed to create user metadata");

	await sendOtpEmail(email, otp, "verify");

	return user;
};

// Verifies signup OTP and marks user as verified
export const verifySignupOtp = async (email, otp) => {
	const user = await User.findOne({ email }).select("+otp +otpExpiry");
	if (!user) throw new Error("User not found");
	if (user.verified) throw new Error("Account already verified");
	if (!user.otp || user.otp !== otp) throw new Error("Invalid OTP");
	if (user.otpExpiry < new Date()) throw new Error("OTP has expired");

	await User.updateOne({ email }, { $set: { verified: true }, $unset: { otp: "", otpExpiry: "" } });
};

// Resends OTP for signup verification
export const resendSignupOtp = async (email) => {
	const user = await User.findOne({ email });
	if (!user) throw new Error("User not found");
	if (user.verified) throw new Error("Account already verified");

	const otp = generateOtp();
	const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
	await User.updateOne({ email }, { $set: { otp, otpExpiry } });

	await sendOtpEmail(email, otp, "verify");
};

// Sends OTP for password reset
export const sendForgotPasswordOtp = async (email) => {
	const user = await User.findOne({ email });
	if (!user) throw new Error("No account found with that email");

	const otp = generateOtp();
	const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
	await User.updateOne({ email }, { $set: { otp, otpExpiry } });

	await sendOtpEmail(email, otp, "reset");
};

// Validates reset OTP and updates password
export const resetPassword = async (email, otp, newPassword) => {
	const user = await User.findOne({ email }).select("+otp +otpExpiry");
	if (!user) throw new Error("User not found");
	if (!user.otp || user.otp !== otp) throw new Error("Invalid OTP");
	if (user.otpExpiry < new Date()) throw new Error("OTP has expired");

	const hashedPassword = await bcrypt.hash(newPassword, 10);
	await User.updateOne({ email }, { $set: { password: hashedPassword }, $unset: { otp: "", otpExpiry: "" } });
};

// User login — blocks unverified accounts
export const loginUser = async (identifier, password) => {
	const user = await User.findOne({
		$or: [{ email: identifier }, { username: identifier }],
	}).select("+password");
	if (!user) throw new Error("A user doesn't exist with this email or username");

	if (!user.verified) throw new Error("Please verify your email before logging in");

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) throw new Error("Wrong Password");

	const token = generateToken(user);
	user.password = undefined;

	return { user, token };
};

// Helper for validator
export const checkUsernameExistence = async (username) => {
	const existingUsername = await User.findOne({ username });
	return !!existingUsername;
};

// Helper for validator
export const checkEmailExistence = async (email) => {
	const existingEmail = await User.findOne({ email });
	return !!existingEmail;
};
