import type {
	ComponentPropsWithoutRef,
	ComponentType,
	ReactNode,
	SVGProps,
} from "react";

import type { Badge } from "../../common/Badge";

export type FilterTabBadgeVariant = ComponentPropsWithoutRef<
	typeof Badge
>["variant"];

export type FilterTabIcon = ComponentType<
	SVGProps<SVGSVGElement> & {
		size?: number | string;
		strokeWidth?: number | string;
	}
>;

export interface FilterTabItem<TValue extends string> {
	value: TValue;
	label: ReactNode;

	/**
	 * Optional compact label for narrow layouts.
	 */
	shortLabel?: ReactNode;

	/**
	 * Full text displayed through the native hover tooltip.
	 */
	tooltipLabel?: string;

	/**
	 * Optional icon displayed before the label.
	 */
	Icon?: FilterTabIcon;

	count?: ReactNode;
	badgeVariant?: FilterTabBadgeVariant;
	disabled?: boolean;
	controlsId?: string;
}

export interface FilterTabsProps<TValue extends string> {
	items: readonly FilterTabItem<TValue>[];
	value: TValue;
	onChange: (value: TValue) => void;
	ariaLabel: string;
	id?: string;
	className?: string;
	showLabels?: boolean;
	iconSize?: number;
}
