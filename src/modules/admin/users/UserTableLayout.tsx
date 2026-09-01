import type { TableUser } from "../../../types/common.types";
import { UserTable } from "./UserTable";
import { UserTableHeader } from "./UserTableHeader";
import { UserTableTabs } from "./UserTableTabs";
import type {
	UserCounts,
	UserRoleOption,
	UserStatusTab,
} from "./user-management.types";

interface UserTableLayoutProps {
	users: TableUser[];
	activeTab: UserStatusTab;
	counts: UserCounts;
	search: string;
	role: UserRoleOption | null;
	roleOptions: UserRoleOption[];
	selectedRowIds: string[];
	loading?: boolean;
	error?: string | null;
	onTabChange: (tab: UserStatusTab) => void;
	onSearch: (value: string) => void;
	onRoleChange: (role: UserRoleOption | null) => void;
	onSelectedRowIdsChange: (ids: string[]) => void;
}

export function UserTableLayout({
	users,
	activeTab,
	counts,
	search,
	role,
	roleOptions,
	selectedRowIds,
	loading = false,
	error,
	onTabChange,
	onSearch,
	onRoleChange,
	onSelectedRowIdsChange,
}: UserTableLayoutProps) {
	return (
		<section className="user-management-panel" aria-label="User management">
			<UserTableTabs
				activeTab={activeTab}
				counts={counts}
				onChange={onTabChange}
			/>

			<UserTableHeader
				search={search}
				role={role}
				roleOptions={roleOptions}
				selectedCount={selectedRowIds.length}
				onSearch={onSearch}
				onRoleChange={onRoleChange}
			/>

			{error ? (
				<div className="user-management-error" role="alert">
					{error} Showing static users instead.
				</div>
			) : null}

			<UserTable
				users={users}
				loading={loading}
				selectedRowIds={selectedRowIds}
				onSelectedRowIdsChange={onSelectedRowIdsChange}
			/>
		</section>
	);
}
