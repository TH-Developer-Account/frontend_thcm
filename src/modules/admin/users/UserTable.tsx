import { useMemo } from "react";
import { MoreVertical, Pencil } from "lucide-react";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import ManagementTable from "../../../components/ui/tables/ManagementTable/ManagementTable";
import { ManagementIdentityCell } from "../../../components/ui/tables/ManagementTable/ManagementTableCells";
import { type ManagementTableColumn } from "../../../components/ui/tables/ManagementTable/ManagementTable.types";
import type { TableUser } from "../../../types/common.types";

interface UserTableProps {
	users: TableUser[];
	loading?: boolean;
	selectedRowIds: string[];
	onSelectedRowIdsChange: (ids: string[]) => void;
	onEditUser?: (user: TableUser) => void;
	onOpenActions?: (user: TableUser) => void;
}

const getStatusVariant = (status: TableUser["status"]): string => {
	switch (status) {
		case "Active":
			return "success";
		case "Blocked":
			return "danger";
		case "Inactive":
		default:
			return "neutral";
	}
};

export function UserTable({
	users,
	loading = false,
	selectedRowIds,
	onSelectedRowIdsChange,
	onEditUser,
	onOpenActions,
}: UserTableProps) {
	const columns = useMemo<ManagementTableColumn<TableUser>[]>(
		() => [
			{
				key: "name",
				header: "Name",
				width: "20rem",
				render: (user) => (
					<ManagementIdentityCell
						title={user.name}
						subtitle={user.email}
						imageUrl={user.avatar}
						alt={user.name}
					/>
				),
			},
			{
				key: "phone",
				header: "Phone number",
				width: "11rem",
				render: (user) => user.phone,
			},
			{
				key: "company",
				header: "Company",
				width: "14rem",
				hideBelow: "md",
				render: (user) => user.company,
			},
			{
				key: "role",
				header: "Role",
				width: "12rem",
				hideBelow: "sm",
				render: (user) => user.role,
			},
			{
				key: "status",
				header: "Status",
				width: "8rem",
				render: (user) => (
					<Badge variant={getStatusVariant(user.status)}>{user.status}</Badge>
				),
			},
		],
		[],
	);

	return (
		<ManagementTable<TableUser>
			rows={users}
			columns={columns}
			pagination
			defaultPageSize={15}
			getRowId={(user) => String(user.id)}
			ariaLabel="User management table"
			caption="Application users"
			minWidth="64rem"
			density="comfortable"
			loading={loading}
			loadingRowCount={6}
			emptyTitle="No users found"
			emptyDescription="No users match the selected status, role, or search text."
			selectable
			selectedRowIds={selectedRowIds}
			onSelectedRowIdsChange={onSelectedRowIdsChange}
			actionsHeader=""
			rowActions={(user) => (
				<>
					<Button
						type="button"
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={Pencil}
						aria-label={`Edit ${user.name}`}
						onClick={() => onEditUser?.(user)}
					/>
					<Button
						type="button"
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={MoreVertical}
						aria-label={`Open actions for ${user.name}`}
						onClick={() => onOpenActions?.(user)}
					/>
				</>
			)}
		/>
	);
}
