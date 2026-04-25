import mongoose from "mongoose";
import { userDB } from "../../config/db.js";

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
			trim: true, // Removes leading/trailing spaces
			lowercase: true, // Converts to lowercase
			minlength: [3, "Username must be at least 3 characters long"],
			maxlength: [20, "Username must be less than 20 characters long"],
			match: [/^[a-z0-9_]+$/i, "Username can only contain letters, numbers, and underscores"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			trim: true,
			lowercase: true,
			match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid email address"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [6, "Password must be at least 6 characters long"],
			select: false, // Exclude password from query results by default
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		verified: {
			type: Boolean,
			default: false,
		},
		otp: {
			type: String,
			select: false,
		},
		otpExpiry: {
			type: Date,
			select: false,
		},
	},
	{
		timestamps: true, // Adds createdAt and updatedAt fields automatically
	}
);

// Create the model using the userDB connection
const User = userDB.model("User", userSchema);

export default User;
