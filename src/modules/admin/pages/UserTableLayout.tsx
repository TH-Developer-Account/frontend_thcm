// UserTableLayout.tsx
import { type TableUser } from "../../../utils/types";
import { UserTableTabs } from "./UserTableTabs";
import { UserTableHeader } from "./UserTableHeader";
import { UserTable } from "./UserTable";

interface Props {
	users: TableUser[];
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
		<div className="bg-white rounded-t-2xl border border-gray-200 border-b-0 min-h-screen">
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
