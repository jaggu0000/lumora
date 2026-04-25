import mongoose from "mongoose";
import Community from "../models/CommunityDB/Community.js";
import User from "../models/UserDB/User.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

export const fetchCommunityDetails = async (communityId) => {
	const community = await Community.findById(communityId)
		.select("communityName communityTag description members communityAdmin moderators isPrivate membershipMode");
	if (!community) throw new Error("Community not found");

	const memberIds = (community.members || []).filter(Boolean);
	const moderatorIds = (community.moderators || []).filter(Boolean);

	// Cross-DB: manually resolve member usernames from userDB
	const users = await User.find({ _id: { $in: memberIds } }, "username");
	const usersMap = new Map(users.map(u => [u._id.toString(), u.username]));
	const adminId = community.communityAdmin?.toString?.() ?? null;
	const moderatorSet = new Set(moderatorIds.map((moderatorId) => moderatorId.toString()));

	const membersData = memberIds.map(id => {
		const idStr = id.toString();
		return {
			_id: idStr,
			username: usersMap.get(idStr) || "Unknown",
			role: idStr === adminId ? "admin" : moderatorSet.has(idStr) ? "moderator" : "member",
		};
	});

	return {
		_id: community._id,
		communityName: community.communityName,
		communityTag: community.communityTag,
		description: community.description,
		isPrivate: community.isPrivate,
		membershipMode: community.membershipMode,
		membersData,
	};
};

// Find community method
export const findCommunity = async (communityId) => {
	const community = await Community.findById(communityId);
	if (!community) throw new Error("Community not found");
	return community;
};

// Create a new community
export const createNewCommunity = async (communityData) => {
	const newCommunity = new Community(communityData);
	const savedCommunity = await newCommunity.save();
	if (!savedCommunity) throw new Error("Failed to create community");
	const userMetadata = await UserMetadata.findOne({
		userId: savedCommunity.createdBy,
	});
	if (!userMetadata) {
		await Community.findByIdAndDelete(savedCommunity._id);
		throw new Error("User metadata not found");
	}
	userMetadata.joinedCommunities.push(savedCommunity._id);
	const savedMetadata = await userMetadata.save();
	if (!savedMetadata) {
		await Community.findByIdAndDelete(savedCommunity._id);
		throw new Error("Failed to update user metadata");
	}
	return savedCommunity;
};

// CommunityTag existence check
export const checkCommunityTagExistence = async (communityTag) => {
	const existingCommunity = await Community.findOne({ communityTag });
	return !!existingCommunity;
};

// Add user to community
export const addUserToCommunity = async (communityId, userId) => {
	const community = await findCommunity(communityId);

	const userMetadata = await UserMetadata.findOne({ userId });
	if (!userMetadata) throw new Error("User metadata not found");

	if (community.members.some((id) => id.toString() === userId.toString()))
		throw new Error("User already a member of the community"); // Prevent duplicate entries

	// check the membership mode
	if (community.membershipMode === "open") {
		community.members.push(userId);
		const updatedCommunity = await community.save();
		if (!updatedCommunity) throw new Error("Failed to add user to community");

		userMetadata.joinedCommunities.push(community._id);
		const savedMetadata = await userMetadata.save();
		if (!savedMetadata) {
			await Community.updateOne({ _id: communityId }, { $pull: { members: userId } });
			throw new Error("Failed to update user metadata");
		}
		return true; // return true indicating user added directly
	} else if (community.membershipMode === "request-to-join") {
		if (community.joinRequests.some((id) => id.toString() === userId.toString()))
			throw new Error("The user has already sent a join request"); // Prevent duplicate entries

		community.joinRequests.push(userId);
		const updatedCommunity = await community.save();
		if (!updatedCommunity) throw new Error("Failed to send join request");

		return false; // return false indicating join request sent
	} else throw new Error("Cannot join an invite-only community directly");
};

// add user using invite link
export const addUserWithInviteCode = async (userId, inviteCode) => {
	const community = await Community.findOne({ inviteCode });
	if (!community) throw new Error("Invalid invite code");

	if (community.members.some((id) => id.toString() === userId.toString()))
		throw new Error("The user is already a member of the community"); // Prevent duplicate entries
	
	// adds user if membership mode is open
	if (community.membershipMode === "open") {
		await addUserToCommunity(community._id, userId);
		return "open";
	}

	if (community.joinRequests.some((id) => id.toString() === userId.toString()))
		throw new Error("The user has already sent a join request"); // Prevent duplicate request entries

	community.joinRequests.push(userId);
	const updatedCommunity = await community.save();
	if (!updatedCommunity) throw new Error("Failed to send join request");
};

// Remove user from community members
export const removeUserFromMembers = async (userId, communityId) => {
	const community = await findCommunity(communityId);

	if (community.communityAdmin.toString() === userId)
		throw new Error("Admin cannot leave the community before transfering the community admin role");

	const isMember = community.members.some((id) => id.toString() === userId.toString());

	if (isMember) {
		community.members = community.members.filter((id) => id.toString() !== userId.toString());
		community.moderators = community.moderators.filter((id) => id.toString() !== userId.toString());

		if (!community.previousMembers.some((id) => id.toString() === userId.toString()))
			community.previousMembers.push(userId);

		await community.save();
	}

	// Always clean up joinedCommunities regardless of members array state
	await UserMetadata.findOneAndUpdate(
		{ userId: new mongoose.Types.ObjectId(userId) },
		{ $pull: { joinedCommunities: new mongoose.Types.ObjectId(communityId) } }
	);
};
