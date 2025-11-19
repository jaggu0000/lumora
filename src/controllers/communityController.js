import {
	addNewModerator,
	addUserToCommunity,
	createNewCommunity,
	deleteCommunityIfAdmin,
	transferCommunityAdmin,
} from "../services/communityServices.js";

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

// Delete a community
export const deleteCommunity = async (req, res) => {
	try {
		const { communityId } = req.params;
		const { userId } = req.auth;
		await deleteCommunityIfAdmin(userId, communityId);
		res.status(200).json({ message: "Community deleted successfully" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// Transfer admin of a community
export const changeCommunityAdmin = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { userId } = req.auth;
    const { newAdminId } = req.params;
    await transferCommunityAdmin(communityId, userId, newAdminId);
    res.status(200).json({ message: "Admin transferred successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add moderator
export const addmoderator = async (req, res) => {
	try {
		const { userId } = req.auth;
		const { communityId, moderatorId } = req.params;
		await addNewModerator(communityId, userId, moderatorId);
		res.status(200).json({message: "Added moderator successfully"})
	} catch (error){
		res.status(500).json({ success: false, error: error.message });
	}
};
