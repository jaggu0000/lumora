import axios from "axios";
import { getToken } from "./token";

const BASE = import.meta.env.VITE_BACKEND_URL;

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
		throw new Error(error.response?.data?.message || error.message || "Request failed");
	}
};

// Achievements
export const getAchievements = () =>
	handle(axios.get(`${BASE}/admin/achievements`, { withCredentials: true, headers: headers() }));

export const createAchievement = (body) =>
	handle(axios.post(`${BASE}/admin/achievements`, body, { withCredentials: true, headers: headers() }));

export const deleteAchievement = (id) =>
	handle(axios.delete(`${BASE}/admin/achievements/${id}`, { withCredentials: true, headers: headers() }));

// Rules
export const getRules = () =>
	handle(axios.get(`${BASE}/admin/rules`, { withCredentials: true, headers: headers() }));

export const createRule = (body) =>
	handle(axios.post(`${BASE}/admin/rules`, body, { withCredentials: true, headers: headers() }));

export const updateRule = (id, body) =>
	handle(axios.patch(`${BASE}/admin/rules/${id}`, body, { withCredentials: true, headers: headers() }));

export const deleteRule = (id) =>
	handle(axios.delete(`${BASE}/admin/rules/${id}`, { withCredentials: true, headers: headers() }));

// User Reports
export const getUserReports = (params = {}) => {
	const q = new URLSearchParams(params).toString();
	return handle(
		axios.get(`${BASE}/admin/user-reports${q ? `?${q}` : ""}`, {
			withCredentials: true,
			headers: headers(),
		})
	);
};

export const resolveUserReport = (id, status) =>
	handle(
		axios.patch(
			`${BASE}/admin/user-reports/${id}/status`,
			{ status },
			{ withCredentials: true, headers: headers() }
		)
	);

// Community Reports
export const getCommunityReports = (params = {}) => {
	const q = new URLSearchParams(params).toString();
	return handle(
		axios.get(`${BASE}/admin/community-reports${q ? `?${q}` : ""}`, {
			withCredentials: true,
			headers: headers(),
		})
	);
};

export const resolveCommunityReport = (id, status) =>
	handle(
		axios.patch(
			`${BASE}/admin/community-reports/${id}/status`,
			{ status },
			{ withCredentials: true, headers: headers() }
		)
	);

export const deleteReportedCommunity = (communityId) =>
	handle(
		axios.delete(`${BASE}/admin/communities/${communityId}`, {
			withCredentials: true,
			headers: headers(),
		})
	);
