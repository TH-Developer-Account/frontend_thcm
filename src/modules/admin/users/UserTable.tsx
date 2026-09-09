import { useMemo } from "react";
import {
	Eye,
	Lock,
	MoreVertical,
	Pencil,
	Plus,
	Trash,
	Unlock,
} from "lucide-react";

import ActionMenu from "../../../components/common/ActionMenu";
import type { ActionMenuItem } from "../../../components/common/ActionMenu";
import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { SearchInput } from "../../../components/forms/SearchInput";
import SelectInput from "../../../components/forms/SelectInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import ManagementTable from "../../../components/ui/tables/ManagementTable/ManagementTable";
import { ManagementIdentityCell } from "../../../components/ui/tables/ManagementTable/ManagementTableCells";
import type { ManagementTableColumn } from "../../../components/ui/tables/ManagementTable/ManagementTable.types";

import type {
	User,
	UserRoleOption,
	UserStatus,
	UserStatusTab,
} from "./user-management.types";
import { getUserDisplayName, USER_STATUS_TABS } from "./user-management.utils";
import type { UsersController } from "./useUsersData";

interface UserTableProps {
	controller: UsersController;
	onOpenTableOptions?: () => void;
}

const getStatusVariant = (
	status: UserStatus,
): "success" | "danger" | "neutral" => {
	switch (status) {
		case "Active":
			return "success";
		case "Blocked":
			return "danger";
		default:
			return "neutral";
	}
};

const getTabBadgeVariant = (
	tab: UserStatusTab,
): "success" | "danger" | "neutral" =>
	tab === "Active" ? "success" : tab === "Blocked" ? "danger" : "neutral";

type UserRowActionOptions = {
	onEdit: (user: User) => void;
	onView: (user: User) => void;
	onDelete: (user: User) => void;
	onToggleBlock: (user: User) => void;
};

const getUserRowActions = (
	user: User,
	{ onEdit, onView, onDelete, onToggleBlock }: UserRowActionOptions,
): ActionMenuItem<User>[] => {
	const isBlocked = user.status === "Blocked";

	return [
		{
			id: "edit-user",
			label: "Edit User",
			Icon: Pencil,
			onClick: onEdit,
			ariaLabel: `Edit ${getUserDisplayName(user)}`,
		},
		{
			id: "view-user",
			label: "View User",
			Icon: Eye,
			onClick: onView,
			ariaLabel: `View ${getUserDisplayName(user)}`,
		},
		{
			id: "toggle-block-user",
			label: isBlocked ? "Unblock User" : "Block User",
			Icon: isBlocked ? Unlock : Lock,
			onClick: onToggleBlock,
			ariaLabel: `${isBlocked ? "Unblock" : "Block"} ${getUserDisplayName(user)}`,
		},
		{
			id: "delete-user",
			label: "Delete User",
			Icon: Trash,
			onClick: onDelete,
			ariaLabel: `Delete ${getUserDisplayName(user)}`,
		},
	];
};

// Bulk actions for the multiselect toolbar menu. `row` here is just the
// current selectedRowIds array — ActionMenu is generic, so we reuse it
// rather than building a bespoke dropdown.
const getBulkActions = ({
	onActivate,
	onBlock,
	onMarkInactive,
	onDelete,
}: {
	onActivate: () => void;
	onBlock: () => void;
	onMarkInactive: () => void;
	onDelete: () => void;
}): ActionMenuItem<string[]>[] => [
	{
		id: "bulk-activate",
		label: "Activate Selected",
		Icon: Unlock,
		onClick: onActivate,
		ariaLabel: "Activate selected users",
	},
	{
		id: "bulk-block",
		label: "Block Selected",
		Icon: Lock,
		onClick: onBlock,
		ariaLabel: "Block selected users",
	},
	{
		id: "bulk-inactive",
		label: "Mark Selected Inactive",
		Icon: Lock,
		onClick: onMarkInactive,
		ariaLabel: "Mark selected users inactive",
	},
	{
		id: "bulk-delete",
		label: "Delete Selected",
		Icon: Trash,
		onClick: onDelete,
		ariaLabel: "Delete selected users",
	},
];

export function UserTable({ controller, onOpenTableOptions }: UserTableProps) {
	const {
		filteredUsers,
		counts,
		roleOptions,
		activeTab,
		search,
		role,
		selectedRowIds,
		isLoading,
		isFetching,
		error,
		setSearch,
		setSelectedRowIds,
		handleTabChange,
		handleDeleteUser,
		handleToggleBlockUser,
		handleBulkStatusChange,
		handleBulkDelete,
		handleRoleChange,
		handleStartCreate,
		handleStartEdit,
		handleStartView,
	} = controller;

	const tabItems = useMemo(
		() =>
			USER_STATUS_TABS.map((tab) => ({
				value: tab,
				label: tab,
				count: counts[tab],
				badgeVariant: getTabBadgeVariant(tab),
			})),
		[counts],
	);

	const columns = useMemo<ManagementTableColumn<User>[]>(
		() => [
			{
				key: "name",
				header: "Name",
				width: "20rem",
				render: (user) => (
					<ManagementIdentityCell
						title={getUserDisplayName(user)}
						subtitle={user.email}
						alt={getUserDisplayName(user)}
					/>
				),
			},
			{
				key: "employeeCode",
				header: "Employee code",
				width: "11rem",
				render: (user) => user.employeeCode || "--",
			},
			{
				key: "phoneNumber",
				header: "Phone number",
				width: "12rem",
				render: (user) => user.phoneNumber || "--",
			},
			{
				key: "department",
				header: "Department",
				width: "13rem",
				hideBelow: "md",
				render: (user) => user.department || "--",
			},
			{
				key: "role",
				header: "Role",
				width: "12rem",
				hideBelow: "sm",
				render: (user) => user.role || "--",
			},
			{
				key: "userType",
				header: "User type",
				width: "9rem",
				hideBelow: "md",
				render: (user) => user.userType,
			},
			{
				key: "status",
				header: "Status",
				width: "8rem",
				render: (user) => (
					<Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
				),
			},
			{
				key: "actions",
				header: "",
				width: "4rem",
				render: (user) => (
					<ActionMenu
						row={user}
						actions={getUserRowActions(user, {
							onEdit: handleStartEdit,
							onView: handleStartView,
							onDelete: (target) => {
								void handleDeleteUser(target.id);
							},
							onToggleBlock: (target) => {
								void handleToggleBlockUser(target);
							},
						})}
						ariaLabel={`Actions for ${getUserDisplayName(user)}`}
						size="md"
						// triggerVariant="outline"
					/>
				),
			},
		],
		[handleStartEdit, handleStartView, handleDeleteUser, handleToggleBlockUser],
	);

	const hasSelection = selectedRowIds.length > 0;

	return (
		<section className="user-management-panel" aria-label="User management">
			<FilterTabs
				id="user-status-tabs"
				ariaLabel="User status"
				items={tabItems}
				value={activeTab}
				onChange={handleTabChange}
				variant="underline"
			/>

			<div className="user-management-toolbar">
				<div className="user-management-role-filter">
					<SelectInput<UserRoleOption>
						inputId="user-role-filter"
						aria-label="Filter users by role"
						options={roleOptions}
						value={role}
						isClearable
						placeholder="All roles"
						onChange={handleRoleChange}
					/>
				</div>

				<div className="user-management-search">
					<SearchInput
						value={search}
						onChange={setSearch}
						placeholder="Search users..."
					/>
				</div>

				<div className="user-management-toolbar-end">
					{hasSelection ? (
						<span className="user-management-selected-count">
							{selectedRowIds.length} selected
						</span>
					) : null}

					<Button
						type="button"
						text="Create User"
						Icon={Plus}
						iconPosition="left"
						variant="brand"
						onClick={handleStartCreate}
					/>

					{hasSelection ? (
						<ActionMenu
							row={selectedRowIds}
							actions={getBulkActions({
								onActivate: () => {
									void handleBulkStatusChange("Active");
								},
								onBlock: () => {
									void handleBulkStatusChange("Blocked");
								},
								onMarkInactive: () => {
									void handleBulkStatusChange("Inactive");
								},
								onDelete: () => {
									void handleBulkDelete();
								},
							})}
							ariaLabel="Bulk actions for selected users"
							size="md"
						/>
					) : null}
				</div>
			</div>

			{error ? (
				<div className="user-management-error" role="alert">
					{error}
				</div>
			) : null}

			<div className="">
				<ManagementTable<User>
					rows={filteredUsers}
					columns={columns}
					pagination
					defaultPageSize={15}
					getRowId={(user) => user.id}
					ariaLabel="User management table"
					caption="Application users"
					minWidth="76rem"
					density="comfortable"
					loading={isLoading || isFetching}
					loadingRowCount={6}
					emptyTitle="No users found"
					emptyDescription="No users match the selected status, role, or search text."
					selectable
					selectedRowIds={selectedRowIds}
					onSelectedRowIdsChange={setSelectedRowIds}
				/>
			</div>
		</section>
	);
}
