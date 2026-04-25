import express from "express";
import {
	addAchievement,
	listAchievements,
	removeAchievement,
	addRule,
	listRules,
	editRule,
	removeRule,
	getUserReports,
	resolveUserReport,
	getCommunityReports,
	resolveCommunityReport,
	deleteCommunityFromReport,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// Achievements
adminRouter.post("/achievements", addAchievement);
adminRouter.get("/achievements", listAchievements);
adminRouter.delete("/achievements/:achievementId", removeAchievement);

// Platform Rules
adminRouter.post("/rules", addRule);
adminRouter.get("/rules", listRules);
adminRouter.patch("/rules/:ruleId", editRule);
adminRouter.delete("/rules/:ruleId", removeRule);

// User Reports
adminRouter.get("/user-reports", getUserReports);
adminRouter.patch("/user-reports/:reportId/status", resolveUserReport);

// Community Reports
adminRouter.get("/community-reports", getCommunityReports);
adminRouter.patch("/community-reports/:reportId/status", resolveCommunityReport);
adminRouter.delete("/communities/:communityId", deleteCommunityFromReport);

export default adminRouter;
