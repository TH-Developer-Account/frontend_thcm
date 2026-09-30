import { Ban, CheckCircle2 } from "lucide-react";

import ActionMenu from "../../../../components/common/ActionMenu";
import type { ActionMenuItem } from "../../../../components/common/ActionMenu";
import { Badge } from "../../../../components/common/Badge";
import type { ColumnDef } from "@tanstack/react-table";

import type { BPUserViewModel } from "../utils/bp.types";
import { getInitials } from "../../../../utils/format";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";
import { useBPUsersManager } from "../hooks/useBusinessPartners";
import React from "react";
import DataTable from "../../../../components/ui/tables/DataTable/DataTable";

type BPUsersProps = {
	businessPartnerId: string;
};

type UsersColumnOptions = {
	isSettingDefault: boolean;
	isTogglingActiveStatus: boolean;
	onSetDefault: (user: BPUserViewModel) => void;
	onToggleActiveStatus: (user: BPUserViewModel) => void;
};

const getColumns = ({
	isSettingDefault,
	isTogglingActiveStatus,
	onSetDefault,
	onToggleActiveStatus,
}: UsersColumnOptions): ColumnDef<BPUserViewModel>[] => [
	{
		id: "user",
		header: "User",
		enableSorting: false,
		cell: ({ row }) => {
			const user = row.original;

			return (
				<div className="bp-people-user">
					<div className="bp-people-avatar" aria-hidden="true">
						{getInitials(user.name)}
					</div>

					<div className="bp-people-user-copy">
						<p className="bp-people-name">{user.name}</p>
						<p className="bp-people-id">{user.email || "--"}</p>
					</div>
				</div>
			);
		},
	},

	{
		id: "phone",
		header: "Phone",
		accessorFn: (user) => user.phoneNumber ?? "",
		cell: ({ row }) => <span>{row.original.phoneNumber || "--"}</span>,
	},

	{
		id: "role",
		header: "Role / Department",
		enableSorting: false,
		cell: ({ row }) => {
			const user = row.original;

			return (
				<span>
					{[user.role, user.department].filter(Boolean).join(" · ") || "--"}
				</span>
			);
		},
	},

	{
		id: "default",
		header: "Default",
		accessorFn: (user) => user.isDefaultContact,
		cell: ({ row }) =>
			row.original.isDefaultContact ? (
				<Badge variant="success">Default</Badge>
			) : (
				<span>--</span>
			),
	},

	{
		id: "status",
		header: "Status",
		accessorFn: (user) => user.isActive,
		cell: ({ row }) => {
			const user = row.original;

			return (
				<Badge variant={user.isActive ? "success" : "warning"}>
					{user.isActive ? "Active" : "Inactive"}
				</Badge>
			);
		},
	},

	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const user = row.original;

			const actions: ActionMenuItem<BPUserViewModel>[] = [
				{
					id: "set-default-user",
					label: user.isDefaultContact
						? "Current default user"
						: "Set as default",
					Icon: CheckCircle2,
					onClick: onSetDefault,
					disabled: user.isDefaultContact || isSettingDefault,
					ariaLabel: user.isDefaultContact
						? `${user.name} is already the default user for this business partner`
						: `Set ${user.name} as the default user for this business partner`,
				},
				{
					id: "toggle-user-status",
					label: user.isActive ? "Mark Inactive" : "Mark Active",
					Icon: Ban,
					onClick: onToggleActiveStatus,
					disabled: isTogglingActiveStatus,
					variant: user.isActive ? "danger" : undefined,
					ariaLabel: user.isActive
						? `Mark ${user.name} inactive`
						: `Mark ${user.name} active`,
				},
			];

			return (
				<ActionMenu
					row={user}
					actions={actions}
					ariaLabel={`Actions for ${user.name}`}
					size="md"
					triggerVariant="outline"
				/>
			);
		},
	},
];

const BPUsers = ({ businessPartnerId }: BPUsersProps) => {
	const {
		users,
		isLoading,
		// isFetching,
		error,

		handleSetDefaultUser,
		isSettingDefault,

		handleToggleActiveStatus,
		isTogglingActiveStatus,
	} = useBPUsersManager(businessPartnerId);

	const columns = React.useMemo(
		() =>
			getColumns({
				isSettingDefault,
				isTogglingActiveStatus,
				onSetDefault: handleSetDefaultUser,
				onToggleActiveStatus: handleToggleActiveStatus,
			}),
		[
			isSettingDefault,
			isTogglingActiveStatus,
			handleSetDefaultUser,
			handleToggleActiveStatus,
		],
	);

	return (
		<div className="bp-people">
			{error && (
				<p className="bp-master-form-error" role="alert">
					{getApiErrorMessage(
						error,
						"Unable to load users for this business partner.",
					)}
				</p>
			)}

			<DataTable
				data={users}
				columns={columns}
				getRowId={(user) => user.id}
				loading={isLoading}
				enablePagination
				pageSize={5}
				enableSorting
				minWidth="lg"
				ariaLabel="Users for this business partner"
				emptyTitle="No users found"
				emptyDescription="No users are linked to this business partner yet."
			/>
		</div>
	);
};

export default BPUsers;
