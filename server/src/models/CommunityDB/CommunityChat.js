import mongoose from "mongoose";
import { communityDB } from "../../config/db.js";
import User from "../UserDB/User.js";
import Community from "./Community.js";

const communityChatSchema = new mongoose.Schema(
	{
		communityId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Community",
			required: true,
			index: true,
		},
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		messageType: {
			type: String,
			enum: ["text", "image", "video", "file", "audio"],
			default: "text",
		},
		attachments: [
			{
				type: {
					type: String,
					enum: ["image", "video", "file", "audio"],
				},
				url: {
					type: String,
					required: true,
				},
				filename: String,
				size: Number,
				mimeType: String,
			},
		],
		replyTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "CommunityChat",
		},
		isEdited: {
			type: Boolean,
			default: false,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

communityChatSchema.index({ communityId: 1, createdAt: -1 });

const CommunityChat = communityDB.model("CommunityChat", communityChatSchema);
export default CommunityChat;
