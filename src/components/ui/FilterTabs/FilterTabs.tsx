import { useRef, type KeyboardEvent } from "react";

import { Badge } from "../../common/Badge";

import type { FilterTabsProps } from "./FilterTabs.types";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export function FilterTabs<TValue extends string>({
	items,
	value,
	onChange,
	ariaLabel,
	id,
	className,
	showLabels = true,
	iconSize = 16,
}: FilterTabsProps<TValue>) {
	const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

	const selectItem = (index: number) => {
		const item = items[index];

		if (!item || item.disabled) return;

		if (item.value !== value) {
			onChange(item.value);
		}

		tabRefs.current[index]?.focus();
	};

	const findNextEnabledIndex = (
		startIndex: number,
		direction: 1 | -1,
	): number => {
		let currentIndex = startIndex;

		for (let attempt = 0; attempt < items.length; attempt += 1) {
			currentIndex = (currentIndex + direction + items.length) % items.length;

			if (!items[currentIndex]?.disabled) {
				return currentIndex;
			}
		}

		return startIndex;
	};

	const findEdgeEnabledIndex = (fromEnd: boolean): number => {
		if (fromEnd) {
			for (let index = items.length - 1; index >= 0; index -= 1) {
				if (!items[index]?.disabled) return index;
			}
		} else {
			for (let index = 0; index < items.length; index += 1) {
				if (!items[index]?.disabled) return index;
			}
		}

		return -1;
	};

	const handleKeyDown = (
		event: KeyboardEvent<HTMLButtonElement>,
		currentIndex: number,
	) => {
		let nextIndex = currentIndex;

		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
				nextIndex = findNextEnabledIndex(currentIndex, 1);
				break;

			case "ArrowLeft":
			case "ArrowUp":
				nextIndex = findNextEnabledIndex(currentIndex, -1);
				break;

			case "Home":
				nextIndex = findEdgeEnabledIndex(false);
				break;

			case "End":
				nextIndex = findEdgeEnabledIndex(true);
				break;

			default:
				return;
		}

		if (nextIndex < 0) return;

		event.preventDefault();
		selectItem(nextIndex);
	};

	return (
		<div
			id={id}
			className={joinClassNames("filter-tabs", className)}
			role="tablist"
			aria-label={ariaLabel}
		>
			{items.map((item, index) => {
				const isActive = value === item.value;
				const Icon = item.Icon;
				const accessibleLabel =
					item.tooltipLabel ??
					(typeof item.label === "string" ? item.label : undefined);

				return (
					<button
						key={item.value}
						ref={(element) => {
							tabRefs.current[index] = element;
						}}
						id={id ? `${id}-${item.value}` : undefined}
						type="button"
						role="tab"
						aria-selected={isActive}
						aria-controls={item.controlsId}
						aria-label={!showLabels ? accessibleLabel : undefined}
						title={accessibleLabel}
						disabled={item.disabled}
						tabIndex={isActive ? 0 : -1}
						className={joinClassNames(
							"filter-tab",
							Icon && "has-icon",
							!showLabels && "is-icon-only",
							isActive && "is-active",
						)}
						onClick={() => selectItem(index)}
						onKeyDown={(event) => handleKeyDown(event, index)}
					>
						{Icon ? (
							<Icon
								className="filter-tab-icon"
								size={iconSize}
								strokeWidth={1.8}
								aria-hidden="true"
							/>
						) : null}

						{showLabels ? (
							<>
								<span className="filter-tab-label">{item.label}</span>

								{item.shortLabel ? (
									<span className="filter-tab-short-label">
										{item.shortLabel}
									</span>
								) : null}
							</>
						) : null}

						{item.count !== undefined && item.count !== null ? (
							<Badge variant={item.badgeVariant ?? "neutral"}>
								{item.count}
							</Badge>
						) : null}
					</button>
				);
			})}
		</div>
	);
}
