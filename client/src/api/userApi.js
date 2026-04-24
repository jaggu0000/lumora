import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL;

const headers = () => ({
	"Content-Type": "application/json",
});

const handle = async (request) => {
	try {
		const { data } = await request;
		return data;
	} catch (error) {
		throw new Error(error.response?.data?.message || error.message || "Request failed");
	}
};

export const getUserProfile = () =>
	handle(axios.get(`${BASE}/user/profile`, { withCredentials: true, headers: headers() }));
