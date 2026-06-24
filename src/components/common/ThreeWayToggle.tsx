import type {
	ComponentType,
	CSSProperties,
	KeyboardEvent,
	SVGProps,
} from "react";

export type ThreeWayOption<T extends string = string> = {
	value: T;
	label: string;
	shortLabel?: string;
	Icon?: ComponentType<
		SVGProps<SVGSVGElement> & {
			size?: number | string;
			strokeWidth?: number | string;
		}
	>;
};

type ThreeWayToggleProps<T extends string = string> = {
	options: readonly [ThreeWayOption<T>, ThreeWayOption<T>, ThreeWayOption<T>];
	value: T;
	onChange: (value: T) => void;
	className?: string;
	disabled?: boolean;
	ariaLabel?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

const ThreeWayToggle = <T extends string>({
	options,
	value,
	onChange,
	className = "",
	disabled = false,
	ariaLabel = "View filter",
}: ThreeWayToggleProps<T>) => {
	const activeIndex = options.findIndex((option) => option.value === value);
	const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

	const selectOption = (index: number) => {
		if (disabled) return;

		const option = options[index];

		if (!option || option.value === value) return;

		onChange(option.value);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (disabled) return;

		let nextIndex = safeActiveIndex;

		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
				nextIndex = (safeActiveIndex + 1) % options.length;
				break;

			case "ArrowLeft":
			case "ArrowUp":
				nextIndex = (safeActiveIndex - 1 + options.length) % options.length;
				break;

			case "Home":
				nextIndex = 0;
				break;

			case "End":
				nextIndex = options.length - 1;
				break;

			default:
				return;
		}

		event.preventDefault();
		selectOption(nextIndex);
	};

	return (
		<div
			className={joinClassNames(
				"three-way-toggle",
				disabled && "three-way-toggle-disabled",
				className,
			)}
			role="radiogroup"
			aria-label={ariaLabel}
			aria-disabled={disabled}
			onKeyDown={handleKeyDown}
			style={
				{
					"--three-way-active-index": safeActiveIndex,
					"--three-way-option-count": options.length,
				} as CSSProperties
			}
		>
			<span className="three-way-toggle-indicator" aria-hidden="true" />

			{options.map((option, index) => {
				const isActive = option.value === value;
				const Icon = option.Icon;

				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={isActive}
						disabled={disabled}
						tabIndex={isActive ? 0 : -1}
						title={option.label}
						className={joinClassNames(
							"three-way-toggle-option",
							isActive && "three-way-toggle-option-active",
						)}
						onClick={() => selectOption(index)}
					>
						{Icon ? (
							<Icon
								className="three-way-toggle-icon"
								size={16}
								strokeWidth={1.8}
								aria-hidden="true"
							/>
						) : null}

						<span className="three-way-toggle-label">{option.shortLabel}</span>

						<span className="three-way-toggle-short-label">
							{option.shortLabel ?? option.label}
						</span>
					</button>
				);
			})}
		</div>
	);
};

export default ThreeWayToggle;
