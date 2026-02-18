import { UserTableLayout } from "./UserTableLayout";
import { useUserTable } from "./useUserTable";

export const Test = () => {
	const { activeTab, setActiveTab, search, setSearch, filteredUsers, counts } =
		useUserTable(users);

	return (
		<div>
			<UserTableLayout
				users={filteredUsers}
				activeTab={activeTab}
				counts={counts}
				search={search}
				onTabChange={setActiveTab}
				onSearch={setSearch}
			/>
			;
		</div>
	);
};
