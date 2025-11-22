import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { authenticate, isUser } from "./middlewares/authMiddleware.js";
import env from "./config/env.js";
import { communityAdminRouter, communityRouter } from "./routes/communityRoutes.js";

const app = express();

app.use(
	cors({
		origin: env.CLIENT_URL,
		credentials: true, // Allow cookies to be sent
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);
app.use(express.json());
app.use(cookieParser());

// User Routes
app.use("/auth", authRouter);
app.use("/user/community/admin", authenticate, isUser, communityAdminRouter);
app.use("/user/community", authenticate, isUser, communityRouter);
app.use("/user", authenticate, isUser, userRouter);

export default app;
