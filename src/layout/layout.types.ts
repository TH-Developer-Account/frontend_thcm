import type { ReactNode } from "react";

import type { PermissionAction } from "../context/context.types";

export type Role = "ADMIN" | "DEALER" | "EMPLOYEE";

export type HeaderLayoutProps = {
	children: ReactNode;
	isSidebarOpen: boolean;
	onToggleSidebar: () => void;
};

export type DashboardLayoutProps = {
	isSidebarOpen: boolean;
	onToggleSidebar: () => void;
	onCloseSidebar: () => void;
	sidebarItems: SidebarItem[];
	header?: ReactNode;
	children: ReactNode;
};

export type MainLayoutProps = {
	children: ReactNode;
	className?: string;
};

export type SidebarLayoutProps = {
	isOpen: boolean;
	items: SidebarItem[];
	onClose: () => void;
	onToggleSidebar: () => void;
};

export type SidebarItem = {
	id: string;
	label: string;
	icon?: ReactNode;
	link?: string;
	children?: SidebarItem[];

	permission?: {
		app: string;
		module: string;
		action: PermissionAction;
	};
};
