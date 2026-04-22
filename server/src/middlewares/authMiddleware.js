import env from "../config/env.js";
import User from "../models/UserDB/User.js";
import { verifyToken as verifyJwt } from "../utils/tokenUtils.js";

export const authenticate = async (req, res, next) => {
	try {
		// Try to get token from cookie first, then fall back to Authorization header
		let token = req.cookies.token;

		if (!token) {
			const auth = req.headers.authorization || "";
			const [scheme, headerToken] = auth.split(" ");
			if (scheme === "Bearer" && headerToken) {
				token = headerToken;
			}
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Token not provided",
			});
		}

		const { userId, role } = verifyJwt(token);
		req.auth = { userId, role };

		const user = await User.findById(userId).select("-password");
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Authentication failed:", error.message);
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

export const isUser = (req, res, next) => {
	if (req.auth.role !== "user") {
		return res.status(403).json({
			success: false,
			message: "Forbidden: User access required",
		});
	}
	next();
};

export const isAdmin = (req, res, next) => {
	if (req.auth.role !== "admin") {
		return res.status(403).json({
			success: false,
			message: "Forbidden: Admin access required",
		});
	}
	next();
};
