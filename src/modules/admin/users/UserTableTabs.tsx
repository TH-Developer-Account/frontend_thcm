import { FilterTabs } from "../../../components/ui/FilterTabs";

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
	const items = USER_STATUS_TABS.map((tab) => ({
		value: tab,
		label: tab,
		count: counts[tab],
		badgeVariant: getBadgeVariant(tab),
	}));

	return (
		<FilterTabs
			id="user-status-tabs"
			ariaLabel="User status"
			items={items}
			value={activeTab}
			onChange={onChange}
			variant="underline"
		/>
	);
}
