import {
	useLocation,
	useMatch,
	useNavigate,
	useParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import type { User, UserPageMode } from "./user-management.types";
import { userQueries } from "./user-management.queries";
import { useUsersListData } from "./useUsersListData";
import { useUserFormController } from "./useUserFormController";

/**
 * Composes the list, detail-fetch, and form controllers behind the same
 * public shape CreateUserForm/UserTable already consume, so neither needed
 * to change. New code should prefer importing useUsersListData /
 * useUserFormController directly for narrower re-render scope; this
 * composer exists for the shared UsersPage route wiring.
 */
export function useUsersData() {
	const navigate = useNavigate();
	const { id: userId } = useParams<{ id: string }>();
	const location = useLocation();

	// pageMode derives from the route, not local state:
	// /admin/users            -> list
	// /admin/users/create     -> create
	// /admin/users/:id        -> view (also where editing happens — EditableCard
	//                            toggles its own display/edit UI)
	const isCreateRoute = Boolean(useMatch("/admin/users/create"));
	const pageMode: UserPageMode = isCreateRoute
		? "create"
		: userId
			? "view"
			: "list";

	const startInEditMode =
		pageMode === "view" &&
		Boolean((location.state as { openEdit?: boolean } | null)?.openEdit);

	const listController = useUsersListData();

	const userDetailQuery = useQuery(
		userQueries.detail(pageMode === "view" ? userId : undefined),
	);

	const selectedUser: User | null =
		userDetailQuery.data ??
		(userId
			? (listController.users.find((user) => user.id === userId) ?? null)
			: null);

	const formController = useUserFormController({ pageMode, selectedUser });

	const handleStartEdit = (user: User) =>
		navigate(`/admin/users/${user.id}`, { state: { openEdit: true } });
	const handleStartView = (user: User) => navigate(`/admin/users/${user.id}`);

	return {
		...listController,
		...formController,
		selectedUser,
		pageMode,
		startInEditMode,
		isLoadingSelectedUser: userDetailQuery.isLoading,
		handleStartEdit,
		handleStartView,
	};
}

export type UsersController = ReturnType<typeof useUsersData>;
