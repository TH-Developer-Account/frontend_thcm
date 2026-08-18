import type {
	ComponentType,
	MouseEventHandler,
	ReactNode,
	SVGProps,
} from "react";

export type NavigationIcon = ComponentType<
	SVGProps<SVGSVGElement> & {
		size?: number | string;
		strokeWidth?: number | string;
	}
>;

export type BreadcrumbItem = {
	label: string;
	href?: string;
};

type PageNavigationBaseProps = {
	className?: string;
	ariaLabel?: string;
};

export type PageNavigationButtonProps = PageNavigationBaseProps & {
	variant: "button";
	text?: string;
	Icon?: NavigationIcon;
	iconSize?: number;
	iconPosition?: "left" | "right";
	to?: string;
	direction?: "back" | "forward";
	delta?: number;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	disabled?: boolean;
};

export type PageNavigationBreadcrumbProps = PageNavigationBaseProps & {
	variant: "breadcrumbs";
	title?: ReactNode;
	breadcrumbs: readonly BreadcrumbItem[];
	separator?: ReactNode;
};

export type PageNavigationProps =
	| PageNavigationButtonProps
	| PageNavigationBreadcrumbProps;
