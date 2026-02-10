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
					bg-gray-50 border-r
					transition-transform duration-300 ease-in-out
					w-64
					${isOpen ? "translate-x-0" : "-translate-x-full"}

					md:static md:translate-x-0
					md:transition-none
					${isOpen ? "md:w-64" : "md:w-16"}
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
							className="w-full flex items-center gap-3 p-2 rounded-lg
						hover:bg-gray-200 transition text-left"
						>
							<span className="text-lg shrink-0">{item.icon}</span>

							{isOpen && (
								<span className="text-sm font-medium whitespace-nowrap">
									{item.label}
								</span>
							)}
						</button>
					))}
				</nav>
			</aside>
		</React.Fragment>
	);
};
