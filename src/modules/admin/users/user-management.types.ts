export type UserType = "Select" | "THCM" | "DEALER" | "CUSTOMER";

export type UserStatus = "Active" | "Inactive" | "Blocked";

export type UserStatusTab = "All" | UserStatus;

export type User = {
	id: string;
	internalId: string;
	bydId: string;
	s4Id: string;
	tallyId: string;
	c4cId: string;
	employeeCode: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	email: string;
	region: string;
	address: string;
	zone: string;
	branch: string;
	department: string;
	role: string;
	designation: string;
	vertical: string;
	bpInternalCode: string;
	managerCode1: string;
	managerCode2: string;
	isDefaultContact: boolean;
	isDefaultLogin: boolean;
	userType: UserType;
	status: UserStatus;
	joinedOn: string;
	createdAt?: string;
	updatedAt?: string;
};

export type UserResponse = {
	id: string;
	internal_id?: string | null;
	byd_id?: string | null;
	s4_id?: string | null;
	tally_id?: string | null;
	c4c_id?: string | null;
	employee_code?: string | null;
	first_name: string;
	last_name: string;
	phone_number: string;
	email: string;
	region?: string | null;
	address?: string | null;
	zone?: string | null;
	branch?: string | null;
	department?: string | null;
	role?: string | null;
	designation?: string | null;
	vertical?: string | null;
	bp_internal_code?: string | null;
	manager_code_1?: string | null;
	manager_code_2?: string | null;
	is_default_contact?: boolean | null;
	is_default_login?: boolean | null;
	user_type?: UserType | null;
	is_active: boolean;
	status?: UserStatus;
	joined_on?: string | null;
	password?: string;
	created_at?: string;
	updated_at?: string;
};

export type CreateUserInput = {
	internalId: string;
	bydId: string;
	s4Id: string;
	tallyId: string;
	c4cId: string;
	employeeCode: string;
	firstName: string;
	lastName: string;
	password: string;
	phoneNumber: string;
	email: string;
	region: string;
	address: string;
	zone: string;
	branch: string;
	department: string;
	role: string;
	designation: string;
	vertical: string;
	bpInternalCode: string;
	managerCode1: string;
	managerCode2: string;
	isDefaultContact: boolean;
	userType: UserType;
	isActive: boolean;
	joinedOn: string;
};

export type CreateUserPayload = {
	internal_id: string;
	byd_id: string;
	s4_id: string;
	tally_id: string;
	c4c_id: string;
	employee_code: string;
	first_name: string;
	last_name: string;
	password: string;
	phone_number: string;
	email: string;
	region: string;
	address: string;
	zone: string;
	branch: string;
	department: string;
	role: string;
	designation: string;
	vertical: string;
	bp_internal_code: string;
	manager_code_1: string;
	manager_code_2: string;
	is_default_contact: boolean;
	user_type: UserType;
	is_active: boolean;
	joined_on: string;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export type UserFormValues = CreateUserInput;

export type UserFormField = keyof UserFormValues;

export type UserPageMode = "list" | "create" | "edit";

export type UpdateUserPayload = Partial<CreateUserPayload>;

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
