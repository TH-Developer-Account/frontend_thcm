import type {
	ComponentPropsWithoutRef,
	ComponentType,
	ReactNode,
	SVGProps,
} from "react";
import type { LucideIcon } from "lucide-react";
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

export type FilterTabVariant = "underline" | "soft";

export type FilterTabItem<TValue extends string> = {
	value: TValue;
	label: ReactNode;
	shortLabel?: ReactNode;
	tooltipLabel?: string;
	Icon?: LucideIcon;
	count?: number;
	badgeVariant?: FilterTabBadgeVariant;
	disabled?: boolean;
	controlsId?: string;
};

export type FilterTabsProps<TValue extends string> = {
	items: readonly FilterTabItem<TValue>[];
	value: TValue;
	onChange: (value: TValue) => void;

	ariaLabel: string;
	id?: string;
	className?: string;

	variant?: FilterTabVariant;
	showLabels?: boolean;
	iconSize?: number;
};
