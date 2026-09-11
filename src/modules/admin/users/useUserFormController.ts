import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
	CreateUserInput,
	UpdateUserVariables,
	User,
	UserFormField,
	UserFormValues,
	UserMutationResult,
	UserPageMode,
} from "./user-management.types";
import {
	EMPTY_USER_FORM,
	mapUserToForm,
	stripEmptySensitiveFields,
	validateUserForm,
} from "./user-management.utils";
import type { UserFieldErrors } from "./user-management.utils";
import { userApi } from "./users.api";
import { userKeys } from "./user-management.queries";
import { useAuth, useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";

const extractCreatedUserId = (
	response: UserMutationResult | undefined,
): string | undefined => response?.data?.id ?? response?.user?.id;

/**
 * Owns only what CreateUserForm needs: form values, field errors,
 * create/update mutations, and submit/cancel. Knows nothing about the
 * table, filters, or bulk actions — the list hook doesn't import this.
 */
export function useUserFormController({
	pageMode,
	selectedUser,
}: {
	pageMode: UserPageMode;
	selectedUser: User | null;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { workspaceId } = useAuth();
	const [isNavPending, startNavTransition] = useTransition();

	// Lazy initializer — runs once per mount. Since UsersPage keys
	// CreateUserForm by `${pageMode}-${selectedUser?.id ?? "new"}`, a change
	// in either value already forces a fresh mount (and thus a fresh call to
	// this initializer), so there's no need for an effect to "catch up" form
	// state after the fact — that was doing synchronously in an effect what
	// the key-based remount already guarantees at initial render.
	const [form, setForm] = useState<UserFormValues>(() =>
		pageMode === "view" && selectedUser
			? mapUserToForm(selectedUser)
			: { ...EMPTY_USER_FORM },
	);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({});

	const invalidateUsers = async () => {
		await queryClient.invalidateQueries({ queryKey: userKeys.all });
	};

	const createMutation = useMutation({
		mutationFn: userApi.createUser,
		onSuccess: invalidateUsers,
	});

	const updateMutation = useMutation({
		mutationFn: userApi.updateUser,
		onSuccess: async (_data, variables: UpdateUserVariables) => {
			await invalidateUsers();
			await queryClient.invalidateQueries({
				queryKey: userKeys.detail(variables.userId),
			});
		},
	});

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
		setForm({ ...EMPTY_USER_FORM });
		setFormError(null);
		setFieldErrors({});
		navigate("/admin/users/create");
	};

	const handleCancelForm = () => navigate("/admin/users");

	const validateForm = (values: UserFormValues): UserFieldErrors =>
		validateUserForm(values, pageMode);

	// `overrideValues` lets callers (EditableCard's onSubmit) pass the just-
	// edited draft directly, instead of relying on `form` state having
	// already committed.
	const handleSubmitUser = async (overrideValues?: UserFormValues) => {
		const draftValues = overrideValues ?? form;

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
			let response: UserMutationResult | undefined;

			if (pageMode === "view" && selectedUser) {
				response = await updateMutation.mutateAsync({
					userId: selectedUser.id,
					payload: stripEmptySensitiveFields(values, ["password"]),
				});
			} else {
				response = await createMutation.mutateAsync(values as CreateUserInput);
			}

			// On create, hand off to a transition before navigating — keeps the
			// form/Save button showing a pending state through the route change
			// itself, not just through the mutation, so the success toast and
			// the actual page change land together rather than the toast firing
			// first and navigation silently lagging behind it.
			if (pageMode === "create") {
				const newUserId = extractCreatedUserId(response);
				showSuccessToast(
					showToast,
					response?.message ?? "User created successfully.",
				);
				startNavTransition(() => {
					if (newUserId) {
						navigate(`/admin/users/${newUserId}`);
					} else {
						handleCancelForm();
					}
				});
			} else {
				showSuccessToast(
					showToast,
					response?.message ?? "User updated successfully.",
				);
			}

			return true;
		} catch (error) {
			showApiErrorToast(
				showToast,
				error,
				pageMode === "view"
					? "Failed to update user."
					: "Failed to create user.",
			);
			return false;
		}
	};

	return {
		form,
		formError,
		fieldErrors,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isNavPending,
		handleFormChange,
		handleStartCreate,
		handleCancelForm,
		handleSubmitUser,
	};
}

export type UserFormController = ReturnType<typeof useUserFormController>;
