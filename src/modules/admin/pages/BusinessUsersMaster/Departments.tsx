import { useMemo, useState } from "react";
import { mockUsers } from "../../mockUsers";
import { UserTableLayout } from "./UserTableLayout";
import { PageLocationStepper } from "../../../../components/ui/PageLocationStepper";

export default function Departments() {
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
			<PageLocationStepper
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
