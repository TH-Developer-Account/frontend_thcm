import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Portal,
} from "@headlessui/react";
import { EllipsisVertical } from "lucide-react";

import type { LucideIcon } from "lucide-react";

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
	triggerIcon?: LucideIcon;
	triggerIconSize?: number;
	className?: string;
	panelClassName?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const ActionMenu = <TData,>({
	row,
	actions,
	ariaLabel,
	triggerIcon: TriggerIcon = EllipsisVertical,
	triggerIconSize = 16,
	className,
	panelClassName,
}: ActionMenuProps<TData>) => {
	const visibleActions = actions.filter((action) => !action.hidden);

	if (visibleActions.length === 0) {
		return null;
	}

	return (
		<Menu as="div" className={joinClassNames("action-menu", className)}>
			<MenuButton
				type="button"
				className="action-menu-trigger"
				aria-label={ariaLabel}
			>
				<TriggerIcon size={triggerIconSize} aria-hidden="true" />
			</MenuButton>

			<Portal>
				<MenuItems
					anchor="bottom end"
					transition
					className={joinClassNames("action-menu-panel", panelClassName)}
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
											focus && "action-menu-item-focus",
											action.variant === "danger" && "action-menu-item-danger",
											action.className,
										)}
										onClick={() => {
											if (action.disabled) {
												return;
											}

											action.onClick(row);
										}}
									>
										{ItemIcon ? (
											<ItemIcon size={14} aria-hidden="true" />
										) : null}

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
