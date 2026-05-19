import Button from "./Button";

export type ThreeWayOption<T extends string = string> = {
	value: T;
	label: string;
};

type ThreeWayToggleProps<T extends string = string> = {
	options: readonly [ThreeWayOption<T>, ThreeWayOption<T>, ThreeWayOption<T>];
	value: T;
	onChange: (value: T) => void;
	className?: string;
	disabled?: boolean;
};

const ThreeWayToggle = <T extends string>({
	options,
	value,
	onChange,
	className = "",
	disabled = false,
}: ThreeWayToggleProps<T>) => {
	const activeIndex = options.findIndex((option) => option.value === value);
	const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

	return (
		<div
			className={`relative grid grid-cols-3 rounded-full border border-(--color-border) bg-(--color-surface-soft) p-0.5 text-[11px] ${className}`}
		>
			<div
				className="absolute bottom-0.5 top-0.5 rounded-full bg-(--color-brand) transition-all duration-300 ease-out"
				style={{
					width: "calc((100% - 4px) / 3)",
					left: `calc(2px + ${safeActiveIndex} * ((100% - 4px) / 3))`,
				}}
			/>

			{options.map((option) => {
				const isActive = option.value === value;

				return (
					<Button
						key={option.value}
						type="button"
						disabled={disabled}
						onClick={() => {
							if (disabled || isActive) return;
							onChange(option.value);
						}}
						className={`relative z-10 min-h-0 rounded-full mx-auto px-2  py-0.5 text-[11px] font-medium leading-5 transition-colors duration-200 ${
							isActive
								? "text-white"
								: "text-(--color-text-muted) hover:text-(--color-text-strong)"
						} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
					>
						{option.label}
					</Button>
				);
			})}
		</div>
	);
};

export default ThreeWayToggle;
