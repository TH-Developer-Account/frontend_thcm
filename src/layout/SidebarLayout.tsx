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
          fixed inset-y-0 left-0 z-50
          bg-gray-50 border-r border-orange-600
          transition-all duration-300 ease-in-out
          ${isOpen ? "w-55" : "w-16"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
        `}
			>
				<nav className="h-full px-2 py-4 space-y-1 overflow-y-auto scrollbar-sleek min-h-screen">
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
											<span className="text-sm shrink-0">{item.icon}</span>
											{isOpen && (
												<span className="text-sm font-medium">
													{item.label}
												</span>
											)}
										</div>

										{isOpen && (
											<ChevronDown
												size={16}
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
										<span className="text-sm shrink-0">{item.icon}</span>
										{isOpen && (
											<span className="text-sm font-medium">{item.label}</span>
										)}
									</NavLink>
								)}

								{/* Children */}
								{hasChildren && openItem === item.id && isOpen && (
									<div className="ml-6 mt-1 space-y-1 text-left text-xs">
										{item.children!.map((child) => (
											<NavLink
												key={child.id}
												to={child.link ?? "#"}
												className={({ isActive }) =>
													`block text-sm p-2 rounded-md transition text-black
                          ${
														isActive
															? "bg-orange-100 text-orange-600"
															: "hover:bg-gray-200"
													}`
												}
											>
												<span className=" shrink-0 inline-flex">
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
