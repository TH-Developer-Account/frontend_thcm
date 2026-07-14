import type { TableUser } from "../../../utils/types";
import type {
	UserCounts,
	UserRoleOption,
	UserStatusTab,
} from "./user-management.types";

export const USER_STATUS_TABS = [
	"All",
	"Active",
	"Blocked",
	"Inactive",
] as const satisfies readonly UserStatusTab[];

export const getUserCounts = (users: TableUser[]): UserCounts => ({
	All: users.length,
	Active: users.filter((user) => user.status === "Active").length,
	Blocked: users.filter((user) => user.status === "Blocked").length,
	Inactive: users.filter((user) => user.status === "Inactive").length,
});

export const getRoleOptions = (users: TableUser[]): UserRoleOption[] => {
	const roles = Array.from(
		new Set(
			users
				.map((user) => user.role?.trim())
				.filter((role): role is string => Boolean(role)),
		),
	).sort((left, right) => left.localeCompare(right));

	return roles.map((role) => ({
		label: role,
		value: role,
	}));
};

type FilterUsersParams = {
	users: TableUser[];
	activeTab: UserStatusTab;
	search: string;
	role: UserRoleOption | null;
};

export const filterUsers = ({
	users,
	activeTab,
	search,
	role,
}: FilterUsersParams): TableUser[] => {
	const normalizedSearch = search.trim().toLowerCase();

	return users.filter((user) => {
		const matchesStatus = activeTab === "All" || user.status === activeTab;

		const matchesRole = role === null || user.role === role.value;

		const searchableContent = [
			user.name,
			user.email,
			user.phone,
			user.company,
			user.role,
			user.status,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		const matchesSearch =
			normalizedSearch.length === 0 ||
			searchableContent.includes(normalizedSearch);

		return matchesStatus && matchesRole && matchesSearch;
	});
};
