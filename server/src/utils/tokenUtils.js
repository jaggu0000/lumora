import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateToken = (user) => {
	return jwt.sign(
		{
			userId: user._id.toString(),
			username: user.username,
			role: user.role,
		},
		env.JWT_SECRET_KEY,
		{ expiresIn: "5h" }
	);
};

export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET_KEY);

export const decodeToken = (token) => jwt.decode(token);
