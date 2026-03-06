import type { LucideIcon } from "lucide-react";
import type { GeneralStatus } from "../../utils/types";

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

export interface ModalProps {
	open: boolean;
	title?: string;
	message?: string;
	onClose: () => void;
	children: React.ReactNode;
}

export type CardProps = {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	hoverable?: boolean;
	style?: React.CSSProperties;
};

export type ButtonProps = {
	text?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	type?: "button" | "submit";
	disabled?: boolean;
	status?: string;
	className?: string;
	variant?: "brand" | "primary" | "success" | "warning" | "danger" | "disable";
	size?: "sm" | "md" | "lg" | "xl";
	Icon?: LucideIcon;
	iconPosition?: "left" | "right";
	iconColor?: string;
	fullWidth?: boolean;
	children?: React.ReactNode;
	isTooltip?: string;
	iconSize?: string;
};

export interface BadgeProps {
	children?: React.ReactNode;
	status?: GeneralStatus;
	variant?: "primary" | "success" | "warning" | "danger" | "disable";
}

export interface AvatarProps {
	firstName: string;
	lastName?: string;
	imageUrl?: string;
	size?: "sm" | "md" | "lg" | "xs";
	className?: string;
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
	items: AccordionItem[];
	allowMultiple?: boolean;
	defaultOpen?: string[];
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
