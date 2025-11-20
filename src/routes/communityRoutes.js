import express from "express";
import { communityCreationValidation } from "../validators/communityValidator.js";
import {
	changeCommunityAdmin,
	addmoderator,
	createCommunity,
	deleteCommunity,
	joinCommunity,
	leaveCommunity,
} from "../controllers/communityController.js";

const communityRouter = express.Router();  // community user routes
const communityAdminRouter = express.Router(); //community admin routes

communityRouter.post("/create", communityCreationValidation, createCommunity); // Create a new community
communityRouter.post("/join/:communityId", joinCommunity); // Join community
communityRouter.post("/leave/:communityId", leaveCommunity); // Leave community
communityRouter.delete("/delete/:communityId", deleteCommunity); // delete community
communityRouter.put("/admin/transfer-admin/:communityId/:newAdminId", changeCommunityAdmin);

// community admin routes
communityAdminRouter.post("/add-moderator/:communityId/:moderatorId", addmoderator);

export { communityAdminRouter, communityRouter };