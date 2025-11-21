import Community from "../models/CommunityDB/Community.js";
import User from "../models/UserDB/User.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";
import { findCommunity } from "./communityServices.js";

// Check if the requesting user is the community admin
export const checkIfCommunityAdmin = (community, userId) => {
	if (community.communityAdmin.toString() !== userId) throw new Error("not the community admin");
};

// Check if the requesting user is a community admin or moderator
export const checkIfAdminOrModerator = (community, userId) => {
	if (!(community.communityAdmin.toString() === userId || community.moderators.some((id) => id.toString() === userId)))
		throw new Error("not the community admin or moderator");
};

// Delete community
export const deleteCommunityIfAdmin = async (userId, communityId) => {
	const community = await findCommunity(communityId);

	checkIfCommunityAdmin(community, userId);

	const deletedCommunity = await Community.findByIdAndDelete(communityId);
	if (!deletedCommunity) throw new Error("Failed to delete community");

	// Remove community id from joined community field of members' usermetadata
	const editeduserMetadatas = await UserMetadata.updateMany(
		{ userId: { $in: deletedCommunity.members } },
		{ $pull: { joinedCommunities: deletedCommunity._id } }
	);

	return deletedCommunity;
};

//Transfer community admin
export const transferCommunityAdmin = async (communityId, userId, newAdminId) => {
	const community = await findCommunity(communityId);

	checkIfCommunityAdmin(community, userId);

	const newAdmin = await User.findById(newAdminId);
	if (!newAdmin) throw new Error("Not a valid user id");

	//checks if new admin is a member
	if (!community.members.some((id) => id.toString() === newAdminId.toString())) throw new Error("The user is not a member in the community");

	community.communityAdmin = newAdminId;
	await community.save();
};

// add new moderator
export const addNewModerator = async (communityId, userId, newModeratorId) => {
	const community = await findCommunity(communityId);

	checkIfCommunityAdmin(community, userId);

	const newModerator = await User.findById(newModeratorId);
	if (!newModerator) throw new Error("moderatorId is not a valid userId");

	//checks if moderator is a member
	if (!community.members.some((id) => id.toString() === newModeratorId.toString())) throw new Error("The user is not a member in the community");

	//adds to moderator array (if not included)
	if (!community.moderators.some((id) => id.toString() === newModeratorId.toString())) community.moderators.push(newModeratorId);
	else throw new Error("User is already a moderator");

	await community.save();
};

// revoke a moderator
export const revokeCommunityModerator = async (communityId, userId, moderatorId) => {
	const community = await findCommunity(communityId);

	checkIfCommunityAdmin(community, userId);

	if(!community.moderators.some((id) => id.toString() === moderatorId.toString())) throw new Error("The user is not a moderator");

	community.moderators = community.moderators.filter((id) => id.toString() !== moderatorId.toString());
	await community.save();
};

// change privacy of a community
export const changePrivacySettings = async (userId, communityId) => {
	const community = await findCommunity(communityId);

	checkIfAdminOrModerator(community, userId);

	community.isPrivate = !community.isPrivate;

	await community.save();
};

// update rules of a community
export const updateCommunityRules = async (userId, communityId, communityRules) => {
	const community = await findCommunity(communityId);

	checkIfAdminOrModerator(community, userId);

	const trimmed = communityRules.trim();
	if(trimmed.length > 1000) throw new Error("The rules must contain less than 1000 characters");

	community.communityRules = trimmed;
	await community.save();
};
