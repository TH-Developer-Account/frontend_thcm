import UserAddressCard from "../UserAddressCard";
import UserInfoCard from "../UserInfoCard";
import UserMetaCard from "../UserMetaCard";

export default function UserProfile() {
	return (
		<div className="profile-page">
			<h2 className="profile-page-title">Profile</h2>

			<div className="profile-page-sections">
				<UserMetaCard userRole="ADMIN" />
				<UserInfoCard userRole="ADMIN" />
				<UserAddressCard userRole="ADMIN" />
			</div>
		</div>
	);
}
