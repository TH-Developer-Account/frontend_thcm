// import PageBreadcrumb from "../components/common/PageBreadCrumb";
// import UserMetaCard from "../components/UserProfile/UserMetaCard";
// import UserInfoCard from "../components/UserProfile/UserInfoCard";
// import UserAddressCard from "../components/UserProfile/UserAddressCard";
// import PageMeta from "../components/common/PageMeta";

import UserAddressCard from "../../components/ui/UserAddressCard";
import UserInfoCard from "../../components/ui/UserInfoCard";
import UserMetaCard from "../../components/ui/UserMetaCard";

export default function UserProfile() {
	return (
		<>
			<div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
				<h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7 text-left">
					Profile
				</h3>
				<div className="space-y-6">
					<UserMetaCard />
					<UserInfoCard userRole="ADMIN" />
					<UserAddressCard userRole="ADMIN" />
				</div>
			</div>
		</>
	);
}
