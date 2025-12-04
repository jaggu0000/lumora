import express from "express";
import { communityCreationValidation } from "../validators/communityValidator.js";
import { createCommunity, joinCommunity, joinUsingInviteCode, leaveCommunity } from "../controllers/communityController.js";
import {
	addmoderator,
	blockUsers,
	changeCommunityAdmin,
	changeInviteCode,
	deleteCommunity,
	revokeModerator,
	setPrivacy,
	updateMembershipMode,
	updateRules,
} from "../controllers/communityAdminController.js";

const communityRouter = express.Router(); // community user routes
const communityAdminRouter = express.Router(); //community admin routes

communityRouter.post("/create", communityCreationValidation, createCommunity); // Create a new community
communityRouter.patch("/join/invite-code" ,joinUsingInviteCode); // Join community using invite code
communityRouter.patch("/join/:communityId", joinCommunity); // Join community
communityRouter.patch("/leave/:communityId", leaveCommunity); // Leave community

// community admin routes
communityAdminRouter.delete("/delete/:communityId", deleteCommunity); // delete community
communityAdminRouter.patch("/transfer-admin/:communityId/:newAdminId", changeCommunityAdmin);
communityAdminRouter.patch("/add-moderator/:communityId/:newModeratorId", addmoderator);
communityAdminRouter.patch("/revoke-moderator/:communityId/:moderatorId", revokeModerator);
communityAdminRouter.patch("/set-privacy/:communityId", setPrivacy);
communityAdminRouter.patch("/change-membership-mode/:communityId", updateMembershipMode); //changes membership mode
communityAdminRouter.patch("/change-invite-code/:communityId", changeInviteCode); //changes invite code
communityAdminRouter.patch("/update-community-rules/:communityId", updateRules);
communityAdminRouter.patch("/block-users/:communityId/:blockUserId", blockUsers);

export { communityAdminRouter, communityRouter };
