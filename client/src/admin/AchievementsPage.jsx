import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "../api/adminApi.js";

const ICON_REGEX = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;

function Modal({ onClose, onSave, loading }) {
	const [name, setName] = useState("");
	const [iconUrl, setIconUrl] = useState("");
	const [err, setErr] = useState({});

	const submit = async (e) => {
		e.preventDefault();
		const errs = {};
		if (!name.trim()) errs.name = "Name is required";
		if (iconUrl && !ICON_REGEX.test(iconUrl)) errs.iconUrl = "Must be a valid image URL";
		if (Object.keys(errs).length) return setErr(errs);
		await onSave({ name: name.trim(), iconUrl: iconUrl.trim() || undefined });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
			<motion.div
				initial={{ opacity: 0, y: 20, scale: 0.97 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 20, scale: 0.97 }}
				transition={{ duration: 0.2 }}
				className="bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 w-full max-w-md p-6"
			>
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-base font-bold text-slate-800">New Achievement</h2>
					<button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
					</button>
				</div>
				<form onSubmit={submit} className="space-y-4">
					<div>
						<label className="text-xs font-semibold text-slate-500 mb-1.5 block">Name *</label>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-rose-400 focus:bg-white transition-colors placeholder:text-slate-300"
							placeholder="e.g. First Post"
						/>
						{err.name && <p className="text-red-500 text-xs mt-1">{err.name}</p>}
					</div>
					<div>
						<label className="text-xs font-semibold text-slate-500 mb-1.5 block">Icon URL <span className="font-normal text-slate-400">(optional)</span></label>
						<input
							value={iconUrl}
							onChange={(e) => setIconUrl(e.target.value)}
							className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-rose-400 focus:bg-white transition-colors placeholder:text-slate-300"
							placeholder="https://..."
						/>
						{err.iconUrl && <p className="text-red-500 text-xs mt-1">{err.iconUrl}</p>}
					</div>
					<div className="flex gap-3 pt-1">
						<button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#C9184A] to-[#9D0035] text-white text-sm font-semibold disabled:opacity-50 shadow-sm shadow-rose-200 hover:opacity-90 transition-opacity"
						>
							{loading ? "Saving…" : "Create"}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
}

function StarIcon() {
	return (
		<svg width="22" height="22" viewBox="0 0 16 16" fill="none">
			<path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1L2 5.4l4.2-.8L8 1z" stroke="#C9184A" strokeWidth="1.3" strokeLinejoin="round"/>
		</svg>
	);
}

export default function AchievementsPage() {
	const [achievements, setAchievements] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [error, setError] = useState("");

	const load = async () => {
		try {
			setLoading(true);
			const data = await api.getAchievements();
			setAchievements(data.data);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const handleCreate = async (body) => {
		setSaving(true);
		try {
			await api.createAchievement(body);
			setShowModal(false);
			load();
		} catch (e) {
			setError(e.message);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Delete this achievement?")) return;
		try {
			await api.deleteAchievement(id);
			setAchievements((prev) => prev.filter((a) => a._id !== id));
		} catch (e) {
			setError(e.message);
		}
	};

	return (
		<div>
			{/* Page header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
				<div>
					<h2 className="text-xl font-bold text-slate-800">Achievements</h2>
					<p className="text-sm text-slate-400 mt-0.5">Badges awarded to users on the platform</p>
				</div>
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.97 }}
					onClick={() => setShowModal(true)}
					className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-[#C9184A] to-[#9D0035] text-white text-sm font-semibold shadow-md shadow-rose-200 hover:opacity-90 transition-opacity"
				>
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
					Add Achievement
				</motion.button>
			</div>

			{error && (
				<div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
					{error}
				</div>
			)}

			{loading ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="h-19 rounded-2xl bg-slate-100 animate-pulse" />
					))}
				</div>
			) : achievements.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
						<StarIcon />
					</div>
					<p className="text-slate-500 font-medium text-sm">No achievements yet</p>
					<p className="text-slate-400 text-xs mt-1">Create your first achievement above</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<AnimatePresence>
						{achievements.map((a) => (
							<motion.div
								key={a._id}
								layout
								initial={{ opacity: 0, scale: 0.96 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.92 }}
								className="group bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-rose-200 hover:shadow-md hover:shadow-rose-50 transition-all duration-200"
							>
								{a.iconUrl ? (
									<img src={a.iconUrl} alt={a.name} className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0" />
								) : (
									<div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
										<StarIcon />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-slate-800 text-sm truncate">{a.name}</p>
									<p className="text-xs text-slate-400 mt-0.5">{new Date(a.date).toLocaleDateString()}</p>
								</div>
								<button
									onClick={() => handleDelete(a._id)}
									className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0"
									title="Delete"
								>
									<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
										<path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</button>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}

			<AnimatePresence>
				{showModal && <Modal onClose={() => setShowModal(false)} onSave={handleCreate} loading={saving} />}
			</AnimatePresence>
		</div>
	);
}
