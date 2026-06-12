import type { LucideIcon } from "lucide-react";
import type { StatusVariant } from "../../modules/marketing/activity-planner/utils/status";

export interface ToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	label?: string;
	size?: "sm" | "md" | "lg";
	className?: string;
}
export interface TabItem<T extends string> {
	label: string;
	value: T;
	badge?: React.ReactNode;
}

export interface TabsBarProps<T extends string> {
	items: TabItem<T>[];
	active: T;
	onChange: (value: T) => void;
	className?: string;
}

export interface PaginationProps {
	pageIndex: number;
	pageSize: number;
	totalPages: number;
	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	variant?: "default" | "compact";
	scrollTargetId?: string; // optional container id to scroll
}

export type ModalProps = {
	open: boolean;
	children: React.ReactNode;
	title?: string;
	message?: string;
	onClose?: () => void;
	size?: "sm" | "md" | "lg" | "xl" | "full";
	className?: string;
	header_children?: React.ReactNode;
};

export type CardProps = {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	hoverable?: boolean;
	style?: React.CSSProperties;
};

export type ButtonProps = {
	text?: string | number;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	type?: "button" | "submit";
	disabled?: boolean;
	status?: string;
	className?: string;
	variant?: string;
	size?: "sm" | "md" | "lg" | "xl";
	Icon?: LucideIcon;
	iconPosition?: "left" | "right";
	iconColor?: string;
	fullWidth?: boolean;
	children?: React.ReactNode;
	isTooltip?: string;
	iconSize?: string;
	path?: string;
};

export type NavigateDirection = "back" | "forward";
export type NavigateButtonProps = {
	text?: string;
	Icon?: LucideIcon;
	iconSize?: number;
	iconPosition?: "left" | "right";
	to?: string;
	direction?: "back" | "forward";
	delta?: number;
	onClick?: () => void;
	className?: string;
};

export interface BadgeProps {
	children?: React.ReactNode;
	status?: string | null;
	variant?: StatusVariant | string | null;
	text?: string;
}

export interface AvatarProps {
	firstName: string;
	lastName?: string;
	imageUrl?: string;
	size?: "sm" | "md" | "lg" | "xs";
	className?: string;
	isTooltip?: boolean;
}

export type AlertVariant = "warning" | "info" | "error" | "success";

export interface AlertCardProps {
	variant: AlertVariant;
	title: string;
	description: string;
	primaryAction: {
		label: string;
		onClick: () => void;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
}

export interface AccordionItem {
	id: string;
	title: React.ReactNode;
	content: React.ReactNode;
}

export interface AccordionProps {
	items?: AccordionItem[];
	allowMultiple?: boolean;
	defaultOpen?: string[];
	children?: React.ReactNode;
	childrenTitle?: string;
}

export interface FieldConfig {
	label: string;
	value?: React.ReactNode;
	span?: number;
}

export interface ProfileHeader {
	avatar?: string;
	title?: string;
	subtitle?: string;
}

export interface ProfileCardRendererProps {
	title?: string;
	fields: FieldConfig[];
	header?: ProfileHeader;
	onEdit?: () => void;
	editable?: boolean;
}
