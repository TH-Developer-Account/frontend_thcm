import type { ZodIssue } from "zod";

import type {
	CreateUserInput,
	CreateUserPayload,
	UpdateUserInput,
	UpdateUserPayload,
	User,
	UserCounts,
	UserFormField,
	UserFormValues,
	UserPageMode,
	UserResponse,
	UserRoleOption,
	UserStatus,
	UserStatusTab,
} from "./user-management.types";

import { getUserFormSchema } from "./user-management.schema";

export const USER_STATUS_TABS = [
	"All",
	"Active",
	"Blocked",
	"Inactive",
] as const satisfies readonly UserStatusTab[];

export const mapUserToForm = (user: User): UserFormValues => ({
	// Existing URL is rendered from user.avatar; this holds only a new file.
	avatar: null,
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
	workspaceId: user.workspaceId,
	region: user.region,
	address: user.address,
	zone: user.zone,
	branch: user.branch,
	department: user.department,
	role: user.role,
	designation: user.designation,
	vertical: user.vertical,
	grade: user.grade ?? "",
	managerCode1: user.managerCode1,
	managerCode2: user.managerCode2,
	isDefaultContact: user.isDefaultContact,
	userType: user.userType,
	isActive: user.status === "Active",
	joinedOn: user.joinedOn ? user.joinedOn.slice(0, 10) : "",
	businessPartnerId: user.businessPartnerId,
});

export const EMPTY_USER_FORM: UserFormValues = {
	avatar: null,
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
	workspaceId: "",
	region: "",
	address: "",
	zone: "",
	branch: "",
	department: "",
	role: "",
	designation: "",
	vertical: "",
	grade: "",
	managerCode1: "",
	managerCode2: "",
	isDefaultContact: false,
	userType: "Select",
	isActive: true,
	joinedOn: "",
	businessPartnerId: "",
};

const getUserStatus = (user: UserResponse): UserStatus => {
	if (user.status) return user.status;
	return user.is_active ? "Active" : "Inactive";
};

export const mapUser = (user: UserResponse): User => ({
	id: user.id,
	avatar: user.avatar ?? "",
	bydId: user.bydId ?? "",
	s4Id: user.s4Id ?? "",
	tallyId: user.tallyId ?? "",
	c4cId: user.c4cId ?? "",
	employeeCode: user.employeeCode ?? "",
	firstName: user.first_name ?? "",
	lastName: user.last_name ?? "",
	phoneNumber: user.phone_number ?? "",
	email: user.email ?? "",
	workspaceId: user.workspaceUsers?.[0]?.workspaceId ?? "",
	region: user.region ?? "",
	address: user.address ?? "",
	zone: user.zone ?? "",
	branch: user.branch ?? "",
	department: user.department ?? "",
	role: user.role ?? "",
	designation: user.designation ?? "",
	vertical: user.vertical ?? "",
	// grade: user.grade ?? "",
	managerCode1: user.managerCode1 ?? "",
	managerCode2: user.managerCode2 ?? "",
	isDefaultContact: Boolean(user.isDefaultContact),
	isDefaultLogin: Boolean(user.is_default_login),
	userType: user.userType ?? "Select",
	status: getUserStatus(user),
	joinedOn: user.joinedOn ?? "",
	businessPartnerId: user.businessPartnerId ?? undefined,
	businessPartner: user.businessPartner ?? null,
	createdAt: user.created_at,
	updatedAt: user.updated_at,
});

export const mapUserFormToCreatePayload = (
	form: CreateUserInput,
): CreateUserPayload => {
	const payload = {
		first_name: form.firstName.trim(),
		last_name: form.lastName.trim(),
		email: form.email.trim().toLowerCase(),
		phone_number: form.phoneNumber.trim(),
		workspaceId: form.workspaceId.trim(),
		employeeCode: form.employeeCode.trim(),
	} as CreateUserPayload;

	const assignText = (
		key: keyof CreateUserPayload,
		value: string | undefined,
	) => {
		const normalized = value?.trim();
		if (normalized) {
			(payload as Record<string, unknown>)[key] = normalized;
		}
	};

	assignText("password", form.password);
	assignText("bydId", form.bydId);
	assignText("s4Id", form.s4Id);
	assignText("tallyId", form.tallyId);
	assignText("c4cId", form.c4cId);
	assignText("region", form.region);
	assignText("address", form.address);
	assignText("zone", form.zone);
	assignText("branch", form.branch);
	assignText("department", form.department);
	assignText("role", form.role);
	assignText("designation", form.designation);
	assignText("vertical", form.vertical);
	// assignText("grade", form.grade); // enable after backend grade support
	assignText("managerCode1", form.managerCode1);
	assignText("managerCode2", form.managerCode2);
	assignText("joinedOn", form.joinedOn);
	assignText("businessPartnerId", form.businessPartnerId);

	if (form.userType && form.userType !== "Select") {
		payload.userType = form.userType;
	}

	if (form.isActive !== undefined) {
		(payload as Record<string, unknown>).is_active = form.isActive;
	}

	return payload;
};

// key -> actual Prisma field name (mixed case, not blanket snake_case)
const USER_UPDATE_FIELD_MAP = {
	firstName: "first_name",
	lastName: "last_name",
	password: "password",
	phoneNumber: "phone_number",
	email: "email",
	employeeCode: "employeeCode",
	bydId: "bydId",
	s4Id: "s4Id",
	tallyId: "tallyId",
	c4cId: "c4cId",
	region: "region",
	address: "address",
	zone: "zone",
	branch: "branch",
	department: "department",
	role: "role",
	designation: "designation",
	vertical: "vertical",
	// grade: "grade", // enable after backend grade support
	// isDefaultContact: "isDefaultContact", // enable after backend isDefaultContact support
	managerCode1: "managerCode1",
	managerCode2: "managerCode2",
	userType: "userType",
	isActive: "is_active",
	joinedOn: "joinedOn",
	businessPartnerId: "businessPartnerId",
} as const;

export const mapUserFormToUpdatePayload = (
	form: UpdateUserInput,
): UpdateUserPayload => {
	const payload: Record<string, unknown> = {};

	Object.entries(form).forEach(([key, value]) => {
		if (value === undefined) return;
		if (key === "avatar") return; // binary file is handled by multipart FormData
		if (key === "workspaceId") return; // never sent on update — not an updatable field
		if (key === "password" && String(value).trim().length === 0) return;

		const apiKey =
			USER_UPDATE_FIELD_MAP[key as keyof typeof USER_UPDATE_FIELD_MAP];
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

export type UserFieldErrors = Partial<Record<UserFormField, string>>;

export const validateUserForm = (
	values: UserFormValues,
	pageMode: UserPageMode,
): UserFieldErrors => {
	const schema = getUserFormSchema(pageMode === "list" ? "create" : pageMode);
	const result = schema.safeParse(values);

	if (result.success) return {};

	const fieldErrors: UserFieldErrors = {};
	result.error.issues.forEach((issue: ZodIssue) => {
		const field = issue.path[0] as UserFormField | undefined;
		if (!field || fieldErrors[field]) return; // first issue per field only
		fieldErrors[field] = issue.message;
	});

	return fieldErrors;
};

/**
 * Strips fields from a payload when they're "empty" per a caller-supplied
 * check — generalizes the ad hoc `password?.trim() ? values : rest`
 * destructure in useUsersData's handleSubmitUser. Add new write-only /
 * sensitive fields here instead of hand-rolling another destructure.
 */

export const stripEmptySensitiveFields = <T extends Record<string, unknown>>(
	payload: T,
	fields: Array<keyof T>,
	isEmpty: (value: unknown) => boolean = (value) =>
		typeof value !== "string" || value.trim().length === 0,
): T => {
	const next = { ...payload };
	fields.forEach((field) => {
		if (isEmpty(next[field])) {
			delete next[field];
		}
	});
	return next;
};
