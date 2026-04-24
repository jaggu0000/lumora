import CommunityReport from "../models/AdminDB/CommunityReport.js";
import UserReport from "../models/AdminDB/UserReport.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";
import { findCommunity } from "./communityServices.js"

export const fetchUserProfile = async (userId) => {
	const userMetadata = await UserMetadata.findOne({ userId }).populate("userId", "username email role");
	if (!userMetadata) throw new Error("User profile not found");
	return userMetadata;
};

// Report a user
export const reportUserFromCommunity = async (userId, communityId, reportedUserId, reasonType, reason) => {
    if(userId.toString() === reportedUserId.toString()) throw new Error("You cannot report yourself");

    const community = await findCommunity(communityId);

    if (!community.members.some((id) => id.toString() === reportedUserId.toString()))
		// checks if the reported user is a member
		throw new Error("Reported user is not a member of the community");

    const report = await UserReport.create({
        reportedBy: userId,
        reportedUser: reportedUserId,
        reasonType,
        reason,
        associatedCommunity: communityId
    });

    return report;
};

// Report a community
export const reportACommunity = async (userId, communityId, reasonType, reason) => {
	const community = await findCommunity(communityId);

	if (!community.members.some((id) => id.toString() === userId.toString()))
		// checks if the user is a member
		throw new Error("User is not a member of the community");

	const report = await CommunityReport.create({
		reportedBy: userId,
		reportedCommunity: communityId,
		reasonType,
		reason,
	});

	return report;
};