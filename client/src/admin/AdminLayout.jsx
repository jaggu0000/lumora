import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

const nav = [
	{
		to: "/admin/achievements",
		label: "Achievements",
		icon: (
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none">
				<path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1L2 5.4l4.2-.8L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
			</svg>
		),
	},
	{
		to: "/admin/rules",
		label: "Platform Rules",
		icon: (
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none">
				<rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
				<path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			</svg>
		),
	},
	{
		to: "/admin/user-reports",
		label: "User Reports",
		icon: (
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none">
				<circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
				<path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			</svg>
		),
	},
	{
		to: "/admin/community-reports",
		label: "Community Reports",
		icon: (
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none">
				<circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.3"/>
				<circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.3"/>
				<path d="M1 13c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			</svg>
		),
	},
];

const PAGE_LABELS = {
	"/admin/achievements": "Achievements",
	"/admin/rules": "Platform Rules",
	"/admin/user-reports": "User Reports",
	"/admin/community-reports": "Community Reports",
};

function LogoutIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
			<path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			<path d="M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
		</svg>
	);
}

function Sidebar({ onClose, onLogout }) {
	return (
		<aside className="w-64 shrink-0 bg-white flex flex-col h-full border-r border-rose-100">
			{/* Brand */}
			<div className="flex items-center justify-between px-5 py-5 border-b border-rose-100">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#C9184A] to-[#7B0032] flex items-center justify-center shadow-md shadow-rose-200">
						<span className="text-white font-black text-base tracking-tight">L</span>
					</div>
					<div>
						<p className="text-[#1a0810] font-bold text-sm leading-tight">Lumora</p>
						<p className="text-rose-400 text-xs font-medium">Admin Panel</p>
					</div>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
						aria-label="Close menu"
					>
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
							<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
						</svg>
					</button>
				)}
			</div>

			{/* Nav */}
			<nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
				<p className="text-[10px] font-semibold text-rose-300 uppercase tracking-widest px-3 mb-2">Management</p>
				{nav.map(({ to, label, icon }) => (
					<NavLink
						key={to}
						to={to}
						onClick={onClose}
						className={({ isActive }) =>
							`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
								isActive
									? "bg-rose-50 text-[#C9184A] border border-rose-200 shadow-sm"
									: "text-slate-500 hover:text-[#C9184A] hover:bg-rose-50/60"
							}`
						}
					>
						{({ isActive }) => (
							<>
								<span className={isActive ? "text-[#C9184A]" : "text-slate-400"}>{icon}</span>
								{label}
							</>
						)}
					</NavLink>
				))}
			</nav>

			{/* Logout */}
			<div className="px-3 py-4 border-t border-rose-100">
				<button
					onClick={onLogout}
					className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
				>
					<span className="text-slate-400 group-hover:text-red-500"><LogoutIcon /></span>
					Log Out
				</button>
			</div>
		</aside>
	);
}

export default function AdminLayout() {
	const [menuOpen, setMenuOpen] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const { logout, user } = useAuth();

	useEffect(() => { setMenuOpen(false); }, [location.pathname]);

	const handleLogout = async () => {
		try {
			const BASE = import.meta.env.VITE_BACKEND_URL;
			await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" });
		} finally {
			logout();
			navigate("/login", { replace: true });
		}
	};

	const pageLabel = PAGE_LABELS[location.pathname] ?? "Admin";

	return (
		<div className="min-h-screen flex bg-slate-50">
			{/* Desktop sidebar */}
			<div className="hidden md:flex h-screen sticky top-0 shadow-sm">
				<Sidebar onLogout={handleLogout} />
			</div>

			{/* Mobile backdrop */}
			<AnimatePresence>
				{menuOpen && (
					<motion.div
						className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm md:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setMenuOpen(false)}
					/>
				)}
			</AnimatePresence>

			{/* Mobile drawer */}
			<AnimatePresence>
				{menuOpen && (
					<motion.div
						className="fixed inset-y-0 left-0 z-50 md:hidden drop-shadow-xl"
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
					>
						<Sidebar onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
					</motion.div>
				)}
			</AnimatePresence>

			{/* Content area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Topbar */}
				<header className="sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8 h-14">
					<div className="flex items-center gap-3">
						{/* Hamburger (mobile only) */}
						<button
							onClick={() => setMenuOpen(true)}
							className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
							aria-label="Open menu"
						>
							<svg width="18" height="18" viewBox="0 0 20 20" fill="none">
								<path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
							</svg>
						</button>
						<h1 className="font-semibold text-slate-800 text-sm sm:text-base">{pageLabel}</h1>
					</div>

					{/* Right side of topbar */}
					<div className="flex items-center gap-3">
						{user && (
							<span className="hidden sm:block text-xs text-slate-400 font-medium">
								{user.username || user.email}
							</span>
						)}
						<div className="w-8 h-8 rounded-full bg-linear-to-br from-[#C9184A] to-[#7B0032] flex items-center justify-center text-white text-xs font-bold">
							A
						</div>
						{/* Desktop logout */}
						<button
							onClick={handleLogout}
							className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
						>
							<LogoutIcon />
							Log Out
						</button>
					</div>
				</header>

				{/* Page content */}
				<main className="flex-1 overflow-auto">
					<motion.div
						key={location.pathname}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.2 }}
						className="p-4 sm:p-6 md:p-8 max-w-6xl"
					>
						<Outlet />
					</motion.div>
				</main>
			</div>
		</div>
	);
}
