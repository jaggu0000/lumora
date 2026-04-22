import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { authenticate, isAdmin, isUser } from "./middlewares/authMiddleware.js";
import env from "./config/env.js";
import { communityAdminRouter, communityRouter } from "./routes/communityRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express();

app.use(
	cors({
		origin: env.CLIENT_URL,
		credentials: true, // Allow cookies to be sent
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

// Admin Routes
app.use("/admin", authenticate, isAdmin, adminRouter);

export default app;
