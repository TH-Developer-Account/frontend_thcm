import {
	useLocation,
	useMatch,
	useNavigate,
	useParams,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	CreateUserInput,
	UpdateUserStatusVariables,
	UpdateUserVariables,
	User,
	UserFormField,
	UserFormValues,
	UserMutationResult,
	UserPageMode,
	// UserRoleOption,
	UserStatus,
	UserStatusTab,
	UserTypeOption,
} from "./user-management.types";
import {
	EMPTY_USER_FORM,
	filterUsers,
	// getRoleOptions,
	getUserCounts,
	mapUserToForm,
} from "./user-management.utils";
import { userApi } from "./users.api";
import {
	validateUserBasicField,
	validateUserSection,
	type UserBasicInfoField,
} from "./user.schema";
import { useAuth, useToast } from "../../../context/Auth/AuthContext";
import { useDebounce } from "../../../hooks/useDebounce";
import {
	getApiErrorMessage,
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";

export const userKeys = {
	all: ["users"] as const,
	lists: () => [...userKeys.all, "list"] as const,
	list: (profile = "all", search = "") =>
		[...userKeys.lists(), { profile, search }] as const,
	details: () => [...userKeys.all, "detail"] as const,
	detail: (userId: string) => [...userKeys.details(), userId] as const,
};

export const USER_QUERY_OPTIONS = {
	staleTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export const DETAIL_QUERY_CACHE_OPTIONS = {
	staleTime: Infinity,
	gcTime: Infinity,
	refetchOnMount: false,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
} as const;

export const useUserDetailQuery = (userId?: string) =>
	useQuery({
		queryKey: userKeys.detail(userId ?? ""),
		queryFn: () => userApi.getUserById(userId as string),
		enabled: Boolean(userId),
		...DETAIL_QUERY_CACHE_OPTIONS,
	});

const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : "Something went wrong.";

type FormSection = "basic" | "organization";

const BASIC_INFO_REQUIRED_FIELDS: Array<keyof UserFormValues> = [
	"firstName",
	"lastName",
	"phoneNumber",
	"email",
	"employeeCode",
];

export const ORGANIZATION_REQUIRED_FIELDS: Array<keyof UserFormValues> = [
	"region",
	"address",
	"zone",
	"branch",
	"department",
	"role",
	"designation",
	"vertical",
	"managerCode1",
	"managerCode2",
	"bydId",
	"s4Id",
	"tallyId",
	"c4cId",
];

export const BASIC_INFO_FIELDS: Array<keyof UserFormValues> = [
	...BASIC_INFO_REQUIRED_FIELDS,
	"userType",
	"businessPartnerId",
	"grade",
	"joinedOn",
	"isActive",
];

const DUPLICATE_FIELD_HINTS: Array<{
	pattern: RegExp;
	field: UserFormField;
}> = [
	{ pattern: /email address/i, field: "email" },
	{ pattern: /employee code/i, field: "employeeCode" },
	{ pattern: /phone number/i, field: "phoneNumber" },
	{ pattern: /BYD ID/i, field: "bydId" },
	{ pattern: /S4 ID/i, field: "s4Id" },
	{ pattern: /Tally ID/i, field: "tallyId" },
	{ pattern: /C4C ID/i, field: "c4cId" },
];

type FormFieldErrors = Partial<Record<UserFormField, string>>;

const clearSectionFieldErrors = (
	current: FormFieldErrors,
	section: FormSection,
): FormFieldErrors => {
	const sectionFields =
		section === "basic" ? BASIC_INFO_FIELDS : ORGANIZATION_REQUIRED_FIELDS;

	const next = { ...current };
	sectionFields.forEach((field) => {
		delete next[field];
	});
	return next;
};

const extractCreatedUserId = (
	response: UserMutationResult | undefined,
): string | undefined => response?.data?.id ?? response?.user?.id;

export function useUsersData() {
	const navigate = useNavigate();
	const { id: userId } = useParams<{ id: string }>();

	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { workspaceId } = useAuth();
	const [activeTab, setActiveTab] = useState<UserStatusTab>("All");
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search.trim(), 300);
	// const [role, setRole] = useState<UserRoleOption | null>(null);
	const [userType, setUserType] = useState<UserTypeOption | null>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
	const [form, setForm] = useState<UserFormValues>(EMPTY_USER_FORM);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

	// pageMode now derives from the route, not local state:
	// /admin/users            -> list
	// /admin/users/create     -> create
	// /admin/users/:id        -> view (this is now also where editing happens —
	//                            EditableCard toggles its own display/edit UI,
	//                            there is no separate "/edit" route anymore)
	const isCreateRoute = Boolean(useMatch("/admin/users/create"));
	const location = useLocation();

	const pageMode: UserPageMode = isCreateRoute
		? "create"
		: userId
			? "view"
			: "list";

	const startInEditMode =
		pageMode === "view" &&
		Boolean((location.state as { openEdit?: boolean } | null)?.openEdit);

	const userDetailQuery = useUserDetailQuery(
		pageMode === "view" ? userId : undefined,
	);

	const usersQuery = useQuery({
		queryKey: userKeys.list("all", debouncedSearch),
		queryFn: ({ signal }) =>
			userApi.getUsers({
				search: debouncedSearch,
				signal,
			}),

		enabled: pageMode === "list",
		...USER_QUERY_OPTIONS,
	});
	const users = Array.isArray(usersQuery.data) ? usersQuery.data : [];

	const selectedUser: User | null =
		userDetailQuery.data ??
		(userId ? (users.find((user) => user.id === userId) ?? null) : null);

	const invalidateUsers = async () => {
		await queryClient.invalidateQueries({ queryKey: userKeys.all });
	};

	const createMutation = useMutation({
		mutationFn: userApi.createUser,
		onSuccess: invalidateUsers,
	});

	const updateMutation = useMutation({
		mutationFn: userApi.updateUser,
		onSuccess: async (_data, variables) => {
			await invalidateUsers();
			await queryClient.invalidateQueries({
				queryKey: userKeys.detail(variables.userId),
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: userApi.deleteUser,
		onSuccess: async (_data, variables) => {
			setSelectedRowIds((current) =>
				current.filter((id) => id !== variables.userId),
			);
			if (userId === variables.userId) {
				navigate("/admin/users");
			}
			await invalidateUsers();
			showSuccessToast(showToast, "User deleted successfully.");
		},
		onError: (error) => {
			showApiErrorToast(showToast, error, "Failed to delete user.");
		},
	});

	const statusMutation = useMutation({
		mutationFn: userApi.updateUserStatus,
		onSuccess: async (response, variables) => {
			await invalidateUsers();
			await queryClient.invalidateQueries({
				queryKey: userKeys.detail(variables.userId),
			});
			showSuccessToast(
				showToast,
				response?.message ?? "User status updated successfully.",
			);
		},
		onError: (error) => {
			showApiErrorToast(showToast, error, "Failed to update user status.");
		},
	});

	const counts = useMemo(() => getUserCounts(users), [users]);

	// const roleOptions = useMemo(() => getRoleOptions(users), [users]);
	// const filteredUsers = useMemo(
	// 	() => filterUsers({ users, activeTab, search, role }),
	// 	[activeTab, role, search, users],
	// );
	const filteredUsers = useMemo(
		() => filterUsers({ users, activeTab, search, userType }),
		[activeTab, search, userType, users],
	);

	const handleTabChange = (tab: UserStatusTab) => {
		setActiveTab(tab);
		setSelectedRowIds([]);
	};

	// const handleRoleChange = (option: UserRoleOption | null) => {
	// 	setRole(option);
	// 	setSelectedRowIds([]);
	// };

	const handleUserTypeChange = (option: UserTypeOption | null) => {
		setUserType(option);
		setSelectedRowIds([]);
	};

	const handleCreateUser = async (payload: CreateUserInput) => {
		return createMutation.mutateAsync(payload);
	};

	const handleUpdateUser = async (variables: UpdateUserVariables) => {
		return updateMutation.mutateAsync(variables);
	};

	const handleDeleteUser = async (id: string) => {
		await deleteMutation.mutateAsync({ userId: id });
	};

	const handleStatusChange = async (variables: UpdateUserStatusVariables) =>
		statusMutation.mutateAsync(variables);

	// Single-row block/unblock, used from the row action menu.
	const handleToggleBlockUser = async (user: User) => {
		const nextStatus: UserStatus =
			user.status === "Blocked" ? "Active" : "Blocked";
		await handleStatusChange({ userId: user.id, status: nextStatus });
	};

	// Bulk actions for the multiselect toolbar menu.
	const handleBulkStatusChange = async (status: UserStatus) => {
		if (selectedRowIds.length === 0) return;
		try {
			await Promise.all(
				selectedRowIds.map((id) =>
					statusMutation.mutateAsync({ userId: id, status }),
				),
			);
			setSelectedRowIds([]);
			showSuccessToast(showToast, `Selected users updated to ${status}.`);
		} catch (error) {
			showApiErrorToast(showToast, error, "Failed to update selected users.");
		}
	};

	const handleBulkDelete = async () => {
		if (selectedRowIds.length === 0) return;
		try {
			await Promise.all(
				selectedRowIds.map((id) => deleteMutation.mutateAsync({ userId: id })),
			);
			setSelectedRowIds([]);
		} catch (error) {
			showApiErrorToast(showToast, error, "Failed to delete selected users.");
		}
	};

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

	// Live validation for one Basic Info field (inputs that validate onChange).
	// Sets the field's Zod message, or clears it once valid — which also clears
	// a stale submit/server error (e.g. duplicate phone) as soon as the user
	// edits the value.
	const validateUserField = (field: UserBasicInfoField, value: unknown) => {
		const message = validateUserBasicField(
			field,
			value,
			pageMode === "create" ? "create" : "edit",
		);

		setFieldErrors((current) => {
			if (message) {
				return current[field] === message
					? current
					: { ...current, [field]: message };
			}

			if (!current[field]) return current;

			const next = { ...current };
			delete next[field];
			return next;
		});
	};

	// Route-driven navigation. Adjust the "/admin/users" prefix if
	// AdminRoutes is mounted at a different base path.
	const handleStartCreate = () => {
		setForm({ ...EMPTY_USER_FORM });
		setFormError(null);
		setFieldErrors({});
		setSelectedRowIds([]);
		navigate("/admin/users/create");
	};
	const handleStartEdit = (user: User) =>
		navigate(`/admin/users/${user.id}`, { state: { openEdit: true } });
	const handleStartView = (user: User) => navigate(`/admin/users/${user.id}`);
	const handleCancelForm = () => navigate("/admin/users");

	// Populate/reset the form whenever the route (and thus pageMode /
	// selectedUser) changes, instead of doing it inside click handlers.
	useEffect(() => {
		if (pageMode === "create") {
			setForm({ ...EMPTY_USER_FORM });
			setFormError(null);
			setFieldErrors({});
		}

		if (pageMode === "view" && selectedUser) {
			setForm(mapUserToForm(selectedUser));
			setFormError(null);
			setFieldErrors({});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageMode, selectedUser?.id]);

	const handleSubmitUser = async (
		overrideValues?: UserFormValues,
		section: FormSection = "basic",
	) => {
		const draftValues = overrideValues ?? form;

		const values: UserFormValues = {
			...draftValues,
			workspaceId: workspaceId ?? draftValues.workspaceId,
		};

		const nextFieldErrors: FormFieldErrors = validateUserSection(
			section,
			values,
			pageMode === "create" ? "create" : "edit",
		);

		if (Object.keys(nextFieldErrors).length > 0) {
			setFieldErrors((current) => ({
				...clearSectionFieldErrors(current, section),
				...nextFieldErrors,
			}));
			setFormError(null);
			showToast({
				type: "error",
				title:
					pageMode === "view"
						? section === "basic"
							? "Can't save changes"
							: "Can't save organization details"
						: "Can't create user",
				description: "Please fix the highlighted fields and try again.",
			});
			return false;
		}

		setFieldErrors((current) => clearSectionFieldErrors(current, section));
		setFormError(null);

		try {
			let response;

			if (pageMode === "view" && selectedUser) {
				response = await handleUpdateUser({
					userId: selectedUser.id,
					payload: values,
				});
			} else {
				response = await handleCreateUser(values);
			}

			showSuccessToast(
				showToast,
				response?.message ??
					(pageMode === "view"
						? section === "basic"
							? "User updated successfully."
							: "Organization details updated successfully."
						: "User created successfully."),
			);

			if (pageMode === "create") {
				const newUserId = extractCreatedUserId(response);
				if (newUserId) {
					navigate(`/admin/users/${newUserId}`);
				} else {
					handleCancelForm();
				}
			}

			return true;
		} catch (error) {
			const fallbackMessage =
				pageMode === "view"
					? section === "basic"
						? "Failed to update user."
						: "Failed to update organization details."
					: "Failed to create user.";

			showApiErrorToast(showToast, error, fallbackMessage);

			const serverMessage = getApiErrorMessage(error, fallbackMessage);
			const duplicateField = DUPLICATE_FIELD_HINTS.find(({ pattern }) =>
				pattern.test(serverMessage),
			);

			if (duplicateField) {
				setFieldErrors((current) => ({
					...current,
					[duplicateField.field]: serverMessage,
				}));
			}

			return false;
		}
	};

	return {
		users,
		filteredUsers,
		counts,
		activeTab,
		search,
		// roleOptions,
		// handleRoleChange,
		// role,
		userType,
		handleUserTypeChange,
		selectedRowIds,
		selectedUser,
		pageMode,
		startInEditMode,
		form,
		formError,
		fieldErrors,
		isLoading: usersQuery.isLoading,
		isFetching: usersQuery.isFetching,
		isLoadingSelectedUser: userDetailQuery.isLoading,
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
		handleTabChange,
		handleCreateUser,
		handleUpdateUser,
		handleDeleteUser,
		handleStatusChange,
		handleToggleBlockUser,
		handleBulkStatusChange,
		handleBulkDelete,
		handleFormChange,
		validateUserField,
		handleStartCreate,
		handleStartEdit,
		handleStartView,
		handleCancelForm,
		handleSubmitUser,
		refetchUsers: usersQuery.refetch,
	};
}

export type UsersController = ReturnType<typeof useUsersData>;
