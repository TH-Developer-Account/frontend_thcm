import { Routes, Route } from "react-router-dom";
// import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import CrfForm from "../modules/marketing/pages/CRFScreen/CrfForm";
import UsersPage from "../modules/admin/pages/BusinessUsersMaster/UserPage";
import { UserProfilePage } from "../modules/admin/user-profile/UserProfilePage";
import { ProfileFormPage } from "../modules/admin/user-profile/components/ProfileFormPage";
import { ThemeProvider } from "../providers/ThemeContext";
// import Departments from "../modules/admin/pages/BusinessUsersMaster/Departments";
import ByDesignPage from "../modules/admin/pages/FetchUsers/ByDesign";
import C4CPage from "../modules/admin/pages/FetchUsers/C4C";
// import DealerListPage from "../modules/admin/pages/DealerMaster/DealerListPage";
import UserProfile from "../components/ui/UserProfile/UserProfile";
import ComingSoon from "../components/ui/ComingSoon";
// import BranchesList from "../modules/admin/pages/Masters/BranchesList";
import MastersPage from "../modules/admin/pages/Masters/MastersPage";
import BusinessPartners from "../modules/admin/business-partners/BusinessPartners";
import BusinessPartnerView from "../modules/admin/business-partners/BusinessPartnerView";
import WorkflowPage from "../modules/admin/workflow/WorkflowPage";
import WorkflowCreatePage from "../modules/admin/workflow/WorkFlowCreation/WorkflowCreatePage";

export default function AdminRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<ComingSoon />} />
			<Route path="users" element={<UsersPage />} />
			<Route path="department" element={<ComingSoon />} />
			<Route path="roles" element={<CrfForm />} />
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
			<Route
				path="/profiles/create"
				element={
					<ThemeProvider>
						<ProfileFormPage />
					</ThemeProvider>
				}
			/>
			<Route
				path="/profiles/:id/edit"
				element={
					<ThemeProvider>
						<ProfileFormPage />
					</ThemeProvider>
				}
			/>
			<Route
				path="user_profiles"
				element={
					<ThemeProvider>
						<UserProfilePage />
					</ThemeProvider>
				}
			/>
			<Route
				path="dealers"
				element={
					<ThemeProvider>
						<ComingSoon />
					</ThemeProvider>
				}
			/>
			<Route
				path="workflows"
				element={
					<ThemeProvider>
						<WorkflowPage />
					</ThemeProvider>
				}
			/>
			<Route
				path="/create-workflows"
				element={
					<ThemeProvider>
						<WorkflowCreatePage />
					</ThemeProvider>
				}
			/>
			<Route
				path="edit-workflows/:id"
				element={
					<ThemeProvider>
						<WorkflowCreatePage />
					</ThemeProvider>
				}
			/>
		</Routes>
	);
}
