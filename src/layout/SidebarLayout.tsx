import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import type { SidebarLayoutProps } from "./layout.types";

export const SidebarLayout = ({
	isOpen,
	items,
	onClose,
	onToggleSidebar,
}: SidebarLayoutProps) => {
	const [openItem, setOpenItem] = useState<string | null>(null);

	const handleParentClick = (itemId: string) => {
		if (!isOpen) {
			onToggleSidebar?.();
			setOpenItem(itemId);
			return;
		}

		setOpenItem((currentItem) => (currentItem === itemId ? null : itemId));
	};

	return (
		<>
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 md:hidden"
					onClick={onClose}
					aria-hidden="true"
				/>
			)}

			<aside
				className={`
					aside-br fixed inset-y-0 left-0 top-0 z-50 h-full
					border-r-2 border-orange-600 bg-gray-50
					transition-all duration-300 ease-in-out
					${isOpen ? "w-auto translate-x-0" : "w-14 -translate-x-full"}
					md:static md:translate-x-0
				`}
			>
				<nav className="scrollbar-sleek min-h-screen w-full space-y-1 overflow-y-auto px-2 py-4">
					{items.map((item) => {
						const hasChildren = Boolean(item.children?.length);
						const isExpanded = openItem === item.id;

						return (
							<div key={item.id}>
								{hasChildren ? (
									<button
										type="button"
										onClick={() => handleParentClick(item.id)}
										className="flex w-full items-center justify-between rounded-lg p-2 text-black transition hover:bg-gray-200"
										aria-expanded={isExpanded}
										aria-controls={`sidebar-children-${item.id}`}
									>
										<span className="flex min-w-0 items-center gap-2">
											<span className="shrink-0 text-xs">{item.icon}</span>

											{isOpen && (
												<span className="truncate text-xs font-medium">
													{item.label}
												</span>
											)}
										</span>

										{isOpen && (
											<span className="rounded p-1" aria-hidden="true">
												<ChevronDown
													size={14}
													className={`text-black transition-transform ${
														isExpanded ? "rotate-180" : ""
													}`}
												/>
											</span>
										)}
									</button>
								) : (
									<NavLink
										to={item.link ?? "#"}
										onClick={() => {
											if (!isOpen) {
												onToggleSidebar?.();
											}

											onClose?.();
										}}
										className={({ isActive }) =>
											`flex items-center gap-2 rounded-lg p-2 text-black transition ${
												isActive
													? "bg-orange-100 text-orange-600"
													: "hover:bg-gray-200"
											}`
										}
									>
										<span className="shrink-0 text-xs">{item.icon}</span>

										{isOpen && (
											<span className="truncate text-xs font-medium">
												{item.label}
											</span>
										)}
									</NavLink>
								)}

								{hasChildren && isExpanded && isOpen && (
									<div
										id={`sidebar-children-${item.id}`}
										className="ml-3 mt-1 space-y-1 text-left text-xs"
									>
										{item.children?.map((child) => (
											<NavLink
												key={child.id}
												to={child.link ?? "#"}
												onClick={onClose}
												className={({ isActive }) =>
													`flex items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs text-black transition ${
														isActive
															? "bg-orange-100 text-orange-600"
															: "hover:bg-gray-200"
													}`
												}
											>
												<span className="inline-flex shrink-0 items-center justify-center">
													{child.icon}
												</span>

												<span>{child.label}</span>
											</NavLink>
										))}
									</div>
								)}
							</div>
						);
					})}
				</nav>
			</aside>
		</>
	);
};
