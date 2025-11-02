import Community from "../models/CommunityDB/Community.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

// Create a new community
export const createNewCommunity = async (communityData) => {
	const newCommunity = new Community(communityData);
	const existingCommunity = await Community.findOne({
		communityId: communityData.communityId,
	});
	if (existingCommunity) throw new Error("CommunityId already exists");
	const savedCommunity = await newCommunity.save();
	if (!savedCommunity) throw new Error("Failed to create community");
	const userMetadata = await UserMetadata.findOne({
		userId: savedCommunity.createdBy,
	});
	if (!userMetadata) throw new Error("User metadata not found");
	userMetadata.joinedCommunities.push(savedCommunity._id);
	const savedMetadata = await userMetadata.save();
	if (!savedMetadata) throw new Error("Failed to update user metadata");
	return savedCommunity;
};

// CommunityId existence check
export const checkCommunityIdExistence = async (communityId) => {
	const existingCommunity = await Community.findOne({ communityId });
	return !!existingCommunity;
};

// Add user to community
export const addUserToCommunity = async (communityId, userId) => {
	const community = await Community.findOne({ _id: communityId });
	if (!community) throw new Error("Community not found");

	const userMetadata = await UserMetadata.findOne({ userId });
	if (!userMetadata) throw new Error("User metadata not found");

	if (community.members.includes(userId))
		throw new Error("User already a member of the community"); // Prevent duplicate entries

	community.members.push(userId);
	const updatedCommunity = await community.save();
	if (!updatedCommunity) throw new Error("Failed to add user to community");

	userMetadata.joinedCommunities.push(community._id);
	const savedMetadata = await userMetadata.save();
	if (!savedMetadata) {
		await Community.updateOne(
			{ _id: communityId },
			{ $pull: { members: userId } }
		);
		throw new Error("Failed to update user metadata");
	}
	return updatedCommunity;
};
