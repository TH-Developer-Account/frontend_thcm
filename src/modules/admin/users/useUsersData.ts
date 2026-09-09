import { useMatch, useNavigate, useParams } from "react-router-dom";
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
	UserRoleOption,
	UserStatus,
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

import { useAuth, useToast } from "../../../context/Auth/AuthContext";
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

// NOTE: workspaceId intentionally excluded — it's no longer user-entered.
// It's sourced from useAuth() at submit time (see handleSubmitUser) since
// there's no input field for it anywhere in CreateUserForm.
const REQUIRED_USER_FIELDS: Array<keyof UserFormValues> = [
	"firstName",
	"lastName",
	"phoneNumber",
	"email",
	"employeeCode",
];

const REQUIRED_FIELD_MESSAGE = "This field is required.";

type FormFieldErrors = Partial<Record<UserFormField, string>>;

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
	const [role, setRole] = useState<UserRoleOption | null>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
	const [form, setForm] = useState<UserFormValues>(EMPTY_USER_FORM);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

	// pageMode now derives from the route, not local state:
	// /admin/users            -> list
	// /admin/users/create     -> create
	// /admin/users/:id        -> view
	// /admin/users/:id/edit   -> edit
	const isCreateRoute = Boolean(useMatch("/admin/users/create"));
	const isEditRoute = Boolean(useMatch("/admin/users/:id/edit"));

	// drop the useLocation import/usage — no longer needed for this
	const pageMode: UserPageMode = isCreateRoute
		? "create"
		: isEditRoute
			? "edit"
			: userId
				? "view"
				: "list";

	// Fetches the routed user for view/edit. Falls back to the already-loaded
	// list row (if present) while the detail request is in flight, so
	// navigating from the table doesn't show a blank form/panel.
	const userDetailQuery = useUserDetailQuery(
		pageMode === "view" || pageMode === "edit" ? userId : undefined,
	);

	const usersQuery = useQuery({
		queryKey: userKeys.list("all"),
		queryFn: userApi.getUsers,
		...USER_QUERY_OPTIONS,
	});

	const users = usersQuery.data ?? [];

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
		navigate(`/admin/users/${user.id}/edit`);
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

		if (pageMode === "edit" && selectedUser) {
			setForm(mapUserToForm(selectedUser));
			setFormError(null);
			setFieldErrors({});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pageMode, selectedUser?.id]);

	// Takes the values to validate explicitly rather than reading `form`
	// from closure — callers that just updated form state via setState
	// would otherwise validate against the *previous* render's values.
	const validateForm = (values: UserFormValues): FormFieldErrors => {
		const nextFieldErrors: FormFieldErrors = {};

		REQUIRED_USER_FIELDS.forEach((field) => {
			const value = values[field];
			if (typeof value === "string" && value.trim().length === 0) {
				nextFieldErrors[field] = REQUIRED_FIELD_MESSAGE;
			}
		});

		if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
			nextFieldErrors.email = "Enter a valid email address.";
		}

		return nextFieldErrors;
	};

	// `overrideValues` lets callers (EditableCard's onSubmit) pass the just-
	// edited draft directly, instead of relying on `form` state having
	// already committed — fixes edit-save silently no-op'ing because it
	// validated/submitted the previous render's stale form.
	const handleSubmitUser = async (overrideValues?: UserFormValues) => {
		const draftValues = overrideValues ?? form;

		// workspaceId is never user-entered — inject the signed-in admin's
		// workspace here rather than requiring/validating a field that has
		// no corresponding input anywhere in the form.
		const values: UserFormValues = {
			...draftValues,
			workspaceId: workspaceId ?? draftValues.workspaceId,
		};

		const nextFieldErrors = validateForm(values);

		if (Object.keys(nextFieldErrors).length > 0) {
			setFieldErrors(nextFieldErrors);
			setFormError(null);
			return false;
		}

		setFieldErrors({});
		setFormError(null);

		try {
			let response;

			if (pageMode === "edit" && selectedUser) {
				const { password, ...rest } = values;
				response = await handleUpdateUser({
					userId: selectedUser.id,
					payload: password?.trim() ? values : rest,
				});
			} else {
				response = await handleCreateUser(values);
			}

			showSuccessToast(
				showToast,
				response?.message ??
					(pageMode === "edit"
						? "User updated successfully."
						: "User created successfully."),
			);

			// On create, don't bounce back to the list — move into edit mode for
			// the just-created user so the Organization Details card becomes
			// available as a second step. Falls back to the list if the API
			// response didn't include an id to route to.
			if (pageMode === "create") {
				const newUserId = extractCreatedUserId(response);
				if (newUserId) {
					navigate(`/admin/users/${newUserId}/edit`);
				} else {
					handleCancelForm();
				}
			} else {
				handleCancelForm();
			}

			return true;
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				pageMode === "edit"
					? "Failed to update user."
					: "Failed to create user.",
			);
			return false;
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
		handleRoleChange,
		handleCreateUser,
		handleUpdateUser,
		handleDeleteUser,
		handleStatusChange,
		handleToggleBlockUser,
		handleBulkStatusChange,
		handleBulkDelete,
		handleFormChange,
		handleStartCreate,
		handleStartEdit,
		handleStartView,
		handleCancelForm,
		handleSubmitUser,
		refetchUsers: usersQuery.refetch,
	};
}

export type UsersController = ReturnType<typeof useUsersData>;
