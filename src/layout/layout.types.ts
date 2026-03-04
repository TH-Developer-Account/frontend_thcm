export type Role = "ADMIN" | "DEALER" | "EMPLOYEE";

export type SidebarItem = {
	id: string;
	label: string;
	icon: React.ReactNode;
	link?: string;
	roles?: string[];
	permissions?: string[];
	children?: SidebarItem[];
	onClick?: () => void;
};

export type HeaderLayoutProps = {
	onToggleSidebar: () => void;
	children?: React.ReactNode;
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
};
