import type {
	CreateUserInput,
	CreateUserPayload,
	UpdateUserInput,
	UpdateUserPayload,
	User,
	UserCounts,
	UserFormValues,
	UserResponse,
	// UserRoleOption,
	UserStatus,
	UserStatusTab,
} from "./user-management.types";
import type { UserTypeOption } from "./user-management.types";

export const USER_STATUS_TABS = [
	"All",
	"Active",
	"Blocked",
	"Inactive",
] as const satisfies readonly UserStatusTab[];

export const USER_TYPE_OPTIONS: UserTypeOption[] = [
	{ label: "THCM", value: "THCM" },
	{ label: "Dealer", value: "DEALER" },
	{ label: "Customer", value: "CUSTOMER" },
];
const getUserResponseStatus = (user: User): UserStatus => {
	if (user.status) return user.status;
	return user.status ? "Active" : "Inactive";
};
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
	status: getUserResponseStatus(user),
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
	status: "",
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
	grade: user.grade ?? "",
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

	// Password isn't collected in the form (see the commented-out password
	// field in CreateUserForm) — createUser always assigns DEFAULT_PASSWORD
	// server-side regardless of what's sent. Commented rather than deleted
	// in case a dedicated "set initial password" flow needs this later.
	// assignText("password", form.password);
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
	assignText("grade", form.grade); // enable after backend grade support
	assignText("managerCode1", form.managerCode1);
	assignText("managerCode2", form.managerCode2);
	assignText("joinedOn", form.joinedOn);
	assignText("businessPartnerId", form.businessPartnerId);

	if (form.userType && form.userType !== "Select") {
		payload.userType = form.userType;
	}

	// isActive (the checkbox the form actually collects) is the single
	// source of truth for both flags the backend accepts: the boolean
	// is_active and the textual status. Deriving status here — rather than
	// relying on form.status, which no input in CreateUserForm writes to —
	// keeps the two from ever disagreeing.
	if (form.isActive !== undefined) {
		(payload as Record<string, unknown>).is_active = form.isActive;
		payload.status = form.isActive ? "Active" : "Inactive";
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
	status: "status",
	grade: "grade", // enable after backend grade support
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

		// joinedOn and businessPartnerId are a DateTime column and a
		// relation id respectively — unlike a plain text column, an empty
		// string isn't a valid "leave unchanged" value for either.
		// prisma.user.update() throws on `joinedOn: ""` ("Invalid value for
		// argument joinedOn: premature end of input. Expected ISO-8601
		// DateTime."), and an empty businessPartnerId would try to relate
		// to a nonexistent id. The form now validates both as required
		// before submit, but this guard keeps the mapper itself safe for
		// any other caller.
		if (
			(key === "joinedOn" || key === "businessPartnerId") &&
			typeof value === "string" &&
			value.trim().length === 0
		) {
			return;
		}

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

	// form.status is a separate field the update form never actually
	// writes to (no input targets it — see CreateUserForm's status
	// checkbox, which only sets isActive), so it can be stale relative to
	// isActive. Re-derive it here whenever isActive is present so the two
	// flags sent to the backend never disagree.
	if (form.isActive !== undefined) {
		payload.status = form.isActive ? "Active" : "Inactive";
	}

	return payload as UpdateUserPayload;
};

export const getUserDisplayName = (user: User): string =>
	[user.firstName, user.lastName].filter(Boolean).join(" ") || "--";

export const getUserCounts = (users: User[] = []): UserCounts => {
	const safeUsers = Array.isArray(users) ? users : [];

	return {
		All: safeUsers.length,
		Active: safeUsers.filter((user) => user.status === "Active").length,
		Blocked: safeUsers.filter((user) => user.status === "Blocked").length,
		Inactive: safeUsers.filter((user) => user.status === "Inactive").length,
	};
};

// export const getRoleOptions = (users: User[] = []): UserRoleOption[] => {
// 	const safeUsers = Array.isArray(users) ? users : [];

// 	return Array.from(
// 		new Set(
// 			safeUsers
// 				.map((user) => user.role?.trim())
// 				.filter((role): role is string => Boolean(role)),
// 		),
// 	)
// 		.sort((left, right) => left.localeCompare(right))
// 		.map((role) => ({
// 			label: role,
// 			value: role,
// 		}));
// };

// type FilterUsersParams = {
// 	users: User[];
// 	activeTab: UserStatusTab;
// 	search: string;
// 	role: UserRoleOption | null;
// };

export const filterUsers = ({
	users,
	activeTab,
	search,
	userType,
}: {
	users: User[];
	activeTab: UserStatusTab;
	search: string;
	userType: UserTypeOption | null;
}): User[] => {
	const safeUsers = Array.isArray(users) ? users : [];
	const normalizedSearch = search.trim().toLowerCase();

	return safeUsers.filter((user) => {
		const matchesStatus = activeTab === "All" || user.status === activeTab;

		const matchesUserType =
			userType === null || user.userType === userType.value;

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
			.filter(Boolean)
			.join(" ")
			.toLowerCase();

		const matchesSearch =
			normalizedSearch.length === 0 ||
			searchableContent.includes(normalizedSearch);

		return matchesStatus && matchesUserType && matchesSearch;
	});
};
