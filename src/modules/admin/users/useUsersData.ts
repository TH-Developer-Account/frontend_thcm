import { useEffect, useState } from "react";

import type { TableUser } from "../../../types/common.types";
import type { FetchUsers } from "./user-management.types";

type UseUsersDataOptions = {
	fallbackUsers: TableUser[];
	fetchUsers?: FetchUsers;
};

type UseUsersDataResult = {
	users: TableUser[];
	loading: boolean;
	error: string | null;
};

export function useUsersData({
	fallbackUsers,
	fetchUsers,
}: UseUsersDataOptions): UseUsersDataResult {
	const [users, setUsers] = useState<TableUser[]>(fallbackUsers);
	const [loading, setLoading] = useState(Boolean(fetchUsers));
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!fetchUsers) {
			setUsers(fallbackUsers);
			setLoading(false);
			setError(null);
			return;
		}

		const controller = new AbortController();

		const loadUsers = async () => {
			setLoading(true);
			setError(null);

			try {
				const apiUsers = await fetchUsers(controller.signal);
				if (!controller.signal.aborted) setUsers(apiUsers);
			} catch (requestError) {
				if (controller.signal.aborted) return;

				setError(
					requestError instanceof Error
						? requestError.message
						: "Unable to load users.",
				);
				// Keep the supplied static data visible during development/fallback.
				setUsers(fallbackUsers);
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		};

		void loadUsers();

		return () => controller.abort();
	}, [fallbackUsers, fetchUsers]);

	return { users, loading, error };
}
