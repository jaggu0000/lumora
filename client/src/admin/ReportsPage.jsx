import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
	Pending:   { pill: "bg-amber-50 text-amber-600 border-amber-200",  dot: "bg-amber-400" },
	Reviewed:  { pill: "bg-blue-50 text-blue-600 border-blue-200",     dot: "bg-blue-400" },
	Resolved:  { pill: "bg-green-50 text-green-600 border-green-200",  dot: "bg-green-400" },
	Dismissed: { pill: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

const ACTION_COLORS = {
	Resolved:  "bg-green-50 text-green-600 border-green-200 hover:bg-green-100",
	Dismissed: "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200",
	Reviewed:  "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
};

const STATUSES = ["Pending", "Reviewed", "Resolved", "Dismissed"];
const ACTION_STATUSES = ["Reviewed", "Resolved", "Dismissed"];
const FINAL_STATUSES = new Set(["Resolved", "Dismissed"]);

function ChevronIcon({ open }) {
	return (
		<svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
			<path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
		</svg>
	);
}

function ReportCard({ report, entityKey, onResolve, resolving }) {
	const [open, setOpen] = useState(false);

	const entity = report[entityKey];
	const availableActions = ACTION_STATUSES.filter((s) => s !== report.status);
	const canTakeAction = !FINAL_STATUSES.has(report.status) && availableActions.length > 0;
	const entityName = entity
		? entityKey === "reportedUser"
			? entity.username || entity.email
			: entity.communityName || entity.name
		: "Unknown";

	const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.Pending;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, x: -16 }}
			className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-rose-200 hover:shadow-sm hover:shadow-rose-50 transition-all duration-200"
		>
			{/* Card header row */}
			<button
				className="w-full flex items-center gap-3 sm:gap-4 p-4 text-left hover:bg-slate-50/60 transition-colors"
				onClick={() => setOpen((o) => !o)}
			>
				{/* Avatar */}
				<div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-[#C9184A] font-bold text-sm">
					{entityName?.[0]?.toUpperCase() || "?"}
				</div>

				{/* Name + meta */}
				<div className="flex-1 min-w-0 text-left">
					<p className="text-sm font-semibold text-slate-700 truncate">{entityName}</p>
					<p className="text-xs text-slate-400 mt-0.5 truncate">
						Reported by <span className="font-medium text-slate-500">{report.reportedBy?.username || report.reportedBy?.email || "unknown"}</span>
						{" · "}{new Date(report.createdAt).toLocaleDateString()}
					</p>
				</div>

				{/* Status + chevron */}
				<div className="flex items-center gap-2 shrink-0">
					<span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
						<span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
						{report.status}
					</span>
					<span className={`sm:hidden w-2 h-2 rounded-full ${cfg.dot}`} />
					<span className="text-slate-300"><ChevronIcon open={open} /></span>
				</div>
			</button>

			{/* Expanded detail */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-4">
							{/* Status chip on mobile */}
							<div className="sm:hidden">
								<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
									<span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
									{report.status}
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="bg-slate-50 rounded-xl p-3">
									<p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Reason Type</p>
									<p className="text-sm font-medium text-slate-700">{report.reasonType}</p>
								</div>
								{report.reportedCommunity && (
									<div className="bg-slate-50 rounded-xl p-3">
										<p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Community</p>
										<p className="text-sm font-medium text-slate-700">
											{report.reportedCommunity.communityName}
											{report.reportedCommunity.communityTag && (
												<span className="text-slate-400 font-normal"> #{report.reportedCommunity.communityTag}</span>
											)}
										</p>
									</div>
								)}
							</div>

							<div>
								<p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Reason</p>
								<p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">{report.reason}</p>
							</div>

							{report.resolvedAt && (
								<p className="text-xs text-slate-400">
									Resolved {new Date(report.resolvedAt).toLocaleString()}
								</p>
							)}

							{canTakeAction && (
								<div className="flex flex-wrap gap-2 pt-1">
									{availableActions.map((s) => (
										<button
											key={s}
											disabled={resolving}
											onClick={() => onResolve(report._id, s)}
											className={`flex-1 min-w-24 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 ${ACTION_COLORS[s]}`}
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
	const pending = reports.filter((r) => r.status === "Pending").length;

	return (
		<div>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
				<div>
					<h2 className="text-xl font-bold text-slate-800">{title}</h2>
					<p className="text-sm text-slate-400 mt-0.5">{description}</p>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					<label className="text-xs font-semibold text-slate-400">Status</label>
					<select
						value={statusFilter}
						onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
						className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm outline-none focus:border-rose-400 transition-colors cursor-pointer"
					>
						<option value="">All</option>
						{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
					</select>
				</div>
			</div>

			{/* Summary chips */}
			{!loading && reports.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-5">
					<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
						{total} total
					</span>
					{pending > 0 && (
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-200">
							<span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
							{pending} pending
						</span>
					)}
				</div>
			)}

			{error && (
				<div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
					{error}
				</div>
			)}

			{loading ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
				</div>
			) : reports.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
						<svg width="22" height="22" viewBox="0 0 16 16" fill="none">
							<circle cx="8" cy="5" r="3" stroke="#C9184A" strokeWidth="1.3"/>
							<path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#C9184A" strokeWidth="1.3" strokeLinecap="round"/>
						</svg>
					</div>
					<p className="text-slate-500 font-medium text-sm">No reports found</p>
					<p className="text-slate-400 text-xs mt-1">{statusFilter ? `No ${statusFilter} reports` : "All clear for now"}</p>
				</div>
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
						<div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-100">
							<p className="text-sm text-slate-400">Showing <span className="font-semibold text-slate-600">{reports.length}</span> of <span className="font-semibold text-slate-600">{total}</span> reports</p>
							<div className="flex items-center gap-1">
								<button
									disabled={page === 1}
									onClick={() => setPage((p) => p - 1)}
									className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
								>
									<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
									<button
										key={p}
										onClick={() => setPage(p)}
										className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
											p === page
												? "bg-[#C9184A] text-white shadow-sm"
												: "border border-slate-200 text-slate-500 hover:bg-slate-50"
										}`}
									>
										{p}
									</button>
								))}
								<button
									disabled={page === totalPages}
									onClick={() => setPage((p) => p + 1)}
									className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-colors"
								>
									<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
