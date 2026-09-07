import type {
	CreateUserInput,
	CreateUserPayload,
	UpdateUserInput,
	UpdateUserPayload,
	User,
	UserCounts,
	UserFormValues,
	UserResponse,
	UserRoleOption,
	UserStatus,
	UserStatusTab,
} from "./user-management.types";

export const USER_STATUS_TABS = [
	"All",
	"Active",
	"Blocked",
	"Inactive",
] as const satisfies readonly UserStatusTab[];

export const EMPTY_USER_FORM: UserFormValues = {
	internalId: "",
	bydId: "",
	s4Id: "",
	tallyId: "",
	c4cId: "",
	employeeCode: "",
	firstName: "",
	lastName: "",
	password: "",
	phoneNumber: "",
	email: "",
	region: "",
	address: "",
	zone: "",
	branch: "",
	department: "",
	role: "",
	designation: "",
	vertical: "",
	bpInternalCode: "",
	managerCode1: "",
	managerCode2: "",
	isDefaultContact: false,
	userType: "Select",
	isActive: true,
	joinedOn: "",
};

const getUserStatus = (user: UserResponse): UserStatus => {
	if (user.status) return user.status;
	return user.is_active ? "Active" : "Inactive";
};

export const mapUser = (user: UserResponse): User => ({
	id: user.id,
	internalId: user.internal_id ?? "",
	bydId: user.byd_id ?? "",
	s4Id: user.s4_id ?? "",
	tallyId: user.tally_id ?? "",
	c4cId: user.c4c_id ?? "",
	employeeCode: user.employee_code ?? "",
	firstName: user.first_name ?? "",
	lastName: user.last_name ?? "",
	phoneNumber: user.phone_number ?? "",
	email: user.email ?? "",
	region: user.region ?? "",
	address: user.address ?? "",
	zone: user.zone ?? "",
	branch: user.branch ?? "",
	department: user.department ?? "",
	role: user.role ?? "",
	designation: user.designation ?? "",
	vertical: user.vertical ?? "",
	bpInternalCode: user.bp_internal_code ?? "",
	managerCode1: user.manager_code_1 ?? "",
	managerCode2: user.manager_code_2 ?? "",
	isDefaultContact: Boolean(user.is_default_contact),
	isDefaultLogin: Boolean(user.is_default_login),
	userType: user.user_type ?? "Select",
	status: getUserStatus(user),
	joinedOn: user.joined_on ?? "",
	createdAt: user.created_at,
	updatedAt: user.updated_at,
});

export const mapUserFormToCreatePayload = (
	form: CreateUserInput,
): CreateUserPayload => ({
	internal_id: form.internalId.trim(),
	byd_id: form.bydId.trim(),
	s4_id: form.s4Id.trim(),
	tally_id: form.tallyId.trim(),
	c4c_id: form.c4cId.trim(),
	employee_code: form.employeeCode.trim(),
	email: form.email.trim().toLowerCase(),
	first_name: form.firstName.trim(),
	last_name: form.lastName.trim(),
	phone_number: form.phoneNumber.trim(),
	password: form.password,
	region: form.region.trim(),
	address: form.address.trim(),
	zone: form.zone.trim(),
	branch: form.branch.trim(),
	department: form.department.trim(),
	role: form.role.trim(),
	designation: form.designation.trim(),
	vertical: form.vertical.trim(),
	bp_internal_code: form.bpInternalCode.trim(),
	manager_code_1: form.managerCode1.trim(),
	manager_code_2: form.managerCode2.trim(),
	is_default_contact: form.isDefaultContact,
	user_type: form.userType,
	is_active: form.isActive,
	joined_on: form.joinedOn,
});

const USER_UPDATE_FIELD_MAP = {
	internalId: "internal_id",
	bydId: "byd_id",
	s4Id: "s4_id",
	tallyId: "tally_id",
	c4cId: "c4c_id",
	employeeCode: "employee_code",
	firstName: "first_name",
	lastName: "last_name",
	password: "password",
	phoneNumber: "phone_number",
	email: "email",
	region: "region",
	address: "address",
	zone: "zone",
	branch: "branch",
	department: "department",
	role: "role",
	designation: "designation",
	vertical: "vertical",
	bpInternalCode: "bp_internal_code",
	managerCode1: "manager_code_1",
	managerCode2: "manager_code_2",
	isDefaultContact: "is_default_contact",
	userType: "user_type",
	isActive: "is_active",
	joinedOn: "joined_on",
} as const;

export const mapUserFormToUpdatePayload = (
	form: UpdateUserInput,
): UpdateUserPayload => {
	const payload: Record<string, unknown> = {};

	Object.entries(form).forEach(([key, value]) => {
		if (value === undefined) return;

		const apiKey = USER_UPDATE_FIELD_MAP[key as keyof UpdateUserInput];
		if (!apiKey) return;

		payload[apiKey] =
			typeof value === "string" && key !== "password"
				? key === "email"
					? value.trim().toLowerCase()
					: value.trim()
				: value;
	});

	return payload as UpdateUserPayload;
};

export const getUserDisplayName = (user: User): string =>
	[user.firstName, user.lastName].filter(Boolean).join(" ") || "--";

export const mapUserToForm = (user: User): UserFormValues => ({
	internalId: user.internalId,
	bydId: user.bydId,
	s4Id: user.s4Id,
	tallyId: user.tallyId,
	c4cId: user.c4cId,
	employeeCode: user.employeeCode,
	firstName: user.firstName,
	lastName: user.lastName,
	password: "",
	phoneNumber: user.phoneNumber,
	email: user.email,
	region: user.region,
	address: user.address,
	zone: user.zone,
	branch: user.branch,
	department: user.department,
	role: user.role,
	designation: user.designation,
	vertical: user.vertical,
	bpInternalCode: user.bpInternalCode,
	managerCode1: user.managerCode1,
	managerCode2: user.managerCode2,
	isDefaultContact: user.isDefaultContact,
	userType: user.userType,
	isActive: user.status === "Active",
	joinedOn: user.joinedOn ? user.joinedOn.slice(0, 10) : "",
});

export const getUserCounts = (users: User[]): UserCounts => ({
	All: users.length,
	Active: users.filter((user) => user.status === "Active").length,
	Blocked: users.filter((user) => user.status === "Blocked").length,
	Inactive: users.filter((user) => user.status === "Inactive").length,
});

export const getRoleOptions = (users: User[]): UserRoleOption[] =>
	Array.from(
		new Set(
			users
				.map((user) => user.role.trim())
				.filter((role): role is string => Boolean(role)),
		),
	)
		.sort((left, right) => left.localeCompare(right))
		.map((role) => ({ label: role, value: role }));

type FilterUsersParams = {
	users: User[];
	activeTab: UserStatusTab;
	search: string;
	role: UserRoleOption | null;
};

export const filterUsers = ({
	users,
	activeTab,
	search,
	role,
}: FilterUsersParams): User[] => {
	const normalizedSearch = search.trim().toLowerCase();

	return users.filter((user) => {
		const matchesStatus = activeTab === "All" || user.status === activeTab;
		const matchesRole = role === null || user.role === role.value;
		const searchableContent = [
			getUserDisplayName(user),
			user.email,
			user.phoneNumber,
			user.employeeCode,
			user.department,
			user.role,
			user.designation,
			user.region,
			user.zone,
			user.branch,
			user.userType,
			user.status,
		]
			.join(" ")
			.toLowerCase();

		return (
			matchesStatus &&
			matchesRole &&
			(normalizedSearch.length === 0 ||
				searchableContent.includes(normalizedSearch))
		);
	});
};
