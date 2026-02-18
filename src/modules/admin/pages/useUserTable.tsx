// useUserTable.ts
import { useMemo, useState } from "react";
import { type User } from "../../../utils/types";

export function useUserTable(data: User[]) {
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
			Pending: data.filter((u) => u.status === "Pending").length,
			Banned: data.filter((u) => u.status === "Banned").length,
			Rejected: data.filter((u) => u.status === "Rejected").length,
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
