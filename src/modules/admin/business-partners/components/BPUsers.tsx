import { Ban, CheckCircle2 } from "lucide-react";

import ActionMenu from "../../../../components/common/ActionMenu";
import type { ActionMenuItem } from "../../../../components/common/ActionMenu";
import { Badge } from "../../../../components/common/Badge";
import SimpleViewTable from "../../../../components/ui/tables/SimpleViewTable";
import type { SimpleTableColumn } from "../../../../components/ui/tables/SimpleViewTable";

import { useBPUsersManager } from "../hooks/useBusinessPartners";
import type { BPUserViewModel } from "../utils/bp.types";
import { getInitials } from "../../../../utils/format";
import { getApiErrorMessage } from "../../../../utils/apiError.helper";

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
}: UsersColumnOptions): SimpleTableColumn<BPUserViewModel>[] => [
	{
		key: "user",
		header: "User",
		widthUnits: 3,
		minWidth: 190,
		render: (user) => (
			<div className="bp-people-user">
				<div className="bp-people-avatar" aria-hidden="true">
					{getInitials(user.name)}
				</div>

				<div className="bp-people-user-copy">
					<p className="bp-people-name">{user.name}</p>
					<p className="bp-people-id">{user.email || "--"}</p>
				</div>
			</div>
		),
	},

	{
		key: "phone",
		header: "Phone",
		widthUnits: 2,
		minWidth: 150,
		render: (user) => <span>{user.phoneNumber || "--"}</span>,
	},

	{
		key: "role",
		header: "Role / Department",
		widthUnits: 3,
		minWidth: 190,
		render: (user) => (
			<span>
				{[user.role, user.department].filter(Boolean).join(" · ") || "--"}
			</span>
		),
	},

	{
		key: "default",
		header: "Default",
		widthUnits: 2,
		minWidth: 120,
		render: (user) =>
			user.isDefaultContact ? (
				<Badge variant="success">Default</Badge>
			) : (
				<span>--</span>
			),
	},

	{
		key: "status",
		header: "Status",
		widthUnits: 2,
		minWidth: 110,
		render: (user) => (
			<Badge variant={user.isActive ? "success" : "warning"}>
				{user.isActive ? "Active" : "Inactive"}
			</Badge>
		),
	},

	{
		key: "actions",
		header: "Actions",
		widthUnits: 1,
		minWidth: 80,
		render: (user) => {
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
		error,
		handleSetDefaultUser,
		isSettingDefault,
		handleToggleActiveStatus,
		isTogglingActiveStatus,
	} = useBPUsersManager(businessPartnerId);

	const columns = getColumns({
		isSettingDefault,
		isTogglingActiveStatus,
		onSetDefault: handleSetDefaultUser,
		onToggleActiveStatus: handleToggleActiveStatus,
	});

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

			<SimpleViewTable
				data={isLoading ? [] : users}
				columns={columns}
				getRowId={(user) => user.id}
				maxHeight="360px"
				className="bp-people-view-table"
				ariaLabel="Users for this business partner"
				emptyTitle={isLoading ? "Loading users..." : "No users found"}
				emptyDescription={
					isLoading
						? "Please wait while we load the users for this business partner."
						: "No users are linked to this business partner yet."
				}
			/>
		</div>
	);
};

export default BPUsers;
