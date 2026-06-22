import type { ComponentType, CSSProperties, SVGProps } from "react";

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
			style={
				{
					"--three-way-active-index": safeActiveIndex,
				} as CSSProperties
			}
		>
			<span className="three-way-toggle-indicator" aria-hidden="true" />

			{options.map((option) => {
				const isActive = option.value === value;
				const Icon = option.Icon;

				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={isActive}
						disabled={disabled}
						title={option.label}
						className={joinClassNames(
							"three-way-toggle-option",
							isActive && "three-way-toggle-option-active",
						)}
						onClick={() => {
							if (disabled || isActive) {
								return;
							}

							onChange(option.value);
						}}
					>
						{Icon ? (
							<Icon
								className="three-way-toggle-icon"
								size={14}
								aria-hidden="true"
							/>
						) : null}

						<span className="three-way-toggle-label">{option.shortLabel}</span>
						{/* 
						<span className="three-way-toggle-short-label">
							{option.shortLabel ?? option.label}
						</span> */}
					</button>
				);
			})}
		</div>
	);
};

export default ThreeWayToggle;
