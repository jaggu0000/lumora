import { reportACommunity, reportUserFromCommunity } from "../services/userServices.js";

export const reportUser = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { communityId, reportedUserId } = req.params;
        const { reasonType, reason } = req.body;
        await reportUserFromCommunity(userId, communityId, reportedUserId, reasonType, reason);
        res.status(200).json({ message: "User reported successfully "});
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const reportCommunity = async (req, res) => {
	try {
		const { userId } = req.auth;
		const { communityId } = req.params;
		const { reasonType, reason } = req.body;
		await reportACommunity(userId, communityId, reasonType, reason);
		res.status(200).json({ message: "Community reported successfully " });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
};