import { NavLink } from "react-router-dom";
import type { SidebarLayoutProps } from "./layout.types";

export const SidebarLayout = ({
	isOpen,
	items,
	onClose,
}: SidebarLayoutProps) => {
	return (
		<>
			{/* Backdrop (mobile only) */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/40 z-40 md:hidden"
					onClick={onClose}
				/>
			)}

			<aside
				className={`
          fixed inset-y-0 left-0 z-50
          bg-gray-50 border-r border-orange-600
          transition-all duration-300 ease-in-out
          ${isOpen ? "w-64" : "w-16"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}

          md:static md:translate-x-0
        `}
			>
				{/* Mobile close button */}
				<div className="flex items-center justify-end p-3 border-b md:hidden">
					<button
						onClick={onClose}
						className="p-2 rounded-md hover:bg-gray-200"
					>
						Close ✕
					</button>
				</div>

				<nav className="h-full px-2 py-4 space-y-1">
					{items.map((item) => (
						<NavLink
							key={item.id}
							to={item.link ?? "#"}
							// onClick={onClose}
							className={({ isActive }) =>
								`flex items-center gap-2 p-2 rounded-lg
								transition
								${isActive ? "bg-orange-100 text-orange-600" : "hover:bg-gray-200"}`
							}
						>
							<span className="text-sm shrink-0">{item.icon}</span>

							{isOpen && (
								<span className="text-sm font-medium whitespace-nowrap">
									{item.label}
								</span>
							)}
						</NavLink>
					))}
				</nav>
			</aside>
		</>
	);
};
