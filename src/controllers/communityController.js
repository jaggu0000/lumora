import {
	addUserToCommunity,
	createNewCommunity,
} from "../services/communityServices.js";

// Create a new community
export const createCommunity = async (req, res) => {
	try {
		const communityData = req.body;
		const newCommunity = await createNewCommunity({
			...communityData,
			createdBy: req.auth.userId,
			communityAdmin: req.auth.userId,
			members: [req.auth.userId],
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
		const userId = req.auth.userId;
		await addUserToCommunity(communityId, userId);
		res.status(200).json({ message: "Successfully joined the community" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};
