import Community from "../models/CommunityDB/Community.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

// Check if the requesting user is the community admin
export const checkIfCommunityAdmin = (community, userId) => {
	if (community.communityAdmin.toString() !== userId)
		throw new Error("Only the community admin can delete the community");
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

// Delete community
export const deleteCommunityIfAdmin = async (userId, communityId) => {
	const community = await Community.findOne({ _id: communityId });
	if (!community) throw new Error("Community not found");

	checkIfCommunityAdmin(community, userId);

	const deletedCommunity = await Community.findByIdAndDelete(communityId);
	if (!deletedCommunity) throw new Error("Failed to delete community");

	// Remove community id from joined community field of members' usermetadata
	const editeduserMetadatas = await UserMetadata.updateMany(
		{ userId: { $in: deletedCommunity.members } },
		{ $pull: { joinedCommunities: deletedCommunity._id} }
	);

	return deletedCommunity;
};
