import dotenv from "dotenv";

dotenv.config({ quiet: true });

const env = {
	SERVER_PORT: process.env.PORT || 3000,
	CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
	CONNECTION_STRING_USER: process.env.CONNECTION_STRING_USER,
	CONNECTION_STRING_COMMUNITY: process.env.CONNECTION_STRING_COMMUNITY,
	CONNECTION_STRING_ADMIN: process.env.CONNECTION_STRING_ADMIN,
	JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
	JWT: process.env.JWT,
	OPENROUTER_API_KEY: process.env.API_KEY,
	RESEND_API_KEY: process.env.RESEND_API_KEY,
};

export default env;
