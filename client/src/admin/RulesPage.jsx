import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "../api/adminApi.js";

function Tag({ children, onRemove, color = "rose" }) {
	const colors = {
		rose: "bg-rose-50 text-rose-600 border-rose-200",
		blue: "bg-blue-50 text-blue-600 border-blue-200",
	};
	return (
		<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${colors[color]}`}>
			{children}
			{onRemove && (
				<button type="button" onClick={onRemove} className="hover:opacity-60 transition-opacity leading-none ml-0.5">
					×
				</button>
			)}
		</span>
	);
}

function TagInput({ label, value, onChange, color }) {
	const [input, setInput] = useState("");

	const add = () => {
		const v = input.trim();
		if (v && !value.includes(v)) onChange([...value, v]);
		setInput("");
	};

	return (
		<div>
			<label className="text-xs font-semibold text-slate-500 mb-1.5 block">{label} *</label>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mb-2">
					{value.map((v, i) => (
						<Tag key={i} color={color} onRemove={() => onChange(value.filter((_, idx) => idx !== i))}>
							{v}
						</Tag>
					))}
				</div>
			)}
			<div className="flex gap-2">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
					className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-rose-400 focus:bg-white transition-colors placeholder:text-slate-300"
					placeholder="Type and press Enter or Add"
				/>
				<button type="button" onClick={add} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">
					Add
				</button>
			</div>
		</div>
	);
}

function RuleModal({ rule, onClose, onSave, loading }) {
	const [name, setName] = useState(rule?.name || "");
	const [conditions, setConditions] = useState(rule?.conditions || []);
	const [actions, setActions] = useState(rule?.actions || []);
	const [err, setErr] = useState({});

	const submit = async (e) => {
		e.preventDefault();
		const errs = {};
		if (!name.trim()) errs.name = "Name is required";
		if (!conditions.length) errs.conditions = "At least one condition is required";
		if (!actions.length) errs.actions = "At least one action is required";
		if (Object.keys(errs).length) return setErr(errs);
		await onSave({ name: name.trim(), conditions, actions });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4">
			<motion.div
				initial={{ opacity: 0, y: 20, scale: 0.97 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 20, scale: 0.97 }}
				transition={{ duration: 0.2 }}
				className="bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
			>
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-base font-bold text-slate-800">{rule ? "Edit Rule" : "New Rule"}</h2>
					<button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
					</button>
				</div>
				<form onSubmit={submit} className="space-y-5">
					<div>
						<label className="text-xs font-semibold text-slate-500 mb-1.5 block">Rule Name *</label>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm outline-none focus:border-rose-400 focus:bg-white transition-colors placeholder:text-slate-300"
							placeholder="e.g. No Spam Policy"
						/>
						{err.name && <p className="text-red-500 text-xs mt-1">{err.name}</p>}
					</div>

					<div>
						<TagInput label="Conditions" value={conditions} onChange={setConditions} color="blue" />
						{err.conditions && <p className="text-red-500 text-xs mt-1">{err.conditions}</p>}
					</div>

					<div>
						<TagInput label="Actions" value={actions} onChange={setActions} color="rose" />
						{err.actions && <p className="text-red-500 text-xs mt-1">{err.actions}</p>}
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
							{loading ? "Saving…" : rule ? "Update" : "Create"}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
}

function RulesIcon() {
	return (
		<svg width="22" height="22" viewBox="0 0 16 16" fill="none">
			<rect x="2" y="2" width="12" height="12" rx="2" stroke="#C9184A" strokeWidth="1.3"/>
			<path d="M5 6h6M5 9h4" stroke="#C9184A" strokeWidth="1.3" strokeLinecap="round"/>
		</svg>
	);
}

export default function RulesPage() {
	const [rules, setRules] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [modal, setModal] = useState(null);
	const [error, setError] = useState("");

	const load = async () => {
		try {
			setLoading(true);
			const data = await api.getRules();
			setRules(data.data);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const handleSave = async (body) => {
		setSaving(true);
		try {
			if (modal?._id) {
				await api.updateRule(modal._id, body);
			} else {
				await api.createRule(body);
			}
			setModal(null);
			load();
		} catch (e) {
			setError(e.message);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Delete this rule?")) return;
		try {
			await api.deleteRule(id);
			setRules((prev) => prev.filter((r) => r._id !== id));
		} catch (e) {
			setError(e.message);
		}
	};

	return (
		<div>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
				<div>
					<h2 className="text-xl font-bold text-slate-800">Platform Rules</h2>
					<p className="text-sm text-slate-400 mt-0.5">Define conditions and automated actions for the platform</p>
				</div>
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.97 }}
					onClick={() => setModal("new")}
					className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-[#C9184A] to-[#9D0035] text-white text-sm font-semibold shadow-md shadow-rose-200 hover:opacity-90 transition-opacity"
				>
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
					Add Rule
				</motion.button>
			</div>

			{error && (
				<div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
					{error}
				</div>
			)}

			{loading ? (
				<div className="space-y-3">
					{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
				</div>
			) : rules.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
						<RulesIcon />
					</div>
					<p className="text-slate-500 font-medium text-sm">No rules yet</p>
					<p className="text-slate-400 text-xs mt-1">Create your first platform rule above</p>
				</div>
			) : (
				<div className="space-y-3">
					<AnimatePresence>
						{rules.map((r) => (
							<motion.div
								key={r._id}
								layout
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-rose-200 hover:shadow-md hover:shadow-rose-50 transition-all duration-200"
							>
								<div className="flex items-start justify-between gap-4">
									<p className="font-semibold text-slate-800 text-sm">{r.name}</p>
									<div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
										<button
											onClick={() => setModal(r)}
											className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
											title="Edit"
										>
											<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
												<path d="M11.3 2.7a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.5-8.3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
											</svg>
										</button>
										<button
											onClick={() => handleDelete(r._id)}
											className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
											title="Delete"
										>
											<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
												<path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</button>
									</div>
								</div>
								<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Conditions</p>
										<div className="flex flex-wrap gap-1.5">
											{r.conditions.map((c, i) => <Tag key={i} color="blue">{c}</Tag>)}
										</div>
									</div>
									<div>
										<p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Actions</p>
										<div className="flex flex-wrap gap-1.5">
											{r.actions.map((a, i) => <Tag key={i} color="rose">{a}</Tag>)}
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}

			<AnimatePresence>
				{modal && (
					<RuleModal
						rule={modal === "new" ? null : modal}
						onClose={() => setModal(null)}
						onSave={handleSave}
						loading={saving}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
