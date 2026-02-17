export type SidebarItem = {
	id: string;
	label: string;
	icon: React.ReactNode;
	onClick?: () => void;
	link?: string;
	children?: SidebarItem[]; // 👈 add this
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
