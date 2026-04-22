import Achievement from "../models/AdminDB/Achievement.js";
import Rule from "../models/AdminDB/Rule.js";
import UserReport from "../models/AdminDB/UserReport.js";
import CommunityReport from "../models/AdminDB/CommunityReport.js";

// ── Achievements ──────────────────────────────────────────────────────────────

export const createAchievement = async ({ name, iconUrl }) => {
	const achievement = new Achievement({ name, iconUrl });
	return await achievement.save();
};

export const getAllAchievements = async () => {
	return await Achievement.find().sort({ date: -1 });
};

export const deleteAchievement = async (achievementId) => {
	const achievement = await Achievement.findByIdAndDelete(achievementId);
	if (!achievement) throw new Error("Achievement not found");
	return achievement;
};

// ── Rules ─────────────────────────────────────────────────────────────────────

export const createRule = async ({ name, conditions, actions }) => {
	const rule = new Rule({ name, conditions, actions });
	return await rule.save();
};

export const getAllRules = async () => {
	return await Rule.find().sort({ _id: -1 });
};

export const updateRule = async (ruleId, updates) => {
	const rule = await Rule.findByIdAndUpdate(ruleId, updates, { new: true, runValidators: true });
	if (!rule) throw new Error("Rule not found");
	return rule;
};

export const deleteRule = async (ruleId) => {
	const rule = await Rule.findByIdAndDelete(ruleId);
	if (!rule) throw new Error("Rule not found");
	return rule;
};

// ── User Reports ──────────────────────────────────────────────────────────────

export const getUserReports = async ({ status, page = 1, limit = 20 }) => {
	const filter = status ? { status } : {};
	const skip = (page - 1) * limit;
	const [reports, total] = await Promise.all([
		UserReport.find(filter)
			.populate("reportedBy", "username email")
			.populate("reportedUser", "username email")
			.populate("associatedCommunity", "name")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit),
		UserReport.countDocuments(filter),
	]);
	return { reports, total, page, limit };
};

export const updateUserReportStatus = async (reportId, status) => {
	const update = { status };
	if (status === "Resolved" || status === "Dismissed") update.resolvedAt = new Date();
	const report = await UserReport.findByIdAndUpdate(reportId, update, { new: true });
	if (!report) throw new Error("User report not found");
	return report;
};

// ── Community Reports ─────────────────────────────────────────────────────────

export const getCommunityReports = async ({ status, page = 1, limit = 20 }) => {
	const filter = status ? { status } : {};
	const skip = (page - 1) * limit;
	const [reports, total] = await Promise.all([
		CommunityReport.find(filter)
			.populate("reportedBy", "username email")
			.populate("reportedCommunity", "name")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit),
		CommunityReport.countDocuments(filter),
	]);
	return { reports, total, page, limit };
};

export const updateCommunityReportStatus = async (reportId, status) => {
	const update = { status };
	if (status === "Resolved" || status === "Dismissed") update.resolvedAt = new Date();
	const report = await CommunityReport.findByIdAndUpdate(reportId, update, { new: true });
	if (!report) throw new Error("Community report not found");
	return report;
};
