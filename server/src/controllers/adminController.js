import * as adminService from "../services/adminServices.js";

// ── Achievements ──────────────────────────────────────────────────────────────

export const addAchievement = async (req, res) => {
	try {
		const { name, iconUrl } = req.body;
		if (!name) return res.status(400).json({ success: false, message: "Achievement name is required" });
		const achievement = await adminService.createAchievement({ name, iconUrl });
		res.status(201).json({ success: true, data: achievement });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const listAchievements = async (req, res) => {
	try {
		const achievements = await adminService.getAllAchievements();
		res.status(200).json({ success: true, data: achievements });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const removeAchievement = async (req, res) => {
	try {
		const { achievementId } = req.params;
		await adminService.deleteAchievement(achievementId);
		res.status(200).json({ success: true, message: "Achievement deleted" });
	} catch (error) {
		const status = error.message === "Achievement not found" ? 404 : 500;
		res.status(status).json({ success: false, message: error.message });
	}
};

// ── Rules ─────────────────────────────────────────────────────────────────────

export const addRule = async (req, res) => {
	try {
		const { name, conditions, actions } = req.body;
		if (!name || !conditions?.length || !actions?.length) {
			return res.status(400).json({ success: false, message: "name, conditions, and actions are required" });
		}
		const rule = await adminService.createRule({ name, conditions, actions });
		res.status(201).json({ success: true, data: rule });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const listRules = async (req, res) => {
	try {
		const rules = await adminService.getAllRules();
		res.status(200).json({ success: true, data: rules });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const editRule = async (req, res) => {
	try {
		const { ruleId } = req.params;
		const { name, conditions, actions } = req.body;
		const rule = await adminService.updateRule(ruleId, { name, conditions, actions });
		res.status(200).json({ success: true, data: rule });
	} catch (error) {
		const status = error.message === "Rule not found" ? 404 : 500;
		res.status(status).json({ success: false, message: error.message });
	}
};

export const removeRule = async (req, res) => {
	try {
		const { ruleId } = req.params;
		await adminService.deleteRule(ruleId);
		res.status(200).json({ success: true, message: "Rule deleted" });
	} catch (error) {
		const status = error.message === "Rule not found" ? 404 : 500;
		res.status(status).json({ success: false, message: error.message });
	}
};

// ── User Reports ──────────────────────────────────────────────────────────────

export const getUserReports = async (req, res) => {
	try {
		const { status, page, limit } = req.query;
		const result = await adminService.getUserReports({
			status,
			page: Number(page) || 1,
			limit: Number(limit) || 20,
		});
		res.status(200).json({ success: true, ...result });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const resolveUserReport = async (req, res) => {
	try {
		const { reportId } = req.params;
		const { status } = req.body;
		const validStatuses = ["Reviewed", "Resolved", "Dismissed"];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(", ")}` });
		}
		const report = await adminService.updateUserReportStatus(reportId, status);
		res.status(200).json({ success: true, data: report });
	} catch (error) {
		const status = error.message === "User report not found" ? 404 : 500;
		res.status(status).json({ success: false, message: error.message });
	}
};

// ── Community Reports ─────────────────────────────────────────────────────────

export const getCommunityReports = async (req, res) => {
	try {
		const { status, page, limit } = req.query;
		const result = await adminService.getCommunityReports({
			status,
			page: Number(page) || 1,
			limit: Number(limit) || 20,
		});
		res.status(200).json({ success: true, ...result });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const resolveCommunityReport = async (req, res) => {
	try {
		const { reportId } = req.params;
		const { status } = req.body;
		const validStatuses = ["Reviewed", "Resolved", "Dismissed"];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(", ")}` });
		}
		const report = await adminService.updateCommunityReportStatus(reportId, status);
		res.status(200).json({ success: true, data: report });
	} catch (error) {
		const status = error.message === "Community report not found" ? 404 : 500;
		res.status(status).json({ success: false, message: error.message });
	}
};

export const deleteCommunityFromReport = async (req, res) => {
	try {
		const { communityId } = req.params;
		const community = await adminService.deleteReportedCommunity(communityId);
		res.status(200).json({ success: true, data: community, message: "Community deleted successfully" });
	} catch (error) {
		const status = error.message === "Community not found" ? 404 : 500;
		res.status(status).json({ success: false, message: error.message });
	}
};
