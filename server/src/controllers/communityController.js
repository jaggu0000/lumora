import { addUserToCommunity, addUserWithInviteCode, createNewCommunity, fetchCommunityDetails, removeUserFromMembers } from "../services/communityServices.js";
import CommunityReport from "../models/AdminDB/CommunityReport.js";

export const getCommunityDetails = async (req, res) => {
	try {
		const { communityId } = req.params;
		const community = await fetchCommunityDetails(communityId);
		res.status(200).json({ success: true, community });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// Create a new community
export const createCommunity = async (req, res) => {
	try {
		const communityData = req.body;
		const { userId } = req.auth;
		const newCommunity = await createNewCommunity({
			...communityData,
			createdBy: userId,
			communityAdmin: userId,
			members: [userId],
		});
		res.status(201).json({ message: "Success", community: newCommunity });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// Join a community
export const joinCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;
		const { userId } = req.auth;
		const added = await addUserToCommunity(communityId, userId);
		if (added) res.status(200).json({ message: "Joined the community successfully" });
		else res.status(200).json({ message: "Sent a join request" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// Join communtiy using invite code
export const joinUsingInviteCode = async (req, res) => {
	try {
		const { inviteCode } = req.body;
		const { userId } = req.auth;
		const mode = await addUserWithInviteCode(userId, inviteCode);
		// seperate success message if membership mode is open
		if (mode === "open")
			res.status(200).json({ message: "Joined the community successfully" });
		res.status(200).json({ message: "Sent join request" });
	}catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// Report a community
export const reportCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;
		const { userId } = req.auth;
		const { reasonType, reason } = req.body;

		const existing = await CommunityReport.findOne({ reportedBy: userId, reportedCommunity: communityId, status: "Pending" });
		if (existing) return res.status(409).json({ success: false, error: "You already have a pending report for this community." });

		await CommunityReport.create({ reportedBy: userId, reportedCommunity: communityId, reasonType, reason });
		res.status(201).json({ success: true, message: "Report submitted successfully." });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// Leave a community
export const leaveCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;
		const { userId } = req.auth;
		await removeUserFromMembers(userId, communityId);
		res.status(200).json({ success: true, message: "Successfully left the community" });
	} catch (error) {
		console.error("leaveCommunity error:", error.message);
		res.status(400).json({ success: false, message: error.message });
	}
};
