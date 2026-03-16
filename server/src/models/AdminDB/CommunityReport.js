import mongoose from "mongoose";
import { adminDB } from "../../config/db.js";
import User from "../UserDB/User.js";
import Community from "../CommunityDB/Community.js";

const communityReportSchema = new mongoose.Schema({
	reportedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	reportedCommunity: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Community",
		required: true,
	},
	reasonType: {
		type: String,
		required: [true, "Reason type is required"],
		enum: [
			"violation of community guidelines",
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
		required: true,
		trim: true,
		maxlength: 500,
	},
	status: {
		type: String,
		required: true,
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

const CommunityReport = adminDB.model("CommunityReport", communityReportSchema);
export default CommunityReport;
