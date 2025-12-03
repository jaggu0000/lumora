import Community from "../models/CommunityDB/Community.js";
import User from "../models/UserDB/User.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";
import { generateInviteCode } from "../utils/inviteCode.js";
import { addUserToCommunity, findCommunity } from "./communityServices.js";

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
	if (!community.members.some((id) => id.toString() === newAdminId.toString()))
		throw new Error("The user is not a member in the community");

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
	if (!community.members.some((id) => id.toString() === newModeratorId.toString()))
		throw new Error("The user is not a member in the community");

	//adds to moderator array (if not included)
	if (!community.moderators.some((id) => id.toString() === newModeratorId.toString()))
		community.moderators.push(newModeratorId);
	else throw new Error("User is already a moderator");

	await community.save();
};

// revoke a moderator
export const revokeCommunityModerator = async (communityId, userId, moderatorId) => {
	const community = await findCommunity(communityId);

	checkIfCommunityAdmin(community, userId);

	if (!community.moderators.some((id) => id.toString() === moderatorId.toString()))
		throw new Error("The user is not a moderator");

	community.moderators = community.moderators.filter((id) => id.toString() !== moderatorId.toString());
	await community.save();
};

// change privacy of a community
export const changePrivacySettings = async (userId, communityId) => {
	const community = await findCommunity(communityId);

	checkIfAdminOrModerator(community, userId);

	community.isPrivate = !community.isPrivate;

	// update membership mode based on privacy setting
	if (community.isPrivate) community.membershipMode = "invite-only";
	else community.membershipMode = "request-to-join";

	await community.save();
};

// change membership modes
export const changeMembershipMode = async (userId, communityId, membershipMode, approveAllRequest) => {
	const community = await findCommunity(communityId);

	checkIfCommunityAdmin(community, userId);

	const membershipModes = ["open", "invite-only", "request-to-join"];
	if (!membershipModes.includes(membershipMode)) throw new Error("Provided option is not a valid membership mode");

	// checks if the existing membership mode is same as the request
	if (community.membershipMode === membershipMode) throw new Error("Membership mode has no change");

	community.membershipMode = membershipMode;

	//set community to private if membership mode is invite-only
	if (membershipMode === "invite-only") community.isPrivate = true;

	//set community to public if membership mode is not invite-only
	if (membershipMode !== "invite-only") community.isPrivate = false;

	// handle existing join requests when membership mode is open
	if (membershipMode === "open") {
		if (!approveAllRequest) {
			community.joinRequests = [];
		} else {
			for (const requestedUserId of community.joinRequests) {
				const userId = requestedUserId.toString();
				const userMetadata = await UserMetadata.findOne({ userId });
				if (!userMetadata) throw new Error("User metadata not found");

				userMetadata.joinedCommunities.push(community._id);
				const savedMetadata = await userMetadata.save();
				if (!savedMetadata) throw new Error("Failed to update user metadata");
				community.members.push(userId);
			}
			community.joinRequests = [];
		}
	}
	await community.save();
};

// set new invite code
export const setNewInviteCode = async (userId, communityId) => {
	const community = await findCommunity(communityId);

	checkIfCommunityAdmin(community, userId);

	const newInviteCode = await generateInviteCode();

	community.inviteCode = newInviteCode;
	await community.save();
};

// update rules of a community
export const updateCommunityRules = async (userId, communityId, communityRules) => {
	const community = await findCommunity(communityId);

	checkIfAdminOrModerator(community, userId);

	const trimmed = communityRules.trim();
	if (trimmed.length > 1000) throw new Error("The rules must contain less than 1000 characters");

	community.communityRules = trimmed;
	await community.save();
};

// block members of a community
export const blockCommunityUsers = async (userId, communityId, blockUserId) => {
	const community = await findCommunity(communityId);
	checkIfAdminOrModerator(community, userId);

	//check if the user is a member of the community
	if (!community.members.some((id) => id.toString() === blockUserId.toString()))
		throw new Error("The user is not a member in the community");

	if (!community.blockedUsers.some((id) => id.toString() === blockUserId.toString()))
		community.blockedUsers.push(blockUserId);
	else throw new Error("User is already blocked");

	await community.save();
};
