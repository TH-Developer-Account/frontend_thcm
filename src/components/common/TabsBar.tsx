import type { TabsBarProps } from "./common.types";

export function TabsBar<T extends string>({
	items,
	active,
	onChange,
	className,
}: TabsBarProps<T>) {
	return (
		<div className={`tabs-bar ${className ?? ""}`}>
			{items.map((item) => {
				const isActive = item.value === active;

				return (
					<button
						key={item.value}
						onClick={() => onChange(item.value)}
						className="tab-item"
					>
						<span className={isActive ? "tab-label-active" : "tab-label"}>
							{item.label}
						</span>

						{item.badge}

						{isActive && <div className="tab-indicator" />}
					</button>
				);
			})}
		</div>
	);
}
