import express from "express";
import { communityCreationValidation } from "../validators/communityValidator.js";
import { createCommunity, joinCommunity, leaveCommunity } from "../controllers/communityController.js";
import { addmoderator, changeCommunityAdmin, deleteCommunity, revokeModerator, setPrivacy } from "../controllers/communityAdminController.js";

const communityRouter = express.Router(); // community user routes
const communityAdminRouter = express.Router(); //community admin routes

communityRouter.post("/create", communityCreationValidation, createCommunity); // Create a new community
communityRouter.post("/join/:communityId", joinCommunity); // Join community
communityRouter.post("/leave/:communityId", leaveCommunity); // Leave community

// community admin routes
communityAdminRouter.delete("/delete/:communityId", deleteCommunity); // delete community
communityAdminRouter.put("/transfer-admin/:communityId/:newAdminId", changeCommunityAdmin);
communityAdminRouter.post("/add-moderator/:communityId/:newModeratorId", addmoderator);
communityAdminRouter.put("/revoke-moderator/:communityId/:moderatorId", revokeModerator);
communityAdminRouter.put("/set-privacy/:communityId", setPrivacy);

export { communityAdminRouter, communityRouter };
