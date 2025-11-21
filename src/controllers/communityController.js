import { addUserToCommunity, createNewCommunity, removeUserFromMembers } from "../services/communityServices.js";

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
		await addUserToCommunity(communityId, userId);
		res.status(200).json({ message: "Successfully joined the community" });
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
		res.status(200).json({ message: "Successfully left the community" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};
