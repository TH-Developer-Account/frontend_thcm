import UserAddressCard from "../UserAddressCard";
import UserInfoCard from "../UserInfoCard";
import UserMetaCard from "../UserMetaCard";

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
