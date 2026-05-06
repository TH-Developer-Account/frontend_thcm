import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import type { SidebarLayoutProps } from "./layout.types";
import { ChevronDown } from "lucide-react";

export const SidebarLayout = ({
	isOpen,
	items,
	onClose,
}: SidebarLayoutProps) => {
	const [openItem, setOpenItem] = useState<string | null>(null);

	const toggleItem = (id: string) => {
		setOpenItem(openItem === id ? null : id);
	};

	return (
		<React.Fragment>
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/40 z-40 md:hidden"
					onClick={onClose}
				/>
			)}

			<aside
				className={`
		aside-br
		fixed inset-y-0 left-0 z-50
		bg-gray-50 border-r-2 border-orange-600
		transition-all duration-300 ease-in-out
		${isOpen ? "w-48" : "w-14"}
		md:static md:translate-x-0
	`}
			>
				<nav className="h-screen w-full px-2 py-4 space-y-1 overflow-y-auto scrollbar-sleek">
					{items.map((item) => {
						const hasChildren = !!item.children?.length;

						return (
							<div key={item.id}>
								{/* Parent Item */}
								{hasChildren ? (
									<button
										onClick={() => toggleItem(item.id)}
										className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-200 "
									>
										<div className="flex items-center gap-2 text-black">
											<span className="text-xs shrink-0">{item.icon}</span>
											{isOpen && (
												<span className="text-xs font-medium">
													{item.label}
												</span>
											)}
										</div>

										{isOpen && (
											<ChevronDown
												size={14}
												className={`transition-transform text-black ${
													openItem === item.id ? "rotate-180" : ""
												}`}
											/>
										)}
									</button>
								) : (
									<NavLink
										to={item.link ?? "#"}
										className={({ isActive }) =>
											`flex items-center gap-2 p-2 cursor-pointer rounded-lg transition text-black
                       ${
													isActive
														? "bg-orange-100 text-orange-600"
														: "hover:bg-gray-200"
												}`
										}
									>
										<span className="text-xs shrink-0">{item.icon}</span>
										{isOpen && (
											<span className="text-xs font-medium">{item.label}</span>
										)}
									</NavLink>
								)}

								{/* Children */}
								{hasChildren && openItem === item.id && isOpen && (
									<div className="ml-3 mt-1 space-y-1 text-left text-xs">
										{item.children!.map((child) => (
											<NavLink
												key={child.id}
												to={child.link ?? "#"}
												className={({ isActive }) =>
													`block text-xs px-2 py-1.5 rounded-md transition text-black text-left
                         							 ${
																					isActive
																						? "bg-orange-100 text-orange-600"
																						: "hover:bg-gray-200"
																				}`
												}
											>
												<span className=" shrink-0 inline-flex items-center justify-center">
													{child.icon}&nbsp; {child.label}
												</span>
											</NavLink>
										))}
									</div>
								)}
							</div>
						);
					})}
				</nav>
			</aside>
		</React.Fragment>
	);
};
