import { MoreVertical } from "lucide-react";

import Button from "../../../components/common/Button";
import { SearchInput } from "../../../components/forms/SearchInput";
import SelectInput from "../../../components/forms/SelectInput";
import type { UserRoleOption } from "./user-management.types";

interface UserTableHeaderProps {
	search: string;
	role: UserRoleOption | null;
	roleOptions: UserRoleOption[];
	selectedCount: number;
	onSearch: (value: string) => void;
	onRoleChange: (role: UserRoleOption | null) => void;
}

export function UserTableHeader({
	search,
	role,
	roleOptions,
	selectedCount,
	onSearch,
	onRoleChange,
}: UserTableHeaderProps) {
	return (
		<div className="user-management-toolbar">
			<div className="user-management-role-filter">
				<SelectInput<UserRoleOption>
					inputId="user-role-filter"
					aria-label="Filter users by role"
					options={roleOptions}
					value={role}
					isClearable
					placeholder="All roles"
					onChange={(option) => onRoleChange(option)}
				/>
			</div>

			<div className="user-management-search">
				<SearchInput
					value={search}
					onChange={onSearch}
					placeholder="Search name, email, company, role..."
				/>
			</div>

			<div className="user-management-toolbar-end">
				{selectedCount > 0 ? (
					<span className="user-management-selected-count">
						{selectedCount} selected
					</span>
				) : null}

				<Button
					type="button"
					appearance="icon"
					variant="transparent"
					size="sm"
					Icon={MoreVertical}
					aria-label="Open user table options"
				/>
			</div>
		</div>
	);
}
