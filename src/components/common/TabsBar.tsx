// TabsBar — horizontal tabs.
// single mode: a real ARIA tablist. Arrow keys / Home / End move between
//   tabs (roving tabindex), so the bar is one Tab stop like native tabs.
// multi mode: a group of toggle buttons (aria-pressed); every button tabbable.
import { useRef, type CSSProperties, type KeyboardEvent } from "react";
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
	const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

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

	/* Roving focus for the single-select tablist (WAI-ARIA tabs pattern). */
	const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		if (isMulti) return;

		const enabled = items
			.map((item, i) => (item.disabled ? -1 : i))
			.filter((i) => i >= 0);
		if (enabled.length === 0) return;

		const position = enabled.indexOf(index);
		let target: number | undefined;

		switch (event.key) {
			case "ArrowRight":
				target = enabled[(position + 1) % enabled.length];
				break;
			case "ArrowLeft":
				target = enabled[(position - 1 + enabled.length) % enabled.length];
				break;
			case "Home":
				target = enabled[0];
				break;
			case "End":
				target = enabled[enabled.length - 1];
				break;
			default:
				return;
		}

		event.preventDefault();
		buttonsRef.current[target]?.focus();
		handleClick(items[target].value);
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

	const hasActive = items.some((item) => isActive(item.value));

	return (
		<div
			className={barClassName}
			style={style}
			role={isMulti ? "group" : "tablist"}
			aria-label={ariaLabel}
		>
			{items.map((item, index) => {
				const active = isActive(item.value);
				// One tab stop: the active tab (or the first tab when none is active).
				const tabIndex = isMulti
					? undefined
					: active || (!hasActive && index === 0)
						? 0
						: -1;

				return (
					<button
						key={item.value}
						ref={(node) => {
							buttonsRef.current[index] = node;
						}}
						type="button"
						role={isMulti ? undefined : "tab"}
						aria-selected={isMulti ? undefined : active}
						aria-pressed={isMulti ? active : undefined}
						tabIndex={tabIndex}
						disabled={item.disabled}
						onClick={() => handleClick(item.value)}
						onKeyDown={(event) => handleKeyDown(event, index)}
						className={active ? "tab-item is-active" : "tab-item"}
					>
						<span className={active ? "tab-label-active" : "tab-label"}>
							{item.label}
						</span>

						{item.badge}

						{active && <div className="tab-indicator" aria-hidden="true" />}
					</button>
				);
			})}
		</div>
	);
}

export default TabsBar;
