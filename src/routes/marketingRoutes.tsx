import { Routes, Route } from "react-router-dom";
import { DashboardPage } from "../modules/marketing/pages/Dashboard/DashboardPage";
import EPCList from "../modules/marketing/pages/EPCTable/EPCListing";
import UserProfile from "../components/ui/UserProfile/UserProfile";
import UsersPage from "../modules/admin/pages/BusinessUsersMaster/UserPage";
import ActivityPlannerPage from "../modules/marketing/pages/ActivityPlannerView/pages/ActivityPlannerPage";
import LeadsTablePage from "../modules/marketing/pages/LeadScreen/LeadsTable/LeadsTablePage";
import LeadCreatePage from "../modules/marketing/pages/LeadScreen/LeadsCreate/LeadCreatePage";

export default function MarketingRoutes() {
	return (
		<Routes>
			<Route path="dashboard" element={<DashboardPage />} />
			<Route path="listing" element={<EPCList />} />
			<Route path="/leads" element={<LeadsTablePage />} />
			<Route path="/leads/create" element={<LeadCreatePage />} />
			{/* <Route path="/leads/:leadId" element={<LeadViewPage />} /> */}
			<Route
				path="/marketing/leads/:leadId/edit"
				element={<LeadCreatePage />}
			/>
			<Route path="/profile" element={<UserProfile />} />
			<Route
				path="/activity-planner/create"
				element={<ActivityPlannerPage />}
			/>

			<Route path="/activity-planner/:id" element={<ActivityPlannerPage />} />
			<Route path="epf/:id" element={<ActivityPlannerPage />} />
			<Route path="/admin/users" element={<UsersPage />} />
		</Routes>
	);
}
