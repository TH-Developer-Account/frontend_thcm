import { Menu, X } from "lucide-react";

import Button from "../components/common/Button";
import type { HeaderLayoutProps } from "./layout.types";

export const HeaderLayout = ({
	children,
	isSidebarOpen,
	onToggleSidebar,
}: HeaderLayoutProps) => {
	return (
		<header className="app-header">
			<Button
				type="button"
				appearance="icon"
				iconSize={20}
				variant="transparent"
				size="lg"
				Icon={isSidebarOpen ? X : Menu}
				aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
				aria-expanded={isSidebarOpen}
				aria-controls="app-sidebar"
				className="app-header-btn"
				onClick={onToggleSidebar}
			/>

			<div className="app-header-content">{children}</div>
		</header>
	);
};
