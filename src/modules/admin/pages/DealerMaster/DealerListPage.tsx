import React, { useMemo, useState } from "react";
// import { statusStyles } from "../../../../utils/types";
// import { useUsers } from "./DealerHooks";
import { dealers } from "../../mockUsers";
import { DealerTable } from "./DealerTable";
import { PageLocationStepper } from "../../../../components/ui/PageLocationStepper";

export default function DealerListPage() {
	// const { data, loading, error } = useUsers();
	const [activeTab] = useState("All");
	const [search] = useState("");

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
			<PageLocationStepper
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
