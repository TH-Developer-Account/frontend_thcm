import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

const UsersPage = lazy(() => import("../modules/admin/users/UsersPage"));
const UserProfilePage = lazy(() =>
	import("../modules/admin/user-profile/UserProfilePage").then((m) => ({
		default: m.UserProfilePage,
	})),
);
const ProfileFormPage = lazy(() =>
	import("../modules/admin/user-profile/components/ProfileFormPage").then(
		(m) => ({ default: m.ProfileFormPage }),
	),
);
const ByDesignPage = lazy(() => import("../modules/admin/FetchUsers/ByDesign"));
const C4CPage = lazy(() => import("../modules/admin/FetchUsers/C4C"));
const UserProfile = lazy(
	() => import("../modules/settings/UserProfile/UserProfile"),
);
const MastersPage = lazy(() => import("../modules/admin/Masters/MastersPage"));
const BusinessPartners = lazy(
	() => import("../modules/admin/business-partners/BusinessPartners"),
);
const BusinessPartnerView = lazy(
	() => import("../modules/admin/business-partners/BusinessPartnerView"),
);

export default function AdminRoutes() {
	return (
		<Suspense fallback={<FullScreenLoader />}>
			<Routes>
				<Route path="users" element={<UsersPage />} />
				<Route
					path="masters"
					element={
						<div className="overflow-y-auto scrollbar-sleek">
							<MastersPage />
						</div>
					}
				/>

				<Route path="business-partners" element={<BusinessPartners />} />
				<Route
					path="business-partners-view"
					element={<BusinessPartnerView />}
				/>
				<Route path="bydesign" element={<ByDesignPage />} />
				<Route path="c4c" element={<C4CPage />} />
				<Route path="/profile" element={<UserProfile />} />
				<Route path="/profiles/create" element={<ProfileFormPage />} />
				<Route path="/profiles/:id/edit" element={<ProfileFormPage />} />
				<Route path="user_profiles" element={<UserProfilePage />} />
			</Routes>
		</Suspense>
	);
}
