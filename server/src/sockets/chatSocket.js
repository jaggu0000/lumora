import mongoose from "mongoose";
import CommunityChat from "../models/CommunityDB/CommunityChat.js";

const HISTORY_LIMIT = 50;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export function registerChatSocket(io) {
	io.on("connection", (socket) => {

		socket.on("join-community", async ({ communityId, userId, username }) => {
			socket.join(`chat:${communityId}`);
			socket.data.communityId = communityId;
			socket.data.userId = userId;
			socket.data.username = username;

			try {
				if (isValidId(communityId)) {
					const messages = await CommunityChat.find({
						communityId,
						isDeleted: false,
					})
						.sort({ createdAt: -1 })
						.limit(HISTORY_LIMIT)
						.populate("senderId", "username")
						.populate({
							path: "replyTo",
							select: "content senderId",
							populate: { path: "senderId", select: "username" },
						})
						.lean();

					socket.emit("message-history", messages.reverse());
				} else {
					socket.emit("message-history", []);
				}
			} catch {
				socket.emit("message-history", []);
			}
		});

		socket.on("send-message", async ({ communityId, content, messageType = "text", replyTo }) => {
			const { userId, username } = socket.data;
			if (!content?.trim()) return;

			const outbound = {
				_id: new mongoose.Types.ObjectId().toString(),
				senderId: { _id: userId, username },
				content: content.trim(),
				messageType,
				attachments: [],
				replyTo: replyTo ?? null,
				isEdited: false,
				isDeleted: false,
				createdAt: new Date(),
			};

			// Persist to DB when real IDs are available
			if (isValidId(communityId) && isValidId(userId)) {
				try {
					const saved = await CommunityChat.create({
						communityId,
						senderId: userId,
						content: content.trim(),
						messageType,
						replyTo: isValidId(replyTo) ? replyTo : undefined,
					});
					outbound._id = saved._id.toString();
					outbound.createdAt = saved.createdAt;
				} catch {
					// broadcast even if save fails
				}
			}

			// Broadcast to everyone else — sender adds it locally
		socket.to(`chat:${communityId}`).emit("new-message", outbound);
		});

		socket.on("typing", ({ communityId }) => {
			socket.to(`chat:${communityId}`).emit("user-typing", {
				userId: socket.data.userId,
				username: socket.data.username,
			});
		});

		socket.on("stop-typing", ({ communityId }) => {
			socket.to(`chat:${communityId}`).emit("user-stop-typing", {
				userId: socket.data.userId,
			});
		});

		socket.on("delete-message", async ({ messageId, communityId }) => {
			if (isValidId(messageId)) {
				try {
					await CommunityChat.findByIdAndUpdate(messageId, { isDeleted: true });
				} catch { /* ignore */ }
			}
			io.to(`chat:${communityId}`).emit("message-deleted", { messageId });
		});

		socket.on("leave-community", ({ communityId }) => {
			socket.leave(`chat:${communityId}`);
		});
	});
}
