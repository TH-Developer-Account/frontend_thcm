import { useDeferredValue, useMemo, useOptimistic, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import type {
	User,
	UserRoleOption,
	UserStatus,
	UserStatusTab,
} from "./user-management.types";
import {
	filterUsers,
	getRoleOptions,
	getUserCounts,
} from "./user-management.utils";
import { userApi } from "./users.api";
import { userKeys, userQueries } from "./user-management.queries";
import { useBulkAction } from "../../../common/common.hooks";
import { useToast } from "../../../context/Auth/AuthContext";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";

const getErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : "Something went wrong.";

/**
 * Owns everything the table/list view needs: fetch, filter, search, tab,
 * role filter, row selection, and bulk/single status+delete actions.
 * Deliberately knows nothing about the create/edit form — CreateUserForm
 * never imports this hook, so typing in a form field can't re-render the
 * table and vice versa.
 */
export function useUsersListData() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	// Tab + search live in the URL, not local state, so the list view is
	// shareable/bookmarkable/refresh-safe (matches the "Routing & URL
	// state" convention — filters/sort/pagination belong in search params).
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = (searchParams.get("tab") as UserStatusTab) ?? "All";
	const search = searchParams.get("q") ?? "";

	// Deferred so filtering a large table doesn't block keystrokes in the
	// search input — the input stays responsive, the table catches up a
	// beat later.
	const deferredSearch = useDeferredValue(search);
	const isSearchStale = search !== deferredSearch;

	const [role, setRole] = useState<UserRoleOption | null>(null);
	const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

	const bulkStatusAction = useBulkAction<string>();
	const bulkDeleteAction = useBulkAction<string>();

	const usersQuery = useQuery(userQueries.list());
	const users = usersQuery.data ?? [];

	// Optimistic status flips for single-row block/unblock — this is a
	// low-conflict-risk action (unlike e.g. medical-claim approvals, which
	// stay wait-for-confirmation per convention #8), so it's a good fit for
	// useOptimistic: badge flips immediately, reverts automatically if the
	// mutation rejects.
	const [optimisticUsers, applyOptimisticStatus] = useOptimistic(
		users,
		(state, patch: { userId: string; status: UserStatus }) =>
			state.map((user) =>
				user.id === patch.userId ? { ...user, status: patch.status } : user,
			),
	);

	const invalidateUsers = async () => {
		await queryClient.invalidateQueries({ queryKey: userKeys.all });
	};

	const deleteMutation = useMutation({
		mutationFn: userApi.deleteUser,
		onSuccess: async (_data, variables) => {
			setSelectedRowIds((current) =>
				current.filter((id) => id !== variables.userId),
			);
			await invalidateUsers();
		},
		onError: (error) => {
			showApiErrorToast(showToast, error, "Failed to delete user.");
		},
	});

	const statusMutation = useMutation({
		mutationFn: userApi.updateUserStatus,
		onSuccess: async (_response, variables) => {
			await invalidateUsers();
			await queryClient.invalidateQueries({
				queryKey: userKeys.detail(variables.userId),
			});
		},
		onError: (error) => {
			showApiErrorToast(showToast, error, "Failed to update user status.");
		},
	});

	const counts = useMemo(() => getUserCounts(users), [users]);
	const roleOptions = useMemo(() => getRoleOptions(users), [users]);
	const filteredUsers = useMemo(
		() =>
			filterUsers({
				users: optimisticUsers,
				activeTab,
				search: deferredSearch,
				role,
			}),
		[activeTab, role, deferredSearch, optimisticUsers],
	);

	const handleTabChange = (tab: UserStatusTab) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("tab", tab);
			return next;
		});
		setSelectedRowIds([]); // selection is transient UI state — stays local
	};

	const setSearch = (value: string) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				if (value) {
					next.set("q", value);
				} else {
					next.delete("q");
				}
				return next;
			},
			{ replace: true }, // don't spam history on every keystroke
		);
	};

	const handleRoleChange = (option: UserRoleOption | null) => {
		setRole(option);
		setSelectedRowIds([]);
	};

	const handleDeleteUser = async (id: string) => {
		await deleteMutation.mutateAsync({ userId: id });
		showSuccessToast(showToast, "User deleted successfully.");
	};

	// Single-row block/unblock, used from the row action menu. Flips the
	// badge optimistically; useOptimistic reverts it on its own if the
	// mutation throws.
	const handleToggleBlockUser = async (user: User) => {
		const nextStatus: UserStatus =
			user.status === "Blocked" ? "Active" : "Blocked";

		applyOptimisticStatus({ userId: user.id, status: nextStatus });

		try {
			const response = await statusMutation.mutateAsync({
				userId: user.id,
				status: nextStatus,
			});
			showSuccessToast(
				showToast,
				response?.message ?? "User status updated successfully.",
			);
		} catch {
			// error toast already shown by statusMutation.onError;
			// optimisticUsers reverts automatically once `users` refetches.
		}
	};

	const handleBulkStatusChange = async (status: UserStatus) => {
		if (selectedRowIds.length === 0) return;

		const { succeeded, failed } = await bulkStatusAction.run(
			selectedRowIds,
			(id) => statusMutation.mutateAsync({ userId: id, status }),
		);

		setSelectedRowIds(failed.map(({ item }) => item));

		if (succeeded.length > 0) {
			showSuccessToast(
				showToast,
				failed.length === 0
					? `${succeeded.length} user(s) updated to ${status}.`
					: `${succeeded.length} updated, ${failed.length} failed — still selected for retry.`,
			);
		}

		if (succeeded.length === 0 && failed.length > 0) {
			showApiErrorToast(
				showToast,
				failed[0].error,
				`Failed to update ${failed.length} selected user(s).`,
			);
		}
	};

	const handleBulkDelete = async () => {
		if (selectedRowIds.length === 0) return;

		const { succeeded, failed } = await bulkDeleteAction.run(
			selectedRowIds,
			(id) => deleteMutation.mutateAsync({ userId: id }),
		);

		setSelectedRowIds(failed.map(({ item }) => item));

		if (succeeded.length > 0) {
			showSuccessToast(
				showToast,
				failed.length === 0
					? `${succeeded.length} user(s) deleted.`
					: `${succeeded.length} deleted, ${failed.length} failed — still selected for retry.`,
			);
		}

		if (succeeded.length === 0 && failed.length > 0) {
			showApiErrorToast(
				showToast,
				failed[0].error,
				`Failed to delete ${failed.length} selected user(s).`,
			);
		}
	};

	return {
		users: optimisticUsers,
		filteredUsers,
		counts,
		roleOptions,
		activeTab,
		search,
		isSearchStale,
		role,
		selectedRowIds,
		isLoading: usersQuery.isLoading,
		isFetching: usersQuery.isFetching,
		error: usersQuery.error ? getErrorMessage(usersQuery.error) : null,
		mutationError: deleteMutation.error ?? statusMutation.error,
		isDeleting: deleteMutation.isPending,
		isChangingStatus: statusMutation.isPending,
		setSearch,
		setSelectedRowIds,
		handleTabChange,
		handleRoleChange,
		handleDeleteUser,
		handleToggleBlockUser,
		handleBulkStatusChange,
		handleBulkDelete,
		refetchUsers: usersQuery.refetch,
	};
}

export type UsersListController = ReturnType<typeof useUsersListData>;
