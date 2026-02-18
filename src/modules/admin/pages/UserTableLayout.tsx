// UserTableLayout.tsx
import { type User } from "../../../utils/types";
import { UserTableTabs } from "./UserTableTabs";
import { UserTableHeader } from "./UserTableHeader";
import { UserTable } from "./UserTable";

interface Props {
	users: User[];
	activeTab: string;
	counts: Record<string, number>;
	search: string;
	onTabChange: (tab: string) => void;
	onSearch: (val: string) => void;
}

export function UserTableLayout({
	users,
	activeTab,
	counts,
	search,
	onTabChange,
	onSearch,
}: Props) {
	return (
		<div className="bg-gray-50 min-h-screen">
			<UserTableTabs
				activeTab={activeTab}
				counts={counts}
				onChange={onTabChange}
			/>

			<UserTableHeader search={search} onSearch={onSearch} />

			<UserTable users={users} />
		</div>
	);
}
