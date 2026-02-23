// components/common/TabsBar.tsx
import React from "react";

export interface TabItem<T extends string> {
	label: string;
	value: T;
	badge?: React.ReactNode;
}

interface TabsBarProps<T extends string> {
	items: TabItem<T>[];
	active: T;
	onChange: (value: T) => void;
	className?: string;
}

export function TabsBar<T extends string>({
	items,
	active,
	onChange,
	className,
}: TabsBarProps<T>) {
	return (
		<div className={`flex items-center gap-8 px-6 pt-5 ${className ?? ""}`}>
			{items.map((item) => {
				const isActive = item.value === active;

				return (
					<button
						key={item.value}
						onClick={() => onChange(item.value)}
						className="relative pb-4 text-sm font-medium transition cursor-pointer text-center"
					>
						<span
							className={isActive ? "text-gray-900 mr-1" : "mr-1 text-gray-500"}
						>
							{item.label}
						</span>

						{item.badge}

						{isActive && (
							<div className="absolute left-0 -bottom-[1px] w-full h-[2px] bg-gray-900 rounded-full" />
						)}
					</button>
				);
			})}
		</div>
	);
}
