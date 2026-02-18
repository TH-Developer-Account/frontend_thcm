// UserTableTabs.tsx
interface Props {
	activeTab: string;
	counts: Record<string, number>;
	onChange: (tab: string) => void;
}

const tabs = ["All", "Active", "Pending", "Banned", "Rejected"];

export function UserTableTabs({ activeTab, counts, onChange }: Props) {
	return (
		<div className="flex gap-6 border-b px-6 pt-4">
			{tabs.map((tab) => {
				const isActive = activeTab === tab;

				return (
					<button
						key={tab}
						onClick={() => onChange(tab)}
						className={`pb-3 text-sm font-medium relative ${
							isActive ? "text-black" : "text-gray-500"
						}`}
					>
						{tab}
						<span
							className={`ml-2 px-2 py-0.5 text-xs rounded-md ${
								isActive
									? "bg-gray-900 text-white"
									: "bg-gray-200 text-gray-700"
							}`}
						>
							{counts[tab] ?? 0}
						</span>

						{isActive && (
							<div className="absolute left-0 -bottom-[1px] w-full h-[2px] bg-black" />
						)}
					</button>
				);
			})}
		</div>
	);
}
