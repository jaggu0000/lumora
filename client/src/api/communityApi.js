import axios from "axios";
import { getToken } from "./token";

const BASE = `${import.meta.env.VITE_BACKEND_URL}/user/community`;

const headers = () => {
	const token = getToken();
	return {
		"Content-Type": "application/json",
		...(token && { Authorization: `Bearer ${token}` }),
	};
};

const handle = async (request) => {
	try {
		const { data } = await request;
		return data;
	} catch (error) {
		throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || "Request failed");
	}
};

export const getCommunity = (communityId) =>
	handle(axios.get(`${BASE}/${communityId}`, { withCredentials: true, headers: headers() }));

export const joinCommunity = (communityId) =>
	handle(axios.patch(`${BASE}/join/${communityId}`, {}, { withCredentials: true, headers: headers() }));

export const leaveCommunity = (communityId) =>
	handle(axios.patch(`${BASE}/leave/${communityId}`, {}, { withCredentials: true, headers: headers() }));

export const reportCommunity = (communityId, reasonType, reason) =>
	handle(axios.post(`${BASE}/report/${communityId}`, { reasonType, reason }, { withCredentials: true, headers: headers() }));
