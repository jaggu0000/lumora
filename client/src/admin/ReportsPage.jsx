import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS = {
	Pending: "bg-amber-50 text-amber-600 border-amber-200",
	Reviewed: "bg-blue-50 text-blue-600 border-blue-200",
	Resolved: "bg-green-50 text-green-600 border-green-200",
	Dismissed: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUSES = ["Pending", "Reviewed", "Resolved", "Dismissed"];
const ACTION_STATUSES = ["Reviewed", "Resolved", "Dismissed"];
const FINAL_STATUSES = new Set(["Resolved", "Dismissed"]);

function ReportCard({ report, entityKey, onResolve, resolving }) {
	const [open, setOpen] = useState(false);

	const entity = report[entityKey];
	const availableActions = ACTION_STATUSES.filter((status) => status !== report.status);
	const canTakeAction = !FINAL_STATUSES.has(report.status) && availableActions.length > 0;
	const entityName = entity
		? entityKey === "reportedUser"
			? entity.username || entity.email
			: entity.name
		: "—";

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, x: -20 }}
			className="bg-white border border-[#E3AFBC]/40 rounded-2xl overflow-hidden"
		>
			<div
				className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-[#FDF4F7] transition-colors"
				onClick={() => setOpen((o) => !o)}
			>
				<div className="flex items-center gap-3 min-w-0">
					<div className="w-8 h-8 rounded-full bg-[#C9184A]/10 flex items-center justify-center shrink-0 text-[#C9184A] font-semibold text-sm">
						{entityName?.[0]?.toUpperCase() || "?"}
					</div>
					<div className="min-w-0">
						<p className="text-sm font-medium text-[#1a0810] truncate">{entityName}</p>
						<p className="text-xs text-[#9e6070]">
							by {report.reportedBy?.username || report.reportedBy?.email || "unknown"} · {new Date(report.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[report.status]}`}>
						{report.status}
					</span>
					<svg
						width="14" height="14" viewBox="0 0 16 16" fill="none"
						className={`text-[#c89faa] transition-transform ${open ? "rotate-180" : ""}`}
					>
						<path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</div>
			</div>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden border-t border-[#E3AFBC]/30"
					>
						<div className="p-4 space-y-3">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="text-xs text-[#9e6070] mb-0.5">Reason Type</p>
									<p className="text-sm text-[#1a0810] font-medium">{report.reasonType}</p>
								</div>
								{report.associatedCommunity && (
									<div>
										<p className="text-xs text-[#9e6070] mb-0.5">Community</p>
										<p className="text-sm text-[#1a0810]">{report.associatedCommunity.name}</p>
									</div>
								)}
							</div>
							<div>
								<p className="text-xs text-[#9e6070] mb-0.5">Reason</p>
								<p className="text-sm text-[#1a0810] bg-[#FDF4F7] rounded-xl p-3">{report.reason}</p>
							</div>
							{report.resolvedAt && (
								<p className="text-xs text-[#9e6070]">Resolved at: {new Date(report.resolvedAt).toLocaleString()}</p>
							)}
							{canTakeAction && (
								<div className="flex gap-2 pt-1">
									{availableActions.map((s) => (
										<button
											key={s}
											disabled={resolving}
											onClick={() => onResolve(report._id, s)}
											className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 ${
												s === "Resolved"
													? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
													: s === "Dismissed"
													? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
													: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
											}`}
										>
											{resolving ? "…" : `Mark ${s}`}
										</button>
									))}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export default function ReportsPage({ title, description, fetchFn, resolveFn, entityKey }) {
	const [reports, setReports] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [resolving, setResolving] = useState(false);
	const [error, setError] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [page, setPage] = useState(1);
	const limit = 10;

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const params = { page, limit };
			if (statusFilter) params.status = statusFilter;
			const data = await fetchFn(params);
			setReports(data.reports);
			setTotal(data.total);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}, [fetchFn, page, statusFilter]);

	useEffect(() => { load(); }, [load]);

	const handleResolve = async (id, status) => {
		setResolving(true);
		try {
			const updated = await resolveFn(id, status);
			setReports((prev) => prev.map((r) => (r._id === id ? updated.data : r)));
		} catch (e) {
			setError(e.message);
		} finally {
			setResolving(false);
		}
	};

	const totalPages = Math.ceil(total / limit);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-[#1a0810]">{title}</h1>
					<p className="text-sm text-[#9e6070] mt-0.5">{description}</p>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs text-[#9e6070]">Filter:</span>
					<select
						value={statusFilter}
						onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
						className="px-3 py-1.5 rounded-xl border border-[#E3AFBC]/60 bg-white text-[#1a0810] text-sm outline-none focus:border-[#C9184A]/50"
					>
						<option value="">All</option>
						{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
					</select>
				</div>
			</div>

			{error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

			{loading ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-[#E3AFBC]/20 animate-pulse" />)}
				</div>
			) : reports.length === 0 ? (
				<div className="text-center py-20 text-[#c89faa]">No reports found.</div>
			) : (
				<>
					<div className="space-y-3">
						<AnimatePresence>
							{reports.map((r) => (
								<ReportCard
									key={r._id}
									report={r}
									entityKey={entityKey}
									onResolve={handleResolve}
									resolving={resolving}
								/>
							))}
						</AnimatePresence>
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-6">
							<p className="text-sm text-[#9e6070]">Showing {reports.length} of {total}</p>
							<div className="flex gap-2">
								<button
									disabled={page === 1}
									onClick={() => setPage((p) => p - 1)}
									className="px-3 py-1.5 rounded-xl border border-[#E3AFBC]/60 text-sm text-[#9e6070] disabled:opacity-40 hover:bg-[#F7EEF1]"
								>
									Prev
								</button>
								<span className="px-3 py-1.5 text-sm text-[#1a0810]">{page} / {totalPages}</span>
								<button
									disabled={page === totalPages}
									onClick={() => setPage((p) => p + 1)}
									className="px-3 py-1.5 rounded-xl border border-[#E3AFBC]/60 text-sm text-[#9e6070] disabled:opacity-40 hover:bg-[#F7EEF1]"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
