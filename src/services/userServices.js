import UserReport from "../models/AdminDB/UserReport.js";
import { findCommunity } from "./communityServices.js"

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