import randomstring from "randomstring";
import Community from "../models/CommunityDB/Community.js";

export const generateInviteCode = async () => {
	let inviteCode;
	do {
		inviteCode = randomstring.generate({
			length: 8,
			charset: "alphabetic",
			capitalization: "lowercase",
		});
	} while (await checkInviteCodeExistence(inviteCode));
    return inviteCode;
};

export const checkInviteCodeExistence = async (inviteCode) => {
	const community = await Community.findOne({ inviteCode });
	if (!community) return false;
	return true;
};
