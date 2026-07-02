import { useMemo, useState } from "react";

import { UserTableLayout } from "./UserTableLayout";
import type {
	FetchUsers,
	UserRoleOption,
	UserStatusTab,
} from "./user-management.types";
import { useUsersData } from "./useUsersData";
import {
	filterUsers,
	getRoleOptions,
	getUserCounts,
} from "./user-management.utils";
import { mockUsers } from "../mockUsers";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";

type UsersPageProps = {
	/** Omit during mock-data development. Supply this when the API is ready. */
	fetchUsers?: FetchUsers;
};

export default function UsersPage({ fetchUsers }: UsersPageProps) {
	const [activeTab, setActiveTab] = useState<UserStatusTab>("All");
	const [search, setSearch] = useState("");
	const [role, setRole] = useState<UserRoleOption | null>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

	const { users, loading, error } = useUsersData({
		fallbackUsers: mockUsers,
		fetchUsers,
	});

	const counts = useMemo(() => getUserCounts(users), [users]);
	const roleOptions = useMemo(() => getRoleOptions(users), [users]);

	const filteredUsers = useMemo(
		() => filterUsers({ users, activeTab, search, role }),
		[activeTab, role, search, users],
	);

	return (
		<PageSectionLayout as="div">
			<PageHeader
				headerText="User Management"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "User Management page location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "User Management",
						},
					],
					separator: "›",
				}}
			/>
			<UserTableLayout
				users={filteredUsers}
				activeTab={activeTab}
				counts={counts}
				search={search}
				role={role}
				roleOptions={roleOptions}
				selectedRowIds={selectedRowIds}
				loading={loading}
				error={error}
				onTabChange={setActiveTab}
				onSearch={setSearch}
				onRoleChange={setRole}
				onSelectedRowIdsChange={setSelectedRowIds}
			/>
		</PageSectionLayout>
	);
}
