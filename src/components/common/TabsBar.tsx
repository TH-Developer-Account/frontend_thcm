import type { CSSProperties } from "react";
import type { TabsBarProps } from "./common.types";

export function TabsBar<T extends string>(props: TabsBarProps<T>) {
	const {
		items,
		variant = "underline",
		color,
		softBackground,
		className,
		ariaLabel,
	} = props;

	const isMulti = props.mode === "multi";

	const isActive = (value: T): boolean =>
		isMulti ? props.active.includes(value) : props.active === value;

	const handleClick = (value: T) => {
		if (isMulti) {
			const current = props.active;
			const next = current.includes(value)
				? current.filter((entry) => entry !== value)
				: [...current, value];
			props.onChange(next);
			return;
		}

		props.onChange(value);
	};

	const style = {
		...(color && { "--tabs-bar-color": color }),
		...(softBackground && { "--tabs-bar-soft-bg": softBackground }),
	} as CSSProperties;

	const barClassName = [
		"tabs-bar",
		variant === "soft" ? "tabs-bar--soft" : "",
		className ?? "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={barClassName}
			style={style}
			role={isMulti ? "group" : "tablist"}
			aria-label={ariaLabel}
		>
			{items.map((item) => {
				const active = isActive(item.value);

				return (
					<button
						key={item.value}
						type="button"
						role={isMulti ? undefined : "tab"}
						aria-selected={isMulti ? undefined : active}
						aria-pressed={isMulti ? active : undefined}
						onClick={() => handleClick(item.value)}
						className="tab-item"
					>
						<span className={active ? "tab-label-active" : "tab-label"}>
							{item.label}
						</span>

						{item.badge}

						{active && <div className="tab-indicator" />}
					</button>
				);
			})}
		</div>
	);
}

export default TabsBar;
