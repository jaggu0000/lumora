import ReportsPage from "./ReportsPage.jsx";
import { getCommunityReports, resolveCommunityReport } from "../api/adminApi.js";

export default function CommunityReportsPage() {
	return (
		<ReportsPage
			title="Community Reports"
			description="Review and resolve reports submitted against communities"
			fetchFn={getCommunityReports}
			resolveFn={resolveCommunityReport}
			entityKey="reportedCommunity"
		/>
	);
}
