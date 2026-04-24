import mongoose from "mongoose";
import Timer from "../models/UserDB/Timer.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

export const logFocusSession = async (userId, duration) => {
	const now = new Date();
	const timer = new Timer({
		userId,
		duration,
		startTime: now,
		endTime: new Date(now.getTime() + duration * 1000),
	});
	await timer.save();

	const userMetadata = await UserMetadata.findOne({ userId });
	if (!userMetadata) throw new Error("User metadata not found");
	userMetadata.timers.push(timer._id);
	await userMetadata.save();

	return timer;
};

export const getTodayFocusSeconds = async (userId) => {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const objectId = new mongoose.Types.ObjectId(userId);
	const timers = await Timer.find({ userId: objectId, startTime: { $gte: start } });
	return timers.reduce((sum, t) => sum + t.duration, 0);
};
