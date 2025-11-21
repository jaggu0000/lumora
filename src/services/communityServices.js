import Community from "../models/CommunityDB/Community.js";
import User from "../models/UserDB/User.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

// Find community method
export const findCommunity = async (communityId) => {
	const community = Community.findById(communityId);
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

	if (community.members.includes(userId)) throw new Error("User already a member of the community"); // Prevent duplicate entries

	community.members.push(userId);
	const updatedCommunity = await community.save();
	if (!updatedCommunity) throw new Error("Failed to add user to community");

	userMetadata.joinedCommunities.push(community._id);
	const savedMetadata = await userMetadata.save();
	if (!savedMetadata) {
		await Community.updateOne({ _id: communityId }, { $pull: { members: userId } });
		throw new Error("Failed to update user metadata");
	}
	return updatedCommunity;
};

// Remove user from community members
export const removeUserFromMembers = async (userId, communityId) => {
	const community = await findCommunity(communityId);

	if (community.communityAdmin.toString() === userId)
		// checks if user is the community admin
		throw new Error("Admin cannot leave the community before transfering the community admin role");

	if (!community.members.some((id) => id.toString() === userId.toString()))
		// checks if the user is a member
		throw new Error("User is not a member of the community");

	community.members = community.members.filter((id) => id.toString() !== userId.toString()); //filter out the user from members

	community.moderators = community.moderators.filter((id) => id.toString() !== userId.toString()); //filter out the user from moderators if they are

	if (!community.previousMembers.some((id) => id.toString === userId.toString()))
		//adds the userId to previous member list if doesn't exist
		community.previousMembers.push(userId);

	await community.save();
};
