export type UserType = "Select" | "THCM" | "DEALER" | "CUSTOMER";

export type GradeOption = {
	label: string;
	value: string;
};

export type UserStatus = "Active" | "Inactive" | "Blocked";

export type UserStatusTab = "All" | UserStatus;

// Frontend-facing shape, produced by mapUser(). Casing here is just
// frontend convention — doesn't need to match Prisma, mapUser() does that translation.
export type User = {
	id: string;
	bydId: string;
	s4Id: string;
	tallyId: string;
	c4cId: string;
	employeeCode: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	email: string;
	workspaceId: string;
	region: string;
	address: string;
	zone: string;
	branch: string;
	department: string;
	role: string;
	designation: string;
	vertical: string;
	grade?: string;
	managerCode1: string;
	managerCode2: string;
	isDefaultContact: boolean;
	isDefaultLogin: boolean;
	userType: UserType;
	status: UserStatus;
	joinedOn: string;
	businessPartnerId?: string;
	businessPartner?: {
		id: string;
		bpName: string;
		officeType: string;
	} | null;
	createdAt?: string;
	updatedAt?: string;
};

// Raw shape as returned by getUsers/getUserById — mirrors their `select`
// exactly. Only first_name/last_name/email/phone_number/is_active/
// created_at/updated_at are snake_case in Prisma; everything else is
// camelCase. Do not blanket-convert this.
export type UserResponse = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	is_active: boolean;
	is_default_login?: boolean | null;
	employeeCode?: string | null;
	bydId?: string | null;
	s4Id?: string | null;
	tallyId?: string | null;
	c4cId?: string | null;
	region?: string | null;
	address?: string | null;
	zone?: string | null;
	branch?: string | null;
	department?: string | null;
	role?: string | null;
	designation?: string | null;
	vertical?: string | null;
	grade?: string | null;
	managerCode1?: string | null;
	managerCode2?: string | null;
	isDefaultContact?: boolean | null;
	userType?: UserType | null;
	joinedOn?: string | null;
	businessPartnerId?: string | null;
	businessPartner?: {
		id: string;
		bpName: string;
		officeType: string;
	} | null;
	workspaceUsers?: Array<{
		workspaceId: string;
		isSuperAdmin: boolean;
	}>;
	status?: UserStatus;
	password?: string; // never actually present now that getUsers has a select — kept optional for safety
	created_at?: string;
	updated_at?: string;
};

export type CreateUserPayload = {
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	password?: string;
	workspaceId: string;
	employeeCode: string;
	bydId?: string;
	s4Id?: string;
	tallyId?: string;
	c4cId?: string;
	region?: string;
	address?: string;
	zone?: string;
	branch?: string;
	department?: string;
	role?: string;
	designation?: string;
	vertical?: string;
	grade?: string;
	managerCode1?: string;
	managerCode2?: string;
	isDefaultContact?: boolean;
	userType?: UserType;
	is_active?: boolean;
	joinedOn?: string;
	businessPartnerId?: string;
};

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "workspaceId">>;

export type CreateUserInput = {
	firstName: string;
	lastName: string;
	password?: string;
	phoneNumber: string;
	email: string;
	workspaceId: string;
	employeeCode: string;
	bydId?: string;
	s4Id?: string;
	tallyId?: string;
	c4cId?: string;
	region?: string;
	address?: string;
	zone?: string;
	branch?: string;
	department?: string;
	role?: string;
	designation?: string;
	vertical?: string;
	grade?: string;
	managerCode1?: string;
	managerCode2?: string;
	isDefaultContact?: boolean;
	userType?: UserType;
	isActive?: boolean;
	joinedOn?: string;
	businessPartnerId?: string;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export type UserFormValues = Required<
	Omit<CreateUserInput, "businessPartnerId">
> & {
	businessPartnerId?: string;
};

export type UserFormField = keyof UserFormValues;

export type UserPageMode = "list" | "create" | "edit" | "view";

export type UpdateUserVariables = {
	userId: string;
	payload: UpdateUserInput;
};

export type DeleteUserVariables = {
	userId: string;
};

export type UpdateUserStatusVariables = {
	userId: string;
	status: UserStatus;
};

export type UserRoleOption = {
	label: string;
	value: string;
};

export type UserCounts = Record<UserStatusTab, number>;

export type UserRowActionHandler = (user: User) => void;

export type ApiEnvelope<T> = {
	success?: boolean;
	message?: string;
	data: T;
};

export type UserMutationResult = {
	success?: boolean;
	message?: string;
	data?: Partial<UserResponse>;
	user?: UserResponse;
};
