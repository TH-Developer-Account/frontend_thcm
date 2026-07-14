import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import type { SidebarItem, SidebarLayoutProps } from "./layout.types";

const MOBILE_SIDEBAR_QUERY = "(max-width: 767px)";

const containsActivePath = (item: SidebarItem, pathname: string): boolean => {
	if (item.link && pathname.startsWith(item.link)) return true;

	return Boolean(
		item.children?.some(
			(child) => child.link && pathname.startsWith(child.link),
		),
	);
};

export const SidebarLayout = ({
	isOpen,
	items,
	onClose,
	onToggleSidebar,
}: SidebarLayoutProps) => {
	const location = useLocation();
	const [openItem, setOpenItem] = useState<string | null>(null);

	useEffect(() => {
		const activeParent = items.find(
			(item) =>
				item.children?.length && containsActivePath(item, location.pathname),
		);

		if (activeParent) {
			setOpenItem(activeParent.id);
		}
	}, [items, location.pathname]);

	const handleParentClick = (itemId: string) => {
		if (!isOpen) {
			onToggleSidebar();
			setOpenItem(itemId);
			return;
		}

		setOpenItem((currentItem) => (currentItem === itemId ? null : itemId));
	};

	const handleNavigation = () => {
		if (window.matchMedia(MOBILE_SIDEBAR_QUERY).matches) {
			onClose();
		}
	};

	return (
		<>
			<button
				type="button"
				className={`app-sidebar-overlay ${
					isOpen ? "app-sidebar-overlay-open" : ""
				}`}
				onClick={onClose}
				aria-label="Close navigation"
				tabIndex={isOpen ? 0 : -1}
			/>

			<aside
				id="app-sidebar"
				className={`app-sidebar ${
					isOpen ? "app-sidebar-open" : "app-sidebar-collapsed"
				}`}
				aria-label="Application navigation"
			>
				<nav className="app-sidebar-nav">
					{items.map((item) => {
						const hasChildren = Boolean(item.children?.length);
						const isExpanded = openItem === item.id;

						return (
							<div className="app-sidebar-group" key={item.id}>
								{hasChildren ? (
									<button
										type="button"
										onClick={() => handleParentClick(item.id)}
										className={`app-sidebar-item app-sidebar-parent ${
											isExpanded ? "app-sidebar-item-expanded" : ""
										}`}
										aria-expanded={isOpen && isExpanded}
										aria-controls={`sidebar-children-${item.id}`}
										title={!isOpen ? item.label : undefined}
									>
										<span className="app-sidebar-item-main">
											<span className="app-sidebar-icon" aria-hidden="true">
												{item.icon}
											</span>

											<span className="app-sidebar-label">{item.label}</span>
										</span>

										<span
											className={`app-sidebar-chevron ${
												isExpanded ? "app-sidebar-chevron-expanded" : ""
											}`}
											aria-hidden="true"
										>
											<ChevronDown size={14} />
										</span>
									</button>
								) : (
									<NavLink
										to={item.link ?? "#"}
										onClick={handleNavigation}
										title={!isOpen ? item.label : undefined}
										className={({ isActive }) =>
											[
												"app-sidebar-item",
												"app-sidebar-link",
												isActive ? "app-sidebar-item-active" : "",
											]
												.filter(Boolean)
												.join(" ")
										}
									>
										<span className="app-sidebar-icon" aria-hidden="true">
											{item.icon}
										</span>

										<span className="app-sidebar-label">{item.label}</span>
									</NavLink>
								)}

								{hasChildren ? (
									<div
										id={`sidebar-children-${item.id}`}
										className={`app-sidebar-children ${
											isExpanded && isOpen ? "app-sidebar-children-open" : ""
										}`}
									>
										<div className="app-sidebar-children-inner">
											{item.children?.map((child) => (
												<NavLink
													key={child.id}
													to={child.link ?? "#"}
													onClick={handleNavigation}
													className={({ isActive }) =>
														[
															"app-sidebar-child-link",
															isActive ? "app-sidebar-child-link-active" : "",
														]
															.filter(Boolean)
															.join(" ")
													}
												>
													<span
														className="app-sidebar-child-icon"
														aria-hidden="true"
													>
														{child.icon}
													</span>

													<span className="app-sidebar-child-label">
														{child.label}
													</span>
												</NavLink>
											))}
										</div>
									</div>
								) : null}
							</div>
						);
					})}
				</nav>
			</aside>
		</>
	);
};
