import { Routes, Route } from "react-router-dom";
import UsersPage from "../modules/admin/users/UsersPage";
import { UserProfilePage } from "../modules/admin/user-profile/UserProfilePage";
import { ProfileFormPage } from "../modules/admin/user-profile/components/ProfileFormPage";
import ByDesignPage from "../modules/admin/FetchUsers/ByDesign";
import C4CPage from "../modules/admin/FetchUsers/C4C";
import UserProfile from "../modules/settings/UserProfile/UserProfile";
import MastersPage from "../modules/admin/Masters/MastersPage";
import BusinessPartners from "../modules/admin/business-partners/BusinessPartners";
import BusinessPartnerView from "../modules/admin/business-partners/BusinessPartnerView";
import WorkflowPage from "../modules/admin/workflow/WorkflowPage";
import WorkflowCreatePage from "../modules/admin/workflow/WorkFlowCreation/WorkflowCreatePage";

export default function AdminRoutes() {
	return (
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
			<Route path="business-partners-view" element={<BusinessPartnerView />} />
			<Route path="bydesign" element={<ByDesignPage />} />
			<Route path="c4c" element={<C4CPage />} />
			<Route path="/profile" element={<UserProfile />} />
			<Route path="/profiles/create" element={<ProfileFormPage />} />
			<Route path="/profiles/:id/edit" element={<ProfileFormPage />} />
			<Route path="user_profiles" element={<UserProfilePage />} />
			<Route path="workflows" element={<WorkflowPage />} />
			<Route path="/create-workflows" element={<WorkflowCreatePage />} />
			<Route path="edit-workflows/:id" element={<WorkflowCreatePage />} />
		</Routes>
	);
}
