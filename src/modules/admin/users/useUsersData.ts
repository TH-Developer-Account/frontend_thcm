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

// The two EditableCards in CreateUserForm (Basic Info / Organization
// Details) save independently — saving one must never validate or clear
// errors that belong to the other. Each card's `section` is validated
// against its own field list only. Every UserFormField the form has must
// be classified here or the "which required fields am I checking" logic
// below silently ignores it.
type FormSection = "basic" | "organization";

// NOTE: workspaceId intentionally excluded — it's no longer user-entered.
// It's sourced from useAuth() at submit time (see handleSubmitUser) since
// there's no input field for it anywhere in CreateUserForm.
const BASIC_INFO_REQUIRED_FIELDS: Array<keyof UserFormValues> = [
	"firstName",
	"lastName",
	"phoneNumber",
	"email",
	"employeeCode",
];

// These asterisked fields in CreateUserForm's Organization Details card
// were never actually enforced before (validateForm only ever checked the
// basic-info fields above, regardless of which card was being saved) —
// now that validation is scoped per section, they're real requirements.
// Every field in the Organization Details card happens to be required, so
// this list also doubles as "every field that belongs to that card" (see
// its use in CreateUserForm's saveSection).
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

// Every field that lives in the Basic Info card, for clearing/merging
// field errors scoped to that card, and for CreateUserForm's saveSection
// to know which fields to sync there. Keep this in sync with the fields
// CreateUserForm actually renders in basicInfoFields.
export const BASIC_INFO_FIELDS: Array<keyof UserFormValues> = [
	...BASIC_INFO_REQUIRED_FIELDS,
	"userType",
	"businessPartnerId",
	"grade",
	"joinedOn",
	"isActive",
];

const REQUIRED_FIELD_MESSAGE = "This field is required.";

// Matches the wording the backend now sends for a Prisma unique-constraint
// (P2002) violation — see toUniqueConstraintError() in user.controller.ts —
// so the specific input can be highlighted too, not just the toast. Backend
// wording and this list are meant to move together; if the backend message
// changes, update this.
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

// Drops every field-error key that belongs to `section`, leaving the
// other section's errors untouched — used both when a save succeeds
// (clear this card's errors) and when it fails (replace this card's
// errors with the freshly-validated ones) so the two cards never step on
// each other's error state.
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

	// Row actions like "Edit User" in the table still want to land the user
	// directly in edit mode rather than making them click Edit again once
	// the page loads. Since there's no dedicated route for that anymore, we
	// pass it as router state instead — see handleStartEdit below.
	const startInEditMode =
		pageMode === "view" &&
		Boolean((location.state as { openEdit?: boolean } | null)?.openEdit);

	// Fetches the routed user for view/edit. Falls back to the already-loaded
	// list row (if present) while the detail request is in flight, so
	// navigating from the table doesn't show a blank form/panel.
	const userDetailQuery = useUserDetailQuery(
		pageMode === "view" ? userId : undefined,
	);

	const usersQuery = useQuery({
		// Search wasn't being sent to the backend at all before — the table
		// was just filtering whatever page of default results had already
		// loaded, which is why some users never showed up in a search. Now
		// it's debounced and forwarded to userApi.getUsers, and part of the
		// query key so a new search term gets (and caches) its own result.
		queryKey: userKeys.list("all", debouncedSearch),
		queryFn: ({ signal }) =>
			userApi.getUsers({
				search: debouncedSearch,
				signal,
			}),
		// The create/edit page has no use for the full user list (it only
		// needs the single routed user, via userDetailQuery below) — this
		// was previously firing on every create/edit page load for no
		// reason. staleTime: Infinity above means any previously-cached
		// list page data (e.g. from visiting /admin/users first) is still
		// available for the selectedUser fallback below even while this is
		// disabled here.
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

	// Takes the values to validate explicitly rather than reading `form`
	// from closure — callers that just updated form state via setState
	// would otherwise validate against the *previous* render's values.
	// Only checks the fields that belong to `section` — the Basic Info and
	// Organization Details cards save independently, so saving one must
	// never fail because of the other card's required fields.
	const validateForm = (
		values: UserFormValues,
		section: FormSection,
	): FormFieldErrors => {
		const nextFieldErrors: FormFieldErrors = {};

		const requiredFields =
			section === "basic"
				? BASIC_INFO_REQUIRED_FIELDS
				: ORGANIZATION_REQUIRED_FIELDS;

		requiredFields.forEach((field) => {
			const value = values[field];
			if (typeof value === "string" && value.trim().length === 0) {
				nextFieldErrors[field] = REQUIRED_FIELD_MESSAGE;
			}
		});

		// The rest of these are all Basic Info card fields/rules — skip
		// them entirely when validating an Organization Details save.
		if (section === "basic") {
			if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
				nextFieldErrors.email = "Enter a valid email address.";
			}

			// Business Partner is only mandatory while creating a brand-new
			// user. An existing user should still be editable even if no BP
			// has been linked yet.
			if (pageMode === "create" && !values.businessPartnerId?.trim()) {
				nextFieldErrors.businessPartnerId = "Business partner is required.";
			}

			// Joined On isn't collected at creation time (see disablePast in
			// CreateUserForm), but is required once a user exists. This also
			// guarantees mapUserFormToUpdatePayload never has to decide what
			// an empty joinedOn means — prisma.user.update() throws on "" as
			// a DateTime, so this can't reach the API un-set.
			if (pageMode === "view" && !values.joinedOn?.trim()) {
				nextFieldErrors.joinedOn = "Joining date is required.";
			}
		}

		return nextFieldErrors;
	};

	// `overrideValues` lets callers (EditableCard's onSubmit) pass the just-
	// edited draft directly, instead of relying on `form` state having
	// already committed — fixes edit-save silently no-op'ing because it
	// validated/submitted the previous render's stale form.
	//
	// `section` identifies which of the two independent cards is being
	// saved (defaults to "basic" for create mode, where only that one card
	// exists). It scopes both validation and which field errors get
	// touched — see validateForm and clearSectionFieldErrors above.
	const handleSubmitUser = async (
		overrideValues?: UserFormValues,
		section: FormSection = "basic",
	) => {
		const draftValues = overrideValues ?? form;

		// workspaceId is never user-entered — inject the signed-in admin's
		// workspace here rather than requiring/validating a field that has
		// no corresponding input anywhere in the form.
		const values: UserFormValues = {
			...draftValues,
			workspaceId: workspaceId ?? draftValues.workspaceId,
		};

		const nextFieldErrors = validateForm(values, section);

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
				// Password isn't collected in the form anymore (see the
				// commented-out password field in CreateUserForm), and the
				// backend's updateUser destructures password out and ignores
				// it regardless. Kept the original password-aware branching
				// here, commented, in case a dedicated "reset password" flow
				// needs this shape later.
				// const { password, ...rest } = values;
				// response = await handleUpdateUser({
				// 	userId: selectedUser.id,
				// 	payload: password?.trim() ? values : rest,
				// });
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

			// On create, don't bounce back to the list — move straight into
			// viewing (which doubles as editing) the just-created user so the
			// Organization Details card becomes available as a second step.
			// Falls back to the list if the API response didn't include an id.
			//
			// On view (i.e. updating an existing user), stay put: the API
			// call already ran above, and EditableCard flips itself back to
			// display mode on a successful submit — there's no reason to
			// navigate away, and the other card (if it's also mid-edit)
			// should be left exactly as it was.
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

			// The backend now sends a specific message for a duplicate
			// email/employee code/etc. (e.g. "A user with this email address
			// already exists.") instead of the raw Prisma error — surface
			// that on the actual input too, not just the toast.
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
		handleStartCreate,
		handleStartEdit,
		handleStartView,
		handleCancelForm,
		handleSubmitUser,
		refetchUsers: usersQuery.refetch,
	};
}

export type UsersController = ReturnType<typeof useUsersData>;
