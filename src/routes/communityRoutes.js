import express from "express";
import { communityCreationValidation } from "../validators/communityValidator.js";
import {
	createCommunity,
	deleteCommunity,
	joinCommunity,
} from "../controllers/communityController.js";

const communityRouter = express.Router();

// Create a new community
communityRouter.post("/create", communityCreationValidation, createCommunity);
communityRouter.post("/join/:communityId", joinCommunity);
communityRouter.delete("/delete/:communityId", deleteCommunity);

export default communityRouter;
