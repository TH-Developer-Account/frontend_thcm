import React from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import UsersPage from "./UserPage";
import { UserTableTabs } from "./UserTableTabs";
import type { UserProfileTableRow } from "../types";

interface Props {
	users: UserProfileTableRow[];
	activeTab: string | "All";
	counts: Record<string, number>;
	search: string;
	onTabChange: (tab: string) => void;
	onSearch: (val: string) => void;
}
function BusinessProfileList({ activeTab, counts, onTabChange }: Props) {
	return (
		<React.Fragment>
			<PageHeader
				title="Business User Profiles"
				breadcrumbs={[
					{ label: "User", href: "/admin/create_user_profile" },
					{ label: "List", href: "/admin/user_profiles" },
				]}
			/>
			<UserTableTabs
				activeTab={activeTab}
				counts={counts}
				onChange={onTabChange}
			/>
			<UsersPage />
		</React.Fragment>
	);
}

export default BusinessProfileList;
