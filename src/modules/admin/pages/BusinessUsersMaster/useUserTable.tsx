// useUserTable.ts
import { useMemo, useState } from "react";
import { type TableUser } from "../../../../utils/types";

export function useUserTable(data: TableUser[]) {
	const [activeTab, setActiveTab] = useState("All");
	const [search, setSearch] = useState("");

	const filteredUsers = useMemo(() => {
		return data
			.filter((u) => (activeTab === "All" ? true : u.status === activeTab))
			.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));
	}, [data, activeTab, search]);

	const counts = useMemo(() => {
		return {
			All: data.length,
			Active: data.filter((u) => u.status === "Active").length,
			Inactive: data.filter((u) => u.status === "Inactive").length,
			Blocked: data.filter((u) => u.status === "Blocked").length,
		};
	}, [data]);

	return {
		activeTab,
		setActiveTab,
		search,
		setSearch,
		filteredUsers,
		counts,
	};
}
