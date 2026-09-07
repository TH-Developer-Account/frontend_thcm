import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	CreateUserInput,
	UpdateUserStatusVariables,
	UpdateUserVariables,
	User,
	UserFormField,
	UserFormValues,
	UserPageMode,
	UserRoleOption,
	UserStatusTab,
} from "./user-management.types";
import {
	EMPTY_USER_FORM,
	filterUsers,
	getRoleOptions,
	getUserCounts,
	mapUserToForm,
} from "./user-management.utils";
import { userApi } from "./users.api";

import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";

export const userKeys = {
	all: ["users"] as const,
	lists: () => [...userKeys.all, "list"] as const,
	list: (profile = "all") => [...userKeys.lists(), { profile }] as const,
	details: () => [...userKeys.all, "detail"] as const,
	detail: (userId: string) => [...userKeys.details(), userId] as const,
};

export const USER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export const useUserDetailQuery = (userId?: string) =>
	useQuery({
		queryKey: userKeys.detail(userId ?? ""),
		queryFn: () => userApi.getUserById(userId as string),
		enabled: Boolean(userId),
		...USER_QUERY_OPTIONS,
	});

const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : "Something went wrong.";

const REQUIRED_USER_FIELDS: Array<keyof Omit<UserFormValues, "password">> = [
	"internalId",
	"bydId",
	"s4Id",
	"tallyId",
	"c4cId",
	"employeeCode",
	"firstName",
	"lastName",
	"phoneNumber",
	"email",
	"region",
	"address",
	"zone",
	"branch",
	"department",
	"role",
	"designation",
	"vertical",
	"bpInternalCode",
	"managerCode1",
	"managerCode2",
	"userType",
	"joinedOn",
];

const REQUIRED_FIELD_MESSAGE = "This field is required.";

type FormFieldErrors = Partial<Record<UserFormField, string>>;

export function useUsersData() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const [activeTab, setActiveTab] = useState<UserStatusTab>("All");
	const [search, setSearch] = useState("");
	const [role, setRole] = useState<UserRoleOption | null>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [pageMode, setPageMode] = useState<UserPageMode>("list");
	const [form, setForm] = useState<UserFormValues>(EMPTY_USER_FORM);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

	const usersQuery = useQuery({
		queryKey: userKeys.list("all"),
		queryFn: userApi.getUsers,
		...USER_QUERY_OPTIONS,
	});

	const invalidateUsers = async () => {
		await queryClient.invalidateQueries({ queryKey: userKeys.all });
	};

	const createMutation = useMutation({
		mutationFn: userApi.createUser,
		onSuccess: invalidateUsers,
	});

	const updateMutation = useMutation({
		mutationFn: userApi.updateUser,
		onSuccess: async () => {
			setSelectedUser(null);
			await invalidateUsers();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: userApi.deleteUser,
		onSuccess: async (_data, variables) => {
			setSelectedRowIds((current) =>
				current.filter((userId) => userId !== variables.userId),
			);
			setSelectedUser((current) =>
				current?.id === variables.userId ? null : current,
			);
			await invalidateUsers();
			showSuccessToast(showToast, "User deleted successfully.");
		},
		onError: (error) => {
			showApiErrorToast(showToast, error, "Failed to delete user.");
		},
	});

	const statusMutation = useMutation({
		mutationFn: userApi.updateUserStatus,
		onSuccess: async (response) => {
			await invalidateUsers();
			showSuccessToast(
				showToast,
				response?.message ?? "User status updated successfully.",
			);
		},
		onError: (error) => {
			showApiErrorToast(showToast, error, "Failed to update user status.");
		},
	});

	const users = usersQuery.data ?? [];
	const counts = useMemo(() => getUserCounts(users), [users]);
	const roleOptions = useMemo(() => getRoleOptions(users), [users]);
	const filteredUsers = useMemo(
		() => filterUsers({ users, activeTab, search, role }),
		[activeTab, role, search, users],
	);

	const handleTabChange = (tab: UserStatusTab) => {
		setActiveTab(tab);
		setSelectedRowIds([]);
	};

	const handleRoleChange = (option: UserRoleOption | null) => {
		setRole(option);
		setSelectedRowIds([]);
	};

	const handleCreateUser = async (payload: CreateUserInput) => {
		return createMutation.mutateAsync(payload);
	};

	const handleUpdateUser = async (variables: UpdateUserVariables) => {
		return updateMutation.mutateAsync(variables);
	};

	const handleDeleteUser = async (userId: string) => {
		await deleteMutation.mutateAsync({ userId });
	};

	const handleStatusChange = async (variables: UpdateUserStatusVariables) =>
		statusMutation.mutateAsync(variables);

	const handleFormChange = <K extends UserFormField>(
		field: K,
		value: UserFormValues[K],
	) => {
		setForm((current) => ({ ...current, [field]: value }));
		setFormError(null);
		setFieldErrors((current) => {
			if (!current[field]) return current;
			const next = { ...current };
			delete next[field];
			return next;
		});
	};

	const handleStartCreate = () => {
		setSelectedUser(null);
		setForm(EMPTY_USER_FORM);
		setFormError(null);
		setFieldErrors({});
		setPageMode("create");
	};

	const handleStartEdit = (user: User) => {
		setSelectedUser(user);
		setForm(mapUserToForm(user));
		setFormError(null);
		setFieldErrors({});
		setPageMode("edit");
	};

	const handleCancelForm = () => {
		setSelectedUser(null);
		setForm(EMPTY_USER_FORM);
		setFormError(null);
		setFieldErrors({});
		setPageMode("list");
	};

	const validateForm = (): FormFieldErrors => {
		const nextFieldErrors: FormFieldErrors = {};

		REQUIRED_USER_FIELDS.forEach((field) => {
			const value = form[field];
			if (typeof value === "string" && value.trim().length === 0) {
				nextFieldErrors[field] = REQUIRED_FIELD_MESSAGE;
			}
		});

		if (form.userType === "Select") {
			nextFieldErrors.userType = "Please select a user type.";
		}

		if (pageMode === "create" && form.password.trim().length === 0) {
			nextFieldErrors.password = REQUIRED_FIELD_MESSAGE;
		}

		return nextFieldErrors;
	};

	const handleSubmitUser = async () => {
		const nextFieldErrors = validateForm();

		if (Object.keys(nextFieldErrors).length > 0) {
			setFieldErrors(nextFieldErrors);
			setFormError("Please complete all mandatory fields.");
			return;
		}

		setFieldErrors({});
		setFormError(null);

		try {
			let response;

			if (pageMode === "edit" && selectedUser) {
				const { password, ...values } = form;
				response = await handleUpdateUser({
					userId: selectedUser.id,
					payload: password.trim() ? form : values,
				});
			} else {
				response = await handleCreateUser(form);
			}

			showSuccessToast(
				showToast,
				response?.message ??
					(pageMode === "edit"
						? "User updated successfully."
						: "User created successfully."),
			);

			handleCancelForm();
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				pageMode === "edit"
					? "Failed to update user."
					: "Failed to create user.",
			);
			setFormError(getErrorMessage(error));
		}
	};

	return {
		users,
		filteredUsers,
		counts,
		roleOptions,
		activeTab,
		search,
		role,
		selectedRowIds,
		selectedUser,
		pageMode,
		form,
		formError,
		fieldErrors,
		isLoading: usersQuery.isLoading,
		isFetching: usersQuery.isFetching,
		error: usersQuery.error ? getErrorMessage(usersQuery.error) : null,
		mutationError:
			createMutation.error ??
			updateMutation.error ??
			deleteMutation.error ??
			statusMutation.error,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,
		isChangingStatus: statusMutation.isPending,
		setSearch,
		setSelectedRowIds,
		setSelectedUser,
		handleTabChange,
		handleRoleChange,
		handleCreateUser,
		handleUpdateUser,
		handleDeleteUser,
		handleStatusChange,
		handleFormChange,
		handleStartCreate,
		handleStartEdit,
		handleCancelForm,
		handleSubmitUser,
		refetchUsers: usersQuery.refetch,
	};
}

export type UsersController = ReturnType<typeof useUsersData>;
