// types/sidebar.ts
export type SidebarItem = {
	id: string;
	label: string;
	icon: React.ReactNode;
	onClick?: () => void;
};
