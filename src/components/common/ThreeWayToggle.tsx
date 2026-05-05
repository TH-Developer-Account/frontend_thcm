export type ThreeWayOption<T extends string = string> = {
	value: T;
	label: string;
};

type ThreeWayToggleProps<T extends string = string> = {
	options: [ThreeWayOption<T>, ThreeWayOption<T>, ThreeWayOption<T>];
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

	return (
		<div
			className={`relative grid grid-cols-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-1 text-xs ${className}`}
		>
			<div
				className="absolute top-1 bottom-1 rounded-full bg-[var(--color-brand)] transition-all duration-300 ease-out"
				style={{
					width: "calc((100% - 8px) / 3)",
					left: `calc(4px + ${Math.max(activeIndex, 0)} * ((100% - 8px) / 3))`,
				}}
			/>

			{options.map((option) => {
				const isActive = option.value === value;

				return (
					<button
						key={option.value}
						type="button"
						disabled={disabled}
						onClick={() => onChange(option.value)}
						className={`relative z-10 rounded-full px-3 py-1.5 font-medium transition-colors duration-200 ${
							isActive
								? "text-white"
								: "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
						} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
};

export default ThreeWayToggle;
