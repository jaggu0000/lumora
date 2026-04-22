import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "../api/adminApi.js";

function TagInput({ label, value, onChange }) {
	const [input, setInput] = useState("");

	const add = () => {
		const v = input.trim();
		if (v && !value.includes(v)) onChange([...value, v]);
		setInput("");
	};

	const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

	return (
		<div>
			<label className="text-xs font-medium text-[#9e6070] mb-1 block">{label} *</label>
			<div className="flex flex-wrap gap-1.5 mb-2">
				{value.map((v, i) => (
					<span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C9184A]/10 text-[#C9184A] text-xs font-medium">
						{v}
						<button type="button" onClick={() => remove(i)} className="hover:text-red-600">×</button>
					</span>
				))}
			</div>
			<div className="flex gap-2">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
					className="flex-1 px-3 py-2 rounded-xl border border-[#E3AFBC]/60 bg-[#FDF4F7] text-[#1a0810] text-sm outline-none focus:border-[#C9184A]/50"
					placeholder="Type and press Enter or Add"
				/>
				<button type="button" onClick={add} className="px-3 py-2 rounded-xl border border-[#E3AFBC]/60 text-[#9e6070] text-sm hover:bg-[#F7EEF1]">
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
				className="bg-white rounded-2xl shadow-xl border border-[#E3AFBC]/60 w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
			>
				<h2 className="text-lg font-semibold text-[#1a0810] mb-5">{rule ? "Edit Rule" : "New Rule"}</h2>
				<form onSubmit={submit} className="space-y-4">
					<div>
						<label className="text-xs font-medium text-[#9e6070] mb-1 block">Name *</label>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-3 py-2 rounded-xl border border-[#E3AFBC]/60 bg-[#FDF4F7] text-[#1a0810] text-sm outline-none focus:border-[#C9184A]/50"
							placeholder="e.g. No Spam Policy"
						/>
						{err.name && <p className="text-red-500 text-xs mt-1">{err.name}</p>}
					</div>

					<TagInput label="Conditions" value={conditions} onChange={setConditions} />
					{err.conditions && <p className="text-red-500 text-xs -mt-2">{err.conditions}</p>}

					<TagInput label="Actions" value={actions} onChange={setActions} />
					{err.actions && <p className="text-red-500 text-xs -mt-2">{err.actions}</p>}

					<div className="flex gap-3 pt-2">
						<button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-[#E3AFBC]/60 text-[#9e6070] text-sm hover:bg-[#F7EEF1]">
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#C9184A] to-[#9D0035] text-white text-sm font-medium disabled:opacity-50"
						>
							{loading ? "Saving…" : rule ? "Update" : "Create"}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
}

export default function RulesPage() {
	const [rules, setRules] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [modal, setModal] = useState(null); // null | "new" | rule object
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
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold text-[#1a0810]">Platform Rules</h1>
					<p className="text-sm text-[#9e6070] mt-0.5">Define conditions and automated actions for the platform</p>
				</div>
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.97 }}
					onClick={() => setModal("new")}
					className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9184A] to-[#9D0035] text-white text-sm font-medium shadow-[0_4px_16px_rgba(201,24,74,0.3)] flex items-center gap-2"
				>
					<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
					Add Rule
				</motion.button>
			</div>

			{error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}

			{loading ? (
				<div className="space-y-3">
					{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-[#E3AFBC]/20 animate-pulse" />)}
				</div>
			) : rules.length === 0 ? (
				<div className="text-center py-20 text-[#c89faa]">No rules yet. Create one above.</div>
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
								className="bg-white border border-[#E3AFBC]/40 rounded-2xl p-5 group"
							>
								<div className="flex items-start justify-between gap-4">
									<p className="font-semibold text-[#1a0810]">{r.name}</p>
									<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
										<button onClick={() => setModal(r)} className="p-1.5 rounded-lg text-[#c89faa] hover:text-[#C9184A] hover:bg-[#F7EEF1]">
											<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
												<path d="M11.3 2.7a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.5-8.3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
											</svg>
										</button>
										<button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg text-[#c89faa] hover:text-red-500 hover:bg-red-50">
											<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
												<path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</button>
									</div>
								</div>
								<div className="mt-3 grid grid-cols-2 gap-4">
									<div>
										<p className="text-xs text-[#9e6070] font-medium mb-1.5">Conditions</p>
										<div className="flex flex-wrap gap-1">
											{r.conditions.map((c, i) => (
												<span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs">{c}</span>
											))}
										</div>
									</div>
									<div>
										<p className="text-xs text-[#9e6070] font-medium mb-1.5">Actions</p>
										<div className="flex flex-wrap gap-1">
											{r.actions.map((a, i) => (
												<span key={i} className="px-2 py-0.5 rounded-md bg-[#C9184A]/10 text-[#C9184A] text-xs">{a}</span>
											))}
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
