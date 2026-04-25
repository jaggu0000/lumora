import ReportsPage from "./ReportsPage.jsx";
import { deleteReportedCommunity, getCommunityReports, resolveCommunityReport } from "../api/adminApi.js";

export default function CommunityReportsPage() {
	const fetchCommunityReportsWithDelete = Object.assign(getCommunityReports, {
		deleteEntityFn: deleteReportedCommunity,
	});

	return (
		<ReportsPage
			title="Community Reports"
			description="Review and resolve reports submitted against communities"
			fetchFn={fetchCommunityReportsWithDelete}
			resolveFn={resolveCommunityReport}
			entityKey="reportedCommunity"
		/>
	);
}
