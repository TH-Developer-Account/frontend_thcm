import type { SidebarItem } from "./sidebar.types";
import React from "react";
type SidebarLayoutProps = {
	isOpen: boolean;
	items: SidebarItem[];
	onClose?: () => void; // for mobile overlay
	className?: string;
};

export const SidebarLayout = ({
	isOpen,
	items,
	onClose,
	// className,
}: SidebarLayoutProps) => {
	return (
		<React.Fragment>
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
					transition-transform duration-300 ease-in-out
					w-64
					${isOpen ? "translate-x-0" : "-translate-x-full"}

					md:static md:translate-x-0
					md:transition-none
					${isOpen ? "md:w-58" : "md:w-16"}
				`}
			>
				{/* Mobile close button */}
				<div className="flex items-center justify-end p-3 border-b md:hidden">
					<button
						onClick={onClose}
						className="p-2 rounded-md hover:bg-gray-200"
						aria-label="Close sidebar"
					>
						Close ✕
					</button>
				</div>
				<nav className="h-full px-2 py-4 space-y-1">
					{items.map((item) => (
						<button
							key={item.id}
							onClick={item.onClick}
							className="w-full  rounded-lg
								hover:bg-gray-200 transition text-left sidebar-icons"
						>
							<a
								href={item.link}
								rel={item.label}
								className="flex items-center gap-1 p-2"
							>
								{!isOpen ? (
									<span className="text-sm">{item.icon}</span>
								) : (
									<span className="text-sm shrink-0 w-auto">{item.icon}</span>
								)}
								{isOpen && (
									<span className="text-sm font-medium whitespace-nowrap ml-2">
										{item.label}
									</span>
								)}
							</a>
						</button>
					))}
				</nav>
			</aside>
		</React.Fragment>
	);
};
