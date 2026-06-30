import { Badge } from "../../../components/common/Badge";

import type { UserCounts, UserStatusTab } from "./user-management.types";
import { USER_STATUS_TABS } from "./user-management.utils";

interface UserTableTabsProps {
	activeTab: UserStatusTab;
	counts: UserCounts;
	onChange: (tab: UserStatusTab) => void;
}

const getBadgeVariant = (
	tab: UserStatusTab,
): "success" | "danger" | "neutral" => {
	switch (tab) {
		case "Active":
			return "success";

		case "Blocked":
			return "danger";

		case "Inactive":
		case "All":
		default:
			return "neutral";
	}
};

export function UserTableTabs({
	activeTab,
	counts,
	onChange,
}: UserTableTabsProps) {
	return (
		<div
			className="user-management-tabs"
			role="tablist"
			aria-label="User status"
		>
			{USER_STATUS_TABS.map((tab) => {
				const isActive = activeTab === tab;

				return (
					<button
						key={tab}
						type="button"
						role="tab"
						aria-selected={isActive}
						className={`user-management-tab${isActive ? " is-active" : ""}`}
						onClick={() => onChange(tab)}
					>
						<span>{tab}</span>

						<Badge variant={getBadgeVariant(tab)}>{counts[tab]}</Badge>
					</button>
				);
			})}
		</div>
	);
}
