import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { CreateUserForm } from "./CreateUserForm";

import { UserTable } from "./UserTable";
import { useUsersData } from "./useUsersData";

const PAGE_TITLES: Record<string, string> = {
	list: "User Management",
	create: "Create User",
	view: "User Details",
};

export default function UsersPage() {
	const usersController = useUsersData();
	const { pageMode, selectedUser } = usersController;

	const breadcrumbs =
		pageMode === "list"
			? [{ label: "Home Screen", href: "/" }, { label: "User Management" }]
			: [
					{ label: "Home Screen", href: "/" },
					{ label: "User Management", href: "/admin/users" },
					{ label: PAGE_TITLES[pageMode] },
				];

	return (
		<PageSectionLayout as="div">
			<PageHeader
				headerText={PAGE_TITLES[pageMode]}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "User Management page location",
					breadcrumbs,
					separator: "›",
				}}
			/>

			{pageMode === "list" ? (
				<UserTable controller={usersController} />
			) : (
				<CreateUserForm
					key={`${pageMode}-${selectedUser?.id ?? "new"}`}
					controller={usersController}
				/>
			)}
		</PageSectionLayout>
	);
}
