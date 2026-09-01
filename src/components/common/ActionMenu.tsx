import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Portal,
} from "@headlessui/react";
import { EllipsisVertical, type LucideIcon } from "lucide-react";

export type ActionMenuSize = "xs" | "sm" | "md" | "lg";

export type ActionMenuItem<TData> = {
	id: string;
	label: string;
	Icon?: LucideIcon;
	onClick: (row: TData) => void;
	disabled?: boolean;
	hidden?: boolean;
	ariaLabel?: string;
	className?: string;
	variant?: "default" | "danger";
};

type ActionMenuProps<TData> = {
	row: TData;
	actions: ActionMenuItem<TData>[];
	ariaLabel: string;

	size?: ActionMenuSize;
	triggerIcon?: LucideIcon;
	triggerIconSize?: number;
	triggerLabel?: string;
	triggerVariant?: "default" | "brand" | "secondary" | "outline" | "ghost";

	className?: string;
	triggerClassName?: string;
	panelClassName?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const DEFAULT_ICON_SIZE: Record<ActionMenuSize, number> = {
	xs: 14,
	sm: 16,
	md: 18,
	lg: 20,
};

const ActionMenu = <TData,>({
	row,
	actions,
	ariaLabel,
	size = "sm",
	triggerIcon: TriggerIcon = EllipsisVertical,
	triggerIconSize,
	triggerLabel,
	triggerVariant = "default",
	className,
	triggerClassName,
	panelClassName,
}: ActionMenuProps<TData>) => {
	const visibleActions = actions.filter((action) => !action.hidden);

	if (visibleActions.length === 0) {
		return null;
	}

	const resolvedIconSize = triggerIconSize ?? DEFAULT_ICON_SIZE[size];

	return (
		<Menu
			as="div"
			className={joinClassNames(
				"action-menu",
				`action-menu-${size}`,
				className,
			)}
		>
			<MenuButton
				type="button"
				className={joinClassNames(
					"action-menu-trigger",
					`action-menu-trigger-${size}`,
					triggerLabel && "action-menu-trigger-labeled",
					`action-menu-trigger-${triggerVariant}`,
					triggerClassName,
				)}
				aria-label={ariaLabel}
			>
				{triggerLabel ? (
					<span className="action-menu-trigger-label">{triggerLabel}</span>
				) : null}

				<TriggerIcon size={resolvedIconSize} aria-hidden="true" />
			</MenuButton>

			<Portal>
				<MenuItems
					anchor="bottom end"
					transition
					className={joinClassNames(
						"action-menu-panel",
						`action-menu-panel-${size}`,
						panelClassName,
					)}
				>
					{visibleActions.map((action) => {
						const ItemIcon = action.Icon;

						return (
							<MenuItem key={action.id} disabled={action.disabled}>
								{({ focus }) => (
									<button
										type="button"
										disabled={action.disabled}
										aria-label={action.ariaLabel ?? action.label}
										className={joinClassNames(
											"action-menu-item",
											`action-menu-item-${size}`,
											focus && "action-menu-item-focus",
											action.variant === "danger" && "action-menu-item-danger",
											action.className,
										)}
										onClick={() => {
											if (!action.disabled) {
												action.onClick(row);
											}
										}}
									>
										{ItemIcon ? <ItemIcon aria-hidden="true" /> : null}

										<span>{action.label}</span>
									</button>
								)}
							</MenuItem>
						);
					})}
				</MenuItems>
			</Portal>
		</Menu>
	);
};

export default ActionMenu;
