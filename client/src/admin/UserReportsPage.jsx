import ReportsPage from "./ReportsPage.jsx";
import { getUserReports, resolveUserReport } from "../api/adminApi.js";

export default function UserReportsPage() {
	return (
		<ReportsPage
			title="User Reports"
			description="Review and resolve reports submitted against users"
			fetchFn={getUserReports}
			resolveFn={resolveUserReport}
			entityKey="reportedUser"
		/>
	);
}
