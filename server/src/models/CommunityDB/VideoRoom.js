import mongoose, { mongo } from "mongoose";
import { communityDB } from "../../config/db.js";
import Community from "./Community.js";
import User from "../UserDB/User.js";

const videoRoomSchema = new mongoose.Schema({
	communityId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Community",
		required: true,
	},
	roomName: {
		type: String,
		required: true,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	usersJoined: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: "User",
	},
	roomDuration: {
		type: Number, // Duration in minutes
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const VideoRoom = communityDB.model("VideoRoom", videoRoomSchema);
export default VideoRoom;
