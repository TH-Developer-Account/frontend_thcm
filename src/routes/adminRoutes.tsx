import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import CrfForm from "../modules/marketing/pages/CRFScreen/CrfForm";
import EPCTable from "../modules/marketing/pages/EPCTable/EPCListing/index";
import UsersPage from "../modules/admin/pages/UserPage";
import { UserProfilePage } from "../modules/admin/user-profile/UserProfilePage";
import { ThemeProvider } from "../providers/ThemeContext";
import Departments from "../modules/admin/pages/Departments";
// import BusinessProfileList from "../modules/admin/pages/BusinessProfileList";

export default function AdminRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="users" element={<UsersPage />} />
			<Route path="department" element={<Departments />} />
			<Route path="roles" element={<CrfForm />} />
			<Route path="branches" element={<EPCTable />} />

			<Route
				path="user_profiles"
				element={
					<ThemeProvider>
						<UserProfilePage />
					</ThemeProvider>
				}
			/>

			{/* <Route path="create_user_profile" element={<BusinessProfileList />} /> */}
		</Routes>
	);
}
