import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { CreateUserForm } from "./CreateUserForm";

import { UserTable } from "./UserTable";
import { useUsersData } from "./useUsersData";

export default function UsersPage() {
	const usersController = useUsersData();

	return (
		<PageSectionLayout as="div">
			<PageHeader
				headerText="User Management"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "User Management page location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "User Management" },
					],
					separator: "›",
				}}
			/>

			{usersController.pageMode === "list" ? (
				<UserTable controller={usersController} />
			) : (
				<CreateUserForm controller={usersController} />
			)}
		</PageSectionLayout>
	);
}
