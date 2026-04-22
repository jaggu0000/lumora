import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";

const nav = [
	{
		to: "/admin/achievements",
		label: "Achievements",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.4l-3.7 2 .7-4.1L2 5.4l4.2-.8L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
			</svg>
		),
	},
	{
		to: "/admin/rules",
		label: "Platform Rules",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
				<path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			</svg>
		),
	},
	{
		to: "/admin/user-reports",
		label: "User Reports",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
				<path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			</svg>
		),
	},
	{
		to: "/admin/community-reports",
		label: "Community Reports",
		icon: (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.3"/>
				<circle cx="11" cy="6" r="2" stroke="currentColor" strokeWidth="1.3"/>
				<path d="M1 13c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
			</svg>
		),
	},
];

export default function AdminLayout() {
	return (
		<div className="min-h-screen flex bg-[#FDF4F7]">
			{/* Sidebar */}
			<aside className="w-56 shrink-0 bg-white/80 backdrop-blur border-r border-[#E3AFBC]/40 flex flex-col py-8 px-4 gap-1">
				<div className="flex items-center gap-2 mb-8 px-2">
					<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9184A] to-[#5D001E] flex items-center justify-center shadow">
						<span className="text-white font-bold text-sm">L</span>
					</div>
					<div>
						<p className="text-[#1a0810] font-semibold text-sm leading-tight">Lumora</p>
						<p className="text-[#9e6070] text-xs">Admin Panel</p>
					</div>
				</div>

				{nav.map(({ to, label, icon }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
								isActive
									? "bg-gradient-to-r from-[#C9184A]/10 to-[#5D001E]/5 text-[#C9184A] border border-[#C9184A]/20"
									: "text-[#9e6070] hover:text-[#5D001E] hover:bg-[#F7EEF1]"
							}`
						}
					>
						{icon}
						{label}
					</NavLink>
				))}
			</aside>

			{/* Main */}
			<main className="flex-1 overflow-auto">
				<motion.div
					key={location.pathname}
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.25 }}
					className="p-8"
				>
					<Outlet />
				</motion.div>
			</main>
		</div>
	);
}
