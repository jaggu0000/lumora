import { addNewModerator, changePrivacySettings, deleteCommunityIfAdmin, transferCommunityAdmin } from "../services/communityAdminServices.js";

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
		res.status(200).json({ message: "Added moderator successfully" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};

// Change privacy settings of a community
export const setPrivacy = async (req, res) => {
	try {
		const { userId } = req.auth;
		const { communityId } = req.params;
		await changePrivacySettings(userId, communityId);
		res.status(200).json({ message: "Successfully changed the privacy settings" });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};
