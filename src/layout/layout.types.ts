import type { PermissionAction } from "../context/context.types";

export type Role = "ADMIN" | "DEALER" | "EMPLOYEE";

export type HeaderLayoutProps = {
	children: React.ReactNode;
	isSidebarOpen: boolean;
	onToggleSidebar: () => void;
};

export type DashboardLayoutProps = {
	isSidebarOpen: boolean;
	onToggleSidebar: () => void;
	sidebarItems: SidebarItem[];
	header?: React.ReactNode;
	children: React.ReactNode;
};

export type MainLayoutProps = {
	children: React.ReactNode;
	className?: string;
};

export type SidebarLayoutProps = {
	isOpen: boolean;
	items: SidebarItem[];
	onClose?: () => void;
	onToggleSidebar: () => void;
};

export type SidebarItem = {
	id: string;
	label: string;
	icon?: React.ReactNode;
	link?: string;
	children?: SidebarItem[];

	permission?: {
		app: string;
		module: string;
		action: PermissionAction;
	};
};
