import Community from "../models/CommunityDB/Community.js";
import User from "../models/UserDB/User.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

// Check if the requesting user is the community admin
export const checkIfCommunityAdmin = (community, userId) => {
	if (community.communityAdmin.toString() !== userId)
		throw new Error("not the community admin");
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

// Remove user from community members
export const removeUserFromMembers = async (userId, communityId) => {
	const community = await Community.findById(communityId);
	if (!community) throw new Error("Community not found");
	
	if (community.communityAdmin.toString() === userId) 	// checks if user is the community admin
		throw new Error("Admin cannot leave the community before transfering the community admin role");

	if (!community.members.some((id) => id.toString() === userId.toString()))	// checks if the user is a member
		throw new Error("User is not a member of the community");
		
	community.members = community.members.filter((id) => id.toString() !== userId.toString());	//filter out the user from members
	
	community.moderators = community.moderators.filter((id) => id.toString() !== userId.toString());	//filter out the user from moderators if they are
	
	if (!community.previousMembers.some(id => id.toString === userId.toString()))	//adds the userId to previous member list if doesn't exist
		community.previousMembers.push(userId); 
		
	await community.save();
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
		{ $pull: { joinedCommunities: deletedCommunity._id } }
	);

	return deletedCommunity;
};

export const transferCommunityAdmin = async (communityId, userId, newAdminId) => {
	const community = await Community.findOne({ _id: communityId });
	if (!community) throw new Error("Community not found");
	
	checkIfCommunityAdmin(community, userId);
	
	const newAdmin = await User.findById(newAdminId);
	if (!newAdmin) throw new error("Not a valid user id");
	
	community.communityAdmin = newAdminId;
	community.save();
};

// add new moderator
export const addNewModerator = async (communityId, userId, moderatorId) => {
	const community = await Community.findById(communityId);
	if (!community) throw new Error("Community not found");
	
	checkIfCommunityAdmin(community, userId);
	
	const newModerator = await User.findById(moderatorId);
	if (!newModerator) throw new Error("moderatorId is not a valid userId");
	
	//checks if moderator is a member
	if (!community.members.some(id => id.toString() === moderatorId.toString())) 
		throw new Error("The user is not a member in the community")

	//adds to moderator array (if not included)
	if (!community.moderators.some(id => id.toString() === moderatorId.toString()))
		community.moderators.push(moderatorId);
	else
		throw new Error("User is already a moderator");
	
	await community.save();
};
