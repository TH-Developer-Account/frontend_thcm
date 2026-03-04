import { Badge } from "../../../components/common/Badge";
import type { GeneralStatus } from "../../../components/common/common.types";

type UserTab = "All" | GeneralStatus;

const tabs: UserTab[] = ["All", "Active", "Blocked", "Inactive"];

interface Props {
	activeTab: UserTab;
	counts: Record<UserTab, number>;
	onChange: (tab: UserTab) => void;
}

export function UserTableTabs({ activeTab, counts, onChange }: Props) {
	return (
		<div className="flex items-center gap-8 px-6 pt-5">
			{tabs.map((tab) => {
				const isActive = activeTab === tab;

				return (
					<button
						key={tab}
						onClick={() => onChange(tab)}
						className="relative pb-4 text-sm font-medium transition cursor-pointer text-center"
					>
						<span
							className={isActive ? "text-gray-900 mr-1" : "mr-1 text-gray-500"}
						>
							{tab}
						</span>

						{/* Count Badge */}
						<Badge
							status={tab === "All" ? undefined : tab}
							variant={tab === "All" ? "disable" : undefined}
						>
							{counts[tab]}
						</Badge>

						{/* Active underline */}
						{isActive && (
							<div className="absolute left-0 -bottom-[1px] w-full h-[2px] bg-gray-900 rounded-full" />
						)}
					</button>
				);
			})}
		</div>
	);
}
