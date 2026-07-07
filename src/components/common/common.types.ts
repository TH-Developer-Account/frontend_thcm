import type { LucideIcon } from "lucide-react";
import type {
	ButtonHTMLAttributes,
	ComponentType,
	MouseEvent,
	ReactNode,
	CSSProperties,
} from "react";

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

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export type ModalMode = "standard" | "shell";

export type ModalProps = {
	open: boolean;
	children: ReactNode;
	onClose?: () => void;

	title?: string;
	size?: ModalSize;
	mode?: ModalMode;
	className?: string;

	header_children?: ReactNode;
	footer_children?: ReactNode;
	footer_actions?: ReactNode;

	dialogRole?: "dialog" | "alertdialog";
	ariaLabel?: string;
	ariaDescribedBy?: string;
	closeOnOverlayClick?: boolean;
};

export type CardProps = {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	hoverable?: boolean;
	style?: React.CSSProperties;
};

export type ButtonAppearance =
	| "cta"
	| "standard"
	| "filter"
	| "toggle"
	| "segmented"
	| "icon"
	| "ghost"
	| "switch"
	| "transparent";

export type ButtonVariant =
	| "brand"
	| "iron"
	| "outline"
	| "secondary"
	| "danger"
	| "success"
	| "warning"
	| "transparent";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

export type ButtonIconProps = {
	size?: string | number;
	color?: string;
	className?: string;
	style?: CSSProperties;
	"aria-hidden"?: boolean | "true" | "false";
};

export interface ButtonProps extends Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"children"
> {
	text?: ReactNode;
	children?: ReactNode;

	appearance?: ButtonAppearance;
	variant?: ButtonVariant;
	size?: ButtonSize;

	active?: boolean;
	loading?: boolean;
	fullWidth?: boolean;

	Icon?: ComponentType<ButtonIconProps>;
	iconPosition?: "left" | "right";
	iconSize?: number;
	iconColor?: CSSProperties["color"];

	path?: string;
	isTooltip?: ReactNode;
	to?: string;
	direction?: "back" | "forward";
	delta?: number;

	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

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
	variant?: string | null;
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

export type AlertVariant = "success" | "warning" | "error" | "info";

export type AlertType = "banner" | "box";

export type AlertAction = {
	label: string;
	onClick: () => void;
};

export type AlertCardProps = {
	variant: AlertVariant;
	type?: AlertType;
	title: string;
	description?: string;
	primaryAction?: AlertAction;
	secondaryAction?: AlertAction;
};
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
