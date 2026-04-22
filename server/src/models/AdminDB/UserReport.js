import mongoose from "mongoose";
import { adminDB } from "../../config/db.js";

const userReportSchema = new mongoose.Schema({
	reportedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	reportedUser: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	reasonType: {
		type: String,
		required: [true, "Reason type is required"],
		enum: [
			"Spam",
			"Harassment",
			"Inappropriate Content",
			"Impersonation",
			"Hate speech or Discrimination",
			"Other",
		],
	},
	reason: {
		type: String,
		required: [true, "Reason for report is required"],
		trim: true,
		maxlength: [500, "Reason must be less than 500 characters long"],
	},
	associatedCommunity: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Community",
	},
	status: {
		type: String,
		enum: ["Pending", "Reviewed", "Resolved", "Dismissed"],
		default: "Pending",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	resolvedAt: {
		type: Date,
	},
});

const UserReport = adminDB.model("UserReport", userReportSchema);
export default UserReport;
