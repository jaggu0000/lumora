import mongoose from "mongoose";
import { communityDB } from "../../config/db.js";
import User from "../UserDB/User.js";
import UserReport from "../AdminDB/UserReport.js";
import VideoRoom from "./VideoRoom.js";
import { generateInviteCode } from "../../utils/inviteCode.js";

const communitySchema = new mongoose.Schema(
	{
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		communityTag: {
			type: String,
			required: [true, "Community Tag is required"],
			unique: true,
			trim: true,
			match: [
				/^[a-z0-9_-]+$/i,
				"Community ID can only contain letters, numbers, underscores, and hyphens",
			],
			minlength: [3, "Community ID must be at least 3 characters long"],
			maxlength: [
				10,
				"Community ID must be less than 10 characters long",
			],
		},
		communityName: {
			type: String,
			required: [true, "Community name is required"],
			trim: true,
			minlength: [3, "Community name must be at least 3 characters long"],
			maxlength: [
				30,
				"Community name must be less than 30 characters long",
			],
		},
		description: {
			type: String,
			required: [true, "Description is required"],
			trim: true,
			minlength: [10, "Description must be at least 10 characters long"],
			maxlength: [
				500,
				"Description must be less than 500 characters long",
			],
		},
		communityRules: {
			type: String,
			trim: true,
			maxlength: [1000, "Rules must be less than 1000 characters long"],
		},
		members: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
		},

		communityAdmin: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		moderators: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
		},
		isPrivate: {
			type: Boolean,
			default: false,
		},
		membershipMode: {
			type: String,
			enum: ["open", "invite-only", "request-to-join"],
			default: "open",
		},
		inviteCode: {
			type: String,
			unique: true,
		},
		joinRequests: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
		},

		videoRooms: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "VideoRoom",
		},

		userReports: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "UserReport",
		},

		previousMembers: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
		},

		blockedUsers: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
		},
	},
	{ timestamps: true }
);

communitySchema.pre("save", async function() {
	if (!this.inviteCode) this.inviteCode = await generateInviteCode();
});

const Community = communityDB.model("Community", communitySchema);
export default Community;
