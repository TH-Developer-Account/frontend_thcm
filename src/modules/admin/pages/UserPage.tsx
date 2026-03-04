import { useMemo, useState } from "react";
import { mockUsers } from "../mockUsers";
import { UserTableLayout } from "./UserTableLayout";
import { PageHeader } from "../../../components/ui/PageHeader";

export default function UsersPage() {
	const [activeTab, setActiveTab] = useState("All");
	const [search, setSearch] = useState("");

	// Filtered Data
	const filteredUsers = useMemo(() => {
		return mockUsers
			.filter((user) =>
				activeTab === "All" ? true : user.status === activeTab,
			)
			.filter((user) => user.name.toLowerCase().includes(search.toLowerCase()));
	}, [activeTab, search]);

	// Counts
	const counts = useMemo(() => {
		return {
			All: mockUsers.length,
			Active: mockUsers.filter((u) => u.status === "Active").length,
			Inactive: mockUsers.filter((u) => u.status === "Inactive").length,
			Blocked: mockUsers.filter((u) => u.status === "Blocked").length,
		};
	}, []);

	return (
		<>
			<PageHeader
				title="List"
				breadcrumbs={[
					{ label: "Dashboard", href: "/admin/dashboard" },
					{ label: "User", href: "/admin/users" },
					{ label: "List", href: "/admin/users" },
				]}
			/>
			<UserTableLayout
				users={filteredUsers}
				activeTab={activeTab}
				counts={counts}
				search={search}
				onTabChange={setActiveTab}
				onSearch={setSearch}
			/>
		</>
	);
}
