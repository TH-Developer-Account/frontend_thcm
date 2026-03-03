import React, { useMemo, useState } from "react";
// import { statusStyles } from "../../../../utils/types";
// import { useUsers } from "./DealerHooks";
import { dealers } from "../../mockUsers";
import { DealerTable } from "./DealerTable";
import { PageHeader } from "../../../../components/ui/PageHeader";

export default function DealerListPage() {
	// const { data, loading, error } = useUsers();
	const [activeTab, setActiveTab] = useState("All");
	const [search, setSearch] = useState("");

	// Filtered Data
	const filteredUsers = useMemo(() => {
		return dealers
			.filter((user) =>
				activeTab === "All" ? true : user.status === activeTab,
			)
			.filter((user) =>
				user.dealerName.toLowerCase().includes(search.toLowerCase()),
			);
	}, [activeTab, search]);

	return (
		<React.Fragment>
			<PageHeader
				title="List"
				breadcrumbs={[
					{ label: "Dashboard", href: "/admin/dashboard" },
					{ label: "Dealers", href: "/admin/dealers" },
					{ label: "List", href: "/admin/dealers" },
				]}
			/>
			<DealerTable dealer={filteredUsers} />
		</React.Fragment>
	);
}
